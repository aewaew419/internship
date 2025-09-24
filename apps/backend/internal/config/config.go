package config

import (
	"os"
)

type Config struct {
	Port           string
	DatabaseURL    string
	JWTSecret      string
	AllowedOrigins string
	Environment    string
	LogLevel       string
	LogFormat      string
	TwoFactor      *TwoFactorConfig
}

func Load() *Config {
	return &Config{
		Port:           getEnv("PORT", "8080"),
		DatabaseURL:    getEnv("DATABASE_URL", "root:password@tcp(localhost:3306)/internship_db?charset=utf8mb4&parseTime=True&loc=Local"),
		JWTSecret:      getEnv("JWT_SECRET", "your-secret-key"),
		AllowedOrigins: getEnv("ALLOWED_ORIGINS", "*"),
		Environment:    getEnv("ENVIRONMENT", "development"),
		LogLevel:       getEnv("LOG_LEVEL", "info"),
		LogFormat:      getEnv("LOG_FORMAT", "json"),
		TwoFactor:      LoadTwoFactorConfig(),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}