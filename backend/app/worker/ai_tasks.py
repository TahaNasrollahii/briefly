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
    
    prompt = f"""You are a highly capable AI assistant that analyzes meeting transcripts.
Analyze the following transcript and provide a structured JSON response. 
The JSON must contain two top-level keys: "en" for English and "fa" for Persian (Farsi).
Inside BOTH "en" and "fa", provide the exact same structure translated into their respective languages:
{{
  "en": {{
    "title": "A short, descriptive title for the meeting (max 6 words).",
    "summary": "A concise paragraph summarizing the transcript.",
    "bullet_points": ["Key highlight 1", "Key highlight 2"],
    "action_items": ["Action 1", "Action 2"],
    "decisions": ["Decision 1", "Decision 2"],
    "topics": ["Topic 1", "Topic 2"]
  }},
  "fa": {{
    "title": "یک عنوان کوتاه و توصیفی برای جلسه (حداکثر ۶ کلمه).",
    "summary": "یک پاراگراف خلاصه از متن.",
    "bullet_points": ["نکته کلیدی ۱", "نکته کلیدی ۲"],
    "action_items": ["اقدام ۱", "اقدام ۲"],
    "decisions": ["تصمیم ۱", "تصمیم ۲"],
    "topics": ["موضوع ۱", "موضوع ۲"]
  }}
}}
Return ONLY valid JSON. No markdown formatting, no explanations.

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
