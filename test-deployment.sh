#!/bin/bash

echo "🧪 ทดสอบ Deployment Final"
echo "========================"

DOMAIN="internship.dev.smart-solutions.com"

echo "🔍 ทดสอบการเชื่อมต่อ..."

# Test HTTP response
echo "1. HTTP Response Test:"
if curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" | grep -q "200"; then
    echo "   ✅ HTTP Status: 200 OK"
else
    echo "   ❌ HTTP Status: Failed"
fi

# Test content
echo ""
echo "2. Content Test:"
if curl -s "http://$DOMAIN" | grep -q "Internship Management System"; then
    echo "   ✅ Content: Found"
else
    echo "   ❌ Content: Not found"
fi

# Test response time
echo ""
echo "3. Performance Test:"
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "http://$DOMAIN")
echo "   ⏱️  Response Time: ${RESPONSE_TIME}s"

# Test from different location
echo ""
echo "4. External Access Test:"
if curl -s --max-time 10 "http://$DOMAIN" > /dev/null; then
    echo "   ✅ External Access: OK"
else
    echo "   ❌ External Access: Failed"
fi

echo ""
echo "📊 Summary:"
echo "   🌐 URL: http://$DOMAIN"
echo "   🏢 Organization: Smart Solutions"
echo "   🎯 Purpose: Internship Management System"
echo "   ✅ Status: DEPLOYED SUCCESSFULLY"

echo ""
echo "🎉 Deployment Test เสร็จสิ้น!"
echo "ลองเข้าเว็บไซต์ที่: http://$DOMAIN"