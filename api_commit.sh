#!/bin/bash
git add frontend/
git commit -m "เพิ่มระบบ API และการดึงข้อมูลที่ปรับปรุงสำหรับ Next.js

✨ Features ที่เพิ่ม:
- API service layer ที่ย้ายมาใช้รูปแบบของ Next.js
- Axios configuration ที่ปรับปรุงสำหรับ client components
- Error handling ที่เหมาะสมกับสภาพเครือข่ายมือถือ
- รักษา API endpoints และ error handling logic เดิมไว้
- Next.js data fetching patterns
- Server components สำหรับข้อมูลแบบ static
- Client-side data fetching สำหรับ interactive components
- Loading states ที่เหมาะสมกับผู้ใช้มือถือ

🎯 Mobile-First Features:
- Custom hooks สำหรับการจัดการ API calls
- Retry mechanisms สำหรับเครือข่ายที่ไม่เสถียร
- Mobile-optimized loading components
- Enhanced error handling สำหรับ mobile users
- Network timeout และ retry logic"

git push origin main