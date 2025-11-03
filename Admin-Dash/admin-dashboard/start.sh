#!/bin/bash

echo "🚀 Starting Admin Dashboard with PostgreSQL and Backend..."
echo ""

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start all services
echo "🔨 Building and starting services..."
docker-compose up --build -d

echo ""
echo "✅ Admin Dashboard is starting up!"
echo ""
echo "📊 Services:"
echo "   - PostgreSQL: localhost:5433"
echo "   - Backend API: http://localhost:5001/api"
echo "   - Admin Dashboard: http://localhost:3000"
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "📝 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop all services:"
echo "   docker-compose down"
echo ""
