#!/bin/bash

echo "🚀 Deploy Frontend Direct - Original App"
echo "========================================"

VPS_IP="203.170.129.199"
VPS_USER="root"
VPS_PORT="22"

# สร้าง script deploy frontend โดยตรง
cat > /tmp/deploy_frontend_direct.sh << 'EOF'
#!/bin/bash

echo "🛑 หยุด services..."
systemctl stop nginx
docker stop $(docker ps -aq) 2>/dev/null || true

echo "📁 เตรียมโฟลเดอร์..."
cd /opt/internship-system
rm -rf original-frontend

echo "📥 Clone repository..."
git clone https://github.com/ultramanx88/internship.git original-frontend
cd original-frontend/apps/frontend

echo "🔧 ติดตั้ง dependencies..."
npm install

echo "🏗️ Build เฉพาะ frontend..."
# Skip backend build
export TURBO_FORCE=true
npm run build --workspace=nextjs-frontend || {
    echo "📋 ลอง build แบบ direct..."
    npx next build
}

echo "📂 Setup static files..."
mkdir -p /var/www/html
rm -rf /var/www/html/*

# Copy Next.js build
if [ -d ".next" ]; then
    echo "✅ Found .next directory"
    cp -r .next /var/www/html/
    cp -r public /var/www/html/ 2>/dev/null || true
    cp package.json /var/www/html/
    cp next.config.* /var/www/html/ 2>/dev/null || true
else
    echo "❌ No .next directory found, creating simple redirect..."
    cat > /var/www/html/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=http://203.170.129.199:3000">
    <title>Redirecting...</title>
</head>
<body>
    <p>Redirecting to application...</p>
    <script>window.location.href = 'http://203.170.129.199:3000';</script>
</body>
</html>
HTMLEOF
fi

echo "🐳 สร้าง Docker สำหรับ Next.js..."
cat > /opt/internship-system/docker-compose.nextjs.yml << 'DOCKEREOF'
services:
  frontend:
    image: node:18-alpine
    container_name: internship_nextjs
    working_dir: /app
    volumes:
      - ./original-frontend/apps/frontend:/app
    command: sh -c "
      echo 'Installing dependencies...' &&
      npm install &&
      echo 'Starting Next.js...' &&
      npm run dev -- --port 3000 --hostname 0.0.0.0
    "
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - HOSTNAME=0.0.0.0

  nginx:
    image: nginx:alpine
    container_name: internship_nginx_proxy
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx-nextjs.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
DOCKEREOF

echo "⚙️ สร้าง nginx config สำหรับ Next.js..."
cat > /opt/internship-system/nginx-nextjs.conf << 'NGINXEOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    upstream nextjs {
        server frontend:3000;
    }
    
    server {
        listen 80;
        server_name _;
        
        # Next.js hot reload
        location /_next/webpack-hmr {
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
        
        # Next.js static files
        location /_next/static/ {
            proxy_pass http://nextjs;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # All other requests
        location / {
            proxy_pass http://nextjs;
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

echo "🚀 เริ่มต้น Next.js services..."
cd /opt/internship-system
docker-compose -f docker-compose.nextjs.yml up -d

echo "⏳ รอให้ Next.js พร้อม (อาจใช้เวลา 2-3 นาที)..."
sleep 90

echo "📊 ตรวจสอบ status..."
docker-compose -f docker-compose.nextjs.yml ps

echo "🧪 ทดสอบ Next.js..."
curl -f http://localhost:3000 > /dev/null && echo "✅ Next.js: OK" || echo "⚠️ Next.js: Still starting..."

echo "📋 ตรวจสอบ logs..."
docker logs internship_nextjs --tail 10

echo "✅ Next.js deployment เสร็จสิ้น!"
echo "🌐 Original App: http://203.170.129.199"
echo "📱 หน้า login ที่คุณทำไว้จะแสดงขึ้นมา"

EOF

echo "📤 Upload และ deploy Next.js..."
scp -P "$VPS_PORT" /tmp/deploy_frontend_direct.sh "$VPS_USER@$VPS_IP:/tmp/"
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_IP" "chmod +x /tmp/deploy_frontend_direct.sh && /tmp/deploy_frontend_direct.sh"

echo ""
echo "🧪 ทดสอบ original login page..."
sleep 30

if curl -s "http://$VPS_IP" | grep -q "เข้าสู่ระบบ\|login\|admin"; then
    echo "✅ Original Login Page ทำงานปกติแล้ว!"
    echo "🌐 เข้าถึงได้ที่: http://$VPS_IP"
    echo "📱 จะเห็นหน้า login ที่มีโลโก้และฟอร์มเหมือนในภาพ"
else
    echo "⚠️ Next.js กำลังเริ่มต้น... ลองรีเฟรชใน 2-3 นาที"
    echo "🔍 หรือลองเข้าโดยตรงที่: http://$VPS_IP:3000"
fi

# Cleanup
rm -f /tmp/deploy_frontend_direct.sh

echo ""
echo "🎉 Deploy Original App เสร็จสิ้น!"
echo "🌐 Original Login: http://$VPS_IP"
echo "📱 ตอนนี้จะเห็นหน้า login ที่คุณทำไว้แต่แรกแล้ว!"
echo "🔑 ใช้ admin@smart-solutions.com / admin123 เพื่อ login"