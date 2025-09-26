# 🗄️ Database Options สำหรับ Vercel

## 🎯 **แนะนำสำหรับ Vercel:**

### **Option 1: Vercel Postgres (แนะนำ)**
```bash
# ติดตั้ง Vercel Postgres
vercel postgres create

# ได้ DATABASE_URL อัตโนมัติ
# postgres://username:password@host:port/database
```

### **Option 2: PlanetScale (MySQL)**
```bash
# Free tier: 1 database, 1GB storage
DATABASE_URL="mysql://username:password@host:port/database?sslaccept=strict"
```

### **Option 3: Supabase (PostgreSQL)**
```bash
# Free tier: 500MB database, 2 concurrent connections
DATABASE_URL="postgresql://username:password@host:port/database"
```

### **Option 4: Railway (PostgreSQL/MySQL)**
```bash
# Free tier: $5 credit monthly
DATABASE_URL="postgresql://username:password@host:port/database"
```

## 🚀 **Quick Setup สำหรับ Vercel**

### **1. เพิ่ม Environment Variables**
```bash
# ใน Vercel Dashboard หรือ .env.local
DATABASE_URL="your_database_url_here"
JWT_SECRET="your_jwt_secret_here"
```

### **2. แก้ไข Prisma สำหรับ Vercel**
```prisma
// apps/backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"  // เปลี่ยนจาก go client
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"  // หรือ "mysql"
  url      = env("DATABASE_URL")
}
```

### **3. เพิ่ม API Routes สำหรับ Frontend**
```javascript
// apps/frontend/src/pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'OK', 
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
}
```

## 📋 **Database Migration Commands**

### **สำหรับ Development:**
```bash
cd apps/backend
npx prisma generate
npx prisma db push
npx prisma db seed  # ถ้ามี seed file
```

### **สำหรับ Production:**
```bash
npx prisma migrate deploy
npx prisma generate
```

## 🔧 **Frontend API Integration**

### **API Client Setup:**
```javascript
// apps/frontend/src/lib/api.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const api = {
  get: (endpoint) => fetch(`${API_BASE_URL}${endpoint}`).then(r => r.json()),
  post: (endpoint, data) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json())
};
```

## 🎯 **Recommended Approach**

### **Phase 1: Frontend Only (ทันที)**
- Deploy frontend ไป Vercel
- ใช้ mock data ใน API routes
- Demo UI/UX ได้เลย

### **Phase 2: Add Database (1-2 วัน)**
- เพิ่ม Vercel Postgres
- Migrate Prisma schema
- เชื่อมต่อ API routes กับ database

### **Phase 3: Full Backend (1 สัปดาห์)**
- Deploy Go backend ไป Railway/Render
- เชื่อมต่อ frontend กับ backend
- Full functionality

## 🚀 **Quick Start Commands**

### **Deploy Frontend เฉพาะ:**
```bash
cd apps/frontend
vercel --prod
```

### **เพิ่ม Database ภายหลัง:**
```bash
vercel postgres create
vercel env pull .env.local
npx prisma db push
```