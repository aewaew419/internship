package tests

import (
	"backend-go/internal/services"
	"bytes"
	"encoding/json"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLogger_LogLevels(t *testing.T) {
	var buf bytes.Buffer
	
	logger := services.NewLogger(services.LoggerConfig{
		Level:        services.DEBUG,
		ServiceName:  "test-service",
		Output:       &buf,
		EnableCaller: false,
	})

	// Test different log levels
	logger.Debug("Debug message")
	logger.Info("Info message")
	logger.Warn("Warning message")
	logger.Error("Error message")

	output := buf.String()
	lines := strings.Split(strings.TrimSpace(output), "\n")
	
	assert.Equal(t, 4, len(lines), "Should have 4 log entries")

	// Parse and verify each log entry
	for i, line := range lines {
		var entry services.LogEntry
		err := json.Unmarshal([]byte(line), &entry)
		assert.NoError(t, err, "Should be valid JSON")
		
		assert.Equal(t, "test-service", entry.Service)
		assert.NotEmpty(t, entry.Timestamp)
		
		switch i {
		case 0:
			assert.Equal(t, "DEBUG", entry.Level)
			assert.Equal(t, "Debug message", entry.Message)
		case 1:
			assert.Equal(t, "INFO", entry.Level)
			assert.Equal(t, "Info message", entry.Message)
		case 2:
			assert.Equal(t, "WARN", entry.Level)
			assert.Equal(t, "Warning message", entry.Message)
		case 3:
			assert.Equal(t, "ERROR", entry.Level)
			assert.Equal(t, "Error message", entry.Message)
		}
	}
}

func TestLogger_LogLevelFiltering(t *testing.T) {
	var buf bytes.Buffer
	
	logger := services.NewLogger(services.LoggerConfig{
		Level:        services.WARN,
		ServiceName:  "test-service",
		Output:       &buf,
		EnableCaller: false,
	})

	// Log messages at different levels
	logger.Debug("Debug message")  // Should be filtered out
	logger.Info("Info message")    // Should be filtered out
	logger.Warn("Warning message") // Should be logged
	logger.Error("Error message")  // Should be logged

	output := buf.String()
	lines := strings.Split(strings.TrimSpace(output), "\n")
	
	// Should only have 2 log entries (WARN and ERROR)
	assert.Equal(t, 2, len(lines), "Should have 2 log entries")

	// Verify the logged entries
	var warnEntry, errorEntry services.LogEntry
	
	err := json.Unmarshal([]byte(lines[0]), &warnEntry)
	assert.NoError(t, err)
	assert.Equal(t, "WARN", warnEntry.Level)
	assert.Equal(t, "Warning message", warnEntry.Message)
	
	err = json.Unmarshal([]byte(lines[1]), &errorEntry)
	assert.NoError(t, err)
	assert.Equal(t, "ERROR", errorEntry.Level)
	assert.Equal(t, "Error message", errorEntry.Message)
}

func TestLogger_WithFields(t *testing.T) {
	var buf bytes.Buffer
	
	logger := services.NewLogger(services.LoggerConfig{
		Level:        services.INFO,
		ServiceName:  "test-service",
		Output:       &buf,
		EnableCaller: false,
	})

	fields := map[string]interface{}{
		"user_id": 123,
		"action":  "login",
		"ip":      "192.168.1.1",
	}

	logger.Info("User logged in", fields)

	output := buf.String()
	var entry services.LogEntry
	err := json.Unmarshal([]byte(strings.TrimSpace(output)), &entry)
	assert.NoError(t, err)

	assert.Equal(t, "INFO", entry.Level)
	assert.Equal(t, "User logged in", entry.Message)
	assert.Equal(t, "test-service", entry.Service)
	assert.NotNil(t, entry.Fields)
	assert.Equal(t, float64(123), entry.Fields["user_id"]) // JSON unmarshals numbers as float64
	assert.Equal(t, "login", entry.Fields["action"])
	assert.Equal(t, "192.168.1.1", entry.Fields["ip"])
}

func TestLogger_EnableCaller(t *testing.T) {
	var buf bytes.Buffer
	
	logger := services.NewLogger(services.LoggerConfig{
		Level:        services.INFO,
		ServiceName:  "test-service",
		Output:       &buf,
		EnableCaller: true,
	})

	logger.Info("Test message with caller")

	output := buf.String()
	var entry services.LogEntry
	err := json.Unmarshal([]byte(strings.TrimSpace(output)), &entry)
	assert.NoError(t, err)

	assert.NotEmpty(t, entry.Caller, "Caller information should be present")
	// Just check that caller information is present, not the specific file name
	// since the runtime.Caller might show different paths in different environments
}

func TestDefaultLogger(t *testing.T) {
	logger := services.DefaultLogger()
	
	assert.NotNil(t, logger)
	// Default logger should be configured for development
}

func TestProductionLogger(t *testing.T) {
	logger := services.ProductionLogger()
	
	assert.NotNil(t, logger)
	// Production logger should be configured for production
}

func TestGlobalLogger(t *testing.T) {
	// Initialize global logger
	services.InitGlobalLogger(services.LoggerConfig{
		Level:       services.INFO,
		ServiceName: "global-test",
	})
	
	// We can't easily test the global logger output since it writes to stdout
	// But we can test that the functions don't panic
	assert.NotPanics(t, func() {
		services.Info("Global info message")
		services.Warn("Global warning message")
		services.Error("Global error message")
	})
	
	// Test getting global logger
	globalLogger := services.GetGlobalLogger()
	assert.NotNil(t, globalLogger)
}

func TestLogLevel_String(t *testing.T) {
	tests := []struct {
		level    services.LogLevel
		expected string
	}{
		{services.DEBUG, "DEBUG"},
		{services.INFO, "INFO"},
		{services.WARN, "WARN"},
		{services.ERROR, "ERROR"},
		{services.FATAL, "FATAL"},
		{services.LogLevel(999), "UNKNOWN"},
	}
	
	for _, test := range tests {
		assert.Equal(t, test.expected, test.level.String())
	}
}