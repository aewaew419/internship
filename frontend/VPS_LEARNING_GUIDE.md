# คู่มือเรียนรู้การ Deploy ขึ้น VPS

เรียนรู้การ deploy แบบ step-by-step ใช้ VPS ของ Hostatom เป็นกรณีศึกษา

## 🎯 เป้าหมายการเรียนรู้

1. เข้าใจการทำงานของ VPS
2. เรียนรู้การ setup server environment
3. ฝึกการ deploy application จริง
4. เข้าใจ Docker และ containerization
5. เรียนรู้การจัดการ server

## 📋 ข้อมูล VPS ที่ใช้เรียน

- **Provider:** Hostatom Cloud VPS SSD2
- **Server:** dev.smart-solutions.com
- **IP:** 203.170.129.199
- **OS:** Ubuntu (คาดการณ์)
- **Access:** SSH + FTP

## 🚀 Step 1: เข้าใจ VPS และการเชื่อมต่อ

### VPS คืออะไร?
- Virtual Private Server = เซิร์ฟเวอร์เสมือนส่วนตัว
- เหมือนมีคอมพิวเตอร์เครื่องหนึ่งที่อยู่ในอินเทอร์เน็ต
- สามารถติดตั้งโปรแกรม, เว็บไซต์, database ได้

### วิธีการเชื่อมต่อ VPS

#### 1. SSH (Secure Shell)
```bash
# เชื่อมต่อแบบพื้นฐาน
ssh root@203.170.129.199

# เชื่อมต่อแบบระบุ port
ssh -p 22 root@203.170.129.199
```

#### 2. FTP (File Transfer Protocol)
```bash
# ใช้สำหรับอัพโหลดไฟล์
Server: rb-csl-4f15.hostatom.com
User: v62882
Password: gWE9DqlnJLVdBn
```

### ลองเชื่อมต่อครั้งแรก

```bash
# ทดสอบการเชื่อมต่อ
ssh root@203.170.129.199

# ถ้าเชื่อมต่อได้ จะเห็น command prompt แบบนี้
root@server:~#
```

## 🔧 Step 2: ทำความรู้จักกับ Linux Commands

### คำสั่งพื้นฐานที่ต้องรู้

```bash
# ดูไฟล์และโฟลเดอร์
ls -la

# ดูตำแหน่งปัจจุบัน
pwd

# เปลี่ยนโฟลเดอร์
cd /var/www/html

# ดูข้อมูลระบบ
uname -a
df -h          # ดู disk space
free -h        # ดู memory
top            # ดู running processes

# จัดการไฟล์
mkdir myapp    # สร้างโฟลเดอร์
rm -rf myapp   # ลบโฟลเดอร์
cp file1 file2 # copy ไฟล์
mv file1 file2 # ย้าย/เปลี่ยนชื่อไฟล์

# ดูเนื้อหาไฟล์
cat filename   # ดูทั้งไฟล์
head filename  # ดู 10 บรรทัดแรก
tail filename  # ดู 10 บรรทัดสุดท้าย
nano filename  # แก้ไขไฟล์
```

### ลองใช้คำสั่งพื้นฐาน

```bash
# เข้า SSH แล้วลองรันคำสั่งเหล่านี้
ssh root@203.170.129.199

# ดูข้อมูลระบบ
whoami         # ดูว่าเป็น user อะไร
pwd            # ดูว่าอยู่โฟลเดอร์ไหน
ls -la         # ดูไฟล์ในโฟลเดอร์
df -h          # ดู disk space
free -h        # ดู memory

# สร้างไฟล์ทดสอบ
echo "Hello VPS!" > test.txt
cat test.txt
rm test.txt
```

## 🐳 Step 3: เรียนรู้ Docker

### Docker คืออะไร?
- เครื่องมือสำหรับ "containerization"
- ช่วยให้ application รันได้เหมือนกันทุกที่
- แยก application ออกจาก server environment

### ติดตั้ง Docker บน VPS

```bash
# SSH เข้า VPS
ssh root@203.170.129.199

# อัพเดทระบบ
apt update && apt upgrade -y

# ติดตั้ง Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# ทดสอบ Docker
docker --version
docker run hello-world
```

### Docker Commands พื้นฐาน

```bash
# ดู Docker images
docker images

# ดู running containers
docker ps

# ดู all containers
docker ps -a

# รัน container
docker run -d -p 80:80 nginx

# หยุด container
docker stop container_id

# ลบ container
docker rm container_id

# ลบ image
docker rmi image_name
```

## 📦 Step 4: Deploy แอปแรก (Static Website)

### สร้างเว็บไซต์ทดสอบ

```bash
# SSH เข้า VPS
ssh root@203.170.129.199

# สร้างโฟลเดอร์สำหรับเว็บไซต์
mkdir -p /var/www/test-site
cd /var/www/test-site

# สร้างไฟล์ HTML
cat > index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>My First VPS Website</title>
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        h1 { color: #333; }
        .container { max-width: 600px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 สำเร็จแล้ว!</h1>
        <p>เว็บไซต์แรกบน VPS ของฉัน</p>
        <p>Server: dev.smart-solutions.com</p>
        <p>Date: $(date)</p>
    </div>
</body>
</html>
EOF

# ติดตั้ง Nginx
apt install -y nginx

# ตั้งค่า Nginx
cat > /etc/nginx/sites-available/test-site << 'EOF'
server {
    listen 80;
    server_name dev.smart-solutions.com;
    
    root /var/www/test-site;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
EOF

# เปิดใช้งาน site
ln -s /etc/nginx/sites-available/test-site /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# ทดสอบและ restart Nginx
nginx -t
systemctl restart nginx

# ทดสอบเว็บไซต์
curl http://localhost
```

### ทดสอบจากเครื่องตัวเอง

```bash
# ทดสอบจากเครื่องตัวเอง
curl http://203.170.129.199
# หรือเปิด browser ไปที่ http://203.170.129.199
```

## 🚀 Step 5: Deploy Next.js Application

### เตรียม Application

```bash
# ที่เครื่องตัวเอง - build application
cd frontend
npm run build

# สร้าง deployment package
npm run create:deployment
```

### Upload ไปยัง VPS

```bash
# วิธีที่ 1: ใช้ SCP
scp internship-deployment-*.tar.gz root@203.170.129.199:/tmp/

# วิธีที่ 2: ใช้ FTP (ถ้า SCP ไม่ได้)
# ใช้ FTP client อัพโหลดไฟล์ไปที่ VPS
```

### Deploy บน VPS

```bash
# SSH เข้า VPS
ssh root@203.170.129.199

# Extract deployment package
cd /tmp
tar -xzf internship-deployment-*.tar.gz
cd deployment-package

# รัน deployment script
./scripts/deploy.sh
```

## 🔍 Step 6: Monitoring และ Troubleshooting

### ตรวจสอบสถานะ Services

```bash
# ดูสถานะ Docker containers
docker ps

# ดูสถานะ Nginx
systemctl status nginx

# ดู logs
docker logs container_name
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### แก้ไขปัญหาที่พบบ่อย

#### 1. Port ถูกใช้งานแล้ว
```bash
# ดูว่า port ไหนถูกใช้
netstat -tulpn | grep :80

# หยุด service ที่ใช้ port
systemctl stop apache2  # ถ้ามี Apache
```

#### 2. Permission denied
```bash
# เปลี่ยน owner ไฟล์
chown -R www-data:www-data /var/www/html

# เปลี่ยน permission
chmod -R 755 /var/www/html
```

#### 3. Docker container ไม่เริ่ม
```bash
# ดู error logs
docker logs container_name

# ลบและสร้างใหม่
docker rm -f container_name
docker-compose up -d
```

## 🛡️ Step 7: Security พื้นฐาน

### ตั้งค่า Firewall

```bash
# ติดตั้งและตั้งค่า UFW
apt install -y ufw

# อนุญาต SSH
ufw allow ssh

# อนุญาต HTTP และ HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# เปิดใช้งาน firewall
ufw --force enable

# ดูสถานะ
ufw status
```

### ตั้งค่า SSH Key (ความปลอดภัย)

```bash
# ที่เครื่องตัวเอง - สร้าง SSH key
ssh-keygen -t rsa -b 4096

# Copy public key ไปยัง VPS
ssh-copy-id root@203.170.129.199

# ทดสอบเข้าโดยไม่ต้องใส่รหัสผ่าน
ssh root@203.170.129.199
```

## 📊 Step 8: Performance Monitoring

### ติดตั้ง Monitoring Tools

```bash
# ติดตั้ง htop (process monitor)
apt install -y htop

# ติดตั้ง iotop (disk I/O monitor)
apt install -y iotop

# ติดตั้ง nethogs (network monitor)
apt install -y nethogs
```

### ใช้งาน Monitoring

```bash
# ดู CPU และ Memory usage
htop

# ดู disk I/O
iotop

# ดู network usage
nethogs

# ดู disk usage
df -h
du -sh /var/www/*

# ดู memory usage
free -h
```

## 🔄 Step 9: Backup และ Update

### สร้าง Backup Script

```bash
# สร้าง backup script
cat > /root/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup website files
cp -r /var/www/html $BACKUP_DIR/

# Backup nginx config
cp -r /etc/nginx $BACKUP_DIR/

# Backup docker data
docker save $(docker images -q) > $BACKUP_DIR/docker-images.tar

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x /root/backup.sh

# รัน backup
./backup.sh
```

### Update System

```bash
# อัพเดท packages
apt update && apt upgrade -y

# อัพเดท Docker images
docker-compose pull
docker-compose up -d

# ทำความสะอาด
docker system prune -a
apt autoremove -y
```

## 🎓 Step 10: Advanced Topics

### SSL Certificate (HTTPS)

```bash
# ติดตั้ง Certbot
apt install -y certbot python3-certbot-nginx

# สร้าง SSL certificate
certbot --nginx -d dev.smart-solutions.com

# ทดสอบ auto-renewal
certbot renew --dry-run
```

### Database Setup

```bash
# ติดตั้ง PostgreSQL ด้วย Docker
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_DB=internship \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:13

# เชื่อมต่อ database
docker exec -it postgres psql -U postgres -d internship
```

### Load Balancing (หลาย containers)

```bash
# รัน multiple instances
docker-compose up -d --scale frontend=3

# ตั้งค่า Nginx load balancing
# แก้ไข nginx.conf เพิ่ม upstream
```

## 📚 แหล่งเรียนรู้เพิ่มเติม

### Documentation
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)

### คำสั่งที่ควรจำ
```bash
# System
systemctl status service_name
systemctl restart service_name
journalctl -u service_name -f

# Docker
docker logs -f container_name
docker exec -it container_name bash
docker-compose logs -f

# Network
netstat -tulpn
ss -tulpn
curl -I http://localhost

# Files
find /path -name "*.log"
grep -r "error" /var/log/
tail -f /var/log/nginx/error.log
```

## 🎯 แผนการเรียนรู้

### สัปดาห์ที่ 1: พื้นฐาน
- [ ] เชื่อมต่อ VPS ได้
- [ ] ใช้ Linux commands พื้นฐานได้
- [ ] ติดตั้ง Docker ได้
- [ ] Deploy static website ได้

### สัปดาห์ที่ 2: Application Deployment
- [ ] Deploy Next.js application
- [ ] ตั้งค่า Nginx reverse proxy
- [ ] ใช้ Docker Compose
- [ ] Monitor application

### สัปดาห์ที่ 3: Security & Performance
- [ ] ตั้งค่า SSL certificate
- [ ] ตั้งค่า firewall
- [ ] Monitoring และ logging
- [ ] Backup และ restore

### สัปดาห์ที่ 4: Advanced
- [ ] Database integration
- [ ] Auto-deployment
- [ ] Load balancing
- [ ] Performance optimization

---

**เริ่มต้นจาก Step 1 และค่อยๆ ทำไปทีละขั้นตอน จะได้เข้าใจลึกและใช้งานได้จริง!** 🚀