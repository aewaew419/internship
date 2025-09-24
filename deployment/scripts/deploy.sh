#!/bin/bash

# Production Deployment Script
# สคริปต์สำหรับ deploy ระบบขึ้น production server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_DIR="/opt/internship-system"
BACKUP_DIR="/opt/internship-system/backups"
LOG_FILE="/var/log/internship-deployment.log"
DOMAIN=""
EMAIL=""

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        error "Git is not installed. Please install Git first."
    fi
    
    # Check available disk space (minimum 5GB)
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    if [[ $AVAILABLE_SPACE -lt 5242880 ]]; then
        error "Insufficient disk space. At least 5GB required."
    fi
    
    # Check available memory (minimum 2GB)
    AVAILABLE_MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [[ $AVAILABLE_MEMORY -lt 2048 ]]; then
        warning "Low available memory. At least 2GB recommended."
    fi
    
    success "System requirements check passed"
}

# Get user input
get_user_input() {
    echo -e "${PURPLE}🚀 Internship Management System - Production Deployment${NC}"
    echo -e "${PURPLE}================================================================${NC}"
    echo ""
    
    # Get domain name
    while [[ -z "$DOMAIN" ]]; do
        read -p "Enter your domain name (e.g., internship.university.ac.th): " DOMAIN
        if [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
            echo -e "${RED}Invalid domain name format${NC}"
            DOMAIN=""
        fi
    done
    
    # Get email for SSL certificate
    while [[ -z "$EMAIL" ]]; do
        read -p "Enter your email for SSL certificate (e.g., admin@university.ac.th): " EMAIL
        if [[ ! "$EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
            echo -e "${RED}Invalid email format${NC}"
            EMAIL=""
        fi
    done
    
    echo ""
    log "Domain: $DOMAIN"
    log "Email: $EMAIL"
    echo ""
    
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Deployment cancelled by user"
        exit 0
    fi
}

# Create deployment directory structure
create_directories() {
    log "Creating deployment directory structure..."
    
    sudo mkdir -p "$DEPLOYMENT_DIR"/{nginx/{ssl,conf.d},database/{backups,init},logs/{nginx,backend,frontend},uploads,monitoring/{prometheus,grafana/{dashboards,datasources}},scripts}
    sudo chown -R $USER:$USER "$DEPLOYMENT_DIR"
    
    success "Directory structure created"
}

# Clone or update repository
setup_repository() {
    log "Setting up repository..."
    
    if [[ -d "$DEPLOYMENT_DIR/app" ]]; then
        log "Updating existing repository..."
        cd "$DEPLOYMENT_DIR/app"
        git pull origin main
    else
        log "Cloning repository..."
        git clone https://github.com/Aew-Work/internship.git "$DEPLOYMENT_DIR/app"
        cd "$DEPLOYMENT_DIR/app"
    fi
    
    success "Repository setup completed"
}

# Generate secure passwords
generate_passwords() {
    log "Generating secure passwords..."
    
    DB_PASSWORD=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 64)
    REDIS_PASSWORD=$(openssl rand -base64 32)
    GRAFANA_PASSWORD=$(openssl rand -base64 16)
    
    success "Secure passwords generated"
}

# Create environment file
create_env_file() {
    log "Creating production environment file..."
    
    cat > "$DEPLOYMENT_DIR/.env.production" << EOF
# Production Environment Configuration
# Generated on $(date)

# Application Settings
NODE_ENV=production
GO_ENV=production
PORT=8080
FRONTEND_PORT=3000

# Domain Configuration
DOMAIN=$DOMAIN
SSL_EMAIL=$EMAIL

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=internship_prod
DB_USER=internship_user
DB_PASSWORD=$DB_PASSWORD

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_PASSWORD=$REDIS_PASSWORD

# CORS Configuration
CORS_ORIGIN=https://$DOMAIN

# Rate Limiting
RATE_LIMIT=100

# Logging
LOG_LEVEL=info
ENABLE_METRICS=true

# Monitoring
GRAFANA_PASSWORD=$GRAFANA_PASSWORD

# Security
SECURITY_HEADERS=true
HSTS_MAX_AGE=31536000

# File Upload
MAX_FILE_SIZE=10MB
UPLOAD_PATH=/app/uploads

# Features
ENABLE_REGISTRATION=true
ENABLE_EMAIL_VERIFICATION=false
ENABLE_PASSWORD_RESET=true
ENABLE_FILE_UPLOAD=true

# Notifications
NOTIFICATION_EMAIL_FROM=noreply@$DOMAIN
NOTIFICATION_EMAIL_NAME=Internship Management System

# Maintenance
MAINTENANCE_MODE=false
EOF

    chmod 600 "$DEPLOYMENT_DIR/.env.production"
    success "Environment file created"
}

# Create Nginx configuration
create_nginx_config() {
    log "Creating Nginx configuration..."
    
    cat > "$DEPLOYMENT_DIR/nginx/nginx.conf" << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Upstream servers
    upstream backend {
        server backend:8080 max_fails=3 fail_timeout=30s;
    }

    upstream frontend {
        server frontend:3000 max_fails=3 fail_timeout=30s;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name DOMAIN_PLACEHOLDER;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security Headers
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';" always;

        # API Routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # Login endpoint with stricter rate limiting
        location ~ ^/api/v1/(login|auth) {
            limit_req zone=login burst=3 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check (no rate limiting)
        location /health {
            proxy_pass http://backend/health;
            access_log off;
            proxy_set_header Host $host;
        }

        # Static files with caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://frontend;
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header X-Content-Type-Options nosniff;
        }

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Handle client-side routing
            try_files $uri $uri/ @fallback;
        }

        location @fallback {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

    # Replace domain placeholder
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" "$DEPLOYMENT_DIR/nginx/nginx.conf"
    
    success "Nginx configuration created"
}

# Create database initialization script
create_db_init() {
    log "Creating database initialization script..."
    
    cat > "$DEPLOYMENT_DIR/database/init.sql" << 'EOF'
-- Database initialization script
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'Asia/Bangkok';

-- Create indexes for better performance
-- These will be created after tables are created by the application

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE internship_prod TO internship_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO internship_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO internship_user;

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
EOF

    success "Database initialization script created"
}

# Setup SSL certificate
setup_ssl() {
    log "Setting up SSL certificate with Let's Encrypt..."
    
    # Install certbot if not already installed
    if ! command -v certbot &> /dev/null; then
        log "Installing certbot..."
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
    fi
    
    # Stop nginx if running
    sudo systemctl stop nginx 2>/dev/null || true
    
    # Get SSL certificate
    sudo certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        -d "$DOMAIN" \
        -d "www.$DOMAIN"
    
    # Copy certificates to deployment directory
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$DEPLOYMENT_DIR/nginx/ssl/"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$DEPLOYMENT_DIR/nginx/ssl/"
    sudo chown $USER:$USER "$DEPLOYMENT_DIR/nginx/ssl/"*
    
    # Setup auto-renewal
    (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'docker-compose -f $DEPLOYMENT_DIR/docker-compose.prod.yml restart nginx'") | sudo crontab -
    
    success "SSL certificate setup completed"
}

# Create monitoring configuration
create_monitoring_config() {
    log "Creating monitoring configuration..."
    
    # Prometheus configuration
    cat > "$DEPLOYMENT_DIR/monitoring/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'internship-backend'
    static_configs:
      - targets: ['backend:8080']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
    scrape_interval: 30s
EOF

    success "Monitoring configuration created"
}

# Create backup scripts
create_backup_scripts() {
    log "Creating backup scripts..."
    
    # Database backup script
    cat > "$DEPLOYMENT_DIR/scripts/backup-database.sh" << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/internship-system/database/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="internship_backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create database backup
docker exec internship_db pg_dump -U internship_user internship_prod > "$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

echo "Database backup completed: $BACKUP_FILE.gz"
EOF

    # Application backup script
    cat > "$DEPLOYMENT_DIR/scripts/backup-application.sh" << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/internship-system/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup configuration files
tar -czf "$BACKUP_DIR/config_backup_$DATE.tar.gz" \
    /opt/internship-system/.env.production \
    /opt/internship-system/docker-compose.prod.yml \
    /opt/internship-system/nginx/nginx.conf

# Backup uploaded files
if [ -d "/opt/internship-system/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" /opt/internship-system/uploads/
fi

# Keep only last 7 days of application backups
find "$BACKUP_DIR" -name "*_backup_*.tar.gz" -mtime +7 -delete

echo "Application backup completed"
EOF

    # Make scripts executable
    chmod +x "$DEPLOYMENT_DIR/scripts/"*.sh
    
    success "Backup scripts created"
}

# Create health check script
create_health_check() {
    log "Creating health check script..."
    
    cat > "$DEPLOYMENT_DIR/scripts/health-check.sh" << 'EOF'
#!/bin/bash

LOG_FILE="/var/log/internship-health.log"
EMAIL_ALERT="admin@DOMAIN_PLACEHOLDER"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

send_alert() {
    echo "$1" | mail -s "Internship System Alert" "$EMAIL_ALERT" 2>/dev/null || true
    log "ALERT: $1"
}

# Check backend health
if ! curl -f -s http://localhost/health > /dev/null; then
    send_alert "Backend health check failed"
    exit 1
fi

# Check database connection
if ! docker exec internship_db pg_isready -U internship_user > /dev/null 2>&1; then
    send_alert "Database health check failed"
    exit 1
fi

# Check disk space (alert if less than 1GB free)
AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
if [[ $AVAILABLE_SPACE -lt 1048576 ]]; then
    send_alert "Low disk space: $(df -h / | awk 'NR==2 {print $4}') available"
fi

# Check memory usage (alert if more than 90% used)
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [[ $MEMORY_USAGE -gt 90 ]]; then
    send_alert "High memory usage: ${MEMORY_USAGE}%"
fi

log "Health check passed"
EOF

    # Replace domain placeholder
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" "$DEPLOYMENT_DIR/scripts/health-check.sh"
    chmod +x "$DEPLOYMENT_DIR/scripts/health-check.sh"
    
    success "Health check script created"
}

# Setup cron jobs
setup_cron_jobs() {
    log "Setting up cron jobs..."
    
    # Add cron jobs
    (crontab -l 2>/dev/null; cat << EOF
# Internship Management System - Automated Tasks

# Database backup (daily at 2 AM)
0 2 * * * $DEPLOYMENT_DIR/scripts/backup-database.sh

# Application backup (weekly on Sunday at 3 AM)
0 3 * * 0 $DEPLOYMENT_DIR/scripts/backup-application.sh

# Health check (every 5 minutes)
*/5 * * * * $DEPLOYMENT_DIR/scripts/health-check.sh

# Log rotation (daily at 1 AM)
0 1 * * * find $DEPLOYMENT_DIR/logs -name "*.log" -size +100M -exec gzip {} \;
EOF
    ) | crontab -
    
    success "Cron jobs setup completed"
}

# Deploy application
deploy_application() {
    log "Deploying application..."
    
    cd "$DEPLOYMENT_DIR"
    
    # Copy docker-compose file
    cp app/deployment/docker-compose.prod.yml .
    
    # Build and start services
    docker-compose -f docker-compose.prod.yml --env-file .env.production build
    docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Check if services are running
    if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        error "Some services failed to start. Check logs with: docker-compose -f docker-compose.prod.yml logs"
    fi
    
    success "Application deployed successfully"
}

# Run post-deployment tests
run_post_deployment_tests() {
    log "Running post-deployment tests..."
    
    # Wait a bit more for services to fully initialize
    sleep 30
    
    # Test health endpoint
    if curl -f -s "https://$DOMAIN/health" > /dev/null; then
        success "Health endpoint test passed"
    else
        error "Health endpoint test failed"
    fi
    
    # Test frontend
    if curl -f -s "https://$DOMAIN" > /dev/null; then
        success "Frontend test passed"
    else
        error "Frontend test failed"
    fi
    
    # Test API
    if curl -f -s "https://$DOMAIN/api/v1/test" > /dev/null; then
        success "API test passed"
    else
        warning "API test failed - this might be expected if authentication is required"
    fi
    
    success "Post-deployment tests completed"
}

# Setup firewall
setup_firewall() {
    log "Setting up firewall..."
    
    # Install ufw if not present
    if ! command -v ufw &> /dev/null; then
        sudo apt update
        sudo apt install -y ufw
    fi
    
    # Configure firewall
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
    
    success "Firewall setup completed"
}

# Print deployment summary
print_summary() {
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${PURPLE}================================================================${NC}"
    echo ""
    echo -e "${CYAN}📊 Deployment Summary:${NC}"
    echo -e "   Domain: https://$DOMAIN"
    echo -e "   SSL Certificate: ✅ Installed"
    echo -e "   Database: ✅ PostgreSQL"
    echo -e "   Cache: ✅ Redis"
    echo -e "   Reverse Proxy: ✅ Nginx"
    echo -e "   Monitoring: ✅ Available"
    echo -e "   Backups: ✅ Automated"
    echo -e "   Health Checks: ✅ Enabled"
    echo ""
    echo -e "${CYAN}🔐 Security Features:${NC}"
    echo -e "   ✅ HTTPS with Let's Encrypt"
    echo -e "   ✅ Security Headers"
    echo -e "   ✅ Rate Limiting"
    echo -e "   ✅ Firewall Configured"
    echo -e "   ✅ Secure Passwords Generated"
    echo ""
    echo -e "${CYAN}📁 Important Files:${NC}"
    echo -e "   Environment: $DEPLOYMENT_DIR/.env.production"
    echo -e "   Docker Compose: $DEPLOYMENT_DIR/docker-compose.prod.yml"
    echo -e "   Nginx Config: $DEPLOYMENT_DIR/nginx/nginx.conf"
    echo -e "   Logs: $DEPLOYMENT_DIR/logs/"
    echo -e "   Backups: $DEPLOYMENT_DIR/database/backups/"
    echo ""
    echo -e "${CYAN}🛠️ Management Commands:${NC}"
    echo -e "   View logs: docker-compose -f $DEPLOYMENT_DIR/docker-compose.prod.yml logs"
    echo -e "   Restart services: docker-compose -f $DEPLOYMENT_DIR/docker-compose.prod.yml restart"
    echo -e "   Update application: cd $DEPLOYMENT_DIR && git pull && docker-compose -f docker-compose.prod.yml build && docker-compose -f docker-compose.prod.yml up -d"
    echo ""
    echo -e "${YELLOW}⚠️  Important Notes:${NC}"
    echo -e "   • Save the generated passwords from $DEPLOYMENT_DIR/.env.production"
    echo -e "   • Monitor logs regularly: tail -f $LOG_FILE"
    echo -e "   • Database backups run daily at 2 AM"
    echo -e "   • SSL certificate auto-renews via cron"
    echo -e "   • Health checks run every 5 minutes"
    echo ""
    echo -e "${GREEN}🚀 Your Internship Management System is now live at: https://$DOMAIN${NC}"
    echo ""
}

# Main deployment process
main() {
    echo -e "${PURPLE}🚀 Starting Production Deployment...${NC}"
    echo ""
    
    check_root
    check_requirements
    get_user_input
    create_directories
    setup_repository
    generate_passwords
    create_env_file
    create_nginx_config
    create_db_init
    create_monitoring_config
    create_backup_scripts
    create_health_check
    setup_cron_jobs
    setup_firewall
    setup_ssl
    deploy_application
    run_post_deployment_tests
    print_summary
    
    log "Deployment completed successfully"
}

# Run main function
main "$@"