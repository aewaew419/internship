# Implementation Plan - Super Admin 2FA Enhancement

- [ ] 1. Dependencies และ Project Setup
  - [x] 1.1 Install required Go packages for 2FA
    - Add pquerna/otp package for TOTP implementation
    - Add skip2/go-qrcode for QR code generation
    - Add go-redis/redis/v8 for caching failed attempts
    - Update go.mod with new dependencies
    - _Requirements: 5.1, 6.1_

  - [x] 1.2 Create 2FA configuration structure
    - Create config/2fa.go with TOTP and security configurations
    - Add environment variables for 2FA settings (issuer name, encryption key)
    - Implement configuration validation and defaults
    - _Requirements: 5.1, 6.1_

- [ ] 2. Database Schema Enhancement
  - [ ] 2.1 Add 2FA fields to super_admins table
    - Create migration to add two_factor_enabled, two_factor_secret fields
    - Update SuperAdmin model struct with 2FA fields
    - Add proper GORM tags and JSON serialization rules
    - _Requirements: 6.1_

  - [ ] 2.2 Create backup_codes table
    - Create migration for backup_codes table with admin_id, code, used, used_at fields
    - Create BackupCode model struct with relationships
    - Add foreign key constraints and indexes
    - _Requirements: 3.1, 3.2_

  - [ ] 2.3 Enhance security_logs for 2FA events
    - Update SecurityLog model to support 2FA-specific actions
    - Add 2FA event types (2FA_ENABLED, 2FA_VERIFIED, 2FA_FAILED)
    - Create helper methods for logging 2FA security events
    - _Requirements: 4.4, 4.5_

- [ ] 3. Core 2FA Services Implementation
  - [ ] 3.1 Implement TOTP service
    - Create services/totp_service.go with secret generation
    - Implement TOTP code verification with time window tolerance
    - Add QR code generation for authenticator app setup
    - Create unit tests for TOTP functionality
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 3.2 Implement backup codes service
    - Create services/backup_codes_service.go with code generation
    - Implement secure random code generation (8-character hex)
    - Add bcrypt hashing for backup code storage
    - Create backup code verification and usage tracking
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 3.3 Implement encryption service for secrets
    - Create services/encryption_service.go with AES-256-GCM encryption
    - Implement secure encryption/decryption for TOTP secrets
    - Add proper key management and nonce generation
    - Create unit tests for encryption functionality
    - _Requirements: 6.1, 6.2_

- [ ] 4. 2FA Controller และ API Endpoints
  - [ ] 4.1 Create 2FA setup endpoint
    - Create controllers/two_factor_controller.go with Setup2FA method
    - Implement password verification before 2FA setup
    - Generate TOTP secret, QR code, and temporary storage
    - Add proper input validation and error handling
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 4.2 Create 2FA verification endpoints
    - Implement VerifySetup method for initial 2FA confirmation
    - Create Verify2FA method for login-time verification
    - Add support for both TOTP codes and backup codes
    - Implement proper success/failure logging
    - _Requirements: 2.1, 2.2, 2.3, 3.2_

  - [ ] 4.3 Create 2FA management endpoints
    - Implement Disable2FA method with password confirmation
    - Create RegenerateBackupCodes method for new backup codes
    - Add Get2FAStatus method for current 2FA configuration
    - Implement proper authorization checks for all endpoints
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 5. Integration กับ Existing Authentication
  - [ ] 5.1 Modify admin login flow for 2FA
    - Update existing AdminAuthHandler to check 2FA status
    - Add 2FA verification step after password validation
    - Modify JWT token generation to include 2FA verification status
    - Create separate response for 2FA-required vs complete login
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ] 5.2 Update authentication middleware
    - Modify JWT middleware to check 2FA completion status
    - Add route protection for 2FA-required endpoints
    - Implement proper error responses for incomplete 2FA
    - Update session management to track 2FA verification
    - _Requirements: 2.4, 2.5_

- [ ] 6. Security Middleware และ Rate Limiting
  - [ ] 6.1 Implement 2FA rate limiting middleware
    - Create middleware/two_factor_limiter.go with Redis-based counting
    - Implement per-IP and per-admin rate limiting (5 attempts per 15 minutes)
    - Add automatic account lockout after repeated failures
    - Create proper error responses for rate limit violations
    - _Requirements: 2.6, 4.5_

  - [ ] 6.2 Add security headers middleware
    - Create middleware for 2FA-specific security headers
    - Implement CSP, HSTS, and other security headers
    - Add request/response logging for 2FA endpoints
    - Create IP blocking functionality for suspicious activity
    - _Requirements: 5.3, 5.4_

- [ ] 7. Caching และ Performance Optimization
  - [ ] 7.1 Implement Redis caching for 2FA
    - Create cache/two_factor_cache.go for failed attempts tracking
    - Implement caching for used TOTP codes (prevent replay attacks)
    - Add session caching for 2FA verification status
    - Create cache cleanup and expiration management
    - _Requirements: 2.6, 5.2_

  - [ ] 7.2 Optimize database queries for 2FA
    - Add database indexes for 2FA-related queries
    - Implement efficient backup code lookup and validation
    - Optimize security logging queries with proper indexing
    - Create database connection pooling for 2FA operations
    - _Requirements: 6.1, 6.2_

- [ ] 8. API Routes และ Middleware Integration
  - [ ] 8.1 Register 2FA routes in Fiber app
    - Add 2FA routes to existing admin auth route group
    - Apply proper middleware stack (auth, rate limiting, security headers)
    - Implement route-specific validation and error handling
    - Create proper API versioning for 2FA endpoints
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 8.2 Update existing admin routes with 2FA protection
    - Modify sensitive admin endpoints to require 2FA verification
    - Add 2FA bypass for initial setup and management endpoints
    - Implement proper error handling for 2FA-protected routes
    - Create comprehensive API documentation for 2FA integration
    - _Requirements: 2.4, 4.1, 4.2_

- [ ] 9. Error Handling และ Logging Enhancement
  - [ ] 9.1 Create comprehensive 2FA error handling
    - Create errors/two_factor_errors.go with specific error types
    - Implement proper error responses with Thai language support
    - Add error code mapping for different 2FA failure scenarios
    - Create user-friendly error messages with actionable suggestions
    - _Requirements: 2.5, 4.4_

  - [ ] 9.2 Enhance security logging for 2FA events
    - Implement detailed logging for all 2FA operations
    - Add structured logging with proper metadata (IP, user agent, timestamps)
    - Create security alert system for suspicious 2FA activity
    - Implement log rotation and retention policies for 2FA logs
    - _Requirements: 4.4, 4.5_

- [ ] 10. Testing Implementation
  - [ ] 10.1 Create unit tests for 2FA services
    - Write comprehensive tests for TOTP service functionality
    - Create tests for backup codes generation and verification
    - Implement tests for encryption service security
    - Add edge case testing for all 2FA services
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2_

  - [ ] 10.2 Create integration tests for 2FA endpoints
    - Write end-to-end tests for 2FA setup flow
    - Create tests for 2FA login verification process
    - Implement tests for backup codes usage and management
    - Add security testing for rate limiting and error handling
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 10.3 Create security and performance tests
    - Implement penetration testing for 2FA vulnerabilities
    - Create load testing for 2FA endpoints under high traffic
    - Add security testing for encryption and secret storage
    - Implement monitoring tests for 2FA system health
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2_

- [ ] 11. Documentation และ Deployment
  - [ ] 11.1 Create API documentation for 2FA
    - Write comprehensive API documentation with request/response examples
    - Create integration guides for frontend 2FA implementation
    - Add troubleshooting guides for common 2FA issues
    - Document security best practices for 2FA usage
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 11.2 Create deployment scripts and configuration
    - Update deployment scripts to include 2FA dependencies
    - Create environment configuration templates for 2FA settings
    - Add database migration scripts for production deployment
    - Implement health checks and monitoring for 2FA functionality
    - _Requirements: 6.1, 6.2_

- [ ] 12. Security Hardening และ Monitoring
  - [ ] 12.1 Implement advanced security features
    - Add device fingerprinting for 2FA verification
    - Implement geolocation-based suspicious activity detection
    - Create automated threat response for 2FA attacks
    - Add compliance features for audit and regulatory requirements
    - _Requirements: 4.5, 5.4_

  - [ ] 12.2 Create monitoring and alerting system
    - Implement real-time monitoring for 2FA operations
    - Create alerting system for security events and failures
    - Add performance monitoring for 2FA endpoint response times
    - Implement automated reporting for 2FA usage and security metrics
    - _Requirements: 4.4, 4.5_