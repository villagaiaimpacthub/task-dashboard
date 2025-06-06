from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.health import router as health_router
from app.api.api_v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up HIVE Backend Alpha...")
    
    # Initialize Celery (basic health check)
    try:
        from app.workers.celery_app import celery_app
        # Test Celery connection
        celery_app.control.inspect().ping()
        print("Celery connection established successfully")
    except Exception as e:
        print(f"Celery connection failed: {e}")
        print("Continuing without Celery (some features may be limited)")
    
    yield
    
    # Shutdown
    print("Shutting down HIVE Backend Alpha...")


app = FastAPI(
    title="HIVE Backend Alpha",
    description="Streamlined task management and collaboration platform",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware - open for alpha testing
# Note: allow_credentials=True cannot be used with allow_origins=["*"]
# We need to explicitly list origins or disable credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=False,  # Must be False when using wildcard origins
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Include routers
app.include_router(health_router)
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "HIVE Backend Alpha API", "version": "0.1.0"}