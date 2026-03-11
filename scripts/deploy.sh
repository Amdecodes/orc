#!/bin/bash
# VPS Deployment Automation Script
# Pulls the latest changes and rebuilds Docker containers.

set -e

echo "🚀 Starting Deployment Process..."

# 1. Pull latest changes from the current branch
echo "📦 Pulling latest code from git..."
git pull

# 2. Rebuild and restart the Docker containers
echo "🏗️ Rebuilding Docker containers..."
docker-compose up -d --build

# 3. Push Prisma Schema
echo "🗄️ Synchronizing Prisma database schema..."
docker-compose exec web npx prisma db push --accept-data-loss

echo "🎉 Deployment successful!"
docker ps
