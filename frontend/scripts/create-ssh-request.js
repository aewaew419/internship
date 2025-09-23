#!/usr/bin/env node

/**
 * Create SSH Setup Request for Hostatom Support
 * สร้างคำขอติดตั้ง SSH Key สำหรับส่งให้ทีม Hostatom
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Read SSH public key
function getSSHPublicKey() {
  const publicKeyPath = `${process.env.HOME}/.ssh/id_rsa.pub`;
  
  if (!fs.existsSync(publicKeyPath)) {
    logWarning('ไม่พบ SSH public key');
    log('กรุณารัน: ssh-keygen -t rsa -b 4096', 'yellow');
    return null;
  }
  
  return fs.readFileSync(publicKeyPath, 'utf8').trim();
}

// Create email template
function createEmailTemplate(publicKey) {
  const template = `Subject: คำขอติดตั้ง SSH Key สำหรับ VPS - dev.smart-solutions.com

เรียน ทีมสนับสนุน Hostatom

สวัสดีครับ ขอความกรุณาช่วยติดตั้ง SSH Public Key ให้กับ VPS ของเรา

📋 ข้อมูล VPS:
- Server Name: dev.smart-solutions.com
- IP Address: 203.170.129.199
- User: root
- Service: Hostatom Cloud VPS SSD2

🔑 SSH Public Key ที่ต้องการติดตั้ง:
${publicKey}

🛠️ ขั้นตอนการติดตั้ง:
1. SSH เข้า VPS: ssh root@203.170.129.199
2. สร้างโฟลเดอร์: mkdir -p ~/.ssh
3. เพิ่ม public key: echo '${publicKey}' >> ~/.ssh/authorized_keys
4. ตั้งค่าสิทธิ์: chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys

🎯 วัตถุประสงค์:
- เพื่อใช้ในการเรียนรู้การ deploy application
- เตรียมความพร้อมสำหรับโปรเจ็กต์มหาวิทยาลัย
- ปรับปรุงความปลอดภัยในการเข้าถึง VPS

ขอบคุณสำหรับความช่วยเหลือครับ

---
หากมีปัญหาหรือต้องการข้อมูลเพิ่มเติม กรุณาติดต่อกลับมาได้เลยครับ`;

  return template;
}

// Create support ticket template
function createSupportTicket(publicKey) {
  const ticket = `=== HOSTATOM SUPPORT TICKET ===

Title: SSH Key Installation Request - VPS dev.smart-solutions.com

Priority: Normal
Category: VPS Management
Service: Cloud VPS SSD2

Description:
Hello Hostatom Support Team,

I would like to request SSH public key installation for my VPS to enable passwordless authentication.

VPS Details:
- Server: dev.smart-solutions.com
- IP: 203.170.129.199
- User: root
- Current Password: rp4QkUUvmbi5qBIP

SSH Public Key:
${publicKey}

Installation Commands:
mkdir -p ~/.ssh
echo '${publicKey}' >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

Purpose:
- Learning deployment processes
- University project preparation
- Enhanced security for VPS access

Please let me know once this is completed.

Thank you for your assistance.

Best regards,
VPS Customer`;

  return ticket;
}

// Create LINE message template
function createLINEMessage(publicKey) {
  const shortKey = publicKey.substring(0, 50) + '...';
  
  const message = `🔑 SSH Key Setup Request

Server: dev.smart-solutions.com
IP: 203.170.129.199

ขอความช่วยเหลือติดตั้ง SSH Key ครับ

Key: ${shortKey}

คำสั่งติดตั้ง:
mkdir -p ~/.ssh
echo '[FULL_KEY]' >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys

ขอบคุณครับ 🙏`;

  return message;
}

// Main function
function main() {
  log('🔑 สร้างคำขอติดตั้ง SSH Key สำหรับ Hostatom', 'bright');
  log('=' .repeat(50), 'blue');
  
  // Get SSH public key
  const publicKey = getSSHPublicKey();
  if (!publicKey) {
    process.exit(1);
  }
  
  logSuccess('พบ SSH public key');
  logInfo(`Key: ${publicKey.substring(0, 50)}...`);
  
  // Create templates
  const emailTemplate = createEmailTemplate(publicKey);
  const supportTicket = createSupportTicket(publicKey);
  const lineMessage = createLINEMessage(publicKey);
  
  // Save templates to files
  fs.writeFileSync('hostatom-email-request.txt', emailTemplate);
  fs.writeFileSync('hostatom-support-ticket.txt', supportTicket);
  fs.writeFileSync('hostatom-line-message.txt', lineMessage);
  
  logSuccess('สร้างไฟล์คำขอเสร็จสิ้น');
  
  log('\n📧 ไฟล์ที่สร้าง:', 'bright');
  log('   hostatom-email-request.txt - สำหรับส่ง email', 'cyan');
  log('   hostatom-support-ticket.txt - สำหรับ support ticket', 'cyan');
  log('   hostatom-line-message.txt - สำหรับ LINE message', 'cyan');
  
  log('\n📞 วิธีการติดต่อ Hostatom:', 'bright');
  log('   1. Email: support@hostatom.com', 'yellow');
  log('   2. LINE: @hostatom', 'yellow');
  log('   3. Website: https://www.hostatom.com/support', 'yellow');
  log('   4. โทร: 02-xxx-xxxx (ตรวจสอบจากเว็บไซต์)', 'yellow');
  
  log('\n💡 คำแนะนำ:', 'bright');
  log('   • แนบไฟล์ hostatom-support-ticket.txt ไปกับ ticket', 'green');
  log('   • ระบุข้อมูล VPS ให้ชัดเจน', 'green');
  log('   • เก็บ SSH private key ไว้ให้ปลอดภัย', 'green');
  
  log('\n🧪 หลังจากติดตั้งแล้ว ทดสอบด้วย:', 'bright');
  log('   ssh root@203.170.129.199', 'cyan');
  log('   (ควรเข้าได้โดยไม่ต้องใส่รหัสผ่าน)', 'green');
  
  log('\n✨ พร้อมส่งคำขอแล้ว!', 'green');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  getSSHPublicKey,
  createEmailTemplate,
  createSupportTicket
};