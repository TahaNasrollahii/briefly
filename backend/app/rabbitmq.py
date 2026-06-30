import json
import aio_pika
from app.core.config import settings

class RabbitMQClient:
    def __init__(self):
        self.connection = None
        self.channel = None

    async def connect(self):
        self.connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
        self.channel = await self.connection.channel()
        
        # Declare exchanges
        await self.channel.declare_exchange("audio.exchange", aio_pika.ExchangeType.TOPIC, durable=True)
        await self.channel.declare_exchange("processing.exchange", aio_pika.ExchangeType.TOPIC, durable=True)
        await self.channel.declare_exchange("ai.exchange", aio_pika.ExchangeType.TOPIC, durable=True)
        await self.channel.declare_exchange("notification.exchange", aio_pika.ExchangeType.TOPIC, durable=True)

    async def publish(self, exchange_name: str, routing_key: str, message: dict):
        if not self.channel:
            await self.connect()
            
        exchange = await self.channel.get_exchange(exchange_name)
        await exchange.publish(
            aio_pika.Message(
                body=json.dumps(message).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT
            ),
            routing_key=routing_key,
        )

    async def close(self):
        if self.connection:
            await self.connection.close()

rabbitmq_client = RabbitMQClient()
