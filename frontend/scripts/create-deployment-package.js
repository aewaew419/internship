#!/usr/bin/env node

/**
 * Create Deployment Package for University Server
 * Creates a complete deployment package that can be easily deployed on any server
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Create deployment directory
function createDeploymentDir() {
  const deployDir = 'deployment-package';
  
  if (fs.existsSync(deployDir)) {
    execCommand(`rm -rf ${deployDir}`, 'Clean existing deployment directory');
  }
  
  fs.mkdirSync(deployDir, { recursive: true });
  fs.mkdirSync(`${deployDir}/scripts`, { recursive: true });
  fs.mkdirSync(`${deployDir}/config`, { recursive: true });
  fs.mkdirSync(`${deployDir}/docs`, { recursive: true });
  
  logSuccess('Deployment directory created');
  return deployDir;
}

// Build application
function buildApplication() {
  logStep('BUILD', 'Building application for production...');
  
  // Install dependencies
  execCommand('npm ci', 'Install dependencies');
  
  // Run notification preparation
  execCommand('npm run deploy:notifications', 'Prepare notification system');
  
  // Build application
  execCommand('npm run build', 'Build application');
  
  logSuccess('Application built successfully');
}

// Create Docker setup
function createDockerSetup(deployDir) {
  logStep('DOCKER', 'Creating Docker configuration...');
  
  // Dockerfile
  const dockerfile = `# Dockerfile for Internship Management System
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built application
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["node", "server.js"]
`;
  
  fs.writeFileSync(`${deployDir}/Dockerfile`, dockerfile);
  
  // Docker Compose
  const dockerCompose = `version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_APP_ENV=production
      - NEXT_PUBLIC_API_BASE_URL=\${API_BASE_URL:-http://localhost:3333/api}
      - NEXT_PUBLIC_VAPID_PUBLIC_KEY=\${VAPID_PUBLIC_KEY}
      - VAPID_PRIVATE_KEY=\${VAPID_PRIVATE_KEY}
      - VAPID_SUBJECT=\${VAPID_SUBJECT:-mailto:admin@university.ac.th}
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx.conf:/etc/nginx/nginx.conf
      - ./config/ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - frontend
    restart: unless-stopped

volumes:
  logs:
`;
  
  fs.writeFileSync(`${deployDir}/docker-compose.yml`, dockerCompose);
  
  logSuccess('Docker configuration created');
}

// Create Nginx configuration
function createNginxConfig(deployDir) {
  logStep('NGINX', 'Creating Nginx configuration...');
  
  const nginxConfig = `events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;
    
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    # Upstream backend (when available)
    upstream backend {
        server host.docker.internal:3333;
    }
    
    server {
        listen 80;
        server_name _;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        
        # Service Worker - No caching
        location /sw.js {
            proxy_pass http://frontend:3000;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
            add_header Service-Worker-Allowed "/";
        }
        
        # PWA Manifest
        location /manifest.json {
            proxy_pass http://frontend:3000;
            add_header Cache-Control "public, max-age=86400";
            add_header Content-Type "application/manifest+json";
        }
        
        # Static files with long cache
        location /_next/static/ {
            proxy_pass http://frontend:3000;
            add_header Cache-Control "public, max-age=31536000, immutable";
        }
        
        # API endpoints (rate limited)
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # CORS headers
            add_header Access-Control-Allow-Origin "$http_origin" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
            
            # Handle preflight requests
            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }
        
        # Main application
        location / {
            proxy_pass http://frontend:3000;
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
    }
}
`;
  
  fs.writeFileSync(`${deployDir}/config/nginx.conf`, nginxConfig);
  
  logSuccess('Nginx configuration created');
}

// Create deployment scripts
function createDeploymentScripts(deployDir) {
  logStep('SCRIPTS', 'Creating deployment scripts...');
  
  // Quick deploy script
  const quickDeploy = `#!/bin/bash

# Quick Deployment Script for University Server
# This script deploys the Internship Management System

set -e

echo "🚀 Deploying Internship Management System"
echo "========================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Create environment file if not exists
if [ ! -f .env ]; then
    echo "📝 Creating environment configuration..."
    cat > .env << 'EOF'
# University Server Configuration
API_BASE_URL=http://localhost:3333/api
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_SUBJECT=mailto:admin@university.ac.th

# Database (if needed)
DATABASE_URL=postgresql://username:password@localhost:5432/internship_db

# Security
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost

# Features
ENABLE_PUSH_NOTIFICATIONS=false
ENABLE_ANALYTICS=false
EOF
    echo "✅ Environment file created (.env)"
    echo "⚠️  Please update the values in .env file before deployment"
fi

# Create logs directory
mkdir -p logs/nginx

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "🔍 Checking service status..."
docker-compose ps

# Test application
echo "🧪 Testing application..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Application is running successfully!"
    echo ""
    echo "🌐 Access your application at:"
    echo "   http://localhost (via Nginx)"
    echo "   http://localhost:3000 (direct)"
    echo ""
    echo "📊 Monitor with:"
    echo "   docker-compose logs -f"
    echo "   docker-compose ps"
else
    echo "❌ Application is not responding"
    echo "📋 Check logs:"
    echo "   docker-compose logs"
fi

echo ""
echo "🔧 Useful commands:"
echo "   docker-compose stop     # Stop services"
echo "   docker-compose start    # Start services"
echo "   docker-compose restart  # Restart services"
echo "   docker-compose down     # Stop and remove containers"
echo "   docker-compose logs -f  # View logs"
`;
  
  fs.writeFileSync(`${deployDir}/scripts/deploy.sh`, quickDeploy);
  fs.chmodSync(`${deployDir}/scripts/deploy.sh`, '755');
  
  // Update script
  const updateScript = `#!/bin/bash

# Update Deployment Script
# Updates the application with new code

set -e

echo "🔄 Updating Internship Management System"
echo "======================================="

# Pull latest images
echo "📥 Pulling latest changes..."
docker-compose pull

# Rebuild and restart
echo "🔨 Rebuilding application..."
docker-compose up --build -d

# Wait for services
echo "⏳ Waiting for services to restart..."
sleep 10

# Check status
echo "🔍 Checking service status..."
docker-compose ps

echo "✅ Update completed!"
`;
  
  fs.writeFileSync(`${deployDir}/scripts/update.sh`, updateScript);
  fs.chmodSync(`${deployDir}/scripts/update.sh`, '755');
  
  // Backup script
  const backupScript = `#!/bin/bash

# Backup Script
# Creates backup of application data

set -e

BACKUP_DIR="backups/\$(date +%Y%m%d-%H%M%S)"

echo "💾 Creating backup..."
mkdir -p "\$BACKUP_DIR"

# Backup environment
cp .env "\$BACKUP_DIR/" 2>/dev/null || echo "No .env file to backup"

# Backup logs
cp -r logs "\$BACKUP_DIR/" 2>/dev/null || echo "No logs to backup"

# Backup database (if using Docker volume)
docker-compose exec -T db pg_dump -U postgres internship > "\$BACKUP_DIR/database.sql" 2>/dev/null || echo "No database to backup"

echo "✅ Backup created: \$BACKUP_DIR"
`;
  
  fs.writeFileSync(`${deployDir}/scripts/backup.sh`, backupScript);
  fs.chmodSync(`${deployDir}/scripts/backup.sh`, '755');
  
  logSuccess('Deployment scripts created');
}

// Create documentation
function createDocumentation(deployDir) {
  logStep('DOCS', 'Creating documentation...');
  
  const readme = `# Internship Management System - Deployment Package

ระบบจัดการฝึกงานสำหรับมหาวิทยาลัย พร้อม deployment แบบ Docker

## ความต้องการของระบบ

- Docker 20.10+
- Docker Compose 2.0+
- Port 80, 443, 3000 ว่าง
- RAM อย่างน้อย 2GB
- Disk space อย่างน้อย 5GB

## การติดตั้ง

### 1. ติดตั้ง Docker

**Ubuntu/Debian:**
\`\`\`bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
\`\`\`

**CentOS/RHEL:**
\`\`\`bash
sudo yum install -y docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker
\`\`\`

### 2. Deploy Application

\`\`\`bash
# Extract deployment package
tar -xzf internship-deployment.tar.gz
cd internship-deployment

# Run deployment
./scripts/deploy.sh
\`\`\`

### 3. Configuration

แก้ไขไฟล์ \`.env\`:

\`\`\`env
# API Configuration
API_BASE_URL=http://your-server.university.ac.th/api

# Notification System (Optional)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:admin@university.ac.th

# Database
DATABASE_URL=postgresql://username:password@db:5432/internship_db

# Security
JWT_SECRET=your_secure_jwt_secret_here
CORS_ORIGIN=http://your-server.university.ac.th
\`\`\`

## การใช้งาน

### เข้าถึงระบบ
- **Frontend:** http://localhost
- **Direct Access:** http://localhost:3000

### จัดการ Services

\`\`\`bash
# ดูสถานะ
docker-compose ps

# ดู logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose stop

# Update application
./scripts/update.sh

# Create backup
./scripts/backup.sh
\`\`\`

## Features

### ✅ พร้อมใช้งาน
- ระบบ Authentication
- การจัดการผู้ใช้ (นักศึกษา, อาจารย์, ผู้ดูแล)
- ระบบฝึกงาน
- การอัพโหลดเอกสาร
- Responsive Design
- PWA Support
- Offline Functionality

### 🔄 ต้องการ Backend
- Push Notifications
- Real-time Updates
- Database Integration
- File Upload API
- Authentication API

## Architecture

\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Nginx    │────│   Frontend  │────│   Backend   │
│   (Port 80) │    │ (Port 3000) │    │ (Port 3333) │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                  ┌─────────────┐
                  │  Database   │
                  │ (Port 5432) │
                  └─────────────┘
\`\`\`

## Security

### SSL/HTTPS Setup

1. วาง SSL certificates ใน \`config/ssl/\`
2. แก้ไข \`config/nginx.conf\` เพิ่ม SSL configuration
3. Restart nginx: \`docker-compose restart nginx\`

### Firewall

\`\`\`bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
\`\`\`

## Monitoring

### Health Checks

\`\`\`bash
# Application health
curl http://localhost:3000/api/health

# Service status
docker-compose ps
\`\`\`

### Logs

\`\`\`bash
# Application logs
docker-compose logs frontend

# Nginx logs
docker-compose logs nginx

# All logs
docker-compose logs -f
\`\`\`

## Troubleshooting

### Common Issues

1. **Port already in use**
   \`\`\`bash
   sudo netstat -tulpn | grep :80
   sudo systemctl stop apache2  # or nginx
   \`\`\`

2. **Docker permission denied**
   \`\`\`bash
   sudo usermod -aG docker $USER
   # Logout and login again
   \`\`\`

3. **Application not starting**
   \`\`\`bash
   docker-compose logs frontend
   docker-compose restart
   \`\`\`

### Performance Tuning

1. **Increase memory limits**
   \`\`\`yaml
   # In docker-compose.yml
   services:
     frontend:
       mem_limit: 1g
   \`\`\`

2. **Enable caching**
   - Configure Redis for session storage
   - Enable Nginx caching for static files

## Support

### Contact Information
- **Developer:** Internship Management Team
- **University IT:** it-support@university.ac.th
- **Documentation:** See \`docs/\` directory

### Useful Links
- Docker Documentation: https://docs.docker.com/
- Next.js Documentation: https://nextjs.org/docs
- Nginx Documentation: https://nginx.org/en/docs/

---

**Note:** This is a frontend-only deployment. For full functionality, deploy the backend API server separately.
`;
  
  fs.writeFileSync(`${deployDir}/README.md`, readme);
  
  // Installation guide
  const installGuide = `# คู่มือการติดตั้งระบบจัดการฝึกงาน

## ขั้นตอนการติดตั้งแบบละเอียด

### 1. เตรียมเซิร์ฟเวอร์

#### ความต้องการขั้นต่ำ:
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB
- OS: Ubuntu 20.04+ / CentOS 8+

#### อัพเดทระบบ:
\`\`\`bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
\`\`\`

### 2. ติดตั้ง Docker

#### Ubuntu/Debian:
\`\`\`bash
# ติดตั้ง dependencies
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# เพิ่ม Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# เพิ่ม Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# ติดตั้ง Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# เริ่มต้น Docker service
sudo systemctl start docker
sudo systemctl enable docker

# เพิ่ม user เข้า docker group
sudo usermod -aG docker $USER
\`\`\`

#### CentOS/RHEL:
\`\`\`bash
# ติดตั้ง Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# เริ่มต้น Docker service
sudo systemctl start docker
sudo systemctl enable docker

# เพิ่ม user เข้า docker group
sudo usermod -aG docker $USER
\`\`\`

### 3. ติดตั้ง Docker Compose (ถ้ายังไม่มี)

\`\`\`bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# ให้สิทธิ์ execute
sudo chmod +x /usr/local/bin/docker-compose

# ทดสอบ
docker-compose --version
\`\`\`

### 4. Deploy Application

\`\`\`bash
# Extract deployment package
tar -xzf internship-deployment.tar.gz
cd internship-deployment

# ตั้งค่า environment
cp .env.example .env
nano .env  # แก้ไขค่าต่างๆ

# Deploy
./scripts/deploy.sh
\`\`\`

### 5. ตั้งค่า Firewall

#### Ubuntu (UFW):
\`\`\`bash
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
\`\`\`

#### CentOS (Firewalld):
\`\`\`bash
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
\`\`\`

### 6. ตั้งค่า SSL (Optional)

\`\`\`bash
# ติดตั้ง Certbot
sudo apt install -y certbot  # Ubuntu
sudo yum install -y certbot  # CentOS

# สร้าง SSL certificate
sudo certbot certonly --standalone -d your-domain.university.ac.th

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.university.ac.th/fullchain.pem config/ssl/
sudo cp /etc/letsencrypt/live/your-domain.university.ac.th/privkey.pem config/ssl/

# แก้ไข nginx config เพื่อเปิดใช้ SSL
nano config/nginx.conf

# Restart nginx
docker-compose restart nginx
\`\`\`

## การตรวจสอบการติดตั้ง

### 1. ตรวจสอบ Services
\`\`\`bash
docker-compose ps
\`\`\`

### 2. ทดสอบ Application
\`\`\`bash
curl http://localhost
curl http://localhost:3000
\`\`\`

### 3. ดู Logs
\`\`\`bash
docker-compose logs -f
\`\`\`

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **Docker permission denied**
   \`\`\`bash
   sudo usermod -aG docker $USER
   # Logout และ login ใหม่
   \`\`\`

2. **Port 80 ถูกใช้งานแล้ว**
   \`\`\`bash
   sudo netstat -tulpn | grep :80
   sudo systemctl stop apache2  # หรือ nginx
   \`\`\`

3. **Memory ไม่พอ**
   \`\`\`bash
   # เพิ่ม swap space
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   \`\`\`

### การ Monitor

\`\`\`bash
# ดู resource usage
docker stats

# ดู disk usage
df -h
docker system df

# ทำความสะอาด
docker system prune -a
\`\`\`

## การ Backup และ Restore

### Backup
\`\`\`bash
./scripts/backup.sh
\`\`\`

### Restore
\`\`\`bash
# Restore from backup
cp backups/20231201-120000/.env ./
docker-compose down
docker-compose up -d
\`\`\`

---

สำหรับคำถามเพิ่มเติม ติดต่อทีม IT ของมหาวิทยาลัย
`;
  
  fs.writeFileSync(`${deployDir}/docs/INSTALLATION.md`, installGuide);
  
  logSuccess('Documentation created');
}

// Copy built files
function copyBuiltFiles(deployDir) {
  logStep('COPY', 'Copying built application files...');
  
  // Copy Next.js build
  if (fs.existsSync('.next')) {
    execCommand(`cp -r .next ${deployDir}/`, 'Copy Next.js build');
  }
  
  // Copy public files
  if (fs.existsSync('public')) {
    execCommand(`cp -r public ${deployDir}/`, 'Copy public files');
  }
  
  // Copy package files
  execCommand(`cp package*.json ${deployDir}/`, 'Copy package files');
  
  // Create environment template
  const envTemplate = `# Environment Configuration Template
# Copy this file to .env and update the values

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_NAME="Internship Management System"
NEXT_PUBLIC_APP_VERSION=2.0.0

# API Configuration
API_BASE_URL=http://localhost:3333/api
NEXT_PUBLIC_API_BASE_URL=http://localhost:3333/api

# Notification System (Optional - requires backend)
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_SUBJECT=mailto:admin@university.ac.th
NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=false

# Database (if using)
DATABASE_URL=postgresql://username:password@db:5432/internship_db

# Security
JWT_SECRET=your_secure_jwt_secret_here
CORS_ORIGIN=http://localhost

# Features
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=false
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
`;
  
  fs.writeFileSync(`${deployDir}/.env.example`, envTemplate);
  
  logSuccess('Application files copied');
}

// Create deployment archive
function createDeploymentArchive(deployDir) {
  logStep('ARCHIVE', 'Creating deployment archive...');
  
  const archiveName = `internship-deployment-${new Date().toISOString().split('T')[0]}.tar.gz`;
  
  execCommand(`tar -czf ${archiveName} ${deployDir}`, 'Create deployment archive');
  
  logSuccess(`Deployment archive created: ${archiveName}`);
  return archiveName;
}

// Main function
async function main() {
  log('📦 Creating University Deployment Package', 'bright');
  log('=' .repeat(50), 'blue');
  
  try {
    // Build application
    buildApplication();
    
    // Create deployment structure
    const deployDir = createDeploymentDir();
    
    // Copy built files
    copyBuiltFiles(deployDir);
    
    // Create Docker setup
    createDockerSetup(deployDir);
    
    // Create Nginx config
    createNginxConfig(deployDir);
    
    // Create deployment scripts
    createDeploymentScripts(deployDir);
    
    // Create documentation
    createDocumentation(deployDir);
    
    // Create archive
    const archiveName = createDeploymentArchive(deployDir);
    
    log('=' .repeat(50), 'blue');
    log('✅ Deployment Package Created Successfully!', 'green');
    log('', 'reset');
    log('📦 Package Details:', 'bright');
    log(`   Archive: ${archiveName}`, 'cyan');
    log(`   Directory: ${deployDir}/`, 'cyan');
    log('', 'reset');
    log('🚀 Ready for University Deployment:', 'bright');
    log('1. Transfer archive to university server', 'yellow');
    log('2. Extract: tar -xzf ' + archiveName, 'yellow');
    log('3. Run: ./scripts/deploy.sh', 'yellow');
    log('', 'reset');
    log('📚 Documentation:', 'bright');
    log(`   Main: ${deployDir}/README.md`, 'cyan');
    log(`   Installation: ${deployDir}/docs/INSTALLATION.md`, 'cyan');
    log('', 'reset');
    log('🔧 Features Included:', 'bright');
    log('✓ Docker containerization', 'green');
    log('✓ Nginx reverse proxy', 'green');
    log('✓ Auto-deployment scripts', 'green');
    log('✓ Complete documentation', 'green');
    log('✓ Ready for production', 'green');
    
  } catch (error) {
    logError(`Package creation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  createDeploymentDir,
  buildApplication,
  createDockerSetup,
  createNginxConfig,
  createDeploymentScripts
};