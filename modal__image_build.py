import modal
import sys
import os

# -- Modal app & image ----------------------------------------------
app = modal.App("mistral-pdf-summarizer")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install([
        "torch==2.3.0",
        "transformers==4.44.0",
        "bitsandbytes==0.43.0",
        "accelerate",
        "unsloth",           # needed since model was trained with unsloth
        "peft",
        "trl==0.8.0",              # required by unsloth
        "pymupdf",           # for PDF text extraction
        "huggingface_hub",
        "fastapi[standard]", # required for modal.fastapi_endpoint
        "sentencepiece",
        "protobuf",
        "xformers==0.0.26.post1",
    ]).env({
        "PYTHONIOENCODING": "utf-8",
        "UNSLOTH_VERSION_CHECK": "0"
    })
)

from dotenv import load_dotenv

load_dotenv(".env.local")

HF_MODEL_ID = os.getenv("MISTRAL_MODEL_ID")
MISTRAL_BASE_MODEL = os.getenv("MISTRAL_BASE_MODEL")
HF_TOKEN = os.getenv("HF_TOKEN")

# GPU Function
@app.function(
    image=image,
    gpu="T4",               # cheap & sufficient for 4-bit 7B model (~$0.30/hr)
    timeout=600,            # Increased timeout for cold starts
    secrets=[modal.Secret.from_dict({"HF_TOKEN": HF_TOKEN}) if HF_TOKEN else modal.Secret.from_name("huggingface")],
    # Cache model weights across runs (avoids re-downloading every time)
    volumes={"/model-cache": modal.Volume.from_name("model-cache", create_if_missing=True)},
)
@modal.fastapi_endpoint(method="POST")
def summarize_pdf_web(item: dict) -> dict:
    import os
    import sys
    import traceback
    import fitz  # PyMuPDF
    import torch
    import urllib.request
    from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig

    import io
    # Force UTF-8 and ignore unencodable characters (like emojis) to prevent crashes
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='ignore')
        sys.stderr.reconfigure(encoding='utf-8', errors='ignore')
    else:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='ignore')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='ignore')

    try:
        print("[DEBUG] Request started. Emoji-shield activated.")
        hf_token = os.environ.get("HF_TOKEN")
        
        pdf_url = item.get("pdf_url")
        pdf_path = item.get("pdf_path")
        
        # -- 1. Fetch PDF and Extract text --
        try:
            if pdf_path:
                print(f"[DEBUG] Reading file: {pdf_path}")
                with open(pdf_path, "rb") as f:
                    pdf_bytes = f.read()
            elif pdf_url:
                print(f"[DEBUG] Downloading: {pdf_url[:50]}...")
                req = urllib.request.Request(pdf_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req) as response:
                    pdf_bytes = response.read()
            else:
                return {"error": "Missing input"}
        except Exception as e:
            print(f"[ERROR] PDF fetch error: {str(e)}")
            return {"error": f"PDF fetch error: {str(e)}"}

        print("[DEBUG] Extracting text...")
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        full_text = "".join([page.get_text() for page in doc])
        doc.close()

        print(f"[DEBUG] Extracted {len(full_text.split())} words.")
        if len(full_text.split()) > 3000:
            full_text = " ".join(full_text.split()[:3000])

        # -- 2. Load model using Unsloth (Matching your fine-tuning notebook approach) --
        print("[DEBUG] Loading Base Model (Bfloat16 mode)...")
        cache_dir = "/model-cache"
        from unsloth import FastLanguageModel
        
        # Load base model first
        model, tokenizer = FastLanguageModel.from_pretrained(
            model_name=MISTRAL_BASE_MODEL,
            max_seq_length=2048,
            dtype=torch.bfloat16,
            load_in_4bit=False,
            token=hf_token,
            cache_dir=cache_dir,
        )

        print(f"[DEBUG] Loading LoRA Adapter: {HF_MODEL_ID}")
        from peft import PeftModel
        model = PeftModel.from_pretrained(
            model,
            HF_MODEL_ID,
            token=hf_token,
            cache_dir=cache_dir,
        )

        print("[DEBUG] Setting model to inference mode.")
        FastLanguageModel.for_inference(model)

        # -- 3. Build prompt --
        prompt = f"### Human: Summarize the following document clearly and concisely. Focus on key information, locations, dates, and important points.\n\nDocument:\n{full_text}\n\n### Assistant:"

        print("[DEBUG] Tokenizing prompt...")
        inputs = tokenizer(
            [prompt],
            return_tensors="pt",
            truncation=True,
            max_length=1024,
        ).to("cuda")

        # -- 4. Generate --
        print("[DEBUG] Generating summary with GPU...")
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=512,
                use_cache=True,
                do_sample=True,
                temperature=0.3,
                pad_token_id=tokenizer.eos_token_id,
            )

        print("[DEBUG] Decoding response.")
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        if "### Assistant:" in response:
            summary = response.split("### Assistant:")[-1].strip()
        else:
            summary = response
        
        print(f"[DEBUG] Summary generated. Length: {len(summary)}")
        return {"summary": summary}
        
    except Exception as e:
        error_info = traceback.format_exc()
        print(f"[CRITICAL ERROR] Function failed during execution:\n{error_info}")
        return {
            "error": f"Function Execution Failed ho gya {e}",
            "details": str(e),
            "traceback": error_info
        }

@app.function(
    image=image,
    gpu="T4",
    timeout=300,
    secrets=[modal.Secret.from_dict({"HF_TOKEN": HF_TOKEN}) if HF_TOKEN else modal.Secret.from_name("huggingface")],
    volumes={"/model-cache": modal.Volume.from_name("model-cache", create_if_missing=True)},
)
def summarize_pdf_local(pdf_url: str) -> dict:
    """Calls the web endpoint logic locally with a PDF URL (same as what the backend sends)."""
    return summarize_pdf_web.local({"pdf_url": pdf_url})

# -- Local entrypoint: test with any public PDF URL -----------------
@app.local_entrypoint()
def main(pdf_url: str = None):
    if not pdf_url:
        pdf_url = os.getenv("TEST_PDF_URL", "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")
    print(f"Sending PDF URL to Modal GPU: {pdf_url}")
    result = summarize_pdf_local.remote(pdf_url)
    print("\n===== SUMMARY =====")
    print(result)
