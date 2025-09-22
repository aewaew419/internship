#!/bin/bash
cd frontend

# Add all files except .kiro folder
git add .
git reset HEAD .kiro/ 2>/dev/null || true

# Commit with Thai message
git commit -m "เพิ่มระบบ Layout แบบ Responsive สำหรับ Mobile

- อัปเดต root layout ด้วย AuthProvider และ global providers
- เพิ่มการตั้งค่า viewport และ font optimization สำหรับ mobile
- สร้าง Error Boundary และ Loading states
- พัฒนา DesktopNavbar และ MobileNavbar components
- เพิ่ม responsive sidebar ที่ collapse บน mobile
- สร้างระบบ breadcrumb แบบ responsive
- เพิ่ม touch-friendly navigation และ proper touch targets
- รองรับการนำทางตาม role ของผู้ใช้งาน
- เพิ่ม mobile-first CSS utilities และ accessibility improvements"

# Push to remote
git push

echo "Commit and push completed successfully!"