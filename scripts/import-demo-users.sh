#!/bin/bash

echo "📋 Importing Demo Users from DEMO_USERS.md"
echo "=========================================="

# Check if database is running
echo "🔍 Checking database connection..."
if ! docker exec internship_db pg_isready -U test_user -d internship_test > /dev/null 2>&1; then
    echo "❌ Database is not ready. Please start the system first:"
    echo "   docker-compose -f docker-compose.simple.yml up -d"
    exit 1
fi

echo "✅ Database is ready"

# Backup current data
echo "💾 Creating backup of current data..."
docker exec internship_db pg_dump -U test_user -d internship_test > backup_$(date +%Y%m%d_%H%M%S).sql
echo "✅ Backup created"

# Import demo users
echo "📥 Importing demo users..."
docker exec -i internship_db psql -U test_user -d internship_test < database/import-demo-users.sql

if [ $? -eq 0 ]; then
    echo "✅ Demo users imported successfully!"
    echo ""
    echo "📊 Summary:"
    echo "   👥 Total Users: 35 คน"
    echo "   🔑 Admin: 6 คน"
    echo "   👔 Staff: 2 คน" 
    echo "   👨‍🏫 Instructor: 3 คน"
    echo "   🏛️ Committee: 2 คน"
    echo "   🎓 Student: 22 คน"
    echo ""
    echo "🔐 Default Passwords:"
    echo "   📌 Most users: 123456"
    echo "   📌 admin2: admin123"
    echo "   📌 demo001: demo123"
    echo ""
    echo "🧪 Test Login Examples:"
    echo "   👤 Admin: admin2 / admin123"
    echo "   👤 Demo Admin: demo001 / demo123"
    echo "   👤 Test Student: test001 / 123456"
    echo "   👤 Regular Student: u6800001 / 123456"
    echo ""
    echo "🌐 Access the system:"
    echo "   http://localhost:3000"
    echo ""
    echo "⚠️  Important: Users should change their passwords after first login!"
else
    echo "❌ Failed to import demo users"
    echo "Check the error messages above"
    exit 1
fi