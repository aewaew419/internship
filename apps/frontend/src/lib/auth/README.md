# Authentication Error Handling System

A comprehensive error handling system for authentication flows that provides centralized error processing, user-friendly messages, recovery suggestions, and analytics.

## Features

- **Centralized Error Processing**: Standardized error handling across all authentication flows
- **User-Friendly Messages**: Thai language error messages with clear explanations
- **Recovery Suggestions**: Actionable steps to help users resolve errors
- **Error Analytics**: Comprehensive tracking and reporting of authentication errors
- **Retry Logic**: Intelligent retry mechanisms with exponential backoff
- **Offline Support**: Error handling for offline scenarios
- **Mobile Optimization**: Touch-friendly error dialogs and alerts
- **Security Focused**: Proper handling of security-related errors

## Core Components

### 1. AuthErrorHandler

The main error processing engine that categorizes and processes authentication errors.

```typescript
import { AuthErrorHandler } from '@/lib/auth/error-handler';

// Process an error
const processedError = AuthErrorHandler.processError(error, {
  action: 'login',
  userType: 'student',
  attemptCount: 1,
});

// Check if error is retryable
const canRetry = AuthErrorHandler.isRetryable(processedError);

// Get retry delay
const delay = AuthErrorHandler.getRetryDelay(processedError);
```

### 2. AuthErrorReporter

Handles error reporting, analytics, and user feedback collection.

```typescript
import { AuthErrorReporter } from '@/lib/auth/error-reporter';

// Report an error
await AuthErrorReporter.reportError(processedError, userFeedback);

// Record recovery attempt
AuthErrorReporter.recordRecoveryAttempt(errorCode, successful);

// Get analytics
const analytics = AuthErrorReporter.getAnalytics();
```

### 3. useAuthErrorHandler Hook

React hook for integrating error handling into components.

```typescript
import { useAuthErrorHandler } from '@/hooks/useAuthErrorHandler';

const errorHandler = useAuthErrorHandler(
  { action: 'login', userType: 'student' },
  {
    maxRetries: 3,
    autoRetry: false,
    showErrorDialog: true,
  }
);

// Handle an error
const processedError = await errorHandler.handleError(error);

// Retry with custom function
const success = await errorHandler.retry(async () => {
  return await loginFunction(credentials);
});
```

## UI Components

### 1. AuthErrorDialog

Modal dialog for displaying detailed error information and recovery options.

```typescript
import { AuthErrorDialog } from '@/components/ui/AuthErrorDialog';

<AuthErrorDialog
  isOpen={showDialog}
  error={processedError}
  onClose={() => setShowDialog(false)}
  onRetry={handleRetry}
  onFeedback={handleFeedback}
/>
```

### 2. AuthErrorAlert

Inline alert component for form errors.

```typescript
import { AuthErrorAlert } from '@/components/ui/AuthErrorAlert';

<AuthErrorAlert
  error={processedError}
  onRetry={handleRetry}
  onDismiss={clearError}
  showRecoverySteps={true}
  compact={isMobile}
/>
```

### 3. EnhancedAuthForm

Form wrapper that automatically handles errors.

```typescript
import { EnhancedAuthForm } from '@/components/forms/EnhancedAuthForm';

<EnhancedAuthForm
  action="login"
  userType="student"
  onSubmit={handleSubmit}
  onSuccess={handleSuccess}
  maxRetries={3}
>
  {({ handleSubmit, isSubmitting, hasError }) => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(formData);
    }}>
      {/* Form fields */}
    </form>
  )}
</EnhancedAuthForm>
```

## Error Categories

### Authentication Errors
- `AUTH_INVALID_CREDENTIALS`: Wrong username/password
- `AUTH_ACCOUNT_LOCKED`: Account locked due to too many attempts
- `AUTH_ACCOUNT_DISABLED`: Account disabled by admin
- `AUTH_SESSION_EXPIRED`: Session has expired
- `AUTH_TOO_MANY_ATTEMPTS`: Rate limiting triggered

### Validation Errors
- `VALIDATION_INVALID_STUDENT_ID`: Invalid student ID format
- `VALIDATION_INVALID_EMAIL`: Invalid email format
- `VALIDATION_WEAK_PASSWORD`: Password doesn't meet requirements
- `VALIDATION_REQUIRED_FIELD`: Required field is empty

### Network Errors
- `NETWORK_ERROR`: No internet connection
- `NETWORK_TIMEOUT`: Request timed out
- `SERVER_ERROR`: Server-side error

### Registration Errors
- `REGISTRATION_EMAIL_EXISTS`: Email already registered
- `REGISTRATION_STUDENT_ID_EXISTS`: Student ID already registered

## Error Severity Levels

- **Critical**: Requires immediate attention (account locked, security issues)
- **High**: Significant issues (server errors, account disabled)
- **Medium**: Common issues (invalid credentials, network errors)
- **Low**: Minor issues (validation errors)

## Recovery Mechanisms

### Automatic Retry
- Network errors: 3 attempts with exponential backoff
- Server errors: 2 attempts with 5-second delay
- Timeout errors: 2 attempts with 3-second delay

### User-Guided Recovery
- Step-by-step recovery instructions
- Suggested actions based on error type
- Links to help resources

### Rate Limiting
- Progressive delays for repeated attempts
- Account lockout prevention
- IP-based rate limiting awareness

## Analytics and Monitoring

### Error Tracking
- Error frequency by type and category
- User type and action correlation
- Time-based trends and patterns

### Recovery Success Rates
- Track recovery attempt success rates
- Identify problematic error types
- Monitor system reliability

### User Feedback
- Optional user feedback collection
- Error context and device information
- Sentiment analysis for UX improvements

## Integration Examples

### Basic Login Form

```typescript
import { useSimpleAuthErrorHandler } from '@/hooks/useAuthErrorHandler';

const LoginForm = () => {
  const { handleError, currentError, clearError, formattedError } = 
    useSimpleAuthErrorHandler('login');

  const handleSubmit = async (data) => {
    try {
      await loginAPI(data);
    } catch (error) {
      await handleError(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {currentError && (
        <AuthErrorAlert
          error={currentError}
          onDismiss={clearError}
        />
      )}
      {/* Form fields */}
    </form>
  );
};
```

### Enhanced Form with Full Features

```typescript
import { EnhancedAuthForm } from '@/components/forms/EnhancedAuthForm';

const AdvancedLoginForm = () => {
  return (
    <EnhancedAuthForm
      action="login"
      userType="student"
      onSubmit={handleLogin}
      onSuccess={handleSuccess}
      maxRetries={5}
      autoRetry={false}
      showInlineErrors={true}
      showErrorDialog={true}
    >
      {({ handleSubmit, isSubmitting, hasError }) => (
        <form onSubmit={(e) => {
          e.preventDefault();
          if (validateForm()) {
            handleSubmit(formData);
          }
        }}>
          {/* Form implementation */}
        </form>
      )}
    </EnhancedAuthForm>
  );
};
```

### Error Analytics Dashboard

```typescript
import { AuthErrorDashboard } from '@/components/ui/AuthErrorDashboard';

const AdminDashboard = () => {
  return (
    <AuthErrorDashboard
      showExportButton={true}
      showClearButton={true}
      onExport={(data) => downloadAnalytics(data)}
      onClear={() => clearAnalytics()}
    />
  );
};
```

## Configuration

### Environment Variables

```env
# Error reporting endpoint
NEXT_PUBLIC_ERROR_REPORT_ENDPOINT=/api/auth/error-reports

# Enable/disable error reporting
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true

# Maximum stored error reports
NEXT_PUBLIC_MAX_ERROR_REPORTS=100
```

### Customization

```typescript
// Custom error messages
const customMessages = {
  AUTH_INVALID_CREDENTIALS: 'Custom message for invalid credentials',
  // ... other messages
};

// Custom recovery steps
const customRecoverySteps = {
  AUTH_ACCOUNT_LOCKED: [
    {
      id: 'contact-support',
      title: 'Contact Support',
      description: 'Call our support team at 123-456-7890',
      isRequired: true,
    },
  ],
};
```

## Best Practices

### Error Handling
1. Always use the centralized error handler
2. Provide meaningful error contexts
3. Don't expose sensitive information in error messages
4. Log security-related errors for monitoring

### User Experience
1. Show inline errors for form validation
2. Use dialogs for critical errors
3. Provide clear recovery instructions
4. Allow users to submit feedback

### Performance
1. Implement proper retry logic
2. Use exponential backoff for network errors
3. Cache error analytics locally
4. Batch error reports when possible

### Security
1. Rate limit error reporting
2. Sanitize user feedback
3. Don't log sensitive data
4. Monitor for suspicious error patterns

## Testing

### Unit Tests
```typescript
import { AuthErrorHandler } from '@/lib/auth/error-handler';

describe('AuthErrorHandler', () => {
  it('should process network errors correctly', () => {
    const error = new Error('Network Error');
    error.code = 'NETWORK_ERROR';
    
    const processed = AuthErrorHandler.processError(error, {
      action: 'login',
      userType: 'student',
    });
    
    expect(processed.category).toBe('network');
    expect(processed.recovery.canRetry).toBe(true);
  });
});
```

### Integration Tests
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedAuthForm } from '@/components/forms/EnhancedAuthForm';

describe('EnhancedAuthForm', () => {
  it('should handle login errors gracefully', async () => {
    const mockSubmit = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
    
    const { getByText, getByRole } = render(
      <EnhancedAuthForm action="login" onSubmit={mockSubmit}>
        {({ handleSubmit }) => (
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSubmit({});
          }}>
            <button type="submit">Login</button>
          </form>
        )}
      </EnhancedAuthForm>
    );
    
    fireEvent.click(getByRole('button', { name: 'Login' }));
    
    await waitFor(() => {
      expect(getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
```

## Troubleshooting

### Common Issues

1. **Errors not being caught**: Ensure you're using the error handler in try-catch blocks
2. **Analytics not updating**: Check localStorage permissions and quotas
3. **Retry not working**: Verify error is marked as retryable
4. **UI not updating**: Ensure proper state management in React components

### Debug Mode

```typescript
// Enable debug logging
localStorage.setItem('auth-error-debug', 'true');

// View stored error reports
console.log(AuthErrorReporter.getStoredReports());

// View analytics
console.log(AuthErrorReporter.getAnalytics());
```

## Migration Guide

### From Basic Error Handling

```typescript
// Before
try {
  await login(credentials);
} catch (error) {
  setError(error.message);
}

// After
try {
  await login(credentials);
} catch (error) {
  const processedError = await errorHandler.handleError(error);
  // Error is automatically displayed and handled
}
```

### From Custom Error Components

```typescript
// Before
{error && (
  <div className="error">
    {error.message}
    <button onClick={retry}>Retry</button>
  </div>
)}

// After
<AuthErrorAlert
  error={processedError}
  onRetry={handleRetry}
  onDismiss={clearError}
  showRecoverySteps={true}
/>
```

This comprehensive error handling system provides a robust foundation for managing authentication errors while maintaining excellent user experience and system reliability.