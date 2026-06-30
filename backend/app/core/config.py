import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Briefly API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://briefly:brieflypassword@localhost:5432/brieflydb")
    RABBITMQ_URL: str = os.getenv("RABBITMQ_URL", "amqp://briefly:brieflypassword@localhost:5672//")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    # Configs
    MAX_UPLOAD_SIZE_MB: int = 50
    MAX_AUDIO_DURATION_MINS: int = 30
    WHISPER_MODEL: str = "base" # can be 'small'

    class Config:
        env_file = ".env"

settings = Settings()
