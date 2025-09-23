package tests

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// TestConfiguration holds all test configuration settings
type TestConfiguration struct {
	// Database settings
	DatabaseURL     string
	TestDatabaseURL string
	
	// JWT settings
	JWTSecret string
	
	// Test timeouts
	DefaultTimeout time.Duration
	LongTimeout    time.Duration
	ShortTimeout   time.Duration
	
	// Coverage settings
	CoverageThreshold float64
	CoverageDir       string
	ReportsDir        string
	
	// Performance test settings
	DefaultConcurrency     int
	DefaultRequestsPerTest int
	PerformanceThreshold   struct {
		RequestsPerSecond float64
		AverageLatency    time.Duration
		MaxLatency        time.Duration
	}
	
	// Test environment
	Environment string
	LogLevel    string
	
	// Feature flags for tests
	EnableDatabaseTests    bool
	EnablePerformanceTests bool
	EnableIntegrationTests bool
	EnableBenchmarkTests   bool
}

// LoadTestConfiguration loads test configuration from environment variables
func LoadTestConfiguration() *TestConfiguration {
	config := &TestConfiguration{
		// Default values
		DatabaseURL:     "root:password@tcp(localhost:3306)/internship_db?charset=utf8mb4&parseTime=True&loc=Local",
		TestDatabaseURL: "root:password@tcp(localhost:3306)/internship_test_db?charset=utf8mb4&parseTime=True&loc=Local",
		JWTSecret:       "test-jwt-secret-key-for-testing-only",
		DefaultTimeout:  30 * time.Minute,
		LongTimeout:     60 * time.Minute,
		ShortTimeout:    5 * time.Minute,
		CoverageThreshold: 70.0,
		CoverageDir:     "coverage",
		ReportsDir:      "test-reports",
		DefaultConcurrency: 10,
		DefaultRequestsPerTest: 100,
		Environment:     "test",
		LogLevel:        "info",
		EnableDatabaseTests:    true,
		EnablePerformanceTests: true,
		EnableIntegrationTests: true,
		EnableBenchmarkTests:   false,
	}
	
	// Performance thresholds
	config.PerformanceThreshold.RequestsPerSecond = 50.0
	config.PerformanceThreshold.AverageLatency = 100 * time.Millisecond
	config.PerformanceThreshold.MaxLatency = 1 * time.Second
	
	// Override with environment variables if present
	if dbURL := os.Getenv("DATABASE_URL"); dbURL != "" {
		config.DatabaseURL = dbURL
	}
	
	if testDBURL := os.Getenv("TEST_DATABASE_URL"); testDBURL != "" {
		config.TestDatabaseURL = testDBURL
	}
	
	if jwtSecret := os.Getenv("JWT_SECRET"); jwtSecret != "" {
		config.JWTSecret = jwtSecret
	}
	
	if env := os.Getenv("ENVIRONMENT"); env != "" {
		config.Environment = env
	}
	
	if logLevel := os.Getenv("LOG_LEVEL"); logLevel != "" {
		config.LogLevel = logLevel
	}
	
	if coverageThreshold := os.Getenv("COVERAGE_THRESHOLD"); coverageThreshold != "" {
		if threshold, err := strconv.ParseFloat(coverageThreshold, 64); err == nil {
			config.CoverageThreshold = threshold
		}
	}
	
	if coverageDir := os.Getenv("COVERAGE_DIR"); coverageDir != "" {
		config.CoverageDir = coverageDir
	}
	
	if reportsDir := os.Getenv("REPORTS_DIR"); reportsDir != "" {
		config.ReportsDir = reportsDir
	}
	
	// Feature flags
	if enableDB := os.Getenv("ENABLE_DATABASE_TESTS"); enableDB != "" {
		config.EnableDatabaseTests = enableDB == "true" || enableDB == "1"
	}
	
	if enablePerf := os.Getenv("ENABLE_PERFORMANCE_TESTS"); enablePerf != "" {
		config.EnablePerformanceTests = enablePerf == "true" || enablePerf == "1"
	}
	
	if enableInteg := os.Getenv("ENABLE_INTEGRATION_TESTS"); enableInteg != "" {
		config.EnableIntegrationTests = enableInteg == "true" || enableInteg == "1"
	}
	
	if enableBench := os.Getenv("ENABLE_BENCHMARK_TESTS"); enableBench != "" {
		config.EnableBenchmarkTests = enableBench == "true" || enableBench == "1"
	}
	
	// Performance settings
	if concurrency := os.Getenv("TEST_CONCURRENCY"); concurrency != "" {
		if c, err := strconv.Atoi(concurrency); err == nil {
			config.DefaultConcurrency = c
		}
	}
	
	if requests := os.Getenv("TEST_REQUESTS_PER_TEST"); requests != "" {
		if r, err := strconv.Atoi(requests); err == nil {
			config.DefaultRequestsPerTest = r
		}
	}
	
	return config
}

// GetDatabaseDSN returns the appropriate database DSN for testing
func (c *TestConfiguration) GetDatabaseDSN() string {
	if c.Environment == "test" {
		return c.TestDatabaseURL
	}
	return c.DatabaseURL
}

// ShouldRunDatabaseTests returns whether database tests should be executed
func (c *TestConfiguration) ShouldRunDatabaseTests() bool {
	return c.EnableDatabaseTests && c.Environment == "test"
}

// ShouldRunPerformanceTests returns whether performance tests should be executed
func (c *TestConfiguration) ShouldRunPerformanceTests() bool {
	return c.EnablePerformanceTests
}

// ShouldRunIntegrationTests returns whether integration tests should be executed
func (c *TestConfiguration) ShouldRunIntegrationTests() bool {
	return c.EnableIntegrationTests
}

// ShouldRunBenchmarkTests returns whether benchmark tests should be executed
func (c *TestConfiguration) ShouldRunBenchmarkTests() bool {
	return c.EnableBenchmarkTests
}

// GetTestTimeout returns the appropriate timeout for the test type
func (c *TestConfiguration) GetTestTimeout(testType string) time.Duration {
	switch testType {
	case "short":
		return c.ShortTimeout
	case "long", "performance", "integration":
		return c.LongTimeout
	default:
		return c.DefaultTimeout
	}
}

// ValidateConfiguration validates the test configuration
func (c *TestConfiguration) ValidateConfiguration() error {
	if c.JWTSecret == "" {
		return fmt.Errorf("JWT secret is required for testing")
	}
	
	if c.CoverageThreshold < 0 || c.CoverageThreshold > 100 {
		return fmt.Errorf("coverage threshold must be between 0 and 100")
	}
	
	if c.DefaultConcurrency <= 0 {
		return fmt.Errorf("concurrency must be greater than 0")
	}
	
	if c.DefaultRequestsPerTest <= 0 {
		return fmt.Errorf("requests per test must be greater than 0")
	}
	
	return nil
}

// PrintConfiguration prints the current test configuration
func (c *TestConfiguration) PrintConfiguration() {
	fmt.Println("Test Configuration:")
	fmt.Printf("  Environment: %s\n", c.Environment)
	fmt.Printf("  Database URL: %s\n", maskSensitiveInfo(c.GetDatabaseDSN()))
	fmt.Printf("  JWT Secret: %s\n", maskSensitiveInfo(c.JWTSecret))
	fmt.Printf("  Coverage Threshold: %.1f%%\n", c.CoverageThreshold)
	fmt.Printf("  Coverage Directory: %s\n", c.CoverageDir)
	fmt.Printf("  Reports Directory: %s\n", c.ReportsDir)
	fmt.Printf("  Default Timeout: %v\n", c.DefaultTimeout)
	fmt.Printf("  Default Concurrency: %d\n", c.DefaultConcurrency)
	fmt.Printf("  Requests Per Test: %d\n", c.DefaultRequestsPerTest)
	fmt.Printf("  Database Tests: %t\n", c.EnableDatabaseTests)
	fmt.Printf("  Performance Tests: %t\n", c.EnablePerformanceTests)
	fmt.Printf("  Integration Tests: %t\n", c.EnableIntegrationTests)
	fmt.Printf("  Benchmark Tests: %t\n", c.EnableBenchmarkTests)
	fmt.Printf("  Performance Thresholds:\n")
	fmt.Printf("    Requests/sec: %.1f\n", c.PerformanceThreshold.RequestsPerSecond)
	fmt.Printf("    Avg Latency: %v\n", c.PerformanceThreshold.AverageLatency)
	fmt.Printf("    Max Latency: %v\n", c.PerformanceThreshold.MaxLatency)
}

// maskSensitiveInfo masks sensitive information for logging
func maskSensitiveInfo(info string) string {
	if len(info) <= 8 {
		return "****"
	}
	return info[:4] + "****" + info[len(info)-4:]
}

// Global test configuration instance
var GlobalTestConfig *TestConfiguration

// init initializes the global test configuration
func init() {
	GlobalTestConfig = LoadTestConfiguration()
}