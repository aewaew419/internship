#!/bin/bash

echo "กำลัง commit การเปลี่ยนแปลง..."

# เพิ่มไฟล์ nextjs-frontend เท่านั้น (ไม่รวม .kiro)
git add nextjs-frontend/

# Commit ด้วยข้อความภาษาไทย
git commit -m "พัฒนาฟีเจอร์มือถือสำหรับระบบจัดการฝึกงาน

✨ ฟีเจอร์ใหม่:
• ระบบนำทางมือถือพร้อม swipe gestures
• การอัปโหลดไฟล์รองรับกล้องมือถือ
• ระบบจัดการรูปภาพแบบ responsive
• Pull-to-refresh functionality
• UI ที่เหมาะสำหรับการสัมผัส

🎯 การปรับปรุง:
• Touch targets ขนาดไม่น้อยกว่า 44px
• การบีบอัดรูปภาพสำหรับเครือข่ายมือถือ
• Lazy loading และ image optimization
• Gesture navigation และ animations
• Performance optimization สำหรับมือถือ"

# Push ไปยัง main branch
git push origin main

echo "✅ Commit และ Push เสร็จสิ้น!"