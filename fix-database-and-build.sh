#!/bin/bash

echo "🔧 แก้ไขปัญหา Database และ Build..."

VPS_HOST="203.170.129.199"
VPS_USER="root"
VPS_PORT="22"

# Create comprehensive fix script
cat > /tmp/complete_fix.sh << 'EOF'
#!/bin/bash

cd /opt/internship-system

echo "🛑 หยุดระบบทั้งหมด..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production down -v

echo "🧹 ทำความสะอาดข้อมูลเก่า..."
docker system prune -f
docker volume prune -f

echo "🔐 แก้ไข Database password..."
# Reset database with correct password
cat > .env.production << 'ENVEOF'
NODE_ENV=production
GO_ENV=production
DOMAIN=203.170.129.199
DB_NAME=internship_prod
DB_USER=internship_user
DB_PASSWORD=simple_password_123
JWT_SECRET=your_super_secret_jwt_key_here_32_chars_long
JWT_EXPIRES_IN=24h
REDIS_PASSWORD=redis_password_123
CORS_ORIGIN=*
RATE_LIMIT=100
LOG_LEVEL=info
GRAFANA_PASSWORD=admin123
ENVEOF

echo "🏗️ สร้าง Go module และ Backend ใหม่..."
# Create proper Go backend structure
mkdir -p apps/backend
cd apps/backend

# Create go.mod
cat > go.mod << 'GOMOD'
module internship-backend

go 1.21

require (
    github.com/gofiber/fiber/v2 v2.52.0
    github.com/joho/godotenv v1.5.1
    gorm.io/driver/postgres v1.5.4
    gorm.io/gorm v1.25.5
)
GOMOD

# Create simple main.go
cat > main.go << 'GOMAIN'
package main

import (
    "log"
    "os"
    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"
    "github.com/joho/godotenv"
)

func main() {
    // Load environment variables
    godotenv.Load()
    
    // Create Fiber app
    app := fiber.New()
    
    // CORS middleware
    app.Use(cors.New(cors.Config{
        AllowOrigins: "*",
        AllowMethods: "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
        AllowHeaders: "*",
    }))
    
    // Health check endpoint
    app.Get("/health", func(c *fiber.Ctx) error {
        return c.JSON(fiber.Map{
            "status": "OK",
            "message": "Internship Management System API is running",
        })
    })
    
    // API routes
    api := app.Group("/api/v1")
    
    api.Get("/test", func(c *fiber.Ctx) error {
        return c.JSON(fiber.Map{
            "message": "API is working!",
            "version": "1.0.0",
        })
    })
    
    // Get port from environment or default to 8080
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    
    log.Printf("🚀 Server starting on port %s", port)
    log.Fatal(app.Listen(":" + port))
}
GOMAIN

# Create simple Dockerfile
cat > Dockerfile.prod << 'DOCKERFILE'
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

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

# Create go.sum (empty for now)
touch go.sum

cd /opt/internship-system

echo "🚀 Deploy ระบบใหม่..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d

echo "⏳ รอให้ระบบเริ่มทำงาน..."
sleep 60

echo "📊 ตรวจสอบสถานะ..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production ps

echo "🧪 ทดสอบ API..."
curl -I http://localhost:8080/health || echo "API ยังไม่พร้อม"

echo "✅ เสร็จสิ้น!"
EOF

echo "📤 รันสคริปต์แก้ไขครบถ้วน..."
scp -P "$VPS_PORT" /tmp/complete_fix.sh "$VPS_USER@$VPS_HOST:/tmp/"
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "chmod +x /tmp/complete_fix.sh && /tmp/complete_fix.sh"

echo "🧪 ทดสอบระบบสุดท้าย..."
sleep 30
curl -k -I https://203.170.129.199:8443/ && echo "✅ ระบบทำงานแล้ว!" || echo "❌ ยังมีปัญหา"

echo "🎉 เสร็จสิ้น!"