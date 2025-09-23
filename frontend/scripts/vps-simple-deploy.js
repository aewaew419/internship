#!/usr/bin/env node

/**
 * Simple VPS Deploy with Password Authentication
 * No SSH keys, no FTP - just simple password-based deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');

// VPS Configuration
const VPS_CONFIG = {
  host: '203.170.129.199',
  domain: 'dev.smart-solutions.com',
  user: 'root',
  password: 'rp4QkUUvmbi5qBIP',
  port: 22
};

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

function logStep(step, message) {
  log(`[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

// Create simple deployment script
function createSimpleDeployScript() {
  logStep('SCRIPT', 'Creating simple deployment script...');
  
  const deployScript = `#!/bin/bash

# Simple VPS Setup and Deploy Script
# This script will be run manually on the VPS

echo "🚀 Starting VPS Setup and Deployment..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essential tools
echo "🔧 Installing essential tools..."
apt install -y curl wget git nano htop unzip zip

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Install Nginx
echo "🌐 Installing Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx

# Install Docker (optional)
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# Create directories
echo "📁 Creating directories..."
mkdir -p /var/www/html
mkdir -p /var/log/internship
mkdir -p /var/backups/internship
mkdir -p /opt/internship

# Setup firewall
echo "🔒 Setting up firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

# Clone repository
echo "📥 Cloning repository..."
cd /opt
git clone https://github.com/Aew-Work/internship.git
cd internship/frontend

# Install dependencies and build
echo "🔨 Building application..."
npm install
npm run build

# Copy files to web directory
echo "📋 Copying files..."
cp -r .next/standalone/* /var/www/html/
cp -r .next/static /var/www/html/.next/
cp -r public /var/www/html/

# Create environment file
echo "⚙️ Creating environment file..."
cat > /var/www/html/.env.local << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_NAME="Internship Management System"
NEXT_PUBLIC_API_BASE_URL=https://dev.smart-solutions.com/api
NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=false
NEXT_PUBLIC_ENABLE_OFFLINE_NOTIFICATIONS=true
PORT=3000
EOF

# Create PM2 ecosystem
echo "🔄 Setting up PM2..."
cat > /var/www/html/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'internship-frontend',
    script: 'server.js',
    cwd: '/var/www/html',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: '/var/log/internship/combined.log',
    out_file: '/var/log/internship/out.log',
    error_file: '/var/log/internship/error.log'
  }]
};
EOF

# Start application
cd /var/www/html
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/internship << 'EOF'
server {
    listen 80;
    server_name dev.smart-solutions.com www.dev.smart-solutions.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
        proxy_cache_bypass \\$http_upgrade;
    }
    
    location /_next/static/ {
        root /var/www/html;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    location /public/ {
        root /var/www/html;
        add_header Cache-Control "public, max-age=86400";
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/internship /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Install SSL certificate
echo "🔒 Installing SSL certificate..."
apt install -y certbot python3-certbot-nginx
certbot --nginx -d dev.smart-solutions.com -d www.dev.smart-solutions.com --non-interactive --agree-tos --email admin@dev.smart-solutions.com || echo "SSL setup failed, but continuing..."

echo ""
echo "✅ VPS Setup and Deployment Completed!"
echo ""
echo "🌐 Your site should be available at:"
echo "   http://dev.smart-solutions.com"
echo "   https://dev.smart-solutions.com (if SSL worked)"
echo ""
echo "🔧 Useful commands:"
echo "   pm2 status"
echo "   pm2 logs internship-frontend"
echo "   systemctl status nginx"
echo "   nginx -t"
echo ""
echo "📋 Next steps:"
echo "1. Test the website"
echo "2. Deploy backend when ready"
echo "3. Update notification settings"
`;
  
  fs.writeFileSync('/tmp/vps-simple-deploy.sh', deployScript);
  logSuccess('Simple deployment script created');
}

// Create manual instructions
function createManualInstructions() {
  logStep('DOCS', 'Creating manual instructions...');
  
  const instructions = `# Simple VPS Deployment Instructions

## วิธีการ Deploy แบบง่ายๆ (ไม่ต้องใช้ SSH Key)

### ขั้นตอนที่ 1: เชื่อมต่อ VPS
\`\`\`bash
ssh -p 22 root@203.170.129.199
# ใส่รหัสผ่าน: rp4QkUUvmbi5qBIP
\`\`\`

### ขั้นตอนที่ 2: Download และรัน Script
\`\`\`bash
# Download script
curl -o deploy.sh https://raw.githubusercontent.com/Aew-Work/internship/main/frontend/scripts/vps-simple-deploy.sh

# หรือสร้างไฟล์เอง
nano deploy.sh
# Copy script content จาก /tmp/vps-simple-deploy.sh

# Make executable
chmod +x deploy.sh

# Run script
./deploy.sh
\`\`\`

### ขั้นตอนที่ 3: ตรวจสอบผลลัพธ์
- เว็บไซต์: http://dev.smart-solutions.com
- HTTPS: https://dev.smart-solutions.com
- Status: \`pm2 status\`

## หากไม่สามารถ SSH ได้

### วิธีที่ 1: ใช้ Web Terminal
1. เข้า Hostatom control panel
2. หา VPS console/terminal
3. Copy script content และ paste ใน terminal

### วิธีที่ 2: ใช้ FTP + Manual
1. Upload script ผ่าน FTP
2. เข้า web terminal รัน script

### วิธีที่ 3: Manual Setup
ทำทีละขั้นตอนตาม script:
1. \`apt update && apt upgrade -y\`
2. \`curl -fsSL https://deb.nodesource.com/setup_18.x | bash -\`
3. \`apt-get install -y nodejs\`
4. ... (ตาม script)

## การแก้ไขปัญหา

### ถ้า SSH ไม่ได้
- ลองใช้ Terminal ใน browser
- ตรวจสอบ firewall
- ติดต่อ Hostatom support

### ถ้า website ไม่ขึ้น
\`\`\`bash
pm2 status
pm2 logs internship-frontend
systemctl status nginx
nginx -t
\`\`\`

### ถ้า SSL ไม่ได้
\`\`\`bash
certbot --nginx -d dev.smart-solutions.com
\`\`\`

---

**หมายเหตุ:** วิธีนี้ใช้รหัสผ่าน SSH โดยตรง ไม่ต้องตั้งค่า SSH key ซับซ้อน
`;
  
  fs.writeFileSync('SIMPLE_VPS_DEPLOY.md', instructions);
  logSuccess('Manual instructions created');
}

// Main function
async function main() {
  log('🚀 Simple VPS Deployment Setup', 'bright');
  log('No SSH keys, No FTP complications!', 'blue');
  log('=' .repeat(50), 'blue');
  
  try {
    // Create deployment script
    createSimpleDeployScript();
    
    // Create manual instructions
    createManualInstructions();
    
    log('', 'reset');
    log('✅ Simple deployment setup completed!', 'green');
    log('', 'reset');
    log('📋 What to do next:', 'bright');
    log('', 'reset');
    log('🔧 Option 1: SSH directly (easiest)', 'yellow');
    log('1. Open Terminal/Command Prompt', 'reset');
    log('2. Run: ssh -p 22 root@203.170.129.199', 'cyan');
    log('3. Enter password: rp4QkUUvmbi5qBIP', 'cyan');
    log('4. Copy and paste the script content from /tmp/vps-simple-deploy.sh', 'cyan');
    log('', 'reset');
    log('🔧 Option 2: Use web terminal', 'yellow');
    log('1. Go to Hostatom control panel', 'reset');
    log('2. Find VPS console/terminal', 'reset');
    log('3. Copy script content and run', 'reset');
    log('', 'reset');
    log('📄 Script location: /tmp/vps-simple-deploy.sh', 'cyan');
    log('📚 Instructions: SIMPLE_VPS_DEPLOY.md', 'cyan');
    log('', 'reset');
    log('🌐 After deployment, visit: http://dev.smart-solutions.com', 'green');
    
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  createSimpleDeployScript,
  createManualInstructions,
  VPS_CONFIG
};