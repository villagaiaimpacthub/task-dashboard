#!/usr/bin/env bash

# dev-connect.sh - Universal Frontend/Backend Connection Script
# Handles WSL networking, CORS, and automatic proxy configuration
# Usage: ./dev-connect.sh [backend_port] [frontend_port] [project_type]
# Example: ./dev-connect.sh 8000 3000 vite

set -euo pipefail

# Default configuration
BACKEND_PORT=${1:-8000}
FRONTEND_PORT=${2:-3000}
PROJECT_TYPE=${3:-"auto"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[DEV-CONNECT]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Detect if we're in WSL
detect_wsl() {
    if [ -f /proc/version ] && (grep -qi microsoft /proc/version 2>/dev/null || grep -qi wsl /proc/version 2>/dev/null); then
        printf "true"
    else
        printf "false"
    fi
}

# Get WSL IP address (Linux-internal IP, not gateway IP)
get_wsl_ip() {
    if [ "$(detect_wsl)" = "true" ]; then
        # Get the actual WSL interface IP (what Linux sees)
        local wsl_ip
        wsl_ip=$(ip addr show eth0 | grep 'inet ' | awk '{print $2}' | cut -d'/' -f1 2>/dev/null || true)
        
        # Fallback to other interface names if eth0 doesn't exist
        if [ -z "$wsl_ip" ]; then
            wsl_ip=$(ip addr show | grep -E 'inet.*eth|inet.*ens|inet.*enp' | head -1 | awk '{print $2}' | cut -d'/' -f1 2>/dev/null || true)
        fi
        
        # Final fallback to gateway method (old approach)
        if [ -z "$wsl_ip" ]; then
            wsl_ip=$(ip route show | grep -i default | awk '{ print $3}' | head -1 2>/dev/null || true)
        fi
        
        if [ -z "$wsl_ip" ]; then
            wsl_ip="172.20.144.1" # Common WSL default
        fi
        printf "%s" "$wsl_ip"
    else
        printf "localhost"
    fi
}

# Get local IP for backend binding
get_local_ip() {
    if [ "$(detect_wsl)" = "true" ]; then
        ip addr show eth0 2>/dev/null | grep "inet\b" | awk '{print $2}' | cut -d/ -f1 | head -1 || printf "127.0.0.1"
    else
        printf "127.0.0.1"
    fi
}

# Check if port is in use
check_port() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti:"$port" >/dev/null 2>&1
    elif command -v netstat >/dev/null 2>&1; then
        netstat -tuln 2>/dev/null | grep -q ":$port "
    elif command -v ss >/dev/null 2>&1; then
        ss -tuln 2>/dev/null | grep -q ":$port "
    else
        # Fallback: try to connect
        timeout 1 bash -c "exec 3<>/dev/tcp/localhost/$port && exec 3<&-" >/dev/null 2>&1
    fi
}

# Auto-detect project type
detect_project_type() {
    if [ -f "vite.config.js" ] || [ -f "vite.config.ts" ]; then
        printf "vite"
    elif [ -f "next.config.js" ] || [ -f "next.config.mjs" ]; then
        printf "next"
    elif [ -f "package.json" ] && grep -q "react-scripts" package.json 2>/dev/null; then
        printf "cra"
    elif [ -f "webpack.config.js" ]; then
        printf "webpack"
    elif [ -f "angular.json" ]; then
        printf "angular"
    else
        printf "generic"
    fi
}

# Create/update proxy configuration
setup_proxy() {
    local project_type=$1
    local backend_url=$2
    
    case $project_type in
        "vite")
            setup_vite_proxy "$backend_url"
            ;;
        "next")
            setup_next_proxy "$backend_url"
            ;;
        "cra")
            setup_cra_proxy "$backend_url"
            ;;
        "webpack")
            setup_webpack_proxy "$backend_url"
            ;;
        "angular")
            setup_angular_proxy "$backend_url"
            ;;
        *)
            setup_generic_proxy "$backend_url"
            ;;
    esac
}

setup_vite_proxy() {
    local backend_url=$1
    local config_file="vite.config.js"
    
    if [ -f "vite.config.ts" ]; then
        config_file="vite.config.ts"
    fi
    
    if [ -f "$config_file" ]; then
        # Backup original
        cp "$config_file" "${config_file}.backup"
        
        # Create new config with proxy
        cat > "$config_file" << EOF
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: $FRONTEND_PORT,
    proxy: {
      '/api': {
        target: '$backend_url',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: '$backend_url',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
EOF
        log "Updated $config_file with proxy configuration"
    else
        # Create new vite config
        cat > "vite.config.js" << EOF
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: $FRONTEND_PORT,
    proxy: {
      '/api': {
        target: '$backend_url',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
EOF
        log "Created new vite.config.js with proxy"
    fi
}

setup_next_proxy() {
    local backend_url=$1
    cat > "next.config.js" << EOF
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '$backend_url/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
EOF
    log "Updated next.config.js with proxy configuration"
}

setup_cra_proxy() {
    local backend_url=$1
    # Add proxy to package.json
    if [ -f "package.json" ]; then
        # Create backup
        cp package.json package.json.backup
        
        # Add proxy field using portable method
        if command -v node >/dev/null 2>&1; then
            node -e "
            const fs = require('fs');
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            pkg.proxy = '$backend_url';
            fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
            " 2>/dev/null || {
                warn "Node.js not found, manually add \"proxy\": \"$backend_url\" to package.json"
            }
        else
            warn "Node.js not found, manually add \"proxy\": \"$backend_url\" to package.json"
        fi
        log "Added proxy to package.json"
    fi
}

setup_webpack_proxy() {
    local backend_url=$1
    warn "Webpack proxy setup requires manual configuration"
    info "Add this to your webpack.config.js devServer section:"
    echo "proxy: { '/api': '$backend_url' }"
}

setup_angular_proxy() {
    local backend_url=$1
    cat > "proxy.conf.json" << EOF
{
  "/api/*": {
    "target": "$backend_url",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
EOF
    log "Created proxy.conf.json - start with: ng serve --proxy-config proxy.conf.json"
}

setup_generic_proxy() {
    local backend_url=$1
    info "Generic proxy setup - Backend URL: $backend_url"
    cat > ".env.local" << EOF
VITE_API_URL=$backend_url
REACT_APP_API_URL=$backend_url
NEXT_PUBLIC_API_URL=$backend_url
EOF
    log "Created .env.local with API URL"
}

# Create environment file
create_env_file() {
    local backend_url=$1
    local frontend_url=$2
    local wsl_ip=$3
    
    # Create .env.development for build-time variables
    cat > ".env.development" << EOF
# Auto-generated by dev-connect.sh
BACKEND_URL=$backend_url
FRONTEND_URL=$frontend_url
API_URL=$backend_url/api
CORS_ORIGIN=$frontend_url
WSL_IP=$wsl_ip
BACKEND_PORT=$BACKEND_PORT
FRONTEND_PORT=$FRONTEND_PORT

# Common variations for different frameworks
VITE_API_URL=$backend_url
REACT_APP_API_URL=$backend_url
NEXT_PUBLIC_API_URL=$backend_url
VUE_APP_API_URL=$backend_url
EOF

    # Create .env.local for runtime variables (overrides .env.development)
    cat > ".env.local" << EOF
# Runtime environment variables - auto-generated by dev-connect.sh
VITE_API_URL=$backend_url
REACT_APP_API_URL=$backend_url
NEXT_PUBLIC_API_URL=$backend_url
VUE_APP_API_URL=$backend_url
BACKEND_URL=$backend_url
API_BASE_URL=$backend_url
WSL_IP=$wsl_ip
EOF

    # Create a JavaScript module for dynamic imports
    cat > "dev-config.js" << EOF
// Auto-generated dev configuration - import this in your API calls
export const devConfig = {
  backendUrl: '$backend_url',
  frontendUrl: '$frontend_url',
  apiUrl: '$backend_url/api',
  wslIp: '$wsl_ip',
  backendPort: $BACKEND_PORT,
  frontendPort: $FRONTEND_PORT,
  isWSL: $([ "$IS_WSL" = "true" ] && echo "true" || echo "false")
};

// For CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { devConfig };
}

// For direct script inclusion
if (typeof window !== 'undefined') {
  window.devConfig = devConfig;
}
EOF

    log "Created .env.development, .env.local, and dev-config.js"
    info "Use process.env.VITE_API_URL or import { devConfig } from './dev-config.js'"
}

# Create a connection test script
create_test_script() {
    cat > "test-connection.js" << EOF
// Auto-generated connection test
const testConnection = async () => {
  // Try to load from environment first, then fallback to config
  const backendUrl = process.env.VITE_API_URL || 
                    process.env.REACT_APP_API_URL || 
                    process.env.BACKEND_URL || 
                    'http://localhost:$BACKEND_PORT';
  
  console.log('Testing connection...');
  console.log('Backend URL:', backendUrl);
  console.log('WSL IP detected:', process.env.WSL_IP || 'Not set');
  
  try {
    const response = await fetch(\`\${backendUrl}/health\`);
    console.log('✅ Backend connection successful');
    console.log('Response status:', response.status);
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    console.log('Make sure your backend is running and accessible');
  }
};

// Export for use in your app
export { testConnection };

if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  testConnection();
} else {
  // Browser environment
  window.testConnection = testConnection;
}
EOF
    log "Created test-connection.js for debugging"
}

# Create backend startup helper
create_backend_helper() {
    local local_ip=$1
    cat > "start-backend.sh" << 'EOF'
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
EOF
    chmod +x "start-backend.sh"
    log "Created start-backend.sh helper script"
}

# Main execution
main() {
    log "Starting dev-connect setup..."
    
    # Detect environment
    IS_WSL=$(detect_wsl)
    WSL_IP=$(get_wsl_ip)
    LOCAL_IP=$(get_local_ip)
    
    info "Environment detected:"
    info "  WSL: $IS_WSL"
    info "  WSL IP: $WSL_IP"
    info "  Local IP: $LOCAL_IP"
    info "  Backend Port: $BACKEND_PORT"
    info "  Frontend Port: $FRONTEND_PORT"
    
    # Determine URLs
    if [ "$IS_WSL" = "true" ]; then
        BACKEND_URL="http://$WSL_IP:$BACKEND_PORT"
        FRONTEND_URL="http://$WSL_IP:$FRONTEND_PORT"
    else
        BACKEND_URL="http://localhost:$BACKEND_PORT"
        FRONTEND_URL="http://localhost:$FRONTEND_PORT"
    fi
    
    # Auto-detect or use specified project type
    if [ "$PROJECT_TYPE" = "auto" ]; then
        PROJECT_TYPE=$(detect_project_type)
        info "Auto-detected project type: $PROJECT_TYPE"
    fi
    
    # Check if ports are available
    if check_port $FRONTEND_PORT; then
        warn "Frontend port $FRONTEND_PORT is already in use"
    fi
    
    if check_port $BACKEND_PORT; then
        warn "Backend port $BACKEND_PORT is already in use"
    fi
    
    # Setup proxy configuration
    log "Setting up proxy for $PROJECT_TYPE project..."
    setup_proxy "$PROJECT_TYPE" "$BACKEND_URL"
    
    # Create environment files
    create_env_file "$BACKEND_URL" "$FRONTEND_URL" "$WSL_IP"
    
    # Create helper scripts
    create_test_script
    create_backend_helper "$LOCAL_IP"
    
    # Final instructions
    echo ""
    log "Setup complete! 🚀"
    echo ""
    info "Next steps:"
    info "1. Start your backend with: ./start-backend.sh (edit it first)"
    info "2. Start your frontend normally"
    info "3. Test connection with: node test-connection.js"
    echo ""
    info "URLs configured:"
    info "  Frontend: $FRONTEND_URL"
    info "  Backend: $BACKEND_URL"
    echo ""
    
    if [ "$IS_WSL" = "true" ]; then
        warn "WSL detected - make sure your backend binds to 0.0.0.0, not 127.0.0.1"
        info "Windows firewall may need to allow WSL connections"
    fi
}

# Run main function
main "$@"