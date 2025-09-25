#!/bin/bash

# Server Setup Script for Hostatom VPS
# This script sets up the entire server environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_USER="internship"
DOMAIN="internship.yourdomain.com"
API_DOMAIN="api.internship.yourdomain.com"
DB_NAME="internship_prod"
DB_USER="internship_user"

# Functions
log() {
    echo -e "${1}"
}

error_exit() {
    log "${RED}❌ Error: ${1}${NC}"
    exit 1
}

success() {
    log "${GREEN}✅ ${1}${NC}"
}

warning() {
    log "${YELLOW}⚠️  ${1}${NC}"
}

info() {
    log "${BLUE}ℹ️  ${1}${NC}"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error_exit "This script must be run as root"
    fi
}

# Update system
update_system() {
    info "Updating system packages..."
    apt update && apt upgrade -y
    apt install -y curl wget git unzip software-properties-common build-essential
    success "System updated"
}

# Create application user
create_user() {
    info "Creating application user..."
    
    if id "$APP_USER" &>/dev/null; then
        warning "User $APP_USER already exists"
    else
        adduser --disabled-password --gecos "" "$APP_USER"
        usermod -aG sudo "$APP_USER"
        success "User $APP_USER created"
    fi
    
    # Create necessary directories
    sudo -u "$APP_USER" mkdir -p "/home/$APP_USER"/{storage,backups,scripts}
    sudo -u "$APP_USER" mkdir -p "/home/$APP_USER/storage"/{uploads,temp,exports}
}

# Configure firewall
setup_firewall() {
    info "Configuring firewall..."
    
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow OpenSSH
    ufw allow 'Nginx Full'
    ufw allow 3000  # Temporary for setup
    ufw allow 3333  # Temporary for setup
    ufw --force enable
    
    success "Firewall configured"
}

# Install Node.js
install_nodejs() {
    info "Installing Node.js..."
    
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    
    success "Node.js installed: $node_version, npm: $npm_version"
}

# Install Go
install_go() {
    info "Installing Go..."
    
    GO_VERSION="1.22.0"
    wget "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz"
    tar -C /usr/local -xzf "go${GO_VERSION}.linux-amd64.tar.gz"
    rm "go${GO_VERSION}.linux-amd64.tar.gz"
    
    # Add to PATH for all users
    echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile
    echo 'export GOPATH=$HOME/go' >> /etc/profile
    echo 'export PATH=$PATH:$GOPATH/bin' >> /etc/profile
    
    # Add to app user's profile
    sudo -u "$APP_USER" bash -c 'echo "export PATH=\$PATH:/usr/local/go/bin" >> ~/.bashrc'
    sudo -u "$APP_USER" bash -c 'echo "export GOPATH=\$HOME/go" >> ~/.bashrc'
    sudo -u "$APP_USER" bash -c 'echo "export PATH=\$PATH:\$GOPATH/bin" >> ~/.bashrc'
    
    success "Go installed"
}

# Install MySQL
install_mysql() {
    info "Installing MySQL..."
    
    # Set non-interactive mode
    export DEBIAN_FRONTEND=noninteractive
    
    # Install MySQL
    apt install -y mysql-server
    
    # Start and enable MySQL
    systemctl start mysql
    systemctl enable mysql
    
    success "MySQL installed"
    
    # Secure MySQL installation
    info "Please run 'mysql_secure_installation' manually after this script completes"
}

# Setup MySQL database
setup_database() {
    info "Setting up database..."
    
    # Generate random password
    DB_PASSWORD=$(openssl rand -base64 32)
    
    # Create database and user
    mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    # Save credentials
    cat > "/home/$APP_USER/.db_credentials" <<EOF
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
EOF
    
    chown "$APP_USER:$APP_USER" "/home/$APP_USER/.db_credentials"
    chmod 600 "/home/$APP_USER/.db_credentials"
    
    success "Database setup completed"
    info "Database credentials saved to /home/$APP_USER/.db_credentials"
}

# Install Nginx
install_nginx() {
    info "Installing Nginx..."
    
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    success "Nginx installed"
}

# Install PM2
install_pm2() {
    info "Installing PM2..."
    
    npm install -g pm2
    
    success "PM2 installed"
}

# Install Certbot
install_certbot() {
    info "Installing Certbot..."
    
    apt install -y certbot python3-certbot-nginx
    
    success "Certbot installed"
}

# Setup logging
setup_logging() {
    info "Setting up logging..."
    
    # Create log directory
    mkdir -p /var/log/internship
    chown "$APP_USER:$APP_USER" /var/log/internship
    
    # Setup logrotate
    cat > /etc/logrotate.d/internship <<EOF
/var/log/internship/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $APP_USER $APP_USER
    postrotate
        sudo -u $APP_USER pm2 reload all
    endscript
}
EOF
    
    success "Logging setup completed"
}

# Setup backup script
setup_backup() {
    info "Setting up backup system..."
    
    cat > "/home/$APP_USER/scripts/backup-database.sh" <<'EOF'
#!/bin/bash

# Load database credentials
source ~/.db_credentials

# Configuration
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/internship/backups"

# Create backup
mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_DIR/backup_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/backup_$DATE.sql"

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: backup_$DATE.sql.gz"
EOF
    
    chmod +x "/home/$APP_USER/scripts/backup-database.sh"
    chown "$APP_USER:$APP_USER" "/home/$APP_USER/scripts/backup-database.sh"
    
    # Setup cron job for backups
    sudo -u "$APP_USER" bash -c '(crontab -l 2>/dev/null; echo "0 2 * * * /home/internship/scripts/backup-database.sh") | crontab -'
    
    success "Backup system setup completed"
}

# Install security tools
install_security() {
    info "Installing security tools..."
    
    # Install Fail2Ban
    apt install -y fail2ban
    
    # Configure Fail2Ban
    cat > /etc/fail2ban/jail.local <<EOF
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
EOF
    
    systemctl enable fail2ban
    systemctl start fail2ban
    
    success "Security tools installed"
}

# Generate SSL certificates
setup_ssl() {
    info "Setting up SSL certificates..."
    
    warning "SSL certificate setup requires manual intervention"
    info "After this script completes, run:"
    info "  sudo certbot --nginx -d $DOMAIN"
    info "  sudo certbot --nginx -d $API_DOMAIN"
    
    # Setup auto-renewal
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    success "SSL auto-renewal configured"
}

# Create Nginx configuration
create_nginx_config() {
    info "Creating Nginx configuration..."
    
    cat > /etc/nginx/sites-available/internship <<EOF
# Frontend Configuration
server {
    listen 80;
    server_name $DOMAIN;
    
    # Redirect HTTP to HTTPS (will be uncommented after SSL setup)
    # return 301 https://\$server_name\$request_uri;
    
    # Temporary configuration for initial setup
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

# Backend API Configuration
server {
    listen 80;
    server_name $API_DOMAIN;
    
    # Redirect HTTP to HTTPS (will be uncommented after SSL setup)
    # return 301 https://\$server_name\$request_uri;
    
    # Temporary configuration for initial setup
    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # File uploads
    client_max_body_size 10M;
}
EOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/internship /etc/nginx/sites-enabled/
    
    # Test configuration
    nginx -t || error_exit "Nginx configuration test failed"
    
    # Reload Nginx
    systemctl reload nginx
    
    success "Nginx configuration created"
}

# Create environment template
create_env_template() {
    info "Creating environment template..."
    
    cat > "/home/$APP_USER/.env.template" <<EOF
# Database Configuration
DATABASE_URL=mysql://$DB_USER:YOUR_DB_PASSWORD@localhost:3306/$DB_NAME
DB_HOST=localhost
DB_PORT=3306
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD

# Application Configuration
PORT=3333
ENVIRONMENT=production
APP_URL=https://$API_DOMAIN

# Security
JWT_SECRET=YOUR_VERY_SECURE_JWT_SECRET_KEY_HERE_MINIMUM_32_CHARACTERS
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# CORS Configuration
CORS_ORIGIN=https://$DOMAIN
ALLOWED_ORIGINS=https://$DOMAIN,https://$API_DOMAIN

# File Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/internship/backend.log

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Session Configuration
SESSION_SECRET=YOUR_SESSION_SECRET_KEY_HERE
SESSION_MAX_AGE=86400000

# File Storage
STORAGE_PATH=/home/internship/storage
TEMP_PATH=/tmp/internship
EOF
    
    chown "$APP_USER:$APP_USER" "/home/$APP_USER/.env.template"
    
    success "Environment template created"
}

# Show final instructions
show_final_instructions() {
    log ""
    log "${GREEN}🎉 Server setup completed successfully!${NC}"
    log ""
    log "${BLUE}Next steps:${NC}"
    log "1. Configure your domain DNS to point to this server's IP"
    log "2. Run: sudo mysql_secure_installation"
    log "3. Setup SSL certificates:"
    log "   sudo certbot --nginx -d $DOMAIN"
    log "   sudo certbot --nginx -d $API_DOMAIN"
    log "4. Switch to app user: sudo su - $APP_USER"
    log "5. Clone your repository: git clone https://github.com/your-repo/internship.git"
    log "6. Configure environment variables using the template at ~/.env.template"
    log "7. Run the deployment script: ./scripts/deploy-production.sh"
    log ""
    log "${YELLOW}Important files:${NC}"
    log "- Database credentials: /home/$APP_USER/.db_credentials"
    log "- Environment template: /home/$APP_USER/.env.template"
    log "- Backup script: /home/$APP_USER/scripts/backup-database.sh"
    log "- Nginx config: /etc/nginx/sites-available/internship"
    log ""
    log "${BLUE}Useful commands:${NC}"
    log "- Check services: systemctl status nginx mysql"
    log "- View logs: journalctl -u nginx -f"
    log "- Monitor resources: htop"
    log "- Check firewall: ufw status"
    log ""
}

# Main setup function
main() {
    log "${BLUE}🚀 Starting server setup for Hostatom VPS...${NC}"
    log "Domain: $DOMAIN"
    log "API Domain: $API_DOMAIN"
    log "App User: $APP_USER"
    log ""
    
    check_root
    update_system
    create_user
    setup_firewall
    install_nodejs
    install_go
    install_mysql
    setup_database
    install_nginx
    install_pm2
    install_certbot
    setup_logging
    setup_backup
    install_security
    create_nginx_config
    create_env_template
    setup_ssl
    show_final_instructions
}

# Run main function
main "$@"