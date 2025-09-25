#!/bin/bash

# Redeploy System Script
echo "🚀 กำลัง Deploy ระบบใหม่..."

VPS_HOST="203.170.129.199"
VPS_USER="root"
VPS_PORT="22"

# Create deployment script
cat > /tmp/redeploy.sh << 'EOF'
#!/bin/bash

# Stop existing services
echo "🛑 หยุดระบบเก่า..."
cd /opt/internship-system 2>/dev/null || true
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production down 2>/dev/null || true

# Clean up
echo "🧹 ทำความสะอาด..."
docker system prune -f
docker volume prune -f

# Fresh deployment
echo "📥 Clone repository ใหม่..."
rm -rf /opt/internship-system-new
mkdir -p /opt/internship-system-new
cd /opt/internship-system-new

git clone https://github.com/aewaew419/internship.git .

# Create environment file
echo "⚙️ สร้าง environment file..."
cat > .env.production << 'ENVEOF'
NODE_ENV=production
GO_ENV=production
DOMAIN=203.170.129.199
DB_NAME=internship_prod
DB_USER=internship_user
DB_PASSWORD=internship_secure_password_2024
JWT_SECRET=your_super_secret_jwt_key_here_32_chars
JWT_EXPIRES_IN=24h
REDIS_PASSWORD=redis_secure_password_2024
CORS_ORIGIN=*
RATE_LIMIT=100
LOG_LEVEL=info
GRAFANA_PASSWORD=admin123
ENVEOF

# Deploy
echo "🚀 Deploy ระบบ..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d

# Wait for services
echo "⏳ รอให้ services เริ่มทำงาน..."
sleep 60

# Check status
echo "✅ ตรวจสอบสถานะ:"
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production ps

# Replace old system
echo "🔄 อัพเดทระบบ..."
cd /opt
rm -rf internship-system-backup 2>/dev/null || true
mv internship-system internship-system-backup 2>/dev/null || true
mv internship-system-new internship-system

echo "🎉 Deploy เสร็จสิ้น!"
EOF

# Run deployment
echo "📤 เริ่ม deployment..."
scp -P "$VPS_PORT" /tmp/redeploy.sh "$VPS_USER@$VPS_HOST:/tmp/"
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "chmod +x /tmp/redeploy.sh && /tmp/redeploy.sh"

# Test
echo "🧪 ทดสอบระบบ..."
sleep 30
curl -k -I https://203.170.129.199:8443/

echo "✅ เสร็จสิ้น!"