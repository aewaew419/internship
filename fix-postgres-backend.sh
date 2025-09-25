#!/bin/bash

echo "🔧 Fixing PostgreSQL Backend Configuration"
echo "=========================================="

# Build and push the updated backend
echo "📦 Building backend with PostgreSQL support..."
cd apps/backend
go mod tidy
cd ../..

# Commit the changes
echo "💾 Committing PostgreSQL fixes..."
git add .
git commit -m "Fix: Add PostgreSQL support to backend

- Add gorm.io/driver/postgres dependency
- Update database connection to support PostgreSQL DSN
- Fix config to construct proper PostgreSQL URL from env vars
- Support postgres:// and postgresql:// URL schemes"

# Push changes
echo "🚀 Pushing changes..."
git push origin main

# Deploy to VPS
echo "🚀 Deploying to VPS..."
ssh root@203.170.129.199 << 'EOF'
cd /opt/internship-system

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Stop existing containers
echo "🛑 Stopping containers..."
docker-compose -f deployment/docker-compose.prod.yml down

# Remove old images to force rebuild
echo "🧹 Cleaning up old images..."
docker image prune -f
docker rmi $(docker images -q internship_backend) 2>/dev/null || true

# Start services step by step
echo "🐳 Starting services..."

# Start database first
echo "1. Starting database..."
docker-compose -f deployment/docker-compose.prod.yml up -d postgres
sleep 10

# Start Redis
echo "2. Starting Redis..."
docker-compose -f deployment/docker-compose.prod.yml up -d redis
sleep 5

# Start backend (this will rebuild with PostgreSQL support)
echo "3. Starting backend..."
docker-compose -f deployment/docker-compose.prod.yml up -d backend
sleep 15

# Check backend health
echo "4. Checking backend health..."
for i in {1..30}; do
    if curl -f http://localhost:8080/health >/dev/null 2>&1; then
        echo "✅ Backend is healthy!"
        break
    fi
    echo "⏳ Waiting for backend... ($i/30)"
    sleep 2
done

# Start frontend
echo "5. Starting frontend..."
docker-compose -f deployment/docker-compose.prod.yml up -d frontend
sleep 10

# Start nginx
echo "6. Starting nginx..."
docker-compose -f deployment/docker-compose.prod.yml up -d nginx

# Final status check
echo "📊 Final status check..."
docker-compose -f deployment/docker-compose.prod.yml ps

echo "✅ Deployment complete!"
echo "🌐 Application should be available at: https://internship.dev.smart-solutions.com"
EOF

echo "✅ PostgreSQL backend fix and deployment complete!"