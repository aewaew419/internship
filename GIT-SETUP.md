# การตั้งค่า Git สำหรับ Push ไปหลาย Repository

## 🎯 วัตถุประสงค์
ตั้งค่าให้ `git push origin main` push ไปทั้งสอง repository พร้อมกัน:
- https://github.com/Aew-Work/internship.git
- https://github.com/aewaew419/internship.git

## 🚀 วิธีตั้งค่า (ทำครั้งเดียวในแต่ละเครื่อง)

### วิธีที่ 1: ใช้ Script อัตโนมัติ
```bash
chmod +x setup-dual-push.sh
./setup-dual-push.sh
```

### วิธีที่ 2: ตั้งค่าด้วยตนเอง
```bash
git remote set-url --add --push origin https://github.com/Aew-Work/internship.git
git remote set-url --add --push origin https://github.com/aewaew419/internship.git
```

## ✅ การใช้งานหลังตั้งค่า
```bash
# เพิ่มไฟล์
git add .

# Commit
git commit -m "ข้อความ commit"

# Push ไปทั้งสองที่พร้อมกัน
git push origin main
```

## 🔍 ตรวจสอบการตั้งค่า
```bash
git remote -v
```

ควรเห็น:
```
origin  https://github.com/Aew-Work/internship.git (fetch)
origin  https://github.com/Aew-Work/internship.git (push)
origin  https://github.com/aewaew419/internship.git (push)
```

## ⚠️ หมายเหตุ
- การตั้งค่านี้ต้องทำในแต่ละเครื่อง
- ไฟล์ในโฟลเดอร์ `.kiro/` จะไม่ถูก push ขึ้น Git