from app.worker.celery_app import celery_app
import logging

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, name="app.worker.notification_tasks.handle_notification", max_retries=3)
def handle_notification(self, event_payload: dict):
    # This worker can handle out-of-band notifications like emails, webhooks, or push notifications.
    # WebSockets are handled directly by the FastAPI consumer to avoid Celery overhead for real-time.
    try:
        job_id = event_payload.get("job_id")
        status = event_payload.get("status")
        
        logger.info(f"System Notification: Job {job_id} changed to status '{status}'.")
        
    except Exception as exc:
        logger.error(f"Failed to handle notification: {exc}")
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
