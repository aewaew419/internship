#!/bin/bash

echo "🚀 เริ่มระบบ Local Demo..."

# Check if we have the backend files
if [ ! -d "apps/backend" ]; then
    echo "📁 สร้าง Backend structure..."
    mkdir -p apps/backend
    cd apps/backend
    
    # Create go.mod
    cat > go.mod << 'EOF'
module internship-backend

go 1.21

require (
    github.com/gofiber/fiber/v2 v2.52.0
    github.com/joho/godotenv v1.5.1
)
EOF

    # Create simple main.go
    cat > main.go << 'EOF'
package main

import (
    "log"
    "os"
    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
    app := fiber.New()
    
    // CORS middleware
    app.Use(cors.New(cors.Config{
        AllowOrigins: "*",
        AllowMethods: "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
        AllowHeaders: "*",
    }))
    
    // Health check
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
    
    // Demo login endpoint
    api.Post("/login", func(c *fiber.Ctx) error {
        return c.JSON(fiber.Map{
            "success": true,
            "message": "Login successful",
            "user": fiber.Map{
                "id": 1,
                "email": "admin@test.com",
                "role": "admin",
            },
            "token": "demo_token_123",
        })
    })
    
    // Demo users endpoint
    api.Get("/users", func(c *fiber.Ctx) error {
        return c.JSON(fiber.Map{
            "users": []fiber.Map{
                {"id": 1, "email": "admin@test.com", "role": "admin"},
                {"id": 2, "email": "student@test.com", "role": "student"},
            },
        })
    })
    
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    
    log.Printf("🚀 Server starting on port %s", port)
    log.Fatal(app.Listen(":" + port))
}
EOF

    cd ../..
fi

# Check if we have frontend
if [ ! -d "apps/frontend" ]; then
    echo "📁 สร้าง Frontend structure..."
    mkdir -p apps/frontend/pages
    
    # Create simple package.json
    cat > apps/frontend/package.json << 'EOF'
{
  "name": "internship-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
EOF

    # Create simple index page
    cat > apps/frontend/pages/index.js << 'EOF'
import { useState, useEffect } from 'react'

export default function Home() {
  const [apiStatus, setApiStatus] = useState('checking...')
  
  useEffect(() => {
    fetch('http://localhost:8080/health')
      .then(res => res.json())
      .then(data => setApiStatus(data.message))
      .catch(() => setApiStatus('API not available'))
  }, [])
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🎓 ระบบจัดการฝึกงาน</h1>
      <p>API Status: {apiStatus}</p>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Demo Accounts:</h2>
        <ul>
          <li>Admin: admin@test.com / password123</li>
          <li>Student: student@test.com / password123</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2>URLs:</h2>
        <ul>
          <li>Frontend: http://localhost:3000</li>
          <li>Backend API: http://localhost:8080</li>
          <li>Health Check: http://localhost:8080/health</li>
        </ul>
      </div>
    </div>
  )
}
EOF
fi

echo "📦 ติดตั้ง dependencies..."
cd apps/backend
go mod tidy &

cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install &
fi

wait

echo "🚀 เริ่มระบบ..."

# Start backend
cd ../backend
echo "🔧 Starting Backend on port 8080..."
go run main.go &
BACKEND_PID=$!

# Start frontend
cd ../frontend
echo "🌐 Starting Frontend on port 3000..."
npm run dev &
FRONTEND_PID=$!

echo "⏳ รอให้ระบบเริ่มทำงาน..."
sleep 10

echo "🧪 ทดสอบระบบ..."
curl -s http://localhost:8080/health && echo "✅ Backend OK"
curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend OK"

echo ""
echo "🎉 ระบบพร้อมใช้งาน!"
echo ""
echo "📱 เข้าใช้งานที่:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8080"
echo ""
echo "🔑 Demo Accounts:"
echo "   Admin: admin@test.com / password123"
echo "   Student: student@test.com / password123"
echo ""
echo "⏹️  หยุดระบบ: กด Ctrl+C"

# Keep running
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait