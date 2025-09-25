# Authentication Troubleshooting Guide

## Table of Contents

1. [Common Issues](#common-issues)
2. [Error Messages](#error-messages)
3. [Performance Issues](#performance-issues)
4. [Accessibility Issues](#accessibility-issues)
5. [Browser Compatibility](#browser-compatibility)
6. [Mobile Issues](#mobile-issues)
7. [Development Issues](#development-issues)
8. [Debug Tools](#debug-tools)

## Common Issues

### Login Form Not Submitting

**Symptoms:**
- Form doesn't submit when clicking the submit button
- No error messages shown
- Page doesn't redirect after successful login

**Possible Causes:**
1. JavaScript errors preventing form submission
2. Validation errors not displayed properly
3. Network connectivity issues
4. Rate limiting active

**Solutions:**

1. **Check Browser Console:**
```javascript
// Open browser console (F12) and look for errors
console.log('Form data:', formData);
console.log('Validation errors:', errors);
```

2. **Verify Form Validation:**
```tsx
// Add debug logging to validation
const validateForm = () => {
  const newErrors = {};
  
  const studentIdValidation = validateStudentId(formData.studentId);
  console.log('Student ID validation:', studentIdValidation);
  
  if (!studentIdValidation.isValid) {
    newErrors.studentId = studentIdValidation.message;
  }
  
  // ... rest of validation
  
  console.log('Form validation result:', Object.keys(newErrors).length === 0);
  return Object.keys(newErrors).length === 0;
};
```

3. **Check Network Requests:**
```javascript
// Monitor network requests in browser dev tools
// Look for failed API calls or CORS errors
```

4. **Verify Rate Limiting:**
```tsx
// Check if rate limiting is active
console.log('Rate limited:', secureAuth.isRateLimited);
console.log('Remaining attempts:', secureAuth.remainingAttempts);
```

### Validation Not Working

**Symptoms:**
- Input validation doesn't trigger
- Error messages don't appear
- Form accepts invalid data

**Solutions:**

1. **Check Validation Cache:**
```tsx
import { useMemoizedValidation } from '@/hooks/useMemoizedValidation';

const { clearValidationCache, getCacheStats } = useMemoizedValidation();

// Clear cache if needed
clearValidationCache();

// Check cache statistics
console.log('Cache stats:', getCacheStats());
```

2. **Verify Input Sanitization:**
```tsx
// Check if input is being sanitized properly
const handleInputChange = (field) => (e) => {
  const value = e.target.value;
  console.log('Original value:', value);
  
  const sanitizedValue = field === 'studentId' 
    ? sanitizeStudentId(value)
    : sanitizePassword(value);
    
  console.log('Sanitized value:', sanitizedValue);
};
```

3. **Test Validation Functions:**
```tsx
// Test validation functions directly
import { validateStudentId, validatePassword } from '@/lib/utils';

console.log('Student ID validation:', validateStudentId('12345678'));
console.log('Password validation:', validatePassword('testpassword'));
```

### Authentication State Issues

**Symptoms:**
- User appears logged in but can't access protected routes
- Authentication state not persisting across page refreshes
- Multiple login attempts required

**Solutions:**

1. **Check Authentication Context:**
```tsx
import { useAuth } from '@/hooks/useAuth';

const { user, isAuthenticated } = useAuth();
console.log('User:', user);
console.log('Is authenticated:', isAuthenticated);
```

2. **Verify Token Storage:**
```javascript
// Check if tokens are stored properly
console.log('Access token:', localStorage.getItem('accessToken'));
console.log('Refresh token:', localStorage.getItem('refreshToken'));
```

3. **Test Secure Auth:**
```tsx
import { useSecureAuth } from '@/hooks/useSecureAuth';

const secureAuth = useSecureAuth();
console.log('Secure auth state:', {
  isRateLimited: secureAuth.isRateLimited,
  remainingAttempts: secureAuth.remainingAttempts,
  sessionTimeRemaining: secureAuth.sessionTimeRemaining,
});
```

## Error Messages

### "รหัสนักศึกษาต้องมี 8-10 หลัก"

**Cause:** Student ID validation failed

**Debug Steps:**
```tsx
// Check input value and validation
const studentId = formData.studentId;
console.log('Student ID:', studentId);
console.log('Length:', studentId.length);
console.log('Is numeric:', /^\d+$/.test(studentId));

// Test validation function
const validation = validateStudentId(studentId);
console.log('Validation result:', validation);
```

**Solutions:**
- Ensure student ID contains only digits
- Check that length is between 8-10 characters
- Verify input sanitization is working

### "การเข้าสู่ระบบถูกจำกัดชั่วคราว เพื่อความปลอดภัย"

**Cause:** Rate limiting is active due to multiple failed attempts

**Debug Steps:**
```tsx
// Check rate limiting status
console.log('Rate limit info:', {
  isRateLimited: secureAuth.isRateLimited,
  remainingAttempts: secureAuth.remainingAttempts,
  lastAttemptTime: localStorage.getItem('lastLoginAttempt'),
});
```

**Solutions:**
- Wait for the rate limit to expire (usually 15-30 minutes)
- Clear rate limiting data if in development:
```javascript
// Development only - clear rate limiting
localStorage.removeItem('loginAttempts');
localStorage.removeItem('lastLoginAttempt');
```

### "เกิดข้อผิดพลาดในการเชื่อมต่อ"

**Cause:** Network or API connection issues

**Debug Steps:**
```javascript
// Check network connectivity
navigator.onLine; // true if online

// Test API endpoint
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ studentId: '12345678', password: 'test' })
})
.then(response => console.log('API response:', response))
.catch(error => console.error('API error:', error));
```

**Solutions:**
- Check internet connection
- Verify API endpoint is accessible
- Check for CORS issues
- Verify server is running

## Performance Issues

### Slow Form Rendering

**Symptoms:**
- Form takes long time to appear
- Laggy input responses
- High CPU usage

**Debug Steps:**

1. **Use Performance Monitor:**
```tsx
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

const performanceMonitor = usePerformanceMonitor({
  componentName: 'LoginForm',
  enableMemoryTracking: true,
  reportThreshold: 16,
});

// Check performance summary
const summary = performanceMonitor.getPerformanceSummary();
console.log('Performance summary:', summary);
```

2. **Check Render Count:**
```tsx
const renderCount = useRef(0);
renderCount.current += 1;
console.log('Render count:', renderCount.current);
```

3. **Monitor Memory Usage:**
```tsx
import { useMemoryTracker } from '@/hooks/usePerformanceMonitor';

const { getMemoryUsage } = useMemoryTracker();
const memoryUsage = getMemoryUsage();
console.log('Memory usage:', memoryUsage);
```

**Solutions:**

1. **Use Optimized Components:**
```tsx
// Switch to optimized version
import { OptimizedLoginForm } from '@/components/forms/OptimizedLoginForm';
```

2. **Enable Lazy Loading:**
```tsx
// Use lazy loading for better performance
import { LazyLoginForm } from '@/components/forms/LazyLoginForm';
```

3. **Clear Performance Cache:**
```tsx
// Clear validation cache if it's too large
const { clearValidationCache } = useMemoizedValidation();
clearValidationCache();
```

### High Memory Usage

**Debug Steps:**
```tsx
// Monitor memory leaks
const { trackMemoryLeaks } = useMemoryTracker();

useEffect(() => {
  const cleanup = trackMemoryLeaks();
  return cleanup;
}, []);
```

**Solutions:**
- Use React.memo for components
- Clear unused caches
- Check for memory leaks in useEffect hooks

## Accessibility Issues

### Screen Reader Not Announcing

**Symptoms:**
- Screen reader doesn't announce form status
- Error messages not read aloud
- Navigation announcements missing

**Debug Steps:**

1. **Check Live Regions:**
```javascript
// Verify live regions exist
const politeRegion = document.getElementById('sr-live-region-polite');
const assertiveRegion = document.getElementById('sr-live-region-assertive');

console.log('Polite region:', politeRegion);
console.log('Assertive region:', assertiveRegion);
```

2. **Test Screen Reader Hook:**
```tsx
import { useScreenReader } from '@/hooks/useScreenReader';

const screenReader = useScreenReader();

// Test announcements
screenReader.announce('Test message', 'polite');
screenReader.announceError('Test error');
```

**Solutions:**

1. **Ensure Proper ARIA Labels:**
```tsx
// Check ARIA attributes
<input
  aria-label="รหัสนักศึกษา"
  aria-describedby="studentId-description"
  aria-invalid={errors.studentId ? 'true' : 'false'}
  aria-required="true"
/>
```

2. **Verify Live Region Creation:**
```tsx
// The useScreenReader hook should create live regions automatically
// If not working, check browser console for errors
```

### Keyboard Navigation Issues

**Debug Steps:**
```tsx
// Test focus management
import { useFocusManagement } from '@/hooks/useFocusManagement';

const { focusFirstElement, focusLastElement } = useFocusManagement({
  containerRef: formRef,
  trapFocus: true,
});

// Test focus methods
focusFirstElement();
```

**Solutions:**
- Ensure all interactive elements have proper tabIndex
- Check focus trap implementation
- Verify keyboard event handlers

### High Contrast Mode Not Working

**Debug Steps:**
```javascript
// Check if high contrast styles are applied
const root = document.documentElement;
console.log('High contrast class:', root.classList.contains('high-contrast'));
console.log('CSS variables:', {
  bgPrimary: getComputedStyle(root).getPropertyValue('--bg-primary'),
  textPrimary: getComputedStyle(root).getPropertyValue('--text-primary'),
});
```

**Solutions:**
- Verify CSS variables are set correctly
- Check if accessibility controls are working
- Ensure high contrast styles are loaded

## Browser Compatibility

### Internet Explorer Issues

**Note:** IE is not officially supported, but here are common issues:

- ES6+ features not supported
- CSS Grid/Flexbox issues
- Fetch API not available

**Solutions:**
- Use supported browsers (Chrome, Firefox, Safari, Edge)
- Add polyfills if IE support is required

### Safari-Specific Issues

**Common Issues:**
- Input focus issues on iOS
- Date picker problems
- CSS compatibility

**Solutions:**
```css
/* Safari-specific fixes */
input {
  -webkit-appearance: none;
  border-radius: 0;
}

/* Prevent zoom on iOS */
input[type="text"] {
  font-size: 16px;
}
```

## Mobile Issues

### Touch Target Size

**Issue:** Buttons too small for touch interaction

**Debug:**
```css
/* Check computed styles */
.button {
  min-height: 44px; /* iOS recommendation */
  min-width: 44px;
}
```

**Solution:**
```tsx
// Use mobile-optimized components
<ResponsiveButton
  size={isMobile ? "xl" : "lg"}
  touchOptimized
/>
```

### Keyboard Issues

**Issue:** Wrong keyboard type on mobile

**Solution:**
```tsx
// Ensure proper input attributes
<input
  type="text"
  inputMode="numeric"  // Shows numeric keyboard
  pattern="[0-9]*"     // iOS numeric keyboard
/>
```

### Viewport Issues

**Issue:** Form doesn't fit on small screens

**Solution:**
```tsx
// Use responsive containers
<ResponsiveFormContainer
  variant="default"
  size="md"
  mobileOptimized
/>
```

## Development Issues

### Hot Reload Not Working

**Solutions:**
1. Restart development server
2. Clear browser cache
3. Check for TypeScript errors

### TypeScript Errors

**Common Errors:**

1. **Type Import Issues:**
```tsx
// Correct import
import type { StudentLoginDTO } from '@/types/api';
```

2. **Hook Type Issues:**
```tsx
// Ensure proper typing
const [formData, setFormData] = useState<StudentLoginDTO>({
  studentId: "",
  password: "",
});
```

### Environment Variables

**Issue:** Environment variables not loading

**Debug:**
```javascript
console.log('Environment:', process.env.NODE_ENV);
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

**Solution:**
- Check .env.local file exists
- Ensure variables start with NEXT_PUBLIC_ for client-side
- Restart development server after changes

## Debug Tools

### Performance Debugging

```tsx
// Add to component for performance debugging
{process.env.NODE_ENV === 'development' && (
  <div className="debug-panel">
    <h3>Debug Info</h3>
    <pre>{JSON.stringify({
      renderCount: renderCount.current,
      formData,
      errors,
      isLoading,
      performanceSummary: performanceMonitor.getPerformanceSummary(),
    }, null, 2)}</pre>
  </div>
)}
```

### Network Debugging

```javascript
// Monitor all fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch request:', args);
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('Fetch response:', response);
      return response;
    })
    .catch(error => {
      console.error('Fetch error:', error);
      throw error;
    });
};
```

### State Debugging

```tsx
// Add state logger
useEffect(() => {
  console.log('State changed:', {
    formData,
    errors,
    isLoading,
    isAuthenticated,
  });
}, [formData, errors, isLoading, isAuthenticated]);
```

### Accessibility Debugging

```javascript
// Check accessibility tree
const axeCore = require('@axe-core/react');

if (process.env.NODE_ENV !== 'production') {
  axeCore(React, ReactDOM, 1000);
}
```

## Getting Help

If you can't resolve the issue using this guide:

1. **Check Browser Console** for error messages
2. **Test in Different Browser** to isolate browser-specific issues
3. **Clear Browser Cache** and try again
4. **Check Network Tab** for failed requests
5. **Create Minimal Reproduction** of the issue
6. **Document Steps to Reproduce** the problem
7. **Include Environment Information** (browser, OS, device)

### Information to Include When Reporting Issues

- Browser and version
- Operating system
- Device type (desktop/mobile)
- Steps to reproduce
- Expected behavior
- Actual behavior
- Console error messages
- Network request details
- Screenshots or screen recordings

### Emergency Contacts

For critical production issues:
- **Technical Support**: support@university.ac.th
- **Emergency Hotline**: 02-XXX-XXXX (24/7)

---

**Last Updated:** [Current Date]  
**Version:** 1.0