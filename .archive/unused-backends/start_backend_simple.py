#!/usr/bin/env python3
"""
Simple backend startup script for testing without Docker
Uses SQLite instead of PostgreSQL for simplicity
"""

import os
import sys
import subprocess

# Add the backend directory to Python path
backend_dir = os.path.join(os.path.dirname(__file__), 'hive-backend-alpha')
sys.path.insert(0, backend_dir)

# Set environment variables for SQLite
os.environ['DATABASE_URL'] = 'sqlite:///./test.db'
os.environ['SECRET_KEY'] = 'test-secret-key-only-for-development'
os.environ['ENVIRONMENT'] = 'development'

# Change to backend directory
os.chdir(backend_dir)

# Try to run with uvicorn if available, otherwise use the built-in server
try:
    import uvicorn
    from app.main import app
    
    print("Starting HIVE Backend with uvicorn...")
    print("Access the API at: http://172.19.58.21:8000")
    print("API Documentation: http://172.19.58.21:8000/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
except ImportError:
    print("Uvicorn not found. Trying alternative method...")
    # Try running directly with Python
    try:
        from app.main import app
        import asyncio
        from hypercorn.asyncio import serve
        from hypercorn.config import Config
        
        config = Config()
        config.bind = ["0.0.0.0:8000"]
        print("Starting HIVE Backend with Hypercorn...")
        print("Access the API at: http://172.19.58.21:8000")
        asyncio.run(serve(app, config))
    except ImportError:
        print("Neither uvicorn nor hypercorn found.")
        print("Trying to run with basic ASGI server...")
        
        # Last resort - try to run the FastAPI app directly
        try:
            # Create a minimal ASGI server
            from app.main import app
            print("\nStarting HIVE Backend (basic mode)...")
            print("Access the API at: http://172.19.58.21:8000")
            print("\nNote: This is a fallback mode. For better performance, install uvicorn:")
            print("  pip install uvicorn")
            
            # Use Python's built-in HTTP server as a last resort
            subprocess.run([sys.executable, "-m", "http.server", "8000"])
        except Exception as e:
            print(f"Failed to start server: {e}")
            print("\nPlease install required dependencies:")
            print("  pip install fastapi uvicorn")