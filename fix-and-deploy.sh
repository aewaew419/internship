#!/bin/bash

# Fix and Deploy Script - PostgreSQL Version
# แก้ไขปัญหาและ deploy ใหม่ด้วย PostgreSQL

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
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    GRAFANA_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-12)
    
    cat > .env.production << EOL
# Production Environment Configuration - PostgreSQL
NODE_ENV=production
GO_ENV=production
PORT=8080
FRONTEND_PORT=3000

# Domain Configuration
DOMAIN=internship.dev.smart-solutions.com
MAIN_DOMAIN=dev.smart-solutions.com
FRONTEND_URL=https://203.170.129.199:8443
API_URL=https://203.170.129.199:8443/api

# PostgreSQL Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=internship_prod
DB_USER=internship_user
DB_PASSWORD=$DB_PASSWORD

# PostgreSQL Connection URL
DATABASE_URL=postgresql://internship_user:$DB_PASSWORD@postgres:5432/internship_prod

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_URL=redis://:$REDIS_PASSWORD@redis:6379

# CORS Configuration
CORS_ORIGIN=https://203.170.129.199:8443,http://203.170.129.199:8080,https://internship.dev.smart-solutions.com
ALLOWED_ORIGINS=https://203.170.129.199:8443,http://203.170.129.199:8080

# Rate Limiting
RATE_LIMIT=100
RATE_LIMIT_WINDOW=15m

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Monitoring
GRAFANA_PASSWORD=$GRAFANA_PASSWORD
PROMETHEUS_RETENTION=30d

# Security
SECURITY_HEADERS=true

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads

# Database Auto Migration
DB_AUTO_MIGRATE=true

# Connection Pool Settings (PostgreSQL optimized)
DB_MAX_IDLE_CONNS=25
DB_MAX_OPEN_CONNS=100
DB_CONN_MAX_LIFETIME=1h
DB_CONN_MAX_IDLE_TIME=30m
DB_SLOW_THRESHOLD=200ms
EOL

    chmod 600 .env.production
    echo "✅ Created PostgreSQL-optimized .env.production"
else
    echo "✅ .env.production exists, updating for PostgreSQL..."
    # Update existing file to ensure PostgreSQL compatibility
    sed -i.bak 's/mysql:/postgresql:/g' .env.production
    sed -i.bak 's/:3306/:5432/g' .env.production
    
    # Add DATABASE_URL if not present
    if ! grep -q "DATABASE_URL" .env.production; then
        echo "DATABASE_URL=postgresql://internship_user:\$DB_PASSWORD@postgres:5432/internship_prod" >> .env.production
    fi
    
    rm -f .env.production.bak
fi

echo "📋 Environment file content:"
cat .env.production

echo ""
echo "🐳 Starting PostgreSQL services step by step..."

echo "1. Starting PostgreSQL database..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d postgres

echo "2. Waiting for PostgreSQL to be ready..."
sleep 45
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production exec -T postgres pg_isready -U internship_user || echo "PostgreSQL still starting..."

echo "3. Starting Redis cache..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d redis

echo "4. Importing PostgreSQL demo data..."
if [ -f "postgresql_demo_users.sql" ]; then
    echo "📥 Importing demo users..."
    docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production exec -T postgres psql -U internship_user -d internship_prod < postgresql_demo_users.sql || echo "Demo data import failed, continuing..."
fi

if [ -f "apps/backend/scripts/postgresql_seed_data.sql" ]; then
    echo "📥 Importing seed data..."
    docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production exec -T postgres psql -U internship_user -d internship_prod < apps/backend/scripts/postgresql_seed_data.sql || echo "Seed data import failed, continuing..."
fi

echo "5. Starting backend with PostgreSQL..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d backend

echo "6. Waiting for backend to connect to PostgreSQL..."
sleep 45

echo "7. Starting frontend..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d frontend

echo "8. Starting nginx reverse proxy..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d nginx

echo "⏳ Waiting for all PostgreSQL services to be ready..."
sleep 60

echo "🏥 Checking service status..."
docker-compose -f deployment/docker-compose.prod.yml ps

echo "📊 Checking PostgreSQL deployment logs..."
echo "=== PostgreSQL Database Logs ==="
docker-compose -f deployment/docker-compose.prod.yml logs postgres --tail=10

echo "=== Backend Logs ==="
docker-compose -f deployment/docker-compose.prod.yml logs backend --tail=10

echo "=== Frontend Logs ==="
docker-compose -f deployment/docker-compose.prod.yml logs frontend --tail=5

echo "=== Nginx Logs ==="
docker-compose -f deployment/docker-compose.prod.yml logs nginx --tail=5

echo "🔍 Testing PostgreSQL connection..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production exec -T postgres psql -U internship_user -d internship_prod -c "SELECT 'PostgreSQL connection successful!' as status;" || echo "PostgreSQL connection test failed"

echo "✅ PostgreSQL deployment completed!"
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
        echo "Health response:"
        curl -s "http://$VPS_HOST:8080/health" | head -3
    else
        echo -e "${YELLOW}⚠️  Health endpoint: ยังไม่พร้อม${NC}"
        echo "Response:"
        curl -s "http://$VPS_HOST:8080/health" || echo "No response"
    fi
    
    # Test HTTPS endpoint
    echo "Testing HTTPS endpoint..."
    if curl -k -f -s "https://$VPS_HOST:8443/health" > /dev/null; then
        echo -e "${GREEN}✅ HTTPS Health endpoint: OK${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTPS Health endpoint: ยังไม่พร้อม${NC}"
        echo "HTTPS Response:"
        curl -k -s "https://$VPS_HOST:8443/health" || echo "No HTTPS response"
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
    
    # Test PostgreSQL connection
    echo "Testing PostgreSQL connection..."
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "cd $REMOTE_DIR && docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production exec -T postgres psql -U internship_user -d internship_prod -c 'SELECT COUNT(*) as user_count FROM users;'" || echo "PostgreSQL test failed"
    
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
    echo "   🌐 Website (HTTP): http://$VPS_HOST:8080"
    echo "   🔒 Website (HTTPS): https://$VPS_HOST:8443"
    echo "   🏥 Health Check: http://$VPS_HOST:8080/health"
    echo "   🔐 HTTPS Health: https://$VPS_HOST:8443/health"
    echo ""
    echo -e "${CYAN}🔑 Demo Login:${NC}"
    echo "   📧 Email: admin2@smart-solutions.com"
    echo "   🔒 Password: admin123"
    echo "   📧 Alt Email: demo001@smart-solutions.com"
    echo "   🔒 Alt Password: demo123"
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