# VPS Deployment Guide - Hostatom Cloud VPS

คู่มือการ deploy ระบบ Internship Management System ไปยัง VPS ของ Hostatom

## ข้อมูล Server

- **Server Name:** dev.smart-solutions.com
- **IP Address:** 203.170.129.199
- **SSH Port:** 22
- **User:** root
- **Provider:** Hostatom Cloud VPS SSD2

## การเตรียมตัวก่อน Deploy

### 1. Setup SSH Key Authentication (แนะนำ)

```bash
# รัน script setup SSH
npm run setup:ssh

# หรือ setup manual
ssh-keygen -t rsa -b 4096 -C "deployment@$(hostname)"
ssh-copy-id -p 22 root@203.170.129.199
```

### 2. ทดสอบการเชื่อมต่อ

```bash
ssh -p 22 root@203.170.129.199
```

## การ Deploy

### 1. Deploy แบบเต็มรูปแบบ (ครั้งแรก)

```bash
# Setup VPS environment ก่อน (ครั้งแรกเท่านั้น)
npm run deploy:vps --setup-only

# Deploy application
npm run deploy:vps
```

### 2. Deploy แบบอัพเดท

```bash
# Deploy โดยไม่ rebuild (ถ้า build แล้ว)
npm run deploy:vps --skip-build

# Deploy โดยไม่ setup SSL (ถ้า setup แล้ว)
npm run deploy:vps --skip-ssl
```

## สิ่งที่ Script จะทำ

### 1. **Setup VPS Environment** (ครั้งแรก)
- อัพเดท system packages
- ติดตั้ง Node.js 18
- ติดตั้ง PM2 (Process Manager)
- ติดตั้ง Nginx (Web Server)
- ติดตั้ง Certbot (SSL Certificate)
- สร้าง directories ที่จำเป็น

### 2. **Build Application**
- ติดตั้ง dependencies
- เตรียม notification system
- Build production files
- สร้าง environment configuration

### 3. **Deploy Files**
- สำรอง deployment เก่า
- อัพโหลดไฟล์ใหม่ไปยัง VPS
- ตั้งค่า environment variables

### 4. **Configure Nginx**
- ตั้งค่า reverse proxy
- กำหนด cache headers
- เตรียม API endpoints สำหรับ backend
- ตั้งค่า security headers

### 5. **Setup PM2 Process**
- สร้าง PM2 configuration
- เริ่มต้น Node.js process
- ตั้งค่า auto-restart
- กำหนด log files

### 6. **SSL Certificate** (Optional)
- ติดตั้ง Let's Encrypt certificate
- ตั้งค่า HTTPS redirect
- กำหนด SSL security

## หลังจาก Deploy เสร็จ

### 1. **ตรวจสอบสถานะ**

```bash
# เข้าไปดู status ใน VPS
ssh -p 22 root@203.170.129.199

# ตรวจสอบ PM2
pm2 status
pm2 logs internship-frontend

# ตรวจสอบ Nginx
nginx -t
systemctl status nginx

# ตรวจสอบ logs
tail -f /var/log/internship/combined.log
```

### 2. **เข้าถึงเว็บไซต์**

- **หลัก:** https://dev.smart-solutions.com
- **Status:** https://dev.smart-solutions.com/status.html
- **HTTP (redirect to HTTPS):** http://dev.smart-solutions.com

### 3. **ตรวจสอบ Service Worker**

- เปิด Chrome DevTools > Application > Service Workers
- ตรวจสอบว่า service worker ลงทะเบียนสำเร็จ
- ทดสอบ offline functionality

## การจัดการหลัง Deploy

### 1. **อัพเดท Application**

```bash
# Build และ deploy version ใหม่
npm run deploy:vps

# หรือ deploy โดยไม่ rebuild
git pull
npm run deploy:vps --skip-build
```

### 2. **จัดการ PM2 Process**

```bash
# SSH เข้า VPS
ssh -p 22 root@203.170.129.199

# ดู status
pm2 status

# Restart application
pm2 restart internship-frontend

# ดู logs
pm2 logs internship-frontend

# Monitor real-time
pm2 monit
```

### 3. **จัดการ Nginx**

```bash
# ทดสอบ configuration
nginx -t

# Reload configuration
systemctl reload nginx

# Restart nginx
systemctl restart nginx

# ดู logs
tail -f /var/log/nginx/dev.smart-solutions.com.access.log
tail -f /var/log/nginx/dev.smart-solutions.com.error.log
```

## การแก้ไขปัญหา

### 1. **SSH Connection Failed**

```bash
# ใช้ password authentication
ssh -o PreferredAuthentications=password -p 22 root@203.170.129.199

# หรือ setup SSH key ใหม่
npm run setup:ssh
```

### 2. **Deployment Failed**

```bash
# ตรวจสอบ logs
ssh -p 22 root@203.170.129.199 "tail -f /var/log/internship/error.log"

# Restart services
ssh -p 22 root@203.170.129.199 "pm2 restart all && systemctl reload nginx"
```

### 3. **Website Not Accessible**

```bash
# ตรวจสอบ Nginx status
ssh -p 22 root@203.170.129.199 "systemctl status nginx"

# ตรวจสอบ PM2 status
ssh -p 22 root@203.170.129.199 "pm2 status"

# ตรวจสอบ firewall
ssh -p 22 root@203.170.129.199 "ufw status"
```

### 4. **SSL Certificate Issues**

```bash
# Setup SSL manually
ssh -p 22 root@203.170.129.199
certbot --nginx -d dev.smart-solutions.com -d www.dev.smart-solutions.com

# ตรวจสอบ certificate
certbot certificates
```

## การเตรียมพร้อมสำหรับ Backend

### 1. **API Endpoints ที่เตรียมไว้**

Nginx ได้ตั้งค่า proxy สำหรับ `/api/*` ไปยัง `localhost:3333` แล้ว

### 2. **Environment Variables ที่ต้องอัพเดท**

เมื่อ backend พร้อม ให้อัพเดทใน `/var/www/html/.env.local`:

```bash
# เปิดใช้งาน push notifications
NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true

# ใส่ VAPID keys จริง
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_real_vapid_public_key
VAPID_PRIVATE_KEY=your_real_vapid_private_key

# API URL
NEXT_PUBLIC_API_BASE_URL=https://dev.smart-solutions.com/api
```

### 3. **Restart หลังอัพเดท Environment**

```bash
ssh -p 22 root@203.170.129.199 "cd /var/www/html && pm2 restart internship-frontend"
```

## Security Checklist

- ✅ SSH key authentication
- ✅ HTTPS/SSL certificate
- ✅ Nginx security headers
- ✅ Firewall configuration (ถ้าจำเป็น)
- ✅ Regular system updates
- ⚠️ Change default SSH port (แนะนำ)
- ⚠️ Setup fail2ban (แนะนำ)

## Monitoring และ Maintenance

### 1. **Log Files**
- Application: `/var/log/internship/`
- Nginx: `/var/log/nginx/`
- System: `/var/log/syslog`

### 2. **Regular Tasks**
- อัพเดท system packages
- ตรวจสอบ SSL certificate expiry
- Monitor disk space และ memory usage
- Backup application และ configuration

### 3. **Performance Monitoring**
- ใช้ `htop` หรือ `top` ดู resource usage
- ใช้ `pm2 monit` ดู application performance
- ตรวจสอบ Nginx access logs สำหรับ traffic patterns

## ติดต่อและสนับสนุน

หากมีปัญหาในการ deploy หรือต้องการความช่วยเหลือ:

1. ตรวจสอบ logs ใน VPS
2. ดู error messages ใน deployment script
3. ทดสอบแต่ละขั้นตอนแยกกัน
4. ติดต่อทีมพัฒนาพร้อมข้อมูล error logs

---

**หมายเหตุ:** คู่มือนี้เป็นสำหรับการ deploy frontend เท่านั้น การทำงานเต็มรูปแบบของระบบการแจ้งเตือนจะต้องรอ backend deployment เสร็จสิ้นก่อน