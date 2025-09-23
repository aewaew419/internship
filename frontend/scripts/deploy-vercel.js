#!/usr/bin/env node

/**
 * Deploy to Vercel - The Easiest Way
 */

const { execSync } = require('child_process');
const fs = require('fs');

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

// Create Vercel configuration
function createVercelConfig() {
  logStep('CONFIG', 'Creating Vercel configuration...');
  
  const vercelConfig = {
    "name": "internship-management-system",
    "version": 2,
    "builds": [
      {
        "src": "package.json",
        "use": "@vercel/next"
      }
    ],
    "env": {
      "NEXT_PUBLIC_APP_NAME": "Internship Management System",
      "NEXT_PUBLIC_APP_ENV": "production",
      "NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS": "false",
      "NEXT_PUBLIC_ENABLE_OFFLINE_NOTIFICATIONS": "true",
      "NEXT_PUBLIC_ENABLE_PWA": "true"
    },
    "regions": ["sin1"],
    "functions": {
      "app/api/**/*.js": {
        "maxDuration": 30
      }
    }
  };
  
  fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
  logSuccess('Vercel configuration created');
}

// Create deployment instructions
function createDeployInstructions() {
  logStep('DOCS', 'Creating deployment instructions...');
  
  const instructions = `# Deploy to Vercel - Easy Way! 🚀

## ขั้นตอนการ Deploy:

### 1. Install Vercel CLI
\`\`\`bash
npm install -g vercel
\`\`\`

### 2. Login to Vercel
\`\`\`bash
vercel login
# เลือก GitHub account
\`\`\`

### 3. Deploy
\`\`\`bash
# Deploy ครั้งแรก
vercel

# หรือ deploy production เลย
vercel --prod
\`\`\`

### 4. Setup Auto Deploy
1. ไปที่ https://vercel.com/dashboard
2. เชื่อม GitHub repository
3. ทุกครั้งที่ push จะ auto deploy

## ข้อดีของ Vercel:
- ✅ Deploy ง่ายมาก (1 คำสั่ง)
- ✅ Auto deploy จาก GitHub
- ✅ SSL certificate อัตโนมัติ
- ✅ CDN global
- ✅ ฟรี!

## หลังจาก Deploy:
- เว็บไซต์จะได้ URL แบบ: https://internship-xxx.vercel.app
- สามารถตั้ง custom domain ได้

## สำหรับ Backend:
- Vercel เหมาะกับ frontend
- Backend แนะนำใช้ Railway หรือ Render
- หรือใช้ VPS ที่มีอยู่

---
**หมายเหตุ:** วิธีนี้ง่ายที่สุดสำหรับ frontend deployment!
`;
  
  fs.writeFileSync('VERCEL_DEPLOY.md', instructions);
  logSuccess('Deployment instructions created');
}

// Main function
async function main() {
  log('🚀 Vercel Deployment Setup', 'bright');
  log('The easiest way to deploy!', 'blue');
  log('=' .repeat(40), 'blue');
  
  try {
    // Create Vercel config
    createVercelConfig();
    
    // Create instructions
    createDeployInstructions();
    
    log('', 'reset');
    log('✅ Vercel deployment setup completed!', 'green');
    log('', 'reset');
    log('🚀 Ready to deploy:', 'bright');
    log('', 'reset');
    log('1. Install Vercel CLI:', 'yellow');
    log('   npm install -g vercel', 'cyan');
    log('', 'reset');
    log('2. Deploy:', 'yellow');
    log('   vercel --prod', 'cyan');
    log('', 'reset');
    log('📚 Full instructions: VERCEL_DEPLOY.md', 'blue');
    log('', 'reset');
    log('💡 Why Vercel?', 'bright');
    log('✓ Deploy ใน 1 คำสั่ง', 'green');
    log('✓ Auto deploy จาก GitHub', 'green');
    log('✓ SSL + CDN ฟรี', 'green');
    log('✓ ไม่ต้องจัดการ server', 'green');
    
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
  createVercelConfig,
  createDeployInstructions
};