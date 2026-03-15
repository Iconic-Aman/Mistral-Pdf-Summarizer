import os
import fitz  # PyMuPDF
import httpx
import asyncio
from dotenv import load_dotenv

# Load .env
load_dotenv(".env")

async def test_mistral_summary():
    # 1. Configuration
    HF_TOKEN = os.getenv("HF_TOKEN")
    MODEL_ID = os.getenv("MISTRAL_MODEL_ID")
    # Try Legacy URL
    API_URL = f"https://router.huggingface.co/models/{MODEL_ID}"
    PDF_PATH = r"d:\WORKING PLACE\Mistral-finetune\Mistral-Pdf-Summarizer\Voice_Class7_PPT.pdf"

    print(f"--- Debugging Fine-tuned Mistral ---")
    print(f"Model ID: {MODEL_ID}")
    print(f"API URL: {API_URL}")

    # 2. Extract Text
    try:
        doc = fitz.open(PDF_PATH)
        text = ""
        for page in doc:
            text += page.get_text()
        print(f"Extracted {len(text)} characters.")
    except Exception as e:
        print(f"Extraction Failed: {str(e)}")
        return

    # 3. Call AI
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    # Prompt format often used in Mistral Instruct/Fine-tunes
    prompt = f"<s>[INST] Summarize the document below concisely: \n\n {text[:5000]} [/INST]"
    
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 500,
            "temperature": 0.7,
            "top_p": 0.95,
            "return_full_text": False
        },
        "options": {
            "wait_for_model": True  # Crucial for cold-start fine-tuned models
        }
    }

    print("\nSending request to Hugging Face...")
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(API_URL, headers=headers, json=payload)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n--- AI SUMMARY ---")
            if isinstance(result, list) and len(result) > 0:
                summary = result[0].get("generated_text", "Empty response")
                print(summary.encode('ascii', 'ignore').decode('ascii'))
            else:
                print(str(result).encode('ascii', 'ignore').decode('ascii'))
        else:
            print(f"Error: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_mistral_summary())
