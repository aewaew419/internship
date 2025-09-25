# Production Deployment Guide - Hostatom VPS

## Overview

This guide provides step-by-step instructions for deploying the Internship Management System to a Hostatom VPS with real production data.

## System Requirements

### VPS Specifications (Recommended)
- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended)
- **Storage**: 50GB+ SSD
- **OS**: Ubuntu 20.04 LTS or 22.04 LTS
- **Network**: Public IP with ports 80, 443, 22 open

### Software Requirements
- **Node.js**: 18.x or 20.x LTS
- **Go**: 1.21+ 
- **MySQL**: 8.0+
- **Nginx**: Latest stable
- **PM2**: Process manager for Node.js
- **Certbot**: SSL certificate management
- **Git**: Version control

## Pre-Deployment Checklist

### 1. Domain and DNS Setup
- [ ] Domain name configured (e.g., `internship.yourdomain.com`)
- [ ] DNS A record pointing to VPS IP
- [ ] Subdomain for API (e.g., `api.internship.yourdomain.com`)

### 2. VPS Access
- [ ] SSH access to VPS
- [ ] Sudo privileges
- [ ] Firewall configured (UFW recommended)

### 3. Database Preparation
- [ ] MySQL server installed and secured
- [ ] Production database created
- [ ] Database user with appropriate privileges
- [ ] Database backup strategy planned

## Step 1: Initial VPS Setup

### Connect to VPS
```bash
ssh root@your-vps-ip
# or
ssh your-username@your-vps-ip
```

### Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip software-properties-common
```

### Create Application User
```bash
sudo adduser internship
sudo usermod -aG sudo internship
sudo su - internship
```

### Configure Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000  # Temporary for setup
sudo ufw allow 3333  # Temporary for setup
sudo ufw enable
```

## Step 2: Install Required Software

### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Install Go
```bash
wget https://go.dev/dl/go1.22.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz

# Add to PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export GOPATH=$HOME/go' >> ~/.bashrc
echo 'export PATH=$PATH:$GOPATH/bin' >> ~/.bashrc
source ~/.bashrc

# Verify installation
go version
```

### Install MySQL
```bash
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Create production database
sudo mysql -u root -p
```

```sql
CREATE DATABASE internship_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'internship_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON internship_prod.* TO 'internship_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Install PM2
```bash
sudo npm install -g pm2
```

### Install Certbot (SSL)
```bash
sudo apt install -y certbot python3-certbot-nginx
```

## Step 3: Application Deployment

### Clone Repository
```bash
cd /home/internship
git clone https://github.com/your-username/internship.git
cd internship
```

### Backend Setup

#### Navigate to Backend
```bash
cd apps/backend
```

#### Configure Environment
```bash
cp .env.example .env.production
nano .env.production
```

#### Production Environment Variables
```env
# Database Configuration
DATABASE_URL=mysql://internship_user:your_secure_password@localhost:3306/internship_prod
DB_HOST=localhost
DB_PORT=3306
DB_NAME=internship_prod
DB_USER=internship_user
DB_PASSWORD=your_secure_password

# Application Configuration
PORT=3333
ENVIRONMENT=production
APP_URL=https://api.internship.yourdomain.com

# Security
JWT_SECRET=your_very_secure_jwt_secret_key_here_minimum_32_characters
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# CORS Configuration
CORS_ORIGIN=https://internship.yourdomain.com
ALLOWED_ORIGINS=https://internship.yourdomain.com,https://api.internship.yourdomain.com

# File Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document

# Email Configuration (if needed)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
SMTP_FROM=noreply@yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/internship/backend.log

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Session Configuration
SESSION_SECRET=your_session_secret_key_here
SESSION_MAX_AGE=86400000

# File Storage
STORAGE_PATH=/home/internship/storage
TEMP_PATH=/tmp/internship

# Backup Configuration
BACKUP_PATH=/home/internship/backups
BACKUP_RETENTION_DAYS=30
```

#### Build and Install Dependencies
```bash
go mod download
go mod tidy

# Build the application
go build -o bin/internship-backend ./cmd/server/main.go

# Make executable
chmod +x bin/internship-backend
```

#### Create Log Directory
```bash
sudo mkdir -p /var/log/internship
sudo chown internship:internship /var/log/internship
```

#### Create Storage Directories
```bash
mkdir -p /home/internship/storage/{uploads,temp,exports}
mkdir -p /home/internship/backups
```

### Frontend Setup

#### Navigate to Frontend
```bash
cd ../frontend
```

#### Configure Environment
```bash
cp .env.example .env.production
nano .env.production
```

#### Production Environment Variables
```env
# Application Configuration
NEXT_PUBLIC_APP_NAME=Internship Management System
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_ENV=production

# API Configuration
NEXT_PUBLIC_API_URL=https://api.internship.yourdomain.com
NEXT_PUBLIC_API_TIMEOUT=30000

# Authentication
NEXT_PUBLIC_JWT_EXPIRES_IN=24h
NEXT_PUBLIC_SESSION_TIMEOUT=1800000

# File Upload
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_ALLOWED_FILE_TYPES=image/*,application/pdf,.doc,.docx

# Features
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=false

# External Services
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_GA_TRACKING_ID=your_google_analytics_id
```

#### Install Dependencies and Build
```bash
npm install --production

# Build the application
npm run build

# Verify build
ls -la .next/
```

## Step 4: Database Migration and Seeding

### Run Database Migrations
```bash
cd /home/internship/internship/apps/backend

# Run migrations (if you have migration files)
# go run cmd/migrate/main.go

# Or create tables manually using your schema
mysql -u internship_user -p internship_prod < database/schema.sql
```

### Seed Production Data
```bash
# If you have a seeding script
# go run cmd/seed/main.go --env=production

# Or import initial data
mysql -u internship_user -p internship_prod < database/initial_data.sql
```

## Step 5: Process Management with PM2

### Backend PM2 Configuration
```bash
cd /home/internship/internship/apps/backend
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'internship-backend',
    script: './bin/internship-backend',
    cwd: '/home/internship/internship/apps/backend',
    env: {
      NODE_ENV: 'production',
      PORT: 3333
    },
    env_file: '.env.production',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    error_file: '/var/log/internship/backend-error.log',
    out_file: '/var/log/internship/backend-out.log',
    log_file: '/var/log/internship/backend.log',
    time: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
```

### Frontend PM2 Configuration
```bash
cd /home/internship/internship/apps/frontend
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'internship-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/home/internship/internship/apps/frontend',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '1G',
    error_file: '/var/log/internship/frontend-error.log',
    out_file: '/var/log/internship/frontend-out.log',
    log_file: '/var/log/internship/frontend.log',
    time: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
```

### Start Applications
```bash
# Start backend
cd /home/internship/internship/apps/backend
pm2 start ecosystem.config.js

# Start frontend
cd /home/internship/internship/apps/frontend
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
# Follow the instructions provided by the command
```

## Step 6: Nginx Configuration

### Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/internship
```

```nginx
# Frontend Configuration
server {
    listen 80;
    server_name internship.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name internship.yourdomain.com;
    
    # SSL Configuration (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/internship.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/internship.yourdomain.com/privkey.pem;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Frontend Proxy
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
        proxy_read_timeout 86400;
    }
    
    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # File uploads
    client_max_body_size 10M;
}

# Backend API Configuration
server {
    listen 80;
    server_name api.internship.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.internship.yourdomain.com;
    
    # SSL Configuration (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/api.internship.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.internship.yourdomain.com/privkey.pem;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # CORS Headers
    add_header Access-Control-Allow-Origin "https://internship.yourdomain.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
    
    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin "https://internship.yourdomain.com";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
        add_header Access-Control-Max-Age 1728000;
        add_header Content-Type "text/plain; charset=utf-8";
        add_header Content-Length 0;
        return 204;
    }
    
    # API Proxy
    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # File uploads
    client_max_body_size 10M;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
}
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/internship /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 7: SSL Certificate Setup

### Install SSL Certificates
```bash
# For main domain
sudo certbot --nginx -d internship.yourdomain.com

# For API subdomain
sudo certbot --nginx -d api.internship.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### Setup Auto-renewal
```bash
sudo crontab -e
```

Add this line:
```bash
0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 8: Monitoring and Logging

### Setup Log Rotation
```bash
sudo nano /etc/logrotate.d/internship
```

```bash
/var/log/internship/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 internship internship
    postrotate
        pm2 reload all
    endscript
}
```

### Setup System Monitoring
```bash
# Install htop for system monitoring
sudo apt install -y htop

# Monitor PM2 processes
pm2 monit

# Check application logs
pm2 logs

# Check system resources
htop
```

## Step 9: Database Backup Strategy

### Create Backup Script
```bash
nano /home/internship/scripts/backup-database.sh
```

```bash
#!/bin/bash

# Database backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/internship/backups"
DB_NAME="internship_prod"
DB_USER="internship_user"
DB_PASS="your_secure_password"

# Create backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: backup_$DATE.sql.gz"
```

```bash
chmod +x /home/internship/scripts/backup-database.sh
```

### Schedule Backups
```bash
crontab -e
```

Add:
```bash
0 2 * * * /home/internship/scripts/backup-database.sh
```

## Step 10: Security Hardening

### Update SSH Configuration
```bash
sudo nano /etc/ssh/sshd_config
```

```bash
# Disable root login
PermitRootLogin no

# Change default port (optional)
Port 2222

# Disable password authentication (use SSH keys)
PasswordAuthentication no
PubkeyAuthentication yes

# Limit login attempts
MaxAuthTries 3
```

```bash
sudo systemctl restart ssh
```

### Install Fail2Ban
```bash
sudo apt install -y fail2ban

sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Step 11: Final Verification

### Check All Services
```bash
# Check PM2 processes
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check MySQL status
sudo systemctl status mysql

# Check SSL certificates
sudo certbot certificates

# Test application endpoints
curl -I https://internship.yourdomain.com
curl -I https://api.internship.yourdomain.com/health
```

### Performance Testing
```bash
# Test frontend response time
curl -w "@curl-format.txt" -o /dev/null -s https://internship.yourdomain.com

# Test API response time
curl -w "@curl-format.txt" -o /dev/null -s https://api.internship.yourdomain.com/api/health
```

Create `curl-format.txt`:
```
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

## Troubleshooting

### Common Issues

1. **Application Won't Start**
   ```bash
   # Check PM2 logs
   pm2 logs
   
   # Check environment variables
   pm2 env 0
   
   # Restart applications
   pm2 restart all
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connection
   mysql -u internship_user -p internship_prod
   
   # Check MySQL status
   sudo systemctl status mysql
   
   # Check MySQL logs
   sudo tail -f /var/log/mysql/error.log
   ```

3. **SSL Certificate Issues**
   ```bash
   # Check certificate status
   sudo certbot certificates
   
   # Renew certificates
   sudo certbot renew
   
   # Check Nginx configuration
   sudo nginx -t
   ```

4. **High Memory Usage**
   ```bash
   # Check memory usage
   free -h
   
   # Check PM2 memory usage
   pm2 monit
   
   # Restart applications if needed
   pm2 restart all
   ```

### Log Locations
- **Application Logs**: `/var/log/internship/`
- **Nginx Logs**: `/var/log/nginx/`
- **MySQL Logs**: `/var/log/mysql/`
- **System Logs**: `/var/log/syslog`

### Useful Commands
```bash
# Monitor system resources
htop

# Monitor disk usage
df -h

# Monitor network connections
netstat -tulpn

# Check open files
lsof -i :3000
lsof -i :3333

# Monitor PM2 processes
pm2 monit

# View real-time logs
pm2 logs --lines 100
```

## Maintenance

### Regular Tasks
- [ ] Update system packages monthly
- [ ] Monitor disk space usage
- [ ] Review application logs weekly
- [ ] Test backup restoration quarterly
- [ ] Update SSL certificates (automatic)
- [ ] Monitor application performance
- [ ] Review security logs

### Update Procedure
```bash
# 1. Backup database
/home/internship/scripts/backup-database.sh

# 2. Pull latest code
cd /home/internship/internship
git pull origin main

# 3. Update backend
cd apps/backend
go mod download
go build -o bin/internship-backend ./cmd/server/main.go

# 4. Update frontend
cd ../frontend
npm install --production
npm run build

# 5. Restart applications
pm2 restart all

# 6. Verify deployment
curl -I https://internship.yourdomain.com
curl -I https://api.internship.yourdomain.com/health
```

## Support

### Emergency Contacts
- **System Administrator**: your-email@domain.com
- **Database Administrator**: dba@domain.com
- **Development Team**: dev-team@domain.com

### Monitoring URLs
- **Frontend**: https://internship.yourdomain.com
- **API Health**: https://api.internship.yourdomain.com/health
- **PM2 Monitoring**: `pm2 monit` (SSH required)

---

**Deployment completed successfully!** 🎉

Your Internship Management System is now running in production on Hostatom VPS with:
- ✅ SSL certificates
- ✅ Process management
- ✅ Database backups
- ✅ Security hardening
- ✅ Monitoring and logging