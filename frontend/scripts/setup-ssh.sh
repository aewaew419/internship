#!/bin/bash

# SSH Setup Script for VPS Deployment
# This script helps setup SSH key authentication for the VPS

VPS_HOST="203.170.129.199"
VPS_USER="root"
VPS_PORT="22"
VPS_DOMAIN="dev.smart-solutions.com"

echo "🔐 Setting up SSH key authentication for VPS deployment"
echo "Server: $VPS_DOMAIN ($VPS_HOST)"
echo "======================================================="

# Check if SSH key exists
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "📝 No SSH key found. Generating new SSH key..."
    ssh-keygen -t rsa -b 4096 -C "deployment@$(hostname)" -f ~/.ssh/id_rsa -N ""
    echo "✅ SSH key generated successfully"
else
    echo "✅ SSH key already exists"
fi

# Display public key
echo ""
echo "📋 Your public key (copy this to the VPS):"
echo "----------------------------------------"
cat ~/.ssh/id_rsa.pub
echo "----------------------------------------"

echo ""
echo "🚀 Manual setup steps:"
echo "1. Copy the public key above"
echo "2. SSH into your VPS: ssh -p $VPS_PORT $VPS_USER@$VPS_HOST"
echo "3. Create .ssh directory: mkdir -p ~/.ssh"
echo "4. Add your key: echo 'YOUR_PUBLIC_KEY' >> ~/.ssh/authorized_keys"
echo "5. Set permissions: chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
echo ""

# Test connection
echo "🔍 Testing SSH connection..."
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p $VPS_PORT $VPS_USER@$VPS_HOST "echo 'SSH connection successful'" 2>/dev/null; then
    echo "✅ SSH connection successful!"
    echo "🎉 You can now run: npm run deploy:vps"
else
    echo "❌ SSH connection failed"
    echo "💡 You may need to:"
    echo "   - Setup SSH key authentication manually"
    echo "   - Or use password authentication (less secure)"
    echo ""
    echo "🔧 Alternative: Deploy with password authentication"
    echo "   The deployment script will prompt for password if SSH key auth fails"
fi

echo ""
echo "📚 Useful commands after setup:"
echo "  npm run deploy:vps              # Full deployment"
echo "  npm run deploy:vps --setup-only # Setup VPS environment only"
echo "  npm run deploy:vps --skip-build # Deploy without rebuilding"
echo "  npm run deploy:vps --skip-ssl   # Deploy without SSL setup"