#!/usr/bin/env node

/**
 * Auto Deploy Setup Script
 * Sets up GitHub webhook and VPS auto-deployment system
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  vps: {
    host: '203.170.129.199',
    domain: 'dev.smart-solutions.com',
    user: 'root',
    port: 22,
    deployPath: '/var/www/html',
    repoPath: '/var/repos/internship'
  },
  github: {
    repo: 'Aew-Work/internship',
    branch: 'main'
  },
  webhook: {
    port: 3001,
    secret: 'internship-deploy-webhook-secret-2024'
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

// Create webhook server script
function createWebhookServer() {
  logStep('WEBHOOK', 'Creating webhook server...');
  
  const webhookServer = `#!/usr/bin/env node

/**
 * GitHub Webhook Server for Auto Deployment
 * Listens for GitHub push events and triggers deployment
 */

const express = require('express');
const crypto = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = ${CONFIG.webhook.port};
const SECRET = '${CONFIG.webhook.secret}';
const REPO_PATH = '${CONFIG.vps.repoPath}';
const DEPLOY_PATH = '${CONFIG.vps.deployPath}';

// Middleware
app.use(express.json());

// Logging function
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = \`[\${timestamp}] [\${level}] \${message}\`;
  console.log(logMessage);
  
  // Write to log file
  fs.appendFileSync('/var/log/internship/webhook.log', logMessage + '\\n');
}

// Verify GitHub signature
function verifySignature(payload, signature) {
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(payload);
  const digest = 'sha256=' + hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Execute command with logging
function execCommand(command, description) {
  try {
    log(\`Executing: \${description}\`);
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: REPO_PATH 
    });
    log(\`Success: \${description}\`);
    return result;
  } catch (error) {
    log(\`Error: \${description} - \${error.message}\`, 'ERROR');
    throw error;
  }
}

// Deploy function
async function deployApplication() {
  const deployId = Date.now();
  log(\`Starting deployment \${deployId}\`);
  
  try {
    // Create backup
    execCommand(\`cp -r \${DEPLOY_PATH} /var/backups/internship/backup-\${deployId}\`, 'Create backup');
    
    // Pull latest changes
    execCommand('git fetch origin', 'Fetch latest changes');
    execCommand('git reset --hard origin/${CONFIG.github.branch}', 'Reset to latest commit');
    
    // Navigate to frontend directory
    process.chdir(path.join(REPO_PATH, 'frontend'));
    
    // Install dependencies
    execCommand('npm ci', 'Install dependencies');
    
    // Build application
    execCommand('npm run build', 'Build application');
    
    // Copy built files to deployment directory
    execCommand(\`cp -r .next/standalone/* \${DEPLOY_PATH}/\`, 'Copy application files');
    execCommand(\`cp -r .next/static \${DEPLOY_PATH}/.next/\`, 'Copy static files');
    execCommand(\`cp -r public \${DEPLOY_PATH}/\`, 'Copy public files');
    
    // Restart PM2 process
    execCommand('pm2 restart internship-frontend', 'Restart application');
    
    log(\`Deployment \${deployId} completed successfully\`);
    return { success: true, deployId };
    
  } catch (error) {
    log(\`Deployment \${deployId} failed: \${error.message}\`, 'ERROR');
    
    // Restore backup on failure
    try {
      execCommand(\`rm -rf \${DEPLOY_PATH} && cp -r /var/backups/internship/backup-\${deployId} \${DEPLOY_PATH}\`, 'Restore backup');
      execCommand('pm2 restart internship-frontend', 'Restart application after restore');
      log(\`Backup restored for failed deployment \${deployId}\`);
    } catch (restoreError) {
      log(\`Failed to restore backup: \${restoreError.message}\`, 'ERROR');
    }
    
    return { success: false, error: error.message, deployId };
  }
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);
  
  // Verify signature
  if (!signature || !verifySignature(payload, signature)) {
    log('Invalid signature received', 'WARN');
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const event = req.headers['x-github-event'];
  const body = req.body;
  
  log(\`Received GitHub event: \${event}\`);
  
  // Handle push events to main branch
  if (event === 'push' && body.ref === 'refs/heads/${CONFIG.github.branch}') {
    const commits = body.commits || [];
    const commitMessages = commits.map(c => c.message).join(', ');
    
    log(\`Push to ${CONFIG.github.branch} branch detected. Commits: \${commitMessages}\`);
    
    // Trigger deployment
    try {
      const result = await deployApplication();
      
      if (result.success) {
        res.json({ 
          message: 'Deployment successful', 
          deployId: result.deployId,
          commits: commitMessages
        });
      } else {
        res.status(500).json({ 
          error: 'Deployment failed', 
          details: result.error,
          deployId: result.deployId
        });
      }
    } catch (error) {
      log(\`Deployment error: \${error.message}\`, 'ERROR');
      res.status(500).json({ error: 'Deployment failed', details: error.message });
    }
  } else {
    log(\`Ignoring event: \${event} for ref: \${body.ref || 'unknown'}\`);
    res.json({ message: 'Event ignored' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  try {
    const gitStatus = execSync('git status --porcelain', { 
      encoding: 'utf8', 
      cwd: REPO_PATH 
    });
    const lastCommit = execSync('git log -1 --format="%H %s %an %ad"', { 
      encoding: 'utf8', 
      cwd: REPO_PATH 
    }).trim();
    
    res.json({
      repository: REPO_PATH,
      deployment: DEPLOY_PATH,
      gitStatus: gitStatus.trim() || 'clean',
      lastCommit: lastCommit,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  log(\`Webhook server started on port \${PORT}\`);
  log(\`Listening for GitHub webhooks from repository: ${CONFIG.github.repo}\`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('Webhook server shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('Webhook server shutting down...');
  process.exit(0);
});
`;
  
  fs.writeFileSync('/tmp/webhook-server.js', webhookServer);
  logSuccess('Webhook server script created');
}

// Create PM2 ecosystem for webhook
function createWebhookEcosystem() {
  logStep('PM2', 'Creating PM2 configuration for webhook...');
  
  const ecosystem = `module.exports = {
  apps: [
    {
      name: 'internship-frontend',
      script: 'server.js',
      cwd: '${CONFIG.vps.deployPath}',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_file: '/var/log/internship/frontend.log',
      out_file: '/var/log/internship/frontend-out.log',
      error_file: '/var/log/internship/frontend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    },
    {
      name: 'internship-webhook',
      script: '/opt/internship/webhook-server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      log_file: '/var/log/internship/webhook.log',
      out_file: '/var/log/internship/webhook-out.log',
      error_file: '/var/log/internship/webhook-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      restart_delay: 5000,
      max_restarts: 10
    }
  ]
};`;
  
  fs.writeFileSync('/tmp/ecosystem.config.js', ecosystem);
  logSuccess('PM2 ecosystem configuration created');
}

// Create setup script for VPS
function createVPSSetupScript() {
  logStep('VPS', 'Creating VPS setup script...');
  
  const setupScript = `#!/bin/bash

# Auto Deploy Setup Script for VPS
# This script sets up the auto-deployment system on the VPS

set -e

echo "🚀 Setting up auto-deployment system..."

# Configuration
REPO_URL="https://github.com/${CONFIG.github.repo}.git"
REPO_PATH="${CONFIG.vps.repoPath}"
DEPLOY_PATH="${CONFIG.vps.deployPath}"
WEBHOOK_PORT="${CONFIG.webhook.port}"

# Create directories
echo "📁 Creating directories..."
mkdir -p \${REPO_PATH}
mkdir -p /opt/internship
mkdir -p /var/log/internship
mkdir -p /var/backups/internship

# Clone repository
echo "📥 Cloning repository..."
if [ ! -d "\${REPO_PATH}/.git" ]; then
    git clone \${REPO_URL} \${REPO_PATH}
else
    echo "Repository already exists, pulling latest changes..."
    cd \${REPO_PATH}
    git pull origin ${CONFIG.github.branch}
fi

# Install webhook dependencies
echo "📦 Installing webhook dependencies..."
cd \${REPO_PATH}/frontend
npm install express

# Copy webhook server
echo "🔗 Setting up webhook server..."
cp /tmp/webhook-server.js /opt/internship/
chmod +x /opt/internship/webhook-server.js

# Copy PM2 ecosystem
echo "⚙️ Setting up PM2 configuration..."
cp /tmp/ecosystem.config.js \${DEPLOY_PATH}/

# Setup PM2 processes
echo "🔄 Setting up PM2 processes..."
pm2 delete internship-webhook || true
pm2 start \${DEPLOY_PATH}/ecosystem.config.js
pm2 save

# Configure Nginx for webhook
echo "🌐 Configuring Nginx for webhook..."
cat > /etc/nginx/sites-available/webhook.conf << 'EOF'
server {
    listen 80;
    server_name webhook.${CONFIG.vps.domain};
    
    location / {
        proxy_pass http://localhost:\${WEBHOOK_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
        proxy_cache_bypass \\$http_upgrade;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
    }
}
EOF

# Enable webhook site
ln -sf /etc/nginx/sites-available/webhook.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Setup firewall rule for webhook
echo "🔒 Setting up firewall..."
ufw allow \${WEBHOOK_PORT}/tcp comment "GitHub Webhook"

# Create deployment script
echo "📝 Creating manual deployment script..."
cat > /opt/internship/deploy.sh << 'EOF'
#!/bin/bash
cd ${CONFIG.vps.repoPath}
git pull origin ${CONFIG.github.branch}
cd frontend
npm ci
npm run build
cp -r .next/standalone/* ${CONFIG.vps.deployPath}/
cp -r .next/static ${CONFIG.vps.deployPath}/.next/
cp -r public ${CONFIG.vps.deployPath}/
pm2 restart internship-frontend
echo "✅ Manual deployment completed"
EOF

chmod +x /opt/internship/deploy.sh

# Setup log rotation
echo "📋 Setting up log rotation..."
cat > /etc/logrotate.d/internship << 'EOF'
/var/log/internship/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

echo "✅ Auto-deployment setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Add GitHub webhook URL: http://webhook.${CONFIG.vps.domain}/webhook"
echo "2. Set webhook secret: ${CONFIG.webhook.secret}"
echo "3. Test deployment: git push origin ${CONFIG.github.branch}"
echo ""
echo "🔧 Useful commands:"
echo "  pm2 status                    # Check processes"
echo "  pm2 logs internship-webhook   # View webhook logs"
echo "  /opt/internship/deploy.sh     # Manual deployment"
echo "  curl http://localhost:${CONFIG.webhook.port}/health  # Health check"
`;
  
  fs.writeFileSync('/tmp/setup-auto-deploy.sh', setupScript);
  fs.chmodSync('/tmp/setup-auto-deploy.sh', '755');
  logSuccess('VPS setup script created');
}

// Create GitHub Actions workflow (alternative)
function createGitHubActions() {
  logStep('GITHUB', 'Creating GitHub Actions workflow...');
  
  const workflowDir = '.github/workflows';
  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
  }
  
  const workflow = `name: Auto Deploy to VPS

on:
  push:
    branches: [ ${CONFIG.github.branch} ]
    paths:
      - 'frontend/**'
      - '.github/workflows/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
        
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
        
    - name: Build application
      run: |
        cd frontend
        npm run build
        
    - name: Deploy to VPS
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: \${{ secrets.VPS_HOST }}
        username: \${{ secrets.VPS_USER }}
        key: \${{ secrets.VPS_SSH_KEY }}
        port: \${{ secrets.VPS_PORT }}
        script: |
          # Navigate to repository
          cd ${CONFIG.vps.repoPath}
          
          # Pull latest changes
          git fetch origin
          git reset --hard origin/${CONFIG.github.branch}
          
          # Build and deploy
          cd frontend
          npm ci
          npm run build
          
          # Copy files
          cp -r .next/standalone/* ${CONFIG.vps.deployPath}/
          cp -r .next/static ${CONFIG.vps.deployPath}/.next/
          cp -r public ${CONFIG.vps.deployPath}/
          
          # Restart application
          pm2 restart internship-frontend
          
          echo "✅ Deployment completed successfully"
          
    - name: Notify deployment status
      if: always()
      run: |
        if [ "\${{ job.status }}" == "success" ]; then
          echo "✅ Deployment successful"
        else
          echo "❌ Deployment failed"
        fi
`;
  
  fs.writeFileSync(`${workflowDir}/deploy.yml`, workflow);
  logSuccess('GitHub Actions workflow created');
}

// Create documentation
function createDocumentation() {
  logStep('DOCS', 'Creating auto-deploy documentation...');
  
  const docs = `# Auto Deployment Setup Guide

ระบบ Auto Deploy จาก GitHub ไปยัง VPS อัตโนมัติ

## วิธีการทำงาน

เมื่อมีการ push code ไปยัง branch \`${CONFIG.github.branch}\` ระบบจะ:
1. รับ webhook จาก GitHub
2. Pull code ล่าสุดจาก repository
3. Build application ใหม่
4. Deploy ไปยัง VPS
5. Restart application

## การติดตั้ง

### 1. Setup บน VPS

\`\`\`bash
# Upload และรัน setup script
scp /tmp/setup-auto-deploy.sh root@${CONFIG.vps.host}:/tmp/
ssh root@${CONFIG.vps.host} "bash /tmp/setup-auto-deploy.sh"
\`\`\`

### 2. Setup GitHub Webhook

1. ไปที่ GitHub repository: https://github.com/${CONFIG.github.repo}
2. Settings > Webhooks > Add webhook
3. ใส่ข้อมูล:
   - **Payload URL:** \`http://webhook.${CONFIG.vps.domain}/webhook\`
   - **Content type:** \`application/json\`
   - **Secret:** \`${CONFIG.webhook.secret}\`
   - **Events:** Just the push event

### 3. ทดสอบ Auto Deploy

\`\`\`bash
# แก้ไขไฟล์และ push
git add .
git commit -m "Test auto deploy"
git push origin ${CONFIG.github.branch}
\`\`\`

## การจัดการ

### ตรวจสอบสถานะ

\`\`\`bash
# SSH เข้า VPS
ssh root@${CONFIG.vps.host}

# ดู PM2 processes
pm2 status

# ดู webhook logs
pm2 logs internship-webhook

# ดู deployment logs
tail -f /var/log/internship/webhook.log
\`\`\`

### Manual Deployment

\`\`\`bash
# SSH เข้า VPS
ssh root@${CONFIG.vps.host}

# รัน manual deploy
/opt/internship/deploy.sh
\`\`\`

### Webhook Endpoints

- **Health Check:** http://webhook.${CONFIG.vps.domain}/health
- **Status:** http://webhook.${CONFIG.vps.domain}/status
- **Webhook:** http://webhook.${CONFIG.vps.domain}/webhook (POST only)

## การแก้ไขปัญหา

### Webhook ไม่ทำงาน

\`\`\`bash
# ตรวจสอบ webhook server
pm2 logs internship-webhook

# Restart webhook server
pm2 restart internship-webhook

# ตรวจสอบ Nginx
nginx -t && systemctl reload nginx
\`\`\`

### Deployment ล้มเหลว

\`\`\`bash
# ดู error logs
tail -f /var/log/internship/webhook.log

# ทดสอบ manual deployment
/opt/internship/deploy.sh

# ตรวจสอบ repository
cd ${CONFIG.vps.repoPath}
git status
git log -1
\`\`\`

### Rollback

\`\`\`bash
# ดู backup ที่มี
ls -la /var/backups/internship/

# Restore backup
cp -r /var/backups/internship/backup-TIMESTAMP ${CONFIG.vps.deployPath}
pm2 restart internship-frontend
\`\`\`

## Security

- Webhook server ใช้ secret เพื่อ verify GitHub signature
- Firewall เปิดเฉพาะ port ที่จำเป็น
- Log rotation ป้องกัน disk เต็ม
- Backup อัตโนมัติก่อน deploy

## Alternative: GitHub Actions

หากต้องการใช้ GitHub Actions แทน webhook:

1. ตั้งค่า Secrets ใน GitHub:
   - \`VPS_HOST\`: ${CONFIG.vps.host}
   - \`VPS_USER\`: ${CONFIG.vps.user}
   - \`VPS_PORT\`: ${CONFIG.vps.port}
   - \`VPS_SSH_KEY\`: SSH private key

2. Push workflow file ที่สร้างไว้

3. Disable webhook server:
   \`\`\`bash
   pm2 delete internship-webhook
   \`\`\`

## Monitoring

### Log Files
- Webhook: \`/var/log/internship/webhook.log\`
- Frontend: \`/var/log/internship/frontend.log\`
- Nginx: \`/var/log/nginx/webhook.${CONFIG.vps.domain}.access.log\`

### Performance
- ใช้ \`htop\` ดู resource usage
- ใช้ \`pm2 monit\` ดู application performance
- ตรวจสอบ disk space สำหรับ backups

---

**หมายเหตุ:** ระบบนี้จะ deploy เฉพาะเมื่อมีการ push ไปยัง branch \`${CONFIG.github.branch}\` เท่านั้น
`;
  
  fs.writeFileSync('AUTO_DEPLOY.md', docs);
  logSuccess('Auto-deploy documentation created');
}

// Main function
async function main() {
  log('🤖 Setting up Auto Deployment System', 'bright');
  log(`Repository: ${CONFIG.github.repo}`, 'blue');
  log(`VPS: ${CONFIG.vps.domain} (${CONFIG.vps.host})`, 'blue');
  log('=' .repeat(60), 'blue');
  
  try {
    // Create all components
    createWebhookServer();
    createWebhookEcosystem();
    createVPSSetupScript();
    createGitHubActions();
    createDocumentation();
    
    log('=' .repeat(60), 'blue');
    log('✅ Auto Deployment Setup Complete!', 'green');
    log('', 'reset');
    log('📋 Next steps:', 'bright');
    log('1. Upload setup script to VPS:', 'yellow');
    log(`   scp /tmp/setup-auto-deploy.sh root@${CONFIG.vps.host}:/tmp/`, 'cyan');
    log(`   ssh root@${CONFIG.vps.host} "bash /tmp/setup-auto-deploy.sh"`, 'cyan');
    log('', 'reset');
    log('2. Setup GitHub webhook:', 'yellow');
    log(`   URL: http://webhook.${CONFIG.vps.domain}/webhook`, 'cyan');
    log(`   Secret: ${CONFIG.webhook.secret}`, 'cyan');
    log('', 'reset');
    log('3. Test auto deployment:', 'yellow');
    log(`   git push origin ${CONFIG.github.branch}`, 'cyan');
    log('', 'reset');
    log('📚 Documentation: AUTO_DEPLOY.md', 'bright');
    
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
  createWebhookServer,
  createVPSSetupScript,
  createGitHubActions,
  CONFIG
};