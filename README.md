# Internship Management System

ระบบจัดการฝึกงานที่พัฒนาด้วย Next.js และ Go/Node.js

## 🚀 Quick Start

### Development
```bash
# คัดลอกไฟล์ environment
cp .env.example .env

# รัน development environment
./scripts/deploy.sh dev
```

### Production
```bash
# สร้างไฟล์ .env.production
cp .env.example .env.production
# แก้ไขค่าต่างๆ ใน .env.production

# รัน production environment
./scripts/deploy.sh prod
```

### Testing
```bash
# รัน test environment
./scripts/deploy.sh test
```

## 📋 Available Commands

```bash
./scripts/deploy.sh dev     # Development environment
./scripts/deploy.sh prod    # Production environment  
./scripts/deploy.sh test    # Test environment
./scripts/deploy.sh logs    # View logs
./scripts/deploy.sh stop    # Stop all services
```

## 🏗️ Architecture

- **Frontend**: Next.js (React)
- **Backend**: Go/Node.js API
- **Database**: PostgreSQL
- **Cache**: Redis (production only)
- **Proxy**: Nginx (production only)

## 📁 Project Structure

```
├── apps/
│   ├── frontend/          # Next.js application
│   └── backend/           # API server
├── database/              # Database scripts
├── scripts/
│   ├── deploy.sh         # Main deployment script
│   ├── backup/           # Database backups
│   └── old-files/        # Legacy files
├── docker-compose.yml    # Main Docker configuration
└── .env.example         # Environment template
```

## 🌐 Access URLs

### Development
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

### Production
- Website: http://localhost (via Nginx)
- API: http://localhost/api

### Test
- Frontend: http://localhost:3001
- Backend API: http://localhost:8081

## 🔧 Environment Variables

สำคัญ! ต้องตั้งค่าใน `.env` หรือ `.env.production`:

```env
# Database
DB_NAME=internship_db
DB_USER=postgres
DB_PASSWORD=your-secure-password

# Security
JWT_SECRET=your-super-secret-jwt-key

# URLs
API_URL=http://localhost:8080/api/v1
```

## 📊 Monitoring

```bash
# ดู status ของ containers
docker-compose ps

# ดู logs
docker-compose logs -f

# ดู resource usage
docker stats
```

## 🛠️ Troubleshooting

### Container ไม่ขึ้น
```bash
# ดู logs เพื่อหาสาเหตุ
docker-compose logs [service-name]

# Restart services
./scripts/deploy.sh stop
./scripts/deploy.sh dev
```

### Database connection error
```bash
# ตรวจสอบว่า PostgreSQL ทำงานหรือไม่
docker-compose exec postgres pg_isready

# Reset database
docker-compose down -v
./scripts/deploy.sh dev
```

## 📝 Development Notes

- ไฟล์เก่าถูกย้ายไปที่ `scripts/old-files/`
- Database backups อยู่ที่ `scripts/backup/`
- ใช้ Docker profiles สำหรับแยก dev/prod environments