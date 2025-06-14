#!/bin/bash
# Export environment variables for HIVE development

export BACKEND_URL=http://172.19.58.21:8000
export FRONTEND_URL=http://172.19.58.21:3000  
export VITE_API_URL=http://172.19.58.21:8000
export REACT_APP_API_URL=http://172.19.58.21:8000
export API_URL=http://172.19.58.21:8000/api
export WSL_IP=172.19.58.21
export BACKEND_PORT=8000
export FRONTEND_PORT=3000

echo "✅ Environment variables exported:"
echo "  BACKEND_URL: $BACKEND_URL"
echo "  FRONTEND_URL: $FRONTEND_URL"
echo "  VITE_API_URL: $VITE_API_URL"
echo "  WSL_IP: $WSL_IP"