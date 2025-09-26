# 🐘 PostgreSQL + Prisma Setup Guide

## ✅ **ทำไมต้อง PostgreSQL?**

### **🏆 ข้อดี:**
- ✅ **รองรับทั้ง Dev & Production**
- ✅ **Prisma support เต็มรูปแบบ**
- ✅ **JSON support** (สำหรับ criteria fields)
- ✅ **Advanced features** (arrays, custom types)
- ✅ **Free tiers** หลายที่
- ✅ **University standard** (ใช้ในมหาลัยส่วนใหญ่)

### **🌐 Database Providers:**
1. **Vercel Postgres** (แนะนำสำหรับ Vercel)
2. **Supabase** (Free tier ดี)
3. **Railway** (Easy setup)
4. **Neon** (Serverless PostgreSQL)
5. **University Server** (Self-hosted)

## 🔧 **Setup PostgreSQL + Prisma**

### **Step 1: แก้ไข Prisma Schema**
```prisma
// apps/backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Models ที่มีอยู่แล้วใช้ได้เลย - ไม่ต้องแก้!
```

### **Step 2: Environment Variables**
```bash
# Development (.env.local)
DATABASE_URL="postgresql://username:password@localhost:5432/internship_dev"

# Production (Vercel/Railway)
DATABASE_URL="postgresql://username:password@host:5432/internship_prod"
```

### **Step 3: Package.json Scripts**
```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:seed": "node prisma/seed.js"
  }
}
```

## 🚀 **Development Setup**

### **Option 1: Local PostgreSQL**
```bash
# Install PostgreSQL
brew install postgresql  # macOS
sudo apt install postgresql  # Ubuntu

# Start service
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Ubuntu

# Create database
createdb internship_dev
```

### **Option 2: Docker PostgreSQL**
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: internship_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### **Option 3: Cloud Development DB**
```bash
# Supabase (Free)
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# Railway (Free $5/month)
DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"
```

## 🌐 **Production Options**

### **1. Vercel Postgres (แนะนำ)**
```bash
# Create database
vercel postgres create

# Auto-generates DATABASE_URL
# Automatically added to Vercel environment
```

### **2. Supabase**
```bash
# Free tier: 500MB, 2 concurrent connections
# Upgrade: $25/month for more resources
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
```

### **3. Railway**
```bash
# $5 credit monthly (free tier)
# Easy deployment and scaling
DATABASE_URL="postgresql://postgres:[password]@[host].railway.app:5432/railway"
```

### **4. University Server**
```bash
# Self-hosted PostgreSQL
DATABASE_URL="postgresql://internship_user:password@university-db.ac.th:5432/internship_prod"
```

## 📋 **Migration Commands**

### **Development:**
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Create migration (when ready for production)
npm run db:migrate

# View database
npm run db:studio
```

### **Production:**
```bash
# Deploy migrations
npm run db:deploy

# Generate client
npm run db:generate
```

## 🔄 **Environment Setup**

### **Development (.env.local):**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/internship_dev"
NEXTAUTH_SECRET="dev-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### **Production (Vercel):**
```env
DATABASE_URL="postgresql://vercel-user:xxx@xxx.postgres.vercel-storage.com:5432/verceldb"
NEXTAUTH_SECRET="production-secret-key"
NEXTAUTH_URL="https://your-app.vercel.app"
```

## 🎯 **Recommended Workflow**

### **Phase 1: Local Development**
1. Setup local PostgreSQL (Docker recommended)
2. Run `npm run db:push`
3. Develop with `npm run db:studio`

### **Phase 2: Cloud Development**
1. Create Supabase/Railway database
2. Update DATABASE_URL
3. Run `npm run db:push`

### **Phase 3: Production**
1. Create Vercel Postgres
2. Run `npm run db:deploy`
3. Deploy application

## 🛠️ **Prisma Client Usage**

### **In API Routes:**
```javascript
// pages/api/users.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const users = await prisma.user.findMany({
      include: {
        student: true,
        instructor: true
      }
    })
    res.json(users)
  }
}
```

### **In Components:**
```javascript
// components/UserList.jsx
import { useState, useEffect } from 'react'

export default function UserList() {
  const [users, setUsers] = useState([])
  
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(setUsers)
  }, [])
  
  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.email}</div>
      ))}
    </div>
  )
}
```

## 🔒 **Security Best Practices**

### **Connection Pooling:**
```javascript
// lib/prisma.js
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### **Environment Variables:**
```bash
# Never commit these to git
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
NEXTAUTH_SECRET="..."
```

## 📊 **Performance Tips**

### **Indexing:**
```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique @db.VarChar(255)
  
  @@index([email])
  @@index([createdAt])
}
```

### **Query Optimization:**
```javascript
// Good: Include related data
const users = await prisma.user.findMany({
  include: { student: true }
})

// Better: Select specific fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    student: { select: { studentId: true } }
  }
})
```

## 🎉 **Ready to Go!**

PostgreSQL + Prisma จะให้:
- ✅ **Consistent development experience**
- ✅ **Production-ready performance**
- ✅ **University deployment compatibility**
- ✅ **Full-featured ORM with type safety**
- ✅ **Easy scaling and maintenance**