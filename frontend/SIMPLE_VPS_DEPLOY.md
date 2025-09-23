# Simple VPS Deployment Instructions

## วิธีการ Deploy แบบง่ายๆ (ไม่ต้องใช้ SSH Key)

### ขั้นตอนที่ 1: เชื่อมต่อ VPS
```bash
ssh -p 22 root@203.170.129.199
# ใส่รหัสผ่าน: rp4QkUUvmbi5qBIP
```

### ขั้นตอนที่ 2: Download และรัน Script
```bash
# Download script
curl -o deploy.sh https://raw.githubusercontent.com/Aew-Work/internship/main/frontend/scripts/vps-simple-deploy.sh

# หรือสร้างไฟล์เอง
nano deploy.sh
# Copy script content จาก /tmp/vps-simple-deploy.sh

# Make executable
chmod +x deploy.sh

# Run script
./deploy.sh
```

### ขั้นตอนที่ 3: ตรวจสอบผลลัพธ์
- เว็บไซต์: http://dev.smart-solutions.com
- HTTPS: https://dev.smart-solutions.com
- Status: `pm2 status`

## หากไม่สามารถ SSH ได้

### วิธีที่ 1: ใช้ Web Terminal
1. เข้า Hostatom control panel
2. หา VPS console/terminal
3. Copy script content และ paste ใน terminal

### วิธีที่ 2: ใช้ FTP + Manual
1. Upload script ผ่าน FTP
2. เข้า web terminal รัน script

### วิธีที่ 3: Manual Setup
ทำทีละขั้นตอนตาม script:
1. `apt update && apt upgrade -y`
2. `curl -fsSL https://deb.nodesource.com/setup_18.x | bash -`
3. `apt-get install -y nodejs`
4. ... (ตาม script)

## การแก้ไขปัญหา

### ถ้า SSH ไม่ได้
- ลองใช้ Terminal ใน browser
- ตรวจสอบ firewall
- ติดต่อ Hostatom support

### ถ้า website ไม่ขึ้น
```bash
pm2 status
pm2 logs internship-frontend
systemctl status nginx
nginx -t
```

### ถ้า SSL ไม่ได้
```bash
certbot --nginx -d dev.smart-solutions.com
```

---

**หมายเหตุ:** วิธีนี้ใช้รหัสผ่าน SSH โดยตรง ไม่ต้องตั้งค่า SSH key ซับซ้อน
