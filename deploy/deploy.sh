#!/bin/bash
# Deploy Outvoted to Ubuntu droplet
# Usage: ./deploy.sh [server_ip]
# Requires: sshpass (brew install sshpass) - or run manual SSH
set -e

SERVER_IP="${1:-104.248.131.26}"
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
APP_DIR="/var/www/outvoted"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Deploying Outvoted to $SERVER_IP ==="

# Check for sshpass (optional - for password auth)
USE_SSHPASS=false
if command -v sshpass &>/dev/null && [ -n "$SSHPASS" ]; then
    USE_SSHPASS=true
    echo "Using sshpass for authentication"
fi

run_remote() {
    if $USE_SSHPASS; then
        sshpass -e ssh $SSH_OPTS root@$SERVER_IP "$@"
    else
        ssh $SSH_OPTS root@$SERVER_IP "$@"
    fi
}

copy_remote() {
    if $USE_SSHPASS; then
        sshpass -e rsync -avz -e "ssh $SSH_OPTS" "$@" root@$SERVER_IP:"$2"
    else
        rsync -avz -e "ssh $SSH_OPTS" "$@" root@$SERVER_IP:"$2"
    fi
}

# Step 1: Run initial setup if needed (install node, mysql, nginx, pm2)
echo "=== Checking server setup ==="
run_remote "which node >/dev/null 2>&1 || (curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs)"
run_remote "which mysql >/dev/null 2>&1 || apt-get update && apt-get install -y -qq mysql-server nginx && systemctl start mysql nginx && systemctl enable mysql nginx"
run_remote "which pm2 >/dev/null 2>&1 || npm install -g pm2"

# Step 2: Ensure app directory and .env exist
echo "=== Ensuring app directory ==="
run_remote "mkdir -p $APP_DIR/backend $APP_DIR/frontend"
run_remote "
if [ ! -f $APP_DIR/backend/.env ]; then
    DB_PASS=\$(openssl rand -base64 24)
    sudo mysql -e \"CREATE DATABASE IF NOT EXISTS outvoted; DROP USER IF EXISTS 'outvoted'@'localhost'; CREATE USER 'outvoted'@'localhost' IDENTIFIED BY '\$DB_PASS'; GRANT ALL PRIVILEGES ON outvoted.* TO 'outvoted'@'localhost'; FLUSH PRIVILEGES;\"
    cat > $APP_DIR/backend/.env << ENVEOF
PORT=3000
DB_HOST=localhost
DB_USER=outvoted
DB_PASSWORD=\$DB_PASS
DB_NAME=outvoted
JWT_SECRET=\$(openssl rand -base64 32)
FRONTEND_URL=http://$SERVER_IP
NODE_ENV=production
ENVEOF
    echo 'Created new .env with fresh DB credentials'
fi
"

# Step 3: Copy project files (exclude node_modules, .git, etc.)
echo "=== Copying files ==="
RSYNC_CMD="rsync -avz"
if $USE_SSHPASS; then
    RSYNC_CMD="sshpass -e rsync -avz"
fi
$RSYNC_CMD --delete \
    -e "ssh $SSH_OPTS" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude 'frontend/dist' \
    --exclude 'public/uploads' \
    --filter 'P public/uploads/' \
    "$PROJECT_ROOT/backend/" "root@$SERVER_IP:$APP_DIR/backend/"
$RSYNC_CMD --delete \
    -e "ssh $SSH_OPTS" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    "$PROJECT_ROOT/frontend/" "root@$SERVER_IP:$APP_DIR/frontend/"
$RSYNC_CMD -e "ssh $SSH_OPTS" "$PROJECT_ROOT/package.json" "root@$SERVER_IP:$APP_DIR/"
$RSYNC_CMD -e "ssh $SSH_OPTS" "$PROJECT_ROOT/deploy/nginx-outvoted.conf" "root@$SERVER_IP:/etc/nginx/sites-available/outvoted"
$RSYNC_CMD -e "ssh $SSH_OPTS" "$PROJECT_ROOT/deploy/ecosystem.config.cjs" "root@$SERVER_IP:$APP_DIR/"

# Step 4: Copy and run remote build script
echo "=== Building on server ==="
$RSYNC_CMD -e "ssh $SSH_OPTS" "$PROJECT_ROOT/deploy/remote-build.sh" "root@$SERVER_IP:$APP_DIR/"
run_remote "chmod +x $APP_DIR/remote-build.sh && $APP_DIR/remote-build.sh $APP_DIR $SERVER_IP"

# Step 5: Nginx and PM2
echo "=== Configuring Nginx and PM2 ==="
run_remote "
ln -sf /etc/nginx/sites-available/outvoted /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
cd $APP_DIR && pm2 delete outvoted 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true
echo 'PM2 started'
"

echo ""
echo "=== Deployment complete! ==="
echo "Game URL: http://$SERVER_IP"
echo ""
echo "Useful commands:"
echo "  SSH: ssh root@$SERVER_IP"
echo "  Logs: ssh root@$SERVER_IP 'pm2 logs outvoted'"
echo "  Restart: ssh root@$SERVER_IP 'pm2 restart outvoted'"
echo ""
echo "IMPORTANT: Change your droplet root password after deployment!"
echo "  ssh root@$SERVER_IP"
echo "  passwd"
