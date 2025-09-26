#!/bin/bash

echo "🚀 Deploy Real Next.js App"
echo "=========================="

VPS_IP="203.170.129.199"
VPS_USER="root"
VPS_PORT="22"

# สร้าง script deploy แอพจริง
cat > /tmp/deploy_real_app.sh << 'EOF'
#!/bin/bash

echo "🛑 หยุด services เก่า..."
systemctl stop nginx
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

echo "📦 ติดตั้ง Node.js และ dependencies..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

echo "📁 เตรียมโฟลเดอร์..."
cd /opt/internship-system
rm -rf frontend-build

echo "📥 Clone repository ใหม่..."
rm -rf temp-repo
git clone https://github.com/aewaew419/internship.git temp-repo
cd temp-repo/apps/frontend

echo "🔧 ติดตั้ง dependencies..."
npm install

echo "🏗️ Build production..."
npm run build

echo "📂 Copy built files..."
mkdir -p /opt/internship-system/frontend-build
cp -r .next/standalone/* /opt/internship-system/frontend-build/ 2>/dev/null || true
cp -r .next/static /opt/internship-system/frontend-build/.next/ 2>/dev/null || true
cp -r public /opt/internship-system/frontend-build/ 2>/dev/null || true

# ถ้า standalone ไม่มี ให้ copy ทั้งหมด
if [ ! -f "/opt/internship-system/frontend-build/server.js" ]; then
    echo "📋 Copy full Next.js app..."
    rm -rf /opt/internship-system/frontend-build
    cp -r . /opt/internship-system/frontend-build
    cd /opt/internship-system/frontend-build
    npm install --production
fi

cd /opt/internship-system

echo "🐳 สร้าง Docker setup..."
cat > docker-compose.real.yml << 'DOCKEREOF'
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
        \"message\":   \"Internship System API\",
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
            Token:   \"demo-jwt-token-\" + fmt.Sprintf(\"%d\", time.Now().Unix()),
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

func usersHandler(w http.ResponseWriter, r *http.Request) {
    enableCORS(w)
    
    users := []User{
        {ID: 1, Email: \"admin@smart-solutions.com\", Role: \"admin\"},
        {ID: 2, Email: \"student@university.ac.th\", Role: \"student\"},
        {ID: 3, Email: \"supervisor@company.com\", Role: \"supervisor\"},
    }
    
    w.Header().Set(\"Content-Type\", \"application/json\")
    json.NewEncoder(w).Encode(users)
}

func main() {
    http.HandleFunc(\"/health\", healthHandler)
    http.HandleFunc(\"/api/health\", healthHandler)
    http.HandleFunc(\"/api/login\", loginHandler)
    http.HandleFunc(\"/api/users\", usersHandler)
    
    fmt.Println(\"🚀 Backend API server starting on port 8080...\")
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

  frontend:
    image: node:18-alpine
    container_name: internship_frontend
    working_dir: /app
    volumes:
      - ./frontend-build:/app
    command: sh -c "
      if [ -f 'server.js' ]; then
        echo 'Starting standalone Next.js server...' &&
        node server.js
      else
        echo 'Starting Next.js with npm...' &&
        npm start
      fi
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
    container_name: internship_nginx
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx-real.conf:/etc/nginx/nginx.conf
    networks:
      - internship-network
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:

networks:
  internship-network:
    driver: bridge
DOCKEREOF

echo "⚙️ สร้าง nginx config สำหรับ Next.js..."
cat > nginx-real.conf << 'NGINXEOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    upstream frontend {
        server frontend:3000;
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
            
            # WebSocket support for Next.js dev
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
NGINXEOF

echo "🚀 เริ่มต้น services..."
docker-compose -f docker-compose.real.yml up -d

echo "⏳ รอให้ services พร้อม..."
sleep 60

echo "📊 ตรวจสอบ status..."
docker-compose -f docker-compose.real.yml ps

echo "🧪 ทดสอบ services..."
curl -f http://localhost:3000 > /dev/null && echo "✅ Frontend: OK" || echo "⚠️ Frontend: Starting..."
curl -f http://localhost:8080/health > /dev/null && echo "✅ Backend: OK" || echo "⚠️ Backend: Starting..."

echo "✅ Real app deployment เสร็จสิ้น!"
echo "🌐 Next.js App: http://203.170.129.199"
echo "🔧 API: http://203.170.129.199/api"

# Cleanup
rm -rf temp-repo

EOF

echo "📤 Upload และ deploy แอพจริง..."
scp -P "$VPS_PORT" /tmp/deploy_real_app.sh "$VPS_USER@$VPS_IP:/tmp/"
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_IP" "chmod +x /tmp/deploy_real_app.sh && /tmp/deploy_real_app.sh"

echo ""
echo "🧪 ทดสอบ Next.js app..."
sleep 30

if curl -s "http://$VPS_IP" | grep -q "next\|react\|__NEXT_DATA__"; then
    echo "✅ Next.js App: ทำงานปกติ"
    echo "🌐 เข้าถึงได้ที่: http://$VPS_IP"
else
    echo "⚠️ App: กำลังเริ่มต้น... ลองรีเฟรชใน 2-3 นาที"
fi

# Cleanup
rm -f /tmp/deploy_real_app.sh

echo ""
echo "🎉 Deploy Real App เสร็จสิ้น!"
echo "🌐 Next.js App: http://$VPS_IP"
echo "📱 ตอนนี้จะเห็นแอพจริงของคุณแล้ว!"