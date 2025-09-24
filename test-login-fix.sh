#!/bin/bash

# Quick Login Test Script
# ทดสอบการ login หลังจากแก้ไข

echo "🧪 Testing Login Fix..."
echo ""

# Test student login API
echo "1. Testing Student Login API..."
RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/student-login \
  -H "Content-Type: application/json" \
  -d '{"studentId":"65010001","password":"password123"}')

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo "   ✅ Student Login API works"
    echo "   Response: $RESPONSE"
else
    echo "   ❌ Student Login API failed"
    echo "   Response: $RESPONSE"
fi

echo ""

# Test staff login API
echo "2. Testing Staff Login API..."
RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff001@university.ac.th","password":"password123"}')

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo "   ✅ Staff Login API works"
    echo "   Response: $RESPONSE"
else
    echo "   ❌ Staff Login API failed"
    echo "   Response: $RESPONSE"
fi

echo ""

# Check frontend
echo "3. Checking Frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ Frontend is accessible"
    echo "   URL: http://localhost:3000"
else
    echo "   ❌ Frontend not accessible"
fi

echo ""

# Check backend
echo "4. Checking Backend..."
if curl -s http://localhost:8080/health > /dev/null; then
    echo "   ✅ Backend is accessible"
    echo "   URL: http://localhost:8080"
else
    echo "   ❌ Backend not accessible"
fi

echo ""
echo "🎯 Demo Accounts:"
echo "   Student: 65010001 / password123"
echo "   Staff: staff001@university.ac.th / password123"
echo "   Admin: admin@university.ac.th / password123"
echo ""
echo "🌐 Try logging in at: http://localhost:3000"