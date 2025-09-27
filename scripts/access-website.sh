#!/bin/bash

echo "🌐 Website Access Information"
echo "============================"

VPS_IP="203.170.129.199"
DOMAIN="internship.dev.smart-solutions.com"

echo ""
echo "✅ WORKING LINKS:"
echo "   🔗 Direct IP Access: http://$VPS_IP"
echo "   📱 Mobile friendly: http://$VPS_IP"
echo ""

echo "🧪 Testing website availability..."
if curl -s -o /dev/null -w "%{http_code}" "http://$VPS_IP" | grep -q "200"; then
    echo "   ✅ Website Status: ONLINE"
    echo "   ✅ HTTP Response: 200 OK"
else
    echo "   ❌ Website Status: OFFLINE"
fi

echo ""
echo "🔧 Domain Status:"
if nslookup $DOMAIN > /dev/null 2>&1; then
    echo "   ⚠️  Domain: DNS configured but may need time to propagate"
else
    echo "   ❌ Domain: DNS not configured yet"
fi

echo ""
echo "📋 Quick Access:"
echo "   1. Copy this URL: http://$VPS_IP"
echo "   2. Paste in your browser"
echo "   3. You should see the Internship Management System"
echo ""

echo "🚀 Opening website in browser..."
if command -v open > /dev/null 2>&1; then
    # macOS
    open "http://$VPS_IP"
elif command -v xdg-open > /dev/null 2>&1; then
    # Linux
    xdg-open "http://$VPS_IP"
elif command -v start > /dev/null 2>&1; then
    # Windows
    start "http://$VPS_IP"
else
    echo "   Please manually open: http://$VPS_IP"
fi

echo ""
echo "📞 Support Information:"
echo "   - If you see a blank page, wait 1-2 minutes and refresh"
echo "   - If still not working, check VPS status"
echo "   - For domain setup, configure DNS A record"