# Quick Deployment Guide - Hostatom VPS

## 🚀 One-Command Setup

For experienced users who want to deploy quickly:

```bash
# 1. Run server setup (as root)
curl -sSL https://raw.githubusercontent.com/your-repo/internship/main/scripts/setup-server.sh | bash

# 2. Switch to app user and deploy
sudo su - internship
git clone https://github.com/your-repo/internship.git
cd internship
./scripts/deploy-production.sh
```

## 📋 Pre-Deployment Checklist

- [ ] VPS with Ubuntu 20.04/22.04 LTS
- [ ] Domain name configured (DNS A record)
- [ ] SSH access to VPS
- [ ] 4GB+ RAM, 2+ CPU cores, 50GB+ storage

## ⚡ Quick Steps

### 1. Initial Server Setup (5 minutes)
```bash
# Connect to your VPS
ssh root@your-vps-ip

# Download and run setup script
wget https://raw.githubusercontent.com/your-repo/internship/main/scripts/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

### 2. Configure Environment (2 minutes)
```bash
# Switch to app user
sudo su - internship

# Copy and edit environment template
cp .env.template .env.production
nano .env.production

# Update these critical values:
# - DB_PASSWORD (from ~/.db_credentials)
# - JWT_SECRET (generate: openssl rand -base64 32)
# - DOMAIN URLs
```

### 3. Deploy Application (3 minutes)
```bash
# Clone repository
git clone https://github.com/your-repo/internship.git
cd internship

# Run deployment
./scripts/deploy-production.sh
```

### 4. Setup SSL (2 minutes)
```bash
# Install SSL certificates
sudo certbot --nginx -d internship.yourdomain.com
sudo certbot --nginx -d api.internship.yourdomain.com
```

### 5. Verify Deployment (1 minute)
```bash
# Check application status
./scripts/health-check.sh

# View running processes
pm2 status

# Test endpoints
curl https://internship.yourdomain.com
curl https://api.internship.yourdomain.com/health
```

## 🔧 Environment Variables

### Critical Variables (Must Configure)
```env
# Database
DB_PASSWORD=your_secure_password_from_db_credentials_file

# Security
JWT_SECRET=your_32_character_jwt_secret_here
SESSION_SECRET=your_32_character_session_secret_here

# URLs
FRONTEND_URL=https://internship.yourdomain.com
API_URL=https://api.internship.yourdomain.com
```

### Optional Variables
```env
# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# External Services
GOOGLE_MAPS_API_KEY=your_api_key
RECAPTCHA_SITE_KEY=your_site_key
```

## 📊 Post-Deployment

### Verify Everything Works
```bash
# Check all services
systemctl status nginx mysql
pm2 status

# Run health check
./scripts/health-check.sh

# Check logs
pm2 logs
tail -f /var/log/internship/*.log
```

### Setup Monitoring
```bash
# Add health check to cron (every 5 minutes)
crontab -e
# Add: */5 * * * * /home/internship/internship/scripts/health-check.sh quick

# Monitor resources
htop
df -h
free -h
```

## 🛠️ Common Commands

```bash
# Application Management
pm2 restart all          # Restart applications
pm2 logs                 # View logs
pm2 monit               # Monitor resources

# Deployment
./scripts/deploy-production.sh        # Deploy updates
./scripts/deploy-production.sh status # Check status
./scripts/deploy-production.sh logs   # View logs

# Health Monitoring
./scripts/health-check.sh        # Full health check
./scripts/health-check.sh quick  # Quick check
./scripts/health-check.sh status # System status

# Database
mysql -u internship_user -p internship_prod  # Connect to DB
/home/internship/scripts/backup-database.sh  # Manual backup

# SSL Certificates
sudo certbot certificates    # Check certificates
sudo certbot renew         # Renew certificates

# System
sudo systemctl status nginx mysql  # Check services
sudo ufw status                    # Check firewall
sudo fail2ban-client status       # Check security
```

## 🚨 Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs

# Check environment variables
pm2 env 0

# Restart services
pm2 restart all
sudo systemctl restart nginx
```

### Database Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Check connection
mysql -u internship_user -p internship_prod

# Check logs
sudo tail -f /var/log/mysql/error.log
```

### SSL Certificate Issues
```bash
# Check certificates
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Check Nginx config
sudo nginx -t
```

### High Resource Usage
```bash
# Check memory and CPU
htop

# Check disk space
df -h

# Check PM2 processes
pm2 monit

# Restart if needed
pm2 restart all
```

## 📞 Support

### Log Locations
- Application: `/var/log/internship/`
- Nginx: `/var/log/nginx/`
- MySQL: `/var/log/mysql/`
- System: `/var/log/syslog`

### Important Files
- Environment: `/home/internship/.env.production`
- Database credentials: `/home/internship/.db_credentials`
- Nginx config: `/etc/nginx/sites-available/internship`
- PM2 config: `/home/internship/internship/apps/*/ecosystem.config.js`

### Useful Commands
```bash
# System monitoring
htop                    # Resource monitor
netstat -tulpn         # Network connections
lsof -i :3000          # Check port usage
journalctl -u nginx -f # Nginx logs

# Application monitoring
pm2 monit              # PM2 monitor
pm2 logs --lines 100   # Recent logs
curl -I https://your-domain.com  # Test HTTP
```

## 🎯 Success Indicators

✅ **Deployment Successful When:**
- PM2 shows all processes as "online"
- Health check passes all tests
- Frontend loads at https://internship.yourdomain.com
- API responds at https://api.internship.yourdomain.com/health
- SSL certificates are valid and auto-renewing
- Database backups are running daily
- System resources are within normal limits

## 🔄 Updates

### Deploy Updates
```bash
cd /home/internship/internship
./scripts/deploy-production.sh
```

### Rollback if Needed
```bash
./scripts/deploy-production.sh rollback
```

---

**Total deployment time: ~15 minutes** ⏱️

Need help? Check the full [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.