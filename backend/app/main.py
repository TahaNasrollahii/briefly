from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import os
from app.db.session import engine, Base
from app.rabbitmq import rabbitmq_client
from app.websocket import manager, listen_for_notifications

# Create uploads dir
os.makedirs("uploads", exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Initialize RabbitMQ Publisher connection
    await rabbitmq_client.connect()
    
    # Start WebSocket listener in the background
    asyncio.create_task(listen_for_notifications())
    
    yield
    
    # Cleanup
    await rabbitmq_client.close()

app = FastAPI(title="Briefly API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root
@app.get("/")
async def root():
    return {"status": "Briefly API is running"}

# WebSocket Endpoint
@app.websocket("/api/audio/{job_id}/live")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    await manager.connect(websocket, job_id)
    try:
        while True:
            # We don't expect messages from client, just keeping connection open
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, job_id)

# Routers will be included here
from app.api.routers import audio
app.include_router(audio.router, prefix="/api/audio", tags=["audio"])
