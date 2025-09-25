package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DatabaseConfig holds database configuration parameters
type DatabaseConfig struct {
	DSN                string
	MaxIdleConns       int
	MaxOpenConns       int
	ConnMaxLifetime    time.Duration
	ConnMaxIdleTime    time.Duration
	LogLevel           logger.LogLevel
	SlowThreshold      time.Duration
	EnableAutoMigrate  bool
}

// DefaultConfig returns default database configuration
func DefaultConfig() *DatabaseConfig {
	return &DatabaseConfig{
		MaxIdleConns:      10,
		MaxOpenConns:      100,
		ConnMaxLifetime:   time.Hour,
		ConnMaxIdleTime:   time.Minute * 30,
		LogLevel:          logger.Info,
		SlowThreshold:     time.Millisecond * 200,
		EnableAutoMigrate: false,
	}
}

// LoadConfigFromEnv loads database configuration from environment variables
func LoadConfigFromEnv() *DatabaseConfig {
	config := DefaultConfig()
	
	if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
		config.DSN = dsn
	}
	
	if maxIdle := os.Getenv("DB_MAX_IDLE_CONNS"); maxIdle != "" {
		if val, err := strconv.Atoi(maxIdle); err == nil {
			config.MaxIdleConns = val
		}
	}
	
	if maxOpen := os.Getenv("DB_MAX_OPEN_CONNS"); maxOpen != "" {
		if val, err := strconv.Atoi(maxOpen); err == nil {
			config.MaxOpenConns = val
		}
	}
	
	if lifetime := os.Getenv("DB_CONN_MAX_LIFETIME"); lifetime != "" {
		if val, err := time.ParseDuration(lifetime); err == nil {
			config.ConnMaxLifetime = val
		}
	}
	
	if idleTime := os.Getenv("DB_CONN_MAX_IDLE_TIME"); idleTime != "" {
		if val, err := time.ParseDuration(idleTime); err == nil {
			config.ConnMaxIdleTime = val
		}
	}
	
	if logLevel := os.Getenv("DB_LOG_LEVEL"); logLevel != "" {
		switch logLevel {
		case "silent":
			config.LogLevel = logger.Silent
		case "error":
			config.LogLevel = logger.Error
		case "warn":
			config.LogLevel = logger.Warn
		case "info":
			config.LogLevel = logger.Info
		}
	}
	
	if slowThreshold := os.Getenv("DB_SLOW_THRESHOLD"); slowThreshold != "" {
		if val, err := time.ParseDuration(slowThreshold); err == nil {
			config.SlowThreshold = val
		}
	}
	
	if autoMigrate := os.Getenv("DB_AUTO_MIGRATE"); autoMigrate == "true" {
		config.EnableAutoMigrate = true
	}
	
	return config
}

// Connect establishes database connection with the provided configuration
func Connect(dsn string) (*gorm.DB, error) {
	config := LoadConfigFromEnv()
	if dsn != "" {
		config.DSN = dsn
	}
	return ConnectWithConfig(config)
}

// ConnectWithConfig establishes database connection with custom configuration
func ConnectWithConfig(config *DatabaseConfig) (*gorm.DB, error) {
	if config.DSN == "" {
		return nil, fmt.Errorf("database DSN is required")
	}

	// Configure GORM logger
	gormLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             config.SlowThreshold,
			LogLevel:                  config.LogLevel,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	// Determine database driver based on DSN
	var dialector gorm.Dialector
	if strings.HasPrefix(config.DSN, "sqlite:") {
		// Remove sqlite: prefix for SQLite
		sqlitePath := strings.TrimPrefix(config.DSN, "sqlite:")
		dialector = sqlite.Open(sqlitePath)
	} else if strings.HasPrefix(config.DSN, "postgres://") || strings.HasPrefix(config.DSN, "postgresql://") {
		// PostgreSQL
		dialector = postgres.Open(config.DSN)
	} else {
		// Default to MySQL
		dialector = mysql.Open(config.DSN)
	}

	// Open database connection
	db, err := gorm.Open(dialector, &gorm.Config{
		Logger:                 gormLogger,
		DisableForeignKeyConstraintWhenMigrating: false,
		SkipDefaultTransaction: false,
		PrepareStmt:           true,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	// Set connection pool settings
	sqlDB.SetMaxIdleConns(config.MaxIdleConns)
	sqlDB.SetMaxOpenConns(config.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(config.ConnMaxLifetime)
	sqlDB.SetConnMaxIdleTime(config.ConnMaxIdleTime)

	// Test the connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	if err := sqlDB.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Printf("Database connected successfully with %d max open connections and %d max idle connections", 
		config.MaxOpenConns, config.MaxIdleConns)

	return db, nil
}

// HealthCheck performs a database health check
func HealthCheck(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := sqlDB.PingContext(ctx); err != nil {
		return fmt.Errorf("database ping failed: %w", err)
	}

	return nil
}

// GetConnectionStats returns database connection statistics
func GetConnectionStats(db *gorm.DB) (map[string]interface{}, error) {
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	stats := sqlDB.Stats()
	return map[string]interface{}{
		"max_open_connections":     stats.MaxOpenConnections,
		"open_connections":         stats.OpenConnections,
		"in_use":                  stats.InUse,
		"idle":                    stats.Idle,
		"wait_count":              stats.WaitCount,
		"wait_duration":           stats.WaitDuration.String(),
		"max_idle_closed":         stats.MaxIdleClosed,
		"max_idle_time_closed":    stats.MaxIdleTimeClosed,
		"max_lifetime_closed":     stats.MaxLifetimeClosed,
	}, nil
}

// Close closes the database connection
func Close(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}
	
	return sqlDB.Close()
}

// ConnectSQLite establishes SQLite database connection for testing
// Note: This function is commented out because SQLite requires CGO
// func ConnectSQLite(dsn string) (*gorm.DB, error) {
//     // Implementation would go here
//     return nil, fmt.Errorf("SQLite support requires CGO to be enabled")
// }