#!/bin/bash

# Add only the nextjs-frontend changes (excluding .kiro folder which is already in .gitignore)
git add nextjs-frontend/

# Commit with Thai message
git commit -m "เสร็จสิ้นการพัฒนาคอมโพเนนต์แสดงผลข้อมูลและกราหแบบ Responsive

- เพิ่ม DonutChart พร้อมการปรับขนาดตามหน้าจอ
- เพิ่ม ResponsiveChart container ที่ปรับตัวตามขนาดหน้าจอ  
- เพิ่ม StatisticsCard และ StatisticsGrid สำหรับแสดงสถิติ
- เพิ่ม ResponsiveDataTable พร้อม fallback เป็น card บนมือถือ
- เพิ่ม ResponsiveDataFilter สำหรับกรองและค้นหาข้อมูล
- รองรับ Touch interactions สำหรับกราฟ
- รองรับ Responsive breakpoints สำหรับทุกขนาดหน้าจอ
- รองรับภาษาไทยครบถ้วน"

# Push to remote
git push origin main

echo "Git commit และ push เสร็จสิ้น!"