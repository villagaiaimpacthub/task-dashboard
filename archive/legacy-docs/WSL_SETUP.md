# WSL Setup Guide

If you're running this project in WSL (Windows Subsystem for Linux) and accessing it from a Windows browser, you need to use your WSL IP address instead of localhost.

## Finding Your WSL IP

Run this command in WSL:
```bash
hostname -I | awk '{print $1}'
```

## Starting the Backend

Instead of using localhost, use your WSL IP:
```bash
poetry run uvicorn app.main:app --host YOUR_WSL_IP --port 8000
```

Example:
```bash
poetry run uvicorn app.main:app --host 172.19.58.21 --port 8000
```

## Accessing the Application

1. Frontend: http://localhost:3000 (works normally)
2. Backend: Use your WSL IP instead of localhost

The frontend will automatically detect if you're using a non-localhost address and adjust the API endpoints accordingly.