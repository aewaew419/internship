#!/bin/bash

echo "🚀 Simple Vercel Deploy..."

# Method 1: Deploy from frontend directory
echo "📁 Method 1: Deploy from apps/frontend directory"
cd apps/frontend

echo "🔐 Check Vercel login..."
if ! vercel whoami > /dev/null 2>&1; then
    echo "❌ Please login first: vercel login"
    exit 1
fi

echo "📦 Install dependencies..."
npm install

echo "🏗️ Build project..."
npm run build

echo "🚀 Deploy to Vercel..."
vercel --prod --yes

echo "✅ Deploy complete!"
echo ""
echo "📱 Your app should be available at the URL shown above"
echo ""
echo "🔑 Demo Accounts:"
echo "   Admin: admin@test.com / password123"
echo "   Student: student@test.com / password123"