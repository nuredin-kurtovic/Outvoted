#!/bin/bash
# Outvoted server setup - run this on the Ubuntu droplet
set -e

APP_DIR="/var/www/outvoted"
SERVER_IP="${1:-104.248.131.26}"

echo "=== Installing dependencies ==="
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl gnupg2 ca-certificates lsb-release ubuntu-keyring

# Node.js 20 LTS
echo "=== Installing Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y -qq nodejs

# MySQL
echo "=== Installing MySQL ==="
apt-get install -y -qq mysql-server
systemctl start mysql
systemctl enable mysql

# Nginx
echo "=== Installing Nginx ==="
apt-get install -y -qq nginx

# PM2
echo "=== Installing PM2 ==="
npm install -g pm2

echo "=== MySQL setup ==="
# Generate random password for outvoted DB user
DB_PASS=$(openssl rand -base64 24)
echo "Generated DB password (save this): $DB_PASS"

sudo mysql << MYSQLEOF
CREATE DATABASE IF NOT EXISTS outvoted;
DROP USER IF EXISTS 'outvoted'@'localhost';
CREATE USER 'outvoted'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON outvoted.* TO 'outvoted'@'localhost';
FLUSH PRIVILEGES;
MYSQLEOF

# Create .env for backend
mkdir -p "$APP_DIR/backend"
cat > "$APP_DIR/backend/.env" << ENVEOF
PORT=3000
DB_HOST=localhost
DB_USER=outvoted
DB_PASSWORD=$DB_PASS
DB_NAME=outvoted
JWT_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=http://$SERVER_IP
NODE_ENV=production
ENVEOF

echo "Database and .env configured. DB password saved in $APP_DIR/backend/.env"
