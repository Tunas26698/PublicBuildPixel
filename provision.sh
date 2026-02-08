#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive

echo "Updating apt..."
apt-get update

echo "Installing Node.js LTS..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt-get install -y nodejs

echo "Installing Nginx and Git..."
apt-get install -y nginx git

echo "Installing PM2..."
npm install -g pm2

echo "Provisioning complete!"
node -v
nginx -v
pm2 -v
