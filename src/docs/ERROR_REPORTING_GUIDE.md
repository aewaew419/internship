# Error Reporting and Analytics System

ระบบรายงานและวิเคราะห์ข้อผิดพลาดสำหรับ Authentication UI

## Overview

ระบบนี้ประกอบด้วย:
- **Error Logging**: บันทึกข้อผิดพลาดอัตโนมัติ
- **User Feedback**: ให้ผู้ใช้รายงานปัญหาได้
- **Analytics Dashboard**: แสดงสถิติและแนวโน้มข้อผิดพลาด
- **Error Boundary**: จัดการข้อผิดพลาดที่ไม่คาดคิด

## Quick Start

### 1. Basic Error Logging

```typescript
import { useErrorReporting } from '../hooks/useErrorReporting';

const MyComponent = () => {
  const { logError, logAuthError, logValidationError } = useErrorReporting();

  const handleError = () => {
    // Log authentication error
    logAuthError('INVALID_CREDENTIALS', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', userId);
    
    // Log validation error
    logValidationError('email', 'รูปแบบอีเมลไม่ถูกต้อง', 'invalid-email');
    
    // Log general error
    logError({
      type: 'system',
      code: 'CUSTOM_ERROR',
      message: 'Something went wrong'
    });
  };
};
```

### 2. Form Integration

```typescript
import { useAuthFormErrors } from '../utils/authErrorIntegration';

const LoginForm = () => {
  const {
    errorState,
    addValidationError,
    addAuthError,
    clearFieldError,
    getFieldError,
    hasFieldError
  } = useAuthFormErrors();

  const handleSubmit = async (formData) => {
    try {
      await loginAPI(formData);
    } catch (error) {
      addAuthError(error, 'login');
    }
  };

  const emailError = getFieldError('email');
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        className={hasFieldError('email') ? 'error' : ''}
        onChange={() => clearFieldError('email')}
      />
      {emailError && <span>{emailError.message}</span>}
    </form>
  );
};
```

### 3. Error Boundary

```typescript
import { AuthErrorBoundary } from '../components/AuthErrorBoundary';

const App = () => (
  <AuthErrorBoundary>
    <MyAuthenticationComponent />
  </AuthErrorBoundary>
);
```

### 4. Analytics Dashboard

```typescript
import { ErrorAnalyticsDashboard } from '../components/ErrorAnalyticsDashboard';

const AdminPanel = () => (
  <div>
    <h1>Admin Dashboard</h1>
    <ErrorAnalyticsDashboard />
  </div>
);
```

## Components

### ErrorReportModal

Modal สำหรับให้ผู้ใช้รายงานปัญหา

```typescript
<ErrorReportModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  errorId="error_123"
  errorMessage="เกิดข้อผิดพลาดในการเข้าสู่ระบบ"
  onReportSubmitted={() => console.log('Report sent')}
/>
```

**Props:**
- `isOpen`: แสดง/ซ่อน modal
- `onClose`: callback เมื่อปิด modal
- `errorId`: ID ของข้อผิดพลาดที่จะรายงาน
- `errorMessage`: ข้อความข้อผิดพลาด
- `onReportSubmitted`: callback เมื่อส่งรายงานสำเร็จ

### ErrorAnalyticsDashboard

Dashboard แสดงสถิติข้อผิดพลาด

```typescript
<ErrorAnalyticsDashboard className="my-dashboard" />
```

**Features:**
- สถิติข้อผิดพลาดรวม
- แยกตามประเภท (validation, authentication, network, system)
- ข้อผิดพลาดที่พบบ่อย
- แนวโน้มตามเวลา
- ผลกระทบต่อผู้ใช้

### AuthErrorBoundary

Error boundary สำหรับจัดการข้อผิดพลาดที่ไม่คาดคิด

```typescript
<AuthErrorBoundary
  fallback={<CustomErrorPage />}
  onError={(error, errorInfo) => console.log('Error caught:', error)}
>
  <MyComponent />
</AuthErrorBoundary>
```

**Props:**
- `fallback`: Component แสดงเมื่อเกิดข้อผิดพลาด
- `onError`: callback เมื่อจับข้อผิดพลาดได้

## Hooks

### useErrorReporting

Hook หลักสำหรับการรายงานข้อผิดพลาด

```typescript
const {
  logError,
  logValidationError,
  logAuthError,
  logNetworkError,
  logSystemError,
  reportError,
  getAnalytics,
  getUserErrors,
  resolveError,
  handleFormError,
  handleValidationError
} = useErrorReporting();
```

**Methods:**
- `logError(error)`: บันทึกข้อผิดพลาดทั่วไป
- `logValidationError(field, message, value)`: บันทึกข้อผิดพลาด validation
- `logAuthError(code, message, userId)`: บันทึกข้อผิดพลาด authentication
- `logNetworkError(error, endpoint)`: บันทึกข้อผิดพลาด network
- `logSystemError(error, component)`: บันทึกข้อผิดพลาด system
- `reportError(errorId, feedback, steps, severity)`: ส่งรายงานข้อผิดพลาด
- `getAnalytics(timeRange)`: ดึงข้อมูลสถิติ
- `getUserErrors(userId)`: ดึงข้อผิดพลาดของผู้ใช้
- `resolveError(errorId)`: ทำเครื่องหมายว่าแก้ไขแล้ว
- `handleFormError(error, formType)`: จัดการข้อผิดพลาดฟอร์ม
- `handleValidationError(field, message, value)`: จัดการข้อผิดพลาด validation

### useAuthFormErrors

Hook สำหรับจัดการข้อผิดพลาดในฟอร์ม authentication

```typescript
const {
  errorState,
  clearErrors,
  clearFieldError,
  addValidationError,
  addAuthError,
  addSystemError,
  showReportModal,
  hideReportModal,
  submitErrorReport,
  getFieldError,
  getGeneralErrors,
  hasFieldError
} = useAuthFormErrors();
```

## Error Types

### AuthError Interface

```typescript
interface AuthError {
  id: string;                    // Unique error ID
  type: 'validation' | 'authentication' | 'network' | 'system';
  code: string;                  // Error code
  message: string;               // Error message
  timestamp: Date;               // When error occurred
  userId?: string;               // User ID (if available)
  userAgent: string;             // Browser info
  url: string;                   // Page URL
  stackTrace?: string;           // Stack trace (for system errors)
  context?: Record<string, any>; // Additional context
}
```

### Error Codes

**Validation Errors:**
- `VALIDATION_EMAIL_ERROR`: อีเมลไม่ถูกต้อง
- `VALIDATION_STUDENT_ID_ERROR`: รหัสนักศึกษาไม่ถูกต้อง
- `VALIDATION_PASSWORD_ERROR`: รหัสผ่านไม่ถูกต้อง

**Authentication Errors:**
- `INVALID_CREDENTIALS`: ข้อมูลเข้าสู่ระบบไม่ถูกต้อง
- `ACCESS_DENIED`: ไม่มีสิทธิ์เข้าถึง
- `RATE_LIMITED`: พยายามเข้าสู่ระบบบ่อยเกินไป

**Network Errors:**
- `NETWORK_ERROR`: ปัญหาการเชื่อมต่อ
- `TIMEOUT_ERROR`: หมดเวลาการเชื่อมต่อ

**System Errors:**
- `SYSTEM_ERROR`: ข้อผิดพลาดของระบบ
- `REACT_ERROR_BOUNDARY`: ข้อผิดพลาด React component

## Configuration

### API Endpoints

กำหนด endpoint สำหรับส่งข้อมูล:

```typescript
// src/services/errorReporting.ts
class ErrorReportingService {
  private analyticsEndpoint = '/api/analytics/errors';
  private reportingEndpoint = '/api/errors/report';
  
  // ... rest of implementation
}
```

### Local Storage

ระบบจะเก็บข้อมูลใน localStorage:
- `auth_errors`: ข้อผิดพลาดล่าสุด (สูงสุด 100 รายการ)
- `pending_error_reports`: รายงานที่รอส่ง

### Error Persistence

ข้อผิดพลาดจะถูกเก็บไว้:
1. ใน memory (runtime)
2. ใน localStorage (สำหรับ offline)
3. ส่งไปยัง server (สำหรับ analytics)

## Best Practices

### 1. Error Logging

```typescript
// ✅ Good: Provide context
logError({
  type: 'authentication',
  code: 'LOGIN_FAILED',
  message: 'Login failed for user',
  context: { 
    formType: 'student-login',
    attemptNumber: 3 
  }
});

// ❌ Bad: No context
logError({
  type: 'system',
  code: 'ERROR',
  message: 'Something went wrong'
});
```

### 2. User-Friendly Messages

```typescript
// ✅ Good: Clear Thai message
addAuthError(error, 'login'); // Will show appropriate Thai message

// ❌ Bad: Technical error message
setError(error.message); // Might show "HTTP 401 Unauthorized"
```

### 3. Error Recovery

```typescript
// ✅ Good: Provide recovery options
const handleError = (error) => {
  const errorId = addAuthError(error, 'login');
  
  // Show retry button
  setShowRetry(true);
  
  // Offer to report error
  setReportableErrorId(errorId);
};
```

### 4. Privacy

```typescript
// ✅ Good: Don't log sensitive data
logValidationError('password', 'Password too short'); // No actual password

// ❌ Bad: Logging sensitive data
logValidationError('password', 'Password "secret123" is too short');
```

## Testing

### Unit Tests

```typescript
import { errorReportingService } from '../services/errorReporting';

describe('Error Reporting Service', () => {
  it('should log error with correct format', () => {
    const errorId = errorReportingService.logError({
      type: 'validation',
      code: 'TEST_ERROR',
      message: 'Test error message'
    });
    
    expect(errorId).toBeDefined();
    expect(errorId).toMatch(/^err_\d+_[a-z0-9]+$/);
  });
});
```

### Integration Tests

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react';
import { LoginFormWithErrorReporting } from '../examples/LoginFormWithErrorReporting';

describe('Login Form Error Reporting', () => {
  it('should show error report modal on auth error', async () => {
    const { getByText, getByRole } = render(<LoginFormWithErrorReporting />);
    
    // Trigger auth error
    fireEvent.click(getByRole('button', { name: /เข้าสู่ระบบ/i }));
    
    await waitFor(() => {
      expect(getByText('รายงานปัญหานี้')).toBeInTheDocument();
    });
  });
});
```

## Troubleshooting

### Common Issues

1. **Error not being logged**
   - ตรวจสอบว่า hook ถูกใช้ใน React component
   - ตรวจสอบ console สำหรับ error messages

2. **Analytics not updating**
   - ตรวจสอบ network requests ใน DevTools
   - ตรวจสอบ localStorage สำหรับข้อมูลที่เก็บไว้

3. **Report modal not showing**
   - ตรวจสอบว่ามี `reportableErrorId`
   - ตรวจสอบ state ของ `showReportModal`

### Debug Mode

เปิด debug mode ใน console:

```javascript
localStorage.setItem('auth_error_debug', 'true');
```

จะแสดงข้อมูล debug เพิ่มเติมใน console.

## API Integration

### Backend Requirements

Backend ต้องรองรับ endpoints:

```typescript
// POST /api/analytics/errors
interface AnalyticsRequest {
  error: {
    type: string;
    code: string;
    timestamp: string;
    userId?: string;
    userAgent: string;
    url: string;
    context?: Record<string, any>;
  };
}

// POST /api/errors/report
interface ErrorReportRequest {
  error: AuthError;
  userFeedback?: string;
  reproductionSteps?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  reportedAt: string;
}
```

### Response Format

```typescript
// Success response
{
  "success": true,
  "message": "Error logged successfully"
}

// Error response
{
  "success": false,
  "error": "Invalid request format",
  "code": "VALIDATION_ERROR"
}
```

## Migration Guide

### From Basic Error Handling

```typescript
// Before
const [error, setError] = useState('');

const handleLogin = async () => {
  try {
    await login();
  } catch (err) {
    setError('Login failed');
  }
};

// After
const { addAuthError } = useAuthFormErrors();

const handleLogin = async () => {
  try {
    await login();
  } catch (err) {
    addAuthError(err, 'login');
  }
};
```

### Adding Error Boundary

```typescript
// Before
<Router>
  <Routes>
    <Route path="/login" element={<LoginForm />} />
  </Routes>
</Router>

// After
<AuthErrorBoundary>
  <Router>
    <Routes>
      <Route path="/login" element={<LoginForm />} />
    </Routes>
  </Router>
</AuthErrorBoundary>
```