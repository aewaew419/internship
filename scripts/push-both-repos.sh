#!/bin/bash

# Script สำหรับ push ไปยัง repository ทั้งสองตัวพร้อมกัน
# aewaew419/internship (สำหรับ deployment ไปยัง VPS hostatom)
# Aew-work/internship (สำหรับ backup/collaboration)

echo "🚀 กำลัง push ไปยัง repository ทั้งสองตัว..."

# Push ไปยัง origin (aewaew419/internship) - สำหรับ deployment
echo "📤 Push ไปยัง aewaew419/internship (origin)..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Push ไปยัง aewaew419/internship สำเร็จ"
else
    echo "❌ Push ไปยัง aewaew419/internship ล้มเหลว"
    exit 1
fi

# Push ไปยัง aew-work (Aew-work/internship) - สำหรับ backup
echo "📤 Push ไปยัง Aew-work/internship (aew-work)..."
git push aew-work main

if [ $? -eq 0 ]; then
    echo "✅ Push ไปยัง Aew-work/internship สำเร็จ"
else
    echo "❌ Push ไปยัง Aew-work/internship ล้มเหลว"
    exit 1
fi

echo "🎉 Push ไปยัง repository ทั้งสองตัวสำเร็จแล้ว!"
echo "📋 Summary:"
echo "   - aewaew419/internship: ✅ (สำหรับ deployment ไปยัง VPS hostatom)"
echo "   - Aew-work/internship: ✅ (สำหรับ backup/collaboration)"