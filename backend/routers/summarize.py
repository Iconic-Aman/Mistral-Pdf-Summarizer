from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
import uuid

from backend.middleware.auth import get_current_user
from backend.db.session import get_db
from backend.models.db_models import User, Job, Summary
from backend.storage.r2_client import get_signed_url
import fitz  # PyMuPDF
import httpx
import os
import logging
import traceback

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

router = APIRouter(
    prefix="/api/v1/summarize",
    tags=["Summarize"]
)

async def extract_text_from_pdf(url: str) -> str:
    """Downloads PDF from URL and extracts text using PyMuPDF."""
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        if response.status_code != 200:
            raise Exception("Failed to download PDF from storage")
        
        # Open from memory
        doc = fitz.open(stream=response.content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text

async def get_mistral_summary(text: str) -> str:
    """Calls Hugging Face Inference API for Mistral-7B-Instruct."""
    HF_TOKEN = os.getenv("HF_TOKEN")
    HF_MODEL_ID = os.getenv("HF_MODEL_ID")
    HF_API_BASE = os.getenv("HF_INFERENCE_API_BASE", "https://router.huggingface.co/hf-inference/models")
    API_URL = f"{HF_API_BASE}/{HF_MODEL_ID}"
    
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    
    # Simple prompt for summarization
    prompt = f"<s>[INST] Summarize the following document concisely. Focus on the main goals, methodology, and key results: \n\n {text[:6000]} [/INST]"
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        payload = {
            "inputs": prompt,
            "parameters": {"max_new_tokens": 512, "return_full_text": False}
        }
        response = await client.post(API_URL, headers=headers, json=payload)
        
        if response.status_code != 200:
            return f"AI Error: {response.text}"
            
        result = response.json()
        if isinstance(result, list) and len(result) > 0:
            return result[0].get("generated_text", "No summary generated.")
        return str(result)

async def simulate_summarization(job_id: uuid.UUID, db_factory):
    """
    Real summarization task using the Modal endpoint.
    """
    logger.info(f"[JOB {job_id}] Starting background summarization task.")
    async with db_factory() as db:
        # 1. Update status to processing
        result = await db.execute(select(Job).where(Job.id == job_id))
        job = result.scalars().first()
        if not job: 
            logger.error(f"[JOB {job_id}] Job not found in database! Aborting.")
            return
        
        logger.info(f"[JOB {job_id}] Found job. Updating status to 'processing'.")
        job.status = "processing"
        await db.commit()

        try:
            # 2. Get the PDF url
            logger.info(f"[JOB {job_id}] Generating signed R2 URL for key: {job.r2_key}")
            pdf_url = get_signed_url(job.r2_key)
            logger.info(f"[JOB {job_id}] R2 URL generated successfully.")
            
            # 3. Call Modal Endpoint
            MODAL_ENDPOINT = os.getenv("MODAL_ENDPOINT")
            HF_MODEL_ID = os.getenv("HF_MODEL_ID")
            logger.info(f"[JOB {job_id}] Checking Modal Endpoint from env: {MODAL_ENDPOINT}")
            logger.info(f"[JOB {job_id}] Checking HF_MODEL_ID from env: {HF_MODEL_ID}")

            if not MODAL_ENDPOINT:
                logger.error(f"[JOB {job_id}] MODAL_ENDPOINT not set in environment.")
                raise Exception("MODAL_ENDPOINT not set in environment")
            
            request_payload = {
                "pdf_url": pdf_url,
                "model_id": HF_MODEL_ID
            }
            logger.info(f"[JOB {job_id}] Sending POST request to Modal with payload: {request_payload}")
            
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(MODAL_ENDPOINT, json=request_payload)
                logger.info(f"[JOB {job_id}] Received response from Modal: Status {response.status_code}")
                
                if response.status_code != 200:
                    logger.error(f"[JOB {job_id}] Error from Modal Endpoint: {response.text}")
                    ai_summary = f"Error from Modal: {response.text}"
                else:
                    data = response.json()
                    logger.info(f"[JOB {job_id}] Modal JSON response received. Keys: {list(data.keys())}")
                    
                    # Check for CUDA errors in response
                    if "error" in data and "CUDA" in str(data["error"]):
                        logger.error(f"[JOB {job_id}] CUDA Error from Modal: {data['error']}")
                        ai_summary = f"CUDA Error: {data['error']}. Please try with a shorter document."
                    else:
                        ai_summary = data.get("summary", data.get("error", "No summary returned."))

            # 4. Save Real summary
            logger.info(f"[JOB {job_id}] Saving summary to DB (Length: {len(str(ai_summary))})")
            summary = Summary(
                job_id=job.id,
                content=ai_summary,
                tokens_used=len(str(ai_summary)) // 4  # Rough estimate
            )
            db.add(summary)
            
            # 5. Update job status
            logger.info(f"[JOB {job_id}] Marking job as 'completed'!")
            job.status = "completed"
            job.finished_at = datetime.now()
            await db.commit()
            
        except Exception as e:
            logger.error(f"[JOB {job_id}] Summarization Task Error: {str(e)}")
            logger.error(traceback.format_exc())
            job.status = "error"
            await db.commit()

@router.post("/start/{job_id}")
async def start_summarization(
    job_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Starts the summarization process for an uploaded PDF.
    """
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalars().first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.user_id != current_user.id and current_user.id != "system-admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this job")

    if job.status != "pending":
        return {"message": "Job is already being processed or completed", "status": job.status}

    # Get signed URL for the ML service (demonstration only for now)
    pdf_url = get_signed_url(job.r2_key)
    
    # Add to background tasks
    from backend.db.session import AsyncSessionLocal
    background_tasks.add_task(simulate_summarization, job.id, AsyncSessionLocal)

    return {
        "message": "Summarization started",
        "job_id": str(job.id),
        "status": "processing"
    }

@router.get("/status/{job_id}")
async def get_status(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Check the status and result of a summarization job.
    """
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalars().first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.user_id != current_user.id and current_user.id != "system-admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    response = {
        "job_id": str(job.id),
        "status": job.status,
        "filename": job.filename,
        "created_at": job.created_at
    }

    if job.status == "completed":
        summary_result = await db.execute(select(Summary).where(Summary.job_id == job.id))
        summary = summary_result.scalars().first()
        if summary:
            response["summary"] = summary.content
            response["finished_at"] = job.finished_at

    return response
