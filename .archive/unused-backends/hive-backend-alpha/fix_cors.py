from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.main import app

# Remove existing CORS middleware
for i, middleware in enumerate(app.user_middleware):
    if middleware.cls == CORSMiddleware:
        app.user_middleware.pop(i)
        break

# Add CORS middleware with explicit configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

print("CORS middleware reconfigured successfully")