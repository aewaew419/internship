# Go Backend Test Suite Makefile

# Variables
COVERAGE_DIR = coverage
COVERAGE_FILE = $(COVERAGE_DIR)/coverage.out
COVERAGE_HTML = $(COVERAGE_DIR)/coverage.html
TEST_TIMEOUT = 30m
RACE_FLAG = -race

# Default target
.PHONY: all
all: test

# Create coverage directory
$(COVERAGE_DIR):
	mkdir -p $(COVERAGE_DIR)

# Clean coverage files
.PHONY: clean
clean:
	rm -rf $(COVERAGE_DIR)
	go clean -testcache

# Run all tests
.PHONY: test
test: $(COVERAGE_DIR)
	@echo "Running all tests..."
	go test $(RACE_FLAG) -timeout $(TEST_TIMEOUT) ./...

# Run tests with coverage
.PHONY: test-coverage
test-coverage: $(COVERAGE_DIR)
	@echo "Running tests with coverage..."
	go test $(RACE_FLAG) -timeout $(TEST_TIMEOUT) -coverprofile=$(COVERAGE_FILE) ./...
	@echo "Coverage report generated: $(COVERAGE_FILE)"

# Generate HTML coverage report
.PHONY: coverage-html
coverage-html: test-coverage
	@echo "Generating HTML coverage report..."
	go tool cover -html=$(COVERAGE_FILE) -o $(COVERAGE_HTML)
	@echo "HTML coverage report generated: $(COVERAGE_HTML)"

# Show coverage in terminal
.PHONY: coverage-func
coverage-func: test-coverage
	@echo "Coverage by function:"
	go tool cover -func=$(COVERAGE_FILE)

# Run unit tests only
.PHONY: test-unit
test-unit: $(COVERAGE_DIR)
	@echo "Running unit tests..."
	go test $(RACE_FLAG) -timeout $(TEST_TIMEOUT) -coverprofile=$(COVERAGE_DIR)/unit_coverage.out ./tests/unit/...
	go tool cover -func=$(COVERAGE_DIR)/unit_coverage.out

# Run integration tests only
.PHONY: test-integration
test-integration: $(COVERAGE_DIR)
	@echo "Running integration tests..."
	go test $(RACE_FLAG) -timeout $(TEST_TIMEOUT) -coverprofile=$(COVERAGE_DIR)/integration_coverage.out ./tests/integration/...
	go tool cover -func=$(COVERAGE_DIR)/integration_coverage.out

# Run performance tests only
.PHONY: test-performance
test-performance: $(COVERAGE_DIR)
	@echo "Running performance tests..."
	go test -timeout $(TEST_TIMEOUT) -coverprofile=$(COVERAGE_DIR)/performance_coverage.out ./tests/performance/...

# Run tests by package
.PHONY: test-services
test-services: $(COVERAGE_DIR)
	@echo "Testing services..."
	go test $(RACE_FLAG) -timeout $(TEST_TIMEOUT) -coverprofile=$(COVERAGE_DIR)/services_coverage.out ./internal/services/...
	go tool cover -func=$(COVERAGE_DIR)/services_coverage.out

.PHONY: test-handlers
test-handlers: $(COVERAGE_DIR)
	@echo "Testing handlers..."
	go test $(RACE_FLAG) -timeout $(TEST_TIMEOUT) -coverprofile=$(COVERAGE_DIR)/handlers_coverage.out ./internal/handlers/...
	go tool cover -func=$(COVERAGE_DIR)/handlers_coverage.out

.PHONY: test-middleware
test-middleware: $(COVERAGE_DIR)
	@echo "Testing middleware..."
	go test $(RACE_FLAG) -timeout $(TEST_TIMEOUT) -coverprofile=$(COVERAGE_DIR)/middleware_coverage.out ./internal/middleware/...
	go tool cover -func=$(COVERAGE_DIR)/middleware_coverage.out

.PHONY: test-models
test-models: $(COVERAGE_DIR)
	@echo "Testing models..."
	go test $(RACE_FLAG) -timeout $(TEST_TIMEOUT) -coverprofile=$(COVERAGE_DIR)/models_coverage.out ./internal/models/...
	go tool cover -func=$(COVERAGE_DIR)/models_coverage.out

# Run tests with verbose output
.PHONY: test-verbose
test-verbose: $(COVERAGE_DIR)
	@echo "Running tests with verbose output..."
	go test $(RACE_FLAG) -timeout $(TEST_TIMEOUT) -v -coverprofile=$(COVERAGE_FILE) ./...

# Run tests in short mode (skip long-running tests)
.PHONY: test-short
test-short: $(COVERAGE_DIR)
	@echo "Running tests in short mode..."
	go test $(RACE_FLAG) -timeout 5m -short -coverprofile=$(COVERAGE_DIR)/short_coverage.out ./...

# Run specific test by name
.PHONY: test-run
test-run: $(COVERAGE_DIR)
	@if [ -z "$(TEST)" ]; then \
		echo "Usage: make test-run TEST=TestName"; \
		exit 1; \
	fi
	@echo "Running test: $(TEST)"
	go test $(RACE_FLAG) -timeout $(TEST_TIMEOUT) -run $(TEST) -v ./...

# Benchmark tests
.PHONY: benchmark
benchmark:
	@echo "Running benchmarks..."
	go test -bench=. -benchmem ./...

# Run tests with race detection
.PHONY: test-race
test-race: $(COVERAGE_DIR)
	@echo "Running tests with race detection..."
	go test -race -timeout $(TEST_TIMEOUT) ./...

# Generate test coverage badge (requires additional tools)
.PHONY: coverage-badge
coverage-badge: test-coverage
	@echo "Generating coverage badge..."
	@COVERAGE=$$(go tool cover -func=$(COVERAGE_FILE) | grep total | awk '{print $$3}' | sed 's/%//'); \
	echo "Coverage: $$COVERAGE%"; \
	if [ -n "$$COVERAGE" ]; then \
		echo "Coverage badge data: $$COVERAGE%"; \
	fi

# Lint and format code before testing
.PHONY: lint
lint:
	@echo "Running linters..."
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run; \
	else \
		echo "golangci-lint not found, running basic checks..."; \
		go vet ./...; \
		go fmt ./...; \
	fi

# Run tests with database setup (for integration tests)
.PHONY: test-db
test-db: $(COVERAGE_DIR)
	@echo "Running tests with database setup..."
	@echo "Setting up test database..."
	@# Add database setup commands here if needed
	go test $(RACE_FLAG) -timeout $(TEST_TIMEOUT) -tags=integration -coverprofile=$(COVERAGE_DIR)/db_coverage.out ./...

# Generate test report in JUnit format (requires go-junit-report)
.PHONY: test-junit
test-junit: $(COVERAGE_DIR)
	@echo "Generating JUnit test report..."
	@if command -v go-junit-report >/dev/null 2>&1; then \
		go test -timeout $(TEST_TIMEOUT) -v ./... 2>&1 | go-junit-report > $(COVERAGE_DIR)/junit.xml; \
		echo "JUnit report generated: $(COVERAGE_DIR)/junit.xml"; \
	else \
		echo "go-junit-report not found, install with: go install github.com/jstemmer/go-junit-report@latest"; \
	fi

# Run all test suites in sequence
.PHONY: test-all
test-all: clean lint test-unit test-integration test-performance coverage-html
	@echo "All test suites completed successfully!"

# Quick test run (unit tests only, no coverage)
.PHONY: test-quick
test-quick:
	@echo "Running quick tests..."
	go test -short ./internal/...

# Test with memory profiling
.PHONY: test-mem
test-mem: $(COVERAGE_DIR)
	@echo "Running tests with memory profiling..."
	go test -timeout $(TEST_TIMEOUT) -memprofile=$(COVERAGE_DIR)/mem.prof ./tests/performance/...

# Test with CPU profiling
.PHONY: test-cpu
test-cpu: $(COVERAGE_DIR)
	@echo "Running tests with CPU profiling..."
	go test -timeout $(TEST_TIMEOUT) -cpuprofile=$(COVERAGE_DIR)/cpu.prof ./tests/performance/...

# Watch tests (requires entr or similar tool)
.PHONY: test-watch
test-watch:
	@echo "Watching for changes and running tests..."
	@if command -v entr >/dev/null 2>&1; then \
		find . -name "*.go" | entr -c make test-quick; \
	else \
		echo "entr not found, install with your package manager"; \
		echo "Example: brew install entr (macOS) or apt-get install entr (Ubuntu)"; \
	fi

# Help target
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  test              - Run all tests"
	@echo "  test-coverage     - Run tests with coverage"
	@echo "  coverage-html     - Generate HTML coverage report"
	@echo "  coverage-func     - Show coverage by function"
	@echo "  test-unit         - Run unit tests only"
	@echo "  test-integration  - Run integration tests only"
	@echo "  test-performance  - Run performance tests only"
	@echo "  test-services     - Test services package"
	@echo "  test-handlers     - Test handlers package"
	@echo "  test-middleware   - Test middleware package"
	@echo "  test-models       - Test models package"
	@echo "  test-verbose      - Run tests with verbose output"
	@echo "  test-short        - Run tests in short mode"
	@echo "  test-run TEST=X   - Run specific test by name"
	@echo "  benchmark         - Run benchmark tests"
	@echo "  test-race         - Run tests with race detection"
	@echo "  lint              - Run linters and formatters"
	@echo "  test-all          - Run complete test suite"
	@echo "  test-quick        - Quick test run (unit only)"
	@echo "  clean             - Clean coverage files"
	@echo "  help              - Show this help message"