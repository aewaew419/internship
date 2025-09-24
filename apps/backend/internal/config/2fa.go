package config

import (
	"os"
	"strconv"
	"time"
)

// TwoFactorConfig holds all 2FA related configuration
type TwoFactorConfig struct {
	// TOTP Configuration
	Issuer         string        `json:"issuer"`
	SecretLength   int           `json:"secret_length"`
	CodeLength     int           `json:"code_length"`
	Period         time.Duration `json:"period"`
	Skew           int           `json:"skew"`
	
	// Backup Codes Configuration
	BackupCodeCount  int `json:"backup_code_count"`
	BackupCodeLength int `json:"backup_code_length"`
	
	// Security Configuration
	EncryptionKey    string        `json:"-"` // Never expose in JSON
	MaxAttempts      int           `json:"max_attempts"`
	LockoutDuration  time.Duration `json:"lockout_duration"`
	
	// Rate Limiting Configuration
	RateLimitWindow   time.Duration `json:"rate_limit_window"`
	RateLimitAttempts int           `json:"rate_limit_attempts"`
	
	// QR Code Configuration
	QRCodeSize int `json:"qr_code_size"`
	
	// Redis Configuration for caching
	RedisURL         string        `json:"-"` // Never expose in JSON
	CacheExpiration  time.Duration `json:"cache_expiration"`
}

// LoadTwoFactorConfig loads 2FA configuration from environment variables
func LoadTwoFactorConfig() *TwoFactorConfig {
	return &TwoFactorConfig{
		// TOTP Configuration
		Issuer:         getEnv("TOTP_ISSUER", "Super Admin System"),
		SecretLength:   getEnvAsInt("TOTP_SECRET_LENGTH", 32),
		CodeLength:     getEnvAsInt("TOTP_CODE_LENGTH", 6),
		Period:         getEnvAsDuration("TOTP_PERIOD", 30*time.Second),
		Skew:           getEnvAsInt("TOTP_SKEW", 1),
		
		// Backup Codes Configuration
		BackupCodeCount:  getEnvAsInt("BACKUP_CODE_COUNT", 10),
		BackupCodeLength: getEnvAsInt("BACKUP_CODE_LENGTH", 8),
		
		// Security Configuration
		EncryptionKey:    getEnv("ENCRYPTION_KEY", generateDefaultEncryptionKey()),
		MaxAttempts:      getEnvAsInt("2FA_MAX_ATTEMPTS", 3),
		LockoutDuration:  getEnvAsDuration("2FA_LOCKOUT_DURATION", 15*time.Minute),
		
		// Rate Limiting Configuration
		RateLimitWindow:   getEnvAsDuration("2FA_RATE_LIMIT_WINDOW", 15*time.Minute),
		RateLimitAttempts: getEnvAsInt("2FA_RATE_LIMIT_ATTEMPTS", 5),
		
		// QR Code Configuration
		QRCodeSize: getEnvAsInt("QR_CODE_SIZE", 256),
		
		// Redis Configuration
		RedisURL:        getEnv("REDIS_URL", "redis://localhost:6379"),
		CacheExpiration: getEnvAsDuration("2FA_CACHE_EXPIRATION", 1*time.Hour),
	}
}

// Validate checks if the 2FA configuration is valid
func (c *TwoFactorConfig) Validate() error {
	if c.Issuer == "" {
		return &ConfigError{Field: "issuer", Message: "TOTP issuer cannot be empty"}
	}
	
	if c.SecretLength < 16 {
		return &ConfigError{Field: "secret_length", Message: "TOTP secret length must be at least 16 bytes"}
	}
	
	if c.CodeLength != 6 && c.CodeLength != 8 {
		return &ConfigError{Field: "code_length", Message: "TOTP code length must be 6 or 8 digits"}
	}
	
	if c.Period < 15*time.Second {
		return &ConfigError{Field: "period", Message: "TOTP period must be at least 15 seconds"}
	}
	
	if c.BackupCodeCount < 5 || c.BackupCodeCount > 20 {
		return &ConfigError{Field: "backup_code_count", Message: "backup code count must be between 5 and 20"}
	}
	
	if c.BackupCodeLength < 6 || c.BackupCodeLength > 16 {
		return &ConfigError{Field: "backup_code_length", Message: "backup code length must be between 6 and 16 characters"}
	}
	
	if len(c.EncryptionKey) != 32 {
		return &ConfigError{Field: "encryption_key", Message: "encryption key must be exactly 32 bytes for AES-256"}
	}
	
	if c.MaxAttempts < 1 || c.MaxAttempts > 10 {
		return &ConfigError{Field: "max_attempts", Message: "max attempts must be between 1 and 10"}
	}
	
	if c.LockoutDuration < 1*time.Minute {
		return &ConfigError{Field: "lockout_duration", Message: "lockout duration must be at least 1 minute"}
	}
	
	if c.RateLimitAttempts < 1 || c.RateLimitAttempts > 100 {
		return &ConfigError{Field: "rate_limit_attempts", Message: "rate limit attempts must be between 1 and 100"}
	}
	
	if c.QRCodeSize < 128 || c.QRCodeSize > 512 {
		return &ConfigError{Field: "qr_code_size", Message: "QR code size must be between 128 and 512 pixels"}
	}
	
	return nil
}

// ConfigError represents a configuration validation error
type ConfigError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func (e *ConfigError) Error() string {
	return "config error in field '" + e.Field + "': " + e.Message
}

// Helper functions for environment variable parsing
func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

// generateDefaultEncryptionKey generates a default 32-byte key for development
// In production, this should be set via environment variable
func generateDefaultEncryptionKey() string {
	// This is a default key for development only
	// In production, use a secure random key
	return "dev-key-32-bytes-for-aes-256-enc"
}