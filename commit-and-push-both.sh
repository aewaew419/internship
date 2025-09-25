#!/bin/bash

# Script สำหรับ commit และ push ไปยัง repository ทั้งสองตัวพร้อมกัน

if [ -z "$1" ]; then
    echo "❌ กรุณาระบุ commit message"
    echo "Usage: ./commit-and-push-both.sh \"commit message\""
    exit 1
fi

COMMIT_MESSAGE="$1"

echo "🔄 กำลัง commit และ push..."
echo "📝 Commit message: $COMMIT_MESSAGE"

# Add และ commit
git add .
git commit -m "$COMMIT_MESSAGE"

if [ $? -eq 0 ]; then
    echo "✅ Commit สำเร็จ"
    
    # Push ไปยัง repository ทั้งสองตัว
    ./push-both-repos.sh
else
    echo "❌ Commit ล้มเหลว หรือไม่มีการเปลี่ยนแปลง"
fi