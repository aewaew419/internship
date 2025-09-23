# Project Task Plan - Internship Management System

## 📋 สถานะปัจจุบัน

### ✅ งานที่เสร็จแล้ว
- [x] ระบบ Push Notification (Frontend) - ครบถ้วน
- [x] Authentication Integration
- [x] Layout Integration (Desktop + Mobile)
- [x] Deployment Scripts และ Configuration
- [x] VPS Learning Scripts
- [x] SSH Key Setup Request

### 🔄 งานที่กำลังดำเนินการ
- [ ] รอ SSH Key ติดตั้งจาก Hostatom
- [ ] ทดสอบ VPS Deployment

## 🎯 Task Plan ที่เหลือ

### Phase 1: VPS Deployment & Learning (รอ SSH Key)
```
Priority: High
Timeline: 1-2 วัน (รอ Hostatom)

Tasks:
1. [ ] รอ SSH Key ติดตั้งเสร็จจาก Hostatom
2. [ ] ทดสอบ SSH connection โดยไม่ต้องใส่รหัสผ่าน
3. [ ] รัน VPS Learning Script: npm run learn:vps
4. [ ] Deploy เว็บไซต์ทดสอบขึ้น VPS
5. [ ] Deploy Next.js Application ขึ้น VPS
6. [ ] ทดสอบการทำงานของระบบบน VPS
7. [ ] สร้างเอกสารสรุปการเรียนรู้ VPS
```

### Phase 2: Backend Development (ขนาน)
```
Priority: High
Timeline: 3-5 วัน

Tasks:
1. [ ] สร้าง Backend API Structure
   - [ ] Setup Laravel/Node.js project
   - [ ] Database schema design
   - [ ] Authentication API
   - [ ] User management API

2. [ ] Notification Backend
   - [ ] Push notification service
   - [ ] VAPID keys configuration
   - [ ] Notification CRUD API
   - [ ] Real-time notification system

3. [ ] Integration APIs
   - [ ] File upload API
   - [ ] Internship management API
   - [ ] Document management API
   - [ ] Evaluation system API
```

### Phase 3: Full System Integration
```
Priority: Medium
Timeline: 2-3 วัน

Tasks:
1. [ ] Connect Frontend กับ Backend
   - [ ] API integration
   - [ ] Authentication flow
   - [ ] Notification system testing

2. [ ] End-to-End Testing
   - [ ] User registration/login
   - [ ] Internship application flow
   - [ ] Document upload/download
   - [ ] Notification delivery

3. [ ] Performance Optimization
   - [ ] API response optimization
   - [ ] Frontend bundle optimization
   - [ ] Database query optimization
```

### Phase 4: University Deployment Preparation
```
Priority: Medium
Timeline: 1-2 วัน

Tasks:
1. [ ] University Server Requirements
   - [ ] ศึกษา server specification ของมหาลัย
   - [ ] เตรียม deployment package
   - [ ] สร้างคู่มือการติดตั้ง

2. [ ] Migration Planning
   - [ ] Data migration strategy
   - [ ] Backup and restore procedures
   - [ ] Rollback plan

3. [ ] Documentation
   - [ ] User manual (Thai)
   - [ ] Admin manual
   - [ ] Technical documentation
```

### Phase 5: Final Testing & Documentation
```
Priority: Low
Timeline: 1-2 วัน

Tasks:
1. [ ] User Acceptance Testing
   - [ ] Student workflow testing
   - [ ] Instructor workflow testing
   - [ ] Admin workflow testing

2. [ ] Security Testing
   - [ ] Authentication security
   - [ ] Data validation
   - [ ] File upload security

3. [ ] Final Documentation
   - [ ] Project report
   - [ ] Deployment guide
   - [ ] Maintenance guide
```

## 🚀 Immediate Actions (วันนี้-พรุ่งนี้)

### ขณะรอ SSH Key จาก Hostatom:

#### 1. Backend Development Setup
```bash
# สร้าง backend project structure
mkdir backend
cd backend

# เลือก technology stack
# Option A: Laravel (PHP)
composer create-project laravel/laravel internship-api

# Option B: Node.js + Express
npm init -y
npm install express cors helmet morgan dotenv
```

#### 2. Database Design
```sql
-- Users table
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Push subscriptions table
CREATE TABLE push_subscriptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 3. API Endpoints Planning
```
Authentication:
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/refresh

Notifications:
GET    /api/notifications
POST   /api/notifications
PUT    /api/notifications/{id}/read
DELETE /api/notifications/{id}
POST   /api/notifications/mark-all-read

Push Notifications:
POST   /api/push/subscribe
DELETE /api/push/unsubscribe
POST   /api/push/send (admin only)

Users:
GET    /api/users
POST   /api/users
PUT    /api/users/{id}
DELETE /api/users/{id}
```

#### 4. Environment Configuration
```env
# Backend .env template
APP_NAME="Internship Management API"
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:3333

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=internship_db
DB_USERNAME=root
DB_PASSWORD=

# Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:admin@university.ac.th

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 📅 Timeline Overview

```
Week 1: VPS Learning + Backend Setup
├── Day 1-2: รอ SSH Key, เริ่ม Backend
├── Day 3-4: VPS Deployment Learning
├── Day 5-7: Backend API Development

Week 2: Integration + Testing
├── Day 1-3: Frontend-Backend Integration
├── Day 4-5: End-to-End Testing
├── Day 6-7: University Deployment Prep

Week 3: Final Polish + Documentation
├── Day 1-2: Final Testing
├── Day 3-4: Documentation
├── Day 5-7: University Deployment
```

## 🎯 Success Criteria

### VPS Learning Success:
- [ ] สามารถเชื่อมต่อ VPS โดยไม่ต้องใส่รหัสผ่าน
- [ ] Deploy เว็บไซต์ขึ้น VPS ได้สำเร็จ
- [ ] เข้าใจการใช้ Docker, Nginx, PM2
- [ ] พร้อมสำหรับ deploy ที่มหาวิทยาลัย

### Backend Development Success:
- [ ] API ทำงานได้ครบทุก endpoint
- [ ] Push notification ส่งได้จริง
- [ ] Authentication system ปลอดภัย
- [ ] Database design เหมาะสม

### Integration Success:
- [ ] Frontend เชื่อมต่อ Backend ได้
- [ ] Notification system ทำงานแบบ real-time
- [ ] User workflow ทำงานได้ครบ
- [ ] Performance ดีพอใช้งานจริง

## 🔧 Commands สำหรับ Development

```bash
# VPS Learning (เมื่อ SSH Key พร้อม)
npm run learn:vps          # เรียนรู้ VPS deployment
npm run test:vps           # ทดสอบการเชื่อมต่อ VPS
npm run deploy:vps         # Deploy ขึ้น VPS

# Development
npm run dev                # Start frontend dev server
npm run build              # Build for production
npm run create:deployment  # สร้าง deployment package

# Backend (เมื่อสร้างแล้ว)
npm run backend:dev        # Start backend dev server
npm run backend:test       # Run backend tests
npm run backend:migrate    # Run database migrations
```

## 📞 Contact & Support

### Hostatom VPS:
- SSH Key Status: รอการติดตั้ง
- Support: support@hostatom.com
- LINE: @hostatom

### University Deployment:
- IT Contact: (รอข้อมูลจากมหาวิทยาลัย)
- Server Specs: (รอข้อมูล)
- Deployment Timeline: หลังส่งงาน

---

**หมายเหตุ:** Task plan นี้จะอัพเดทตามความคืบหน้าของงาน และสามารถปรับเปลี่ยนตามสถานการณ์ได้