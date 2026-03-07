#!/bin/bash
# VPS Setup Script for nationalidformatter.app
# Run this on a fresh Ubuntu VPS

set -e

echo "🚀 Starting VPS Setup..."

# 1. Clean up existing Docker (The 'Erase' phase)
echo "🧹 Cleaning up any existing Docker data..."
if command -v docker &> /dev/null; then
    docker stop $(docker ps -aq) || true
    docker rm $(docker ps -aq) || true
    docker rmi $(docker images -q) || true
    docker volume rm $(docker volume ls -q) || true
    docker network prune -f || true
fi

# 2. Update System
echo "🔄 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# 3. Install Dependencies
echo "📦 Installing Git, Curl, and Build Tools..."
sudo apt-get install -y git curl build-essential

# 4. Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 5. Install Docker Compose
echo "🛠️ Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 6. Verify Installations
echo "✅ Verification:"
docker --version
docker-compose --version
git --version

echo "----------------------------------------------------"
echo "🎉 VPS is ready for deployment!"
echo "Next steps:"
echo "1. Log out and log back in (to apply docker group changes)."
echo "2. Clone your repo."
echo "3. Follow walkthrough.md for .env setup and starting the app."
echo "----------------------------------------------------"
