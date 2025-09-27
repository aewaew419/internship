#!/bin/bash

# VPS Deployment Script for internship.samartsolution.com
# Optimized for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="203.170.129.199"  # Update with your actual VPS IP
VPS_USER="root"           # Update with your VPS user
VPS_PORT="22"
DOMAIN="internship.samartsolution.com"
APP_DIR="/opt/internship"
BACKUP_DIR="/opt/backups"

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

# Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."
    
    # Check if SSH key exists or password auth works
    if ! ssh -o ConnectTimeout=5 -o BatchMode=yes -p "$VPS_PORT" "$VPS_USER@$VPS_IP" exit 2>/dev/null; then
        warning "SSH key authentication failed, will use password authentication"
    fi
    
    # Check if required commands exist locally
    command -v rsync >/dev/null 2>&1 || error_exit "rsync is not installed locally"
    command -v ssh >/dev/null 2>&1 || error_exit "ssh is not installed locally"
    
    success "Prerequisites check passed"
}

# Create deployment script for VPS
create_vps_deployment_script() {
    info "Creating VPS deployment script..."
    
    cat > /tmp/vps_deploy.sh << 'EOF'
#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/opt/internship"
BACKUP_DIR="/opt/backups"
DOMAIN="internship.samartsolution.com"

log() { echo -e "${1}"; }
success() { log "${GREEN}✅ ${1}${NC}"; }
info() { log "${BLUE}ℹ️  ${1}${NC}"; }
warning() { log "${YELLOW}⚠️  ${1}${NC}"; }
error_exit() { log "${RED}❌ ${1}${NC}"; exit 1; }

# Update system packages
update_system() {
    info "Updating system packages..."
    apt update && apt upgrade -y
    apt install -y curl wget git unzip build-essential nginx certbot python3-certbot-nginx
    success "System updated"
}

# Install Docker and Docker Compose
install_docker() {
    info "Installing Docker..."
    
    if command -v docker >/dev/null 2>&1; then
        success "Docker already installed"
        return
    fi
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Start Docker
    systemctl start docker
    systemctl enable docker
    
    success "Docker installed and started"
}

# Setup application directory
setup_app_directory() {
    info "Setting up application directory..."
    
    mkdir -p "$APP_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p /var/log/internship
    
    success "Directories created"
}

# Create error pages
create_error_pages() {
    info "Creating error pages..."
    
    mkdir -p /var/www/html
    
    cat > /var/www/html/50x.html << 'ERROREOF'
<!DOCTYPE html>
<html>
<head>
    <title>Service Temporarily Unavailable</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #333; }
        p { color: #666; }
    </style>
</head>
<body>
    <h1>Service Temporarily Unavailable</h1>
    <p>The internship management system is currently being updated.</p>
    <p>Please try again in a few moments.</p>
</body>
</html>
ERROREOF
    
    success "Error pages created"
}

# Create production environment file
create_production_env() {
    info "Creating production environment file..."
    
    cat > "$APP_DIR/.env.production" << 'ENVEOF'
# Database Configuration
DB_NAME=internship_prod
DB_USER=internship_user
DB_PASSWORD=secure_password_change_this
DB_PORT=5432

# Backend Configuration
BACKEND_PORT=3333
BACKEND_DOCKERFILE=Dockerfile
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters-change-this

# Frontend Configuration
FRONTEND_PORT=3000
FRONTEND_DOCKERFILE=Dockerfile
API_URL=https://internship.samartsolution.com/api/v1

# Environment
NODE_ENV=production

# Redis Configuration
REDIS_PASSWORD=secure_redis_password_change_this
REDIS_PORT=6379

# Production URLs
FRONTEND_URL=https://internship.samartsolution.com
CORS_ORIGIN=https://internship.samartsolution.com

# SSL Configuration
SSL_CERT_PATH=/etc/letsencrypt/live/internship.samartsolution.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/internship.samartsolution.com/privkey.pem
ENVEOF
    
    success "Production environment file created"
}

# Create Nginx configuration
create_nginx_config() {
    info "Creating Nginx configuration..."
    
    # Create a simple HTTP-only configuration first
    cat > /etc/nginx/sites-available/internship << 'NGINXEOF'
# Internship Management System - Simple HTTP Configuration
server {
    listen 80;
    server_name internship.samartsolution.com _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:3333/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # File upload size
        client_max_body_size 10M;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:3333/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Frontend routes
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:3000;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # Error pages
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /var/www/html;
    }
}
NGINXEOF
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Enable our site
    ln -sf /etc/nginx/sites-available/internship /etc/nginx/sites-enabled/
    
    # Test configuration
    info "Testing Nginx configuration..."
    if nginx -t; then
        success "Nginx configuration test passed"
    else
        error_exit "Nginx configuration test failed"
    fi
    
    # Reload Nginx
    systemctl reload nginx || systemctl restart nginx
    
    success "Nginx configuration created and loaded"
}

# Setup SSL certificate
setup_ssl() {
    info "Setting up SSL certificate..."
    
    # Check if domain resolves to this server
    DOMAIN_IP=$(nslookup internship.samartsolution.com | grep -A1 "Name:" | tail -1 | awk '{print $2}' 2>/dev/null || echo "")
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "")
    
    if [[ "$DOMAIN_IP" != "$SERVER_IP" ]]; then
        warning "Domain DNS not configured correctly"
        warning "Domain resolves to: $DOMAIN_IP"
        warning "Server IP is: $SERVER_IP"
        warning "Skipping SSL setup. Configure DNS first, then run:"
        warning "certbot --nginx -d internship.samartsolution.com"
        return
    fi
    
    # Get certificate using nginx plugin
    certbot --nginx -d internship.samartsolution.com --non-interactive --agree-tos --email admin@samartsolution.com
    
    # Setup auto-renewal
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    success "SSL certificate configured"
}



# Deploy application
deploy_application() {
    info "Deploying application..."
    
    cd "$APP_DIR"
    
    # Use production environment
    export $(cat .env.production | grep -v '^#' | xargs)
    
    # Pull latest images and start services (without nginx)
    docker-compose up --build -d postgres redis backend frontend
    
    # Wait for services to start
    sleep 30
    
    # Import demo users if database is empty
    info "Importing demo users..."
    if [ -f "database/import-demo-users.sql" ]; then
        docker exec -i internship_postgres psql -U internship_user -d internship_prod < database/import-demo-users.sql || warning "Demo users import failed (may already exist)"
        success "Demo users imported"
    else
        warning "Demo users SQL file not found"
    fi
    
    success "Application deployed"
}

# Health check
health_check() {
    info "Performing health check..."
    
    # Check if containers are running
    if ! docker-compose ps | grep -q "Up"; then
        error_exit "Some containers are not running"
    fi
    
    # Check if services respond
    sleep 10
    
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        success "Frontend is responding"
    else
        warning "Frontend health check failed"
    fi
    
    if curl -f http://localhost:3333/health >/dev/null 2>&1; then
        success "Backend is responding"
    else
        warning "Backend health check failed"
    fi
    
    success "Health check completed"
}

# Main deployment
main() {
    log "${BLUE}🚀 Starting VPS deployment for internship.samartsolution.com${NC}"
    
    update_system
    install_docker
    setup_app_directory
    create_production_env
    create_error_pages
    create_nginx_config
    
    deploy_application
    
    # Start system nginx
    systemctl start nginx
    
    # Only setup SSL if domain is properly configured
    if nslookup internship.samartsolution.com >/dev/null 2>&1; then
        setup_ssl
    else
        warning "Domain not configured yet, skipping SSL setup"
        warning "Configure DNS first, then run: certbot --nginx -d internship.samartsolution.com"
    fi
    health_check
    
    log ""
    log "${GREEN}🎉 Deployment completed successfully!${NC}"
    log "${BLUE}🌐 Website: https://internship.samartsolution.com${NC}"
    log "${BLUE}🔧 API: https://internship.samartsolution.com/api${NC}"
    log ""
    log "${YELLOW}Next steps:${NC}"
    log "1. Configure your domain DNS to point to this server"
    log "2. Update passwords in $APP_DIR/.env.production"
    log "3. Setup SSL: certbot --nginx -d internship.samartsolution.com"
    log "4. Monitor logs: docker-compose logs -f"
}

main "$@"
EOF
    
    success "VPS deployment script created"
}

# Upload and execute deployment
deploy_to_vps() {
    info "Uploading files to VPS..."
    
    # Create temporary directory for upload
    mkdir -p /tmp/internship-deploy
    
    # Copy necessary files
    cp docker-compose.yml /tmp/internship-deploy/
    cp -r apps /tmp/internship-deploy/ 2>/dev/null || warning "Apps directory not found locally"
    
    # Upload files to VPS
    rsync -avz --progress -e "ssh -p $VPS_PORT" \
        /tmp/internship-deploy/ \
        "$VPS_USER@$VPS_IP:$APP_DIR/"
    
    # Upload deployment script
    scp -P "$VPS_PORT" /tmp/vps_deploy.sh "$VPS_USER@$VPS_IP:/tmp/"
    
    success "Files uploaded to VPS"
    
    info "Executing deployment on VPS..."
    
    # Execute deployment script on VPS
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_IP" "chmod +x /tmp/vps_deploy.sh && /tmp/vps_deploy.sh"
    
    success "VPS deployment completed"
    
    # Cleanup
    rm -rf /tmp/internship-deploy
    rm -f /tmp/vps_deploy.sh
}

# Show final status
show_status() {
    info "Checking final status..."
    
    # Test website accessibility
    if curl -f -s "https://$DOMAIN" >/dev/null 2>&1; then
        success "Website is accessible at https://$DOMAIN"
    elif curl -f -s "http://$VPS_IP" >/dev/null 2>&1; then
        success "Website is accessible at http://$VPS_IP"
        warning "Configure DNS and SSL for https://$DOMAIN"
    else
        warning "Website may still be starting up"
    fi
    
    log ""
    log "${GREEN}🎉 Deployment Summary${NC}"
    log "${BLUE}🌐 Production URL: https://$DOMAIN${NC}"
    log "${BLUE}🔧 API Endpoint: https://$DOMAIN/api${NC}"
    log "${BLUE}📊 Server IP: $VPS_IP${NC}"
    log ""
    log "${YELLOW}Useful Commands:${NC}"
    log "  Monitor logs: ssh -p $VPS_PORT $VPS_USER@$VPS_IP 'cd $APP_DIR && docker-compose logs -f'"
    log "  Restart services: ssh -p $VPS_PORT $VPS_USER@$VPS_IP 'cd $APP_DIR && docker-compose restart'"
    log "  Check status: ssh -p $VPS_PORT $VPS_USER@$VPS_IP 'cd $APP_DIR && docker-compose ps'"
}

# Main execution
main() {
    log "${PURPLE}🚀 VPS Deployment for internship.samartsolution.com${NC}"
    log "${PURPLE}================================================${NC}"
    log ""
    
    check_prerequisites
    create_vps_deployment_script
    deploy_to_vps
    show_status
    
    log ""
    log "${GREEN}🎉 Deployment process completed!${NC}"
}

# Parse command line arguments
case "${1:-deploy}" in
    deploy)
        main
        ;;
    status)
        info "Checking VPS status..."
        ssh -p "$VPS_PORT" "$VPS_USER@$VPS_IP" "cd $APP_DIR && docker-compose ps"
        ;;
    logs)
        info "Showing VPS logs..."
        ssh -p "$VPS_PORT" "$VPS_USER@$VPS_IP" "cd $APP_DIR && docker-compose logs -f --tail=50"
        ;;
    restart)
        info "Restarting VPS services..."
        ssh -p "$VPS_PORT" "$VPS_USER@$VPS_IP" "cd $APP_DIR && docker-compose restart"
        ;;
    *)
        echo "Usage: $0 [deploy|status|logs|restart]"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy to VPS (default)"
        echo "  status   - Check VPS status"
        echo "  logs     - Show VPS logs"
        echo "  restart  - Restart VPS services"
        exit 1
        ;;
esac