from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
import uuid

from backend.middleware.auth import get_current_user
from backend.db.session import get_db
from backend.models.db_models import User, Job, Summary
from backend.storage.r2_client import get_signed_url

router = APIRouter(
    prefix="/api/v1/summarize",
    tags=["Summarize"]
)

async def simulate_summarization(job_id: uuid.UUID, db_factory):
    """
    Simulated background task for summarization.
    In production, this would call the Hugging Face ML microservice.
    """
    async with db_factory() as db:
        # 1. Update status to processing
        result = await db.execute(select(Job).where(Job.id == job_id))
        job = result.scalars().first()
        if not job: return
        
        job.status = "processing"
        await db.commit()

        # 2. Simulate ML delay
        import asyncio
        await asyncio.sleep(5) 

        # 3. Create mock summary
        mock_content = f"This is a simulated summary for {job.filename}. The Mistral model would normally provide a deep analysis here."
        summary = Summary(
            job_id=job.id,
            content=mock_content,
            tokens_used=150
        )
        db.add(summary)
        
        # 4. Update job status
        job.status = "completed"
        job.finished_at = datetime.now()
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
