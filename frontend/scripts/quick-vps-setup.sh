#!/bin/bash

# Quick VPS Setup Script
# This script performs the complete VPS backup and setup process

set -e

echo "🚀 Quick VPS Backup and Setup"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the frontend directory"
    exit 1
fi

# Step 1: Test SSH connection first
echo "🔍 Testing SSH connection..."
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p 22 root@203.170.129.199 "echo 'SSH test successful'" 2>/dev/null; then
    echo "✅ SSH connection successful"
else
    echo "❌ SSH connection failed"
    echo ""
    echo "💡 Please setup SSH access first:"
    echo "1. Make sure you can connect manually:"
    echo "   ssh -p 22 root@203.170.129.199"
    echo ""
    echo "2. Or setup SSH key authentication:"
    echo "   npm run setup:ssh"
    echo ""
    exit 1
fi

# Step 2: Run backup and setup
echo ""
echo "📦 Starting VPS backup and setup process..."
npm run vps:backup-setup

# Step 3: Show results
echo ""
echo "✅ VPS Backup and Setup Completed!"
echo ""
echo "📋 What happened:"
echo "✓ Connected to VPS (203.170.129.199)"
echo "✓ Backed up existing files"
echo "✓ Created 'backup' branch in Git"
echo "✓ Installed Docker on VPS"
echo "✓ Setup basic VPS environment"
echo "✓ Pushed backup to GitHub"
echo ""
echo "🔍 Check backup files:"
echo "git checkout backup"
echo "ls -la vps-backup/"
echo ""
echo "🔙 Return to main branch:"
echo "git checkout main"
echo ""
echo "🚀 Ready for deployment!"
echo "Next: Setup auto-deployment or deploy manually"