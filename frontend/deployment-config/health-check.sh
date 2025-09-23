#!/bin/bash
# Health check script for notification system

echo "Checking notification system health..."

# Check if service worker is accessible
SW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/sw.js)
if [ "$SW_STATUS" != "200" ]; then
    echo "❌ Service worker not accessible (HTTP $SW_STATUS)"
    exit 1
fi

# Check if manifest is accessible
MANIFEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/manifest.json)
if [ "$MANIFEST_STATUS" != "200" ]; then
    echo "❌ PWA manifest not accessible (HTTP $MANIFEST_STATUS)"
    exit 1
fi

# Check notification API endpoints
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/notifications/health)
if [ "$API_STATUS" != "200" ]; then
    echo "⚠️  Notification API health check failed (HTTP $API_STATUS)"
fi

echo "✅ Notification system health check passed"
exit 0
