// Error types for better error handling
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Enhanced error interface
export interface EnhancedError {
  type: ErrorType;
  message: string;
  originalError: any;
  isRetryable: boolean;
  userMessage: string;
  technicalMessage?: string;
}

// Error classification function
export function classifyError(error: any): EnhancedError {
  // Network errors (no response)
  if (!error.response) {
    if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network connection failed',
        originalError: error,
        isRetryable: true,
        userMessage: 'ไม่สามารถเชื่อมต่อเครือข่ายได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
        technicalMessage: error.message
      };
    }
    
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        type: ErrorType.TIMEOUT_ERROR,
        message: 'Request timeout',
        originalError: error,
        isRetryable: true,
        userMessage: 'การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง',
        technicalMessage: error.message
      };
    }
  }

  // HTTP response errors
  if (error.response) {
    const status = error.response.status;
    
    switch (status) {
      case 401:
        return {
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'Authentication failed',
          originalError: error,
          isRetryable: false,
          userMessage: 'ไม่มีสิทธิ์เข้าถึงข้อมูล กรุณาเข้าสู่ระบบใหม่',
          technicalMessage: error.response.data?.message
        };
        
      case 403:
        return {
          type: ErrorType.AUTHORIZATION_ERROR,
          message: 'Access forbidden',
          originalError: error,
          isRetryable: false,
          userMessage: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้',
          technicalMessage: error.response.data?.message
        };
        
      case 404:
        return {
          type: ErrorType.NOT_FOUND_ERROR,
          message: 'Resource not found',
          originalError: error,
          isRetryable: false,
          userMessage: 'ไม่พบข้อมูลที่ต้องการ',
          technicalMessage: error.response.data?.message
        };
        
      case 408:
        return {
          type: ErrorType.TIMEOUT_ERROR,
          message: 'Request timeout',
          originalError: error,
          isRetryable: true,
          userMessage: 'การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง',
          technicalMessage: error.response.data?.message
        };
        
      case 422:
        return {
          type: ErrorType.VALIDATION_ERROR,
          message: 'Validation failed',
          originalError: error,
          isRetryable: false,
          userMessage: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่',
          technicalMessage: error.response.data?.message
        };
        
      default:
        if (status >= 500) {
          return {
            type: ErrorType.SERVER_ERROR,
            message: 'Server error',
            originalError: error,
            isRetryable: true,
            userMessage: 'เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง',
            technicalMessage: error.response.data?.message
          };
        }
    }
  }

  // Unknown error
  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: 'Unknown error occurred',
    originalError: error,
    isRetryable: false,
    userMessage: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง',
    technicalMessage: error.message || 'Unknown error'
  };
}

// Error logging utility
export function logError(error: EnhancedError, context?: string) {
  const logData = {
    timestamp: new Date().toISOString(),
    context: context || 'Unknown',
    errorType: error.type,
    message: error.message,
    userMessage: error.userMessage,
    technicalMessage: error.technicalMessage,
    isRetryable: error.isRetryable,
    originalError: {
      message: error.originalError?.message,
      stack: error.originalError?.stack,
      response: error.originalError?.response ? {
        status: error.originalError.response.status,
        statusText: error.originalError.response.statusText,
        data: error.originalError.response.data
      } : undefined
    }
  };

  console.error('Enhanced Error Log:', logData);
  
  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service (e.g., Sentry, LogRocket, etc.)
    // logToService(logData);
  }
}

// Error recovery suggestions
export function getRecoveryActions(error: EnhancedError): Array<{
  label: string;
  action: string;
  primary?: boolean;
}> {
  const actions = [];

  switch (error.type) {
    case ErrorType.NETWORK_ERROR:
      actions.push(
        { label: 'ตรวจสอบการเชื่อมต่อ', action: 'check_connection' },
        { label: 'ลองใหม่', action: 'retry', primary: true }
      );
      break;
      
    case ErrorType.TIMEOUT_ERROR:
      actions.push(
        { label: 'ลองใหม่', action: 'retry', primary: true },
        { label: 'รีเฟรชหน้า', action: 'refresh' }
      );
      break;
      
    case ErrorType.AUTHENTICATION_ERROR:
      actions.push(
        { label: 'เข้าสู่ระบบใหม่', action: 'login', primary: true }
      );
      break;
      
    case ErrorType.SERVER_ERROR:
      actions.push(
        { label: 'ลองใหม่', action: 'retry', primary: true },
        { label: 'รายงานปัญหา', action: 'report' }
      );
      break;
      
    default:
      actions.push(
        { label: 'ลองใหม่', action: 'retry', primary: true },
        { label: 'รีเฟรชหน้า', action: 'refresh' }
      );
  }

  return actions;
}

// Error boundary error handler
export function handleErrorBoundaryError(error: Error, errorInfo: React.ErrorInfo): EnhancedError {
  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: 'Component error occurred',
    originalError: { ...error, errorInfo },
    isRetryable: true,
    userMessage: 'เกิดข้อผิดพลาดในการแสดงผล กรุณาลองใหม่อีกครั้ง',
    technicalMessage: `${error.message}\n${errorInfo.componentStack}`
  };
}