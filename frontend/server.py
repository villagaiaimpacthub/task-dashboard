#!/usr/bin/env python3
"""Simple HTTP server for HIVE frontend development."""

import http.server
import socketserver
import os
import sys
from pathlib import Path

# Set the directory to serve files from
FRONTEND_DIR = Path(__file__).parent
PORT = 3000

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Request handler with CORS support for development."""
    
    def end_headers(self):
        # Add CORS headers for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        # Custom log format
        print(f"[{self.date_time_string()}] {format % args}")

def main():
    """Start the development server."""
    # Change to frontend directory
    os.chdir(FRONTEND_DIR)
    
    try:
        with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
            print("=" * 60)
            print("🚀 HIVE Frontend Development Server")
            print("=" * 60)
            print(f"📱 Frontend URL: http://localhost:{PORT}")
            print(f"🔗 Backend URL: http://localhost:8000")
            print(f"📁 Serving from: {FRONTEND_DIR}")
            print("=" * 60)
            print("Press Ctrl+C to stop the server")
            print()
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        sys.exit(0)
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Port {PORT} is already in use")
            print(f"💡 Try a different port or stop the existing server")
        else:
            print(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()