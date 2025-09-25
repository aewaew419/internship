#!/bin/bash

# Deployment Script for Hostatom VPS (Using IP Address)
# สคริปต์สำหรับ deploy ไปยัง VPS hostatom โดยใช้ IP address

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration - ใช้ข้อมูลที่ได้รับ
VPS_USER="root"
VPS_HOST="203.170.129.199"  # IP address
VPS_PORT="22"
APP_NAME="internship-system"
REMOTE_DIR="/opt/$APP_NAME"
DOMAIN="dev.smart-solutions.com"  # Domain name สำหรับ SSL

echo -e "${PURPLE}🚀 Hostatom VPS Deployment Script${NC}"
echo -e "${PURPLE}=================================${NC}"
echo ""

echo -e "${CYAN}📊 ข้อมูล VPS:${NC}"
echo "   Host: $VPS_HOST"
echo "   User: $VPS_USER"
echo "   Port: $VPS_PORT"
echo "   Domain: $DOMAIN"
echo "   Remote Directory: $REMOTE_DIR"
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
echo "   Application: http://$VPS_HOST (or https://$DOMAIN after SSL setup)"
echo "   Health Check: http://$VPS_HOST/health"
echo ""
echo "🔐 Generated passwords saved in: $REMOTE_DIR/.env.production"
EOF

    # Copy and run deployment script
    scp -P "$VPS_PORT" /tmp/deploy_app.sh "$VPS_USER@$VPS_HOST:/tmp/"
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "chmod +x /tmp/deploy_app.sh && /tmp/deploy_app.sh"
}

# Setup SSL certificate (optional for now since domain might not point to IP yet)
setup_ssl() {
    echo -e "${BLUE}🔒 ติดตั้ง SSL certificate...${NC}"
    
    echo "หมายเหตุ: ตรวจสอบให้แน่ใจว่า domain $DOMAIN ชี้ไปยัง IP $VPS_HOST แล้ว"
    read -p "Domain ชี้ไปยัง IP แล้วหรือไม่? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "ข้าม SSL setup ไว้ก่อน สามารถติดตั้งทีหลังได้"
        return
    fi
    
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

# Final health check
final_health_check() {
    echo -e "${BLUE}🏥 ตรวจสอบสุขภาพระบบ...${NC}"
    
    # Wait for services to fully start
    sleep 30
    
    # Test health endpoint via IP
    if curl -f -s "http://$VPS_HOST/health" > /dev/null; then
        echo -e "${GREEN}✅ Health endpoint (IP): OK${NC}"
    else
        echo -e "${YELLOW}⚠️  Health endpoint (IP): ยังไม่พร้อม${NC}"
    fi
    
    # Test frontend via IP
    if curl -f -s "http://$VPS_HOST" > /dev/null; then
        echo -e "${GREEN}✅ Frontend (IP): OK${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend (IP): ยังไม่พร้อม${NC}"
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
    echo "   🌐 Website (IP): http://$VPS_HOST"
    echo "   🌐 Website (Domain): http://$DOMAIN (ถ้า DNS ชี้แล้ว)"
    echo "   🏥 Health Check: http://$VPS_HOST/health"
    echo "   🖥️  VPS: $VPS_USER@$VPS_HOST"
    echo "   📁 Directory: $REMOTE_DIR"
    echo ""
    echo -e "${CYAN}🛠️  Management Commands:${NC}"
    echo "   View logs: ssh -p $VPS_PORT $VPS_USER@$VPS_HOST 'cd $REMOTE_DIR && docker-compose -f deployment/docker-compose.prod.yml logs'"
    echo "   Restart: ssh -p $VPS_PORT $VPS_USER@$VPS_HOST 'cd $REMOTE_DIR && docker-compose -f deployment/docker-compose.prod.yml restart'"
    echo "   Update: ssh -p $VPS_PORT $VPS_USER@$VPS_HOST 'cd $REMOTE_DIR && git pull && docker-compose -f deployment/docker-compose.prod.yml build && docker-compose -f deployment/docker-compose.prod.yml up -d'"
    echo ""
    echo -e "${YELLOW}⚠️  ขั้นตอนต่อไป:${NC}"
    echo "   1. ตั้งค่า DNS ให้ $DOMAIN ชี้ไปยัง $VPS_HOST"
    echo "   2. รัน SSL setup: ssh $VPS_USER@$VPS_HOST 'cd $REMOTE_DIR && /tmp/setup_ssl.sh'"
    echo "   3. ทดสอบเว็บไซต์ที่ https://$DOMAIN"
    echo ""
    echo -e "${GREEN}🚀 ระบบพร้อมใช้งานแล้วที่: http://$VPS_HOST${NC}"
}

# Main deployment process
main() {
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
    read -p "ต้องการติดตั้ง SSL certificate หรือไม่? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_ssl
    fi
    
    final_health_check
    print_summary
    
    # Cleanup temporary files
    rm -f /tmp/check_requirements.sh /tmp/install_requirements.sh /tmp/deploy_app.sh /tmp/setup_ssl.sh
}

# Run main function
main "$@"