#!/bin/bash
# Helper script to source environment variables for the HIVE project

echo "🔧 Loading HIVE environment variables..."

# Source the development environment file
source .env.development

# Export the key variables so they're available to child processes
export BACKEND_URL
export FRONTEND_URL
export VITE_API_URL
export REACT_APP_API_URL
export WSL_IP
export API_URL
export CORS_ORIGIN
export BACKEND_PORT
export FRONTEND_PORT

echo "✅ Environment variables loaded:"
echo "  BACKEND_URL=$BACKEND_URL"
echo "  FRONTEND_URL=$FRONTEND_URL"
echo "  WSL_IP=$WSL_IP"
echo ""
echo "To use these in your current shell session, run:"
echo "  source ./source-env.sh"