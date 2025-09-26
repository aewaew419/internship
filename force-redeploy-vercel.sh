#!/bin/bash

echo "🔄 Force Redeploy to Vercel"
echo "=========================="

# ตรวจสอบว่ามี Vercel CLI หรือไม่
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "📁 Moving to frontend directory..."
cd apps/frontend

echo "🧹 Clean everything..."
rm -rf .next
rm -rf .vercel
rm -rf node_modules/.cache
rm -rf out

echo "📦 Fresh install..."
npm install

echo "🏗️ Build locally first..."
npm run build

echo "🚀 Force deploy to Vercel..."
vercel --prod --force

echo ""
echo "✅ Force deployment completed!"
echo ""
echo "📋 If still failing, try these steps:"
echo "1. Go to vercel.com/dashboard"
echo "2. Select your project"
echo "3. Click 'Redeploy' button"
echo "4. Select 'main' branch"
echo "5. Click 'Deploy'"
echo ""
echo "🔧 Alternative: Delete and recreate project"
echo "1. Delete project from Vercel dashboard"
echo "2. Run: vercel --prod (will create new project)"