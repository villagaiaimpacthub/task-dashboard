#!/bin/bash

echo "🛑 Stopping HIVE Task Dashboard Services"
echo "========================================"

# Kill processes on our standard ports
echo "🔪 Killing processes on ports 8000 and 3000..."

# Kill backend (port 8000)
BACKEND_PIDS=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$BACKEND_PIDS" ]; then
    echo "🔧 Stopping backend processes: $BACKEND_PIDS"
    echo "$BACKEND_PIDS" | xargs kill -9
else
    echo "⚪ No backend processes found on port 8000"
fi

# Kill frontend (port 3000)  
FRONTEND_PIDS=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$FRONTEND_PIDS" ]; then
    echo "🎨 Stopping frontend processes: $FRONTEND_PIDS"
    echo "$FRONTEND_PIDS" | xargs kill -9
else
    echo "⚪ No frontend processes found on port 3000"
fi

# Also kill any python processes that might be our services
echo "🐍 Cleaning up any remaining Python service processes..."
pkill -f "simple_backend.py" 2>/dev/null || true
pkill -f "simple_server.py" 2>/dev/null || true

echo ""
echo "✅ All services stopped"