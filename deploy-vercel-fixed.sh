#!/bin/bash

echo "🚀 Deploy to Vercel - Fixed Configuration"
echo "========================================"

# ตรวจสอบว่ามี Vercel CLI หรือไม่
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🔧 Preparing deployment..."

# ไปที่ frontend directory
cd apps/frontend

echo "📋 Current vercel.json configuration:"
cat vercel.json

echo ""
echo "✅ Configuration fixed:"
echo "   - Removed conflicting 'routes' property"
echo "   - Removed invalid 'functions' runtime"
echo "   - Simplified configuration for Next.js App Router"
echo "   - Kept 'headers' for security"
echo ""

echo "🧹 Clean build artifacts..."
rm -rf .next
rm -rf out
rm -rf node_modules/.cache

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building for production..."
npm run build

echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Check the deployment URL provided by Vercel"
echo "2. Update your domain DNS if needed"
echo "3. Test the application functionality"
echo ""
echo "🔧 If you encounter issues:"
echo "1. Check Vercel dashboard for build logs"
echo "2. Verify environment variables"
echo "3. Test API endpoints"