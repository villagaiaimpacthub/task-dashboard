#!/bin/bash

echo "🚀 Starting HIVE Task Dashboard Services"
echo "======================================="

# Navigate to project directory
cd /mnt/c/task-dashboard

# Kill existing processes on our ports
echo "🔪 Killing existing processes on ports 8000 and 3000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Wait a moment for processes to fully terminate
sleep 2

# Start backend on port 8000
echo "🔧 Starting backend on port 8000..."
python3 simple_backend.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Test backend health
echo "💓 Testing backend health..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is running on port 8000"
else
    echo "❌ Backend failed to start on port 8000"
    exit 1
fi

# Start frontend on port 3000
echo "🎨 Starting frontend on port 3000..."
cd hive-frontend
python3 simple_server.py &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 2

# Test frontend
echo "🌐 Testing frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running on port 3000"
else
    echo "❌ Frontend failed to start on port 3000"
    exit 1
fi

echo ""
echo "🎉 All services started successfully!"
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend:  http://localhost:8000"
echo "💓 Health:   http://localhost:8000/health"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "⏹️  To stop services: kill $BACKEND_PID $FRONTEND_PID"