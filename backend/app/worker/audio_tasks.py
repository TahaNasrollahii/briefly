import os
import math
from pydub import AudioSegment
import whisper
import asyncio
from sqlalchemy.future import select
from app.worker.celery_app import celery_app
from app.db.session import AsyncSessionLocal
from app.db.models import ProcessingJob, AudioChunk, Transcript
from app.rabbitmq import rabbitmq_client
from app.core.config import settings

# Load whisper model globally for the worker to avoid reloading
try:
    print(f"Loading Whisper model: {settings.WHISPER_MODEL}")
    model = whisper.load_model(settings.WHISPER_MODEL)
except Exception as e:
    print(f"Error loading whisper model: {e}")
    model = None

async def update_job_status(job_id: str, status: str, progress: float):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(ProcessingJob).where(ProcessingJob.id == job_id))
        job = result.scalar_one_or_none()
        if job:
            job.status = status
            job.progress = progress
            await session.commit()
    
    # Broadcast status update
    await rabbitmq_client.publish(
        "notification.exchange",
        "notification.status",
        {"job_id": job_id, "status": status, "progress": progress}
    )

@celery_app.task(bind=True, name="app.worker.audio_tasks.chunk_audio", max_retries=3)
def chunk_audio(self, event_payload: dict):
    job_id = event_payload["job_id"]
    file_path = event_payload["file_path"]
    
    loop = asyncio.get_event_loop()
    loop.run_until_complete(update_job_status(job_id, "chunking", 10.0))
    
    try:
        # Load audio using pydub
        audio = AudioSegment.from_file(file_path)
        
        # 5 minute chunks (300,000 ms)
        chunk_length_ms = 5 * 60 * 1000 
        chunks = math.ceil(len(audio) / chunk_length_ms)
        
        chunk_records = []
        
        for i in range(chunks):
            start = i * chunk_length_ms
            end = min((i + 1) * chunk_length_ms, len(audio))
            chunk = audio[start:end]
            
            chunk_path = f"uploads/{job_id}_chunk_{i}.wav"
            chunk.export(chunk_path, format="wav")
            
            chunk_records.append({
                "job_id": job_id,
                "chunk_index": i,
                "file_path": chunk_path,
                "status": "pending"
            })
            
        # Save chunks to DB idempotently
        async def save_chunks():
            async with AsyncSessionLocal() as session:
                for c in chunk_records:
                    new_chunk = AudioChunk(**c)
                    session.add(new_chunk)
                await session.commit()
                
                for c in chunk_records:
                    await rabbitmq_client.publish(
                        "processing.exchange",
                        "audio.chunked",
                        {"job_id": job_id, "chunk_index": c["chunk_index"], "file_path": c["file_path"]}
                    )
                    
                # Publish the completion of chunking to trigger merging eventually
                # Or merging will be triggered when all chunks are done.
                
        loop.run_until_complete(save_chunks())
        
    except Exception as exc:
        loop.run_until_complete(update_job_status(job_id, "failed", 0.0))
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)

@celery_app.task(bind=True, name="app.worker.audio_tasks.transcribe_chunk", max_retries=3)
def transcribe_chunk(self, event_payload: dict):
    job_id = event_payload["job_id"]
    chunk_index = event_payload["chunk_index"]
    file_path = event_payload["file_path"]
    
    loop = asyncio.get_event_loop()
    loop.run_until_complete(update_job_status(job_id, "transcribing", 30.0))
    
    try:
        result = model.transcribe(file_path)
        transcript_text = result["text"]
        
        async def save_transcript():
            async with AsyncSessionLocal() as session:
                res = await session.execute(
                    select(AudioChunk)
                    .where(AudioChunk.job_id == job_id, AudioChunk.chunk_index == chunk_index)
                )
                chunk = res.scalar_one_or_none()
                if chunk:
                    chunk.status = "completed"
                    chunk.transcript_text = transcript_text
                    await session.commit()
                
                # Check if all chunks are completed
                res_all = await session.execute(select(AudioChunk).where(AudioChunk.job_id == job_id))
                all_chunks = res_all.scalars().all()
                if all(c.status == "completed" for c in all_chunks):
                    # Trigger merge
                    await rabbitmq_client.publish(
                        "processing.exchange",
                        "audio.transcribed",
                        {"job_id": job_id}
                    )
                    
        loop.run_until_complete(save_transcript())
        
    except Exception as exc:
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)


@celery_app.task(bind=True, name="app.worker.audio_tasks.merge_transcripts", max_retries=3)
def merge_transcripts(self, event_payload: dict):
    job_id = event_payload["job_id"]
    
    loop = asyncio.get_event_loop()
    loop.run_until_complete(update_job_status(job_id, "merging", 60.0))
    
    try:
        async def merge():
            async with AsyncSessionLocal() as session:
                # Check idempotency
                existing = await session.execute(select(Transcript).where(Transcript.job_id == job_id))
                if existing.scalar_one_or_none():
                    return # already merged
                
                res = await session.execute(select(AudioChunk).where(AudioChunk.job_id == job_id).order_by(AudioChunk.chunk_index))
                chunks = res.scalars().all()
                full_text = " ".join(c.transcript_text for c in chunks if c.transcript_text)
                
                t = Transcript(job_id=job_id, full_text=full_text)
                session.add(t)
                await session.commit()
                
                await rabbitmq_client.publish(
                    "processing.exchange",
                    "audio.merged",
                    {"job_id": job_id, "full_text": full_text}
                )
                
        loop.run_until_complete(merge())
        
    except Exception as exc:
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
