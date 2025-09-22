#!/bin/bash

echo "🔧 ตั้งค่า Git remote สำหรับ push ไปทั้งสองที่..."

# ตั้งค่า origin ให้ push ไปทั้งสองที่
git remote set-url --add --push origin https://github.com/Aew-Work/internship.git
git remote set-url --add --push origin https://github.com/aewaew419/internship.git

echo "✅ ตั้งค่าเสร็จแล้ว!"
echo "ตอนนี้ 'git push origin main' จะ push ไปทั้งสองที่พร้อมกัน"

# แสดงการตั้งค่าปัจจุบัน
echo ""
echo "📋 การตั้งค่า remote ปัจจุบัน:"
git remote -v