#!/bin/bash

# Production Deployment Script for Hostatom VPS
# This script automates the deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_USER="internship"
APP_DIR="/home/internship/internship"
BACKUP_DIR="/home/internship/backups"
LOG_FILE="/var/log/internship/deployment.log"

# Functions
log() {
    echo -e "${1}" | tee -a "${LOG_FILE}"
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

# Check if running as correct user
check_user() {
    if [ "$(whoami)" != "$DEPLOY_USER" ]; then
        error_exit "This script must be run as user: $DEPLOY_USER"
    fi
}

# Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."
    
    # Check if required commands exist
    command -v node >/dev/null 2>&1 || error_exit "Node.js is not installed"
    command -v go >/dev/null 2>&1 || error_exit "Go is not installed"
    command -v mysql >/dev/null 2>&1 || error_exit "MySQL client is not installed"
    command -v pm2 >/dev/null 2>&1 || error_exit "PM2 is not installed"
    command -v nginx >/dev/null 2>&1 || error_exit "Nginx is not installed"
    
    success "Prerequisites check passed"
}

# Create backup
create_backup() {
    info "Creating backup..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Database backup
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if [ -f "/home/internship/.env.production" ]; then
        source /home/internship/.env.production
        mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"
        gzip "$BACKUP_FILE"
        success "Database backup created: ${BACKUP_FILE}.gz"
    else
        warning "No production environment file found, skipping database backup"
    fi
    
    # Application backup
    if [ -d "$APP_DIR" ]; then
        tar -czf "$BACKUP_DIR/app_backup_$(date +%Y%m%d_%H%M%S).tar.gz" -C "$APP_DIR" .
        success "Application backup created"
    fi
}

# Pull latest code
update_code() {
    info "Updating application code..."
    
    cd "$APP_DIR"
    
    # Stash any local changes
    git stash
    
    # Pull latest changes
    git pull origin main || error_exit "Failed to pull latest code"
    
    success "Code updated successfully"
}

# Build backend
build_backend() {
    info "Building backend application..."
    
    cd "$APP_DIR/apps/backend"
    
    # Download dependencies
    go mod download || error_exit "Failed to download Go dependencies"
    go mod tidy
    
    # Build application
    go build -o bin/internship-backend ./cmd/server/main.go || error_exit "Failed to build backend"
    
    # Make executable
    chmod +x bin/internship-backend
    
    success "Backend built successfully"
}

# Build frontend
build_frontend() {
    info "Building frontend application..."
    
    cd "$APP_DIR/apps/frontend"
    
    # Install dependencies
    npm ci --production || error_exit "Failed to install frontend dependencies"
    
    # Build application
    npm run build || error_exit "Failed to build frontend"
    
    success "Frontend built successfully"
}

# Update database
update_database() {
    info "Updating database..."
    
    cd "$APP_DIR/apps/backend"
    
    # Run migrations if they exist
    if [ -f "cmd/migrate/main.go" ]; then
        go run cmd/migrate/main.go --env=production || warning "Database migration failed or not needed"
    fi
    
    success "Database update completed"
}

# Restart services
restart_services() {
    info "Restarting services..."
    
    # Restart PM2 applications
    pm2 restart all || error_exit "Failed to restart PM2 applications"
    
    # Reload Nginx
    sudo nginx -t || error_exit "Nginx configuration test failed"
    sudo systemctl reload nginx || error_exit "Failed to reload Nginx"
    
    success "Services restarted successfully"
}

# Health check
health_check() {
    info "Performing health check..."
    
    # Wait for services to start
    sleep 10
    
    # Check PM2 status
    pm2 status | grep -q "online" || error_exit "PM2 applications are not running"
    
    # Check if applications respond
    if command -v curl >/dev/null 2>&1; then
        # Check frontend (if accessible locally)
        curl -f http://localhost:3000 >/dev/null 2>&1 || warning "Frontend health check failed"
        
        # Check backend
        curl -f http://localhost:3333/health >/dev/null 2>&1 || warning "Backend health check failed"
    fi
    
    success "Health check completed"
}

# Cleanup old backups
cleanup_backups() {
    info "Cleaning up old backups..."
    
    # Remove backups older than 30 days
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete
    find "$BACKUP_DIR" -name "app_backup_*.tar.gz" -mtime +30 -delete
    
    success "Backup cleanup completed"
}

# Main deployment function
deploy() {
    log "${BLUE}🚀 Starting production deployment...${NC}"
    log "Timestamp: $(date)"
    log "User: $(whoami)"
    log "Directory: $(pwd)"
    log ""
    
    check_user
    check_prerequisites
    create_backup
    update_code
    build_backend
    build_frontend
    update_database
    restart_services
    health_check
    cleanup_backups
    
    log ""
    log "${GREEN}🎉 Deployment completed successfully!${NC}"
    log "Timestamp: $(date)"
    
    # Show final status
    info "Final status:"
    pm2 status
}

# Rollback function
rollback() {
    warning "Starting rollback process..."
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/app_backup_*.tar.gz 2>/dev/null | head -n1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        error_exit "No backup found for rollback"
    fi
    
    info "Rolling back to: $LATEST_BACKUP"
    
    # Stop services
    pm2 stop all
    
    # Restore application
    cd "$APP_DIR"
    tar -xzf "$LATEST_BACKUP"
    
    # Restart services
    pm2 start all
    
    success "Rollback completed"
}

# Show usage
usage() {
    echo "Usage: $0 [deploy|rollback|status|logs]"
    echo ""
    echo "Commands:"
    echo "  deploy   - Deploy latest code to production"
    echo "  rollback - Rollback to previous version"
    echo "  status   - Show application status"
    echo "  logs     - Show application logs"
    echo ""
}

# Parse command line arguments
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    rollback)
        rollback
        ;;
    status)
        info "Application Status:"
        pm2 status
        echo ""
        info "System Resources:"
        free -h
        df -h
        ;;
    logs)
        info "Recent application logs:"
        pm2 logs --lines 50
        ;;
    *)
        usage
        exit 1
        ;;
esac