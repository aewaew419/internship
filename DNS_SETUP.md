# การตั้งค่า DNS สำหรับระบบ Internship Management

## 🌐 **โครงสร้าง Domain:**

### 📍 **Portal หลัก (Company Website):**
- **URL:** http://dev.smart-solutions.com:8080/
- **วัตถุประสงค์:** เว็บไซต์บริษัท + Portal หลัก
- **เนื้อหา:** แสดงผลงาน, ข้อมูลบริษัท, ลิงก์ไปยัง Subdomain

### 📍 **Internship System (Subdomain):**
- **URL:** https://internship.dev.smart-solutions.com/
- **วัตถุประสงค์:** ระบบจัดการฝึกงาน
- **เนื้อหา:** ระบบ Login, จัดการนักศึกษา, อาจารย์, ฝึกงาน

---

## ⚙️ **การตั้งค่า DNS Records:**

### 🔧 **DNS Records ที่ต้องเพิ่ม:**

```dns
# A Record สำหรับ Portal หลัก
Name: dev
Type: A  
Value: 203.170.129.199
TTL: 300

# A Record สำหรับ Internship Subdomain
Name: internship.dev
Type: A
Value: 203.170.129.199  
TTL: 300
```

### 🔧 **หรือใช้ CNAME (ทางเลือก):**

```dns
# CNAME สำหรับ Internship Subdomain
Name: internship.dev
Type: CNAME
Value: dev.smart-solutions.com
TTL: 300
```

---

## 🧪 **การทดสอบ DNS:**

### ✅ **ทดสอบ DNS Resolution:**
```bash
# ทดสอบ Portal หลัก
nslookup dev.smart-solutions.com

# ทดสอบ Internship Subdomain  
nslookup internship.dev.smart-solutions.com

# ทดสอบการเชื่อมต่อ
ping internship.dev.smart-solutions.com
```

### ✅ **ทดสอบ HTTPS:**
```bash
# ทดสอบ Internship System
curl -k https://internship.dev.smart-solutions.com/api/v1/test

# ทดสอบ Portal (HTTP)
curl http://dev.smart-solutions.com:8080/
```

---

## 🔗 **การเชื่อมโยง Portal กับ Internship:**

### 📝 **ใน Portal Website (dev.smart-solutions.com:8080):**

```html
<!-- ตัวอย่างการลิงก์ไปยัง Internship System -->
<div class="portfolio-section">
  <h2>ผลงานของเรา</h2>
  
  <div class="project-card">
    <h3>ระบบจัดการฝึกงาน</h3>
    <p>ระบบจัดการนักศึกษาฝึกงาน สำหรับสถาบันการศึกษา</p>
    <a href="https://internship.dev.smart-solutions.com/" 
       target="_blank" 
       class="btn btn-primary">
      เข้าใช้งานระบบ
    </a>
  </div>
</div>
```

---

## 🔒 **ความปลอดภัย:**

### 🛡️ **SSL Certificate:**
- **Portal:** HTTP (Port 8080)
- **Internship:** HTTPS (Port 443) พร้อม SSL Certificate

### 🛡️ **Firewall Rules:**
```bash
# เปิด Port สำหรับ Portal
ufw allow 8080/tcp

# เปิด Port สำหรับ Internship  
ufw allow 443/tcp
ufw allow 80/tcp
```

---

## 📊 **Port Mapping:**

| Service | Domain | Port | Protocol | วัตถุประสงค์ |
|---------|--------|------|----------|-------------|
| Portal | dev.smart-solutions.com | 8080 | HTTP | เว็บไซต์บริษัท |
| Internship | internship.dev.smart-solutions.com | 443 | HTTPS | ระบบฝึกงาน |
| Internship | internship.dev.smart-solutions.com | 80 | HTTP | Redirect to HTTPS |

---

## 🚀 **ขั้นตอนการ Deploy:**

1. **ตั้งค่า DNS Records** (ตามตารางข้างต้น)
2. **รอ DNS Propagation** (5-30 นาที)
3. **ทดสอบการเชื่อมต่อ**
4. **อัพเดท Portal Website** ให้ลิงก์ไปยัง Internship System
5. **ทดสอบ End-to-End**

---

## 📞 **ข้อมูลเซิร์ฟเวอร์:**
- **IP Address:** 203.170.129.199
- **OS:** Ubuntu 24.04.3 LTS
- **Docker:** ใช้ Docker Compose
- **SSL:** Self-signed Certificate (สามารถอัพเกรดเป็น Let's Encrypt ได้)

**วันที่อัพเดท:** 25 กันยายน 2025