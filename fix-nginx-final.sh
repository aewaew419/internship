#!/bin/bash

echo "🔧 แก้ไข Nginx และทดสอบสุดท้าย..."

VPS_HOST="203.170.129.199"
VPS_USER="root"
VPS_PORT="22"

# Create nginx fix script
cat > /tmp/nginx_fix.sh << 'EOF'
#!/bin/bash

cd /opt/internship-system

echo "🔧 แก้ไข Nginx configuration..."

# Create simple nginx config
mkdir -p deployment/nginx
cat > deployment/nginx/nginx.conf << 'NGINXCONF'
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
    
    server {
        listen 80;
        listen 443 ssl http2;
        
        # Self-signed SSL certificate
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_private_key /etc/nginx/ssl/key.pem;
        
        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Health check
        location /health {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
NGINXCONF

echo "🔐 สร้าง Self-signed SSL certificate..."
mkdir -p deployment/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout deployment/nginx/ssl/key.pem \
    -out deployment/nginx/ssl/cert.pem \
    -subj "/C=TH/ST=Bangkok/L=Bangkok/O=Internship/CN=203.170.129.199"

echo "🔄 Restart Nginx..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production stop nginx
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production rm -f nginx
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d nginx

echo "⏳ รอ Nginx เริ่มทำงาน..."
sleep 20

echo "📊 ตรวจสอบสถานะทั้งหมด..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production ps

echo "🧪 ทดสอบ endpoints..."
echo "Testing HTTP..."
curl -I http://localhost:8080/ || echo "HTTP failed"

echo "Testing HTTPS..."
curl -k -I https://localhost:8443/ || echo "HTTPS failed"

echo "Testing Health Check..."
curl -k https://localhost:8443/health || echo "Health check failed"

echo "✅ เสร็จสิ้น!"
EOF

echo "📤 รันสคริปต์แก้ไข Nginx..."
scp -P "$VPS_PORT" /tmp/nginx_fix.sh "$VPS_USER@$VPS_HOST:/tmp/"
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "chmod +x /tmp/nginx_fix.sh && /tmp/nginx_fix.sh"

echo "🧪 ทดสอบจากภายนอก..."
sleep 10
echo "Testing external access..."
curl -k -I https://203.170.129.199:8443/ && echo "✅ ระบบทำงานแล้ว!" || echo "❌ ยังมีปัญหา"

echo "🎉 เสร็จสิ้น!"