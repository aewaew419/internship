# การตั้งค่า Domain สำหรับ Production

## ขั้นตอนการตั้งค่า DNS

1. **เข้าไปที่ DNS Management ของ smart-solutions.com**
2. **เพิ่ม A Record:**
   ```
   Name: internship
   Type: A
   Value: 203.170.129.199
   TTL: 300 (5 minutes)
   ```

3. **หรือเพิ่ม CNAME Record (ถ้าต้องการ):**
   ```
   Name: internship
   Type: CNAME
   Value: 203.170.129.199
   TTL: 300
   ```

## การทดสอบ DNS

```bash
# ทดสอบ DNS resolution
nslookup internship.smart-solutions.com

# ทดสอบการเชื่อมต่อ
ping internship.smart-solutions.com

# ทดสอบ HTTPS
curl -k https://internship.smart-solutions.com/api/v1/test
```

## ข้อมูล Login สำหรับ Production

### Admin User:
- **Email:** admin@smart-solutions.com
- **Password:** secret123
- **Role:** admin

### Test User:
- **Email:** test@test.com  
- **Password:** 123456
- **Role:** student

## URLs ที่ใช้งานได้:

- **หน้าเว็บ:** https://internship.smart-solutions.com/
- **API:** https://internship.smart-solutions.com/api/v1/
- **Login API:** https://internship.smart-solutions.com/api/v1/login

## การ Deploy ใหม่:

```bash
ssh root@203.170.129.199 "cd /opt/internship-system && git pull origin main && docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production restart"
```