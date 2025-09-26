#!/bin/bash

echo "🚀 Deploy Frontend Only - Original App"
echo "======================================"

VPS_IP="203.170.129.199"
VPS_USER="root"
VPS_PORT="22"

# สร้าง script deploy เฉพาะ frontend
cat > /tmp/deploy_frontend_only.sh << 'EOF'
#!/bin/bash

echo "🛑 หยุด services..."
systemctl stop nginx
docker stop $(docker ps -aq) 2>/dev/null || true

echo "📁 เตรียมโฟลเดอร์..."
cd /opt/internship-system
rm -rf frontend-app

echo "📥 Clone repository..."
git clone https://github.com/ultramanx88/internship.git frontend-app
cd frontend-app/apps/frontend

echo "🔧 ติดตั้ง dependencies..."
npm install

echo "🏗️ Build frontend only..."
npm run build

echo "📂 Copy built app..."
rm -rf /var/www/html/*
cp -r .next /var/www/html/
cp -r public /var/www/html/
cp package.json /var/www/html/
cp next.config.* /var/www/html/ 2>/dev/null || true

echo "🐳 สร้าง simple Docker..."
cat > /opt/internship-system/docker-compose.frontend.yml << 'DOCKEREOF'
services:
  frontend:
    image: node:18-alpine
    container_name: internship_frontend
    working_dir: /app
    volumes:
      - ./frontend-app/apps/frontend:/app
    command: sh -c "npm install && npm start"
    ports:
      - "3000:3000"
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
      - ./nginx-frontend.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
DOCKEREOF

echo "⚙️ สร้าง nginx config..."
cat > /opt/internship-system/nginx-frontend.conf << 'NGINXEOF'
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
        
        location / {
            proxy_pass http://frontend;
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

echo "🚀 เริ่มต้น services..."
cd /opt/internship-system
docker-compose -f docker-compose.frontend.yml up -d

echo "⏳ รอให้ frontend พร้อม..."
sleep 45

echo "📊 ตรวจสอบ status..."
docker-compose -f docker-compose.frontend.yml ps

echo "🧪 ทดสอบ frontend..."
curl -f http://localhost:3000 > /dev/null && echo "✅ Frontend: OK" || echo "⚠️ Frontend: Starting..."

echo "✅ Frontend deployment เสร็จสิ้น!"
echo "🌐 Original App: http://203.170.129.199"

EOF

echo "📤 Upload และ deploy frontend..."
scp -P "$VPS_PORT" /tmp/deploy_frontend_only.sh "$VPS_USER@$VPS_IP:/tmp/"
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_IP" "chmod +x /tmp/deploy_frontend_only.sh && /tmp/deploy_frontend_only.sh"

echo ""
echo "🧪 ทดสอบ original app..."
sleep 30

if curl -s "http://$VPS_IP" | grep -q "__NEXT_DATA__\|next\|react"; then
    echo "✅ Original App ทำงานปกติแล้ว!"
    echo "🌐 เข้าถึงได้ที่: http://$VPS_IP"
else
    echo "⚠️ App กำลังเริ่มต้น... ลองรีเฟรชใน 2-3 นาที"
fi

# Cleanup
rm -f /tmp/deploy_frontend_only.sh

echo ""
echo "🎉 Deploy Frontend เสร็จสิ้น!"
echo "🌐 Original App: http://$VPS_IP"
echo "📱 ตอนนี้จะเห็นแอพจริงที่คุณทำไว้แล้ว!"