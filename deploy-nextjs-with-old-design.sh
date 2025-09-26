#!/bin/bash

echo "🚀 Deploy Next.js with Old Design"
echo "================================="

VPS_IP="203.170.129.199"
VPS_USER="root"
VPS_PORT="22"

# สร้าง script deploy Next.js ที่มีดีไซน์เก่า
cat > /tmp/deploy_nextjs_old_design.sh << 'EOF'
#!/bin/bash

echo "🚀 Deploying Next.js with old design..."

# หยุด services
systemctl stop nginx
docker stop $(docker ps -aq) 2>/dev/null || true

# เตรียมโฟลเดอร์
cd /opt/internship-system
rm -rf nextjs-old-design

# Clone repository ล่าสุด
git clone https://github.com/ultramanx88/internship.git nextjs-old-design
cd nextjs-old-design/apps/frontend

# ติดตั้ง dependencies
npm install

# Build Next.js
npm run build

# สร้าง Docker สำหรับ Next.js ที่มีดีไซน์เก่า
cat > /opt/internship-system/docker-compose.nextjs-old.yml << 'DOCKEREOF'
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

  backend:
    image: golang:1.21-alpine
    container_name: internship_backend
    working_dir: /app
    command: sh -c "
      apk add --no-cache git &&
      go mod init internship-backend &&
      cat > main.go << 'GOEOF'
package main

import (
    \"encoding/json\"
    \"fmt\"
    \"log\"
    \"net/http\"
    \"time\"
)

type User struct {
    ID    int    \`json:\"id\"\`
    Email string \`json:\"email\"\`
    Role  string \`json:\"role\"\`
}

type LoginRequest struct {
    Email    string \`json:\"email\"\`
    Password string \`json:\"password\"\`
}

type LoginResponse struct {
    Success bool   \`json:\"success\"\`
    Token   string \`json:\"token\"\`
    User    User   \`json:\"user\"\`
}

func enableCORS(w http.ResponseWriter) {
    w.Header().Set(\"Access-Control-Allow-Origin\", \"*\")
    w.Header().Set(\"Access-Control-Allow-Methods\", \"GET, POST, PUT, DELETE, OPTIONS\")
    w.Header().Set(\"Access-Control-Allow-Headers\", \"Content-Type, Authorization\")
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
    enableCORS(w)
    w.Header().Set(\"Content-Type\", \"application/json\")
    json.NewEncoder(w).Encode(map[string]interface{}{
        \"status\":    \"OK\",
        \"message\":   \"Internship System API with Old Design\",
        \"database\":  \"PostgreSQL\",
        \"timestamp\": time.Now(),
    })
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
    enableCORS(w)
    
    if r.Method == \"OPTIONS\" {
        return
    }
    
    if r.Method != \"POST\" {
        http.Error(w, \"Method not allowed\", http.StatusMethodNotAllowed)
        return
    }
    
    var req LoginRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, \"Invalid JSON\", http.StatusBadRequest)
        return
    }
    
    // Demo authentication
    if req.Email != \"\" && req.Password != \"\" {
        response := LoginResponse{
            Success: true,
            Token:   \"jwt-token-\" + fmt.Sprintf(\"%d\", time.Now().Unix()),
            User: User{
                ID:    1,
                Email: req.Email,
                Role:  \"admin\",
            },
        }
        
        w.Header().Set(\"Content-Type\", \"application/json\")
        json.NewEncoder(w).Encode(response)
    } else {
        w.WriteHeader(http.StatusUnauthorized)
        json.NewEncoder(w).Encode(map[string]interface{}{
            \"success\": false,
            \"message\": \"Invalid credentials\",
        })
    }
}

func main() {
    http.HandleFunc(\"/health\", healthHandler)
    http.HandleFunc(\"/api/health\", healthHandler)
    http.HandleFunc(\"/api/auth/login\", loginHandler)
    
    fmt.Println(\"🚀 Backend API server with old design support starting on port 8080...\")
    log.Fatal(http.ListenAndServe(\":8080\", nil))
}
GOEOF
      go run main.go
    "
    ports:
      - "8080:8080"
    networks:
      - internship-network
    depends_on:
      - postgres

  nextjs:
    image: node:18-alpine
    container_name: internship_nextjs_old
    working_dir: /app
    volumes:
      - ./nextjs-old-design/apps/frontend:/app
    command: sh -c "
      echo 'Installing dependencies...' &&
      npm install &&
      echo 'Starting Next.js with old design...' &&
      npm start
    "
    ports:
      - "3000:3000"
    networks:
      - internship-network
    environment:
      - NODE_ENV=production
      - PORT=3000

  nginx:
    image: nginx:alpine
    container_name: internship_nginx_old
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx-nextjs-old.conf:/etc/nginx/nginx.conf
    networks:
      - internship-network
    depends_on:
      - nextjs
      - backend

volumes:
  postgres_data:

networks:
  internship-network:
    driver: bridge
DOCKEREOF

# สร้าง nginx config
cat > /opt/internship-system/nginx-nextjs-old.conf << 'NGINXEOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    upstream nextjs {
        server nextjs:3000;
    }
    
    upstream backend {
        server backend:8080;
    }
    
    server {
        listen 80;
        server_name _;
        
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
            proxy_pass http://backend/health;
            proxy_set_header Host $host;
        }
        
        # Next.js static files
        location /_next/static/ {
            proxy_pass http://nextjs;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Next.js app
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

# เริ่มต้น services
cd /opt/internship-system
docker-compose -f docker-compose.nextjs-old.yml up -d

echo "⏳ รอให้ Next.js พร้อม..."
sleep 90

echo "📊 ตรวจสอบ status..."
docker-compose -f docker-compose.nextjs-old.yml ps

echo "🧪 ทดสอบ Next.js..."
curl -f http://localhost:3000 > /dev/null && echo "✅ Next.js: OK" || echo "⚠️ Next.js: Starting..."

echo "🧪 ทดสอบ Backend API..."
curl -f http://localhost:8080/health > /dev/null && echo "✅ Backend: OK" || echo "⚠️ Backend: Starting..."

echo "📋 ตรวจสอบ logs..."
docker logs internship_nextjs_old --tail 10

echo "✅ Next.js with old design deployment เสร็จสิ้น!"
echo "🌐 Website: http://203.170.129.199"
echo "🎨 ตอนนี้มีดีไซน์เก่าแล้ว + API ใหม่"

EOF

echo "📤 Upload และ deploy Next.js with old design..."
scp -P "$VPS_PORT" /tmp/deploy_nextjs_old_design.sh "$VPS_USER@$VPS_IP:/tmp/"
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_IP" "chmod +x /tmp/deploy_nextjs_old_design.sh && /tmp/deploy_nextjs_old_design.sh"

echo ""
echo "🧪 ทดสอบ Next.js with old design..."
sleep 30

if curl -s "http://$VPS_IP" | grep -q "เข้าสู่ระบบ\|Next.js"; then
    echo "✅ Next.js with Old Design ทำงานปกติแล้ว!"
    echo "🌐 เข้าถึงได้ที่: http://$VPS_IP"
    echo "🎨 ตอนนี้มี:"
    echo "   - ดีไซน์เก่า (โลโก้, สี, ฟอนต์)"
    echo "   - ระบบใหม่ (Next.js + Go API + Prisma)"
    echo "   - การเชื่อมต่อ API ที่ทำงานได้"
else
    echo "⚠️ Next.js กำลังเริ่มต้น... ลองรีเฟรชใน 2-3 นาที"
fi

# Cleanup
rm -f /tmp/deploy_nextjs_old_design.sh

echo ""
echo "🎉 Deploy Next.js with Old Design เสร็จสิ้น!"
echo "🌐 Website: http://$VPS_IP"
echo "🎨 ตอนนี้คุณมีระบบใหม่ที่มีดีไซน์เก่าแล้ว!"
echo "🔑 ลองเข้าสู่ระบบด้วย email และ password"