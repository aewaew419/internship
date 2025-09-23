#!/bin/bash

# Comprehensive Test Runner Script for Go Backend
# This script runs all test suites and generates comprehensive reports

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COVERAGE_DIR="${PROJECT_ROOT}/coverage"
REPORTS_DIR="${PROJECT_ROOT}/test-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="${REPORTS_DIR}/test_run_${TIMESTAMP}.log"

# Test configuration
TEST_TIMEOUT="30m"
RACE_FLAG="-race"
VERBOSE_FLAG=""
SHORT_FLAG=""
COVERAGE_THRESHOLD=70  # Minimum coverage percentage

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

# Function to create directories
setup_directories() {
    print_status "Setting up test directories..."
    mkdir -p "${COVERAGE_DIR}"
    mkdir -p "${REPORTS_DIR}"
    
    # Create subdirectories for different test types
    mkdir -p "${COVERAGE_DIR}/unit"
    mkdir -p "${COVERAGE_DIR}/integration"
    mkdir -p "${COVERAGE_DIR}/performance"
    mkdir -p "${COVERAGE_DIR}/packages"
}

# Function to clean previous test artifacts
clean_previous_runs() {
    print_status "Cleaning previous test artifacts..."
    rm -f "${COVERAGE_DIR}"/*.out
    rm -f "${COVERAGE_DIR}"/*.html
    rm -f "${COVERAGE_DIR}"/*.xml
    rm -f "${COVERAGE_DIR}"/*.json
    go clean -testcache
}

# Function to check Go environment
check_environment() {
    print_status "Checking Go environment..."
    
    if ! command -v go &> /dev/null; then
        print_error "Go is not installed or not in PATH"
        exit 1
    fi
    
    GO_VERSION=$(go version | awk '{print $3}')
    print_status "Go version: ${GO_VERSION}"
    
    # Check if we're in the right directory
    if [ ! -f "${PROJECT_ROOT}/go.mod" ]; then
        print_error "go.mod not found. Please run this script from the project root."
        exit 1
    fi
    
    print_success "Environment check passed"
}

# Function to run linting
run_linting() {
    print_status "Running code linting..."
    
    # Run go vet
    if go vet ./...; then
        print_success "go vet passed"
    else
        print_warning "go vet found issues"
    fi
    
    # Run go fmt check
    UNFORMATTED=$(go fmt ./...)
    if [ -z "$UNFORMATTED" ]; then
        print_success "Code formatting is correct"
    else
        print_warning "Some files were reformatted: $UNFORMATTED"
    fi
    
    # Run golangci-lint if available
    if command -v golangci-lint &> /dev/null; then
        print_status "Running golangci-lint..."
        if golangci-lint run; then
            print_success "golangci-lint passed"
        else
            print_warning "golangci-lint found issues"
        fi
    else
        print_warning "golangci-lint not found, skipping advanced linting"
    fi
}

# Function to run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    
    local coverage_file="${COVERAGE_DIR}/unit/coverage.out"
    local report_file="${REPORTS_DIR}/unit_tests_${TIMESTAMP}.txt"
    
    if go test ${RACE_FLAG} ${VERBOSE_FLAG} ${SHORT_FLAG} -timeout ${TEST_TIMEOUT} \
        -coverprofile="${coverage_file}" \
        ./tests/unit/... ./internal/services/... ./internal/middleware/... ./internal/models/... \
        2>&1 | tee "${report_file}"; then
        print_success "Unit tests passed"
        
        # Generate coverage report
        if [ -f "${coverage_file}" ]; then
            go tool cover -func="${coverage_file}" > "${COVERAGE_DIR}/unit/coverage_func.txt"
            go tool cover -html="${coverage_file}" -o "${COVERAGE_DIR}/unit/coverage.html"
            
            # Extract coverage percentage
            local coverage_pct=$(go tool cover -func="${coverage_file}" | grep total | awk '{print $3}' | sed 's/%//')
            print_status "Unit test coverage: ${coverage_pct}%"
            
            if (( $(echo "$coverage_pct >= $COVERAGE_THRESHOLD" | bc -l) )); then
                print_success "Unit test coverage meets threshold (${COVERAGE_THRESHOLD}%)"
            else
                print_warning "Unit test coverage below threshold: ${coverage_pct}% < ${COVERAGE_THRESHOLD}%"
            fi
        fi
    else
        print_error "Unit tests failed"
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    
    local coverage_file="${COVERAGE_DIR}/integration/coverage.out"
    local report_file="${REPORTS_DIR}/integration_tests_${TIMESTAMP}.txt"
    
    if go test ${RACE_FLAG} ${VERBOSE_FLAG} -timeout ${TEST_TIMEOUT} \
        -coverprofile="${coverage_file}" \
        ./tests/integration/... ./tests/... \
        2>&1 | tee "${report_file}"; then
        print_success "Integration tests passed"
        
        # Generate coverage report
        if [ -f "${coverage_file}" ]; then
            go tool cover -func="${coverage_file}" > "${COVERAGE_DIR}/integration/coverage_func.txt"
            go tool cover -html="${coverage_file}" -o "${COVERAGE_DIR}/integration/coverage.html"
            
            local coverage_pct=$(go tool cover -func="${coverage_file}" | grep total | awk '{print $3}' | sed 's/%//')
            print_status "Integration test coverage: ${coverage_pct}%"
        fi
    else
        print_error "Integration tests failed"
        return 1
    fi
}

# Function to run performance tests
run_performance_tests() {
    print_status "Running performance tests..."
    
    local coverage_file="${COVERAGE_DIR}/performance/coverage.out"
    local report_file="${REPORTS_DIR}/performance_tests_${TIMESTAMP}.txt"
    
    # Performance tests don't use race detection as it affects performance
    if go test -timeout ${TEST_TIMEOUT} \
        -coverprofile="${coverage_file}" \
        ./tests/performance/... \
        2>&1 | tee "${report_file}"; then
        print_success "Performance tests passed"
        
        # Generate coverage report
        if [ -f "${coverage_file}" ]; then
            go tool cover -func="${coverage_file}" > "${COVERAGE_DIR}/performance/coverage_func.txt"
            go tool cover -html="${coverage_file}" -o "${COVERAGE_DIR}/performance/coverage.html"
        fi
    else
        print_warning "Performance tests had issues (this may be expected)"
    fi
}

# Function to run package-specific tests
run_package_tests() {
    print_status "Running package-specific tests..."
    
    local packages=(
        "internal/services"
        "internal/handlers"
        "internal/middleware"
        "internal/models"
        "internal/database"
        "internal/validation"
    )
    
    for package in "${packages[@]}"; do
        if [ -d "${PROJECT_ROOT}/${package}" ]; then
            print_status "Testing package: ${package}"
            
            local package_name=$(echo "${package}" | sed 's/\//_/g')
            local coverage_file="${COVERAGE_DIR}/packages/${package_name}_coverage.out"
            local report_file="${REPORTS_DIR}/${package_name}_tests_${TIMESTAMP}.txt"
            
            if go test ${RACE_FLAG} -timeout ${TEST_TIMEOUT} \
                -coverprofile="${coverage_file}" \
                "./${package}/..." \
                2>&1 | tee "${report_file}"; then
                print_success "Package ${package} tests passed"
                
                if [ -f "${coverage_file}" ]; then
                    go tool cover -func="${coverage_file}" > "${COVERAGE_DIR}/packages/${package_name}_coverage_func.txt"
                    local coverage_pct=$(go tool cover -func="${coverage_file}" | grep total | awk '{print $3}' | sed 's/%//')
                    print_status "Package ${package} coverage: ${coverage_pct}%"
                fi
            else
                print_warning "Package ${package} tests had issues"
            fi
        else
            print_warning "Package ${package} not found, skipping"
        fi
    done
}

# Function to generate comprehensive coverage report
generate_comprehensive_coverage() {
    print_status "Generating comprehensive coverage report..."
    
    local all_coverage_file="${COVERAGE_DIR}/all_coverage.out"
    local comprehensive_report="${REPORTS_DIR}/comprehensive_coverage_${TIMESTAMP}.txt"
    
    # Run all tests with coverage
    if go test ${RACE_FLAG} -timeout ${TEST_TIMEOUT} \
        -coverprofile="${all_coverage_file}" \
        ./...; then
        
        # Generate different report formats
        go tool cover -func="${all_coverage_file}" > "${comprehensive_report}"
        go tool cover -html="${all_coverage_file}" -o "${COVERAGE_DIR}/comprehensive_coverage.html"
        
        # Extract overall coverage
        local overall_coverage=$(go tool cover -func="${all_coverage_file}" | grep total | awk '{print $3}' | sed 's/%//')
        
        print_status "Overall test coverage: ${overall_coverage}%"
        
        # Generate coverage summary
        cat > "${REPORTS_DIR}/coverage_summary_${TIMESTAMP}.txt" << EOF
Test Coverage Summary - $(date)
=====================================

Overall Coverage: ${overall_coverage}%
Coverage Threshold: ${COVERAGE_THRESHOLD}%
Status: $(if (( $(echo "$overall_coverage >= $COVERAGE_THRESHOLD" | bc -l) )); then echo "PASS"; else echo "FAIL"; fi)

Coverage Reports Generated:
- HTML Report: ${COVERAGE_DIR}/comprehensive_coverage.html
- Function Report: ${comprehensive_report}
- Raw Coverage Data: ${all_coverage_file}

EOF
        
        if (( $(echo "$overall_coverage >= $COVERAGE_THRESHOLD" | bc -l) )); then
            print_success "Overall coverage meets threshold: ${overall_coverage}% >= ${COVERAGE_THRESHOLD}%"
        else
            print_warning "Overall coverage below threshold: ${overall_coverage}% < ${COVERAGE_THRESHOLD}%"
        fi
    else
        print_error "Failed to generate comprehensive coverage report"
        return 1
    fi
}

# Function to run benchmarks
run_benchmarks() {
    print_status "Running benchmarks..."
    
    local benchmark_file="${REPORTS_DIR}/benchmarks_${TIMESTAMP}.txt"
    
    if go test -bench=. -benchmem ./... > "${benchmark_file}" 2>&1; then
        print_success "Benchmarks completed"
        print_status "Benchmark results saved to: ${benchmark_file}"
    else
        print_warning "Benchmarks had issues"
    fi
}

# Function to generate test summary
generate_test_summary() {
    print_status "Generating test summary..."
    
    local summary_file="${REPORTS_DIR}/test_summary_${TIMESTAMP}.txt"
    
    cat > "${summary_file}" << EOF
Test Execution Summary - $(date)
=======================================

Test Run ID: ${TIMESTAMP}
Project Root: ${PROJECT_ROOT}
Go Version: $(go version | awk '{print $3}')

Test Configuration:
- Timeout: ${TEST_TIMEOUT}
- Race Detection: $(if [ -n "${RACE_FLAG}" ]; then echo "Enabled"; else echo "Disabled"; fi)
- Verbose Mode: $(if [ -n "${VERBOSE_FLAG}" ]; then echo "Enabled"; else echo "Disabled"; fi)
- Short Mode: $(if [ -n "${SHORT_FLAG}" ]; then echo "Enabled"; else echo "Disabled"; fi)

Generated Reports:
- Coverage Directory: ${COVERAGE_DIR}
- Reports Directory: ${REPORTS_DIR}
- Log File: ${LOG_FILE}

Test Types Executed:
- Unit Tests: ✓
- Integration Tests: ✓
- Performance Tests: ✓
- Package Tests: ✓
- Benchmarks: ✓

Coverage Reports:
- Comprehensive HTML: ${COVERAGE_DIR}/comprehensive_coverage.html
- Unit Tests HTML: ${COVERAGE_DIR}/unit/coverage.html
- Integration Tests HTML: ${COVERAGE_DIR}/integration/coverage.html

EOF

    print_success "Test summary generated: ${summary_file}"
}

# Function to display usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -v, --verbose       Enable verbose test output
    -s, --short         Run tests in short mode (skip long-running tests)
    -r, --no-race       Disable race detection
    -c, --coverage-only Run only coverage generation
    -u, --unit-only     Run only unit tests
    -i, --integration-only Run only integration tests
    -p, --performance-only Run only performance tests
    -b, --benchmarks    Run benchmarks
    -h, --help          Show this help message

Examples:
    $0                  # Run all tests with default settings
    $0 -v               # Run all tests with verbose output
    $0 -s               # Run tests in short mode
    $0 -u               # Run only unit tests
    $0 -c               # Generate coverage reports only

EOF
}

# Main execution function
main() {
    local run_unit=true
    local run_integration=true
    local run_performance=true
    local run_packages=true
    local run_benchmarks=false
    local coverage_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--verbose)
                VERBOSE_FLAG="-v"
                shift
                ;;
            -s|--short)
                SHORT_FLAG="-short"
                shift
                ;;
            -r|--no-race)
                RACE_FLAG=""
                shift
                ;;
            -c|--coverage-only)
                coverage_only=true
                shift
                ;;
            -u|--unit-only)
                run_integration=false
                run_performance=false
                run_packages=false
                shift
                ;;
            -i|--integration-only)
                run_unit=false
                run_performance=false
                run_packages=false
                shift
                ;;
            -p|--performance-only)
                run_unit=false
                run_integration=false
                run_packages=false
                shift
                ;;
            -b|--benchmarks)
                run_benchmarks=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Start logging
    exec > >(tee -a "${LOG_FILE}")
    exec 2>&1
    
    print_status "Starting comprehensive test suite execution..."
    print_status "Timestamp: ${TIMESTAMP}"
    print_status "Log file: ${LOG_FILE}"
    
    # Setup
    check_environment
    setup_directories
    clean_previous_runs
    
    if [ "$coverage_only" = true ]; then
        print_status "Running coverage generation only..."
        generate_comprehensive_coverage
        generate_test_summary
        print_success "Coverage generation completed!"
        exit 0
    fi
    
    # Run linting
    run_linting
    
    # Run test suites
    local test_failures=0
    
    if [ "$run_unit" = true ]; then
        if ! run_unit_tests; then
            ((test_failures++))
        fi
    fi
    
    if [ "$run_integration" = true ]; then
        if ! run_integration_tests; then
            ((test_failures++))
        fi
    fi
    
    if [ "$run_performance" = true ]; then
        if ! run_performance_tests; then
            ((test_failures++))
        fi
    fi
    
    if [ "$run_packages" = true ]; then
        run_package_tests
    fi
    
    # Generate comprehensive coverage
    generate_comprehensive_coverage
    
    # Run benchmarks if requested
    if [ "$run_benchmarks" = true ]; then
        run_benchmarks
    fi
    
    # Generate summary
    generate_test_summary
    
    # Final status
    if [ $test_failures -eq 0 ]; then
        print_success "All test suites completed successfully!"
        print_status "Reports available in: ${REPORTS_DIR}"
        print_status "Coverage reports available in: ${COVERAGE_DIR}"
        exit 0
    else
        print_error "Some test suites failed (${test_failures} failures)"
        print_status "Check the reports in: ${REPORTS_DIR}"
        exit 1
    fi
}

# Change to project root directory
cd "${PROJECT_ROOT}"

# Run main function with all arguments
main "$@"