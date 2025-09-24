#!/bin/bash

# Integration Test Script for Frontend & Backend
# This script starts both servers and runs integration tests

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=8080
FRONTEND_PORT=3000
BACKEND_URL="http://localhost:$BACKEND_PORT"
FRONTEND_URL="http://localhost:$FRONTEND_PORT"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BOLD}${BLUE}$1${NC}"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within $((max_attempts * 2)) seconds"
    return 1
}

# Function to start backend server
start_backend() {
    print_status "Starting backend server..."
    
    if check_port $BACKEND_PORT; then
        print_warning "Backend port $BACKEND_PORT is already in use"
        if curl -s "$BACKEND_URL/health" >/dev/null 2>&1; then
            print_success "Backend is already running and healthy"
            return 0
        else
            print_error "Port $BACKEND_PORT is occupied but backend is not responding"
            return 1
        fi
    fi
    
    cd apps/backend
    
    # Check if Go is installed
    if ! command -v go &> /dev/null; then
        print_error "Go is not installed. Please install Go to run the backend."
        return 1
    fi
    
    # Start backend in background
    print_status "Starting Go Fiber backend on port $BACKEND_PORT..."
    nohup go run cmd/server/main_simple.go > backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > backend.pid
    
    cd ../..
    
    # Wait for backend to be ready
    if wait_for_service "$BACKEND_URL/health" "Backend"; then
        print_success "Backend started successfully (PID: $BACKEND_PID)"
        return 0
    else
        print_error "Backend failed to start"
        return 1
    fi
}

# Function to start frontend server
start_frontend() {
    print_status "Starting frontend server..."
    
    if check_port $FRONTEND_PORT; then
        print_warning "Frontend port $FRONTEND_PORT is already in use"
        if curl -s "$FRONTEND_URL" >/dev/null 2>&1; then
            print_success "Frontend is already running"
            return 0
        else
            print_error "Port $FRONTEND_PORT is occupied but frontend is not responding"
            return 1
        fi
    fi
    
    cd apps/frontend
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js to run the frontend."
        return 1
    fi
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Start frontend in background
    print_status "Starting Next.js frontend on port $FRONTEND_PORT..."
    nohup npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
    
    cd ../..
    
    # Wait for frontend to be ready
    if wait_for_service "$FRONTEND_URL" "Frontend"; then
        print_success "Frontend started successfully (PID: $FRONTEND_PID)"
        return 0
    else
        print_error "Frontend failed to start"
        return 1
    fi
}

# Function to stop servers
stop_servers() {
    print_status "Stopping servers..."
    
    # Stop backend
    if [ -f "apps/backend/backend.pid" ]; then
        BACKEND_PID=$(cat apps/backend/backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID
            print_success "Backend stopped (PID: $BACKEND_PID)"
        fi
        rm -f apps/backend/backend.pid
    fi
    
    # Stop frontend
    if [ -f "apps/frontend/frontend.pid" ]; then
        FRONTEND_PID=$(cat apps/frontend/frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            print_success "Frontend stopped (PID: $FRONTEND_PID)"
        fi
        rm -f apps/frontend/frontend.pid
    fi
    
    # Kill any remaining processes on the ports
    if check_port $BACKEND_PORT; then
        print_status "Killing remaining processes on port $BACKEND_PORT..."
        lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    fi
    
    if check_port $FRONTEND_PORT; then
        print_status "Killing remaining processes on port $FRONTEND_PORT..."
        lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_header "🧪 Running Integration Tests"
    
    # Check if Node.js is available for running tests
    if ! command -v node &> /dev/null; then
        print_error "Node.js is required to run integration tests"
        return 1
    fi
    
    # Install axios if not available
    if ! node -e "require('axios')" 2>/dev/null; then
        print_status "Installing axios for integration tests..."
        npm install axios
    fi
    
    # Run the integration test script
    node integration-test.js
}

# Function to show logs
show_logs() {
    print_header "📋 Server Logs"
    
    if [ -f "apps/backend/backend.log" ]; then
        print_status "Backend logs (last 20 lines):"
        tail -20 apps/backend/backend.log
    fi
    
    if [ -f "apps/frontend/frontend.log" ]; then
        print_status "Frontend logs (last 20 lines):"
        tail -20 apps/frontend/frontend.log
    fi
}

# Function to check system requirements
check_requirements() {
    print_header "🔍 Checking System Requirements"
    
    local missing_requirements=0
    
    # Check Go
    if command -v go &> /dev/null; then
        GO_VERSION=$(go version | cut -d' ' -f3)
        print_success "Go is installed: $GO_VERSION"
    else
        print_error "Go is not installed"
        missing_requirements=1
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
    else
        print_error "Node.js is not installed"
        missing_requirements=1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm is installed: $NPM_VERSION"
    else
        print_error "npm is not installed"
        missing_requirements=1
    fi
    
    # Check curl
    if command -v curl &> /dev/null; then
        print_success "curl is available"
    else
        print_error "curl is not installed"
        missing_requirements=1
    fi
    
    if [ $missing_requirements -eq 1 ]; then
        print_error "Please install missing requirements before running tests"
        return 1
    fi
    
    return 0
}

# Function to show help
show_help() {
    echo "Integration Test Script for Internship Management System"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start-backend    Start only the backend server"
    echo "  start-frontend   Start only the frontend server"
    echo "  start-all        Start both backend and frontend servers"
    echo "  test             Run integration tests (starts servers if needed)"
    echo "  stop             Stop all servers"
    echo "  logs             Show server logs"
    echo "  check            Check system requirements"
    echo "  help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 test          # Run full integration test"
    echo "  $0 start-all     # Start both servers"
    echo "  $0 stop          # Stop all servers"
}

# Trap to cleanup on exit
trap 'stop_servers' EXIT

# Main script logic
case "${1:-test}" in
    "start-backend")
        check_requirements && start_backend
        ;;
    "start-frontend")
        check_requirements && start_frontend
        ;;
    "start-all")
        check_requirements && start_backend && start_frontend
        ;;
    "test")
        print_header "🚀 Integration Test Suite"
        print_status "Testing Frontend ↔ Backend Integration"
        echo ""
        
        if ! check_requirements; then
            exit 1
        fi
        
        # Start servers if not running
        start_backend || exit 1
        start_frontend || exit 1
        
        # Run integration tests
        if run_integration_tests; then
            print_success "All integration tests passed! 🎉"
            exit 0
        else
            print_error "Some integration tests failed ❌"
            show_logs
            exit 1
        fi
        ;;
    "stop")
        stop_servers
        ;;
    "logs")
        show_logs
        ;;
    "check")
        check_requirements
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac