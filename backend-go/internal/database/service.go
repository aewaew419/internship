package database

import (
	"context"
	"fmt"
	"log"

	"gorm.io/gorm"
)

// Service provides database operations using GORM
type Service struct {
	GORM   *gorm.DB
	config *DatabaseConfig
}

// NewService creates a new database service with GORM client
func NewService(config *DatabaseConfig) (*Service, error) {
	if config == nil {
		config = LoadConfigFromEnv()
	}

	// Initialize GORM connection
	gormDB, err := ConnectWithConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize GORM: %w", err)
	}

	service := &Service{
		GORM:   gormDB,
		config: config,
	}

	// Run auto-migration if enabled
	if config.EnableAutoMigrate {
		if err := service.RunMigrations(); err != nil {
			log.Printf("Warning: Auto-migration failed: %v", err)
		}
	}

	return service, nil
}

// RunMigrations runs database migrations
func (s *Service) RunMigrations() error {
	return AutoMigrate(s.GORM)
}

// CreateIndexes creates performance indexes
func (s *Service) CreateIndexes() error {
	return CreateIndexes(s.GORM)
}

// HealthCheck performs health check on database connection
func (s *Service) HealthCheck(ctx context.Context) error {
	// Check GORM connection
	if err := HealthCheck(s.GORM); err != nil {
		return fmt.Errorf("GORM health check failed: %w", err)
	}

	return nil
}

// GetStats returns database connection statistics
func (s *Service) GetStats() (map[string]interface{}, error) {
	gormStats, err := GetConnectionStats(s.GORM)
	if err != nil {
		return nil, err
	}

	stats := map[string]interface{}{
		"gorm": gormStats,
		"config": map[string]interface{}{
			"max_idle_conns":     s.config.MaxIdleConns,
			"max_open_conns":     s.config.MaxOpenConns,
			"conn_max_lifetime":  s.config.ConnMaxLifetime.String(),
			"conn_max_idle_time": s.config.ConnMaxIdleTime.String(),
			"log_level":          fmt.Sprintf("%d", s.config.LogLevel),
			"slow_threshold":     s.config.SlowThreshold.String(),
		},
	}

	return stats, nil
}

// Close closes database connection
func (s *Service) Close() error {
	// Close GORM connection
	if err := Close(s.GORM); err != nil {
		return fmt.Errorf("failed to close GORM: %w", err)
	}

	return nil
}

// Transaction executes a function within a GORM database transaction
func (s *Service) Transaction(fn func(*gorm.DB) error) error {
	return s.GORM.Transaction(fn)
}

// WithContext returns a new service instance with context for GORM operations
func (s *Service) WithContext(ctx context.Context) *Service {
	return &Service{
		GORM:   s.GORM.WithContext(ctx),
		config: s.config,
	}
}