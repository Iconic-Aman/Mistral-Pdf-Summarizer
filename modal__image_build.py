import modal
import os

app = modal.App("mistral-pdf-summarizer")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install([
        "torch==2.3.0",
        "transformers==4.44.0",
        "bitsandbytes==0.43.0",
        "accelerate==0.33.0",
        "peft",
        "trl==0.8.0",
        "pymupdf",
        "unsloth",
        "xformers==0.0.26.post1",
        "huggingface_hub",
        "sentencepiece",
        "protobuf",
        "fastapi[standard]",
    ]).env({
        "PYTHONIOENCODING": "utf-8",
        "UNSLOTH_VERSION_CHECK": "0"
    })
)

from dotenv import load_dotenv
load_dotenv(".env")

HF_MODEL_ID = os.getenv("HF_MODEL_ID")
HF_TOKEN = os.getenv("HF_TOKEN")


@app.cls(
    image=image,
    gpu="T4",
    timeout=600,
    scaledown_window=300,
    secrets=[modal.Secret.from_dict({
        "HF_TOKEN": HF_TOKEN,
        "HF_MODEL_ID": HF_MODEL_ID,
    })],
    volumes={"/model-cache": modal.Volume.from_name("model-cache", create_if_missing=True)},
)
class MistralSummarizer:

    @modal.enter()
    def load_model(self):
        from unsloth import FastLanguageModel

        hf_token = os.environ.get("HF_TOKEN")
        adapter_id = os.environ.get("HF_MODEL_ID")

        print(f"[STARTUP] Loading: {adapter_id}", flush=True)
        self.model, self.tokenizer = FastLanguageModel.from_pretrained(
            model_name=adapter_id,
            max_seq_length=2048,
            dtype=None,
            load_in_4bit=True,
            token=hf_token,
            cache_dir="/model-cache",
        )
        FastLanguageModel.for_inference(self.model)
        print("[STARTUP] Model ready!", flush=True)

    def _clean_summary(self, raw: str) -> str:
        import re

        title = ""
        bullets = []
        seen = set()

        for line in raw.strip().split('\n'):
            line = line.strip()
            if not line:
                continue
            if re.search(r'https?://', line):
                continue

            # extract title — first one wins
            title_match = re.match(r'^(Title|Document Title)\s*:\s*(.+)', line, re.IGNORECASE)
            if title_match and not title:
                title = title_match.group(2).strip()
                continue

            # skip section headers
            if re.match(r'^Key\s*Points?\s*:', line, re.IGNORECASE):
                continue

            # normalize all bullet styles: *, -, +, •
            bullet_match = re.match(r'^[•\*\+\-]+\s*(.+)', line)
            if bullet_match:
                point = bullet_match.group(1).strip()
                point = point.rstrip('.,;:') + '.'
                key = point[:40].lower()
                if key not in seen and len(point) > 10:
                    seen.add(key)
                    bullets.append(f"• {point}")
                    if len(bullets) == 8:
                        break

        result = ""
        if title:
            result += f"{title}\n\n"
        result += "\n".join(bullets)
        return result.strip()

    def _generate(self, text: str):
        # split into chunks
        chunks = []
        chunk_size = 3000
        for i in range(0, len(text), chunk_size - 200):
            chunk = text[i:i + chunk_size]
            if chunk.strip():
                chunks.append(chunk)

        # ✅ clean each chunk individually, merge bullets
        all_bullets = []
        title = ""

        for chunk in chunks:
            raw = "".join(self._generate_chunk(chunk))
            cleaned = self._clean_summary(raw)

            for line in cleaned.strip().split('\n'):
                line = line.strip()
                if not line:
                    continue
                # grab title from first chunk only
                if not title and not line.startswith('•'):
                    title = line
                elif line.startswith('•') and len(all_bullets) < 8:
                    all_bullets.append(line)

        result = ""
        if title:
            result += f"{title}\n\n"
        result += "\n".join(all_bullets)

        # yield final merged result as one string
        yield result

    def _generate_chunk(self, text: str):
        import threading
        from transformers import TextIteratorStreamer

        text = text[:3000]

        prompt = (
            "<s>[INST] Summarize the following document.\n"
            "Start with a short title, then list the key points.\n"
            "Only include information from the document.\n\n"
            f"Document:\n{text} [/INST]\n"
        )

        inputs = self.tokenizer(
            [prompt],
            return_tensors="pt",
            truncation=True,
            max_length=2048,
        ).to("cuda")

        streamer = TextIteratorStreamer(
            self.tokenizer,
            skip_prompt=True,
            skip_special_tokens=True,
            decode_kwargs={"errors": "replace"},
        )

        generation_kwargs = dict(
            input_ids=inputs.input_ids,
            attention_mask=inputs.attention_mask,
            max_new_tokens=300,
            use_cache=True,
            do_sample=False,
            repetition_penalty=1.3,
            eos_token_id=self.tokenizer.eos_token_id,
            pad_token_id=self.tokenizer.eos_token_id,
            streamer=streamer,
        )

        thread = threading.Thread(target=self.model.generate, kwargs=generation_kwargs)
        thread.start()

        for token in streamer:
            yield token

    @modal.fastapi_endpoint(method="POST")
    def summarize(self, item: dict):
        import urllib.request
        import fitz
        import traceback
        import torch
        import json
        from fastapi.responses import StreamingResponse

        try:
            pdf_url = item.get("pdf_url")
            stream_response = item.get("stream", False)

            if not pdf_url:
                return {"error": "Missing pdf_url"}

            print(f"[DEBUG] Downloading PDF...", flush=True)
            req = urllib.request.Request(pdf_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req) as r:
                pdf_bytes = r.read()

            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            full_text = "".join([page.get_text() for page in doc])
            doc.close()
            print(f"[DEBUG] Extracted {len(full_text.split())} words", flush=True)

            if stream_response:
                def event_generator():
                    try:
                        # _generate yields one final cleaned string
                        final = "".join(self._generate(full_text))
                        for char in final:
                            yield f"data: {json.dumps({'token': char})}\n\n"
                        yield f"data: {json.dumps({'done': True})}\n\n"
                    except Exception as e:
                        yield f"data: {json.dumps({'error': str(e)})}\n\n"

                return StreamingResponse(event_generator(), media_type="text/event-stream")
            else:
                summary = "".join(self._generate(full_text))
                return {"summary": summary}

        except torch.cuda.CUDAError as e:
            torch.cuda.empty_cache()
            return {"error": f"CUDA Error: {str(e)}", "traceback": traceback.format_exc()}
        except Exception as e:
            return {"error": str(e), "traceback": traceback.format_exc()}


@app.local_entrypoint()
def main(pdf_url: str = None):
    if not pdf_url:
        pdf_url = os.getenv("PDF_URL")
    if not pdf_url:
        print("ERROR: No PDF_URL provided.")
        return
    import requests
    response = requests.post(
        MistralSummarizer().summarize.web_url,
        json={"pdf_url": pdf_url},
        timeout=300
    )
    print("\n===== SUMMARY =====")
    print(response.json())