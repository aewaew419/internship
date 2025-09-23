package services

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

// LogLevel represents different log levels
type LogLevel int

const (
	DEBUG LogLevel = iota
	INFO
	WARN
	ERROR
	FATAL
)

// String returns the string representation of log level
func (l LogLevel) String() string {
	switch l {
	case DEBUG:
		return "DEBUG"
	case INFO:
		return "INFO"
	case WARN:
		return "WARN"
	case ERROR:
		return "ERROR"
	case FATAL:
		return "FATAL"
	default:
		return "UNKNOWN"
	}
}

// LogEntry represents a structured log entry
type LogEntry struct {
	Timestamp   string                 `json:"timestamp"`
	Level       string                 `json:"level"`
	Message     string                 `json:"message"`
	Service     string                 `json:"service"`
	RequestID   string                 `json:"request_id,omitempty"`
	UserID      uint                   `json:"user_id,omitempty"`
	UserEmail   string                 `json:"user_email,omitempty"`
	Method      string                 `json:"method,omitempty"`
	Path        string                 `json:"path,omitempty"`
	StatusCode  int                    `json:"status_code,omitempty"`
	Latency     string                 `json:"latency,omitempty"`
	LatencyMS   int64                  `json:"latency_ms,omitempty"`
	IP          string                 `json:"ip,omitempty"`
	UserAgent   string                 `json:"user_agent,omitempty"`
	Error       string                 `json:"error,omitempty"`
	Fields      map[string]interface{} `json:"fields,omitempty"`
	Caller      string                 `json:"caller,omitempty"`
}

// Logger represents the structured logger
type Logger struct {
	level       LogLevel
	serviceName string
	output      io.Writer
	enableCaller bool
}

// LoggerConfig holds logger configuration
type LoggerConfig struct {
	Level        LogLevel
	ServiceName  string
	Output       io.Writer
	EnableCaller bool
}

// NewLogger creates a new structured logger
func NewLogger(config LoggerConfig) *Logger {
	if config.Output == nil {
		config.Output = os.Stdout
	}
	if config.ServiceName == "" {
		config.ServiceName = "backend-go"
	}

	return &Logger{
		level:        config.Level,
		serviceName:  config.ServiceName,
		output:       config.Output,
		enableCaller: config.EnableCaller,
	}
}

// DefaultLogger creates a logger with default configuration
func DefaultLogger() *Logger {
	return NewLogger(LoggerConfig{
		Level:        INFO,
		ServiceName:  "backend-go",
		Output:       os.Stdout,
		EnableCaller: true,
	})
}

// ProductionLogger creates a logger optimized for production
func ProductionLogger() *Logger {
	return NewLogger(LoggerConfig{
		Level:        INFO,
		ServiceName:  "backend-go",
		Output:       os.Stdout,
		EnableCaller: false,
	})
}

// log writes a log entry
func (l *Logger) log(level LogLevel, message string, fields map[string]interface{}) {
	if level < l.level {
		return
	}

	entry := LogEntry{
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Level:     level.String(),
		Message:   message,
		Service:   l.serviceName,
		Fields:    fields,
	}

	// Add caller information if enabled
	if l.enableCaller {
		if pc, file, line, ok := runtime.Caller(3); ok {
			funcName := runtime.FuncForPC(pc).Name()
			// Get just the filename, not the full path
			parts := strings.Split(file, "/")
			filename := parts[len(parts)-1]
			entry.Caller = fmt.Sprintf("%s:%d:%s", filename, line, funcName)
		}
	}

	// Convert to JSON and write
	jsonData, err := json.Marshal(entry)
	if err != nil {
		// Fallback to standard log
		log.Printf("Failed to marshal log entry: %v", err)
		return
	}

	fmt.Fprintln(l.output, string(jsonData))
}

// Debug logs a debug message
func (l *Logger) Debug(message string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	}
	l.log(DEBUG, message, f)
}

// Info logs an info message
func (l *Logger) Info(message string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	}
	l.log(INFO, message, f)
}

// Warn logs a warning message
func (l *Logger) Warn(message string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	}
	l.log(WARN, message, f)
}

// Error logs an error message
func (l *Logger) Error(message string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	}
	l.log(ERROR, message, f)
}

// Fatal logs a fatal message and exits
func (l *Logger) Fatal(message string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	}
	l.log(FATAL, message, f)
	os.Exit(1)
}

// WithRequestContext creates a logger with request context
func (l *Logger) WithRequestContext(c *fiber.Ctx) *ContextLogger {
	requestID := ""
	if id, ok := c.Locals("request_id").(string); ok {
		requestID = id
	}

	userID := uint(0)
	userEmail := ""
	if id, ok := c.Locals("user_id").(uint); ok {
		userID = id
	}
	if email, ok := c.Locals("user_email").(string); ok {
		userEmail = email
	}

	return &ContextLogger{
		logger:    l,
		requestID: requestID,
		userID:    userID,
		userEmail: userEmail,
		method:    c.Method(),
		path:      c.Path(),
		ip:        c.IP(),
		userAgent: c.Get("User-Agent"),
	}
}

// ContextLogger represents a logger with request context
type ContextLogger struct {
	logger    *Logger
	requestID string
	userID    uint
	userEmail string
	method    string
	path      string
	ip        string
	userAgent string
}

// logWithContext logs with request context
func (cl *ContextLogger) logWithContext(level LogLevel, message string, fields map[string]interface{}) {
	if level < cl.logger.level {
		return
	}

	entry := LogEntry{
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Level:     level.String(),
		Message:   message,
		Service:   cl.logger.serviceName,
		RequestID: cl.requestID,
		UserID:    cl.userID,
		UserEmail: cl.userEmail,
		Method:    cl.method,
		Path:      cl.path,
		IP:        cl.ip,
		UserAgent: cl.userAgent,
		Fields:    fields,
	}

	// Add caller information if enabled
	if cl.logger.enableCaller {
		if pc, file, line, ok := runtime.Caller(2); ok {
			funcName := runtime.FuncForPC(pc).Name()
			parts := strings.Split(file, "/")
			filename := parts[len(parts)-1]
			entry.Caller = fmt.Sprintf("%s:%d:%s", filename, line, funcName)
		}
	}

	// Convert to JSON and write
	jsonData, err := json.Marshal(entry)
	if err != nil {
		log.Printf("Failed to marshal log entry: %v", err)
		return
	}

	fmt.Fprintln(cl.logger.output, string(jsonData))
}

// Debug logs a debug message with context
func (cl *ContextLogger) Debug(message string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	}
	cl.logWithContext(DEBUG, message, f)
}

// Info logs an info message with context
func (cl *ContextLogger) Info(message string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	}
	cl.logWithContext(INFO, message, f)
}

// Warn logs a warning message with context
func (cl *ContextLogger) Warn(message string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	}
	cl.logWithContext(WARN, message, f)
}

// Error logs an error message with context
func (cl *ContextLogger) Error(message string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	}
	cl.logWithContext(ERROR, message, f)
}

// LogRequest logs HTTP request information
func (cl *ContextLogger) LogRequest(statusCode int, latency time.Duration, err error) {
	entry := LogEntry{
		Timestamp:  time.Now().UTC().Format(time.RFC3339),
		Level:      INFO.String(),
		Message:    "HTTP Request",
		Service:    cl.logger.serviceName,
		RequestID:  cl.requestID,
		UserID:     cl.userID,
		UserEmail:  cl.userEmail,
		Method:     cl.method,
		Path:       cl.path,
		StatusCode: statusCode,
		Latency:    latency.String(),
		LatencyMS:  latency.Milliseconds(),
		IP:         cl.ip,
		UserAgent:  cl.userAgent,
	}

	// Adjust log level based on status code
	if statusCode >= 500 {
		entry.Level = ERROR.String()
		entry.Message = "HTTP Request Error"
	} else if statusCode >= 400 {
		entry.Level = WARN.String()
		entry.Message = "HTTP Request Warning"
	}

	// Add error information if present
	if err != nil {
		entry.Error = err.Error()
	}

	// Convert to JSON and write
	jsonData, jsonErr := json.Marshal(entry)
	if jsonErr != nil {
		log.Printf("Failed to marshal log entry: %v", jsonErr)
		return
	}

	fmt.Fprintln(cl.logger.output, string(jsonData))
}

// LogSecurity logs security-related events
func (cl *ContextLogger) LogSecurity(event string, fields map[string]interface{}) {
	if fields == nil {
		fields = make(map[string]interface{})
	}
	fields["security_event"] = event

	cl.logWithContext(WARN, fmt.Sprintf("Security Event: %s", event), fields)
}

// Global logger instance
var globalLogger *Logger

// InitGlobalLogger initializes the global logger
func InitGlobalLogger(config LoggerConfig) {
	globalLogger = NewLogger(config)
}

// GetGlobalLogger returns the global logger instance
func GetGlobalLogger() *Logger {
	if globalLogger == nil {
		globalLogger = DefaultLogger()
	}
	return globalLogger
}

// Convenience functions for global logger
func Debug(message string, fields ...map[string]interface{}) {
	GetGlobalLogger().Debug(message, fields...)
}

func Info(message string, fields ...map[string]interface{}) {
	GetGlobalLogger().Info(message, fields...)
}

func Warn(message string, fields ...map[string]interface{}) {
	GetGlobalLogger().Warn(message, fields...)
}

func Error(message string, fields ...map[string]interface{}) {
	GetGlobalLogger().Error(message, fields...)
}

func Fatal(message string, fields ...map[string]interface{}) {
	GetGlobalLogger().Fatal(message, fields...)
}