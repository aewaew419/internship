#!/bin/bash

# Pre-deployment Check Script
# สคริปต์ตรวจสอบความพร้อมก่อน deploy

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🔍 Pre-deployment Check${NC}"
echo -e "${PURPLE}=====================${NC}"
echo ""

# Check local requirements
check_local_requirements() {
    echo -e "${BLUE}📋 ตรวจสอบความพร้อมเครื่อง local...${NC}"
    
    local all_good=true
    
    # Check Git
    if command -v git &> /dev/null; then
        echo -e "${GREEN}✅ Git: $(git --version)${NC}"
    else
        echo -e "${RED}❌ Git: ไม่พบ${NC}"
        all_good=false
    fi
    
    # Check SSH
    if command -v ssh &> /dev/null; then
        echo -e "${GREEN}✅ SSH: พร้อมใช้งาน${NC}"
    else
        echo -e "${RED}❌ SSH: ไม่พบ${NC}"
        all_good=false
    fi
    
    # Check if we're in the right directory
    if [[ -f "package.json" && -f "go.mod" ]]; then
        echo -e "${GREEN}✅ Project Directory: ถูกต้อง${NC}"
    else
        echo -e "${RED}❌ Project Directory: ไม่ใช่ root directory ของโปรเจค${NC}"
        all_good=false
    fi
    
    # Check Git status
    if git status &> /dev/null; then
        if [[ -z $(git status --porcelain) ]]; then
            echo -e "${GREEN}✅ Git Status: ไม่มีไฟล์ที่ยังไม่ commit${NC}"
        else
            echo -e "${YELLOW}⚠️  Git Status: มีไฟล์ที่ยังไม่ commit${NC}"
            git status --short
        fi
        
        # Check if we're on main branch
        current_branch=$(git branch --show-current)
        if [[ "$current_branch" == "main" ]]; then
            echo -e "${GREEN}✅ Git Branch: อยู่ใน main branch${NC}"
        else
            echo -e "${YELLOW}⚠️  Git Branch: อยู่ใน $current_branch (แนะนำให้ switch ไป main)${NC}"
        fi
        
        # Check if local is up to date with remote
        git fetch origin main &> /dev/null
        if [[ $(git rev-parse HEAD) == $(git rev-parse origin/main) ]]; then
            echo -e "${GREEN}✅ Git Sync: local และ remote sync กันแล้ว${NC}"
        else
            echo -e "${YELLOW}⚠️  Git Sync: local และ remote ไม่ sync กัน${NC}"
            echo "   Local commits ahead: $(git rev-list --count origin/main..HEAD)"
            echo "   Remote commits ahead: $(git rev-list --count HEAD..origin/main)"
        fi
    else
        echo -e "${RED}❌ Git Repository: ไม่ใช่ git repository${NC}"
        all_good=false
    fi
    
    echo ""
    if $all_good; then
        return 0
    else
        return 1
    fi
}

# Check project structure
check_project_structure() {
    echo -e "${BLUE}📁 ตรวจสอบโครงสร้างโปรเจค...${NC}"
    
    local all_good=true
    
    # Required files and directories
    local required_items=(
        "apps/frontend"
        "apps/backend"
        "deployment/docker-compose.prod.yml"
        "deployment/nginx/nginx.conf"
        "deployment/database/init.sql"
        "scripts/deploy-production.sh"
        "deploy-to-hostatom.sh"
    )
    
    for item in "${required_items[@]}"; do
        if [[ -e "$item" ]]; then
            echo -e "${GREEN}✅ $item${NC}"
        else
            echo -e "${RED}❌ $item: ไม่พบ${NC}"
            all_good=false
        fi
    done
    
    # Check Dockerfiles
    if [[ -f "apps/frontend/Dockerfile.prod" ]]; then
        echo -e "${GREEN}✅ Frontend Dockerfile.prod${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend Dockerfile.prod: ไม่พบ (จะใช้ Dockerfile ปกติ)${NC}"
    fi
    
    if [[ -f "apps/backend/Dockerfile.prod" ]]; then
        echo -e "${GREEN}✅ Backend Dockerfile.prod${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend Dockerfile.prod: ไม่พบ (จะใช้ Dockerfile ปกติ)${NC}"
    fi
    
    echo ""
    if $all_good; then
        return 0
    else
        return 1
    fi
}

# Check environment files
check_environment_files() {
    echo -e "${BLUE}🔧 ตรวจสอบไฟล์ environment...${NC}"
    
    # Check if there are any .env files that might conflict
    if ls .env* 1> /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  พบไฟล์ .env ในโปรเจค:${NC}"
        ls -la .env*
        echo "   หมายเหตุ: ไฟล์เหล่านี้จะไม่ถูกใช้ใน production"
    else
        echo -e "${GREEN}✅ ไม่พบไฟล์ .env ที่อาจขัดแย้ง${NC}"
    fi
    
    # Check .gitignore
    if [[ -f ".gitignore" ]]; then
        if grep -q ".env" .gitignore; then
            echo -e "${GREEN}✅ .gitignore: มีการ ignore ไฟล์ .env${NC}"
        else
            echo -e "${YELLOW}⚠️  .gitignore: ไม่มีการ ignore ไฟล์ .env${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  .gitignore: ไม่พบไฟล์${NC}"
    fi
    
    echo ""
}

# Check dependencies
check_dependencies() {
    echo -e "${BLUE}📦 ตรวจสอบ dependencies...${NC}"
    
    # Check frontend dependencies
    if [[ -f "apps/frontend/package.json" ]]; then
        echo -e "${GREEN}✅ Frontend package.json พบแล้ว${NC}"
        
        cd apps/frontend
        if [[ -f "package-lock.json" ]]; then
            echo -e "${GREEN}✅ Frontend package-lock.json พบแล้ว${NC}"
        else
            echo -e "${YELLOW}⚠️  Frontend package-lock.json: ไม่พบ${NC}"
        fi
        cd ../..
    else
        echo -e "${RED}❌ Frontend package.json: ไม่พบ${NC}"
    fi
    
    # Check backend dependencies
    if [[ -f "apps/backend/go.mod" ]]; then
        echo -e "${GREEN}✅ Backend go.mod พบแล้ว${NC}"
        
        if [[ -f "apps/backend/go.sum" ]]; then
            echo -e "${GREEN}✅ Backend go.sum พบแล้ว${NC}"
        else
            echo -e "${YELLOW}⚠️  Backend go.sum: ไม่พบ${NC}"
        fi
    else
        echo -e "${RED}❌ Backend go.mod: ไม่พบ${NC}"
    fi
    
    echo ""
}

# Check Docker configuration
check_docker_config() {
    echo -e "${BLUE}🐳 ตรวจสอบ Docker configuration...${NC}"
    
    # Check docker-compose.prod.yml
    if [[ -f "deployment/docker-compose.prod.yml" ]]; then
        echo -e "${GREEN}✅ docker-compose.prod.yml พบแล้ว${NC}"
        
        # Basic syntax check
        if command -v docker-compose &> /dev/null; then
            if docker-compose -f deployment/docker-compose.prod.yml config &> /dev/null; then
                echo -e "${GREEN}✅ docker-compose.prod.yml: syntax ถูกต้อง${NC}"
            else
                echo -e "${RED}❌ docker-compose.prod.yml: syntax ผิด${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  docker-compose ไม่พบ - ไม่สามารถตรวจสอบ syntax${NC}"
        fi
    else
        echo -e "${RED}❌ docker-compose.prod.yml: ไม่พบ${NC}"
    fi
    
    # Check nginx config
    if [[ -f "deployment/nginx/nginx.conf" ]]; then
        echo -e "${GREEN}✅ nginx.conf พบแล้ว${NC}"
    else
        echo -e "${RED}❌ nginx.conf: ไม่พบ${NC}"
    fi
    
    echo ""
}

# Check deployment scripts
check_deployment_scripts() {
    echo -e "${BLUE}🚀 ตรวจสอบ deployment scripts...${NC}"
    
    local scripts=(
        "deploy-to-hostatom.sh"
        "scripts/deploy-production.sh"
        "push-both-repos.sh"
        "commit-and-push-both.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [[ -f "$script" ]]; then
            if [[ -x "$script" ]]; then
                echo -e "${GREEN}✅ $script: พบและ executable${NC}"
            else
                echo -e "${YELLOW}⚠️  $script: พบแต่ไม่ executable${NC}"
                echo "   รัน: chmod +x $script"
            fi
        else
            echo -e "${RED}❌ $script: ไม่พบ${NC}"
        fi
    done
    
    echo ""
}

# Security check
security_check() {
    echo -e "${BLUE}🔒 ตรวจสอบความปลอดภัย...${NC}"
    
    # Check for sensitive files
    local sensitive_patterns=(
        "*.key"
        "*.pem"
        "*.p12"
        "*.jks"
        "*password*"
        "*secret*"
    )
    
    echo "ตรวจสอบไฟล์ที่อาจมีข้อมูลสำคัญ..."
    local found_sensitive=false
    
    for pattern in "${sensitive_patterns[@]}"; do
        if ls $pattern 1> /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  พบไฟล์ที่อาจมีข้อมูลสำคัญ: $pattern${NC}"
            found_sensitive=true
        fi
    done
    
    if ! $found_sensitive; then
        echo -e "${GREEN}✅ ไม่พบไฟล์ที่อาจมีข้อมูลสำคัญ${NC}"
    fi
    
    # Check .gitignore for common sensitive patterns
    if [[ -f ".gitignore" ]]; then
        local ignored_patterns=("*.env" "*.key" "*.pem" "node_modules" ".DS_Store")
        local missing_patterns=()
        
        for pattern in "${ignored_patterns[@]}"; do
            if ! grep -q "$pattern" .gitignore; then
                missing_patterns+=("$pattern")
            fi
        done
        
        if [[ ${#missing_patterns[@]} -eq 0 ]]; then
            echo -e "${GREEN}✅ .gitignore: ครอบคลุม patterns ที่สำคัญ${NC}"
        else
            echo -e "${YELLOW}⚠️  .gitignore: ขาด patterns: ${missing_patterns[*]}${NC}"
        fi
    fi
    
    echo ""
}

# Performance check
performance_check() {
    echo -e "${BLUE}⚡ ตรวจสอบ performance considerations...${NC}"
    
    # Check file sizes
    echo "ตรวจสอบขนาดไฟล์ที่อาจส่งผลต่อ performance..."
    
    # Check for large files
    large_files=$(find . -type f -size +10M -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null || true)
    
    if [[ -n "$large_files" ]]; then
        echo -e "${YELLOW}⚠️  พบไฟล์ขนาดใหญ่ (>10MB):${NC}"
        echo "$large_files" | while read -r file; do
            size=$(du -h "$file" | cut -f1)
            echo "   $file ($size)"
        done
    else
        echo -e "${GREEN}✅ ไม่พบไฟล์ขนาดใหญ่ที่อาจส่งผลต่อ performance${NC}"
    fi
    
    # Check node_modules size (if exists)
    if [[ -d "node_modules" ]]; then
        node_modules_size=$(du -sh node_modules 2>/dev/null | cut -f1)
        echo -e "${YELLOW}ℹ️  node_modules size: $node_modules_size${NC}"
        echo "   หมายเหตุ: node_modules จะไม่ถูก copy ไป production"
    fi
    
    echo ""
}

# Generate deployment summary
generate_summary() {
    echo -e "${PURPLE}📋 สรุปการตรวจสอบ${NC}"
    echo -e "${PURPLE}==================${NC}"
    echo ""
    
    echo -e "${CYAN}✅ สิ่งที่พร้อมแล้ว:${NC}"
    echo "   • Git repository และ remote sync"
    echo "   • โครงสร้างโปรเจคครบถ้วน"
    echo "   • Docker configuration files"
    echo "   • Deployment scripts"
    echo ""
    
    echo -e "${CYAN}📝 ขั้นตอนต่อไป:${NC}"
    echo "   1. รัน: ./deploy-to-hostatom.sh"
    echo "   2. กรอกข้อมูล VPS (IP, domain, SSH user)"
    echo "   3. รอให้ deployment เสร็จสิ้น"
    echo "   4. ทดสอบเว็บไซต์ที่ domain ที่กำหนด"
    echo ""
    
    echo -e "${CYAN}🔧 สิ่งที่ควรเตรียม:${NC}"
    echo "   • ข้อมูล VPS (IP, SSH access)"
    echo "   • Domain name ที่ชี้ไปยัง VPS แล้ว"
    echo "   • Email สำหรับ SSL certificate"
    echo ""
    
    echo -e "${YELLOW}⚠️  หมายเหตุสำคัญ:${NC}"
    echo "   • ตรวจสอบให้แน่ใจว่า DNS ได้ propagate แล้ว"
    echo "   • VPS ต้องมี RAM อย่างน้อย 2GB"
    echo "   • Port 80, 443, 22 ต้องเปิดอยู่"
    echo "   • SSH key ต้องสามารถเข้าถึง VPS ได้"
    echo ""
}

# Main function
main() {
    local overall_status=true
    
    if ! check_local_requirements; then
        overall_status=false
    fi
    
    if ! check_project_structure; then
        overall_status=false
    fi
    
    check_environment_files
    check_dependencies
    check_docker_config
    check_deployment_scripts
    security_check
    performance_check
    
    if $overall_status; then
        echo -e "${GREEN}🎉 ระบบพร้อมสำหรับ deployment!${NC}"
        generate_summary
    else
        echo -e "${RED}❌ พบปัญหาที่ต้องแก้ไขก่อน deployment${NC}"
        echo "กรุณาแก้ไขปัญหาที่มีเครื่องหมาย ❌ ก่อนทำการ deploy"
        exit 1
    fi
}

# Run main function
main "$@"