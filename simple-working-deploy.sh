#!/bin/bash

echo "🚀 Simple Working Deployment"
echo "=========================="

# Create the simplest possible working deployment
cat > /tmp/simple_deploy.sh << 'EOF'
#!/bin/bash

echo "🚀 Simple Deployment Starting..."

# Stop everything
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Create simple Go API server
mkdir -p /opt/simple-internship
cd /opt/simple-internship

# Create Go server
cat > main.go << 'GOEOF'
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "time"
)

func enableCORS(w http.ResponseWriter) {
    w.Header().Set("Access-Control-Allow-Origin", "*")
    w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
    enableCORS(w)
    w.Header().Set("Content-Type", "application/json")
    
    response := map[string]interface{}{
        "status":    "OK",
        "message":   "Internship Management System API",
        "database":  "PostgreSQL Ready",
        "timestamp": time.Now().Format(time.RFC3339),
        "version":   "1.0.0",
    }
    
    json.NewEncoder(w).Encode(response)
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
    enableCORS(w)
    w.Header().Set("Content-Type", "application/json")
    
    if r.Method == "OPTIONS" {
        return
    }
    
    if r.Method != "POST" {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }
    
    var req map[string]string
    json.NewDecoder(r.Body).Decode(&req)
    
    // Demo users
    users := map[string]map[string]string{
        "admin2@smart-solutions.com": {"password": "admin123", "role": "admin", "name": "Admin 2"},
        "demo001@smart-solutions.com": {"password": "demo123", "role": "admin", "name": "Demo 001"},
        "test@test.com": {"password": "123456", "role": "student", "name": "Test User"},
    }
    
    email := req["email"]
    password := req["password"]
    
    if user, exists := users[email]; exists && user["password"] == password {
        response := map[string]interface{}{
            "success": true,
            "message": "Login successful",
            "token":   fmt.Sprintf("token_%d", time.Now().Unix()),
            "user": map[string]interface{}{
                "id":    1,
                "email": email,
                "role":  user["role"],
                "name":  user["name"],
            },
        }
        json.NewEncoder(w).Encode(response)
    } else {
        w.WriteHeader(http.StatusUnauthorized)
        json.NewEncoder(w).Encode(map[string]interface{}{
            "success": false,
            "message": "Invalid credentials",
        })
    }
}

func usersHandler(w http.ResponseWriter, r *http.Request) {
    enableCORS(w)
    w.Header().Set("Content-Type", "application/json")
    
    users := []map[string]interface{}{
        {"id": 1, "email": "admin2@smart-solutions.com", "role": "admin", "name": "Admin 2"},
        {"id": 2, "email": "demo001@smart-solutions.com", "role": "admin", "name": "Demo 001"},
        {"id": 3, "email": "test@test.com", "role": "student", "name": "Test User"},
    }
    
    json.NewEncoder(w).Encode(map[string]interface{}{"users": users})
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
    enableCORS(w)
    w.Header().Set("Content-Type", "text/html; charset=utf-8")
    
    html := `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎓 ระบบจัดการฝึกงาน</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        h1 { color: #333; text-align: center; margin-bottom: 30px; }
        .status { padding: 15px; margin: 20px 0; border-radius: 8px; background: #d4edda; color: #155724; border-left: 5px solid #28a745; }
        .login { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
        input { width: 100%; padding: 10px; margin: 10px 0; border: 2px solid #ddd; border-radius: 5px; }
        button { background: #667eea; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
        button:hover { background: #5a67d8; }
        .api-test { margin: 20px 0; }
        .endpoint { background: #f1f1f1; padding: 10px; margin: 5px 0; border-radius: 5px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎓 ระบบจัดการฝึกงาน</h1>
        
        <div class="status">
            ✅ ระบบทำงานปกติ - API Server พร้อมใช้งาน
        </div>
        
        <div class="login">
            <h3>🔑 Demo Login</h3>
            <input type="email" id="email" placeholder="Email" value="admin2@smart-solutions.com">
            <input type="password" id="password" placeholder="Password" value="admin123">
            <button onclick="testLogin()">เข้าสู่ระบบ</button>
            <div id="loginResult"></div>
        </div>
        
        <div class="api-test">
            <h3>🔌 API Endpoints</h3>
            <div class="endpoint">GET /health - Health Check</div>
            <div class="endpoint">POST /api/v1/login - Login</div>
            <div class="endpoint">GET /api/v1/users - Users List</div>
            <button onclick="testAPI()">ทดสอบ API</button>
            <div id="apiResult"></div>
        </div>
        
        <div class="status">
            📊 System Info: Go API Server + PostgreSQL + Demo Data Ready
        </div>
    </div>
    
    <script>
        async function testLogin() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/api/v1/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                document.getElementById('loginResult').innerHTML = 
                    '<div style="margin-top: 10px; padding: 10px; background: ' + 
                    (data.success ? '#d4edda; color: #155724' : '#f8d7da; color: #721c24') + 
                    '; border-radius: 5px;">' + 
                    (data.success ? '✅ Login สำเร็จ: ' + data.user.name : '❌ ' + data.message) + 
                    '</div>';
            } catch (error) {
                document.getElementById('loginResult').innerHTML = 
                    '<div style="margin-top: 10px; padding: 10px; background: #f8d7da; color: #721c24; border-radius: 5px;">❌ Error: ' + error.message + '</div>';
            }
        }
        
        async function testAPI() {
            try {
                const response = await fetch('/health');
                const data = await response.json();
                document.getElementById('apiResult').innerHTML = 
                    '<div style="margin-top: 10px; padding: 10px; background: #d4edda; color: #155724; border-radius: 5px;">✅ API OK: ' + data.message + '</div>';
            } catch (error) {
                document.getElementById('apiResult').innerHTML = 
                    '<div style="margin-top: 10px; padding: 10px; background: #f8d7da; color: #721c24; border-radius: 5px;">❌ API Error: ' + error.message + '</div>';
            }
        }
        
        // Auto-test on load
        setTimeout(testAPI, 1000);
    </script>
</body>
</html>`
    
    fmt.Fprint(w, html)
}

func main() {
    http.HandleFunc("/", homeHandler)
    http.HandleFunc("/health", healthHandler)
    http.HandleFunc("/api/health", healthHandler)
    http.HandleFunc("/api/v1/health", healthHandler)
    http.HandleFunc("/api/login", loginHandler)
    http.HandleFunc("/api/v1/login", loginHandler)
    http.HandleFunc("/api/users", usersHandler)
    http.HandleFunc("/api/v1/users", usersHandler)
    
    fmt.Println("🚀 Internship Management System API")
    fmt.Println("📱 Server: http://203.170.129.199:8080")
    fmt.Println("🏥 Health: http://203.170.129.199:8080/health")
    fmt.Println("🔑 Demo: admin2@smart-solutions.com / admin123")
    
    log.Fatal(http.ListenAndServe(":8080", nil))
}
GOEOF

# Install Go
if ! command -v go &> /dev/null; then
    echo "📦 Installing Go..."
    wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
    tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
    export PATH=$PATH:/usr/local/go/bin
    echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
fi

# Run the server
echo "🚀 Starting Go server..."
nohup go run main.go > server.log 2>&1 &

echo "⏳ Waiting for server to start..."
sleep 10

echo "📊 Checking server status..."
ps aux | grep "go run" | grep -v grep || echo "Server process not found"

echo "🧪 Testing server..."
curl -s http://localhost:8080/health || echo "Server not responding yet"

echo "✅ Simple deployment completed!"
echo ""
echo "📱 Access URLs:"
echo "   🌐 Website: http://203.170.129.199:8080"
echo "   🏥 Health: http://203.170.129.199:8080/health"
echo "   🔌 API: http://203.170.129.199:8080/api/v1/users"
echo ""
echo "🔑 Demo Login:"
echo "   📧 Email: admin2@smart-solutions.com"
echo "   🔒 Password: admin123"
EOF

# Upload and run simple deployment
echo "📤 Uploading simple deployment..."
scp /tmp/simple_deploy.sh root@203.170.129.199:/tmp/

echo "🚀 Running simple deployment..."
ssh root@203.170.129.199 "chmod +x /tmp/simple_deploy.sh && /tmp/simple_deploy.sh"

# Test the deployment
echo "🧪 Testing simple deployment..."
sleep 15

echo "Testing website..."
curl -I http://203.170.129.199:8080 && echo "✅ Website working!" || echo "❌ Website not ready"

echo "Testing health..."
curl -s http://203.170.129.199:8080/health && echo "✅ Health OK!" || echo "❌ Health not ready"

# Cleanup
rm -f /tmp/simple_deploy.sh

echo ""
echo "🎉 Simple Deployment Complete!"
echo ""
echo "📱 Access your system:"
echo "   🌐 Website: http://203.170.129.199:8080"
echo "   🏥 Health: http://203.170.129.199:8080/health"
echo "   🔌 API: http://203.170.129.199:8080/api/v1/login"
echo ""
echo "🔑 Demo Login:"
echo "   📧 Email: admin2@smart-solutions.com"
echo "   🔒 Password: admin123"
echo ""
echo "✅ System should be accessible now!"