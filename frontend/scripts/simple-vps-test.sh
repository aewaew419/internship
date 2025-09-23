#!/bin/bash

# Simple VPS Connection Test
# ทดสอบการเชื่อมต่อ VPS แบบง่ายๆ

VPS_HOST="203.170.129.199"
VPS_USER="root"
VPS_PASS="gWE9DqlnJLVdBn"
VPS_PORT="22"

echo "🚀 ทดสอบการเชื่อมต่อ VPS - Hostatom Cloud"
echo "=========================================="
echo "Server: dev.smart-solutions.com ($VPS_HOST)"
echo "User: $VPS_USER"
echo "Port: $VPS_PORT"
echo ""

# ตรวจสอบว่ามี sshpass หรือไม่
if ! command -v sshpass &> /dev/null; then
    echo "📦 ติดตั้ง sshpass..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install sshpass
        else
            echo "❌ กรุณาติดตั้ง Homebrew ก่อน หรือติดตั้ง sshpass ด้วยตนเอง"
            echo "   brew install sshpass"
            exit 1
        fi
    else
        # Linux
        sudo apt-get update && sudo apt-get install -y sshpass
    fi
fi

echo "🔐 ทดสอบการเชื่อมต่อ SSH..."
echo "รหัสผ่าน: $VPS_PASS"
echo ""

# ทดสอบการเชื่อมต่อ
if sshpass -p "$VPS_PASS" ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p $VPS_PORT $VPS_USER@$VPS_HOST "echo 'SSH connection successful'" 2>/dev/null; then
    echo "✅ เชื่อมต่อ SSH สำเร็จ!"
    echo ""
    
    echo "📊 ข้อมูลระบบ VPS:"
    sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no -p $VPS_PORT $VPS_USER@$VPS_HOST "
        echo '=== System Info ==='
        whoami
        pwd
        uname -a
        echo ''
        echo '=== Disk Usage ==='
        df -h
        echo ''
        echo '=== Memory ==='
        free -h
        echo ''
        echo '=== Running Services ==='
        systemctl list-units --type=service --state=running | grep -E '(nginx|apache|docker|ssh)' || echo 'No web services running'
    "
    
    echo ""
    echo "🎉 VPS พร้อมใช้งาน!"
    echo ""
    echo "🔧 คำสั่งที่มีประโยชน์:"
    echo "   เชื่อมต่อ SSH: sshpass -p '$VPS_PASS' ssh -p $VPS_PORT $VPS_USER@$VPS_HOST"
    echo "   หรือ: ssh $VPS_USER@$VPS_HOST (แล้วใส่รหัสผ่านตอนถาม)"
    echo ""
    echo "📚 ขั้นตอนต่อไป:"
    echo "   1. ติดตั้งซอฟต์แวร์พื้นฐาน (Nginx, Docker, Node.js)"
    echo "   2. Deploy เว็บไซต์ทดสอบ"
    echo "   3. Deploy Next.js application"
    
else
    echo "❌ ไม่สามารถเชื่อมต่อ SSH ได้"
    echo ""
    echo "💡 วิธีแก้ไข:"
    echo "1. ตรวจสอบรหัสผ่าน: $VPS_PASS"
    echo "2. ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต"
    echo "3. ลองเชื่อมต่อด้วยตนเอง:"
    echo "   ssh -p $VPS_PORT $VPS_USER@$VPS_HOST"
    echo "   แล้วใส่รหัสผ่าน: $VPS_PASS"
    echo ""
    echo "🔍 หากยังไม่ได้ ให้ตรวจสอบ:"
    echo "   - VPS อาจจะยังไม่พร้อมใช้งาน"
    echo "   - รหัสผ่านอาจจะเปลี่ยน"
    echo "   - Firewall อาจจะบล็อก"
    
    exit 1
fi