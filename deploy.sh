#!/bin/bash
# ============================================================================
# Deploy script - Build locally and deploy to Docker
# Usage: bash deploy.sh
# ============================================================================

set -e

echo "🔨 Step 1: Generating Prisma Client..."
npx prisma generate

echo "🔨 Step 2: Building Next.js..."
NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production npm run build

echo "🐳 Step 3: Checking Docker container..."
if ! docker ps | grep -q nobat-market-app; then
  echo "Starting Docker containers..."
  docker compose up -d
  sleep 15
fi

echo "📦 Step 4: Deploying to container..."
# Clean .next inside container
docker exec nobat-market-app sh -c "rm -rf /app/.next" 2>/dev/null || true

# Copy standalone (server.js + .next/server)
docker cp .next/standalone/. nobat-market-app:/app/

# Copy static files
docker cp .next/static nobat-market-app:/app/.next/static

# Copy public files
docker cp public nobat-market-app:/app/public

# Copy prisma schema
docker cp prisma nobat-market-app:/app/prisma

# Ensure uploads directory
docker exec nobat-market-app sh -c "mkdir -p /app/public/uploads && chown nextjs:nodejs /app/public/uploads"

echo "🔄 Step 5: Restarting container..."
docker restart nobat-market-app

echo "⏳ Step 6: Waiting for server..."
sleep 10

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Deploy successful! Site is running at http://localhost:3000"
else
  echo "❌ Deploy may have issues. HTTP status: $HTTP_CODE"
  echo "Check logs: docker logs nobat-market-app"
fi
