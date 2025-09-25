"use client";

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { 
  sanitizeAuthData,
  loginRateLimiter,
  getUserIdentifier,
  formatWaitTime,
  useCSRFProtection,
  useTokenManager,
  useSessionManager,
  useAuditLogger
} from '@/lib/security';
import type { StudentLoginDTO, AdminLoginDTO } from '@/types/auth';

interface SecureAuthResult {
  success: boolean;
  error?: string;
  rateLimited?: boolean;
  waitTime?: number;
}

interface UseSecureAuthReturn {
  secureLogin: (credentials: StudentLoginDTO | AdminLoginDTO, userType: 'student' | 'admin') => Promise<SecureAuthResult>;
  secureLogout: (reason?: 'manual' | 'timeout' | 'forced') => Promise<void>;
  isRateLimited: boolean;
  remainingAttempts: number;
  sessionTimeRemaining: number;
  isSessionWarningActive: boolean;
  extendSession: () => void;
}

export const useSecureAuth = (): UseSecureAuthReturn => {
  const auth = useAuth();
  const csrf = useCSRFProtection();
  const tokenManager = useTokenManager();
  const sessionManager = useSessionManager();
  const auditLogger = useAuditLogger();

  const [isRateLimited, setIsRateLimited] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0);
  const [isSessionWarningActive, setIsSessionWarningActive] = useState(false);

  // Update session time remaining
  useEffect(() => {
    const updateSessionTime = () => {
      const remaining = sessionManager.getRemainingTime();
      setSessionTimeRemaining(remaining);
      setIsSessionWarningActive(sessionManager.shouldShowWarning());
    };

    updateSessionTime();
    const interval = setInterval(updateSessionTime, 1000);
    return () => clearInterval(interval);
  }, [sessionManager]);

  /**
   * Secure login with comprehensive security checks
   */
  const secureLogin = useCallback(async (
    credentials: StudentLoginDTO | AdminLoginDTO,
    userType: 'student' | 'admin'
  ): Promise<SecureAuthResult> => {
    try {
      // Sanitize input data
      const sanitizedCredentials = sanitizeAuthData(credentials);
      
      // Get user identifier for rate limiting
      const identifier = getUserIdentifier(
        'email' in sanitizedCredentials ? sanitizedCredentials.email : undefined,
        'studentId' in sanitizedCredentials ? sanitizedCredentials.studentId : undefined
      );

      // Check rate limiting
      const rateLimitCheck = loginRateLimiter.isAllowed(identifier);
      if (!rateLimitCheck.allowed) {
        setIsRateLimited(true);
        setRemainingAttempts(0);
        
        // Log rate limit exceeded
        auditLogger.logEvent('rate_limit_exceeded', {
          identifier,
          waitTime: rateLimitCheck.waitTime
        }, {
          success: false,
          severity: 'high'
        });

        return {
          success: false,
          error: `การเข้าสู่ระบบถูกจำกัด กรุณารอ ${formatWaitTime(rateLimitCheck.waitTime || 0)}`,
          rateLimited: true,
          waitTime: rateLimitCheck.waitTime
        };
      }

      setRemainingAttempts(rateLimitCheck.remainingAttempts || 0);

      // Record login attempt
      loginRateLimiter.recordAttempt(identifier);
      
      // Log login attempt
      auditLogger.logLoginAttempt(
        'email' in sanitizedCredentials ? sanitizedCredentials.email : sanitizedCredentials.studentId,
        userType,
        false // Will be updated after actual login
      );

      // Add CSRF protection
      const secureCredentials = {
        ...sanitizedCredentials,
        ...csrf.getFormData()
      };

      // Perform actual login
      const result = await auth.login(secureCredentials, userType);
      
      if (result.success) {
        // Reset rate limiting on successful login
        loginRateLimiter.resetAttempts(identifier);
        setIsRateLimited(false);
        setRemainingAttempts(5);

        // Store token securely
        if (result.token) {
          tokenManager.storeToken(result.token, result.expiresIn || 3600);
        }

        // Log successful login
        auditLogger.logLoginSuccess(result.user?.id || '', userType);

        // Record activity for session management
        sessionManager.recordActivity();

        return { success: true };
      } else {
        // Log failed login
        auditLogger.logLoginAttempt(
          'email' in sanitizedCredentials ? sanitizedCredentials.email : sanitizedCredentials.studentId,
          userType,
          false,
          result.error
        );

        return {
          success: false,
          error: result.error || 'เข้าสู่ระบบไม่สำเร็จ'
        };
      }
    } catch (error) {
      console.error('Secure login error:', error);
      
      // Log error
      auditLogger.logEvent('login_failure', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, {
        userType,
        success: false,
        severity: 'medium'
      });

      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
      };
    }
  }, [auth, csrf, tokenManager, sessionManager, auditLogger]);

  /**
   * Secure logout with cleanup
   */
  const secureLogout = useCallback(async (reason: 'manual' | 'timeout' | 'forced' = 'manual') => {
    try {
      const user = auth.user;
      const userType = auth.userType;

      // Log logout
      if (user && userType) {
        auditLogger.logLogout(user.id, userType, reason);
      }

      // Clear tokens
      tokenManager.clearToken();

      // Perform logout
      await auth.logout();

      // Clear session data
      sessionManager.recordActivity(); // Reset activity to prevent immediate timeout

    } catch (error) {
      console.error('Secure logout error:', error);
      
      // Force cleanup even if logout fails
      tokenManager.clearToken();
      await auth.logout();
    }
  }, [auth, tokenManager, sessionManager, auditLogger]);

  /**
   * Extend session
   */
  const extendSession = useCallback(() => {
    sessionManager.extendSession();
    
    // Log session extension
    if (auth.user && auth.userType) {
      auditLogger.logEvent('session_extended', {
        extendedAt: new Date().toISOString()
      }, {
        userId: auth.user.id,
        userType: auth.userType,
        success: true,
        severity: 'low'
      });
    }
  }, [sessionManager, auditLogger, auth.user, auth.userType]);

  return {
    secureLogin,
    secureLogout,
    isRateLimited,
    remainingAttempts,
    sessionTimeRemaining,
    isSessionWarningActive,
    extendSession
  };
};