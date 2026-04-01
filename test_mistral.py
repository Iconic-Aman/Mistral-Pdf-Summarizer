import os
import time
import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv(".env")

async def test_modal():
    MODAL_ENDPOINT = os.getenv("MODAL_ENDPOINT")
    PDF_URL = os.getenv("PDF_URL")

    print(f"Endpoint : {MODAL_ENDPOINT}")
    print(f"PDF URL  : {PDF_URL}")

    # Convert Google Drive share link → direct download link
    if "drive.google.com" in PDF_URL:
        file_id = PDF_URL.split("/d/")[1].split("/")[0]
        PDF_URL = f"https://drive.google.com/uc?export=download&id={file_id}"
        print(f"Direct URL: {PDF_URL}")

    start = time.time()
    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(MODAL_ENDPOINT, json={"pdf_url": PDF_URL})
    print(f"\nStatus: {response.status_code} | Time: {time.time() - start:.1f}s")
    print(response.json())

if __name__ == "__main__":
    asyncio.run(test_modal())
