#!/bin/bash

# Quick Auto Deploy Setup Script
# This script sets up the entire auto-deployment system

set -e

VPS_HOST="203.170.129.199"
VPS_USER="root"
VPS_PORT="22"

echo "🚀 Setting up Auto Deployment System"
echo "====================================="

# Step 1: Generate auto deploy configuration
echo "📝 Generating auto deploy configuration..."
npm run setup:auto-deploy

# Step 2: Upload setup script to VPS
echo "📤 Uploading setup script to VPS..."
scp -o StrictHostKeyChecking=no -P $VPS_PORT /tmp/setup-auto-deploy.sh $VPS_USER@$VPS_HOST:/tmp/
scp -o StrictHostKeyChecking=no -P $VPS_PORT /tmp/webhook-server.js $VPS_USER@$VPS_HOST:/tmp/
scp -o StrictHostKeyChecking=no -P $VPS_PORT /tmp/ecosystem.config.js $VPS_USER@$VPS_HOST:/tmp/

# Step 3: Run setup on VPS
echo "⚙️ Running setup on VPS..."
ssh -o StrictHostKeyChecking=no -p $VPS_PORT $VPS_USER@$VPS_HOST "bash /tmp/setup-auto-deploy.sh"

# Step 4: Test webhook server
echo "🔍 Testing webhook server..."
sleep 5
if curl -s http://webhook.dev.smart-solutions.com/health > /dev/null; then
    echo "✅ Webhook server is running"
else
    echo "⚠️ Webhook server might not be accessible yet"
fi

echo ""
echo "✅ Auto Deployment Setup Complete!"
echo ""
echo "📋 Next steps:"
echo "1. Setup GitHub webhook:"
echo "   - Go to: https://github.com/Aew-Work/internship/settings/hooks"
echo "   - Add webhook URL: http://webhook.dev.smart-solutions.com/webhook"
echo "   - Set secret: internship-deploy-webhook-secret-2024"
echo "   - Select 'Just the push event'"
echo ""
echo "2. Test auto deployment:"
echo "   git add ."
echo "   git commit -m \"Test auto deploy\""
echo "   git push origin main"
echo ""
echo "3. Monitor deployment:"
echo "   ssh $VPS_USER@$VPS_HOST \"pm2 logs internship-webhook\""
echo ""
echo "🔗 Webhook endpoints:"
echo "   Health: http://webhook.dev.smart-solutions.com/health"
echo "   Status: http://webhook.dev.smart-solutions.com/status"