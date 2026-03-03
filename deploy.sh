#!/bin/bash
# =============================================================================
# deploy.sh  –  Production deployment script for nationalidformatter.app
# =============================================================================
# Run this on the VPS to deploy or update the application:
#   chmod +x deploy.sh
#   ./deploy.sh
# =============================================================================

set -e

COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"

echo "🚀 Starting production deployment..."

# 1. Pull latest code from git
echo "📦 Pulling latest code..."
git pull origin main

# 2. Build all images
echo "🔨 Building Docker images..."
docker compose $COMPOSE_FILES build --no-cache

# 3. Run Prisma migrations against the production database
echo "🗄️  Running database migrations..."
docker compose $COMPOSE_FILES run --rm web sh -c "npx prisma migrate deploy --schema=./prisma/schema.prisma"

# 4. Start / restart services with zero-downtime rolling update
echo "🔄 Restarting services..."
docker compose $COMPOSE_FILES up -d --remove-orphans

# 5. Reload Nginx to pick up any config changes
echo "🔁 Reloading Nginx..."
docker compose $COMPOSE_FILES exec nginx nginx -s reload

# 6. Remove dangling images to save disk space
echo "🧹 Cleaning up old images..."
docker image prune -f

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Services running:"
docker compose $COMPOSE_FILES ps
