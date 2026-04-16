import modal
import os

app = modal.App("mistral-pdf-summarizer")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install([
        # Core inference stack
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
        'fastapi[standard]',         
    ]).env({
        "PYTHONIOENCODING": "utf-8",
        "UNSLOTH_VERSION_CHECK": "0"
    })
)

from dotenv import load_dotenv
load_dotenv(".env")

HF_MODEL_ID = os.getenv("HF_MODEL_ID")
MISTRAL_BASE_MODEL = os.getenv("MISTRAL_BASE_MODEL")
HF_TOKEN = os.getenv("HF_TOKEN")
print(f"[CONFIG] Base model: {MISTRAL_BASE_MODEL}")
print(f"[CONFIG] Adapter: {HF_MODEL_ID}")


@app.cls(
    image=image,
    gpu="T4",
    timeout=600,
    scaledown_window=300,   # ✅ keep container warm for 5 mins
    secrets=[modal.Secret.from_dict({
        "HF_TOKEN": HF_TOKEN,
        "HF_MODEL_ID": HF_MODEL_ID,
        "MISTRAL_BASE_MODEL": MISTRAL_BASE_MODEL,
    })],
    volumes={"/model-cache": modal.Volume.from_name("model-cache", create_if_missing=True)},
)
class MistralSummarizer:

    @modal.enter()
    def load_model(self):
        from unsloth import FastLanguageModel

        hf_token = os.environ.get("HF_TOKEN")
        adapter_id = os.environ.get("HF_MODEL_ID")  

        print(f"[STARTUP] Loading fine-tuned model: {adapter_id}", flush=True)

        # ✅ load exactly like Colab — direct fine-tuned model, no separate PeftModel
        self.model, self.tokenizer = FastLanguageModel.from_pretrained(
            model_name=adapter_id,
            max_seq_length=2048,   # ✅ fixed from 512
            dtype=None,
            load_in_4bit=True,
            token=hf_token,
            cache_dir="/model-cache",
        )
        FastLanguageModel.for_inference(self.model)
        print("[STARTUP] Model ready!", flush=True)

    def _clean_summary(self, raw: str) -> str:
        """Extract clean bullet points, remove noise and URLs."""
        import re
        def is_noise(line):
            return (not line or re.search(r'https?://', line)
                    or line.lower().startswith(("reference", "source", "more info")))

        lines = raw.replace("•", "\n•").split("\n")
        bullets, seen = [], set()
        clean_para = []

        for line in lines:
            line = line.strip()
            if is_noise(line):
                continue
            if line.startswith(("•", "-", "*")):
                point = line.lstrip("•-* ").strip()
                key = point[:40].lower()
                if key not in seen and len(point) > 10:
                    seen.add(key)
                    bullets.append(f"• {point}")
                    if len(bullets) == 8:
                        break
            else:
                clean_para.append(line)

        if bullets:
            return "\n".join(bullets)
        # Fallback: return cleaned paragraph (no URLs)
        return " ".join(clean_para).strip()

    def _generate(self, text: str):

        # ✅ chunk if long, summarize each chunk
        chunks = []
        chunk_size = 3000
        for i in range(0, len(text), chunk_size - 200):
            chunk = text[i:i + chunk_size]
            if chunk.strip():
                chunks.append(chunk)

        # summarize each chunk, collect results
        all_tokens = []
        for chunk in chunks:
            yield from self._generate_chunk(chunk)

    def _generate_chunk(self, text: str):
        import threading
        from transformers import TextIteratorStreamer

        text = text[:3000]  # safety cap per chunk
        # ✅ correct — prompt content starts at column 0
        prompt = f"""<s>[INST] Read the following document carefully and provide a concise summary.
            Rules:
            - Extract only the most important and UNIQUE points
            - Maximum 8 bullet points starting with •
            - No hallucination, only use info from the document

            Document:
            {text} [/INST]
            • """

        inputs = self.tokenizer(
            [prompt],
            return_tensors="pt",
            truncation=True,
            max_length=2048,    # ✅ matches max_seq_length
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

            # 1. Fetch PDF
            if pdf_url:
                print(f"[DEBUG] Downloading PDF...", flush=True)
                req = urllib.request.Request(pdf_url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req) as r:
                    pdf_bytes = r.read()
            else:
                return {"error": "Missing pdf_url"}

            # 2. Extract text
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            full_text = "".join([page.get_text() for page in doc])
            doc.close()

            print(f"[DEBUG] Extracted {len(full_text.split())} words", flush=True)

            # 3. Stream or return full summary
            if stream_response:
                def event_generator():
                    try:
                        for token in self._generate(full_text):
                            if token:
                                yield f"data: {json.dumps({'token': token})}\n\n"
                        yield f"data: {json.dumps({'done': True})}\n\n"
                    except Exception as e:
                        yield f"data: {json.dumps({'error': str(e)})}\n\n"

                return StreamingResponse(event_generator(), media_type="text/event-stream")
            else:
                tokens = []
                for token in self._generate(full_text):
                    tokens.append(token)
                summary = "".join(tokens)
                return {"summary": self._clean_summary(summary)}

        except torch.cuda.CUDAError as e:
            # Handle CUDA-specific errors
            torch.cuda.empty_cache()
            return {
                "error": f"CUDA Error: {str(e)}",
                "traceback": traceback.format_exc(),
                "suggestion": "Try reducing input text length or check GPU memory"
            }
        except Exception as e:
            return {
                "error": str(e),
                "traceback": traceback.format_exc()
            }


@app.local_entrypoint()
def main(pdf_url: str = None):
    if not pdf_url:
        pdf_url = os.getenv("PDF_URL")
    if not pdf_url:
        print("ERROR: No PDF_URL provided. Set PDF_URL in .env or pass --pdf-url <url>")
        return
    print(f"Testing with: {pdf_url}")
    import requests
    response = requests.post(MistralSummarizer().summarize.web_url, json={"pdf_url": pdf_url}, timeout=300)
    print("\n===== SUMMARY =====")
    print(response.json())