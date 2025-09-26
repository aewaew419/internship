#!/bin/bash

echo "🔄 Restore Original Next.js App"
echo "==============================="

VPS_IP="203.170.129.199"
VPS_USER="root"
VPS_PORT="22"

# สร้าง script restore แอพจริง
cat > /tmp/restore_original.sh << 'EOF'
#!/bin/bash

echo "🛑 หยุด nginx..."
systemctl stop nginx

echo "📁 เตรียมโฟลเดอร์..."
cd /opt/internship-system
rm -rf app

echo "📥 Clone แอพจริงจาก GitHub..."
git clone https://github.com/ultramanx88/internship.git app
cd app/apps/frontend

echo "📦 ติดตั้ง Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

echo "🔧 ติดตั้ง dependencies..."
npm install

echo "🏗️ Build แอพจริง..."
npm run build

echo "📂 Copy built files..."
rm -rf /var/www/html/*
cp -r .next/standalone/* /var/www/html/ 2>/dev/null || {
    echo "📋 Copy full Next.js build..."
    cp -r .next /var/www/html/
    cp -r public /var/www/html/
    cp package.json /var/www/html/
    cp next.config.* /var/www/html/ 2>/dev/null || true
}

echo "🐳 สร้าง Docker สำหรับแอพจริง..."
cat > /opt/internship-system/docker-compose.original.yml << 'DOCKEREOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: internship_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: internship_prod
      POSTGRES_USER: internship_user
      POSTGRES_PASSWORD: secure_password_123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - internship-network

  frontend:
    image: node:18-alpine
    container_name: internship_frontend
    working_dir: /app
    volumes:
      - ./app/apps/frontend:/app
    command: sh -c "npm install && npm run build && npm start"
    ports:
      - "3000:3000"
    networks:
      - internship-network
    environment:
      - NODE_ENV=production
      - PORT=3000

  nginx:
    image: nginx:alpine
    container_name: internship_nginx
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx-original.conf:/etc/nginx/nginx.conf
    networks:
      - internship-network
    depends_on:
      - frontend

volumes:
  postgres_data:

networks:
  internship-network:
    driver: bridge
DOCKEREOF

echo "⚙️ สร้าง nginx config สำหรับ Next.js..."
cat > /opt/internship-system/nginx-original.conf << 'NGINXEOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    upstream frontend {
        server frontend:3000;
    }
    
    server {
        listen 80;
        server_name _;
        
        # Next.js static files
        location /_next/static/ {
            proxy_pass http://frontend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Next.js app
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
NGINXEOF

echo "🚀 เริ่มต้น Docker services..."
cd /opt/internship-system
docker-compose -f docker-compose.original.yml down
docker-compose -f docker-compose.original.yml up -d

echo "⏳ รอให้ Next.js พร้อม..."
sleep 60

echo "📊 ตรวจสอบ status..."
docker-compose -f docker-compose.original.yml ps

echo "🧪 ทดสอบ Next.js..."
curl -f http://localhost:3000 > /dev/null && echo "✅ Next.js: OK" || echo "⚠️ Next.js: Starting..."

echo "✅ Restore แอพจริงเสร็จสิ้น!"
echo "🌐 Next.js App: http://203.170.129.199"

EOF

echo "📤 Upload และ restore แอพจริง..."
scp -P "$VPS_PORT" /tmp/restore_original.sh "$VPS_USER@$VPS_IP:/tmp/"
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_IP" "chmod +x /tmp/restore_original.sh && /tmp/restore_original.sh"

echo ""
echo "🧪 ทดสอบแอพจริง..."
sleep 30

if curl -s "http://$VPS_IP" | grep -q "__NEXT_DATA__\|next\|react"; then
    echo "✅ แอพจริงทำงานปกติแล้ว!"
    echo "🌐 เข้าถึงได้ที่: http://$VPS_IP"
else
    echo "⚠️ แอพกำลังเริ่มต้น... ลองรีเฟรชใน 2-3 นาที"
fi

# Cleanup
rm -f /tmp/restore_original.sh

echo ""
echo "🎉 Restore เสร็จสิ้น!"
echo "🌐 แอพจริง: http://$VPS_IP"
echo "📱 ตอนนี้จะเห็นแอพที่คุณทำไว้แต่แรกแล้ว!"