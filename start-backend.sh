#!/usr/bin/env bash
# Auto-generated backend starter
set -euo pipefail

export HOST=0.0.0.0
export PORT="${BACKEND_PORT:-8000}"
export CORS_ORIGIN="${CORS_ORIGIN:-http://localhost:3000}"

# Common backend commands - uncomment the one you need
# python manage.py runserver 0.0.0.0:"${PORT}"  # Django
# python app.py                                  # Flask
# node server.js                                 # Node.js
# npm run dev                                    # Node.js with npm
# go run main.go                                 # Go
# cargo run                                      # Rust

printf "Backend should bind to 0.0.0.0:%s for WSL compatibility\n" "${PORT}"
printf "CORS origin set to: %s\n" "${CORS_ORIGIN}"
