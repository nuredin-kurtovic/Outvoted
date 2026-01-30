#!/bin/bash
# Run on server - install deps, setup DB, build frontend
set -e
APP_DIR="${1:-/var/www/outvoted}"
SERVER_IP="${2:-}"

cd "$APP_DIR/backend"

# Load .env
set -a
source .env 2>/dev/null || true
set +a

# Ensure uploads dir
mkdir -p public/uploads

# Install backend deps
npm install --production

# Production: never run schema or seed - tables are already set up
# Migrations run on server startup (server.js) for schema updates only
echo "Database ready (no schema/seed on deploy)"

# Frontend
cd "$APP_DIR/frontend"
npm install --include=dev
if [ -n "$SERVER_IP" ]; then
    VITE_API_URL="http://${SERVER_IP}/api" ./node_modules/.bin/vite build
else
    ./node_modules/.bin/vite build
fi
echo "Frontend built"
