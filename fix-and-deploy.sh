#!/bin/bash

# Fix and Deploy Script
# แก้ไขปัญหาและ deploy ใหม่

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
VPS_USER="root"
VPS_HOST="203.170.129.199"
VPS_PORT="22"
REMOTE_DIR="/opt/internship-system"

echo -e "${PURPLE}🔧 Fix and Deploy Script${NC}"
echo -e "${PURPLE}========================${NC}"
echo ""

# Fix deployment on VPS
fix_deployment() {
    echo -e "${BLUE}🔧 แก้ไขปัญหาใน VPS...${NC}"
    
    cat > /tmp/fix_deployment.sh << 'EOF'
#!/bin/bash

set -e

cd /opt/internship-system

echo "🛑 Stopping existing containers..."
docker-compose -f deployment/docker-compose.prod.yml down --remove-orphans || true

echo "🧹 Cleaning up..."
docker system prune -f

echo "📥 Updating repository..."
git pull origin main

echo "🔧 Checking environment file..."
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production not found, creating new one..."
    
    # Generate secure passwords
    DB_PASSWORD=$(openssl rand -hex 16)
    JWT_SECRET=$(openssl rand -hex 32)
    REDIS_PASSWORD=$(openssl rand -hex 16)
    GRAFANA_PASSWORD=$(openssl rand -hex 8)
    
    cat > .env.production << EOL
# Production Environment Configuration
NODE_ENV=production
GO_ENV=production
PORT=8080
FRONTEND_PORT=3000

# Domain Configuration
DOMAIN=internship.dev.smart-solutions.com
MAIN_DOMAIN=dev.smart-solutions.com

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=internship_prod
DB_USER=internship_user
DB_PASSWORD=$DB_PASSWORD

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_PASSWORD=$REDIS_PASSWORD

# CORS Configuration
CORS_ORIGIN=https://internship.dev.smart-solutions.com,http://203.170.129.199:8080

# Rate Limiting
RATE_LIMIT=100

# Logging
LOG_LEVEL=info

# Monitoring
GRAFANA_PASSWORD=$GRAFANA_PASSWORD

# Security
SECURITY_HEADERS=true

# File Upload
MAX_FILE_SIZE=10MB
UPLOAD_PATH=/app/uploads
EOL

    chmod 600 .env.production
fi

echo "📋 Environment file content:"
cat .env.production

echo ""
echo "🐳 Starting services step by step..."

echo "1. Starting database..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d postgres

echo "2. Waiting for database to be ready..."
sleep 30

echo "3. Starting Redis..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d redis

echo "4. Starting backend..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d backend

echo "5. Waiting for backend to be ready..."
sleep 30

echo "6. Starting frontend..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d frontend

echo "7. Starting nginx..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d nginx

echo "⏳ Waiting for all services to be ready..."
sleep 30

echo "🏥 Checking service status..."
docker-compose -f deployment/docker-compose.prod.yml ps

echo "📊 Checking logs..."
echo "=== Backend Logs ==="
docker-compose -f deployment/docker-compose.prod.yml logs backend --tail=5

echo "=== Frontend Logs ==="
docker-compose -f deployment/docker-compose.prod.yml logs frontend --tail=5

echo "✅ Fix deployment completed!"
EOF

    # Copy and run the fix script
    scp -P "$VPS_PORT" /tmp/fix_deployment.sh "$VPS_USER@$VPS_HOST:/tmp/"
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "chmod +x /tmp/fix_deployment.sh && /tmp/fix_deployment.sh"
}

# Test the deployment
test_deployment() {
    echo -e "${BLUE}🧪 ทดสอบ deployment...${NC}"
    
    # Wait a bit more
    sleep 30
    
    # Test health endpoint
    echo "Testing health endpoint..."
    if curl -f -s "http://$VPS_HOST:8080/health" > /dev/null; then
        echo -e "${GREEN}✅ Health endpoint: OK${NC}"
    else
        echo -e "${YELLOW}⚠️  Health endpoint: ยังไม่พร้อม${NC}"
        echo "Response:"
        curl -s "http://$VPS_HOST:8080/health" || echo "No response"
    fi
    
    # Test frontend
    echo "Testing frontend..."
    if curl -f -s "http://$VPS_HOST:8080" > /dev/null; then
        echo -e "${GREEN}✅ Frontend: OK${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend: ยังไม่พร้อม${NC}"
        echo "Response:"
        curl -s "http://$VPS_HOST:8080" | head -10 || echo "No response"
    fi
    
    # Show container status
    echo -e "${BLUE}🐳 Container Status:${NC}"
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "cd $REMOTE_DIR && docker-compose -f deployment/docker-compose.prod.yml ps"
}

# Print summary
print_summary() {
    echo ""
    echo -e "${GREEN}🎉 Fix and Deploy สำเร็จ!${NC}"
    echo -e "${PURPLE}========================${NC}"
    echo ""
    echo -e "${CYAN}📊 URLs:${NC}"
    echo "   🌐 Website: http://$VPS_HOST:8080"
    echo "   🏥 Health Check: http://$VPS_HOST:8080/health"
    echo ""
    echo -e "${CYAN}🛠️  Debug Commands:${NC}"
    echo "   View all logs: ssh -p $VPS_PORT $VPS_USER@$VPS_HOST 'cd $REMOTE_DIR && docker-compose -f deployment/docker-compose.prod.yml logs'"
    echo "   View backend logs: ssh -p $VPS_PORT $VPS_USER@$VPS_HOST 'cd $REMOTE_DIR && docker-compose -f deployment/docker-compose.prod.yml logs backend'"
    echo "   View frontend logs: ssh -p $VPS_PORT $VPS_USER@$VPS_HOST 'cd $REMOTE_DIR && docker-compose -f deployment/docker-compose.prod.yml logs frontend'"
    echo "   Container status: ssh -p $VPS_PORT $VPS_USER@$VPS_HOST 'cd $REMOTE_DIR && docker-compose -f deployment/docker-compose.prod.yml ps'"
    echo ""
}

# Main function
main() {
    fix_deployment
    test_deployment
    print_summary
    
    # Cleanup
    rm -f /tmp/fix_deployment.sh
}

# Run main function
main "$@"