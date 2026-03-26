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
        import torch
        from unsloth import FastLanguageModel
        from peft import PeftModel

        hf_token = os.environ.get("HF_TOKEN")
        base_model = os.environ.get("MISTRAL_BASE_MODEL")
        adapter_id = os.environ.get("HF_MODEL_ID")
        cache_dir = "/model-cache"

        print(f"[STARTUP] Loading base model: {base_model}", flush=True)
        self.model, self.tokenizer = FastLanguageModel.from_pretrained(
            model_name=base_model,   # ← exact base used in notebook
            max_seq_length=512,
            dtype=None,
            load_in_4bit=True,
            token=hf_token,
            cache_dir=cache_dir,
        )
        print(f"[STARTUP] Applying LoRA adapter: {adapter_id}", flush=True)
        self.model = PeftModel.from_pretrained(
            self.model, adapter_id, token=hf_token, cache_dir=cache_dir
        )
        FastLanguageModel.for_inference(self.model)
        print("[STARTUP] Model ready!", flush=True)

    def _chunk_text(self, text: str, max_words: int = 400) -> list:
        words = text.split()
        return [" ".join(words[i:i + max_words]) for i in range(0, len(words), max_words)]

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

    def _generate(self, text: str) -> str:
        import torch
        import gc

        # Must exactly match the fine-tuning prompt format from the notebook
        prompt = (
            "###Human: Read this following Document and provide a clear point-by-point summary of key information.\n"
            "Rules:\n"
            "- Extract only the most important and UNIQUE points\n"
            "- Each point must be different, no repetition\n"
            "- Maximum 8 bullet points\n"
            "- Each point starts with •\n"
            "- End each point with a period\n"
            "- Do NOT add any new information not present in the document\n"
            "- Keep statements factually accurate to the source\n\n"
            + text
            + "\n\n###Assistant:\n"
        )

        inputs = self.tokenizer(
            [prompt],
            return_tensors="pt",
            truncation=True,
            max_length=480,
        ).to("cuda")

        input_len = inputs["input_ids"].shape[1]
        print(f"[DEBUG] Input token length: {input_len}", flush=True)

        with torch.inference_mode():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=200,
                use_cache=True,
                do_sample=False,
                repetition_penalty=1.3,
                no_repeat_ngram_size=4,
                pad_token_id=self.tokenizer.eos_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
            )

        # Decode ONLY the newly generated tokens (not the input prompt)
        new_tokens = outputs[0][input_len:]
        result = self.tokenizer.decode(new_tokens, skip_special_tokens=True).strip()
        print(f"[DEBUG] Generated {len(new_tokens)} new tokens", flush=True)

        del inputs, outputs
        torch.cuda.empty_cache()
        gc.collect()

        return result

    @modal.fastapi_endpoint(method="POST")
    def summarize(self, item: dict) -> dict:
        import urllib.request
        import fitz
        import traceback
        import torch

        try:
            pdf_url = item.get("pdf_url")

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

            words = full_text.split()
            print(f"[DEBUG] Extracted {len(words)} words", flush=True)

            # 3. Chunk if needed and summarize
            if len(words) <= 400:
                summary = self._generate(full_text)
            else:
                chunks = self._chunk_text(full_text, max_words=400)
                print(f"[DEBUG] Split into {len(chunks)} chunks", flush=True)
                chunk_summaries = [self._generate(c) for c in chunks]
                summary = "\n".join(chunk_summaries)

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