import json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
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
    HF_MODEL_ID = os.getenv("MISTRAL_MODEL_ID")
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
    async with db_factory() as db:
        # 1. Update status to processing
        result = await db.execute(select(Job).where(Job.id == job_id))
        job = result.scalars().first()
        if not job: return
        
        job.status = "processing"
        await db.commit()

        try:
            # 2. Get the PDF url
            pdf_url = get_signed_url(job.r2_key)
            
            # 3. Call Modal Endpoint
            MODAL_ENDPOINT = os.getenv("MODAL_ENDPOINT")
            if not MODAL_ENDPOINT:
                raise Exception("MODAL_ENDPOINT not set in environment")
            
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(MODAL_ENDPOINT, json={"pdf_url": pdf_url})
                if response.status_code != 200:
                    ai_summary = f"Error from Modal: {response.text}"
                else:
                    data = response.json()
                    ai_summary = data.get("summary", data.get("error", "No summary returned."))

            # 4. Save Real summary
            summary = Summary(
                job_id=job.id,
                content=ai_summary,
                tokens_used=len(ai_summary) // 4  # Rough estimate
            )
            db.add(summary)
            
            # 5. Update job status
            job.status = "completed"
            job.finished_at = datetime.now()
            await db.commit()
        except Exception as e:
            print(f"Summarization Task Error: {str(e)}")
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

@router.get("/stream/{job_id}")
async def stream_summary(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Streams the summarization result token-by-token using SSE."""

    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalars().first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.user_id != current_user.id and current_user.id != "system-admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # If already completed, just send the full summary as one token and close
    if job.status == "completed":
        summary_result = await db.execute(select(Summary).where(Summary.job_id == job.id))
        summary = summary_result.scalars().first()
        async def cached_generator():
            if summary:
                yield f"data: {json.dumps({'token': summary.content})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        return StreamingResponse(cached_generator(), media_type="text/event-stream")

    async def event_generator():
        # Update status to processing
        job.status = "processing"
        await db.commit()
        
        pdf_url = get_signed_url(job.r2_key)
        MODAL_ENDPOINT = os.getenv("MODAL_ENDPOINT")
        if not MODAL_ENDPOINT:
            yield f"data: {json.dumps({'error': 'MODAL_ENDPOINT not set'})}\n\n"
            return
            
        payload = {"pdf_url": pdf_url, "stream": True}
        full_summary = ""
        
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                async with client.stream("POST", MODAL_ENDPOINT, json=payload) as response:
                    async for line in response.aiter_lines():
                        if line:
                            yield line + "\n\n"
                            
                            # Parse token to save in DB later
                            if line.startswith("data: "):
                                try:
                                    data = json.loads(line[6:])
                                    if "token" in data:
                                        full_summary += data["token"]
                                except Exception:
                                    pass

            # Once streaming is done, save the full summary to the database
            if full_summary:
                summary = Summary(
                    job_id=job.id,
                    content=full_summary,
                    tokens_used=max(1, len(full_summary) // 4)
                )
                db.add(summary)
                job.status = "completed"
                job.finished_at = datetime.now()
                await db.commit()

        except Exception as e:
            job.status = "error"
            await db.commit()
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
