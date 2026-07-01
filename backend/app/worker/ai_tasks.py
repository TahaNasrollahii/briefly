import os
import json
import asyncio
from groq import Groq
from sqlalchemy.future import select
from app.worker.celery_app import celery_app
from app.db.session import AsyncSessionLocal
from app.db.models import ProcessingJob, Summary
from app.rabbitmq import rabbitmq_client
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

async def update_job_status(job_id: str, status: str, progress: float):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(ProcessingJob).where(ProcessingJob.id == job_id))
        job = result.scalar_one_or_none()
        if job:
            job.status = status
            job.progress = progress
            await session.commit()
            
    await rabbitmq_client.publish(
        "notification.exchange",
        "notification.status",
        {"job_id": job_id, "status": status, "progress": progress}
    )

@celery_app.task(bind=True, name="app.worker.ai_tasks.generate_summary", max_retries=5)
def generate_summary(self, event_payload: dict):
    job_id = event_payload["job_id"]
    full_text = event_payload["full_text"]
    
    loop = asyncio.get_event_loop()
    loop.run_until_complete(update_job_status(job_id, "summarizing", 80.0))
    
    prompt = f"""
    Analyze the following transcript and extract:
    1. A concise overall summary.
    2. Key bullet points.
    3. Action items (who does what).
    4. Key decisions.
    5. Main topic classification.

    Respond ONLY with a valid JSON object matching this schema:
    {{
        "summary": "...",
        "bullet_points": ["...", "..."],
        "action_items": ["...", "..."],
        "decisions": ["...", "..."],
        "topics": ["...", "..."]
    }}

    Transcript:
    {full_text[:30000]} # Limit to avoid context window explosion
    """
    
    try:
        completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.3-70b-versatile", # Current recommended Groq model
            response_format={"type": "json_object"}
        )
        
        result_json_str = completion.choices[0].message.content
        structured_data = json.loads(result_json_str)
        
        async def save_summary():
            async with AsyncSessionLocal() as session:
                # Idempotency check
                existing = await session.execute(select(Summary).where(Summary.job_id == job_id))
                if existing.scalar_one_or_none():
                    return
                    
                s = Summary(job_id=job_id, structured_data=structured_data)
                session.add(s)
                
                result = await session.execute(select(ProcessingJob).where(ProcessingJob.id == job_id))
                job = result.scalar_one_or_none()
                if job:
                    job.status = "completed"
                    job.progress = 100.0
                await session.commit()
                
            await rabbitmq_client.publish(
                "notification.exchange",
                "notification.status",
                {"job_id": job_id, "status": "completed", "progress": 100.0}
            )
            
        loop.run_until_complete(save_summary())
        
    except Exception as exc:
        loop.run_until_complete(update_job_status(job_id, "failed", 0.0))
        # Exponential backoff
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
