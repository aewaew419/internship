#!/bin/bash

# Script สำหรับ push ไปหลาย repository พร้อมกัน

echo "🚀 Pushing to multiple repositories..."

# Push to origin (GitHub main)
echo "📤 Pushing to origin..."
git push origin main

# Push to backup repository (ถ้ามี)
if git remote | grep -q "backup"; then
    echo "📤 Pushing to backup..."
    git push backup main
fi

# Push to production repository (ถ้ามี)
if git remote | grep -q "production"; then
    echo "📤 Pushing to production..."
    git push production main
fi

echo "✅ All pushes completed!"