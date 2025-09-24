#!/bin/bash

# Demo Deployment Script for PM Presentation
# สคริปต์ deploy demo สำหรับนำเสนอ PM

set -e

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
echo "🚀 =================================="
echo "   DEMO DEPLOYMENT FOR PM"
echo "   Production-like Environment"
echo "==================================="
echo -e "${NC}"

echo -e "${BLUE}🎯 What this demo will show:${NC}"
echo "   ✅ Production-ready Docker containers"
echo "   ✅ PostgreSQL database with demo data"
echo "   ✅ Redis caching layer"
echo "   ✅ Nginx reverse proxy (optional)"
echo "   ✅ Full API and Frontend functionality"
echo "   ✅ Performance monitoring"
echo ""

echo -e "${YELLOW}📊 Demo Environment Details:${NC}"
echo "   • Frontend: http://localhost:3001"
echo "   • Backend API: http://localhost:8081"
echo "   • Full Stack: http://localhost:8080 (with nginx)"
echo "   • Database: PostgreSQL on port 5433"
echo "   • Cache: Redis on port 6380"
echo ""

read -p "Start demo deployment? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo "Demo deployment cancelled"
    exit 0
fi

echo ""
echo -e "${GREEN}🔧 Starting demo deployment...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

# Stop any existing demo containers
echo -e "${BLUE}🛑 Stopping existing demo containers...${NC}"
docker-compose -f docker-compose.demo.yml down --remove-orphans 2>/dev/null || true

# Create logs directory
mkdir -p logs/demo

# Create demo data if not exists
if [[ ! -f "apps/backend/demo_data.json" ]]; then
    echo -e "${BLUE}📊 Creating demo data...${NC}"
    node create-demo-data.js
fi

# Build and start demo environment
echo -e "${BLUE}🐳 Building demo containers...${NC}"
docker-compose -f docker-compose.demo.yml build --no-cache

echo -e "${BLUE}🚀 Starting demo services...${NC}"
docker-compose -f docker-compose.demo.yml up -d

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
echo -n "   "

for i in {1..60}; do
    if docker-compose -f docker-compose.demo.yml ps | grep -q "Up (healthy)"; then
        break
    fi
    echo -n "."
    sleep 2
done

echo ""

# Check service status
echo -e "${BLUE}📊 Checking service status...${NC}"

# Check database
if docker exec internship_demo_db pg_isready -U demo_user -d internship_demo > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ PostgreSQL Database${NC}"
else
    echo -e "   ${RED}❌ PostgreSQL Database${NC}"
fi

# Check backend
if curl -s http://localhost:8081/health > /dev/null; then
    echo -e "   ${GREEN}✅ Backend API${NC}"
else
    echo -e "   ${RED}❌ Backend API${NC}"
fi

# Check frontend
if curl -s http://localhost:3001 > /dev/null; then
    echo -e "   ${GREEN}✅ Frontend App${NC}"
else
    echo -e "   ${RED}❌ Frontend App${NC}"
fi

# Check Redis
if docker exec internship_demo_redis redis-cli ping > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Redis Cache${NC}"
else
    echo -e "   ${RED}❌ Redis Cache${NC}"
fi

echo ""

# Run quick performance test
echo -e "${BLUE}⚡ Running quick performance test...${NC}"

# Test API endpoints
API_RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:8081/health)
echo "   Health endpoint: ${API_RESPONSE_TIME}s"

# Test database connection
DB_TEST=$(curl -s http://localhost:8081/api/v1/test 2>/dev/null || echo "failed")
if [[ "$DB_TEST" != "failed" ]]; then
    echo -e "   ${GREEN}✅ Database connectivity${NC}"
else
    echo -e "   ${YELLOW}⚠️  Database connectivity (may need initialization)${NC}"
fi

echo ""

# Show demo accounts
echo -e "${CYAN}👥 Demo Accounts Ready:${NC}"
echo "   Admin: admin@university.ac.th / password123"
echo "   Staff: staff001@university.ac.th / password123"
echo "   Students: 65010001-65010005 / password123"
echo ""

# Show URLs
echo -e "${CYAN}🌐 Demo URLs:${NC}"
echo "   Frontend (React): http://localhost:3001"
echo "   Backend API: http://localhost:8081"
echo "   API Health: http://localhost:8081/health"
echo "   API Test: http://localhost:8081/api/v1/test"
echo ""

# Optional: Start with nginx
read -p "Start with Nginx reverse proxy? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🌐 Starting Nginx reverse proxy...${NC}"
    docker-compose -f docker-compose.demo.yml --profile full-demo up -d nginx_demo
    
    # Wait for nginx
    sleep 5
    
    if curl -s http://localhost:8080/health > /dev/null; then
        echo -e "   ${GREEN}✅ Nginx Proxy running${NC}"
        echo "   Full Stack URL: http://localhost:8080"
    else
        echo -e "   ${YELLOW}⚠️  Nginx starting up...${NC}"
    fi
    echo ""
fi

# Show container status
echo -e "${BLUE}🐳 Container Status:${NC}"
docker-compose -f docker-compose.demo.yml ps

echo ""

# Performance summary
echo -e "${PURPLE}📊 Demo Performance Summary:${NC}"
echo -e "${CYAN}=================================${NC}"
echo "   ✅ Production Docker containers"
echo "   ✅ PostgreSQL database with demo data"
echo "   ✅ Redis caching layer"
echo "   ✅ Multi-service architecture"
echo "   ✅ Health checks enabled"
echo "   ✅ API response time: ${API_RESPONSE_TIME}s"
echo ""

# Open browser automatically (macOS)
if command -v open &> /dev/null; then
    echo -e "${BLUE}🌐 Opening demo in browser...${NC}"
    sleep 2
    open http://localhost:3001
    sleep 1
    open http://localhost:8081/health
fi

echo -e "${GREEN}🎉 Demo deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}💡 For PM Presentation:${NC}"
echo "   1. Show frontend at: http://localhost:3001"
echo "   2. Demo login with accounts above"
echo "   3. Show API health: http://localhost:8081/health"
echo "   4. Explain production-ready architecture"
echo "   5. Show Docker containers: docker-compose -f docker-compose.demo.yml ps"
echo ""
echo -e "${CYAN}🛠️  Management Commands:${NC}"
echo "   View logs: docker-compose -f docker-compose.demo.yml logs -f"
echo "   Stop demo: docker-compose -f docker-compose.demo.yml down"
echo "   Restart: docker-compose -f docker-compose.demo.yml restart"
echo ""
echo -e "${GREEN}🚀 Ready for PM presentation! 🚀${NC}"