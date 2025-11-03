# 🏨 HotelBot - AI-Powered Voice Ordering System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://reactjs.org/)

A production-ready, end-to-end AI voice ordering system for hotels and restaurants featuring real-time speech recognition, intelligent conversation handling with tool calling, and text-to-speech synthesis. Built with a microservices architecture supporting English and Tamil languages.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

HotelBot is an enterprise-grade voice-based ordering system that leverages cutting-edge AI technologies to provide a seamless, natural language ordering experience. The system processes real-time audio streams, understands customer intent in multiple languages, retrieves relevant menu items using semantic search, and executes orders through intelligent tool calling.

### Use Cases

- **Restaurant Ordering**: Voice-based food ordering with real-time conversation
- **Hotel Room Service**: In-room voice assistant for guest services
- **QSR Kiosks**: Self-service voice ordering terminals
- **Drive-Through Systems**: Automated voice ordering for quick-service restaurants

---

## 🏗️ Architecture

HotelBot follows a **microservices architecture** with containerized services orchestrated via Docker Compose. The system is designed for scalability, fault tolerance, and easy deployment.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌──────────────────┐              ┌─────────────────────┐     │
│  │  Frontend UI     │              │  Admin Dashboard    │     │
│  │  (React + Vite)  │              │  (React + Node.js)  │     │
│  └────────┬─────────┘              └──────────┬──────────┘     │
└───────────┼────────────────────────────────────┼────────────────┘
            │                                    │
            │ WebSocket (Audio)                  │ REST API
            │                                    │
┌───────────┼────────────────────────────────────┼────────────────┐
│           │         Backend Services           │                │
│  ┌────────▼─────────────────────────────────────▼──────────┐   │
│  │            FastAPI Backend (Python)                      │   │
│  │  • WebSocket Handler    • Tool Execution                │   │
│  │  • RAG Pipeline         • Order Management              │   │
│  └──┬────┬────┬────┬────────────────────────┬──────────────┘   │
│     │    │    │    │                        │                  │
└─────┼────┼────┼────┼────────────────────────┼──────────────────┘
      │    │    │    │                        │
      │    │    │    │                        │
┌─────┼────┼────┼────┼────────────────────────┼──────────────────┐
│     │    │    │    │     AI Services        │                  │
│  ┌──▼──┐ │ ┌──▼──┐ │ ┌────▼─────┐      ┌───▼────┐            │
│  │ VAD │ │ │ ASR │ │ │   TTS    │      │  vLLM  │            │
│  │     │ │ │     │ │ │          │      │  (GPU) │            │
│  └─────┘ │ └─────┘ │ └──────────┘      └────────┘            │
│  Silero  │ Triton  │   Triton          Tool Calling           │
│          │ GPU     │   GPU             OpenAI API             │
│          │         │                   Compatible             │
└──────────┼─────────┼───────────────────────────────────────────┘
           │         │
┌──────────┼─────────┼───────────────────────────────────────────┐
│          │         │     Data Layer                            │
│     ┌────▼────┐   ┌▼──────────┐      ┌──────────────┐         │
│     │ Qdrant  │   │PostgreSQL │      │  Printer     │         │
│     │ Vector  │   │  Orders   │      │  (ESC/POS)   │         │
│     │  Store  │   │  Menu     │      │              │         │
│     └─────────┘   └───────────┘      └──────────────┘         │
└───────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Audio Capture**: Client captures audio and streams via WebSocket
2. **VAD Processing**: Silero VAD detects speech segments in real-time
3. **Speech Recognition**: Sarvam AI STT streaming API transcribes audio to text (Tamil/English)
4. **Semantic Search**: Qdrant retrieves relevant menu items using embeddings
5. **LLM Processing**: Groq API generates streaming responses with tool calling support
6. **Tool Execution**: Backend executes order tools (add, modify, confirm)
7. **TTS Generation**: Sarvam AI TTS streaming API synthesizes response in target language
8. **Audio Streaming**: Sentence-by-sentence audio streaming to client for ultra-fast playback

---

## ✨ Key Features

### 🎙️ Real-Time Voice Processing
- **Voice Activity Detection (VAD)**: Silero VAD with configurable thresholds
- **Automatic Speech Recognition (ASR)**: Sarvam AI streaming STT API for Tamil/English
- **Text-to-Speech (TTS)**: Sarvam AI streaming TTS API with natural-sounding voices
- **WebSocket Streaming**: Low-latency bidirectional audio streaming
- **Sentence-Level Streaming**: TTS processes and streams each sentence immediately for faster response

### 🤖 AI-Powered Intelligence
- **Retrieval Augmented Generation (RAG)**: Semantic menu search with Qdrant vector DB
- **Tool Calling**: Groq LLM-driven order management with function calling
- **Streaming LLM Responses**: Real-time text generation with Groq API
- **Multilingual Embeddings**: Google EmbeddingGemma-300M for cross-lingual search
- **Context-Aware Responses**: Maintains conversation history for natural dialogue
- **Meal Period Filtering**: Time-based menu item filtering (breakfast, lunch, dinner)

### 📦 Order Management
- **Real-time Order Tracking**: Live order status updates
- **Inventory Management**: Automatic stock updates
- **Kitchen Printing**: ESC/POS thermal printer integration
- **Order Confirmation Flow**: Multi-step confirmation with audio feedback
- **Order History**: Complete order audit trail

### 📊 Admin Dashboard
- **Menu Management**: CRUD operations for menu items
- **Order Analytics**: Real-time order tracking and reporting
- **Inventory Control**: Stock management and alerts
- **User Management**: Admin access control

### 🔧 Developer Experience
- **Docker Compose**: One-command deployment
- **Hot Reload**: Development mode with code hot-reloading
- **Comprehensive Logging**: Structured logging with multiple levels
- **Health Checks**: Service health monitoring
- **Environment Configuration**: Flexible .env configuration

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.1 | UI framework |
| Vite | 7.1.7 | Build tool & dev server |
| TailwindCSS | 4.1.14 | Utility-first CSS framework |
| GSAP | 3.12.5 | Animation library |
| OGL | 1.0.11 | WebGL rendering library |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | Runtime environment |
| FastAPI | 0.115.5 | Web framework |
| Uvicorn | 0.32.1 | ASGI server |
| WebSockets | 14.1 | Real-time communication |
| AsyncPG | 0.29.0 | PostgreSQL async driver |
| Python-ESCPOS | 3.0 | Thermal printer driver |

### AI/ML Services
| Technology | Purpose |
|------------|---------|
| Groq API | LLM inference with streaming (llama-3.3-70b-versatile) |
| Sarvam AI API | Speech-to-Text & Text-to-Speech streaming |
| Silero VAD | Voice activity detection |
| Qdrant | Vector database for RAG |
| Sentence Transformers | Embedding generation |
| Google EmbeddingGemma-300M | Multilingual embeddings |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Service orchestration |
| PostgreSQL | Relational database |
| Nginx | Reverse proxy (in frontend) |
| NVIDIA Docker Runtime | GPU support |

### Admin Dashboard
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Backend runtime |
| Express | 4.18.2 | Web framework |
| PostgreSQL | 15 | Database driver |

---

## 💻 System Requirements

### Minimum Requirements
- **CPU**: 4-core processor
- **RAM**: 8GB (16GB recommended)
- **Storage**: 10GB free space
- **OS**: Linux, macOS, or Windows with WSL2

### Software Requirements
- Docker 24.0+
- Docker Compose 2.0+

### Network Requirements
- Ports: 80, 443, 5000, 5432, 6333, 8080
- Internet connection for API access (Groq, Sarvam AI)

---

## 📥 Installation

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/hotelbot.git
cd hotelbot
```

### 2. Environment Setup
Create a `.env` file in the root directory with your API keys:

```bash
# Groq API (LLM Service)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Sarvam AI (STT & TTS Service)
SARVAM_API_KEY=your_sarvam_api_key_here

# Gemini AI (Alternative LLM)
GEMINI_API_KEY=your_gemini_api_key_here

# Hugging Face Token (for embedding models)
HF_TOKEN=your_huggingface_token_here

# Database Configuration
DB_HOST=hotelorderbot-postgres
DB_PORT=5432
DB_NAME=hotelbot
DB_USER=postgres
DB_PASSWORD=postgres123
```

**Getting API Keys:**
- **Groq**: Get your free API key from [console.groq.com](https://console.groq.com)
- **Sarvam AI**: Sign up at [sarvam.ai](https://www.sarvam.ai) for Indian language TTS/STT
- **Gemini** (optional): Get from [ai.google.dev](https://ai.google.dev)
- **Hugging Face**: Create token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

### 3. Build and Start Services
```bash
# Build all containers
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Initialize Database
The database schema is automatically initialized on first run via `/docker-entrypoint-initdb.d/init.sql`.

### 5. Verify Installation
```bash
# Check service health
curl http://localhost:8080/health

# Expected output:
# {
#   "status": "healthy",
#   "vad_loaded": true,
#   "vector_store_ready": true,
#   "llm_ready": true,
#   "database_ready": true
# }
```

---

## ⚙️ Configuration

### Environment Variables

#### Backend Service
```bash
GROQ_API_KEY          # Groq API key for LLM inference
GROQ_MODEL            # Groq model name (default: llama-3.3-70b-versatile)
SARVAM_API_KEY        # Sarvam AI API key for STT & TTS
HF_TOKEN              # Hugging Face authentication token (for embeddings)
DB_HOST               # PostgreSQL host
DB_PORT               # PostgreSQL port (default: 5432)
DB_NAME               # Database name
DB_USER               # Database user
DB_PASSWORD           # Database password
```

#### VAD Configuration (in `backend/app/main.py`)
```python
SAMPLE_RATE = 16000      # Audio sample rate
CHUNK_SIZE = 512         # Audio chunk size
VAD_THRESHOLD = 0.5      # Speech detection threshold (0.0-1.0)
MIN_SILENCE_MS = 500     # Silence duration before VAD stops
PRE_ROLL_MS = 300        # Audio pre-roll buffer
POST_ROLL_MS = 500       # Audio post-roll buffer
```

#### LLM Configuration
```python
temperature = 0.2        # LLM temperature for consistency
max_tokens = 100         # Max response tokens
max_iterations = 5       # Max tool calling iterations
```

### Docker Compose Services

| Service | Container Name | Ports |
|---------|---------------|-------|
| Frontend | hotelorderbot-frontend | 80, 443 |
| Backend | hotelorderbot-backend | 8080 |
| Qdrant | hotelorderbot-qdrant | 6333, 6334 |
| PostgreSQL | hotelorderbot-postgres | 5432 |
| Admin Backend | hotelorderbot-admin-backend | 5000 |

---

## 🚀 Usage

### 1. Access Frontend
Navigate to `http://localhost` in your browser.

### 2. Start Voice Ordering
- Click the microphone button to start
- Speak your order naturally in Tamil or English
- The system will:
  - Transcribe your speech in real-time
  - Search the menu semantically
  - Generate intelligent responses
  - Synthesize audio feedback
  - Execute order tools as needed

### 3. Admin Dashboard
Navigate to `http://localhost:5000` to access:
- Menu item management
- Order tracking
- Inventory updates
- Analytics dashboard

### 4. API Endpoints

#### Backend API
```bash
# Health check
GET http://localhost:8080/health

# WebSocket audio streaming
WS ws://localhost:8080/ws/audio
```

#### Admin API
```bash
# Get all menu items
GET http://localhost:5000/api/menu

# Add menu item
POST http://localhost:5000/api/menu
Content-Type: application/json
{
  "name": "Idli",
  "category": "breakfast",
  "price": 40,
  "quantity": 100
}

# Get all orders
GET http://localhost:5000/api/orders

# Update order status
PUT http://localhost:5000/api/orders/:id
```

---

## 📁 Project Structure

```
hotelbot/
├── Admin-Dash/              # Admin dashboard application
│   ├── admin-dashboard/     # React frontend
│   └── backend/             # Node.js/Express backend
│       ├── server.js        # Express server
│       └── db.js            # PostgreSQL client
├── Asr/                     # ASR service
│   ├── model_repository/    # Triton model repository
│   │   └── indic_conformer/ # Tamil ASR model
│   ├── download_models.py   # Model download script
│   └── Dockerfile
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py          # FastAPI application entry point
│   │   ├── services/        # Business logic services
│   │   │   ├── llm_service.py          # vLLM interaction
│   │   │   ├── tts_service.py          # TTS client
│   │   │   ├── vector_store_service.py # Qdrant RAG
│   │   │   └── database_service.py     # PostgreSQL ops
│   │   ├── tools/           # LLM tool definitions
│   │   │   └── order_tools.py          # Order management tools
│   │   └── config/
│   │       └── prompts.py   # System prompts
│   ├── printing/            # Thermal printer integration
│   │   └── print_bill.py    # ESC/POS printing
│   ├── scripts/
│   │   ├── init_menu.sql    # Database initialization
│   │   └── migrate_menu.py  # Database migrations
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile
├── frontend/                # React frontend
│   ├── Hotel-Bot-UI/
│   │   ├── src/             # React components
│   │   ├── vite.config.js   # Vite configuration
│   │   └── package.json
│   └── Dockerfile
├── tts/                     # TTS service
│   ├── model_repository/    # Triton model repository
│   │   └── indic_parler_tts/# Tamil TTS model
│   └── Dockerfile
├── Vllm/                    # vLLM service (optional, can use remote)
│   └── Dockerfile
├── remote_vllm/             # Remote vLLM configuration
├── docker-compose.yaml      # Service orchestration
├── .env                     # Environment variables
├── .gitignore
└── README.md
```

---

## 🌐 Deployment

### Production Deployment

#### 1. SSL/TLS Configuration
Update `frontend/Dockerfile` to include your SSL certificates:
```dockerfile
COPY your-cert.pem /etc/nginx/ssl/
COPY your-key.pem /etc/nginx/ssl/
```

#### 2. Environment Variables
Set production environment variables in `.env`:
```bash
VLLM_URL=https://your-production-vllm-server.com
DB_PASSWORD=strong_production_password
```

#### 3. Scale Services
```bash
# Scale backend instances
docker-compose up -d --scale backend=3
```

#### 4. Monitoring
- Implement health check monitoring
- Set up log aggregation (ELK stack, Datadog, etc.)
- Configure alerts for service failures

### Cloud Deployment

#### AWS
- Use ECS/EKS for container orchestration
- RDS for PostgreSQL
- S3 for model storage
- EC2 instances with GPU (p3/p4 instances)

#### GCP
- Use GKE for Kubernetes
- Cloud SQL for PostgreSQL
- Cloud Storage for models
- Compute Engine with GPU

#### Azure
- Use AKS for Kubernetes
- Azure Database for PostgreSQL
- Blob Storage for models
- GPU VMs (NC/ND series)

### Exposing to Internet
Use the provided scripts for quick exposure:

```bash
# Using ngrok
./quick_expose_ngrok.sh

# Or follow the detailed guide
cat expose_to_internet.md
```

---

## 📚 API Documentation

### WebSocket Protocol

#### Client → Server Messages

**Audio Stream**
```javascript
// Send raw audio bytes (Int16 PCM, 16kHz)
websocket.send(audioBuffer);
```

**Configuration**
```javascript
websocket.send(JSON.stringify({
  type: "config",
  language: "ta"  // or "en"
}));
```

**Reset Conversation**
```javascript
websocket.send(JSON.stringify({
  type: "reset"
}));
```

#### Server → Client Messages

**Connection Status**
```json
{
  "type": "status",
  "message": "connected"
}
```

**Transcription**
```json
{
  "type": "transcription",
  "text": "இட்லி இரண்டு வேணும்"
}
```

**Bot Response**
```json
{
  "type": "bot_response",
  "text": "சரி, இட்லி இரண்டு சேர்த்துட்டேன்"
}
```

**Audio Stream Start**
```json
{
  "type": "audio_stream_start",
  "total_sentences": 3
}
```

**Sentence Audio**
```json
{
  "type": "sentence_audio_start",
  "sentence_index": 0,
  "total_size": 48000,
  "sentence_text": "சரி, இட்லி இரண்டு."
}
```
_Followed by binary audio data_

```json
{
  "type": "sentence_audio_complete",
  "sentence_index": 0
}
```

**Order Confirmation**
```json
{
  "type": "order_confirmed",
  "order_id": 123,
  "total": 80.0,
  "items": [
    {"name": "Idli", "quantity": 2, "price": 40}
  ],
  "message": "ஆர்டர் #123 கன்ஃபர்ம் ஆச்சு!"
}
```

**ASR Control**
```json
{
  "type": "asr_pause",
  "reason": "order_processing"
}

{
  "type": "asr_resume",
  "reason": "ready_for_more"
}
```

---

## 🔧 Development

### Running in Development Mode

```bash
# Backend with hot reload
cd backend
docker-compose up backend

# Frontend dev server
cd frontend
npm run dev

# Admin dashboard dev server
cd Admin-Dash/admin-dashboard
npm run dev
```

### Testing

```bash
# Check printer connection
cd backend/printing
python check_printer_connection.py

# Test printing
python test_print.py

# Verify environment
./verify_env.sh
```

### Database Migrations

```bash
# Run migration script
docker exec -it hotelorderbot-backend python scripts/migrate_menu.py
```

---

## 🐛 Troubleshooting

### Common Issues

**1. GPU Not Detected**
```bash
# Check NVIDIA driver
nvidia-smi

# Check Docker GPU runtime
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi
```

**2. TTS Service Not Ready**
- TTS initialization can take 2-3 minutes on first run
- Check logs: `docker-compose logs -f hotelorderbot-tts`
- Increase `start_period` in healthcheck if needed

**3. Qdrant Connection Failed**
```bash
# Check Qdrant status
curl http://localhost:6333/readyz

# Restart Qdrant
docker-compose restart qdrant
```

**4. Database Connection Issues**
```bash
# Check PostgreSQL
docker exec -it hotelorderbot-postgres psql -U postgres -d hotelbot

# Verify schema
\dt
```

**5. Model Download Failures**
- Ensure `HF_TOKEN` is set correctly
- Check Hugging Face model access permissions
- Manually download models if needed

---

## 📖 Additional Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Environment Setup](IMPORTANT_ENV_SETUP.md)
- [Integration Summary](INTEGRATION_SUMMARY.md)
- [TTS Knowledge Base](TTS_INTEGRATION_KNOWLEDGE_BASE.md)
- [Packaging Instructions](PACKAGING_INSTRUCTIONS.md)
- [Internet Exposure Guide](expose_to_internet.md)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards
- Follow PEP 8 for Python code
- Use ESLint for JavaScript/React code
- Write descriptive commit messages
- Add tests for new features
- Update documentation

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Your Name** - *Initial work* - [YourGithub](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- [Triton Inference Server](https://github.com/triton-inference-server/server) for model serving
- [vLLM](https://github.com/vllm-project/vllm) for fast LLM inference
- [Qdrant](https://qdrant.tech/) for vector database
- [Silero VAD](https://github.com/snakers4/silero-vad) for voice activity detection
- [FastAPI](https://fastapi.tiangolo.com/) for the excellent web framework
- [React](https://reactjs.org/) for the frontend framework

---

## 📞 Support

For support, email support@yourcompany.com or open an issue on GitHub.

---

## 🗺️ Roadmap

- [ ] Multi-tenant support
- [ ] Mobile application (iOS/Android)
- [ ] Voice biometrics for user identification
- [ ] Advanced analytics dashboard
- [ ] Multi-restaurant chain support
- [ ] Integration with POS systems
- [ ] Support for additional languages (Hindi, Bengali, etc.)
- [ ] Voice-based payment integration
- [ ] Customer loyalty program integration
- [ ] AI-powered menu recommendations

---

**Built with ❤️ for the hospitality industry**
