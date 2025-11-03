#!/bin/bash

echo "🚀 Starting Admin Dashboard in Development Mode..."
echo ""

# Start backend and database with docker-compose
echo "🔨 Starting PostgreSQL and Backend API..."
docker-compose up -d postgres backend

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if backend is running
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ Backend API is ready!"
else
    echo "⚠️  Backend may still be starting up..."
fi

echo ""
echo "📊 Services running:"
echo "   - PostgreSQL: localhost:5433"
echo "   - Backend API: http://localhost:5001/api"
echo ""
echo "🎨 Starting Frontend Development Server..."
echo ""

# Start the frontend dev server
npm run dev
