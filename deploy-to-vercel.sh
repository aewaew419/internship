#!/bin/bash

echo "🚀 เตรียม Deploy ไป Vercel..."

# Check if logged in to Vercel
echo "🔐 ตรวจสอบ Vercel login..."
if ! vercel whoami > /dev/null 2>&1; then
    echo "❌ ยังไม่ได้ login Vercel"
    echo "💡 กรุณารัน: vercel login"
    echo "   แล้วจึงรันสคริปต์นี้อีกครั้ง"
    exit 1
fi

echo "✅ Vercel login OK"

# Create environment file for production
echo "⚙️ สร้าง environment variables..."
cat > apps/frontend/.env.production << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://internship-backend.vercel.app/api/v1
NEXT_PUBLIC_APP_URL=https://internship-frontend.vercel.app
NEXT_PUBLIC_ENVIRONMENT=production
EOF

# Build the project first
echo "🏗️ Building project..."
cd apps/frontend
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod --yes

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deploy สำเร็จ!"
    echo ""
    echo "📱 URLs:"
    echo "   Frontend: https://internship-frontend.vercel.app"
    echo "   หรือ URL ที่ Vercel แสดงข้างต้น"
    echo ""
    echo "🔑 Demo Accounts:"
    echo "   Admin: admin@test.com / password123"
    echo "   Student: student@test.com / password123"
    echo ""
    echo "📝 หมายเหตุ:"
    echo "   - Backend API ยังต้อง deploy แยก"
    echo "   - ตอนนี้ Frontend จะใช้ mock data"
    echo ""
else
    echo "❌ Deploy failed!"
    exit 1
fi