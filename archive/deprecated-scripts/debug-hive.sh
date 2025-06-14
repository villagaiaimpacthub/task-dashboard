#!/usr/bin/env bash

# debug-hive.sh - Comprehensive HIVE Project Debug Script
# Checks networking, API contracts, environment variables, and live connections

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Icons
CHECK="✅"
CROSS="❌"
WARN="⚠️"
INFO="ℹ️"
DEBUG="🐛"

echo -e "${PURPLE}${DEBUG} HIVE PROJECT DEBUG REPORT${NC}"
echo "========================================"
echo "$(date)"
echo ""

# Function to check and report
check_item() {
    local description="$1"
    local status="$2"
    local details="${3:-}"
    
    if [ "$status" = "pass" ]; then
        echo -e "${GREEN}${CHECK} ${description}${NC}"
    elif [ "$status" = "fail" ]; then
        echo -e "${RED}${CROSS} ${description}${NC}"
    elif [ "$status" = "warn" ]; then
        echo -e "${YELLOW}${WARN} ${description}${NC}"
    else
        echo -e "${BLUE}${INFO} ${description}${NC}"
    fi
    
    if [ -n "$details" ]; then
        echo -e "   ${CYAN}→ ${details}${NC}"
    fi
    echo ""
}

# 1. ENVIRONMENT DETECTION
echo -e "${BLUE}📍 ENVIRONMENT DETECTION${NC}"
echo "----------------------------------------"

# Check WSL
if grep -qi microsoft /proc/version 2>/dev/null || grep -qi wsl /proc/version 2>/dev/null; then
    WSL_DETECTED="true"
    # Use the same method as dev-connect-dynamic.sh for consistency
    WSL_IP=$(ip addr show eth0 | grep 'inet ' | awk '{print $2}' | cut -d'/' -f1 2>/dev/null || true)
    
    # Fallback to other interface names if eth0 doesn't exist
    if [ -z "$WSL_IP" ]; then
        WSL_IP=$(ip addr show | grep -E 'inet.*eth|inet.*ens|inet.*enp' | head -1 | awk '{print $2}' | cut -d'/' -f1 2>/dev/null || true)
    fi
    
    # Final fallback to gateway method (old approach)
    if [ -z "$WSL_IP" ]; then
        WSL_IP=$(ip route show | grep -i default | awk '{ print $3}' | head -1 2>/dev/null || echo "unknown")
    fi
    
    check_item "WSL Environment Detected" "pass" "WSL IP: $WSL_IP"
else
    WSL_DETECTED="false"
    check_item "WSL Environment" "info" "Running on native Linux/macOS"
fi

# Check Node.js paths
NODE_PATH=$(which node 2>/dev/null || echo "not found")
NPM_PATH=$(which npm 2>/dev/null || echo "not found")

if [[ "$NODE_PATH" == *"/mnt/c/"* ]] && [ "$WSL_DETECTED" = "true" ]; then
    check_item "Node.js Installation" "fail" "Using Windows Node.js in WSL: $NODE_PATH"
elif [ "$NODE_PATH" != "not found" ]; then
    NODE_VERSION=$(node --version 2>/dev/null || echo "unknown")
    check_item "Node.js Installation" "pass" "Path: $NODE_PATH, Version: $NODE_VERSION"
else
    check_item "Node.js Installation" "fail" "Node.js not found"
fi

# 2. ENVIRONMENT VARIABLES
echo -e "${BLUE}🔧 ENVIRONMENT VARIABLES${NC}"
echo "----------------------------------------"

# Check for dev-connect variables
ENV_VARS=("BACKEND_URL" "FRONTEND_URL" "VITE_API_URL" "REACT_APP_API_URL" "WSL_IP" "API_URL")
for var in "${ENV_VARS[@]}"; do
    if [ -n "${!var:-}" ]; then
        check_item "Environment Variable: $var" "pass" "${!var}"
    else
        check_item "Environment Variable: $var" "warn" "Not set - run dev-connect.sh"
    fi
done

# Check for .env files
if [ -f ".env.development" ]; then
    ENV_COUNT=$(wc -l < .env.development)
    check_item ".env.development file" "pass" "$ENV_COUNT variables defined"
else
    check_item ".env.development file" "warn" "File not found - run dev-connect.sh"
fi

if [ -f ".env.local" ]; then
    ENV_LOCAL_COUNT=$(wc -l < .env.local)
    check_item ".env.local file" "pass" "$ENV_LOCAL_COUNT variables defined"
else
    check_item ".env.local file" "warn" "File not found"
fi

# 3. PROJECT STRUCTURE
echo -e "${BLUE}📁 PROJECT STRUCTURE${NC}"
echo "----------------------------------------"

# Check for key files
KEY_FILES=("package.json" "api-contract.js" "dev-connect-dynamic.sh" "start-backend.sh")
for file in "${KEY_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_item "File: $file" "pass" "Found"
    else
        check_item "File: $file" "warn" "Missing"
    fi
done

# Check for config files
CONFIG_FILES=("vite.config.js" "vite.config.ts" "next.config.js" "webpack.config.js")
CONFIG_FOUND=false
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_item "Frontend Config: $file" "pass" "Found"
        CONFIG_FOUND=true
        break
    fi
done

if [ "$CONFIG_FOUND" = false ]; then
    check_item "Frontend Config" "warn" "No frontend config file found"
fi

# Check dependencies
if [ -f "package.json" ]; then
    if grep -q "zod" package.json 2>/dev/null; then
        check_item "Zod Dependency" "pass" "API contract validation available"
    else
        check_item "Zod Dependency" "warn" "Missing - needed for API contracts"
    fi
else
    check_item "Package.json" "fail" "Not found"
fi

# 4. PORT AVAILABILITY
echo -e "${BLUE}🔌 PORT AVAILABILITY${NC}"
echo "----------------------------------------"

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

check_port() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        if lsof -ti:"$port" >/dev/null 2>&1; then
            local process=$(lsof -ti:"$port" | head -1)
            local cmd=$(ps -p "$process" -o comm= 2>/dev/null || echo "unknown")
            echo "occupied by $cmd (PID: $process)"
        else
            echo "available"
        fi
    else
        echo "unknown (lsof not available)"
    fi
}

BACKEND_STATUS=$(check_port "$BACKEND_PORT")
FRONTEND_STATUS=$(check_port "$FRONTEND_PORT")

if [[ "$BACKEND_STATUS" == "available" ]]; then
    check_item "Backend Port $BACKEND_PORT" "info" "Available"
else
    check_item "Backend Port $BACKEND_PORT" "info" "$BACKEND_STATUS"
fi

if [[ "$FRONTEND_STATUS" == "available" ]]; then
    check_item "Frontend Port $FRONTEND_PORT" "info" "Available"
else
    check_item "Frontend Port $FRONTEND_PORT" "info" "$FRONTEND_STATUS"
fi

# 5. LIVE CONNECTION TESTS
echo -e "${BLUE}🌐 LIVE CONNECTION TESTS${NC}"
echo "----------------------------------------"

# Test backend connection
BACKEND_URL="${BACKEND_URL:-http://localhost:$BACKEND_PORT}"
if command -v curl >/dev/null 2>&1; then
    if curl -s --connect-timeout 3 "$BACKEND_URL/health" >/dev/null 2>&1; then
        check_item "Backend Health Check" "pass" "$BACKEND_URL/health responded"
    elif curl -s --connect-timeout 3 "$BACKEND_URL" >/dev/null 2>&1; then
        check_item "Backend Connection" "warn" "$BACKEND_URL responds but no /health endpoint"
    else
        check_item "Backend Connection" "fail" "$BACKEND_URL unreachable"
    fi
else
    check_item "Backend Connection" "warn" "curl not available for testing"
fi

# Test frontend connection
FRONTEND_URL="${FRONTEND_URL:-http://localhost:$FRONTEND_PORT}"
if command -v curl >/dev/null 2>&1; then
    if curl -s --connect-timeout 3 "$FRONTEND_URL" >/dev/null 2>&1; then
        check_item "Frontend Connection" "pass" "$FRONTEND_URL responded"
    else
        check_item "Frontend Connection" "fail" "$FRONTEND_URL unreachable"
    fi
fi

# 6. API CONTRACT VALIDATION
echo -e "${BLUE}📋 API CONTRACT VALIDATION${NC}"
echo "----------------------------------------"

if [ -f "api-contract.js" ]; then
    if command -v node >/dev/null 2>&1; then
        # Try to validate the contract file
        if node -e "
        try {
            const fs = require('fs');
            const content = fs.readFileSync('api-contract.js', 'utf8');
            if (content.includes('API_ENDPOINTS')) {
                console.log('API_ENDPOINTS found');
                process.exit(0);
            } else {
                console.log('API_ENDPOINTS not found');
                process.exit(1);
            }
        } catch (e) {
            console.log('Error reading file');
            process.exit(1);
        }" 2>/dev/null; then
            check_item "API Contract Structure" "pass" "API_ENDPOINTS defined"
        else
            check_item "API Contract Structure" "warn" "API_ENDPOINTS not found in contract"
        fi
    else
        check_item "API Contract Validation" "warn" "Node.js not available for validation"
    fi
    
    # Check if contract uses environment variables
    if grep -q "process.env" api-contract.js 2>/dev/null; then
        check_item "API Contract Environment Integration" "pass" "Uses environment variables"
    else
        check_item "API Contract Environment Integration" "warn" "May contain hardcoded URLs"
    fi
else
    check_item "API Contract File" "fail" "api-contract.js not found"
fi

# 7. HARDCODED IP DETECTION
echo -e "${BLUE}🔍 HARDCODED IP DETECTION${NC}"
echo "----------------------------------------"

# Search for hardcoded IPs in common files (excluding auto-generated config files and valid bind addresses)
SEARCH_FILES=("*.ts" "*.js" "*.json" "*.sh")
HARDCODED_IPS=()

for pattern in "${SEARCH_FILES[@]}"; do
    if find . -name "$pattern" -type f 2>/dev/null | head -1 >/dev/null; then
        while IFS= read -r line; do
            # Skip auto-generated dev-config files, 0.0.0.0, and localhost patterns
            if [[ "$line" != *"dev-config.js"* ]] && ! grep -q "0\.0\.0\.0\|127\.0\.0\.1" "$line" 2>/dev/null; then
                HARDCODED_IPS+=("$line")
            fi
        done < <(find . -name "$pattern" -type f -exec grep -l "http://[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+" {} \; 2>/dev/null || true)
    fi
done

if [ ${#HARDCODED_IPS[@]} -eq 0 ]; then
    check_item "Hardcoded IP Addresses" "pass" "No hardcoded IPs found"
else
    check_item "Hardcoded IP Addresses" "warn" "Found in: ${HARDCODED_IPS[*]}"
fi

# 8. RECOMMENDATIONS
echo -e "${BLUE}💡 RECOMMENDATIONS${NC}"
echo "----------------------------------------"

if [ "$WSL_DETECTED" = "true" ] && [[ "$NODE_PATH" == *"/mnt/c/"* ]]; then
    echo -e "${YELLOW}${WARN} Install Node.js in WSL directly:${NC}"
    echo "   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "   sudo apt-get install -y nodejs"
    echo ""
fi

if [ ! -f "dev-connect-dynamic.sh" ]; then
    echo -e "${YELLOW}${WARN} Missing dev-connect-dynamic.sh script${NC}"
    echo "   This script sets up WSL networking and environment variables"
    echo ""
fi

if [ -z "${BACKEND_URL:-}" ]; then
    echo -e "${YELLOW}${WARN} Environment variables not set${NC}"
    echo "   Run: ./dev-connect-dynamic.sh to configure networking"
    echo ""
fi

if [ ! -f "api-contract.js" ]; then
    echo -e "${YELLOW}${WARN} Missing API contract${NC}"
    echo "   Implement API-first contract layer for frontend/backend alignment"
    echo ""
fi

if [ ${#HARDCODED_IPS[@]} -gt 0 ]; then
    echo -e "${YELLOW}${WARN} Replace hardcoded IPs with environment variables${NC}"
    echo "   Use \$BACKEND_URL or \$VITE_API_URL instead"
    echo ""
fi

# 9. SUMMARY
echo -e "${PURPLE}📊 DEBUG SUMMARY${NC}"
echo "========================================"
echo "Environment: $([ "$WSL_DETECTED" = "true" ] && echo "WSL" || echo "Native Linux/macOS")"
echo "Node.js: $([ "$NODE_PATH" != "not found" ] && echo "✅ Found" || echo "❌ Missing")"
echo "Environment Setup: $([ -n "${BACKEND_URL:-}" ] && echo "✅ Configured" || echo "❌ Not configured")"
echo "API Contract: $([ -f "api-contract.js" ] && echo "✅ Present" || echo "❌ Missing")"
echo "Hardcoded IPs: $([ ${#HARDCODED_IPS[@]} -eq 0 ] && echo "✅ Clean" || echo "⚠️ Found")"
echo ""

# Quick fix command suggestions
echo -e "${CYAN}🚀 QUICK FIXES:${NC}"
if [ ! -f "dev-connect-dynamic.sh" ] || [ -z "${BACKEND_URL:-}" ]; then
    echo "1. Run networking setup: ./dev-connect-dynamic.sh"
fi
if [ ! -f "api-contract.js" ]; then
    echo "2. Implement API contract layer"
fi
if [ ${#HARDCODED_IPS[@]} -gt 0 ]; then
    echo "3. Replace hardcoded IPs with environment variables"
fi
if [[ "$NODE_PATH" == *"/mnt/c/"* ]] && [ "$WSL_DETECTED" = "true" ]; then
    echo "4. Install Node.js directly in WSL"
fi

echo ""
echo -e "${GREEN}Debug report complete! ${DEBUG}${NC}"