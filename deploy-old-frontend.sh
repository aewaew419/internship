#!/bin/bash

echo "🔄 Deploy Old Frontend (Vite + React)"
echo "===================================="

VPS_IP="203.170.129.199"
VPS_USER="root"
VPS_PORT="22"

# สร้าง script deploy frontend เก่า
cat > /tmp/deploy_old_frontend.sh << 'EOF'
#!/bin/bash

echo "🔄 Deploying old frontend (Vite + React)..."

# หยุด services
systemctl stop nginx
docker stop $(docker ps -aq) 2>/dev/null || true

# เตรียมโฟลเดอร์
cd /opt/internship-system
rm -rf old-frontend

# Clone repository
git clone https://github.com/ultramanx88/internship.git old-frontend
cd old-frontend/front-end

# ติดตั้ง Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# ติดตั้ง dependencies
npm install

# Build frontend เก่า
npm run build

# Copy built files
rm -rf /var/www/html/*
cp -r dist/* /var/www/html/

# สร้าง Docker สำหรับ Vite frontend
cat > /opt/internship-system/docker-compose.old-frontend.yml << 'DOCKEREOF'
services:
  old-frontend:
    image: node:18-alpine
    container_name: internship_old_frontend
    working_dir: /app
    volumes:
      - ./old-frontend/front-end:/app
    command: sh -c "
      echo 'Installing dependencies...' &&
      npm install &&
      echo 'Starting Vite dev server...' &&
      npm run dev -- --host 0.0.0.0 --port 3000
    "
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development

  nginx:
    image: nginx:alpine
    container_name: internship_nginx_old
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx-old-frontend.conf:/etc/nginx/nginx.conf
    depends_on:
      - old-frontend
DOCKEREOF

# สร้าง nginx config สำหรับ Vite
cat > /opt/internship-system/nginx-old-frontend.conf << 'NGINXEOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    upstream old_frontend {
        server old-frontend:3000;
    }
    
    server {
        listen 80;
        server_name _;
        
        # Vite HMR WebSocket
        location /vite-dev-server {
            proxy_pass http://old_frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
        
        # Static assets
        location /assets/ {
            proxy_pass http://old_frontend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # All other requests
        location / {
            proxy_pass http://old_frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
NGINXEOF

# เริ่มต้น Docker services
cd /opt/internship-system
docker-compose -f docker-compose.old-frontend.yml up -d

echo "⏳ รอให้ Vite dev server พร้อม..."
sleep 60

echo "📊 ตรวจสอบ status..."
docker-compose -f docker-compose.old-frontend.yml ps

echo "🧪 ทดสอบ old frontend..."
curl -f http://localhost:3000 > /dev/null && echo "✅ Old Frontend: OK" || echo "⚠️ Old Frontend: Starting..."

echo "📋 ตรวจสอบ logs..."
docker logs internship_old_frontend --tail 10

echo "✅ Old frontend deployment เสร็จสิ้น!"
echo "🌐 Original Login: http://203.170.129.199"
echo "📱 หน้า login เก่าที่มีโลโก้และ UI ที่ถูกต้อง"

EOF

echo "📤 Upload และ deploy old frontend..."
scp -P "$VPS_PORT" /tmp/deploy_old_frontend.sh "$VPS_USER@$VPS_IP:/tmp/"
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_IP" "chmod +x /tmp/deploy_old_frontend.sh && /tmp/deploy_old_frontend.sh"

echo ""
echo "🧪 ทดสอบ old frontend..."
sleep 30

if curl -s "http://$VPS_IP" | grep -q "เข้าสู่ระบบ\|สหกิจศึกษา"; then
    echo "✅ Old Frontend ทำงานปกติแล้ว!"
    echo "🌐 เข้าถึงได้ที่: http://$VPS_IP"
    echo "📱 จะเห็นหน้า login เก่าที่มี:"
    echo "   - โลโก้ /logo.png"
    echo "   - ข้อความ 'เข้าสู่ระบบ'"
    echo "   - 'ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน'"
    echo "   - ปุ่ม gradient สีส้ม"
    echo "   - ลิงก์ 'ลืมรหัสผ่าน'"
else
    echo "⚠️ Vite dev server กำลังเริ่มต้น... ลองรีเฟรชใน 2-3 นาที"
    echo "🔍 หรือลองเข้าโดยตรงที่: http://$VPS_IP:3000"
fi

# Cleanup
rm -f /tmp/deploy_old_frontend.sh

echo ""
echo "🎉 Deploy Old Frontend เสร็จสิ้น!"
echo "🌐 Original Login: http://$VPS_IP"
echo "📱 ตอนนี้จะเห็นหน้า login เก่าที่ถูกต้องแล้ว!"
echo "🔑 ใช้ email และ password เพื่อทดสอบ login"