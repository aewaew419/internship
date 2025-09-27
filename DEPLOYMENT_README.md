# 🚀 Internship Management System - Deployment Guide

ระบบจัดการฝึกงานที่มีดีไซน์เก่า + เทคโนโลยีใหม่

## 🎯 Quick Start (3 Steps)

### 1. 🗄️ Setup Local Database
```bash
./setup-local-database.sh
```
- สร้าง PostgreSQL database ใน Docker
- เพิ่มข้อมูล demo สำหรับทดสอบ
- พร้อมใช้งานทันที

### 2. 🏃‍♂️ Run Local Development
```bash
./run-local-with-old-design.sh
```
- เริ่ม Go backend (port 8080)
- เริ่ม Next.js frontend (port 3000)
- เปิดเบราว์เซอร์: http://localhost:3000

### 3. 🚀 Deploy to VPS (One-Click)
```bash
./deploy-vps-one-click.sh
```
- Deploy ทั้งระบบขึ้น VPS
- รวม database, backend, frontend, nginx
- พร้อมใช้งานที่: http://203.170.129.199

## 🔑 Demo Login Accounts

| รหัสนักศึกษา | รหัสผ่าน | ชื่อ | สาขา |
|-------------|---------|------|------|
| 6401001 | password123 | สมชาย ใจดี | วิทยาการคอมพิวเตอร์ |
| 6401002 | password123 | สมหญิง รักเรียน | เทคโนโลยีสารสนเทศ |
| 6401003 | password123 | วิชัย ขยันเรียน | วิศวกรรมซอฟต์แวร์ |

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   Go + Fiber    │    │  PostgreSQL     │
│   Frontend      │◄──►│   Backend       │◄──►│   Database      │
│   (Port 3000)   │    │   (Port 8080)   │    │   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                                              ▲
         │                                              │
┌─────────────────┐                            ┌─────────────────┐
│     Nginx       │                            │   Demo Data     │
│  Reverse Proxy  │                            │   - Users       │
│   (Port 80)     │                            │   - Students    │
└─────────────────┘                            │   - Companies   │
                                               │   - Internships │
                                               └─────────────────┘
```

## 🎨 Features

### ✅ Old Design (UI/UX)
- โลโก้นกสีฟ้าเดิม
- ฟอนต์ Bai Jamjuree
- สี gradient เดิม
- Layout และ styling เดิม
- รหัสนักศึกษาแทนอีเมล

### ✅ New Technology (Backend)
- Next.js 15 (Frontend)
- Go + Fiber (Backend API)
- PostgreSQL (Database)
- Docker (Containerization)
- Nginx (Reverse Proxy)

### ✅ Real Functionality
- Student login with student ID
- Dashboard with real data
- Internship management
- Company information
- Statistics and reports

## 📁 Project Structure

```
internship/
├── apps/
│   ├── frontend/          # Next.js app with old design
│   └── backend/           # Go API server
├── setup-local-database.sh    # Setup local DB
├── run-local-with-old-design.sh  # Run development
├── deploy-vps-one-click.sh     # Deploy to VPS
└── cleanup-unused-files.sh     # Clean old files
```

## 🛠️ Maintenance

### Clean Up Unused Files
```bash
./cleanup-unused-files.sh
```

### Stop Local Database
```bash
docker stop internship_postgres_local
```

### View VPS Logs
```bash
ssh root@203.170.129.199 "cd /opt/internship-production/internship && docker-compose -f docker-compose.production.yml logs"
```

## 🔧 Troubleshooting

### Local Development Issues
1. **Database not starting**: Check Docker is running
2. **Port conflicts**: Stop other services on ports 3000, 8080, 5432
3. **Build errors**: Run `npm install` in apps/frontend

### VPS Deployment Issues
1. **SSH connection failed**: Check VPS is running
2. **Services not starting**: Wait 3-5 minutes for full startup
3. **Database connection**: Check PostgreSQL container logs

## 📞 Support

- **Local testing**: Use demo accounts above
- **VPS access**: http://203.170.129.199
- **API testing**: http://203.170.129.199/api/v1/test
- **Health check**: http://203.170.129.199/health

---

🎉 **Ready to use!** Your internship management system with old design and new technology is now complete!