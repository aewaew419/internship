/**
 * Security Enhancements Module
 * Centralized export for all security utilities and enhancements
 */

// Input Sanitization
export {
  escapeHtml,
  sanitizeInput,
  sanitizeStudentId,
  sanitizeEmail,
  sanitizeName,
  sanitizePassword,
  deepSanitize,
  sanitizeAuthData,
  preventSqlInjection,
  sanitizeRedirectUrl
} from './input-sanitization';

// Rate Limiting
export {
  loginRateLimiter,
  registrationRateLimiter,
  passwordResetRateLimiter,
  getUserIdentifier,
  formatWaitTime,
  useRateLimit
} from './rate-limiting';

// Token Management
export {
  tokenManager,
  useTokenManager,
  isAuthenticated,
  getUserRole,
  hasPermission
} from './token-management';

// CSRF Protection
export {
  csrfProtection,
  useCSRFProtection,
  withCSRFProtection,
  addCSRFToFormData,
  addCSRFToParams,
  createCSRFMiddleware,
  initializeCSRFProtection
} from './csrf-protection';

// Session Management
export {
  initializeSessionManager,
  getSessionManager,
  useSessionManager,
  formatSessionTime,
  DEFAULT_SESSION_CONFIG,
  type SessionWarningProps
} from './session-management';

// Audit Logging
export {
  auditLogger,
  useAuditLogger
} from './audit-logging';

// Import functions directly to avoid circular dependency issues
import { initializeCSRFProtection as _initializeCSRFProtection } from './csrf-protection';
import { initializeSessionManager as _initializeSessionManager } from './session-management';

// Security initialization function
export function initializeSecurity(): void {
  // Initialize CSRF protection
  _initializeCSRFProtection();
  
  // Initialize session management with default callbacks
  _initializeSessionManager({
    warningTimeMs: 5 * 60 * 1000, // 5 minutes
    idleTimeoutMs: 30 * 60 * 1000, // 30 minutes
    enableIdleDetection: true,
    enableVisibilityDetection: true
  }, {
    onWarning: (remainingTime) => {
      console.warn(`Session expires in ${Math.ceil(remainingTime / 60000)} minutes`);
    },
    onTimeout: () => {
      console.warn('Session expired');
      // This will be handled by the auth provider
    }
  });
  
  console.log('Security enhancements initialized');
}

// Security utilities
export const SecurityUtils = {
  // Validate password strength
  validatePasswordStrength: (password: string): { score: number; feedback: string[] } => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push('รหัสผ่านควรมีความยาวอย่างน้อย 8 ตัวอักษร');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('ควรมีตัวอักษรพิมพ์เล็ก');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('ควรมีตัวอักษรพิมพ์ใหญ่');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('ควรมีตัวเลข');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('ควรมีอักขระพิเศษ');

    return { score, feedback };
  },

  // Generate secure random string
  generateSecureRandom: (length: number = 32): string => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Check if running in secure context
  isSecureContext: (): boolean => {
    return window.isSecureContext || location.protocol === 'https:';
  },

  // Validate origin for CORS
  validateOrigin: (origin: string, allowedOrigins: string[]): boolean => {
    return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
  }
};