#!/bin/bash
# Startup script for backend container with database initialization

echo "========================================"
echo "🚀 BACKEND CONTAINER STARTUP"
echo "========================================"

# Set environment variables if needed
export QDRANT_HOST=${QDRANT_HOST:-localhost}
export QDRANT_PORT=${QDRANT_PORT:-6333}

# For Docker environment, use container names
if [ "$DOCKER_ENV" = "true" ]; then
    export QDRANT_HOST=hotelorderbot-qdrant
fi

echo "📍 Qdrant configuration:"
echo "   Host: $QDRANT_HOST"
echo "   Port: $QDRANT_PORT"

# Initialize database (ingest menu with embeddings)
echo ""
echo "🗄️ Initializing database..."
python3 /app/backend/app/database/initialize_db.py

# Check if initialization was successful
if [ $? -eq 0 ]; then
    echo "✅ Database initialized successfully"
else
    echo "⚠️ Database initialization failed, but continuing..."
fi

# Start the main application
echo ""
echo "🌐 Starting backend service..."
cd /app/backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload