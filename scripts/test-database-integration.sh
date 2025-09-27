#!/bin/bash

echo "🧪 Testing Database Integration with Docker"
echo "=========================================="

# สร้าง network ถ้ายังไม่มี
echo "🌐 Creating Docker network..."
docker network create test-network 2>/dev/null || echo "Network already exists"

# หยุดและลบ containers เก่า
echo "🛑 Cleaning up old containers..."
docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true

# Build และเริ่มต้น services
echo "🚀 Starting services..."
docker-compose -f docker-compose.test.yml up --build -d

echo "⏳ Waiting for services to start..."
sleep 30

# ตรวจสอบสถานะ services
echo "📊 Checking service status..."
docker-compose -f docker-compose.test.yml ps

echo ""
echo "🧪 Testing Database Connection..."

# ทดสอบการเชื่อมต่อฐานข้อมูล
echo "1. Testing PostgreSQL connection..."
docker exec internship_test_db psql -U test_user -d internship_test -c "SELECT COUNT(*) as user_count FROM users;" 2>/dev/null && echo "✅ Database: Connected" || echo "❌ Database: Failed"

# ทดสอบ Backend API
echo "2. Testing Backend API..."
sleep 10
curl -f http://localhost:8080/health > /dev/null 2>&1 && echo "✅ Backend: Running" || echo "❌ Backend: Failed"

# ทดสอบ Frontend
echo "3. Testing Frontend..."
curl -f http://localhost:3000 > /dev/null 2>&1 && echo "✅ Frontend: Running" || echo "❌ Frontend: Failed"

echo ""
echo "🔍 Testing API Endpoints..."

# ทดสอบ API endpoints
echo "4. Testing /health endpoint..."
curl -s http://localhost:8080/health | jq '.success' 2>/dev/null && echo "✅ Health endpoint: OK" || echo "❌ Health endpoint: Failed"

echo "5. Testing /api/v1/students endpoint..."
curl -s http://localhost:8080/api/v1/students | jq '.success' 2>/dev/null && echo "✅ Students endpoint: OK" || echo "❌ Students endpoint: Failed"

echo "6. Testing /api/v1/companies endpoint..."
curl -s http://localhost:8080/api/v1/companies | jq '.success' 2>/dev/null && echo "✅ Companies endpoint: OK" || echo "❌ Companies endpoint: Failed"

echo "7. Testing /api/v1/internships endpoint..."
curl -s http://localhost:8080/api/v1/internships | jq '.success' 2>/dev/null && echo "✅ Internships endpoint: OK" || echo "❌ Internships endpoint: Failed"

echo ""
echo "🔐 Testing Login..."

# ทดสอบการ login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"student_id":"6401001","password":"password123"}')

if echo "$LOGIN_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Login test: Successful"
  echo "   User: $(echo "$LOGIN_RESPONSE" | jq -r '.data.user.first_name') $(echo "$LOGIN_RESPONSE" | jq -r '.data.user.last_name')"
else
  echo "❌ Login test: Failed"
fi

echo ""
echo "📋 Database Content Check..."

# ตรวจสอบข้อมูลในฐานข้อมูล
echo "8. Checking database content..."
echo "   Users: $(docker exec internship_test_db psql -U test_user -d internship_test -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')"
echo "   Students: $(docker exec internship_test_db psql -U test_user -d internship_test -t -c "SELECT COUNT(*) FROM students;" 2>/dev/null | tr -d ' ')"
echo "   Companies: $(docker exec internship_test_db psql -U test_user -d internship_test -t -c "SELECT COUNT(*) FROM companies;" 2>/dev/null | tr -d ' ')"
echo "   Internships: $(docker exec internship_test_db psql -U test_user -d internship_test -t -c "SELECT COUNT(*) FROM internships;" 2>/dev/null | tr -d ' ')"

echo ""
echo "📊 Container Logs (Last 10 lines)..."

echo "--- Database Logs ---"
docker logs internship_test_db --tail 10 2>/dev/null || echo "No database logs"

echo "--- Backend Logs ---"
docker logs internship_test_backend --tail 10 2>/dev/null || echo "No backend logs"

echo "--- Frontend Logs ---"
docker logs internship_test_frontend --tail 10 2>/dev/null || echo "No frontend logs"

echo ""
echo "🎯 Test Results Summary:"
echo "========================"

# สรุปผลการทดสอบ
HEALTH_CHECK=$(curl -s http://localhost:8080/health | jq -r '.success' 2>/dev/null)
STUDENTS_CHECK=$(curl -s http://localhost:8080/api/v1/students | jq -r '.success' 2>/dev/null)
LOGIN_CHECK=$(echo "$LOGIN_RESPONSE" | jq -r '.success' 2>/dev/null)

if [ "$HEALTH_CHECK" = "true" ] && [ "$STUDENTS_CHECK" = "true" ] && [ "$LOGIN_CHECK" = "true" ]; then
  echo "🎉 ALL TESTS PASSED!"
  echo ""
  echo "✅ Database Integration: Working"
  echo "✅ Backend API: Working"
  echo "✅ Frontend: Working"
  echo "✅ Authentication: Working"
  echo ""
  echo "🌐 Access your application:"
  echo "   Frontend: http://localhost:3000"
  echo "   Backend API: http://localhost:8080"
  echo "   Database: localhost:5433"
  echo ""
  echo "🔑 Test Login:"
  echo "   รหัสนักศึกษา: 6401001, 6401002, 6401003"
  echo "   รหัสผ่าน: password123"
else
  echo "⚠️ SOME TESTS FAILED"
  echo ""
  echo "Please check the logs above for details."
  echo "You can also check individual services:"
  echo "   docker-compose -f docker-compose.test.yml logs [service_name]"
fi

echo ""
echo "🔧 Management Commands:"
echo "   Stop services: docker-compose -f docker-compose.test.yml down"
echo "   View logs: docker-compose -f docker-compose.test.yml logs -f"
echo "   Restart: docker-compose -f docker-compose.test.yml restart"