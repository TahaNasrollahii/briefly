from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
import os
import aiofiles
from app.db.session import get_db
from app.db.models import AudioFile, ProcessingJob, Transcript, Summary
from app.rabbitmq import rabbitmq_client
from app.core.config import settings

router = APIRouter()

@router.post("/upload")
async def upload_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    if file.size and file.size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max size is 50MB.")
        
    allowed_types = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a"]
    if file.content_type not in allowed_types and not file.filename.endswith(('.mp3', '.wav', '.m4a')):
         raise HTTPException(status_code=400, detail="Invalid file type.")

    # Create db records
    audio_file = AudioFile(
        filename=file.filename,
        file_path="", # will update after saving
        size_bytes=file.size or 0
    )
    db.add(audio_file)
    await db.flush()
    
    job = ProcessingJob(
        audio_file_id=audio_file.id,
        status="uploaded"
    )
    db.add(job)
    await db.flush()

    file_path = f"uploads/{audio_file.id}_{file.filename}"
    audio_file.file_path = file_path
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
        audio_file.size_bytes = len(content)

    await db.commit()
    await db.refresh(job)

    # Publish to RabbitMQ audio.exchange
    event_payload = {
        "event_type": "audio.uploaded",
        "job_id": job.id,
        "file_path": file_path,
        "filename": file.filename
    }
    
    background_tasks.add_task(
        rabbitmq_client.publish,
        "audio.exchange",
        "audio.uploaded",
        event_payload
    )

    return {"job_id": job.id, "status": "uploaded", "message": "File uploaded successfully."}

@router.get("/{job_id}/status")
async def get_status(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProcessingJob).where(ProcessingJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "job_id": job.id,
        "status": job.status,
        "progress": job.progress,
        "created_at": job.created_at
    }

@router.get("/{job_id}/result")
async def get_result(job_id: str, db: AsyncSession = Depends(get_db)):
    # Get transcript and summary
    result_trans = await db.execute(select(Transcript).where(Transcript.job_id == job_id))
    transcript = result_trans.scalar_one_or_none()
    
    result_summ = await db.execute(select(Summary).where(Summary.job_id == job_id))
    summary = result_summ.scalar_one_or_none()
    
    if not transcript and not summary:
         raise HTTPException(status_code=404, detail="Results not ready or job not found")
         
    return {
        "job_id": job_id,
        "transcript": transcript.full_text if transcript else None,
        "structured_data": summary.structured_data if summary else None
    }

@router.get("/list")
async def list_jobs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProcessingJob).order_by(ProcessingJob.created_at.desc()))
    jobs = result.scalars().all()
    
    return [
        {
            "job_id": job.id,
            "status": job.status,
            "progress": job.progress,
            "created_at": job.created_at
        } for job in jobs
    ]

@router.delete("/{job_id}")
async def delete_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProcessingJob).where(ProcessingJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    await db.delete(job)
    await db.commit()
    return {"message": "Job deleted"}
