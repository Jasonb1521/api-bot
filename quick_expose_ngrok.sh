#!/bin/bash

# Quick script to expose Hotel Order Bot to internet using Ngrok

echo "=========================================="
echo "Hotel Order Bot - Internet Exposure"
echo "Using Ngrok Tunnel"
echo "=========================================="
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "📥 Ngrok not found. Installing..."
    echo ""

    cd /tmp
    wget -q https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
    tar xzf ngrok-v3-stable-linux-amd64.tgz
    sudo mv ngrok /usr/local/bin/
    rm ngrok-v3-stable-linux-amd64.tgz

    echo "✅ Ngrok installed"
    echo ""
fi

# Check if authtoken is configured
if ! ngrok config check &> /dev/null; then
    echo "🔑 Ngrok auth token not configured"
    echo ""
    echo "Please follow these steps:"
    echo "1. Go to: https://dashboard.ngrok.com/signup"
    echo "2. Sign up (free)"
    echo "3. Copy your authtoken"
    echo "4. Run: ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Check if frontend is running
if ! docker ps | grep -q hotelorderbot-frontend; then
    echo "⚠️  Warning: Frontend container not running!"
    echo ""
    read -p "Start frontend now? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Starting frontend..."
        cd /app
        docker-compose up -d frontend
        sleep 3
    else
        echo "Please start frontend first: docker-compose up -d frontend"
        exit 1
    fi
fi

echo "✅ Frontend is running"
echo ""

echo "🌐 Starting Ngrok tunnel..."
echo ""
echo "Exposing HTTPS port 443 to the internet..."
echo ""
echo "=========================================="
echo "IMPORTANT:"
echo "- Keep this terminal window open"
echo "- Press Ctrl+C to stop the tunnel"
echo "- Your public URL will appear below"
echo "=========================================="
echo ""

# Start ngrok
ngrok http https://localhost:443 --host-header=rewrite
