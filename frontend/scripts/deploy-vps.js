#!/usr/bin/env node

/**
 * VPS Deployment Script for Hostatom Cloud VPS
 * Server: dev.smart-solutions.com (203.170.129.199)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// VPS Configuration
const VPS_CONFIG = {
  host: '203.170.129.199',
  domain: 'dev.smart-solutions.com',
  user: 'root',
  port: 22,
  deployPath: '/var/www/html',
  backupPath: '/var/backups/internship',
  serviceName: 'internship-frontend'
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

// Execute command with error handling
function execCommand(command, description) {
  try {
    logStep('EXEC', `${description}...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    logSuccess(description);
    return result;
  } catch (error) {
    logError(`Failed: ${description}`);
    logError(error.message);
    throw error;
  }
}

// SSH command helper
function sshCommand(command, description) {
  const sshCmd = `ssh -o StrictHostKeyChecking=no -p ${VPS_CONFIG.port} ${VPS_CONFIG.user}@${VPS_CONFIG.host} "${command}"`;
  return execCommand(sshCmd, description);
}

// SCP file transfer helper
function scpTransfer(localPath, remotePath, description) {
  const scpCmd = `scp -o StrictHostKeyChecking=no -P ${VPS_CONFIG.port} -r ${localPath} ${VPS_CONFIG.user}@${VPS_CONFIG.host}:${remotePath}`;
  return execCommand(scpCmd, description);
}

// Check VPS connection
function checkVPSConnection() {
  logStep('CONNECTION', 'Testing VPS connection...');
  try {
    sshCommand('echo "Connection successful"', 'VPS connection test');
    logSuccess('VPS connection established');
    return true;
  } catch (error) {
    logError('Cannot connect to VPS. Please check:');
    logError('1. SSH key is properly configured');
    logError('2. Server is accessible');
    logError('3. Credentials are correct');
    return false;
  }
}

// Setup VPS environment
function setupVPSEnvironment() {
  logStep('SETUP', 'Setting up VPS environment...');
  
  // Update system
  sshCommand('apt update && apt upgrade -y', 'System update');
  
  // Install Node.js 18
  sshCommand(`
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - &&
    apt-get install -y nodejs
  `, 'Install Node.js 18');
  
  // Install PM2
  sshCommand('npm install -g pm2', 'Install PM2');
  
  // Install Nginx
  sshCommand('apt install -y nginx', 'Install Nginx');
  
  // Install Certbot for SSL
  sshCommand('apt install -y certbot python3-certbot-nginx', 'Install Certbot');
  
  // Create directories
  sshCommand(`
    mkdir -p ${VPS_CONFIG.deployPath} &&
    mkdir -p ${VPS_CONFIG.backupPath} &&
    mkdir -p /var/log/internship
  `, 'Create directories');
  
  logSuccess('VPS environment setup completed');
}

// Build application
function buildApplication() {
  logStep('BUILD', 'Building application...');
  
  // Install dependencies
  execCommand('npm ci', 'Install dependencies');
  
  // Run deployment preparation
  execCommand('npm run deploy:notifications', 'Prepare notification system');
  
  // Build for production
  execCommand('npm run build', 'Build application');
  
  logSuccess('Application built successfully');
}

// Create production environment file
function createProductionEnv() {
  logStep('ENV', 'Creating production environment...');
  
  const prodEnv = `# Production Environment for VPS Deployment
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_NAME="Internship Management System"
NEXT_PUBLIC_APP_VERSION=2.0.0

# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://${VPS_CONFIG.domain}/api
NEXT_PUBLIC_API_TIMEOUT=30000

# Notification Configuration (Placeholder - Update with real VAPID keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=placeholder_vapid_public_key
VAPID_PRIVATE_KEY=placeholder_vapid_private_key
VAPID_SUBJECT=mailto:admin@${VPS_CONFIG.domain}

# Notification Service
NEXT_PUBLIC_NOTIFICATION_API_URL=https://${VPS_CONFIG.domain}/api/notifications
NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=false
NEXT_PUBLIC_ENABLE_OFFLINE_NOTIFICATIONS=true

# Service Worker
NEXT_PUBLIC_SW_UPDATE_INTERVAL=3600000
NEXT_PUBLIC_SW_CACHE_VERSION=v1

# Security
NEXT_PUBLIC_CORS_ORIGIN=https://${VPS_CONFIG.domain}

# Performance
NEXT_PUBLIC_ENABLE_SW=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=false

# Feature Flags
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true

# Cache Configuration
NEXT_PUBLIC_CACHE_TTL=3600
NEXT_PUBLIC_STATIC_CACHE_TTL=86400

PORT=3000
`;
  
  fs.writeFileSync('.env.production', prodEnv);
  logSuccess('Production environment file created');
}

// Deploy application files
function deployApplication() {
  logStep('DEPLOY', 'Deploying application to VPS...');
  
  // Create backup of existing deployment
  try {
    sshCommand(`
      if [ -d "${VPS_CONFIG.deployPath}" ]; then
        cp -r ${VPS_CONFIG.deployPath} ${VPS_CONFIG.backupPath}/backup-$(date +%Y%m%d-%H%M%S)
      fi
    `, 'Create backup');
  } catch (error) {
    logWarning('Backup creation failed (might be first deployment)');
  }
  
  // Transfer built files
  scpTransfer('.next/standalone/*', `${VPS_CONFIG.deployPath}/`, 'Transfer application files');
  scpTransfer('.next/static', `${VPS_CONFIG.deployPath}/.next/`, 'Transfer static files');
  scpTransfer('public', `${VPS_CONFIG.deployPath}/`, 'Transfer public files');
  scpTransfer('package.json', `${VPS_CONFIG.deployPath}/`, 'Transfer package.json');
  scpTransfer('.env.production', `${VPS_CONFIG.deployPath}/.env.local`, 'Transfer environment file');
  
  logSuccess('Application files deployed');
}

// Configure Nginx
function configureNginx() {
  logStep('NGINX', 'Configuring Nginx...');
  
  const nginxConfig = `server {
    listen 80;
    server_name ${VPS_CONFIG.domain} www.${VPS_CONFIG.domain};
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${VPS_CONFIG.domain} www.${VPS_CONFIG.domain};
    
    # SSL Configuration (will be configured by Certbot)
    # ssl_certificate /etc/letsencrypt/live/${VPS_CONFIG.domain}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/${VPS_CONFIG.domain}/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Service Worker - No caching
    location /sw.js {
        root ${VPS_CONFIG.deployPath}/public;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        add_header Service-Worker-Allowed "/";
    }
    
    # PWA Manifest
    location /manifest.json {
        root ${VPS_CONFIG.deployPath}/public;
        add_header Cache-Control "public, max-age=86400";
        add_header Content-Type "application/manifest+json";
    }
    
    # Static files with long cache
    location /_next/static/ {
        root ${VPS_CONFIG.deployPath};
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # Public files
    location /icons/ {
        root ${VPS_CONFIG.deployPath}/public;
        add_header Cache-Control "public, max-age=86400";
    }
    
    # API endpoints (for future backend integration)
    location /api/ {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://${VPS_CONFIG.domain}";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
    }
    
    # Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /500.html;
    
    # Logs
    access_log /var/log/nginx/${VPS_CONFIG.domain}.access.log;
    error_log /var/log/nginx/${VPS_CONFIG.domain}.error.log;
}`;
  
  // Write nginx config to temporary file
  fs.writeFileSync('/tmp/nginx-internship.conf', nginxConfig);
  
  // Transfer and activate nginx config
  scpTransfer('/tmp/nginx-internship.conf', `/etc/nginx/sites-available/${VPS_CONFIG.domain}`, 'Transfer Nginx config');
  
  sshCommand(`
    ln -sf /etc/nginx/sites-available/${VPS_CONFIG.domain} /etc/nginx/sites-enabled/ &&
    rm -f /etc/nginx/sites-enabled/default &&
    nginx -t &&
    systemctl reload nginx
  `, 'Activate Nginx configuration');
  
  // Clean up temp file
  fs.unlinkSync('/tmp/nginx-internship.conf');
  
  logSuccess('Nginx configured successfully');
}

// Setup SSL certificate
function setupSSL() {
  logStep('SSL', 'Setting up SSL certificate...');
  
  try {
    sshCommand(`
      certbot --nginx -d ${VPS_CONFIG.domain} -d www.${VPS_CONFIG.domain} --non-interactive --agree-tos --email admin@${VPS_CONFIG.domain}
    `, 'Install SSL certificate');
    
    logSuccess('SSL certificate installed');
  } catch (error) {
    logWarning('SSL setup failed. You can run this manually later:');
    logWarning(`certbot --nginx -d ${VPS_CONFIG.domain} -d www.${VPS_CONFIG.domain}`);
  }
}

// Setup PM2 process
function setupPM2() {
  logStep('PM2', 'Setting up PM2 process...');
  
  const pm2Config = {
    name: VPS_CONFIG.serviceName,
    script: 'server.js',
    cwd: VPS_CONFIG.deployPath,
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: '/var/log/internship/combined.log',
    out_file: '/var/log/internship/out.log',
    error_file: '/var/log/internship/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z'
  };
  
  // Write PM2 config
  fs.writeFileSync('/tmp/ecosystem.config.js', `module.exports = {
  apps: [${JSON.stringify(pm2Config, null, 4)}]
};`);
  
  // Transfer PM2 config
  scpTransfer('/tmp/ecosystem.config.js', `${VPS_CONFIG.deployPath}/ecosystem.config.js`, 'Transfer PM2 config');
  
  // Setup and start PM2
  sshCommand(`
    cd ${VPS_CONFIG.deployPath} &&
    npm install --production &&
    pm2 delete ${VPS_CONFIG.serviceName} || true &&
    pm2 start ecosystem.config.js &&
    pm2 save &&
    pm2 startup
  `, 'Setup PM2 process');
  
  // Clean up temp file
  fs.unlinkSync('/tmp/ecosystem.config.js');
  
  logSuccess('PM2 process configured');
}

// Create deployment status page
function createStatusPage() {
  logStep('STATUS', 'Creating deployment status page...');
  
  const statusHtml = `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Internship Management System - Deployment Status</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .warning { background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .info { background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
    </style>
</head>
<body>
    <h1>🚀 Internship Management System</h1>
    <h2>Deployment Status</h2>
    
    <div class="status success">
        ✅ Frontend deployed successfully
    </div>
    
    <div class="status warning">
        ⚠️ Backend integration pending
    </div>
    
    <div class="status info">
        ℹ️ Push notifications will be available after backend deployment
    </div>
    
    <h3>System Information</h3>
    <ul>
        <li><strong>Server:</strong> ${VPS_CONFIG.domain}</li>
        <li><strong>Deployment Date:</strong> ${new Date().toLocaleString('th-TH')}</li>
        <li><strong>Version:</strong> 2.0.0</li>
        <li><strong>Environment:</strong> Production</li>
    </ul>
    
    <h3>Next Steps</h3>
    <ol>
        <li>Deploy backend API server</li>
        <li>Configure notification endpoints</li>
        <li>Setup VAPID keys for push notifications</li>
        <li>Test notification functionality</li>
    </ol>
    
    <h3>Monitoring</h3>
    <ul>
        <li><a href="/api/health" target="_blank">API Health Check</a> (Available after backend deployment)</li>
        <li><strong>Logs:</strong> /var/log/internship/</li>
        <li><strong>PM2 Status:</strong> <code>pm2 status</code></li>
    </ul>
</body>
</html>`;
  
  fs.writeFileSync('/tmp/status.html', statusHtml);
  scpTransfer('/tmp/status.html', `${VPS_CONFIG.deployPath}/public/status.html`, 'Transfer status page');
  fs.unlinkSync('/tmp/status.html');
  
  logSuccess('Status page created');
}

// Main deployment function
async function main() {
  const args = process.argv.slice(2);
  const skipBuild = args.includes('--skip-build');
  const setupOnly = args.includes('--setup-only');
  
  log('🚀 Deploying Internship Management System to VPS', 'bright');
  log(`Server: ${VPS_CONFIG.domain} (${VPS_CONFIG.host})`, 'blue');
  log('=' .repeat(60), 'blue');
  
  try {
    // Check VPS connection
    if (!checkVPSConnection()) {
      process.exit(1);
    }
    
    if (setupOnly) {
      setupVPSEnvironment();
      logSuccess('VPS environment setup completed!');
      return;
    }
    
    // Build application
    if (!skipBuild) {
      buildApplication();
      createProductionEnv();
    }
    
    // Deploy to VPS
    deployApplication();
    configureNginx();
    setupPM2();
    createStatusPage();
    
    // Optional SSL setup
    if (!args.includes('--skip-ssl')) {
      setupSSL();
    }
    
    log('=' .repeat(60), 'blue');
    log('✅ Deployment completed successfully!', 'green');
    log('', 'reset');
    log('🌐 Your application is now available at:', 'bright');
    log(`   https://${VPS_CONFIG.domain}`, 'cyan');
    log(`   https://${VPS_CONFIG.domain}/status.html (Status page)`, 'cyan');
    log('', 'reset');
    log('📋 Next steps:', 'bright');
    log('1. Deploy backend API server', 'yellow');
    log('2. Update VAPID keys in .env.local', 'yellow');
    log('3. Configure notification endpoints', 'yellow');
    log('4. Test the complete system', 'yellow');
    log('', 'reset');
    log('🔧 Useful commands:', 'bright');
    log(`   ssh ${VPS_CONFIG.user}@${VPS_CONFIG.host} "pm2 status"`, 'cyan');
    log(`   ssh ${VPS_CONFIG.user}@${VPS_CONFIG.host} "pm2 logs ${VPS_CONFIG.serviceName}"`, 'cyan');
    log(`   ssh ${VPS_CONFIG.user}@${VPS_CONFIG.host} "nginx -t && systemctl reload nginx"`, 'cyan');
    
  } catch (error) {
    logError(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  checkVPSConnection,
  setupVPSEnvironment,
  buildApplication,
  deployApplication,
  configureNginx,
  setupPM2
};