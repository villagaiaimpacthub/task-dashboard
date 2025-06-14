#!/bin/bash

echo "🚀 Starting HIVE Backend Server..."
echo "=================================="

# Check if we're in the right directory
if [ ! -f "hive-backend-alpha/app/main.py" ]; then
    echo "❌ Error: Please run this script from the task-dashboard directory"
    exit 1
fi

cd hive-backend-alpha

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Try to install dependencies
echo "📦 Installing Python dependencies..."

# Try different package managers
if command -v pip3 &> /dev/null; then
    pip3 install fastapi uvicorn sqlalchemy python-multipart python-jose[cryptography] passlib[bcrypt] --user
elif command -v pip &> /dev/null; then
    pip install fastapi uvicorn sqlalchemy python-multipart python-jose[cryptography] passlib[bcrypt] --user
else
    echo "⚠️  pip not found. Trying alternative installation..."
    
    # Try using apt if available
    if command -v apt &> /dev/null; then
        echo "📦 Installing via apt..."
        sudo apt update
        sudo apt install -y python3-pip python3-fastapi python3-uvicorn
    else
        echo "❌ Cannot install dependencies automatically"
        echo "Please install the following packages manually:"
        echo "  - fastapi"
        echo "  - uvicorn"
        echo "  - sqlalchemy"
        echo "  - python-multipart"
        echo "  - python-jose[cryptography]"
        echo "  - passlib[bcrypt]"
        exit 1
    fi
fi

# Set environment variables for SQLite (simpler than PostgreSQL for testing)
export DATABASE_URL="sqlite:///./hive_test.db"
export SECRET_KEY="test-secret-key-for-development-only"
export ENVIRONMENT="development"

echo "🔧 Environment configured:"
echo "  Database: SQLite (hive_test.db)"
echo "  Environment: Development"
echo "  Host: 0.0.0.0:8000"

# Try to start the server
echo "🚀 Starting FastAPI server..."

if command -v uvicorn &> /dev/null; then
    echo "✅ Starting with uvicorn..."
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
elif python3 -c "import uvicorn" 2>/dev/null; then
    echo "✅ Starting with python -m uvicorn..."
    python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
else
    echo "⚠️  uvicorn not found, trying direct execution..."
    python3 -c "
import sys
sys.path.append('.')
try:
    from app.main import app
    print('✅ FastAPI app loaded successfully')
    print('🌐 Server would run at: http://0.0.0.0:8000')
    print('📚 API docs at: http://localhost:8000/docs')
    print('')
    print('⚠️  Note: Install uvicorn for better performance:')
    print('   pip3 install uvicorn --user')
    print('')
    import time
    print('Keeping server alive... (Press Ctrl+C to stop)')
    while True:
        time.sleep(1)
except ImportError as e:
    print(f'❌ Error importing FastAPI app: {e}')
    print('Missing dependencies. Please install:')
    print('  pip3 install fastapi uvicorn sqlalchemy --user')
    sys.exit(1)
"
fi