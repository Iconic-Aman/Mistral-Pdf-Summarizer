from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
import uuid
import os
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from backend.middleware.auth import get_current_user
from backend.db.session import get_db
from backend.models.db_models import User, Job
from backend.storage.r2_client import upload_file

router = APIRouter(
    prefix="/api/v1/upload-file",
    tags=["Upload"]
)

@router.post("/")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    1. Validates the file is a PDF.
    2. Uploads to Cloudflare R2.
    3. Creates a Job entry in the database.
    """
    # 1. Validate File Type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    # 2. Create Unique Filename for R2
    job_id = uuid.uuid4()
    extension = os.path.splitext(file.filename)[1]
    r2_key = f"uploads/{current_user.id}/{job_id}{extension}"

    # 3. Save locally temporarily to upload
    # Using a relative tmp folder to work on Windows and Linux
    tmp_dir = "tmp"
    if not os.path.exists(tmp_dir):
        os.makedirs(tmp_dir)
    
    temp_path = os.path.join(tmp_dir, f"{job_id}{extension}")


    try:
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # 4. Upload to Cloudflare R2
        success, message = upload_file(temp_path, r2_key)
        if not success:
            raise HTTPException(status_code=500, detail=f"R2 Upload Failed: {message}")

        # 5. Create Database Job
        new_job = Job(
            id=job_id,
            user_id=current_user.id if hasattr(current_user, 'id') else None,
            filename=file.filename,
            r2_key=r2_key,
            status="pending"
        )
        
        # Handle "System Admin" mode where ID is a string, not a UUID
        if current_user.id == "system-admin":
             return {
                "message": "Upload successful (Bypassed DB save in System Admin mode)",
                "job_id": str(job_id),
                "r2_key": r2_key
            }

        db.add(new_job)
        await db.commit()
        await db.refresh(new_job)

        return {
            "message": "File uploaded and job created successfully",
            "job_id": str(new_job.id),
            "filename": new_job.filename,
            "status": new_job.status
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
