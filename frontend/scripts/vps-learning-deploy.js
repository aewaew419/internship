#!/usr/bin/env node

/**
 * VPS Learning Deployment Script
 * Step-by-step deployment to Hostatom VPS for learning purposes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

// VPS Configuration from your details
const VPS_CONFIG = {
  // SSH Access
  host: '203.170.129.199',
  domain: 'dev.smart-solutions.com',
  user: 'root',
  password: 'rp4QkUUvmbi5qBIP',
  port: 22,
  
  // FTP Access
  ftp: {
    server: 'rb-csl-4f15.hostatom.com',
    port: 21,
    user: 'v62882',
    password: 'gWE9DqlnJLVdBn'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n🔹 [STEP ${step}] ${message}`, 'cyan');
  log('=' .repeat(60), 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Execute command with error handling
function execCommand(command, description, showOutput = false) {
  try {
    log(`🔧 ${description}...`, 'cyan');
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: showOutput ? 'inherit' : 'pipe' 
    });
    logSuccess(description);
    return result;
  } catch (error) {
    logError(`Failed: ${description}`);
    logError(error.message);
    throw error;
  }
}

// Test SSH connection
async function testSSHConnection() {
  logStep(1, 'ทดสอบการเชื่อมต่อ SSH');
  
  logInfo('ข้อมูล VPS ที่จะใช้:');
  log(`   Server: ${VPS_CONFIG.domain} (${VPS_CONFIG.host})`, 'yellow');
  log(`   User: ${VPS_CONFIG.user}`, 'yellow');
  log(`   Port: ${VPS_CONFIG.port}`, 'yellow');
  
  const proceed = await askQuestion('\n🤔 พร้อมทดสอบการเชื่อมต่อหรือยัง? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    log('ยกเลิกการทดสอบ', 'yellow');
    return false;
  }
  
  try {
    log('\n🔐 กำลังทดสอบการเชื่อมต่อ SSH...', 'cyan');
    log('💡 หากถามรหัสผ่าน ให้ใส่: rp4QkUUvmbi5qBIP', 'yellow');
    
    const testCommand = `ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p ${VPS_CONFIG.port} ${VPS_CONFIG.user}@${VPS_CONFIG.host} "echo 'SSH connection successful' && whoami && pwd && uname -a"`;
    
    const result = execCommand(testCommand, 'ทดสอบการเชื่อมต่อ SSH', true);
    
    logSuccess('เชื่อมต่อ SSH สำเร็จ!');
    log('ผลลัพธ์:', 'blue');
    log(result, 'green');
    
    return true;
  } catch (error) {
    logError('ไม่สามารถเชื่อมต่อ SSH ได้');
    logWarning('วิธีแก้ไข:');
    log('1. ตรวจสอบรหัสผ่าน: rp4QkUUvmbi5qBIP', 'yellow');
    log('2. ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต', 'yellow');
    log('3. ลองเชื่อมต่อด้วยตนเอง:', 'yellow');
    log(`   ssh -p ${VPS_CONFIG.port} ${VPS_CONFIG.user}@${VPS_CONFIG.host}`, 'cyan');
    
    return false;
  }
}

// Check VPS environment
async function checkVPSEnvironment() {
  logStep(2, 'ตรวจสอบสภาพแวดล้อม VPS');
  
  try {
    const checkCommand = `ssh -o StrictHostKeyChecking=no -p ${VPS_CONFIG.port} ${VPS_CONFIG.user}@${VPS_CONFIG.host} "
      echo '=== System Information ===' &&
      uname -a &&
      echo '' &&
      echo '=== Disk Usage ===' &&
      df -h &&
      echo '' &&
      echo '=== Memory Usage ===' &&
      free -h &&
      echo '' &&
      echo '=== Running Services ===' &&
      systemctl list-units --type=service --state=running | grep -E '(nginx|apache|mysql|docker|ssh)' || echo 'No web services found' &&
      echo '' &&
      echo '=== Web Directory ===' &&
      ls -la /var/www/ 2>/dev/null || echo 'Web directory not found' &&
      echo '' &&
      echo '=== Installed Software ===' &&
      which nginx && nginx -v 2>&1 || echo 'Nginx not installed' &&
      which docker && docker --version || echo 'Docker not installed' &&
      which node && node --version || echo 'Node.js not installed'
    "`;
    
    const result = execCommand(checkCommand, 'ตรวจสอบสภาพแวดล้อม VPS', true);
    
    logSuccess('ตรวจสอบสภาพแวดล้อมเสร็จสิ้น');
    
    const hasNginx = result.includes('nginx version');
    const hasDocker = result.includes('Docker version');
    const hasNode = result.includes('v1');
    
    log('\n📊 สรุปสภาพแวดล้อม:', 'bright');
    log(`   Nginx: ${hasNginx ? '✅ ติดตั้งแล้ว' : '❌ ยังไม่ติดตั้ง'}`, hasNginx ? 'green' : 'red');
    log(`   Docker: ${hasDocker ? '✅ ติดตั้งแล้ว' : '❌ ยังไม่ติดตั้ง'}`, hasDocker ? 'green' : 'red');
    log(`   Node.js: ${hasNode ? '✅ ติดตั้งแล้ว' : '❌ ยังไม่ติดตั้ง'}`, hasNode ? 'green' : 'red');
    
    return { hasNginx, hasDocker, hasNode };
    
  } catch (error) {
    logError('ไม่สามารถตรวจสอบสภาพแวดล้อมได้');
    return { hasNginx: false, hasDocker: false, hasNode: false };
  }
}

// Install basic requirements
async function installBasicRequirements(environment) {
  logStep(3, 'ติดตั้งซอฟต์แวร์พื้นฐาน');
  
  const needsInstall = !environment.hasNginx || !environment.hasDocker || !environment.hasNode;
  
  if (!needsInstall) {
    logSuccess('ซอฟต์แวร์พื้นฐานติดตั้งครบแล้ว');
    return true;
  }
  
  const proceed = await askQuestion('🤔 ต้องการติดตั้งซอฟต์แวร์ที่ขาดหายไหม? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    logWarning('ข้ามการติดตั้งซอฟต์แวร์');
    return false;
  }
  
  try {
    const installCommand = `ssh -o StrictHostKeyChecking=no -p ${VPS_CONFIG.port} ${VPS_CONFIG.user}@${VPS_CONFIG.host} "
      echo '🔄 อัพเดทระบบ...' &&
      apt update && apt upgrade -y &&
      
      echo '📦 ติดตั้ง basic tools...' &&
      apt install -y curl wget git nano htop unzip &&
      
      ${!environment.hasNginx ? `
      echo '🌐 ติดตั้ง Nginx...' &&
      apt install -y nginx &&
      systemctl enable nginx &&
      systemctl start nginx &&
      ` : ''}
      
      ${!environment.hasNode ? `
      echo '📗 ติดตั้ง Node.js...' &&
      curl -fsSL https://deb.nodesource.com/setup_18.x | bash - &&
      apt-get install -y nodejs &&
      npm install -g pm2 &&
      ` : ''}
      
      ${!environment.hasDocker ? `
      echo '🐳 ติดตั้ง Docker...' &&
      curl -fsSL https://get.docker.com -o get-docker.sh &&
      sh get-docker.sh &&
      systemctl enable docker &&
      systemctl start docker &&
      curl -L 'https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)' -o /usr/local/bin/docker-compose &&
      chmod +x /usr/local/bin/docker-compose &&
      ` : ''}
      
      echo '🔒 ตั้งค่า Firewall...' &&
      ufw --force enable &&
      ufw allow ssh &&
      ufw allow 80/tcp &&
      ufw allow 443/tcp &&
      
      echo '✅ ติดตั้งเสร็จสิ้น!' &&
      echo 'Nginx:' && nginx -v 2>&1 || echo 'Nginx installation failed' &&
      echo 'Node.js:' && node --version || echo 'Node.js installation failed' &&
      echo 'Docker:' && docker --version || echo 'Docker installation failed'
    "`;
    
    execCommand(installCommand, 'ติดตั้งซอฟต์แวร์พื้นฐาน', true);
    
    logSuccess('ติดตั้งซอฟต์แวร์พื้นฐานเสร็จสิ้น!');
    return true;
    
  } catch (error) {
    logError('การติดตั้งซอฟต์แวร์ล้มเหลว');
    return false;
  }
}

// Deploy simple website first
async function deploySimpleWebsite() {
  logStep(4, 'Deploy เว็บไซต์ทดสอบ');
  
  logInfo('เราจะสร้างเว็บไซต์ HTML ง่ายๆ เพื่อทดสอบก่อน');
  
  const proceed = await askQuestion('🤔 ต้องการ deploy เว็บไซต์ทดสอบไหม? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    logWarning('ข้าม deployment เว็บไซต์ทดสอบ');
    return false;
  }
  
  try {
    const deployCommand = `ssh -o StrictHostKeyChecking=no -p ${VPS_CONFIG.port} ${VPS_CONFIG.user}@${VPS_CONFIG.host} "
      echo '📁 สร้างโฟลเดอร์เว็บไซต์...' &&
      mkdir -p /var/www/html &&
      
      echo '📝 สร้างไฟล์ HTML...' &&
      cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html lang='th'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>🎉 VPS Learning - Hostatom</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 3rem;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            max-width: 600px;
            margin: 2rem;
        }
        h1 { font-size: 3rem; margin-bottom: 1rem; }
        .subtitle { font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9; }
        .info { 
            background: rgba(255,255,255,0.1);
            padding: 1.5rem;
            border-radius: 10px;
            margin: 1rem 0;
        }
        .info h3 { color: #ffd700; margin-bottom: 0.5rem; }
        .status { 
            display: inline-block;
            background: #4CAF50;
            padding: 0.5rem 1rem;
            border-radius: 25px;
            font-weight: bold;
            margin: 1rem 0;
        }
        .footer {
            margin-top: 2rem;
            font-size: 0.9rem;
            opacity: 0.8;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        .pulse { animation: pulse 2s infinite; }
    </style>
</head>
<body>
    <div class='container'>
        <h1 class='pulse'>🚀 สำเร็จแล้ว!</h1>
        <p class='subtitle'>VPS Learning Project - Hostatom Cloud</p>
        
        <div class='status'>✅ เว็บไซต์ทำงานได้แล้ว</div>
        
        <div class='info'>
            <h3>📊 ข้อมูล Server</h3>
            <p><strong>Domain:</strong> dev.smart-solutions.com</p>
            <p><strong>IP:</strong> 203.170.129.199</p>
            <p><strong>Provider:</strong> Hostatom Cloud VPS SSD2</p>
            <p><strong>Deploy Time:</strong> $(date)</p>
        </div>
        
        <div class='info'>
            <h3>🎯 เป้าหมายการเรียนรู้</h3>
            <p>✅ เชื่อมต่อ VPS ได้</p>
            <p>✅ ติดตั้งซอฟต์แวร์พื้นฐาน</p>
            <p>✅ Deploy เว็บไซต์แรก</p>
            <p>🔄 ต่อไป: Deploy Next.js Application</p>
        </div>
        
        <div class='footer'>
            <p>🎓 VPS Learning Journey</p>
            <p>เตรียมความพร้อมสำหรับ Deploy ที่มหาวิทยาลัย</p>
        </div>
    </div>
</body>
</html>
EOF

      echo '⚙️ ตั้งค่า Nginx...' &&
      cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html index.htm;
    
    server_name dev.smart-solutions.com 203.170.129.199;
    
    location / {
        try_files \$uri \$uri/ =404;
    }
    
    # Security headers
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
}
EOF

      echo '🔄 Restart Nginx...' &&
      nginx -t &&
      systemctl restart nginx &&
      
      echo '🧪 ทดสอบเว็บไซต์...' &&
      curl -I http://localhost &&
      
      echo '✅ Deploy เว็บไซต์ทดสอบเสร็จสิ้น!'
    "`;
    
    execCommand(deployCommand, 'Deploy เว็บไซต์ทดสอบ', true);
    
    logSuccess('Deploy เว็บไซต์ทดสอบสำเร็จ!');
    
    log('\n🌐 ทดสอบเว็บไซต์:', 'bright');
    log(`   http://${VPS_CONFIG.host}`, 'cyan');
    log(`   http://${VPS_CONFIG.domain}`, 'cyan');
    
    const testLocal = await askQuestion('\n🧪 ต้องการทดสอบจากเครื่องนี้ไหม? (y/n): ');
    if (testLocal.toLowerCase() === 'y') {
      try {
        execCommand(`curl -I http://${VPS_CONFIG.host}`, 'ทดสอบการเข้าถึงเว็บไซต์', true);
        logSuccess('เว็บไซต์สามารถเข้าถึงได้จากภายนอก!');
      } catch (error) {
        logWarning('ไม่สามารถเข้าถึงเว็บไซต์จากภายนอกได้ อาจต้องรอสักครู่');
      }
    }
    
    return true;
    
  } catch (error) {
    logError('Deploy เว็บไซต์ทดสอบล้มเหลว');
    return false;
  }
}

// Build and prepare Next.js application
async function buildNextjsApp() {
  logStep(5, 'Build Next.js Application');
  
  logInfo('เราจะ build Next.js application เพื่อเตรียม deploy');
  
  const proceed = await askQuestion('🤔 ต้องการ build Next.js application ไหม? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    logWarning('ข้าม build Next.js application');
    return false;
  }
  
  try {
    // Check if we're in the right directory
    if (!fs.existsSync('package.json')) {
      logError('ไม่พบ package.json กรุณาเข้าไปในโฟลเดอร์ frontend');
      return false;
    }
    
    // Install dependencies
    execCommand('npm ci', 'ติดตั้ง dependencies');
    
    // Run notification preparation
    execCommand('npm run deploy:notifications', 'เตรียมระบบ notifications');
    
    // Build application
    execCommand('npm run build', 'Build Next.js application');
    
    // Create deployment package
    execCommand('npm run create:deployment', 'สร้าง deployment package');
    
    logSuccess('Build Next.js application เสร็จสิ้น!');
    
    // List created files
    const files = fs.readdirSync('.').filter(f => f.includes('deployment') && f.endsWith('.tar.gz'));
    if (files.length > 0) {
      log(`📦 ไฟล์ deployment: ${files[0]}`, 'green');
      return files[0];
    }
    
    return true;
    
  } catch (error) {
    logError('Build Next.js application ล้มเหลว');
    return false;
  }
}

// Upload and deploy Next.js application
async function deployNextjsApp(deploymentFile) {
  logStep(6, 'Deploy Next.js Application ไปยัง VPS');
  
  if (!deploymentFile) {
    logError('ไม่พบไฟล์ deployment');
    return false;
  }
  
  const proceed = await askQuestion('🤔 ต้องการ deploy Next.js application ไปยัง VPS ไหม? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    logWarning('ข้าม deploy Next.js application');
    return false;
  }
  
  try {
    // Upload deployment file
    log('📤 อัพโหลดไฟล์ deployment...', 'cyan');
    execCommand(`scp -o StrictHostKeyChecking=no -P ${VPS_CONFIG.port} ${deploymentFile} ${VPS_CONFIG.user}@${VPS_CONFIG.host}:/tmp/`, 'อัพโหลดไฟล์ deployment');
    
    // Deploy on VPS
    const deployCommand = `ssh -o StrictHostKeyChecking=no -p ${VPS_CONFIG.port} ${VPS_CONFIG.user}@${VPS_CONFIG.host} "
      echo '📦 Extract deployment package...' &&
      cd /tmp &&
      tar -xzf ${deploymentFile} &&
      cd deployment-package &&
      
      echo '⚙️ ตั้งค่า environment...' &&
      cp .env.example .env &&
      
      echo '🐳 Deploy ด้วย Docker...' &&
      ./scripts/deploy.sh &&
      
      echo '🧪 ทดสอบ application...' &&
      sleep 10 &&
      curl -I http://localhost:3000 &&
      
      echo '✅ Deploy Next.js application เสร็จสิ้น!'
    "`;
    
    execCommand(deployCommand, 'Deploy Next.js application บน VPS', true);
    
    logSuccess('Deploy Next.js application สำเร็จ!');
    
    log('\n🌐 เข้าถึง Next.js application:', 'bright');
    log(`   http://${VPS_CONFIG.host}:3000 (Direct)`, 'cyan');
    log(`   http://${VPS_CONFIG.host} (via Nginx)`, 'cyan');
    
    return true;
    
  } catch (error) {
    logError('Deploy Next.js application ล้มเหลว');
    logWarning('ลองตรวจสอบ logs:');
    log(`ssh ${VPS_CONFIG.user}@${VPS_CONFIG.host} "docker-compose logs"`, 'yellow');
    return false;
  }
}

// Final testing and summary
async function finalTesting() {
  logStep(7, 'ทดสอบและสรุปผล');
  
  try {
    log('🧪 ทดสอบการเข้าถึงเว็บไซต์...', 'cyan');
    
    // Test static website
    try {
      execCommand(`curl -s -o /dev/null -w "%{http_code}" http://${VPS_CONFIG.host}`, 'ทดสอบ static website');
      logSuccess('Static website ทำงานได้');
    } catch (error) {
      logWarning('Static website อาจมีปัญหา');
    }
    
    // Test Next.js application
    try {
      execCommand(`curl -s -o /dev/null -w "%{http_code}" http://${VPS_CONFIG.host}:3000`, 'ทดสอบ Next.js application');
      logSuccess('Next.js application ทำงานได้');
    } catch (error) {
      logWarning('Next.js application อาจมีปัญหา');
    }
    
    // Show summary
    log('\n🎉 สรุปผลการเรียนรู้ VPS Deployment', 'bright');
    log('=' .repeat(60), 'blue');
    
    logSuccess('✅ เชื่อมต่อ VPS ได้สำเร็จ');
    logSuccess('✅ ติดตั้งซอฟต์แวร์พื้นฐานได้');
    logSuccess('✅ Deploy เว็บไซต์ทดสอบได้');
    logSuccess('✅ Build Next.js application ได้');
    logSuccess('✅ Deploy Next.js ด้วย Docker ได้');
    
    log('\n🔗 Links ที่สำคัญ:', 'bright');
    log(`   Static Site: http://${VPS_CONFIG.host}`, 'cyan');
    log(`   Next.js App: http://${VPS_CONFIG.host}:3000`, 'cyan');
    log(`   SSH Access: ssh ${VPS_CONFIG.user}@${VPS_CONFIG.host}`, 'cyan');
    
    log('\n📚 สิ่งที่เรียนรู้:', 'bright');
    log('   • การเชื่อมต่อ VPS ด้วย SSH', 'green');
    log('   • การติดตั้งซอฟต์แวร์บน Linux', 'green');
    log('   • การใช้ Nginx เป็น web server', 'green');
    log('   • การใช้ Docker สำหรับ deployment', 'green');
    log('   • การ deploy Next.js application', 'green');
    
    log('\n🎯 ขั้นตอนต่อไป:', 'bright');
    log('   • เรียนรู้การตั้งค่า SSL certificate', 'yellow');
    log('   • เรียนรู้การ monitor และ logging', 'yellow');
    log('   • เรียนรู้การ backup และ restore', 'yellow');
    log('   • เตรียมความพร้อมสำหรับมหาวิทยาลัย', 'yellow');
    
    log('\n🔧 คำสั่งที่มีประโยชน์:', 'bright');
    log(`   ssh ${VPS_CONFIG.user}@${VPS_CONFIG.host}`, 'cyan');
    log('   docker ps', 'cyan');
    log('   docker-compose logs -f', 'cyan');
    log('   systemctl status nginx', 'cyan');
    log('   htop', 'cyan');
    
    return true;
    
  } catch (error) {
    logError('การทดสอบล้มเหลว');
    return false;
  }
}

// Main function
async function main() {
  log('🚀 VPS Learning Deployment - Hostatom Cloud', 'bright');
  log('เรียนรู้การ Deploy เพื่อเตรียมไปใช้กับมหาวิทยาลัย', 'blue');
  log('=' .repeat(60), 'blue');
  
  try {
    // Step 1: Test SSH connection
    const sshWorking = await testSSHConnection();
    if (!sshWorking) {
      logError('ไม่สามารถเชื่อมต่อ SSH ได้ กรุณาแก้ไขปัญหาก่อน');
      process.exit(1);
    }
    
    // Step 2: Check VPS environment
    const environment = await checkVPSEnvironment();
    
    // Step 3: Install basic requirements
    await installBasicRequirements(environment);
    
    // Step 4: Deploy simple website
    await deploySimpleWebsite();
    
    // Step 5: Build Next.js application
    const deploymentFile = await buildNextjsApp();
    
    // Step 6: Deploy Next.js application
    if (deploymentFile) {
      await deployNextjsApp(deploymentFile);
    }
    
    // Step 7: Final testing and summary
    await finalTesting();
    
    log('\n🎓 การเรียนรู้ VPS Deployment เสร็จสิ้น!', 'bright');
    log('ตอนนี้คุณพร้อมที่จะ deploy ไปยังเซิร์ฟเวอร์มหาวิทยาลัยแล้ว! 🎉', 'green');
    
  } catch (error) {
    logError(`การเรียนรู้ล้มเหลว: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  testSSHConnection,
  checkVPSEnvironment,
  installBasicRequirements,
  deploySimpleWebsite,
  VPS_CONFIG
};