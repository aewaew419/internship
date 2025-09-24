#!/bin/bash

# Deployment Status Checker
# ตรวจสอบสถานะการ deploy และความพร้อมของระบบ

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${PURPLE}"
echo "🔍 =================================="
echo "   DEPLOYMENT STATUS CHECKER"
echo "   Internship Management System"
echo "==================================="
echo -e "${NC}"

# Check if we're on the deployment server
if [[ -d "/opt/internship-system" ]]; then
    DEPLOYMENT_DIR="/opt/internship-system"
    IS_PRODUCTION=true
    echo -e "${BLUE}📍 Running on production server${NC}"
else
    DEPLOYMENT_DIR="."
    IS_PRODUCTION=false
    echo -e "${YELLOW}📍 Running on development environment${NC}"
fi

echo ""

# Function to check service status
check_service() {
    local service_name=$1
    local check_command=$2
    local description=$3
    
    echo -n "   $description: "
    if eval "$check_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Running${NC}"
        return 0
    else
        echo -e "${RED}❌ Not Running${NC}"
        return 1
    fi
}

# Function to check URL
check_url() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -n "   $description: "
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [[ "$status" == "$expected_status" ]]; then
        echo -e "${GREEN}✅ $status${NC}"
        return 0
    else
        echo -e "${RED}❌ $status${NC}"
        return 1
    fi
}

# Check Git status
echo -e "${BLUE}📊 Git Status:${NC}"
if [[ -d ".git" ]]; then
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    LAST_COMMIT=$(git log -1 --format="%h - %s" 2>/dev/null || echo "unknown")
    echo "   Branch: $CURRENT_BRANCH"
    echo "   Last Commit: $LAST_COMMIT"
    
    # Check if there are uncommitted changes
    if git diff --quiet 2>/dev/null; then
        echo -e "   Working Directory: ${GREEN}✅ Clean${NC}"
    else
        echo -e "   Working Directory: ${YELLOW}⚠️  Has Changes${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  Not a git repository${NC}"
fi

echo ""

# Check Docker services (if production)
if [[ "$IS_PRODUCTION" == true ]]; then
    echo -e "${BLUE}🐳 Docker Services Status:${NC}"
    
    if command -v docker-compose &> /dev/null; then
        cd "$DEPLOYMENT_DIR"
        
        if [[ -f "docker-compose.prod.yml" ]]; then
            # Check individual services
            check_service "postgres" "docker-compose -f docker-compose.prod.yml ps postgres | grep -q 'Up'" "PostgreSQL Database"
            check_service "backend" "docker-compose -f docker-compose.prod.yml ps backend | grep -q 'Up'" "Backend API"
            check_service "frontend" "docker-compose -f docker-compose.prod.yml ps frontend | grep -q 'Up'" "Frontend App"
            check_service "nginx" "docker-compose -f docker-compose.prod.yml ps nginx | grep -q 'Up'" "Nginx Proxy"
            check_service "redis" "docker-compose -f docker-compose.prod.yml ps redis | grep -q 'Up'" "Redis Cache"
        else
            echo -e "   ${RED}❌ docker-compose.prod.yml not found${NC}"
        fi
    else
        echo -e "   ${RED}❌ Docker Compose not installed${NC}"
    fi
else
    echo -e "${BLUE}🐳 Local Development Services:${NC}"
    
    # Check local services
    check_service "backend" "curl -s http://localhost:8080/health" "Backend (localhost:8080)"
    check_service "frontend" "curl -s http://localhost:3000" "Frontend (localhost:3000)"
fi

echo ""

# Check URLs
echo -e "${BLUE}🌐 URL Health Checks:${NC}"

if [[ "$IS_PRODUCTION" == true ]]; then
    # Try to detect domain from nginx config
    if [[ -f "$DEPLOYMENT_DIR/nginx/nginx.conf" ]]; then
        DOMAIN=$(grep -o 'server_name [^;]*' "$DEPLOYMENT_DIR/nginx/nginx.conf" | head -1 | awk '{print $2}' | tr -d ';')
        if [[ "$DOMAIN" != "_" && -n "$DOMAIN" ]]; then
            echo "   Detected domain: $DOMAIN"
            check_url "https://$DOMAIN" "HTTPS Website"
            check_url "https://$DOMAIN/health" "Health Endpoint"
            check_url "https://$DOMAIN/api/v1/test" "API Test Endpoint" "200"
        else
            echo -e "   ${YELLOW}⚠️  Domain not configured in nginx.conf${NC}"
        fi
    fi
    
    # Check localhost endpoints
    check_url "http://localhost/health" "Local Health Check"
else
    # Development URLs
    check_url "http://localhost:8080/health" "Backend Health"
    check_url "http://localhost:3000" "Frontend"
    check_url "http://localhost:8080/api/v1/test" "API Test"
fi

echo ""

# Check SSL Certificate (if production)
if [[ "$IS_PRODUCTION" == true && -n "$DOMAIN" ]]; then
    echo -e "${BLUE}🔐 SSL Certificate Status:${NC}"
    
    if command -v openssl &> /dev/null; then
        SSL_INFO=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        
        if [[ -n "$SSL_INFO" ]]; then
            echo -e "   ${GREEN}✅ SSL Certificate Valid${NC}"
            echo "$SSL_INFO" | sed 's/^/   /'
        else
            echo -e "   ${RED}❌ SSL Certificate Issues${NC}"
        fi
    else
        echo -e "   ${YELLOW}⚠️  OpenSSL not available${NC}"
    fi
    
    echo ""
fi

# Check Database Connection
echo -e "${BLUE}🗄️  Database Status:${NC}"

if [[ "$IS_PRODUCTION" == true ]]; then
    if docker exec internship_db pg_isready -U internship_user > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ PostgreSQL Connection${NC}"
        
        # Get database stats
        DB_SIZE=$(docker exec internship_db psql -U internship_user -d internship_prod -t -c "SELECT pg_size_pretty(pg_database_size('internship_prod'));" 2>/dev/null | xargs)
        if [[ -n "$DB_SIZE" ]]; then
            echo "   Database Size: $DB_SIZE"
        fi
        
        # Check table counts
        TABLES_COUNT=$(docker exec internship_db psql -U internship_user -d internship_prod -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
        if [[ -n "$TABLES_COUNT" ]]; then
            echo "   Tables: $TABLES_COUNT"
        fi
    else
        echo -e "   ${RED}❌ PostgreSQL Connection Failed${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  Database check not available in development${NC}"
fi

echo ""

# Check Performance Metrics
echo -e "${BLUE}⚡ Performance Metrics:${NC}"

if [[ -f "performance-test-results-"*".json" ]]; then
    LATEST_RESULTS=$(ls -t performance-test-results-*.json 2>/dev/null | head -1)
    if [[ -n "$LATEST_RESULTS" ]]; then
        echo "   Latest Test: $LATEST_RESULTS"
        
        # Extract key metrics using basic tools
        if command -v jq &> /dev/null; then
            DEMO_SCORE=$(jq -r '.demoScore // "N/A"' "$LATEST_RESULTS")
            SUCCESS_RATE=$(jq -r '.summary.passed // 0' "$LATEST_RESULTS")
            TOTAL_TESTS=$(jq -r '.summary.totalTests // 0' "$LATEST_RESULTS")
            AVG_TIME=$(jq -r '.summary.avgResponseTime // 0' "$LATEST_RESULTS")
            
            echo "   Demo Score: $DEMO_SCORE/100"
            echo "   Tests Passed: $SUCCESS_RATE/$TOTAL_TESTS"
            echo "   Avg Response Time: ${AVG_TIME}ms"
        else
            echo -e "   ${YELLOW}⚠️  jq not available for detailed metrics${NC}"
        fi
    fi
else
    echo -e "   ${YELLOW}⚠️  No performance test results found${NC}"
    echo "   Run: ./run-performance-test.sh"
fi

echo ""

# Check System Resources (if production)
if [[ "$IS_PRODUCTION" == true ]]; then
    echo -e "${BLUE}💻 System Resources:${NC}"
    
    # Disk usage
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
    if [[ "$DISK_USAGE" -lt 80 ]]; then
        echo -e "   Disk Usage: ${GREEN}$DISK_USAGE%${NC}"
    elif [[ "$DISK_USAGE" -lt 90 ]]; then
        echo -e "   Disk Usage: ${YELLOW}$DISK_USAGE%${NC}"
    else
        echo -e "   Disk Usage: ${RED}$DISK_USAGE%${NC}"
    fi
    
    # Memory usage
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [[ "$MEMORY_USAGE" -lt 80 ]]; then
        echo -e "   Memory Usage: ${GREEN}$MEMORY_USAGE%${NC}"
    elif [[ "$MEMORY_USAGE" -lt 90 ]]; then
        echo -e "   Memory Usage: ${YELLOW}$MEMORY_USAGE%${NC}"
    else
        echo -e "   Memory Usage: ${RED}$MEMORY_USAGE%${NC}"
    fi
    
    # Load average
    LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | tr -d ',')
    echo "   Load Average: $LOAD_AVG"
    
    echo ""
fi

# Check Backup Status (if production)
if [[ "$IS_PRODUCTION" == true ]]; then
    echo -e "${BLUE}💾 Backup Status:${NC}"
    
    BACKUP_DIR="$DEPLOYMENT_DIR/database/backups"
    if [[ -d "$BACKUP_DIR" ]]; then
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.gz 2>/dev/null | head -1)
        if [[ -n "$LATEST_BACKUP" ]]; then
            BACKUP_DATE=$(stat -c %y "$LATEST_BACKUP" 2>/dev/null | cut -d' ' -f1)
            BACKUP_SIZE=$(du -h "$LATEST_BACKUP" 2>/dev/null | cut -f1)
            echo -e "   ${GREEN}✅ Latest Backup: $BACKUP_DATE ($BACKUP_SIZE)${NC}"
        else
            echo -e "   ${YELLOW}⚠️  No backups found${NC}"
        fi
        
        BACKUP_COUNT=$(ls "$BACKUP_DIR"/*.gz 2>/dev/null | wc -l)
        echo "   Total Backups: $BACKUP_COUNT"
    else
        echo -e "   ${RED}❌ Backup directory not found${NC}"
    fi
    
    echo ""
fi

# Check Log Files
echo -e "${BLUE}📋 Recent Log Activity:${NC}"

if [[ "$IS_PRODUCTION" == true ]]; then
    LOG_DIR="$DEPLOYMENT_DIR/logs"
    if [[ -d "$LOG_DIR" ]]; then
        # Check for recent errors
        ERROR_COUNT=$(find "$LOG_DIR" -name "*.log" -mtime -1 -exec grep -i "error" {} \; 2>/dev/null | wc -l)
        if [[ "$ERROR_COUNT" -eq 0 ]]; then
            echo -e "   ${GREEN}✅ No errors in last 24 hours${NC}"
        else
            echo -e "   ${YELLOW}⚠️  $ERROR_COUNT errors in last 24 hours${NC}"
        fi
        
        # Check log file sizes
        LARGE_LOGS=$(find "$LOG_DIR" -name "*.log" -size +100M 2>/dev/null | wc -l)
        if [[ "$LARGE_LOGS" -gt 0 ]]; then
            echo -e "   ${YELLOW}⚠️  $LARGE_LOGS log files > 100MB${NC}"
        fi
    fi
else
    echo -e "   ${YELLOW}⚠️  Log check not available in development${NC}"
fi

echo ""

# Overall Status Summary
echo -e "${PURPLE}📊 Overall Status Summary:${NC}"
echo -e "${CYAN}=================================${NC}"

if [[ "$IS_PRODUCTION" == true ]]; then
    echo -e "${GREEN}🚀 Production Environment${NC}"
    echo "   Location: $DEPLOYMENT_DIR"
    echo "   Domain: ${DOMAIN:-"Not configured"}"
    echo "   SSL: ${SSL_INFO:+"Enabled"}"
    echo "   Database: PostgreSQL"
    echo "   Cache: Redis"
    echo "   Proxy: Nginx"
else
    echo -e "${BLUE}🛠️  Development Environment${NC}"
    echo "   Location: $(pwd)"
    echo "   Backend: http://localhost:8080"
    echo "   Frontend: http://localhost:3000"
fi

echo ""

# Quick Actions
echo -e "${CYAN}🔧 Quick Actions:${NC}"

if [[ "$IS_PRODUCTION" == true ]]; then
    echo "   View logs: docker-compose -f $DEPLOYMENT_DIR/docker-compose.prod.yml logs -f"
    echo "   Restart: docker-compose -f $DEPLOYMENT_DIR/docker-compose.prod.yml restart"
    echo "   Update: cd $DEPLOYMENT_DIR/app && git pull && cd .. && docker-compose -f docker-compose.prod.yml build && docker-compose -f docker-compose.prod.yml up -d"
    echo "   Backup: $DEPLOYMENT_DIR/scripts/backup-database.sh"
    echo "   Health: $DEPLOYMENT_DIR/scripts/health-check.sh"
else
    echo "   Run performance test: ./run-performance-test.sh"
    echo "   Start presentation: ./start-presentation.sh"
    echo "   Test demo: ./test-demo.sh"
    echo "   Deploy to production: ./deployment/scripts/deploy.sh"
fi

echo ""
echo -e "${GREEN}✅ Status check completed!${NC}"