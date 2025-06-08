#!/bin/bash

# HIVE Task Dashboard - Server Management Script
# This script handles starting/stopping the development servers

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Server configuration
BACKEND_PORT=8000
FRONTEND_PORT=3000
# Load WSL IP from dev-connect environment
source .env.local 2>/dev/null || true
WSL_IP="${WSL_IP:-172.19.58.21}"

echo -e "${BLUE}🚀 HIVE Task Dashboard - Server Manager${NC}"
echo "=============================================="

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on port
kill_port() {
    local port=$1
    local pids=$(lsof -ti :$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo -e "${YELLOW}⚠️  Killing existing processes on port $port${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null
        sleep 2
    fi
}

# Function to start backend
start_backend() {
    echo -e "${BLUE}🔧 Starting Backend Server...${NC}"
    
    if check_port $BACKEND_PORT; then
        echo -e "${YELLOW}⚠️  Port $BACKEND_PORT is already in use${NC}"
        read -p "Kill existing process and restart? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill_port $BACKEND_PORT
        else
            echo -e "${RED}❌ Backend startup cancelled${NC}"
            return 1
        fi
    fi
    
    # Start backend in background
    python3 simple_backend.py > /tmp/hive_backend.log 2>&1 &
    BACKEND_PID=$!
    
    # Wait a moment and check if it started successfully
    sleep 3
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Backend server started successfully${NC}"
        echo -e "   📍 URL: http://$WSL_IP:$BACKEND_PORT"
        echo -e "   🌐 Health: http://$WSL_IP:$BACKEND_PORT/health"
        echo -e "   📋 PID: $BACKEND_PID"
        echo -e "   📄 Logs: /tmp/hive_backend.log"
        return 0
    else
        echo -e "${RED}❌ Backend server failed to start${NC}"
        echo -e "   📄 Check logs: /tmp/hive_backend.log"
        return 1
    fi
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}🌐 Starting Frontend Server...${NC}"
    
    if check_port $FRONTEND_PORT; then
        echo -e "${YELLOW}⚠️  Port $FRONTEND_PORT is already in use${NC}"
        read -p "Kill existing process and restart? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill_port $FRONTEND_PORT
        else
            echo -e "${RED}❌ Frontend startup cancelled${NC}"
            return 1
        fi
    fi
    
    # Change to frontend directory
    cd hive-frontend || {
        echo -e "${RED}❌ Frontend directory not found${NC}"
        return 1
    }
    
    # Start frontend in background
    python3 -m http.server $FRONTEND_PORT > /tmp/hive_frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # Wait a moment and check if it started successfully
    sleep 2
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Frontend server started successfully${NC}"
        echo -e "   📍 URL: http://localhost:$FRONTEND_PORT"
        echo -e "   📋 PID: $FRONTEND_PID"
        echo -e "   📄 Logs: /tmp/hive_frontend.log"
        cd ..
        return 0
    else
        echo -e "${RED}❌ Frontend server failed to start${NC}"
        echo -e "   📄 Check logs: /tmp/hive_frontend.log"
        cd ..
        return 1
    fi
}

# Function to stop servers
stop_servers() {
    echo -e "${BLUE}🛑 Stopping HIVE servers...${NC}"
    
    # Kill backend
    if check_port $BACKEND_PORT; then
        kill_port $BACKEND_PORT
        echo -e "${GREEN}✅ Backend server stopped${NC}"
    fi
    
    # Kill frontend
    if check_port $FRONTEND_PORT; then
        kill_port $FRONTEND_PORT
        echo -e "${GREEN}✅ Frontend server stopped${NC}"
    fi
    
    echo -e "${GREEN}🎯 All servers stopped${NC}"
}

# Function to show server status
show_status() {
    echo -e "${BLUE}📊 Server Status${NC}"
    echo "=================="
    
    if check_port $BACKEND_PORT; then
        echo -e "Backend:  ${GREEN}🟢 Running${NC} (http://$WSL_IP:$BACKEND_PORT)"
    else
        echo -e "Backend:  ${RED}🔴 Stopped${NC}"
    fi
    
    if check_port $FRONTEND_PORT; then
        echo -e "Frontend: ${GREEN}🟢 Running${NC} (http://localhost:$FRONTEND_PORT)"
    else
        echo -e "Frontend: ${RED}🔴 Stopped${NC}"
    fi
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}📄 Recent Server Logs${NC}"
    echo "======================="
    
    if [ -f "/tmp/hive_backend.log" ]; then
        echo -e "${YELLOW}Backend Logs (last 10 lines):${NC}"
        tail -10 /tmp/hive_backend.log
        echo
    fi
    
    if [ -f "/tmp/hive_frontend.log" ]; then
        echo -e "${YELLOW}Frontend Logs (last 10 lines):${NC}"
        tail -10 /tmp/hive_frontend.log
    fi
}

# Function to run development setup
dev_setup() {
    echo -e "${BLUE}🔧 Development Setup${NC}"
    echo "====================="
    
    # Check if we're in the right directory
    if [ ! -f "simple_backend.py" ]; then
        echo -e "${RED}❌ Run this script from the task-dashboard root directory${NC}"
        exit 1
    fi
    
    # Show current project state
    if [ -f "PROJECT_STATE.md" ]; then
        echo -e "${GREEN}📋 Current Project State:${NC}"
        head -5 PROJECT_STATE.md | grep -E "(Status|Priority)"
        echo
    fi
    
    start_backend
    if [ $? -eq 0 ]; then
        start_frontend
        if [ $? -eq 0 ]; then
            echo
            echo -e "${GREEN}🎉 Development environment ready!${NC}"
            echo "=============================================="
            echo -e "📍 Frontend: ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
            echo -e "🔧 Backend:  ${BLUE}http://$WSL_IP:$BACKEND_PORT${NC}"
            echo -e "📋 Health:   ${BLUE}http://$WSL_IP:$BACKEND_PORT/health${NC}"
            echo
            echo -e "${YELLOW}💡 Pro Tips:${NC}"
            echo "  • Use './start_servers.sh status' to check server status"
            echo "  • Use './start_servers.sh logs' to view recent logs"
            echo "  • Use './start_servers.sh stop' to stop all servers"
            echo "  • Check PROJECT_STATE.md for current todos and progress"
        fi
    fi
}

# Main script logic
case "${1:-start}" in
    "start"|"dev")
        dev_setup
        ;;
    "stop")
        stop_servers
        ;;
    "restart")
        stop_servers
        sleep 2
        dev_setup
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "help"|"-h"|"--help")
        echo "HIVE Server Manager - Usage:"
        echo "  ./start_servers.sh [command]"
        echo
        echo "Commands:"
        echo "  start, dev    Start development environment (default)"
        echo "  stop          Stop all servers"
        echo "  restart       Stop and restart all servers"
        echo "  status        Show server status"
        echo "  logs          Show recent server logs"
        echo "  help          Show this help message"
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo "Use './start_servers.sh help' for available commands"
        exit 1
        ;;
esac