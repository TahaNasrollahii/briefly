from fastapi import WebSocket
from typing import Dict, List
import asyncio
import json
import aio_pika
from app.core.config import settings

class ConnectionManager:
    def __init__(self):
        # Maps job_id to a list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, job_id: str):
        await websocket.accept()
        if job_id not in self.active_connections:
            self.active_connections[job_id] = []
        self.active_connections[job_id].append(websocket)

    def disconnect(self, websocket: WebSocket, job_id: str):
        if job_id in self.active_connections:
            try:
                self.active_connections[job_id].remove(websocket)
                if not self.active_connections[job_id]:
                    del self.active_connections[job_id]
            except ValueError:
                pass

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast_to_job(self, job_id: str, message: dict):
        if job_id in self.active_connections:
            for connection in self.active_connections[job_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()

async def listen_for_notifications():
    """Background task to listen to RabbitMQ notification queue and broadcast to WebSockets"""
    connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
    channel = await connection.channel()
    
    # Declare the notification exchange
    exchange = await channel.declare_exchange("notification.exchange", aio_pika.ExchangeType.TOPIC, durable=True)
    
    # Declare an exclusive, auto-delete queue for this specific WebSocket server instance
    queue = await channel.declare_queue("fastapi_websocket_notifications", auto_delete=True)
    
    # Bind to notification exchange
    await queue.bind(exchange, routing_key="notification.*")

    async with queue.iterator() as queue_iter:
        async for message in queue_iter:
            async with message.process():
                payload = json.loads(message.body.decode())
                job_id = payload.get("job_id")
                if job_id:
                    await manager.broadcast_to_job(job_id, payload)
