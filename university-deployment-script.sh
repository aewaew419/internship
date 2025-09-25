#!/bin/bash

# University Deployment Script
# สคริปต์สำหรับ deploy ระบบไปยัง server มหาวิทยาลัย

echo "🏛️ University Deployment Script"
echo "================================"

# Configuration
read -p "🌐 University domain (เช่น university.ac.th): " UNIVERSITY_DOMAIN
read -p "📡 Server IP address: " SERVER_IP
read -p "👤 SSH username (default: root): " SSH_USER
SSH_USER=${SSH_USER:-root}
read -p "🔑 SSH port (default: 22): " SSH_PORT
SSH_PORT=${SSH_PORT:-22}

# Subdomain options
echo ""
echo "📋 เลือกรูปแบบ URL:"
echo "1. internship.$UNIVERSITY_DOMAIN"
echo "2. coop.$UNIVERSITY_DOMAIN"
echo "3. student-internship.$UNIVERSITY_DOMAIN"
echo "4. กำหนดเอง"
read -p "เลือก (1-4): " URL_CHOICE

case $URL_CHOICE in
    1) SUBDOMAIN="internship.$UNIVERSITY_DOMAIN" ;;
    2) SUBDOMAIN="coop.$UNIVERSITY_DOMAIN" ;;
    3) SUBDOMAIN="student-internship.$UNIVERSITY_DOMAIN" ;;
    4) read -p "ใส่ subdomain: " SUBDOMAIN ;;
    *) SUBDOMAIN="internship.$UNIVERSITY_DOMAIN" ;;
esac

echo ""
echo "📊 สรุปการตั้งค่า:"
echo "   Server: $SERVER_IP"
echo "   Domain: $SUBDOMAIN"
echo "   SSH: $SSH_USER@$SERVER_IP:$SSH_PORT"
echo ""
read -p "ยืนยันการตั้งค่า? (y/N): " CONFIRM

if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "❌ ยกเลิกการ deploy"
    exit 1
fi

# Test SSH connection
echo "🔍 ทดสอบการเชื่อมต่อ SSH..."
if ! ssh -o ConnectTimeout=10 -p "$SSH_PORT" "$SSH_USER@$SERVER_IP" "echo 'SSH OK'"; then
    echo "❌ ไม่สามารถเชื่อมต่อ SSH ได้"
    echo "💡 กรุณาตรวจสอบ:"
    echo "   - SSH key หรือ password"
    echo "   - Server IP และ port"
    echo "   - Firewall settings"
    exit 1
fi

echo "✅ SSH connection OK"

# Create deployment package
echo "📦 เตรียมไฟล์สำหรับ deployment..."
tar -czf internship-deployment.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=.next \
    --exclude=dist \
    --exclude=build \
    .

# Create deployment script for server
cat > /tmp/university_deploy.sh << EOF
#!/bin/bash

echo "🏛️ เริ่ม University Deployment..."

# Update system
echo "📦 อัพเดทระบบ..."
apt update && apt upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "🐳 ติดตั้ง Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "🔧 ติดตั้ง Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Create application directory
echo "📁 สร้าง directory..."
mkdir -p /opt/internship-system
cd /opt/internship-system

# Extract deployment files
echo "📤 แตกไฟล์..."
tar -xzf /tmp/internship-deployment.tar.gz

# Create environment file
echo "⚙️ สร้าง environment file..."
cat > .env.production << 'ENVEOF'
NODE_ENV=production
GO_ENV=production
DOMAIN=$SUBDOMAIN
DB_NAME=internship_prod
DB_USER=internship_user
DB_PASSWORD=\$(openssl rand -base64 32)
JWT_SECRET=\$(openssl rand -base64 64)
JWT_EXPIRES_IN=24h
REDIS_PASSWORD=\$(openssl rand -base64 32)
CORS_ORIGIN=https://$SUBDOMAIN
RATE_LIMIT=100
LOG_LEVEL=info
GRAFANA_PASSWORD=admin123
SMTP_HOST=smtp.$UNIVERSITY_DOMAIN
SMTP_PORT=587
ENVEOF

# Install SSL certificate
echo "🔐 ติดตั้ง SSL certificate..."
if command -v certbot &> /dev/null; then
    certbot certonly --standalone -d $SUBDOMAIN --non-interactive --agree-tos --email admin@$UNIVERSITY_DOMAIN
    
    # Copy certificates
    mkdir -p deployment/nginx/ssl
    cp /etc/letsencrypt/live/$SUBDOMAIN/fullchain.pem deployment/nginx/ssl/cert.pem
    cp /etc/letsencrypt/live/$SUBDOMAIN/privkey.pem deployment/nginx/ssl/key.pem
else
    echo "⚠️ Certbot ไม่พบ - สร้าง self-signed certificate"
    mkdir -p deployment/nginx/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout deployment/nginx/ssl/key.pem \
        -out deployment/nginx/ssl/cert.pem \
        -subj "/C=TH/ST=Bangkok/L=Bangkok/O=$UNIVERSITY_DOMAIN/CN=$SUBDOMAIN"
fi

# Configure Nginx
echo "🌐 ตั้งค่า Nginx..."
cat > deployment/nginx/nginx.conf << 'NGINXEOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8080;
    }
    
    upstream frontend {
        server frontend:3000;
    }
    
    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name $SUBDOMAIN;
        return 301 https://\$server_name\$request_uri;
    }
    
    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name $SUBDOMAIN;
        
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_private_key /etc/nginx/ssl/key.pem;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
        
        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # Health check
        location /health {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
        }
        
        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
NGINXEOF

# Configure firewall
echo "🔥 ตั้งค่า firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Deploy application
echo "🚀 Deploy application..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d

# Wait for services
echo "⏳ รอให้ services เริ่มทำงาน..."
sleep 60

# Check status
echo "📊 ตรวจสอบสถานะ..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production ps

# Test endpoints
echo "🧪 ทดสอบระบบ..."
curl -k -I https://localhost/health || echo "Health check failed"

# Setup auto-renewal for SSL
echo "🔄 ตั้งค่า SSL auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'cd /opt/internship-system && docker-compose -f deployment/docker-compose.prod.yml restart nginx'") | crontab -

# Setup backup
echo "💾 ตั้งค่า backup..."
mkdir -p /opt/internship-system/backups
cat > /opt/internship-system/backup.sh << 'BACKUPEOF'
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/internship-system/backups"
docker exec internship_db pg_dump -U internship_user internship_prod | gzip > "\$BACKUP_DIR/db_backup_\$DATE.sql.gz"
find "\$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +7 -delete
BACKUPEOF

chmod +x /opt/internship-system/backup.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/internship-system/backup.sh") | crontab -

echo "✅ University deployment เสร็จสิ้น!"
echo ""
echo "🌐 URLs:"
echo "   https://$SUBDOMAIN"
echo ""
echo "🔑 Default Admin:"
echo "   Email: admin@$UNIVERSITY_DOMAIN"
echo "   Password: admin123"
echo ""
echo "📋 Next Steps:"
echo "   1. ตั้งค่า DNS A record: $SUBDOMAIN -> $SERVER_IP"
echo "   2. ทดสอบระบบ"
echo "   3. สร้าง user accounts"
echo "   4. อบรมผู้ใช้งาน"
EOF

# Upload and execute deployment
echo "📤 อัพโหลดไฟล์ไปยัง server..."
scp -P "$SSH_PORT" internship-deployment.tar.gz "$SSH_USER@$SERVER_IP:/tmp/"
scp -P "$SSH_PORT" /tmp/university_deploy.sh "$SSH_USER@$SERVER_IP:/tmp/"

echo "🚀 เริ่ม deployment บน server..."
ssh -p "$SSH_PORT" "$SSH_USER@$SERVER_IP" "chmod +x /tmp/university_deploy.sh && /tmp/university_deploy.sh"

# Cleanup
rm -f internship-deployment.tar.gz /tmp/university_deploy.sh

echo ""
echo "🎉 Deployment เสร็จสิ้น!"
echo ""
echo "📋 สิ่งที่ต้องทำต่อ:"
echo ""
echo "1. 🌐 ตั้งค่า DNS:"
echo "   เพิ่ม A record: $SUBDOMAIN -> $SERVER_IP"
echo ""
echo "2. 🧪 ทดสอบระบบ:"
echo "   https://$SUBDOMAIN"
echo ""
echo "3. 👥 สร้าง user accounts:"
echo "   Login ด้วย admin@$UNIVERSITY_DOMAIN / admin123"
echo ""
echo "4. 📚 อบรมผู้ใช้งาน"
echo ""
echo "5. 📞 ติดต่อ IT support หากมีปัญหา"
echo ""
echo "✅ ระบบพร้อมใช้งาน!"