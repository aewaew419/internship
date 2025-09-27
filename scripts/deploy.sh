#!/bin/bash

# Main Deployment Script
# Usage: ./scripts/deploy.sh [dev|prod|test]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENV=${1:-dev}

echo -e "${BLUE}🚀 Internship System Deployment${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "${YELLOW}Environment: ${ENV}${NC}"
echo ""

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Function to deploy development environment
deploy_dev() {
    echo -e "${BLUE}🔧 Deploying Development Environment...${NC}"
    
    # Copy environment file
    if [ ! -f .env ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Created .env file from .env.example${NC}"
        echo -e "${YELLOW}   Please update the values as needed${NC}"
    fi
    
    # Build and start services
    docker-compose up --build -d postgres backend frontend
    
    echo -e "${GREEN}✅ Development environment started${NC}"
    echo -e "${BLUE}🌐 Frontend: http://localhost:3000${NC}"
    echo -e "${BLUE}🔧 Backend: http://localhost:8080${NC}"
}

# Function to deploy production environment
deploy_prod() {
    echo -e "${BLUE}🚀 Deploying Production Environment...${NC}"
    
    # Check if production env file exists
    if [ ! -f .env.production ]; then
        echo -e "${RED}❌ .env.production file not found${NC}"
        echo -e "${YELLOW}   Please create .env.production with production values${NC}"
        exit 1
    fi
    
    # Use production environment
    export $(cat .env.production | xargs)
    
    # Build and start all services including nginx and redis
    docker-compose --profile production up --build -d
    
    echo -e "${GREEN}✅ Production environment started${NC}"
    echo -e "${BLUE}🌐 Website: http://localhost${NC}"
    echo -e "${BLUE}🔧 API: http://localhost/api${NC}"
}

# Function to deploy test environment
deploy_test() {
    echo -e "${BLUE}🧪 Deploying Test Environment...${NC}"
    
    # Use test database port to avoid conflicts
    export DB_PORT=5433
    export BACKEND_PORT=8081
    export FRONTEND_PORT=3001
    
    docker-compose up --build -d postgres backend frontend
    
    echo -e "${GREEN}✅ Test environment started${NC}"
    echo -e "${BLUE}🌐 Frontend: http://localhost:3001${NC}"
    echo -e "${BLUE}🔧 Backend: http://localhost:8081${NC}"
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}📋 Showing logs...${NC}"
    docker-compose logs -f --tail=50
}

# Function to stop services
stop_services() {
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Services stopped${NC}"
}

# Main execution
check_docker

case $ENV in
    "dev"|"development")
        deploy_dev
        ;;
    "prod"|"production")
        deploy_prod
        ;;
    "test"|"testing")
        deploy_test
        ;;
    "logs")
        show_logs
        ;;
    "stop")
        stop_services
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: $ENV${NC}"
        echo -e "${YELLOW}Usage: $0 [dev|prod|test|logs|stop]${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo -e "${BLUE}💡 Tips:${NC}"
echo -e "   - View logs: $0 logs"
echo -e "   - Stop services: $0 stop"
echo -e "   - Check status: docker-compose ps"