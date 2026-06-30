from celery import Celery
from kombu import Exchange, Queue
from app.core.config import settings

celery_app = Celery(
    "briefly_worker",
    broker=settings.RABBITMQ_URL,
    backend=settings.REDIS_URL,
)

# Define Exchanges
audio_exchange = Exchange("audio.exchange", type="topic", durable=True)
processing_exchange = Exchange("processing.exchange", type="topic", durable=True)
ai_exchange = Exchange("ai.exchange", type="topic", durable=True)
notification_exchange = Exchange("notification.exchange", type="topic", durable=True)

# Define Dead Letter Exchanges and Queues
dlx = Exchange("dlx", type="direct", durable=True)

celery_app.conf.task_queues = (
    # DLQs
    Queue("transcription.dlq", dlx, routing_key="transcription.dlq"),
    Queue("summarization.dlq", dlx, routing_key="summarization.dlq"),
    
    # Audio Worker Queues
    Queue("chunking.queue", audio_exchange, routing_key="audio.uploaded", 
          queue_arguments={"x-dead-letter-exchange": "dlx", "x-dead-letter-routing-key": "transcription.dlq"}),
    Queue("transcription.queue", processing_exchange, routing_key="audio.chunked",
          queue_arguments={"x-dead-letter-exchange": "dlx", "x-dead-letter-routing-key": "transcription.dlq"}),
    Queue("merging.queue", processing_exchange, routing_key="audio.transcribed",
          queue_arguments={"x-dead-letter-exchange": "dlx", "x-dead-letter-routing-key": "transcription.dlq"}),
          
    # AI Worker Queues
    Queue("summarization.queue", processing_exchange, routing_key="audio.merged",
          queue_arguments={"x-dead-letter-exchange": "dlx", "x-dead-letter-routing-key": "summarization.dlq"}),
    Queue("insights.queue", ai_exchange, routing_key="ai.summarized",
          queue_arguments={"x-dead-letter-exchange": "dlx", "x-dead-letter-routing-key": "summarization.dlq"}),
    Queue("action_items.queue", ai_exchange, routing_key="ai.insights",
          queue_arguments={"x-dead-letter-exchange": "dlx", "x-dead-letter-routing-key": "summarization.dlq"}),
          
    # Notification Worker Queues
    Queue("notification.queue", notification_exchange, routing_key="notification.*"),
    Queue("websocket.queue", notification_exchange, routing_key="notification.*"),
)

celery_app.conf.task_routes = {
    "app.worker.audio_tasks.*": {"queue": "chunking.queue"},
    "app.worker.ai_tasks.*": {"queue": "summarization.queue"},
    "app.worker.notification_tasks.*": {"queue": "notification.queue"},
}

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True, # Important for idempotency
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1, # One task at a time for long running audio
)

# Import tasks to register them
import app.worker.audio_tasks
import app.worker.ai_tasks
import app.worker.notification_tasks
