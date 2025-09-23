#!/bin/bash

# Manual SSH Test - ให้ผู้ใช้ทดสอบเชื่อมต่อเอง

echo "🔐 ทดสอบการเชื่อมต่อ SSH แบบ Manual"
echo "====================================="
echo ""
echo "📋 ข้อมูลการเชื่อมต่อ:"
echo "   Server: dev.smart-solutions.com"
echo "   IP: 203.170.129.199"
echo "   User: root"
echo "   Port: 22"
echo ""
echo "🔑 รหัสผ่านที่ลอง:"
echo "   1. rp4QkUUvmbi5qBIP (SSH Password จากข้อมูล)"
echo "   2. gWE9DqlnJLVdBn (FTP Password)"
echo ""
echo "💡 วิธีทดสอบ:"
echo "1. เปิด Terminal ใหม่"
echo "2. รันคำสั่ง: ssh root@203.170.129.199"
echo "3. ใส่รหัสผ่านตอนที่ถาม (พิมพ์ทีละตัว)"
echo "4. หากเข้าได้ จะเห็น prompt: root@server:~#"
echo ""
echo "🔧 คำสั่งที่ลอง:"
echo ""

# แสดงคำสั่งให้ copy
echo "# คำสั่งที่ 1: SSH ปกติ"
echo "ssh root@203.170.129.199"
echo ""

echo "# คำสั่งที่ 2: SSH แบบระบุ port"
echo "ssh -p 22 root@203.170.129.199"
echo ""

echo "# คำสั่งที่ 3: SSH แบบ verbose (ดู error detail)"
echo "ssh -v root@203.170.129.199"
echo ""

echo "# คำสั่งที่ 4: ทดสอบการเข้าถึง port"
echo "telnet 203.170.129.199 22"
echo ""

echo "# คำสั่งที่ 5: ทดสอบ ping"
echo "ping -c 4 203.170.129.199"
echo ""

echo "🔍 การแก้ไขปัญหา:"
echo ""
echo "หากไม่สามารถเชื่อมต่อได้:"
echo "1. ตรวจสอบว่า VPS เปิดใช้งานแล้วหรือยัง"
echo "2. ตรวจสอบ Firewall ของ VPS"
echo "3. ลองใช้ FTP เข้าถึงก่อน"
echo "4. ติดต่อ Hostatom support"
echo ""

echo "📞 ข้อมูล Support Hostatom:"
echo "   Website: https://www.hostatom.com"
echo "   Support: ดูใน control panel หรือ email"
echo ""

echo "🌐 ลองเข้า Control Panel:"
echo "   https://www.hostatom.com/login"
echo "   หา VPS: dev.smart-solutions.com"
echo "   ดูสถานะและ console access"
echo ""

# ทดสอบ ping ก่อน
echo "🧪 ทดสอบการเข้าถึง server..."
if ping -c 2 203.170.129.199 > /dev/null 2>&1; then
    echo "✅ Server ตอบสนอง (ping ได้)"
else
    echo "❌ Server ไม่ตอบสนอง (ping ไม่ได้)"
    echo "   อาจจะ:"
    echo "   - VPS ยังไม่เปิดใช้งาน"
    echo "   - Network มีปัญหา"
    echo "   - Firewall บล็อก ICMP"
fi

echo ""

# ทดสอบ port 22
echo "🔌 ทดสอบ SSH port (22)..."
if timeout 5 bash -c "</dev/tcp/203.170.129.199/22" 2>/dev/null; then
    echo "✅ SSH port 22 เปิดอยู่"
    echo "   ปัญหาน่าจะอยู่ที่รหัสผ่าน"
else
    echo "❌ SSH port 22 ไม่เปิดหรือไม่สามารถเข้าถึงได้"
    echo "   ปัญหาอาจจะ:"
    echo "   - VPS ยังไม่เปิดใช้งาน"
    echo "   - SSH service ไม่ทำงาน"
    echo "   - Firewall บล็อก port 22"
fi

echo ""
echo "📋 สรุป:"
echo "1. ลองคำสั่งข้างบนใน Terminal ใหม่"
echo "2. หากยังไม่ได้ ให้เข้า Hostatom Control Panel"
echo "3. ตรวจสอบสถานะ VPS และรหัสผ่าน"
echo "4. ลองใช้ Web Console (ถ้ามี)"