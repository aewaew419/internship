#!/bin/bash

# Deployment Script for Hostatom VPS (Alongside existing coop-system)
# สคริปต์สำหรับ deploy internship system ควบคู่กับ coop-system ที่มีอยู่

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
APP_NAME="internship-system"
REMOTE_DIR="/opt/$APP_NAME"
DOMAIN="internship.dev.smart-solutions.com"  # Subdomain
MAIN_DOMAIN="dev.smart-solutions.com"

echo -e "${PURPLE}🚀 Internship System Deployment (Alongside Existing System)${NC}"
echo -e "${PURPLE}============================================================${NC}"
echo ""

echo -e "${CYAN}📊 ข้อมูล Deployment:${NC}"
echo "   Host: $VPS_HOST"
echo "   User: $VPS_USER"
echo "   Port: $VPS_PORT"
echo "   Subdomain: $DOMAIN"
echo "   Main Domain: $MAIN_DOMAIN"
echo "   Remote Directory: $REMOTE_DIR"
echo "   HTTP Port: 8080"
echo "   HTTPS Port: 8443"
echo ""

echo -e "${YELLOW}⚠️  หมายเหตุ:${NC}"
echo "   • ระบบจะ deploy ควบคู่กับ coop-system ที่มีอยู่"
echo "   • ใช้ port 8080 (HTTP) และ 8443 (HTTPS)"
echo "   • เข้าถึงได้ที่ http://$VPS_HOST:8080"
echo "   • หรือ https://$DOMAIN (หลังจากตั้งค่า SSL)"
echo ""

read -p "เริ่ม deployment หรือไม่? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Test SSH connection
test_ssh_connection() {
    echo -e "${BLUE}🔐 ทดสอบการเชื่อมต่อ SSH...${NC}"
    
    if ssh -p "$VPS_PORT" -o ConnectTimeout=10 -o BatchMode=yes "$VPS_USER@$VPS_HOST" exit 2>/dev/null; then
        echo -e "${GREEN}✅ SSH connection สำเร็จ${NC}"
    else
        echo -e "${RED}❌ SSH connection ล้มเหลว${NC}"
        exit 1
    fi
}

# Check existing system
check_existing_system() {
    echo -e "${BLUE}🔍 ตรวจสอบระบบที่มีอยู่...${NC}"
    
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" << 'EOF'
echo "=== Existing Services ==="
echo "PM2 Processes:"
pm2 list 2>/dev/null || echo "No PM2 processes"
echo ""

echo "Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "No Docker containers"
echo ""

echo "Nginx Status:"
systemctl is-active nginx 2>/dev/null || echo "Nginx not running"
echo ""

echo "Port Usage:"
echo "Port 80: $(ss -tuln | grep ':80 ' | wc -l) connections"
echo "Port 443: $(ss -tuln | grep ':443 ' | wc -l) connections"
echo "Port 8080: $(ss -tuln | grep ':8080 ' | wc -l) connections"
echo "Port 8443: $(ss -tuln | grep ':8443 ' | wc -l) connections"
EOF

    echo ""
    read -p "ดูข้อมูลข้างต้นแล้ว ต้องการดำเนินการต่อหรือไม่? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo "Deployment cancelled"
        exit 0
    fi
}

# Deploy application
deploy_application() {
    echo -e "${BLUE}🚀 กำลัง deploy internship system...${NC}"
    
    # Create deployment script
    cat > /tmp/deploy_internship.sh << EOF
#!/bin/bash

set -e

echo "📁 Creating application directory..."
mkdir -p $REMOTE_DIR
cd $REMOTE_DIR

echo "📥 Cloning/updating repository..."
if [ -d ".git" ]; then
    echo "Updating existing repository..."
    git stash
    git pull origin main
else
    echo "Cloning repository..."
    git clone https://github.com/aewaew419/internship.git .
fi

echo "🔧 Setting up environment..."
# Generate secure passwords (using hex to avoid special characters)
DB_PASSWORD=\$(openssl rand -hex 16)
JWT_SECRET=\$(openssl rand -hex 32)
REDIS_PASSWORD=\$(openssl rand -hex 16)
GRAFANA_PASSWORD=\$(openssl rand -hex 8)

# Create production environment file
cat > .env.production << EOL
# Production Environment Configuration
NODE_ENV=production
GO_ENV=production
PORT=8080
FRONTEND_PORT=3000

# Domain Configuration
DOMAIN=$DOMAIN
MAIN_DOMAIN=$MAIN_DOMAIN

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=internship_prod
DB_USER=internship_user
DB_PASSWORD=\$DB_PASSWORD

# JWT Configuration
JWT_SECRET=\$JWT_SECRET
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_PASSWORD=\$REDIS_PASSWORD

# CORS Configuration
CORS_ORIGIN=https://$DOMAIN,http://$VPS_HOST:8080

# Rate Limiting
RATE_LIMIT=100

# Logging
LOG_LEVEL=info

# Monitoring
GRAFANA_PASSWORD=\$GRAFANA_PASSWORD

# Security
SECURITY_HEADERS=true

# File Upload
MAX_FILE_SIZE=10MB
UPLOAD_PATH=/app/uploads

# Database ports (different from main system)
DB_PORT_EXTERNAL=5433
REDIS_PORT_EXTERNAL=6380
EOL

echo "🔒 Setting secure permissions..."
chmod 600 .env.production

echo "🔥 Opening firewall ports..."
ufw allow 8080/tcp
ufw allow 8443/tcp
ufw allow 5433/tcp
ufw allow 6380/tcp

echo "🐳 Building and starting containers..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production down --remove-orphans || true
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production build --no-cache
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d

echo "⏳ Waiting for services to be ready..."
sleep 30

echo "🏥 Checking service health..."
docker-compose -f deployment/docker-compose.prod.yml ps

echo "✅ Deployment completed!"
echo ""
echo "📊 Service URLs:"
echo "   Application: http://$VPS_HOST:8080"
echo "   Health Check: http://$VPS_HOST:8080/health"
echo "   Database: localhost:5433"
echo "   Redis: localhost:6380"
echo ""
echo "🔐 Generated passwords saved in: $REMOTE_DIR/.env.production"
EOF

    # Copy and run deployment script
    scp -P "$VPS_PORT" /tmp/deploy_internship.sh "$VPS_USER@$VPS_HOST:/tmp/"
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "chmod +x /tmp/deploy_internship.sh && /tmp/deploy_internship.sh"
}

# Setup subdomain (optional)
setup_subdomain() {
    echo -e "${BLUE}🌐 ตั้งค่า subdomain...${NC}"
    
    echo "หมายเหตุ: ต้องตั้งค่า DNS A record สำหรับ $DOMAIN ให้ชี้ไปยัง $VPS_HOST"
    read -p "DNS record ตั้งค่าแล้วหรือไม่? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "ข้าม subdomain setup ไว้ก่อน"
        return
    fi
    
    cat > /tmp/setup_subdomain.sh << EOF
#!/bin/bash

set -e

echo "📋 Creating Nginx config for subdomain..."
cat > /etc/nginx/sites-available/internship-system << 'EOL'
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOL

echo "🔗 Enabling site..."
ln -sf /etc/nginx/sites-available/internship-system /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

echo "✅ Subdomain setup completed!"
echo "   Access via: http://$DOMAIN"
EOL

    scp -P "$VPS_PORT" /tmp/setup_subdomain.sh "$VPS_USER@$VPS_HOST:/tmp/"
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "chmod +x /tmp/setup_subdomain.sh && /tmp/setup_subdomain.sh"
}

# Final health check
final_health_check() {
    echo -e "${BLUE}🏥 ตรวจสอบสุขภาพระบบ...${NC}"
    
    # Wait for services to fully start
    sleep 30
    
    # Test health endpoint via IP:port
    if curl -f -s "http://$VPS_HOST:8080/health" > /dev/null; then
        echo -e "${GREEN}✅ Health endpoint (IP:8080): OK${NC}"
    else
        echo -e "${YELLOW}⚠️  Health endpoint (IP:8080): ยังไม่พร้อม${NC}"
    fi
    
    # Test frontend via IP:port
    if curl -f -s "http://$VPS_HOST:8080" > /dev/null; then
        echo -e "${GREEN}✅ Frontend (IP:8080): OK${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend (IP:8080): ยังไม่พร้อม${NC}"
    fi
    
    # Check container status
    echo -e "${BLUE}🐳 Container Status:${NC}"
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "cd $REMOTE_DIR && docker-compose -f deployment/docker-compose.prod.yml ps"
}

# Print deployment summary
print_summary() {
    echo ""
    echo -e "${GREEN}🎉 Deployment สำเร็จแล้ว!${NC}"
    echo -e "${PURPLE}=================================${NC}"
    echo ""
    echo -e "${CYAN}📊 ข้อมูล Deployment:${NC}"
    echo "   🌐 Website: http://$VPS_HOST:8080"
    echo "   🏥 Health Check: http://$VPS_HOST:8080/health"
    echo "   🖥️  VPS: $VPS_USER@$VPS_HOST"
    echo "   📁 Directory: $REMOTE_DIR"
    echo ""
    echo -e "${CYAN}🔗 Port Mapping:${NC}"
    echo "   HTTP: 8080 → 80 (container)"
    echo "   HTTPS: 8443 → 443 (container)"
    echo "   Database: 5433 → 5432 (container)"
    echo "   Redis: 6380 → 6379 (container)"
    echo ""
    echo -e "${CYAN}🛠️  Management Commands:${NC}"
    echo "   View logs: ssh -p $VPS_PORT $VPS_USER@$VPS_HOST 'cd $REMOTE_DIR && docker-compose -f deployment/docker-compose.prod.yml logs'"
    echo "   Restart: ssh -p $VPS_PORT $VPS_USER@$VPS_HOST 'cd $REMOTE_DIR && docker-compose -f deployment/docker-compose.prod.yml restart'"
    echo "   Stop: ssh -p $VPS_PORT $VPS_USER@$VPS_HOST 'cd $REMOTE_DIR && docker-compose -f deployment/docker-compose.prod.yml down'"
    echo ""
    echo -e "${YELLOW}⚠️  ขั้นตอนต่อไป:${NC}"
    echo "   1. ทดสอบระบบที่ http://$VPS_HOST:8080"
    echo "   2. ตั้งค่า DNS สำหรับ $DOMAIN (ถ้าต้องการ)"
    echo "   3. ตั้งค่า SSL certificate สำหรับ subdomain"
    echo ""
    echo -e "${GREEN}🚀 ระบบพร้อมใช้งานแล้วที่: http://$VPS_HOST:8080${NC}"
}

# Main deployment process
main() {
    test_ssh_connection
    check_existing_system
    deploy_application
    
    echo ""
    read -p "ต้องการตั้งค่า subdomain หรือไม่? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_subdomain
    fi
    
    final_health_check
    print_summary
    
    # Cleanup temporary files
    rm -f /tmp/deploy_internship.sh /tmp/setup_subdomain.sh
}

# Run main function
main "$@"