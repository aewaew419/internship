#!/bin/bash

# Enhanced Test Runner Script
# Comprehensive test execution with reporting and analysis

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COVERAGE_DIR="coverage"
REPORTS_DIR="test-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="${REPORTS_DIR}/test_run_${TIMESTAMP}.log"

# Test configuration
UNIT_TEST_TIMEOUT="10m"
INTEGRATION_TEST_TIMEOUT="20m"
PERFORMANCE_TEST_TIMEOUT="30m"
COVERAGE_THRESHOLD=70

# Create directories
mkdir -p "${COVERAGE_DIR}"
mkdir -p "${REPORTS_DIR}"

# Logging function
log() {
    echo -e "${1}" | tee -a "${LOG_FILE}"
}

# Error handling
handle_error() {
    log "${RED}❌ Error occurred in test runner${NC}"
    log "${RED}Check log file: ${LOG_FILE}${NC}"
    exit 1
}

trap handle_error ERR

# Header
log "${BLUE}🚀 Enhanced Test Runner - Backend Go${NC}"
log "${BLUE}================================================${NC}"
log "Timestamp: $(date)"
log "Coverage Directory: ${COVERAGE_DIR}"
log "Reports Directory: ${REPORTS_DIR}"
log "Log File: ${LOG_FILE}"
log ""

# Check Go installation
log "${YELLOW}🔍 Checking Go installation...${NC}"
if ! command -v go &> /dev/null; then
    log "${RED}❌ Go is not installed or not in PATH${NC}"
    exit 1
fi

GO_VERSION=$(go version)
log "${GREEN}✅ Go found: ${GO_VERSION}${NC}"
log ""

# Check dependencies
log "${YELLOW}🔍 Checking test dependencies...${NC}"
go mod tidy
go mod download
log "${GREEN}✅ Dependencies updated${NC}"
log ""

# Clean previous results
log "${YELLOW}🧹 Cleaning previous test results...${NC}"
rm -rf "${COVERAGE_DIR}"/*
mkdir -p "${COVERAGE_DIR}"
log "${GREEN}✅ Cleanup completed${NC}"
log ""

# Lint and format check
log "${YELLOW}🔍 Running code quality checks...${NC}"
if command -v golangci-lint &> /dev/null; then
    log "Running golangci-lint..."
    golangci-lint run --timeout=5m --out-format=colored-line-number | tee -a "${LOG_FILE}"
    log "${GREEN}✅ Linting completed${NC}"
else
    log "${YELLOW}⚠️  golangci-lint not found, running basic checks...${NC}"
    go vet ./... | tee -a "${LOG_FILE}"
    go fmt ./... | tee -a "${LOG_FILE}"
    log "${GREEN}✅ Basic checks completed${NC}"
fi
log ""

# Unit Tests
log "${YELLOW}🧪 Running Unit Tests...${NC}"
log "Timeout: ${UNIT_TEST_TIMEOUT}"
log "Coverage file: ${COVERAGE_DIR}/unit_coverage.out"

go test -race -timeout "${UNIT_TEST_TIMEOUT}" \
    -coverprofile="${COVERAGE_DIR}/unit_coverage.out" \
    -covermode=atomic \
    -v \
    ./tests/unit/... 2>&1 | tee -a "${LOG_FILE}"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    log "${GREEN}✅ Unit tests passed${NC}"
    
    # Generate unit test coverage report
    if [ -f "${COVERAGE_DIR}/unit_coverage.out" ]; then
        go tool cover -func="${COVERAGE_DIR}/unit_coverage.out" > "${COVERAGE_DIR}/unit_coverage_func.txt"
        go tool cover -html="${COVERAGE_DIR}/unit_coverage.out" -o "${COVERAGE_DIR}/unit_coverage.html"
        
        UNIT_COVERAGE=$(go tool cover -func="${COVERAGE_DIR}/unit_coverage.out" | grep total | awk '{print $3}' | sed 's/%//')
        log "${BLUE}📊 Unit Test Coverage: ${UNIT_COVERAGE}%${NC}"
        
        if (( $(echo "${UNIT_COVERAGE} >= ${COVERAGE_THRESHOLD}" | bc -l) )); then
            log "${GREEN}✅ Unit test coverage meets threshold (${COVERAGE_THRESHOLD}%)${NC}"
        else
            log "${YELLOW}⚠️  Unit test coverage below threshold: ${UNIT_COVERAGE}% < ${COVERAGE_THRESHOLD}%${NC}"
        fi
    fi
else
    log "${RED}❌ Unit tests failed${NC}"
    UNIT_TESTS_FAILED=true
fi
log ""

# Integration Tests
log "${YELLOW}🔗 Running Integration Tests...${NC}"
log "Timeout: ${INTEGRATION_TEST_TIMEOUT}"
log "Coverage file: ${COVERAGE_DIR}/integration_coverage.out"

go test -race -timeout "${INTEGRATION_TEST_TIMEOUT}" \
    -coverprofile="${COVERAGE_DIR}/integration_coverage.out" \
    -covermode=atomic \
    -v \
    ./tests/integration/... 2>&1 | tee -a "${LOG_FILE}"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    log "${GREEN}✅ Integration tests passed${NC}"
    
    # Generate integration test coverage report
    if [ -f "${COVERAGE_DIR}/integration_coverage.out" ]; then
        go tool cover -func="${COVERAGE_DIR}/integration_coverage.out" > "${COVERAGE_DIR}/integration_coverage_func.txt"
        go tool cover -html="${COVERAGE_DIR}/integration_coverage.out" -o "${COVERAGE_DIR}/integration_coverage.html"
        
        INTEGRATION_COVERAGE=$(go tool cover -func="${COVERAGE_DIR}/integration_coverage.out" | grep total | awk '{print $3}' | sed 's/%//')
        log "${BLUE}📊 Integration Test Coverage: ${INTEGRATION_COVERAGE}%${NC}"
    fi
else
    log "${RED}❌ Integration tests failed${NC}"
    INTEGRATION_TESTS_FAILED=true
fi
log ""

# Performance Tests
log "${YELLOW}⚡ Running Performance Tests...${NC}"
log "Timeout: ${PERFORMANCE_TEST_TIMEOUT}"

go test -timeout "${PERFORMANCE_TEST_TIMEOUT}" \
    -bench=. \
    -benchmem \
    -cpuprofile="${COVERAGE_DIR}/cpu.prof" \
    -memprofile="${COVERAGE_DIR}/mem.prof" \
    -v \
    ./tests/performance/... 2>&1 | tee -a "${LOG_FILE}"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    log "${GREEN}✅ Performance tests completed${NC}"
else
    log "${RED}❌ Performance tests failed${NC}"
    PERFORMANCE_TESTS_FAILED=true
fi
log ""

# Combined Coverage Report
log "${YELLOW}📊 Generating Combined Coverage Report...${NC}"

# Merge coverage files if they exist
COVERAGE_FILES=""
if [ -f "${COVERAGE_DIR}/unit_coverage.out" ]; then
    COVERAGE_FILES="${COVERAGE_FILES} ${COVERAGE_DIR}/unit_coverage.out"
fi
if [ -f "${COVERAGE_DIR}/integration_coverage.out" ]; then
    COVERAGE_FILES="${COVERAGE_FILES} ${COVERAGE_DIR}/integration_coverage.out"
fi

if [ -n "${COVERAGE_FILES}" ]; then
    # Simple merge (for demonstration - in production you'd use a proper tool)
    cat ${COVERAGE_FILES} | grep -v "mode:" > "${COVERAGE_DIR}/merged_coverage.out"
    echo "mode: atomic" | cat - "${COVERAGE_DIR}/merged_coverage.out" > "${COVERAGE_DIR}/combined_coverage.out"
    
    # Generate combined reports
    go tool cover -func="${COVERAGE_DIR}/combined_coverage.out" > "${COVERAGE_DIR}/combined_coverage_func.txt"
    go tool cover -html="${COVERAGE_DIR}/combined_coverage.out" -o "${COVERAGE_DIR}/combined_coverage.html"
    
    COMBINED_COVERAGE=$(go tool cover -func="${COVERAGE_DIR}/combined_coverage.out" | grep total | awk '{print $3}' | sed 's/%//')
    log "${BLUE}📊 Combined Coverage: ${COMBINED_COVERAGE}%${NC}"
    
    if (( $(echo "${COMBINED_COVERAGE} >= ${COVERAGE_THRESHOLD}" | bc -l) )); then
        log "${GREEN}✅ Combined coverage meets threshold (${COVERAGE_THRESHOLD}%)${NC}"
    else
        log "${YELLOW}⚠️  Combined coverage below threshold: ${COMBINED_COVERAGE}% < ${COVERAGE_THRESHOLD}%${NC}"
        COVERAGE_BELOW_THRESHOLD=true
    fi
fi
log ""

# Generate Test Report
log "${YELLOW}📝 Generating Test Report...${NC}"

REPORT_FILE="${REPORTS_DIR}/test_report_${TIMESTAMP}.md"

cat > "${REPORT_FILE}" << EOF
# Test Report - $(date)

## Summary

- **Timestamp**: $(date)
- **Go Version**: ${GO_VERSION}
- **Coverage Threshold**: ${COVERAGE_THRESHOLD}%

## Test Results

### Unit Tests
- **Status**: $([ -z "${UNIT_TESTS_FAILED}" ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Coverage**: ${UNIT_COVERAGE:-"N/A"}%
- **Report**: [Unit Coverage HTML](../coverage/unit_coverage.html)

### Integration Tests
- **Status**: $([ -z "${INTEGRATION_TESTS_FAILED}" ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Coverage**: ${INTEGRATION_COVERAGE:-"N/A"}%
- **Report**: [Integration Coverage HTML](../coverage/integration_coverage.html)

### Performance Tests
- **Status**: $([ -z "${PERFORMANCE_TESTS_FAILED}" ] && echo "✅ PASSED" || echo "❌ FAILED")
- **CPU Profile**: [CPU Profile](../coverage/cpu.prof)
- **Memory Profile**: [Memory Profile](../coverage/mem.prof)

### Combined Coverage
- **Coverage**: ${COMBINED_COVERAGE:-"N/A"}%
- **Report**: [Combined Coverage HTML](../coverage/combined_coverage.html)
- **Threshold Met**: $([ -z "${COVERAGE_BELOW_THRESHOLD}" ] && echo "✅ YES" || echo "❌ NO")

## Files Generated

- Log File: \`${LOG_FILE}\`
- Coverage Directory: \`${COVERAGE_DIR}/\`
- Reports Directory: \`${REPORTS_DIR}/\`

## Coverage Details

EOF

# Add coverage details if available
if [ -f "${COVERAGE_DIR}/combined_coverage_func.txt" ]; then
    echo "### Coverage by Package" >> "${REPORT_FILE}"
    echo '```' >> "${REPORT_FILE}"
    cat "${COVERAGE_DIR}/combined_coverage_func.txt" >> "${REPORT_FILE}"
    echo '```' >> "${REPORT_FILE}"
fi

log "${GREEN}✅ Test report generated: ${REPORT_FILE}${NC}"
log ""

# Generate JUnit XML if go-junit-report is available
if command -v go-junit-report &> /dev/null; then
    log "${YELLOW}📄 Generating JUnit XML report...${NC}"
    
    # Extract test output and convert to JUnit XML
    grep -E "(RUN|PASS|FAIL|SKIP)" "${LOG_FILE}" | go-junit-report > "${REPORTS_DIR}/junit_${TIMESTAMP}.xml"
    
    log "${GREEN}✅ JUnit XML report generated: ${REPORTS_DIR}/junit_${TIMESTAMP}.xml${NC}"
else
    log "${YELLOW}⚠️  go-junit-report not found, skipping JUnit XML generation${NC}"
    log "Install with: go install github.com/jstemmer/go-junit-report@latest"
fi
log ""

# Performance Analysis
if [ -f "${COVERAGE_DIR}/cpu.prof" ] && command -v go &> /dev/null; then
    log "${YELLOW}🔍 Performance Analysis Available${NC}"
    log "CPU Profile: go tool pprof ${COVERAGE_DIR}/cpu.prof"
    log "Memory Profile: go tool pprof ${COVERAGE_DIR}/mem.prof"
    log ""
fi

# Summary
log "${BLUE}📋 Test Execution Summary${NC}"
log "${BLUE}================================================${NC}"

TOTAL_FAILURES=0

if [ -n "${UNIT_TESTS_FAILED}" ]; then
    log "${RED}❌ Unit Tests: FAILED${NC}"
    ((TOTAL_FAILURES++))
else
    log "${GREEN}✅ Unit Tests: PASSED${NC}"
fi

if [ -n "${INTEGRATION_TESTS_FAILED}" ]; then
    log "${RED}❌ Integration Tests: FAILED${NC}"
    ((TOTAL_FAILURES++))
else
    log "${GREEN}✅ Integration Tests: PASSED${NC}"
fi

if [ -n "${PERFORMANCE_TESTS_FAILED}" ]; then
    log "${RED}❌ Performance Tests: FAILED${NC}"
    ((TOTAL_FAILURES++))
else
    log "${GREEN}✅ Performance Tests: PASSED${NC}"
fi

if [ -n "${COVERAGE_BELOW_THRESHOLD}" ]; then
    log "${YELLOW}⚠️  Coverage: BELOW THRESHOLD${NC}"
else
    log "${GREEN}✅ Coverage: MEETS THRESHOLD${NC}"
fi

log ""
log "📊 Combined Coverage: ${COMBINED_COVERAGE:-"N/A"}%"
log "📝 Test Report: ${REPORT_FILE}"
log "📋 Log File: ${LOG_FILE}"
log ""

# Final status
if [ ${TOTAL_FAILURES} -eq 0 ] && [ -z "${COVERAGE_BELOW_THRESHOLD}" ]; then
    log "${GREEN}🎉 All tests passed and coverage meets threshold!${NC}"
    exit 0
elif [ ${TOTAL_FAILURES} -eq 0 ]; then
    log "${YELLOW}⚠️  Tests passed but coverage is below threshold${NC}"
    exit 1
else
    log "${RED}❌ ${TOTAL_FAILURES} test suite(s) failed${NC}"
    exit 1
fi