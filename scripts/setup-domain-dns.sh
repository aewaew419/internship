#!/bin/bash

echo "🌐 Domain DNS Setup Guide"
echo "========================"

VPS_IP="203.170.129.199"
DOMAIN="internship.dev.smart-solutions.com"

echo ""
echo "📋 DNS Configuration Required:"
echo "   Domain: $DOMAIN"
echo "   Target IP: $VPS_IP"
echo ""

echo "🔧 DNS Records to Add:"
echo "   Type: A Record"
echo "   Name: internship.dev"
echo "   Value: $VPS_IP"
echo "   TTL: 300 (5 minutes)"
echo ""

echo "📝 Steps to Configure DNS:"
echo "1. Login to your domain registrar (where you bought smart-solutions.com)"
echo "2. Go to DNS Management / DNS Zone Editor"
echo "3. Add A Record:"
echo "   - Subdomain: internship.dev"
echo "   - Points to: $VPS_IP"
echo "   - TTL: 300"
echo "4. Save changes"
echo "5. Wait 5-15 minutes for DNS propagation"
echo ""

echo "🧪 Testing DNS Resolution:"
echo "   Current status:"

# Test DNS resolution
if nslookup $DOMAIN > /dev/null 2>&1; then
    echo "   ✅ DNS: Resolved"
    RESOLVED_IP=$(nslookup $DOMAIN | grep -A1 "Name:" | tail -1 | awk '{print $2}')
    if [[ "$RESOLVED_IP" == "$VPS_IP" ]]; then
        echo "   ✅ IP Match: Correct ($RESOLVED_IP)"
    else
        echo "   ❌ IP Mismatch: $RESOLVED_IP (should be $VPS_IP)"
    fi
else
    echo "   ❌ DNS: Not resolved yet"
fi

echo ""
echo "🔍 Alternative Access Methods:"
echo "   1. Direct IP: http://$VPS_IP"
echo "   2. Add to hosts file (temporary):"
echo "      echo '$VPS_IP $DOMAIN' >> /etc/hosts"
echo ""

echo "⏰ DNS Propagation Time:"
echo "   - Local: 5-15 minutes"
echo "   - Global: 24-48 hours"
echo ""

echo "🚀 Once DNS is configured, test with:"
echo "   curl -I http://$DOMAIN"
echo "   curl -I https://$DOMAIN (after SSL setup)"