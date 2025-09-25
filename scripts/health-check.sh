#!/bin/bash

# Health Check Script for Production Deployment
# Monitors application health and sends alerts if needed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="https://internship.yourdomain.com"
API_URL="https://api.internship.yourdomain.com"
HEALTH_ENDPOINT="$API_URL/health"
LOG_FILE="/var/log/internship/health-check.log"
ALERT_EMAIL="admin@yourdomain.com"

# Functions
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - ${1}" | tee -a "${LOG_FILE}"
}

success() {
    log "${GREEN}✅ ${1}${NC}"
}

warning() {
    log "${YELLOW}⚠️  ${1}${NC}"
}

error() {
    log "${RED}❌ ${1}${NC}"
}

info() {
    log "${BLUE}ℹ️  ${1}${NC}"
}

# Send alert (email or webhook)
send_alert() {
    local message="$1"
    local severity="$2"
    
    # Log the alert
    log "ALERT [$severity]: $message"
    
    # Send email if mail command is available
    if command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "Internship System Alert [$severity]" "$ALERT_EMAIL"
    fi
    
    # You can add webhook notifications here
    # curl -X POST -H 'Content-type: application/json' \
    #   --data "{\"text\":\"$message\"}" \
    #   YOUR_SLACK_WEBHOOK_URL
}

# Check HTTP endpoint
check_http() {
    local url="$1"
    local name="$2"
    local timeout="${3:-10}"
    
    if curl -f -s --max-time "$timeout" "$url" >/dev/null 2>&1; then
        success "$name is responding"
        return 0
    else
        error "$name is not responding"
        return 1
    fi
}

# Check HTTP with response time
check_http_performance() {
    local url="$1"
    local name="$2"
    local max_time="${3:-5}"
    
    local response_time
    response_time=$(curl -o /dev/null -s -w '%{time_total}' --max-time 30 "$url" 2>/dev/null || echo "999")
    
    if (( $(echo "$response_time < $max_time" | bc -l) )); then
        success "$name response time: ${response_time}s (< ${max_time}s)"
        return 0
    else
        warning "$name slow response: ${response_time}s (> ${max_time}s)"
        return 1
    fi
}

# Check PM2 processes
check_pm2() {
    if command -v pm2 >/dev/null 2>&1; then
        local status
        status=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="internship-frontend" or .name=="internship-backend") | .pm2_env.status' 2>/dev/null)
        
        if echo "$status" | grep -q "online"; then
            success "PM2 processes are running"
            return 0
        else
            error "PM2 processes are not running properly"
            return 1
        fi
    else
        warning "PM2 not found, skipping process check"
        return 0
    fi
}

# Check database connection
check_database() {
    if [ -f "/home/internship/.db_credentials" ]; then
        source "/home/internship/.db_credentials"
        
        if mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" "$DB_NAME" >/dev/null 2>&1; then
            success "Database connection is working"
            return 0
        else
            error "Database connection failed"
            return 1
        fi
    else
        warning "Database credentials not found, skipping database check"
        return 0
    fi
}

# Check disk space
check_disk_space() {
    local threshold=80
    local usage
    usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt "$threshold" ]; then
        success "Disk usage: ${usage}% (< ${threshold}%)"
        return 0
    else
        warning "High disk usage: ${usage}% (> ${threshold}%)"
        return 1
    fi
}

# Check memory usage
check_memory() {
    local threshold=80
    local usage
    usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "$usage" -lt "$threshold" ]; then
        success "Memory usage: ${usage}% (< ${threshold}%)"
        return 0
    else
        warning "High memory usage: ${usage}% (> ${threshold}%)"
        return 1
    fi
}

# Check SSL certificates
check_ssl() {
    local domain="$1"
    local days_threshold=30
    
    if command -v openssl >/dev/null 2>&1; then
        local expiry_date
        expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
        
        if [ -n "$expiry_date" ]; then
            local expiry_epoch
            expiry_epoch=$(date -d "$expiry_date" +%s)
            local current_epoch
            current_epoch=$(date +%s)
            local days_until_expiry
            days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
            
            if [ "$days_until_expiry" -gt "$days_threshold" ]; then
                success "SSL certificate for $domain expires in $days_until_expiry days"
                return 0
            else
                warning "SSL certificate for $domain expires in $days_until_expiry days (< $days_threshold days)"
                return 1
            fi
        else
            error "Could not check SSL certificate for $domain"
            return 1
        fi
    else
        warning "OpenSSL not found, skipping SSL check"
        return 0
    fi
}

# Check log file sizes
check_log_sizes() {
    local max_size_mb=100
    local log_dir="/var/log/internship"
    
    if [ -d "$log_dir" ]; then
        local large_logs
        large_logs=$(find "$log_dir" -name "*.log" -size +${max_size_mb}M 2>/dev/null)
        
        if [ -z "$large_logs" ]; then
            success "Log file sizes are within limits"
            return 0
        else
            warning "Large log files found: $large_logs"
            return 1
        fi
    else
        warning "Log directory not found, skipping log size check"
        return 0
    fi
}

# Main health check function
run_health_check() {
    info "Starting health check..."
    
    local failed_checks=0
    local total_checks=0
    
    # HTTP endpoint checks
    ((total_checks++))
    check_http "$FRONTEND_URL" "Frontend" || ((failed_checks++))
    
    ((total_checks++))
    check_http "$API_URL" "API" || ((failed_checks++))
    
    ((total_checks++))
    check_http "$HEALTH_ENDPOINT" "Health Endpoint" || ((failed_checks++))
    
    # Performance checks
    ((total_checks++))
    check_http_performance "$FRONTEND_URL" "Frontend" 3 || ((failed_checks++))
    
    ((total_checks++))
    check_http_performance "$API_URL" "API" 2 || ((failed_checks++))
    
    # System checks
    ((total_checks++))
    check_pm2 || ((failed_checks++))
    
    ((total_checks++))
    check_database || ((failed_checks++))
    
    ((total_checks++))
    check_disk_space || ((failed_checks++))
    
    ((total_checks++))
    check_memory || ((failed_checks++))
    
    # SSL checks
    ((total_checks++))
    check_ssl "internship.yourdomain.com" || ((failed_checks++))
    
    ((total_checks++))
    check_ssl "api.internship.yourdomain.com" || ((failed_checks++))
    
    # Log checks
    ((total_checks++))
    check_log_sizes || ((failed_checks++))
    
    # Summary
    local success_rate
    success_rate=$(( (total_checks - failed_checks) * 100 / total_checks ))
    
    info "Health check completed: $((total_checks - failed_checks))/$total_checks checks passed ($success_rate%)"
    
    # Send alerts if needed
    if [ "$failed_checks" -gt 0 ]; then
        if [ "$failed_checks" -gt 3 ]; then
            send_alert "Critical: $failed_checks/$total_checks health checks failed" "CRITICAL"
        else
            send_alert "Warning: $failed_checks/$total_checks health checks failed" "WARNING"
        fi
    fi
    
    return "$failed_checks"
}

# Quick check function
quick_check() {
    info "Running quick health check..."
    
    local failed=0
    
    check_http "$FRONTEND_URL" "Frontend" 5 || ((failed++))
    check_http "$API_URL" "API" 5 || ((failed++))
    check_pm2 || ((failed++))
    
    if [ "$failed" -eq 0 ]; then
        success "Quick check passed"
    else
        error "Quick check failed ($failed issues)"
    fi
    
    return "$failed"
}

# Show system status
show_status() {
    info "System Status Report"
    echo "===================="
    
    # System info
    echo "Server: $(hostname)"
    echo "Uptime: $(uptime -p)"
    echo "Load: $(uptime | awk -F'load average:' '{print $2}')"
    echo "Memory: $(free -h | awk 'NR==2{printf "%s/%s (%.0f%%)", $3,$2,$3*100/$2}')"
    echo "Disk: $(df -h / | awk 'NR==2{printf "%s/%s (%s)", $3,$2,$5}')"
    
    # PM2 status
    if command -v pm2 >/dev/null 2>&1; then
        echo ""
        echo "PM2 Processes:"
        pm2 status
    fi
    
    # Recent logs
    echo ""
    echo "Recent Health Check Logs:"
    tail -n 10 "$LOG_FILE" 2>/dev/null || echo "No health check logs found"
}

# Parse command line arguments
case "${1:-check}" in
    check)
        run_health_check
        ;;
    quick)
        quick_check
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: $0 [check|quick|status]"
        echo ""
        echo "Commands:"
        echo "  check  - Run full health check (default)"
        echo "  quick  - Run quick health check"
        echo "  status - Show system status"
        echo ""
        exit 1
        ;;
esac