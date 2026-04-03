from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from backend.middleware.auth import get_current_user
from backend.db.session import get_db
from backend.models.db_models import User, Job, Summary

router = APIRouter(
    prefix="/api/v1/jobs",
    tags=["Jobs"]
)

@router.get("/")
async def get_jobs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch all jobs for the currently authenticated user.
    """
    try:
        # System Admin bypass
        if current_user.id == "system-admin":
            return []
            
        stmt = select(Job).where(Job.user_id == current_user.id).order_by(Job.created_at.desc())
        result = await db.execute(stmt)
        jobs = result.scalars().all()
        
        return jobs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{job_id}")
async def get_job_details(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch details of a specific job and its summary.
    """
    try:
        if current_user.id == "system-admin":
             raise HTTPException(status_code=404, detail="Job not found")

        job_uuid = uuid.UUID(job_id)
        
        # Verify job belongs to user
        job_stmt = select(Job).where(Job.id == job_uuid, Job.user_id == current_user.id)
        job_result = await db.execute(job_stmt)
        job = job_result.scalar_one_or_none()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        # Get summary
        summary_stmt = select(Summary).where(Summary.job_id == job_uuid)
        summary_result = await db.execute(summary_stmt)
        summary = summary_result.scalar_one_or_none()
        
        return {
            "job": job,
            "summary": summary
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
