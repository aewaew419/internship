#!/bin/bash

# Fix Server Issues Script
echo "🔧 กำลังแก้ไขปัญหาเซิร์ฟเวอร์..."

VPS_HOST="203.170.129.199"
VPS_USER="root"
VPS_PORT="22"

# Check if we can SSH
echo "📡 ตรวจสอบการเชื่อมต่อ SSH..."
if ! ssh -o ConnectTimeout=10 -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "echo 'SSH OK'"; then
    echo "❌ ไม่สามารถเชื่อมต่อ SSH ได้"
    echo "💡 กรุณาตรวจสอบ:"
    echo "   - SSH key หรือ password"
    echo "   - Firewall settings"
    echo "   - VPS status"
    exit 1
fi

echo "✅ SSH เชื่อมต่อได้"

# Create fix script
cat > /tmp/server_fix.sh << 'EOF'
#!/bin/bash
echo "🔍 ตรวจสอบสถานะ Docker containers..."

# Check if Docker is running
if ! systemctl is-active --quiet docker; then
    echo "🔄 เริ่ม Docker service..."
    systemctl start docker
    systemctl enable docker
fi

# Go to project directory
cd /opt/internship-system || {
    echo "❌ ไม่พบ directory /opt/internship-system"
    echo "💡 ระบบอาจยังไม่ได้ deploy"
    exit 1
}

# Check containers status
echo "📊 สถานะ containers:"
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production ps

# Check logs
echo "📝 ตรวจสอบ logs..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production logs --tail 20

# Restart services
echo "🔄 Restart services..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production down
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d

# Wait and check
sleep 30
echo "✅ ตรวจสอบสถานะหลัง restart:"
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production ps
EOF

# Copy and run fix script
echo "📤 อัพโหลดและรันสคริปต์แก้ไข..."
scp -P "$VPS_PORT" /tmp/server_fix.sh "$VPS_USER@$VPS_HOST:/tmp/"
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "chmod +x /tmp/server_fix.sh && /tmp/server_fix.sh"

# Test the fix
echo "🧪 ทดสอบการทำงาน..."
sleep 10
curl -k -I https://203.170.129.199:8443/ || echo "❌ ยังมีปัญหา"

echo "🎉 เสร็จสิ้น!"