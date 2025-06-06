#!/bin/bash

# HIVE Alpha Deployment Script
# Quick deployment for testing the complete system

set -e

echo "🚀 HIVE Alpha Deployment Starting..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -d "hive-backend-alpha" ] || [ ! -d "hive-frontend" ]; then
    echo -e "${RED}❌ Error: Please run this script from the task-dashboard directory${NC}"
    echo "Expected structure:"
    echo "  task-dashboard/"
    echo "  ├── hive-backend-alpha/"
    echo "  ├── hive-frontend/"
    echo "  └── deploy-alpha.sh"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 is required but not installed${NC}"
    exit 1
fi

if ! command_exists poetry; then
    echo -e "${YELLOW}⚠️  Poetry not found. Installing Poetry...${NC}"
    curl -sSL https://install.python-poetry.org | python3 -
    export PATH="$HOME/.local/bin:$PATH"
fi

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is required but not installed${NC}"
    echo "Please install Docker and try again"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose is required but not installed${NC}"
    echo "Please install Docker Compose and try again"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Setup backend
echo -e "${BLUE}🔧 Setting up backend...${NC}"
cd hive-backend-alpha

# Install Python dependencies
echo "📦 Installing Python dependencies..."
poetry install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    
    # Generate random secrets
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    JWT_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    
    # Update .env with generated secrets
    sed -i "s/your-secret-key-change-in-production/$SECRET_KEY/" .env
    sed -i "s/your-jwt-secret-key-change-in-production/$JWT_SECRET_KEY/" .env
    
    echo -e "${GREEN}✅ .env file created with secure secrets${NC}"
fi

# Start database services
echo "🗄️  Starting database services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Initialize database
echo "🔧 Initializing database..."
poetry run python scripts/init_db.py

# Generate initial migration if needed
echo "📊 Setting up database migrations..."
if [ ! -d "migrations/versions" ] || [ -z "$(ls -A migrations/versions)" ]; then
    poetry run alembic revision --autogenerate -m "initial_tables"
fi
poetry run alembic upgrade head

echo -e "${GREEN}✅ Backend setup complete${NC}"

# Go back to project root
cd ..

# Create startup scripts
echo -e "${BLUE}📝 Creating startup scripts...${NC}"

# Backend startup script
cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting HIVE Backend Services..."

cd hive-backend-alpha

# Start Celery worker in background
echo "🔄 Starting Celery worker..."
poetry run celery -A app.workers.celery_app worker --loglevel=info --detach

# Start FastAPI server
echo "🌐 Starting FastAPI server..."
echo "Backend will be available at: http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
EOF

# Frontend startup script
cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "🌐 Starting HIVE Frontend..."

cd hive-frontend

echo "Frontend will be available at: http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo ""
python3 server.py
EOF

# Complete startup script
cat > start-hive.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Complete HIVE System..."
echo "=================================="

# Check if backend services are running
cd hive-backend-alpha
if ! docker-compose ps | grep -q "Up"; then
    echo "🗄️  Starting database services..."
    docker-compose up -d
    sleep 5
fi
cd ..

# Start backend in background
echo "🔧 Starting backend services..."
./start-backend.sh &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 10

# Start frontend in background
echo "🌐 Starting frontend..."
./start-frontend.sh &
FRONTEND_PID=$!

# Wait a moment for services to start
sleep 5

echo ""
echo "🎉 HIVE System Started Successfully!"
echo "=================================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend:  http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap 'echo -e "\n🛑 Stopping HIVE services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT
wait
EOF

# Stop script
cat > stop-hive.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping HIVE services..."

# Stop Python processes
pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f "celery.*worker" 2>/dev/null || true
pkill -f "python.*server.py" 2>/dev/null || true

# Stop Docker services
cd hive-backend-alpha
docker-compose down
cd ..

echo "✅ All HIVE services stopped"
EOF

# Make scripts executable
chmod +x start-backend.sh start-frontend.sh start-hive.sh stop-hive.sh

# Create test data script
cat > create-test-data.sh << 'EOF'
#!/bin/bash
echo "📊 Creating test data..."

cd hive-backend-alpha

# Create test users and tasks
poetry run python -c "
import asyncio
import sys
sys.path.append('.')

from app.database import async_session
from app.models.user import User
from app.models.task import Task

async def create_test_data():
    async with async_session() as db:
        # Create test users
        users_data = [
            ('alice@hive.com', 'Alice Johnson'),
            ('bob@hive.com', 'Bob Smith'),
            ('carol@hive.com', 'Carol Davis'),
        ]
        
        users = []
        for email, name in users_data:
            # Check if user exists
            from sqlalchemy import select
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            
            if not user:
                user = User(email=email)
                user.set_password('password123')
                user.is_online = True
                db.add(user)
                users.append(user)
                print(f'Created user: {email}')
            else:
                users.append(user)
                print(f'User exists: {email}')
        
        await db.commit()
        
        # Refresh to get IDs
        for user in users:
            await db.refresh(user)
        
        # Create test tasks
        tasks_data = [
            ('Coordinate Seed Exchange Network', 'Link heritage seed collectors across bioregions to prevent genetic erosion.', 'available'),
            ('Solar Microgrid Design', 'Design distributed energy system for rural community partnership.', 'available'),
            ('Marine Plastic Cleanup Protocol', 'Develop standardized cleanup methodology for coastal communities.', 'in_progress'),
            ('Waste-to-Resource Network', 'Map material flows between manufacturers for closed-loop cycles.', 'available'),
            ('Mycorrhizal Network Study', 'Document fungal network patterns across restored forest sites.', 'completed'),
        ]
        
        for i, (title, description, status) in enumerate(tasks_data):
            # Check if task exists
            result = await db.execute(select(Task).where(Task.title == title))
            task = result.scalar_one_or_none()
            
            if not task:
                owner = users[i % len(users)]
                task = Task(
                    title=title,
                    description=description,
                    status=status,
                    owner_id=owner.id
                )
                if status == 'in_progress' and len(users) > 1:
                    task.assignee_id = users[(i + 1) % len(users)].id
                
                db.add(task)
                print(f'Created task: {title}')
            else:
                print(f'Task exists: {title}')
        
        await db.commit()
        print('✅ Test data creation complete!')

asyncio.run(create_test_data())
"

cd ..
echo "✅ Test data created successfully!"
echo "You can now login with:"
echo "  📧 Email: alice@hive.com"
echo "  🔑 Password: password123"
echo ""
echo "Or: bob@hive.com / carol@hive.com with password123"
EOF

chmod +x create-test-data.sh

# Final setup
echo -e "${BLUE}🎯 Final setup...${NC}"

# Create a quick health check
cat > health-check.sh << 'EOF'
#!/bin/bash
echo "🔍 HIVE Health Check"
echo "==================="

# Check backend
echo -n "Backend API: "
if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ Not responding"
fi

# Check frontend
echo -n "Frontend: "
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ Not responding"
fi

# Check database
echo -n "Database: "
cd hive-backend-alpha
if docker-compose ps postgres | grep -q "Up"; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi

# Check Redis
echo -n "Redis: "
if docker-compose ps redis | grep -q "Up"; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi
cd ..
EOF

chmod +x health-check.sh

echo ""
echo -e "${GREEN}🎉 HIVE Alpha Deployment Complete!${NC}"
echo "=================================="
echo ""
echo -e "${YELLOW}📋 Quick Start Commands:${NC}"
echo "  🚀 Start everything:    ./start-hive.sh"
echo "  🛑 Stop everything:     ./stop-hive.sh"
echo "  🔍 Check health:        ./health-check.sh"
echo "  📊 Create test data:    ./create-test-data.sh"
echo ""
echo -e "${YELLOW}🌐 Access URLs:${NC}"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}🎯 Next Steps:${NC}"
echo "  1. Run: ./start-hive.sh"
echo "  2. Run: ./create-test-data.sh (optional)"
echo "  3. Open: http://localhost:3000"
echo "  4. Login with: alice@hive.com / password123"
echo ""
echo -e "${GREEN}✨ Ready to test HIVE!${NC}"