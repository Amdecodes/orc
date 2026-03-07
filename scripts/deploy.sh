#!/bin/bash
# VPS Deployment Automation Script
# This script pulls the latest changes and automatically applies necessary 
# production hotfixes for Docker and Prisma before rebuilding.

set -e

echo "🚀 Starting Deployment Process..."

# 1. Pull latest changes from the current branch
echo "📦 Pulling latest code from git..."
git pull

# 2. Apply Dockerfile.nextjs fix (Inject Prisma COPY commands if missing)
echo "🔧 Applying Dockerfile.nextjs Prisma hotfix..."
if ! grep -q "/app/prisma" Dockerfile.nextjs; then
  sed -i '/COPY --from=builder --chown=nextjs:nodejs \/app\/apps\/$APP_NAME\/.next\/static \.\/apps\/$APP_NAME\/.next\/static/a \
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma\
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.js ./' Dockerfile.nextjs
  echo "✅ Dockerfile.nextjs patched."
else
  echo "✅ Dockerfile.nextjs already patched."
fi

# 3. Apply Prisma Config dotenv fix (Docker Compose provides env vars)
echo "🔧 Applying prisma.config.js dotenv hotfix..."
if grep -q "import 'dotenv/config';" prisma.config.js; then
  sed -i "s/import 'dotenv\/config';/\/\/ import 'dotenv\/config';/" prisma.config.js
  echo "✅ prisma.config.js patched."
else
  echo "✅ prisma.config.js already patched."
fi

# 4. Rebuild and restart the Docker containers
echo "🏗️ Rebuilding Docker containers..."
docker-compose up -d --build

# 5. Push Prisma Schema (Since there are no migration files)
echo "🗄️ Synchronizing Prisma database schema..."
docker-compose exec web npx prisma db push --accept-data-loss

echo "🎉 Deployment successful!"
docker ps
