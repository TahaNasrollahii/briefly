# Briefly 🚀
*An AI-powered Audio Transcription & Summarization Platform*

Briefly is a modern full-stack application that effortlessly transcribes and summarizes audio files (like meetings, lectures, or interviews). Leveraging the blazing-fast **Groq API**, Briefly provides high-quality transcripts, action items, key decisions, and topic extractions in seconds.

The platform is built on a highly scalable microservices architecture utilizing Celery, RabbitMQ, and Redis for distributed background processing, ensuring it can handle large files and heavy workloads without breaking a sweat.

## ✨ Features
- **🎙️ Lightning-Fast Transcription**: Uses Groq's Whisper models for incredibly fast and accurate speech-to-text.
- **🧠 Intelligent Summaries**: Automatically generates concise summaries, action items, and key decisions using LLaMA models.
- **⚡ Real-time Progress Tracking**: Live updates pushed directly to the frontend via WebSockets so you always know the status of your processing job.
- **🏗️ Resilient Microservices**: Dedicated Celery workers for Audio Chunking, AI processing, and Notifications.
- **🎨 Beautiful UI**: Crafted with Next.js, Tailwind CSS v4, and Framer Motion for a fluid, dynamic user experience.

## 🛠️ Tech Stack
- **Frontend**: Next.js 16, React 19, Tailwind CSS v4, Framer Motion, Lucide Icons
- **Backend Core**: Python, FastAPI, SQLAlchemy, Asyncpg, Uvicorn
- **Task Queue & Message Broker**: Celery, RabbitMQ, Redis
- **Database**: PostgreSQL 15
- **AI Engine**: Groq API (`whisper-large-v3` & `llama3-70b-8192`)
- **Infrastructure**: Docker & Docker Compose

## 🚀 Getting Started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose installed.
- A valid [Groq API Key](https://console.groq.com/keys).

### Installation
1. **Clone the repository** (if applicable) and navigate to the project directory:
   ```bash
   cd briefly
   ```

2. **Configure your environment variables**:
   Create a `.env` file in the root directory (you can copy from `.env.example` if it exists) and add your Groq API key:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Build and start the containers**:
   Launch the entire stack using Docker Compose:
   ```bash
   docker-compose up --build -d
   ```

4. **Access the application**:
   - Frontend (Web UI): http://localhost:3000
   - Backend API Docs (Swagger UI): http://localhost:8000/docs
   - RabbitMQ Management Console: http://localhost:15672 (User: `briefly`, Password: `brieflypassword`)

## 🏗️ Architecture Overview
When an audio file is uploaded:
1. The **FastAPI Backend** receives the file, creates a job in PostgreSQL, and enqueues an audio processing task.
2. The **Audio Worker** (`audio_tasks.py`) intercepts the job, chunks the audio using `pydub`, and streams it to the Groq Whisper API for transcription. It then merges the text.
3. The **AI Worker** (`ai_tasks.py`) receives the merged transcript and queries Groq's LLaMA model to extract summaries, topics, and action items.
4. The **Notification Worker** manages real-time status updates via WebSockets back to the Next.js frontend.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📝 License
This project is licensed under the MIT License.
