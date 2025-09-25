"use client";

import { AxiosError } from 'axios';
import type { AuthError } from '@/types/auth';
import { VALIDATION_MESSAGES, mapApiErrorToMessage } from '@/lib/validation-messages';

export interface AuthErrorContext {
  action: 'login' | 'register' | 'forgot-password' | 'reset-password' | 'refresh-token' | 'logout';
  userType?: 'student' | 'admin';
  attemptCount?: number;
  lastAttemptTime?: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthErrorRecovery {
  canRetry: boolean;
  retryAfter?: number; // seconds
  maxRetries?: number;
  suggestedActions: string[];
  recoverySteps: AuthRecoveryStep[];
}

export interface AuthRecoveryStep {
  id: string;
  title: string;
  description: string;
  action?: () => void | Promise<void>;
  isCompleted?: boolean;
  isRequired?: boolean;
}

export interface ProcessedAuthError {
  originalError: any;
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'validation' | 'authentication' | 'authorization' | 'network' | 'server' | 'security';
  context: AuthErrorContext;
  recovery: AuthErrorRecovery;
  shouldLog: boolean;
  shouldReport: boolean;
  metadata: Record<string, any>;
}

/**
 * Comprehensive authentication error handling system
 * Provides centralized error processing, recovery suggestions, and user-friendly messages
 */
export class AuthErrorHandler {
  private static readonly ERROR_CODES = {
    // Authentication errors
    INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
    ACCOUNT_DISABLED: 'AUTH_ACCOUNT_DISABLED',
    ACCOUNT_NOT_FOUND: 'AUTH_ACCOUNT_NOT_FOUND',
    SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
    TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
    TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
    REFRESH_TOKEN_INVALID: 'AUTH_REFRESH_TOKEN_INVALID',
    
    // Rate limiting and security
    TOO_MANY_ATTEMPTS: 'AUTH_TOO_MANY_ATTEMPTS',
    SUSPICIOUS_ACTIVITY: 'AUTH_SUSPICIOUS_ACTIVITY',
    IP_BLOCKED: 'AUTH_IP_BLOCKED',
    
    // Validation errors
    INVALID_STUDENT_ID: 'VALIDATION_INVALID_STUDENT_ID',
    INVALID_EMAIL: 'VALIDATION_INVALID_EMAIL',
    WEAK_PASSWORD: 'VALIDATION_WEAK_PASSWORD',
    PASSWORD_MISMATCH: 'VALIDATION_PASSWORD_MISMATCH',
    REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
    
    // Network and server errors
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'NETWORK_TIMEOUT',
    SERVER_ERROR: 'SERVER_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    
    // Registration specific
    EMAIL_ALREADY_EXISTS: 'REGISTRATION_EMAIL_EXISTS',
    STUDENT_ID_ALREADY_EXISTS: 'REGISTRATION_STUDENT_ID_EXISTS',
    REGISTRATION_DISABLED: 'REGISTRATION_DISABLED',
    
    // Password reset specific
    RESET_TOKEN_INVALID: 'PASSWORD_RESET_TOKEN_INVALID',
    RESET_TOKEN_EXPIRED: 'PASSWORD_RESET_TOKEN_EXPIRED',
    RESET_LINK_USED: 'PASSWORD_RESET_LINK_USED',
    
    // Unknown error
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  } as const;

  private static readonly RETRY_DELAYS = {
    NETWORK_ERROR: 2000,
    TIMEOUT_ERROR: 3000,
    SERVER_ERROR: 5000,
    TOO_MANY_ATTEMPTS: 60000, // 1 minute
    DEFAULT: 1000,
  };

  private static readonly MAX_RETRIES = {
    NETWORK_ERROR: 3,
    TIMEOUT_ERROR: 2,
    SERVER_ERROR: 2,
    DEFAULT: 1,
  };

  /**
   * Process and categorize authentication errors
   */
  static processError(
    error: any, 
    context: AuthErrorContext
  ): ProcessedAuthError {
    const errorCode = this.determineErrorCode(error);
    const category = this.determineErrorCategory(errorCode);
    const severity = this.determineErrorSeverity(errorCode, context);
    const userMessage = this.getUserFriendlyMessage(errorCode, error, context);
    const recovery = this.generateRecoveryOptions(errorCode, context);
    
    return {
      originalError: error,
      code: errorCode,
      message: error.message || 'Unknown error occurred',
      userMessage,
      severity,
      category,
      context,
      recovery,
      shouldLog: this.shouldLogError(severity, category),
      shouldReport: this.shouldReportError(severity, category),
      metadata: this.extractErrorMetadata(error, context),
    };
  }

  /**
   * Determine specific error code from various error types
   */
  private static determineErrorCode(error: any): string {
    // Handle Axios errors
    if (error.isAxiosError || error.response) {
      const status = error.response?.status;
      const serverCode = error.response?.data?.code;
      const serverMessage = error.response?.data?.message?.toLowerCase() || '';

      // Check server-provided error codes first
      if (serverCode) {
        switch (serverCode) {
          case 'INVALID_CREDENTIALS':
          case 'AUTHENTICATION_FAILED':
            return this.ERROR_CODES.INVALID_CREDENTIALS;
          case 'ACCOUNT_LOCKED':
            return this.ERROR_CODES.ACCOUNT_LOCKED;
          case 'ACCOUNT_DISABLED':
            return this.ERROR_CODES.ACCOUNT_DISABLED;
          case 'TOO_MANY_ATTEMPTS':
            return this.ERROR_CODES.TOO_MANY_ATTEMPTS;
          case 'EMAIL_EXISTS':
            return this.ERROR_CODES.EMAIL_ALREADY_EXISTS;
          case 'STUDENT_ID_EXISTS':
            return this.ERROR_CODES.STUDENT_ID_ALREADY_EXISTS;
          case 'TOKEN_EXPIRED':
            return this.ERROR_CODES.TOKEN_EXPIRED;
          case 'INVALID_TOKEN':
            return this.ERROR_CODES.TOKEN_INVALID;
        }
      }

      // Check by HTTP status code
      switch (status) {
        case 400:
          if (serverMessage.includes('student') && serverMessage.includes('id')) {
            return this.ERROR_CODES.INVALID_STUDENT_ID;
          }
          if (serverMessage.includes('email')) {
            return this.ERROR_CODES.INVALID_EMAIL;
          }
          if (serverMessage.includes('password')) {
            return this.ERROR_CODES.WEAK_PASSWORD;
          }
          return this.ERROR_CODES.INVALID_CREDENTIALS;
        
        case 401:
          if (serverMessage.includes('expired')) {
            return this.ERROR_CODES.SESSION_EXPIRED;
          }
          return this.ERROR_CODES.INVALID_CREDENTIALS;
        
        case 403:
          if (serverMessage.includes('locked')) {
            return this.ERROR_CODES.ACCOUNT_LOCKED;
          }
          if (serverMessage.includes('disabled')) {
            return this.ERROR_CODES.ACCOUNT_DISABLED;
          }
          return this.ERROR_CODES.ACCOUNT_DISABLED;
        
        case 404:
          return this.ERROR_CODES.ACCOUNT_NOT_FOUND;
        
        case 409:
          if (serverMessage.includes('email')) {
            return this.ERROR_CODES.EMAIL_ALREADY_EXISTS;
          }
          if (serverMessage.includes('student')) {
            return this.ERROR_CODES.STUDENT_ID_ALREADY_EXISTS;
          }
          return this.ERROR_CODES.EMAIL_ALREADY_EXISTS;
        
        case 422:
          // Validation errors
          const validationErrors = error.response?.data?.errors;
          if (validationErrors) {
            if (validationErrors.student_id || validationErrors.studentId) {
              return this.ERROR_CODES.INVALID_STUDENT_ID;
            }
            if (validationErrors.email) {
              return this.ERROR_CODES.INVALID_EMAIL;
            }
            if (validationErrors.password) {
              return this.ERROR_CODES.WEAK_PASSWORD;
            }
          }
          return this.ERROR_CODES.REQUIRED_FIELD;
        
        case 429:
          return this.ERROR_CODES.TOO_MANY_ATTEMPTS;
        
        case 500:
        case 502:
        case 503:
          return this.ERROR_CODES.SERVER_ERROR;
        
        case 504:
          return this.ERROR_CODES.TIMEOUT_ERROR;
        
        default:
          if (status >= 500) {
            return this.ERROR_CODES.SERVER_ERROR;
          }
          return this.ERROR_CODES.UNKNOWN_ERROR;
      }
    }

    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
      return this.ERROR_CODES.NETWORK_ERROR;
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return this.ERROR_CODES.TIMEOUT_ERROR;
    }

    // Handle validation errors from client-side
    if (error.name === 'ValidationError') {
      const field = error.field?.toLowerCase();
      if (field?.includes('student')) {
        return this.ERROR_CODES.INVALID_STUDENT_ID;
      }
      if (field?.includes('email')) {
        return this.ERROR_CODES.INVALID_EMAIL;
      }
      if (field?.includes('password')) {
        return this.ERROR_CODES.WEAK_PASSWORD;
      }
      return this.ERROR_CODES.REQUIRED_FIELD;
    }

    return this.ERROR_CODES.UNKNOWN_ERROR;
  }

  /**
   * Determine error category for classification
   */
  private static determineErrorCategory(errorCode: string): ProcessedAuthError['category'] {
    if (errorCode.startsWith('VALIDATION_')) {
      return 'validation';
    }
    if (errorCode.startsWith('AUTH_')) {
      if (errorCode.includes('LOCKED') || errorCode.includes('SUSPICIOUS') || errorCode.includes('BLOCKED')) {
        return 'security';
      }
      if (errorCode.includes('DISABLED') || errorCode.includes('NOT_FOUND')) {
        return 'authorization';
      }
      return 'authentication';
    }
    if (errorCode.startsWith('NETWORK_') || errorCode === 'TIMEOUT_ERROR') {
      return 'network';
    }
    if (errorCode.startsWith('SERVER_') || errorCode === 'SERVICE_UNAVAILABLE') {
      return 'server';
    }
    return 'server';
  }

  /**
   * Determine error severity level
   */
  private static determineErrorSeverity(
    errorCode: string, 
    context: AuthErrorContext
  ): ProcessedAuthError['severity'] {
    // Critical errors that require immediate attention
    if ([
      this.ERROR_CODES.ACCOUNT_LOCKED,
      this.ERROR_CODES.SUSPICIOUS_ACTIVITY,
      this.ERROR_CODES.IP_BLOCKED,
    ].includes(errorCode as any)) {
      return 'critical';
    }

    // High severity errors
    if ([
      this.ERROR_CODES.ACCOUNT_DISABLED,
      this.ERROR_CODES.TOO_MANY_ATTEMPTS,
      this.ERROR_CODES.SERVER_ERROR,
    ].includes(errorCode as any)) {
      return 'high';
    }

    // Medium severity errors
    if ([
      this.ERROR_CODES.INVALID_CREDENTIALS,
      this.ERROR_CODES.SESSION_EXPIRED,
      this.ERROR_CODES.EMAIL_ALREADY_EXISTS,
      this.ERROR_CODES.STUDENT_ID_ALREADY_EXISTS,
      this.ERROR_CODES.NETWORK_ERROR,
    ].includes(errorCode as any)) {
      return 'medium';
    }

    // Low severity errors (usually validation)
    return 'low';
  }

  /**
   * Generate user-friendly error messages in Thai
   */
  private static getUserFriendlyMessage(
    errorCode: string, 
    error: any, 
    context: AuthErrorContext
  ): string {
    const { action, userType, attemptCount } = context;

    switch (errorCode) {
      case this.ERROR_CODES.INVALID_CREDENTIALS:
        if (userType === 'student') {
          return 'รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง';
        }
        return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง';

      case this.ERROR_CODES.ACCOUNT_LOCKED:
        return 'บัญชีของคุณถูกล็อคเนื่องจากพยายามเข้าสู่ระบบผิดหลายครั้ง กรุณาติดต่อผู้ดูแลระบบ';

      case this.ERROR_CODES.ACCOUNT_DISABLED:
        return 'บัญชีของคุณถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบเพื่อขอความช่วยเหลือ';

      case this.ERROR_CODES.ACCOUNT_NOT_FOUND:
        if (userType === 'student') {
          return 'ไม่พบรหัสนักศึกษานี้ในระบบ กรุณาตรวจสอบรหัสนักศึกษาหรือสมัครสมาชิกใหม่';
        }
        return 'ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบอีเมลหรือติดต่อผู้ดูแลระบบ';

      case this.ERROR_CODES.SESSION_EXPIRED:
        return 'เซสชันหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่เพื่อดำเนินการต่อ';

      case this.ERROR_CODES.TOKEN_EXPIRED:
      case this.ERROR_CODES.TOKEN_INVALID:
        return 'โทเค็นการเข้าสู่ระบบไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่';

      case this.ERROR_CODES.TOO_MANY_ATTEMPTS:
        const waitTime = this.calculateWaitTime(attemptCount || 0);
        return `พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอ ${waitTime} นาทีก่อนลองใหม่`;

      case this.ERROR_CODES.SUSPICIOUS_ACTIVITY:
        return 'ตรวจพบกิจกรรมที่น่าสงสัย บัญชีของคุณถูกล็อคชั่วคราวเพื่อความปลอดภัย';

      case this.ERROR_CODES.IP_BLOCKED:
        return 'IP Address ของคุณถูกบล็อคเนื่องจากกิจกรรมที่น่าสงสัย กรุณาติดต่อผู้ดูแลระบบ';

      case this.ERROR_CODES.INVALID_STUDENT_ID:
        return VALIDATION_MESSAGES.STUDENT_ID.INVALID_FORMAT;

      case this.ERROR_CODES.INVALID_EMAIL:
        return VALIDATION_MESSAGES.EMAIL.INVALID_FORMAT;

      case this.ERROR_CODES.WEAK_PASSWORD:
        return VALIDATION_MESSAGES.PASSWORD.WEAK;

      case this.ERROR_CODES.PASSWORD_MISMATCH:
        return VALIDATION_MESSAGES.PASSWORD.MISMATCH;

      case this.ERROR_CODES.REQUIRED_FIELD:
        return VALIDATION_MESSAGES.FORM.REQUIRED_FIELD;

      case this.ERROR_CODES.EMAIL_ALREADY_EXISTS:
        return 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบหากคุณมีบัญชีอยู่แล้ว';

      case this.ERROR_CODES.STUDENT_ID_ALREADY_EXISTS:
        return 'รหัสนักศึกษานี้ถูกใช้งานแล้ว กรุณาตรวจสอบรหัสนักศึกษาหรือเข้าสู่ระบบหากคุณมีบัญชีอยู่แล้ว';

      case this.ERROR_CODES.REGISTRATION_DISABLED:
        return 'ระบบสมัครสมาชิกถูกปิดใช้งานชั่วคราว กรุณาลองใหม่อีกครั้งในภายหลัง';

      case this.ERROR_CODES.RESET_TOKEN_INVALID:
        return 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง กรุณาขอลิงก์ใหม่อีกครั้ง';

      case this.ERROR_CODES.RESET_TOKEN_EXPIRED:
        return 'ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว กรุณาขอลิงก์ใหม่อีกครั้ง';

      case this.ERROR_CODES.RESET_LINK_USED:
        return 'ลิงก์รีเซ็ตรหัสผ่านนี้ถูกใช้งานแล้ว กรุณาขอลิงก์ใหม่หากต้องการเปลี่ยนรหัสผ่านอีกครั้ง';

      case this.ERROR_CODES.NETWORK_ERROR:
        return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง';

      case this.ERROR_CODES.TIMEOUT_ERROR:
        return 'การเชื่อมต่อหมดเวลา กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง';

      case this.ERROR_CODES.SERVER_ERROR:
        return 'เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้งในภายหลัง';

      case this.ERROR_CODES.SERVICE_UNAVAILABLE:
        return 'ระบบไม่สามารถให้บริการได้ในขณะนี้ กรุณาลองใหม่อีกครั้งในภายหลัง';

      default:
        return 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ';
    }
  }

  /**
   * Generate recovery options and suggestions
   */
  private static generateRecoveryOptions(
    errorCode: string, 
    context: AuthErrorContext
  ): AuthErrorRecovery {
    const { action, userType, attemptCount = 0 } = context;

    switch (errorCode) {
      case this.ERROR_CODES.INVALID_CREDENTIALS:
        return {
          canRetry: true,
          maxRetries: 5,
          suggestedActions: [
            'ตรวจสอบการพิมพ์รหัสนักศึกษาหรืออีเมล',
            'ตรวจสอบการพิมพ์รหัสผ่าน',
            'ตรวจสอบว่า Caps Lock เปิดอยู่หรือไม่',
            'ลองใช้ฟีเจอร์ลืมรหัสผ่าน',
          ],
          recoverySteps: [
            {
              id: 'check-credentials',
              title: 'ตรวจสอบข้อมูลการเข้าสู่ระบบ',
              description: 'ตรวจสอบว่าข้อมูลที่กรอกถูกต้องและไม่มีการพิมพ์ผิด',
              isRequired: true,
            },
            {
              id: 'forgot-password',
              title: 'ใช้ฟีเจอร์ลืมรหัสผ่าน',
              description: 'หากไม่แน่ใจเรื่องรหัสผ่าน สามารถขอรีเซ็ตรหัสผ่านใหม่ได้',
              isRequired: false,
            },
          ],
        };

      case this.ERROR_CODES.ACCOUNT_LOCKED:
        return {
          canRetry: false,
          suggestedActions: [
            'ติดต่อผู้ดูแลระบบเพื่อปลดล็อคบัญชี',
            'รอให้ระบบปลดล็อคอัตโนมัติ (หากมี)',
            'ตรวจสอบอีเมลสำหรับคำแนะนำเพิ่มเติม',
          ],
          recoverySteps: [
            {
              id: 'contact-admin',
              title: 'ติดต่อผู้ดูแลระบบ',
              description: 'ติดต่อผู้ดูแลระบบเพื่อขอความช่วยเหลือในการปลดล็อคบัญชี',
              isRequired: true,
            },
          ],
        };

      case this.ERROR_CODES.TOO_MANY_ATTEMPTS:
        const waitTime = this.calculateWaitTime(attemptCount);
        return {
          canRetry: true,
          retryAfter: waitTime * 60, // Convert minutes to seconds
          suggestedActions: [
            `รอ ${waitTime} นาทีก่อนลองใหม่`,
            'ตรวจสอบข้อมูลการเข้าสู่ระบบให้ถูกต้อง',
            'ใช้ฟีเจอร์ลืมรหัสผ่านหากจำรหัสผ่านไม่ได้',
          ],
          recoverySteps: [
            {
              id: 'wait',
              title: `รอ ${waitTime} นาที`,
              description: 'รอให้ระบบอนุญาตให้ลองเข้าสู่ระบบใหม่',
              isRequired: true,
            },
            {
              id: 'verify-credentials',
              title: 'ตรวจสอบข้อมูลการเข้าสู่ระบบ',
              description: 'ตรวจสอบความถูกต้องของข้อมูลก่อนลองใหม่',
              isRequired: true,
            },
          ],
        };

      case this.ERROR_CODES.NETWORK_ERROR:
        return {
          canRetry: true,
          retryAfter: this.RETRY_DELAYS.NETWORK_ERROR / 1000,
          maxRetries: this.MAX_RETRIES.NETWORK_ERROR,
          suggestedActions: [
            'ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
            'ลองเปลี่ยนเครือข่าย (WiFi/Mobile Data)',
            'รีสตาร์ทแอปพลิเคชัน',
            'ลองใหม่อีกครั้งในภายหลัง',
          ],
          recoverySteps: [
            {
              id: 'check-connection',
              title: 'ตรวจสอบการเชื่อมต่อ',
              description: 'ตรวจสอบว่าอุปกรณ์เชื่อมต่ออินเทอร์เน็ตได้',
              isRequired: true,
            },
            {
              id: 'retry',
              title: 'ลองใหม่อีกครั้ง',
              description: 'ลองเข้าสู่ระบบใหม่หลังจากตรวจสอบการเชื่อมต่อแล้ว',
              isRequired: false,
            },
          ],
        };

      case this.ERROR_CODES.SERVER_ERROR:
        return {
          canRetry: true,
          retryAfter: this.RETRY_DELAYS.SERVER_ERROR / 1000,
          maxRetries: this.MAX_RETRIES.SERVER_ERROR,
          suggestedActions: [
            'ลองใหม่อีกครั้งในภายหลัง',
            'ตรวจสอบสถานะระบบ',
            'ติดต่อผู้ดูแลระบบหากปัญหายังคงอยู่',
          ],
          recoverySteps: [
            {
              id: 'wait-and-retry',
              title: 'รอและลองใหม่',
              description: 'รอสักครู่แล้วลองเข้าสู่ระบบใหม่อีกครั้ง',
              isRequired: true,
            },
          ],
        };

      case this.ERROR_CODES.EMAIL_ALREADY_EXISTS:
      case this.ERROR_CODES.STUDENT_ID_ALREADY_EXISTS:
        return {
          canRetry: false,
          suggestedActions: [
            'ใช้อีเมลหรือรหัสนักศึกษาอื่น',
            'เข้าสู่ระบบหากมีบัญชีอยู่แล้ว',
            'ใช้ฟีเจอร์ลืมรหัสผ่านหากจำรหัสผ่านไม่ได้',
          ],
          recoverySteps: [
            {
              id: 'try-login',
              title: 'ลองเข้าสู่ระบบ',
              description: 'หากมีบัญชีอยู่แล้ว ลองเข้าสู่ระบบแทนการสมัครใหม่',
              isRequired: false,
            },
            {
              id: 'use-different-info',
              title: 'ใช้ข้อมูลอื่น',
              description: 'ใช้อีเมลหรือรหัสนักศึกษาที่แตกต่างจากเดิม',
              isRequired: false,
            },
          ],
        };

      default:
        return {
          canRetry: true,
          maxRetries: 1,
          suggestedActions: [
            'ลองใหม่อีกครั้ง',
            'รีเฟรชหน้าเว็บ',
            'ติดต่อผู้ดูแลระบบหากปัญหายังคงอยู่',
          ],
          recoverySteps: [
            {
              id: 'retry',
              title: 'ลองใหม่อีกครั้ง',
              description: 'ลองดำเนินการใหม่อีกครั้ง',
              isRequired: true,
            },
          ],
        };
    }
  }

  /**
   * Calculate wait time based on attempt count
   */
  private static calculateWaitTime(attemptCount: number): number {
    // Exponential backoff: 1, 2, 5, 10, 15 minutes
    const waitTimes = [1, 2, 5, 10, 15];
    const index = Math.min(attemptCount - 1, waitTimes.length - 1);
    return waitTimes[Math.max(0, index)];
  }

  /**
   * Determine if error should be logged
   */
  private static shouldLogError(
    severity: ProcessedAuthError['severity'], 
    category: ProcessedAuthError['category']
  ): boolean {
    // Always log high and critical errors
    if (severity === 'high' || severity === 'critical') {
      return true;
    }
    
    // Log security and server errors
    if (category === 'security' || category === 'server') {
      return true;
    }
    
    // Don't log validation errors (too noisy)
    if (category === 'validation') {
      return false;
    }
    
    return true;
  }

  /**
   * Determine if error should be reported to monitoring service
   */
  private static shouldReportError(
    severity: ProcessedAuthError['severity'], 
    category: ProcessedAuthError['category']
  ): boolean {
    // Report critical and high severity errors
    if (severity === 'critical' || severity === 'high') {
      return true;
    }
    
    // Report security-related errors
    if (category === 'security') {
      return true;
    }
    
    // Report server errors
    if (category === 'server') {
      return true;
    }
    
    return false;
  }

  /**
   * Extract metadata from error for logging and analysis
   */
  private static extractErrorMetadata(error: any, context: AuthErrorContext): Record<string, any> {
    const metadata: Record<string, any> = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context,
    };

    // Add error-specific metadata
    if (error.response) {
      metadata.httpStatus = error.response.status;
      metadata.httpStatusText = error.response.statusText;
      metadata.responseHeaders = error.response.headers;
      metadata.responseData = error.response.data;
    }

    if (error.request) {
      metadata.requestUrl = error.request.responseURL;
      metadata.requestMethod = error.config?.method;
    }

    if (error.code) {
      metadata.errorCode = error.code;
    }

    return metadata;
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(processedError: ProcessedAuthError): boolean {
    return processedError.recovery.canRetry && 
           (processedError.recovery.maxRetries === undefined || 
            (processedError.context.attemptCount || 0) < processedError.recovery.maxRetries);
  }

  /**
   * Get retry delay for error
   */
  static getRetryDelay(processedError: ProcessedAuthError): number {
    if (processedError.recovery.retryAfter) {
      return processedError.recovery.retryAfter * 1000; // Convert to milliseconds
    }
    
    const errorCode = processedError.code;
    return this.RETRY_DELAYS[errorCode as keyof typeof this.RETRY_DELAYS] || 
           this.RETRY_DELAYS.DEFAULT;
  }

  /**
   * Format error for display in UI components
   */
  static formatForUI(processedError: ProcessedAuthError): {
    title: string;
    message: string;
    actions: string[];
    canRetry: boolean;
    retryAfter?: number;
  } {
    return {
      title: this.getErrorTitle(processedError.code),
      message: processedError.userMessage,
      actions: processedError.recovery.suggestedActions,
      canRetry: processedError.recovery.canRetry,
      retryAfter: processedError.recovery.retryAfter,
    };
  }

  /**
   * Get appropriate error title for UI
   */
  private static getErrorTitle(errorCode: string): string {
    switch (errorCode) {
      case this.ERROR_CODES.INVALID_CREDENTIALS:
        return 'ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง';
      case this.ERROR_CODES.ACCOUNT_LOCKED:
        return 'บัญชีถูกล็อค';
      case this.ERROR_CODES.ACCOUNT_DISABLED:
        return 'บัญชีถูกปิดใช้งาน';
      case this.ERROR_CODES.TOO_MANY_ATTEMPTS:
        return 'พยายามเข้าสู่ระบบบ่อยเกินไป';
      case this.ERROR_CODES.NETWORK_ERROR:
        return 'ปัญหาการเชื่อมต่อ';
      case this.ERROR_CODES.SERVER_ERROR:
        return 'ข้อผิดพลาดของระบบ';
      case this.ERROR_CODES.EMAIL_ALREADY_EXISTS:
      case this.ERROR_CODES.STUDENT_ID_ALREADY_EXISTS:
        return 'ข้อมูลซ้ำในระบบ';
      default:
        return 'เกิดข้อผิดพลาด';
    }
  }
}