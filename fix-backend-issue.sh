#!/bin/bash

echo "🔧 แก้ไขปัญหา Backend Container..."

VPS_HOST="203.170.129.199"
VPS_USER="root"
VPS_PORT="22"

# Create fix script
cat > /tmp/fix_backend.sh << 'EOF'
#!/bin/bash

cd /opt/internship-system

echo "📝 ตรวจสอบ Backend logs..."
docker logs internship_backend --tail 50

echo "🔍 ตรวจสอบ Backend container..."
docker inspect internship_backend

echo "🛠️ แก้ไข Backend Dockerfile..."
# Create a simpler backend Dockerfile
mkdir -p apps/backend
cat > apps/backend/Dockerfile.prod << 'DOCKERFILE'
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY . .

# Install dependencies
RUN go mod tidy

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./apps/backend

FROM alpine:latest

RUN apk --no-cache add ca-certificates wget
WORKDIR /root/

# Copy the binary
COPY --from=builder /app/main .

# Make it executable
RUN chmod +x ./main

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run the binary
CMD ["./main"]
DOCKERFILE

echo "🔄 Rebuild และ restart backend..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production stop backend
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production rm -f backend
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production build backend
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d backend

echo "⏳ รอ backend เริ่มทำงาน..."
sleep 30

echo "📊 ตรวจสอบสถานะใหม่..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production ps

echo "🌐 เริ่ม nginx..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d nginx

echo "✅ ตรวจสอบการทำงาน..."
sleep 10
curl -k -I http://localhost:8080/health || echo "Backend ยังไม่พร้อม"
EOF

echo "📤 รันสคริปต์แก้ไข..."
scp -P "$VPS_PORT" /tmp/fix_backend.sh "$VPS_USER@$VPS_HOST:/tmp/"
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "chmod +x /tmp/fix_backend.sh && /tmp/fix_backend.sh"

echo "🧪 ทดสอบระบบ..."
sleep 20
curl -k -I https://203.170.129.199:8443/ || echo "❌ ยังมีปัญหา"

echo "✅ เสร็จสิ้น!"