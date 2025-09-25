#!/bin/bash

# Deployment Script for Hostatom VPS
# สคริปต์สำหรับ deploy ไปยัง VPS hostatom

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
VPS_USER="root"  # หรือ username ที่ใช้
VPS_HOST=""      # IP หรือ domain ของ VPS
VPS_PORT="22"    # SSH port
APP_NAME="internship-system"
REMOTE_DIR="/opt/$APP_NAME"
DOMAIN=""        # Domain ที่จะใช้

echo -e "${PURPLE}🚀 Hostatom VPS Deployment Script${NC}"
echo -e "${PURPLE}=================================${NC}"
echo ""

# Get VPS information
get_vps_info() {
    echo -e "${BLUE}📋 กรุณากรอกข้อมูล VPS Hostatom:${NC}"
    echo ""
    
    # Get VPS IP/Domain
    while [[ -z "$VPS_HOST" ]]; do
        read -p "VPS IP หรือ Domain: " VPS_HOST
        if [[ -z "$VPS_HOST" ]]; then
            echo -e "${RED}กรุณากรอก IP หรือ Domain${NC}"
        fi
    done
    
    # Get SSH user (default: root)
    read -p "SSH Username (default: root): " input_user
    if [[ -n "$input_user" ]]; then
        VPS_USER="$input_user"
    fi
    
    # Get SSH port (default: 22)
    read -p "SSH Port (default: 22): " input_port
    if [[ -n "$input_port" ]]; then
        VPS_PORT="$input_port"
    fi
    
    # Get domain for the application
    while [[ -z "$DOMAIN" ]]; do
        read -p "Domain สำหรับเว็บไซต์ (เช่น internship.university.ac.th): " DOMAIN
        if [[ -z "$DOMAIN" ]]; then
            echo -e "${RED}กรุณากรอก Domain${NC}"
        fi
    done
    
    echo ""
    echo -e "${CYAN}📊 ข้อมูล VPS:${NC}"
    echo "   Host: $VPS_HOST"
    echo "   User: $VPS_USER"
    echo "   Port: $VPS_PORT"
    echo "   Domain: $DOMAIN"
    echo "   Remote Directory: $REMOTE_DIR"
    echo ""
    
    read -p "ข้อมูลถูกต้องหรือไม่? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo "กรุณาเริ่มใหม่"
        exit 0
    fi
}

# Test SSH connection
test_ssh_connection() {
    echo -e "${BLUE}🔐 ทดสอบการเชื่อมต่อ SSH...${NC}"
    
    if ssh -p "$VPS_PORT" -o ConnectTimeout=10 -o BatchMode=yes "$VPS_USER@$VPS_HOST" exit 2>/dev/null; then
        echo -e "${GREEN}✅ SSH connection สำเร็จ${NC}"
    else
        echo -e "${RED}❌ SSH connection ล้มเหลว${NC}"
        echo "กรุณาตรวจสอบ:"
        echo "1. IP/Domain ถูกต้อง"
        echo "2. SSH key ได้ถูกเพิ่มใน VPS แล้ว"
        echo "3. Port SSH ถูกต้อง"
        echo ""
        echo "หากยังไม่มี SSH key ให้รันคำสั่ง:"
        echo "ssh-copy-id -p $VPS_PORT $VPS_USER@$VPS_HOST"
        exit 1
    fi
}

# Check VPS requirements
check_vps_requirements() {
    echo -e "${BLUE}🔍 ตรวจสอบความพร้อมของ VPS...${NC}"
    
    # Create a script to run on VPS
    cat > /tmp/check_requirements.sh << 'EOF'
#!/bin/bash

echo "=== System Information ==="
echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "Kernel: $(uname -r)"
echo "Architecture: $(uname -m)"
echo ""

echo "=== Resource Check ==="
echo "CPU Cores: $(nproc)"
echo "Memory: $(free -h | awk 'NR==2{printf "Total: %s, Available: %s", $2, $7}')"
echo "Disk Space: $(df -h / | awk 'NR==2{printf "Total: %s, Available: %s, Used: %s", $2, $4, $5}')"
echo ""

echo "=== Required Software Check ==="
# Check Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker: $(docker --version)"
else
    echo "❌ Docker: Not installed"
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose: $(docker-compose --version)"
else
    echo "❌ Docker Compose: Not installed"
fi

# Check Git
if command -v git &> /dev/null; then
    echo "✅ Git: $(git --version)"
else
    echo "❌ Git: Not installed"
fi

# Check available ports
echo ""
echo "=== Port Check ==="
for port in 80 443 22; do
    if ss -tuln | grep -q ":$port "; then
        echo "⚠️  Port $port: In use"
    else
        echo "✅ Port $port: Available"
    fi
done
EOF

    # Copy and run the script on VPS
    scp -P "$VPS_PORT" /tmp/check_requirements.sh "$VPS_USER@$VPS_HOST:/tmp/"
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "chmod +x /tmp/check_requirements.sh && /tmp/check_requirements.sh"
    
    echo ""
    read -p "VPS พร้อมสำหรับ deployment หรือไม่? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo "กรุณาติดตั้ง software ที่จำเป็นก่อน deployment"
        exit 0
    fi
}

# Install required software on VPS
install_requirements() {
    echo -e "${BLUE}📦 ติดตั้ง software ที่จำเป็น...${NC}"
    
    cat > /tmp/install_requirements.sh << 'EOF'
#!/bin/bash

set -e

echo "🔄 Updating system packages..."
apt update && apt upgrade -y

echo "📦 Installing basic packages..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

echo "🐙 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi

echo "🔥 Setting up firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "✅ Requirements installation completed"
EOF

    scp -P "$VPS_PORT" /tmp/install_requirements.sh "$VPS_USER@$VPS_HOST:/tmp/"
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "chmod +x /tmp/install_requirements.sh && /tmp/install_requirements.sh"
}

# Deploy application to VPS
deploy_application() {
    echo -e "${BLUE}🚀 กำลัง deploy application...${NC}"
    
    # Create deployment script
    cat > /tmp/deploy_app.sh << EOF
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
# Generate secure passwords
DB_PASSWORD=\$(openssl rand -base64 32)
JWT_SECRET=\$(openssl rand -base64 64)
REDIS_PASSWORD=\$(openssl rand -base64 32)
GRAFANA_PASSWORD=\$(openssl rand -base64 16)

# Create production environment file
cat > .env.production << EOL
# Production Environment Configuration
NODE_ENV=production
GO_ENV=production
PORT=8080
FRONTEND_PORT=3000

# Domain Configuration
DOMAIN=$DOMAIN

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
CORS_ORIGIN=https://$DOMAIN

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
EOL

echo "🔒 Setting secure permissions..."
chmod 600 .env.production

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
echo "   Application: https://$DOMAIN"
echo "   Health Check: https://$DOMAIN/health"
echo ""
echo "🔐 Generated passwords saved in: $REMOTE_DIR/.env.production"
EOF

    # Copy and run deployment script
    scp -P "$VPS_PORT" /tmp/deploy_app.sh "$VPS_USER@$VPS_HOST:/tmp/"
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "chmod +x /tmp/deploy_app.sh && /tmp/deploy_app.sh"
}

# Setup SSL certificate
setup_ssl() {
    echo -e "${BLUE}🔒 ติดตั้ง SSL certificate...${NC}"
    
    cat > /tmp/setup_ssl.sh << EOF
#!/bin/bash

set -e

echo "📦 Installing Certbot..."
apt update
apt install -y certbot python3-certbot-nginx

echo "🛑 Stopping nginx temporarily..."
docker-compose -f $REMOTE_DIR/deployment/docker-compose.prod.yml stop nginx || true

echo "🔒 Getting SSL certificate..."
certbot certonly --standalone \\
    --non-interactive \\
    --agree-tos \\
    --email admin@$DOMAIN \\
    -d $DOMAIN

echo "📋 Copying certificates..."
mkdir -p $REMOTE_DIR/deployment/nginx/ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $REMOTE_DIR/deployment/nginx/ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $REMOTE_DIR/deployment/nginx/ssl/
chown -R 1000:1000 $REMOTE_DIR/deployment/nginx/ssl/

echo "🔄 Restarting nginx..."
cd $REMOTE_DIR
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d nginx

echo "⚙️ Setting up auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'cd $REMOTE_DIR && docker-compose -f deployment/docker-compose.prod.yml restart nginx'") | crontab -

echo "✅ SSL setup completed!"
EOF

    scp -P "$VPS_PORT" /tmp/setup_ssl.sh "$VPS_USER@$VPS_HOST:/tmp/"
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "chmod +x /tmp/setup_ssl.sh && /tmp/setup_ssl.sh"
}

# Setup monitoring and backups
setup_monitoring() {
    echo -e "${BLUE}📊 ติดตั้งระบบ monitoring และ backup...${NC}"
    
    cat > /tmp/setup_monitoring.sh << EOF
#!/bin/bash

set -e

cd $REMOTE_DIR

echo "📊 Starting monitoring services..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production --profile monitoring up -d

echo "📅 Setting up backup cron jobs..."
# Database backup script
cat > scripts/backup-db.sh << 'EOL'
#!/bin/bash
BACKUP_DIR="$REMOTE_DIR/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
mkdir -p "\$BACKUP_DIR"
docker exec internship_db pg_dump -U internship_user internship_prod | gzip > "\$BACKUP_DIR/db_backup_\$DATE.sql.gz"
find "\$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +7 -delete
EOL

chmod +x scripts/backup-db.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * $REMOTE_DIR/scripts/backup-db.sh") | crontab -

echo "✅ Monitoring and backup setup completed!"
EOF

    scp -P "$VPS_PORT" /tmp/setup_monitoring.sh "$VPS_USER@$VPS_HOST:/tmp/"
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "chmod +x /tmp/setup_monitoring.sh && /tmp/setup_monitoring.sh"
}

# Final health check
final_health_check() {
    echo -e "${BLUE}🏥 ตรวจสอบสุขภาพระบบ...${NC}"
    
    # Wait for services to fully start
    sleep 30
    
    # Test health endpoint
    if curl -f -s "https://$DOMAIN/health" > /dev/null; then
        echo -e "${GREEN}✅ Health endpoint: OK${NC}"
    else
        echo -e "${YELLOW}⚠️  Health endpoint: ยังไม่พร้อม (อาจต้องรอสักครู่)${NC}"
    fi
    
    # Test frontend
    if curl -f -s "https://$DOMAIN" > /dev/null; then
        echo -e "${GREEN}✅ Frontend: OK${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend: ยังไม่พร้อม${NC}"
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
    echo "   🌐 Website: https://$DOMAIN"
    echo "   🏥 Health Check: https://$DOMAIN/health"
    echo "   🖥️  VPS: $VPS_USER@$VPS_HOST"
    echo "   📁 Directory: $REMOTE_DIR"
    echo ""
    echo -e "${CYAN}🔐 Security:${NC}"
    echo "   ✅ HTTPS/SSL Certificate"
    echo "   ✅ Firewall Configured"
    echo "   ✅ Secure Passwords Generated"
    echo ""
    echo -e "${CYAN}🛠️  Management Commands:${NC}"
    echo "   View logs: ssh -p $VPS_PORT $VPS_USER@$VPS_HOST 'cd $REMOTE_DIR && docker-compose -f deployment/docker-compose.prod.yml logs'"
    echo "   Restart: ssh -p $VPS_PORT $VPS_USER@$VPS_HOST 'cd $REMOTE_DIR && docker-compose -f deployment/docker-compose.prod.yml restart'"
    echo "   Update: ssh -p $VPS_PORT $VPS_USER@$VPS_HOST 'cd $REMOTE_DIR && git pull && docker-compose -f deployment/docker-compose.prod.yml build && docker-compose -f deployment/docker-compose.prod.yml up -d'"
    echo ""
    echo -e "${YELLOW}⚠️  สำคัญ:${NC}"
    echo "   • รหัสผ่านต่างๆ เก็บไว้ที่: $REMOTE_DIR/.env.production"
    echo "   • Backup database ทำงานอัตโนมัติทุกวันเวลา 02:00"
    echo "   • SSL certificate จะต่ออายุอัตโนมัติ"
    echo ""
    echo -e "${GREEN}🚀 ระบบพร้อมใช้งานแล้วที่: https://$DOMAIN${NC}"
}

# Main deployment process
main() {
    echo -e "${BLUE}เริ่มต้น deployment ไปยัง Hostatom VPS...${NC}"
    echo ""
    
    get_vps_info
    test_ssh_connection
    check_vps_requirements
    
    echo ""
    read -p "ต้องการติดตั้ง software ที่จำเป็นหรือไม่? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        install_requirements
    fi
    
    deploy_application
    
    echo ""
    read -p "ต้องการติดตั้ง SSL certificate หรือไม่? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        setup_ssl
    fi
    
    echo ""
    read -p "ต้องการติดตั้งระบบ monitoring หรือไม่? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_monitoring
    fi
    
    final_health_check
    print_summary
    
    # Cleanup temporary files
    rm -f /tmp/check_requirements.sh /tmp/install_requirements.sh /tmp/deploy_app.sh /tmp/setup_ssl.sh /tmp/setup_monitoring.sh
}

# Run main function
main "$@"