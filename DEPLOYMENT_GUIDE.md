# 🚀 คู่มือ Deployment ไปยัง Hostatom VPS

## ข้อกำหนดเบื้องต้น

### VPS Requirements
- **OS**: Ubuntu 20.04+ หรือ Debian 11+
- **RAM**: อย่างน้อย 2GB (แนะนำ 4GB+)
- **Storage**: อย่างน้อย 20GB (แนะนำ 50GB+)
- **CPU**: อย่างน้อย 2 cores
- **Network**: Public IP และ domain name

### Local Requirements
- SSH key ที่สามารถเข้าถึง VPS ได้
- Git repository ที่ push ไปยัง `aewaew419/internship` แล้ว

## 🔧 การเตรียมความพร้อม

### 1. เตรียม SSH Key
```bash
# สร้าง SSH key (ถ้ายังไม่มี)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy SSH key ไปยัง VPS
ssh-copy-id -p 22 root@YOUR_VPS_IP
```

### 2. เตรียม Domain
- ตั้งค่า DNS A record ให้ชี้ไปยัง IP ของ VPS
- รอให้ DNS propagate (อาจใช้เวลา 1-24 ชั่วโมง)

## 🚀 การ Deploy

### วิธีที่ 1: ใช้ Script อัตโนมัติ (แนะนำ)

```bash
# รันสคริปต์ deployment
./deploy-to-hostatom.sh
```

สคริปต์จะถามข้อมูลต่อไปนี้:
- **VPS IP/Domain**: IP หรือ domain ของ VPS
- **SSH Username**: username สำหรับ SSH (default: root)
- **SSH Port**: port สำหรับ SSH (default: 22)
- **Domain**: domain ที่จะใช้สำหรับเว็บไซต์

### วิธีที่ 2: Manual Deployment

#### Step 1: เตรียม VPS
```bash
# เชื่อมต่อไปยัง VPS
ssh root@YOUR_VPS_IP

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

#### Step 2: Clone Repository
```bash
# สร้าง directory
mkdir -p /opt/internship-system
cd /opt/internship-system

# Clone repository
git clone https://github.com/aewaew419/internship.git .
```

#### Step 3: สร้าง Environment File
```bash
# สร้างไฟล์ .env.production
cat > .env.production << EOF
NODE_ENV=production
GO_ENV=production
DOMAIN=your-domain.com
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
REDIS_PASSWORD=$(openssl rand -base64 32)
# ... (ดูตัวอย่างเพิ่มเติมในไฟล์ deploy script)
EOF
```

#### Step 4: Deploy Application
```bash
# Build และ start containers
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d
```

#### Step 5: Setup SSL Certificate
```bash
# Install Certbot
apt install -y certbot

# Get SSL certificate
certbot certonly --standalone -d your-domain.com

# Copy certificates
mkdir -p deployment/nginx/ssl
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem deployment/nginx/ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem deployment/nginx/ssl/

# Restart nginx
docker-compose -f deployment/docker-compose.prod.yml restart nginx
```

## 🔐 Security Configuration

### Firewall Setup
```bash
# Configure UFW
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### SSL Auto-renewal
```bash
# Add to crontab
crontab -e

# เพิ่มบรรทัดนี้
0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'cd /opt/internship-system && docker-compose -f deployment/docker-compose.prod.yml restart nginx'
```

## 📊 Monitoring และ Backup

### Database Backup
```bash
# สร้าง backup script
cat > /opt/internship-system/scripts/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/internship-system/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"
docker exec internship_db pg_dump -U internship_user internship_prod | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /opt/internship-system/scripts/backup-db.sh

# เพิ่มใน crontab (backup ทุกวันเวลา 2 AM)
0 2 * * * /opt/internship-system/scripts/backup-db.sh
```

### Health Monitoring
```bash
# สร้าง health check script
cat > /opt/internship-system/scripts/health-check.sh << 'EOF'
#!/bin/bash
if ! curl -f -s https://your-domain.com/health > /dev/null; then
    echo "Health check failed at $(date)" >> /var/log/internship-health.log
    # ส่ง notification (email, slack, etc.)
fi
EOF

chmod +x /opt/internship-system/scripts/health-check.sh

# เพิ่มใน crontab (check ทุก 5 นาที)
*/5 * * * * /opt/internship-system/scripts/health-check.sh
```

## 🛠️ การจัดการระบบ

### คำสั่งที่ใช้บ่อย

```bash
# ดู logs
docker-compose -f deployment/docker-compose.prod.yml logs -f

# Restart services
docker-compose -f deployment/docker-compose.prod.yml restart

# Update application
cd /opt/internship-system
git pull origin main
docker-compose -f deployment/docker-compose.prod.yml build
docker-compose -f deployment/docker-compose.prod.yml up -d

# ดู status ของ containers
docker-compose -f deployment/docker-compose.prod.yml ps

# เข้าไปใน container
docker exec -it internship_backend bash
docker exec -it internship_db psql -U internship_user -d internship_prod
```

### การแก้ไขปัญหา

#### ถ้า container ไม่ start
```bash
# ดู logs เพื่อหาสาเหตุ
docker-compose -f deployment/docker-compose.prod.yml logs [service_name]

# Rebuild container
docker-compose -f deployment/docker-compose.prod.yml build --no-cache [service_name]
docker-compose -f deployment/docker-compose.prod.yml up -d [service_name]
```

#### ถ้า database connection error
```bash
# ตรวจสอบ database
docker exec -it internship_db pg_isready -U internship_user

# ดู database logs
docker-compose -f deployment/docker-compose.prod.yml logs postgres
```

#### ถ้า SSL certificate หมดอายุ
```bash
# Renew certificate manually
certbot renew --force-renewal

# Copy new certificates
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/internship-system/deployment/nginx/ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/internship-system/deployment/nginx/ssl/

# Restart nginx
docker-compose -f deployment/docker-compose.prod.yml restart nginx
```

## 📈 Performance Optimization

### Database Optimization
```sql
-- เข้าไปใน database
docker exec -it internship_db psql -U internship_user -d internship_prod

-- สร้าง indexes สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_internships_status ON internships(status);
```

### Nginx Optimization
```nginx
# เพิ่มใน nginx.conf
worker_processes auto;
worker_connections 2048;

# Enable caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔄 การ Update ระบบ

### Update Code
```bash
cd /opt/internship-system
git pull origin main
docker-compose -f deployment/docker-compose.prod.yml build
docker-compose -f deployment/docker-compose.prod.yml up -d
```

### Database Migration
```bash
# ถ้ามี database migration
docker exec -it internship_backend ./migrate-db
```

## 📞 การติดต่อและการสนับสนุน

หากมีปัญหาในการ deployment:

1. ตรวจสอบ logs ก่อน
2. ดู troubleshooting guide ข้างต้น
3. ตรวจสอบ system resources (CPU, Memory, Disk)
4. ติดต่อทีมพัฒนาพร้อมข้อมูล logs

## 📋 Checklist หลัง Deployment

- [ ] เว็บไซต์เข้าถึงได้ผ่าน HTTPS
- [ ] Health check endpoint ทำงาน
- [ ] Database connection ปกติ
- [ ] SSL certificate ติดตั้งแล้ว
- [ ] Firewall ตั้งค่าแล้ว
- [ ] Backup script ทำงาน
- [ ] Health monitoring ทำงาน
- [ ] Auto-renewal SSL ตั้งค่าแล้ว
- [ ] Performance test ผ่าน

---

**หมายเหตุ**: คู่มือนี้เป็นแนวทางทั่วไป อาจต้องปรับแต่งตามสภาพแวดล้อมจริงของ VPS