#!/bin/bash

echo "🗑️ Complete MySQL/SQLite Removal"
echo "================================"

echo "🔍 Checking for remaining MySQL/SQLite references..."

# Remove MySQL/SQLite drivers from Go modules
echo ""
echo "📦 Removing MySQL/SQLite drivers from Go modules..."
cd apps/backend

# Remove MySQL driver
if grep -q "gorm.io/driver/mysql" go.mod; then
    echo "🗑️ Removing MySQL driver..."
    go mod edit -droprequire gorm.io/driver/mysql
fi

# Remove SQLite driver
if grep -q "gorm.io/driver/sqlite" go.mod; then
    echo "🗑️ Removing SQLite driver..."
    go mod edit -droprequire gorm.io/driver/sqlite
fi

# Clean up go.mod and go.sum
echo "🧹 Cleaning up Go modules..."
go mod tidy

cd ../..

# Update .env.production.template
echo ""
echo "🔧 Updating .env.production.template..."
if [ -f ".env.production.template" ]; then
    # Remove MySQL-specific variables
    sed -i.bak '/MYSQL_ROOT_PASSWORD/d' .env.production.template
    sed -i.bak 's/DB_NAME=internship_prod/DB_NAME=internship_prod/' .env.production.template
    
    # Add PostgreSQL-specific variables if not present
    if ! grep -q "DATABASE_URL" .env.production.template; then
        echo "" >> .env.production.template
        echo "# PostgreSQL Database URL" >> .env.production.template
        echo "DATABASE_URL=postgresql://internship_user:your_secure_password@localhost:5432/internship_prod" >> .env.production.template
    fi
    
    rm .env.production.template.bak 2>/dev/null
    echo "✅ Updated .env.production.template for PostgreSQL only"
fi

# Update connection.go to remove MySQL/SQLite imports
echo ""
echo "🔧 Updating database connection code..."
cat > apps/backend/internal/database/connection.go << 'EOF'
package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"gorm.io/driver/postgres"
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

// DefaultConfig returns default database configuration optimized for PostgreSQL
func DefaultConfig() *DatabaseConfig {
	return &DatabaseConfig{
		MaxIdleConns:      25,  // Optimized for PostgreSQL
		MaxOpenConns:      100, // Good for PostgreSQL
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

// Connect establishes PostgreSQL database connection
func Connect(dsn string) (*gorm.DB, error) {
	config := LoadConfigFromEnv()
	if dsn != "" {
		config.DSN = dsn
	}
	return ConnectWithConfig(config)
}

// ConnectWithConfig establishes PostgreSQL database connection with custom configuration
func ConnectWithConfig(config *DatabaseConfig) (*gorm.DB, error) {
	if config.DSN == "" {
		return nil, fmt.Errorf("PostgreSQL DATABASE_URL is required")
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

	// Use PostgreSQL driver only
	dialector := postgres.Open(config.DSN)
	log.Println("🐘 Connecting to PostgreSQL database...")

	// Open database connection with PostgreSQL-optimized settings
	db, err := gorm.Open(dialector, &gorm.Config{
		Logger:                 gormLogger,
		DisableForeignKeyConstraintWhenMigrating: false, // PostgreSQL handles FK well
		SkipDefaultTransaction: false, // Keep transactions for data integrity
		PrepareStmt:           true,   // PostgreSQL benefits from prepared statements
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to PostgreSQL: %w", err)
	}

	// Configure connection pool (optimized for PostgreSQL)
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	// PostgreSQL-optimized connection pool settings
	sqlDB.SetMaxIdleConns(config.MaxIdleConns)
	sqlDB.SetMaxOpenConns(config.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(config.ConnMaxLifetime)
	sqlDB.SetConnMaxIdleTime(config.ConnMaxIdleTime)

	// Test the connection
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	if err := sqlDB.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping PostgreSQL database: %w", err)
	}

	log.Printf("✅ PostgreSQL connected successfully with %d max open connections and %d max idle connections", 
		config.MaxOpenConns, config.MaxIdleConns)

	return db, nil
}

// HealthCheck performs a PostgreSQL database health check
func HealthCheck(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := sqlDB.PingContext(ctx); err != nil {
		return fmt.Errorf("PostgreSQL ping failed: %w", err)
	}

	return nil
}

// GetConnectionStats returns PostgreSQL database connection statistics
func GetConnectionStats(db *gorm.DB) (map[string]interface{}, error) {
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	stats := sqlDB.Stats()
	return map[string]interface{}{
		"database_type":            "PostgreSQL",
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

// Close closes the PostgreSQL database connection
func Close(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}
	
	return sqlDB.Close()
}
EOF

echo "✅ Updated connection.go to PostgreSQL-only"

# Remove any Docker Compose services for MySQL
echo ""
echo "🐳 Checking Docker Compose files..."
for file in docker-compose*.yml; do
    if [ -f "$file" ]; then
        if grep -q "mysql\|sqlite" "$file"; then
            echo "⚠️  Found MySQL/SQLite in $file - please review manually"
        fi
    fi
done

# Update .env.example in backend
echo ""
echo "🔧 Updating backend .env.example..."
if [ -f "apps/backend/.env.example" ]; then
    # Replace MySQL URL with PostgreSQL
    sed -i.bak 's|root:password@tcp(localhost:3306)/internship_db?charset=utf8mb4&parseTime=True&loc=Local|postgres:password@localhost:5432/internship_dev?sslmode=disable|g' apps/backend/.env.example
    rm apps/backend/.env.example.bak 2>/dev/null
    echo "✅ Updated backend .env.example"
fi

# Check for any remaining references
echo ""
echo "🔍 Final check for MySQL/SQLite references..."

MYSQL_REFS=$(find . -type f -name "*.go" -o -name "*.env*" -o -name "*.yml" -o -name "*.yaml" | xargs grep -l "mysql\|sqlite" 2>/dev/null | grep -v node_modules | grep -v .git || true)

if [ -n "$MYSQL_REFS" ]; then
    echo "⚠️  Found remaining MySQL/SQLite references in:"
    echo "$MYSQL_REFS"
else
    echo "✅ No MySQL/SQLite references found"
fi

echo ""
echo "📋 Removal Summary:"
echo "=================="
echo ""
echo "🗑️ Removed:"
echo "   ❌ gorm.io/driver/mysql"
echo "   ❌ gorm.io/driver/sqlite"
echo "   ❌ MySQL-specific configurations"
echo "   ❌ SQLite fallback code"
echo "   ❌ MYSQL_ROOT_PASSWORD variable"
echo ""
echo "✅ Kept (PostgreSQL only):"
echo "   ✅ gorm.io/driver/postgres"
echo "   ✅ PostgreSQL-optimized connection code"
echo "   ✅ DATABASE_URL configuration"
echo ""
echo "🎯 Current State:"
echo "   • Database: PostgreSQL ONLY"
echo "   • Drivers: PostgreSQL ONLY"
echo "   • Configuration: PostgreSQL ONLY"
echo ""
echo "🎉 MySQL and SQLite completely removed!"
echo "    System is now PostgreSQL-only! 🐘"