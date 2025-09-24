#!/bin/bash

# Presentation Launcher Script
# สคริปต์เปิด Presentation พร้อมเตรียมระบบ

clear

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}"
echo "🎤 =================================="
echo "   PRESENTATION LAUNCHER"
echo "   Internship Management System"
echo "==================================="
echo -e "${NC}"

echo -e "${BLUE}🎯 Presentation Overview:${NC}"
echo "   • Duration: 20-25 minutes"
echo "   • Slides: 16 comprehensive slides"
echo "   • Includes: Live demo + Q&A"
echo "   • Demo Score: 98/100"
echo ""

echo -e "${YELLOW}📋 Pre-presentation Checklist:${NC}"

# Check if servers are running
echo -e "${BLUE}1. Checking server status...${NC}"

# Check backend
if curl -s http://localhost:8080/health > /dev/null; then
    echo -e "   ${GREEN}✅ Backend server is running${NC}"
    BACKEND_STATUS="OK"
else
    echo -e "   ${RED}❌ Backend server is not running${NC}"
    BACKEND_STATUS="FAIL"
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "   ${GREEN}✅ Frontend server is running${NC}"
    FRONTEND_STATUS="OK"
else
    echo -e "   ${YELLOW}⚠️  Frontend server is not running${NC}"
    FRONTEND_STATUS="WARN"
fi

echo ""

# Check demo data
echo -e "${BLUE}2. Checking demo data...${NC}"
if [ -f "apps/backend/demo_data.json" ]; then
    echo -e "   ${GREEN}✅ Demo data file exists${NC}"
    DEMO_DATA_STATUS="OK"
else
    echo -e "   ${YELLOW}⚠️  Demo data not found, creating...${NC}"
    node create-demo-data.js
    DEMO_DATA_STATUS="CREATED"
fi

echo ""

# Check presentation files
echo -e "${BLUE}3. Checking presentation files...${NC}"
if [ -f "presentation/index.html" ]; then
    echo -e "   ${GREEN}✅ Presentation slides ready${NC}"
else
    echo -e "   ${RED}❌ Presentation files missing${NC}"
    exit 1
fi

if [ -f "presentation/speaker-notes.md" ]; then
    echo -e "   ${GREEN}✅ Speaker notes available${NC}"
else
    echo -e "   ${YELLOW}⚠️  Speaker notes not found${NC}"
fi

echo ""

# Check performance results
echo -e "${BLUE}4. Checking performance results...${NC}"
LATEST_RESULTS=$(ls -t performance-test-results-*.json 2>/dev/null | head -1)
if [ -n "$LATEST_RESULTS" ]; then
    echo -e "   ${GREEN}✅ Latest performance results: $LATEST_RESULTS${NC}"
    PERF_STATUS="OK"
else
    echo -e "   ${YELLOW}⚠️  No performance results found${NC}"
    PERF_STATUS="MISSING"
fi

echo ""

# Summary
echo -e "${PURPLE}📊 System Status Summary:${NC}"
echo -e "   Backend Server: ${BACKEND_STATUS}"
echo -e "   Frontend Server: ${FRONTEND_STATUS}"
echo -e "   Demo Data: ${DEMO_DATA_STATUS}"
echo -e "   Performance Results: ${PERF_STATUS}"

echo ""

# Recommendations
if [ "$BACKEND_STATUS" != "OK" ]; then
    echo -e "${RED}⚠️  CRITICAL: Backend server must be running for demo${NC}"
    echo -e "${YELLOW}💡 Start backend: cd backend-go && go run main.go${NC}"
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if [ "$FRONTEND_STATUS" != "OK" ]; then
    echo -e "${YELLOW}💡 Recommended: Start frontend for full demo${NC}"
    echo -e "${YELLOW}   Command: cd apps/frontend && npm run dev${NC}"
    echo ""
fi

# Demo accounts reminder
echo -e "${CYAN}👥 Demo Accounts Ready:${NC}"
echo "   Admin: admin@university.ac.th / password123"
echo "   Staff: staff001@university.ac.th / password123"
echo "   Students: 65010001-65010005 / password123"
echo ""

# Demo URLs
echo -e "${CYAN}🌐 Demo URLs:${NC}"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8080"
echo "   Performance Dashboard: performance-dashboard.html"
echo ""

# Presentation tips
echo -e "${BLUE}🎤 Presentation Tips:${NC}"
echo "   • Duration: 20-25 minutes"
echo "   • Practice demo flow beforehand"
echo "   • Have backup screenshots ready"
echo "   • Emphasize 98/100 demo score"
echo "   • Show performance metrics"
echo ""

read -p "Press Enter to open presentation..."

echo ""
echo -e "${GREEN}🚀 Opening presentation...${NC}"

# Open presentation
if command -v open &> /dev/null; then
    # macOS
    open presentation/index.html
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open presentation/index.html
elif command -v start &> /dev/null; then
    # Windows
    start presentation/index.html
else
    echo -e "${YELLOW}Please open presentation/index.html in your browser${NC}"
fi

# Open speaker notes
echo -e "${BLUE}📝 Opening speaker notes...${NC}"
if command -v code &> /dev/null; then
    code presentation/speaker-notes.md
elif command -v open &> /dev/null; then
    open presentation/speaker-notes.md
else
    echo -e "${YELLOW}Speaker notes available at: presentation/speaker-notes.md${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Presentation is ready!${NC}"
echo ""
echo -e "${PURPLE}📋 Quick Demo Flow:${NC}"
echo "   1. Student login (65010001/password123)"
echo "   2. Browse and apply for internships"
echo "   3. Staff login (staff001@university.ac.th/password123)"
echo "   4. Approve applications"
echo "   5. Show dashboard and analytics"
echo "   6. Highlight performance metrics"
echo ""
echo -e "${CYAN}🎬 Break a leg! 🎬${NC}"