from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class AudioFile(Base):
    __tablename__ = "audio_files"
    id = Column(String, primary_key=True, default=generate_uuid)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    job = relationship("ProcessingJob", back_populates="audio_file", uselist=False)

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"
    id = Column(String, primary_key=True, default=generate_uuid)
    audio_file_id = Column(String, ForeignKey("audio_files.id"), unique=True)
    status = Column(String, default="uploaded") # uploaded, queued, chunking, transcribing, merging, summarizing, completed, failed
    progress = Column(Float, default=0.0)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    audio_file = relationship("AudioFile", back_populates="job")
    chunks = relationship("AudioChunk", back_populates="job", cascade="all, delete-orphan")
    transcript = relationship("Transcript", back_populates="job", uselist=False, cascade="all, delete-orphan")
    summary = relationship("Summary", back_populates="job", uselist=False, cascade="all, delete-orphan")

class AudioChunk(Base):
    __tablename__ = "audio_chunks"
    id = Column(String, primary_key=True, default=generate_uuid)
    job_id = Column(String, ForeignKey("processing_jobs.id"))
    chunk_index = Column(Integer, nullable=False)
    file_path = Column(String, nullable=False)
    status = Column(String, default="pending") # pending, processing, completed, failed
    transcript_text = Column(Text, nullable=True)
    
    job = relationship("ProcessingJob", back_populates="chunks")

class Transcript(Base):
    __tablename__ = "transcripts"
    id = Column(String, primary_key=True, default=generate_uuid)
    job_id = Column(String, ForeignKey("processing_jobs.id"), unique=True)
    full_text = Column(Text, nullable=False)
    
    job = relationship("ProcessingJob", back_populates="transcript")

class Summary(Base):
    __tablename__ = "summaries"
    id = Column(String, primary_key=True, default=generate_uuid)
    job_id = Column(String, ForeignKey("processing_jobs.id"), unique=True)
    structured_data = Column(JSON, nullable=False) # Stores summary, action items, topics, etc.
    
    job = relationship("ProcessingJob", back_populates="summary")
