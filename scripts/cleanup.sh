#!/bin/bash
# Production Grade Docker Cleanup Script
# This script safely removes unused Docker resources to free up disk space
# without affecting currently running production containers.

set -e

echo "🧹 Starting Production-Grade Docker Cleanup..."

# 1. Remove dangling images (untagged images from old builds)
echo "🗑️ Removing dangling images..."
docker image prune -f

# 2. Remove stopped containers
echo "🗑️ Removing stopped containers..."
docker container prune -f

# 3. Remove unused networks
echo "🗑️ Removing unused networks..."
docker network prune -f

# 4. Optional: Deep clean (requires confirmation)
echo ""
echo "⚠️  Would you like to perform a DEEP clean?"
echo "This will remove ALL images without at least one container associated to them,"
echo "as well as all unused build cache."
echo "Your currently running application will NOT be affected, but future builds"
echo "might take slightly longer as they have to re-download base images."
read -p "Perform deep clean? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Performing deep system prune..."
    docker system prune -a --volumes -f
    echo "✅ Deep clean completed."
else
    echo "⏭️ Skipping deep clean."
fi

# Show remaining disk usage
echo ""
echo "📊 Current Docker Disk Usage:"
docker system df

echo "🎉 Cleanup process finished successfully!"
