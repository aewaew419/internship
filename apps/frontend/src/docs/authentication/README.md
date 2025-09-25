# Authentication Components Documentation

## Overview

This documentation covers the authentication system components for the internship management system. The authentication system provides secure login functionality for students and administrators with comprehensive accessibility support, performance optimization, and robust error handling.

## Table of Contents

1. [Components](#components)
2. [Hooks](#hooks)
3. [Usage Examples](#usage-examples)
4. [Accessibility Features](#accessibility-features)
5. [Performance Optimization](#performance-optimization)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## Components

### LoginForm

The main login form component for student authentication.

**Props:**
- `onSubmit?: (data: StudentLoginDTO) => Promise<void>` - Custom submit handler

**Features:**
- Student ID validation (8-10 digits)
- Password validation
- Real-time validation with debouncing
- Form persistence and draft management
- Offline support
- Security features (rate limiting, session management)
- Responsive design

**Example:**
```tsx
import { LoginForm } from '@/components/forms/LoginForm';

function LoginPage() {
  return <LoginForm />;
}
```

### AccessibleLoginForm

Enhanced login form with comprehensive accessibility features.

**Props:**
- `onSubmit?: (data: StudentLoginDTO) => Promise<void>` - Custom submit handler
- `highContrast?: boolean` - Enable high contrast mode
- `textScale?: number` - Text scaling factor (default: 1)

**Accessibility Features:**
- Screen reader support with ARIA labels
- Keyboard navigation
- Focus management
- Error announcements
- High contrast mode
- Text scaling support

**Example:**
```tsx
import { AccessibleLoginForm } from '@/components/forms/AccessibleLoginForm';

function AccessibleLoginPage() {
  return (
    <AccessibleLoginForm 
      highContrast={true}
      textScale={1.2}
    />
  );
}
```

### OptimizedLoginForm

Performance-optimized login form with memoization and monitoring.

**Props:**
- `onSubmit?: (data: StudentLoginDTO) => Promise<void>` - Custom submit handler

**Performance Features:**
- Memoized components to prevent unnecessary re-renders
- Performance monitoring and metrics collection
- Optimized validation with caching
- Bundle size optimization

**Example:**
```tsx
import { OptimizedLoginForm } from '@/components/forms/OptimizedLoginForm';

function FastLoginPage() {
  return <OptimizedLoginForm />;
}
```

### LazyLoginForm

Code-split login form with lazy loading.

**Props:**
- `accessible?: boolean` - Use accessible version
- `onSubmit?: (data: StudentLoginDTO) => Promise<void>` - Custom submit handler

**Example:**
```tsx
import { LazyLoginForm } from '@/components/forms/LazyLoginForm';

function LazyLoginPage() {
  return (
    <LazyLoginForm 
      accessible={true}
      onSubmit={handleCustomSubmit}
    />
  );
}
```

### AccessibilityControls

Global accessibility controls panel.

**Features:**
- High contrast mode toggle
- Text scaling slider
- Reduced motion toggle
- Enhanced focus indicators toggle

**Example:**
```tsx
import { AccessibilityControls } from '@/components/ui/AccessibilityControls';

function App() {
  return (
    <div>
      <AccessibilityControls />
      {/* Your app content */}
    </div>
  );
}
```

## Hooks

### useScreenReader

Hook for screen reader announcements and accessibility.

**Methods:**
- `announce(message: string, priority?: 'polite' | 'assertive')` - Announce message
- `announceError(message: string)` - Announce error with assertive priority
- `announceSuccess(message: string)` - Announce success with polite priority
- `announceFormValidation(fieldName: string, message: string, isValid: boolean)` - Announce validation result

**Example:**
```tsx
import { useScreenReader } from '@/hooks/useScreenReader';

function MyComponent() {
  const screenReader = useScreenReader();
  
  const handleSubmit = () => {
    screenReader.announce('กำลังส่งข้อมูล', 'polite');
  };
  
  return <button onClick={handleSubmit}>Submit</button>;
}
```

### useFocusManagement

Hook for managing focus within components.

**Options:**
- `containerRef: RefObject<HTMLElement>` - Container element reference
- `trapFocus?: boolean` - Enable focus trapping
- `restoreFocus?: boolean` - Restore focus on unmount
- `autoFocus?: boolean` - Auto focus container on mount

**Methods:**
- `focusFirstElement()` - Focus first focusable element
- `focusLastElement()` - Focus last focusable element

**Example:**
```tsx
import { useFocusManagement } from '@/hooks/useFocusManagement';

function Modal() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { focusFirstElement } = useFocusManagement({
    containerRef,
    trapFocus: true,
    restoreFocus: true,
  });
  
  return <div ref={containerRef}>Modal content</div>;
}
```

### useKeyboardNavigation

Hook for keyboard navigation support.

**Options:**
- `containerRef: RefObject<HTMLElement>` - Container element reference
- `focusableElements?: RefObject<HTMLElement>[]` - Focusable elements
- `enableArrowKeys?: boolean` - Enable arrow key navigation
- `enableTabNavigation?: boolean` - Enable tab navigation

**Example:**
```tsx
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

function NavigableList() {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = [useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null)];
  
  useKeyboardNavigation({
    containerRef,
    focusableElements: itemRefs,
    enableArrowKeys: true,
  });
  
  return (
    <div ref={containerRef}>
      <button ref={itemRefs[0]}>Item 1</button>
      <button ref={itemRefs[1]}>Item 2</button>
    </div>
  );
}
```

### usePerformanceMonitor

Hook for monitoring component performance.

**Options:**
- `componentName: string` - Component name for tracking
- `enableMemoryTracking?: boolean` - Enable memory usage tracking
- `enableInteractionTracking?: boolean` - Enable interaction timing
- `reportThreshold?: number` - Report threshold in milliseconds

**Methods:**
- `measureInteraction(name: string, fn: Function)` - Measure interaction performance
- `getPerformanceSummary()` - Get performance summary
- `clearMetrics()` - Clear collected metrics

**Example:**
```tsx
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

function MyComponent() {
  const performanceMonitor = usePerformanceMonitor({
    componentName: 'MyComponent',
    enableMemoryTracking: true,
  });
  
  const handleClick = () => {
    performanceMonitor.measureInteraction('button-click', () => {
      // Expensive operation
    });
  };
  
  return <button onClick={handleClick}>Click me</button>;
}
```

### useMemoizedValidation

Hook for memoized form validation.

**Methods:**
- `validateStudentId(studentId: string)` - Validate student ID with caching
- `validatePassword(password: string)` - Validate password with caching
- `validateForm(formData)` - Validate entire form
- `clearValidationCache()` - Clear validation cache

**Example:**
```tsx
import { useMemoizedValidation } from '@/hooks/useMemoizedValidation';

function ValidationExample() {
  const { validateStudentId, validateForm } = useMemoizedValidation();
  
  const handleValidation = (studentId: string) => {
    const result = validateStudentId(studentId);
    console.log(result.isValid, result.message);
  };
  
  return <input onChange={(e) => handleValidation(e.target.value)} />;
}
```

## Usage Examples

### Basic Login Form

```tsx
import { LoginForm } from '@/components/forms/LoginForm';

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoginForm />
    </div>
  );
}
```

### Custom Submit Handler

```tsx
import { LoginForm } from '@/components/forms/LoginForm';
import { StudentLoginDTO } from '@/types/api';

function CustomLoginPage() {
  const handleSubmit = async (data: StudentLoginDTO) => {
    try {
      const response = await fetch('/api/custom-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        // Handle success
        window.location.href = '/dashboard';
      } else {
        // Handle error
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return <LoginForm onSubmit={handleSubmit} />;
}
```

### Accessible Login with Custom Settings

```tsx
import { AccessibleLoginForm } from '@/components/forms/AccessibleLoginForm';
import { AccessibilityControls } from '@/components/ui/AccessibilityControls';

function AccessibleLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <AccessibilityControls />
      <AccessibleLoginForm 
        highContrast={false} // Will be controlled by AccessibilityControls
        textScale={1}
      />
    </div>
  );
}
```

### Performance-Optimized Login

```tsx
import { OptimizedLoginForm } from '@/components/forms/OptimizedLoginForm';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

function PerformanceLoginPage() {
  const performanceMonitor = usePerformanceMonitor({
    componentName: 'LoginPage',
    enableMemoryTracking: true,
  });

  useEffect(() => {
    // Log performance summary after 5 seconds
    const timer = setTimeout(() => {
      const summary = performanceMonitor.getPerformanceSummary();
      console.log('Page Performance:', summary);
    }, 5000);

    return () => clearTimeout(timer);
  }, [performanceMonitor]);

  return <OptimizedLoginForm />;
}
```

## Accessibility Features

### Screen Reader Support

All authentication forms include comprehensive screen reader support:

- **ARIA Labels**: All form elements have proper ARIA labels and descriptions
- **Live Regions**: Status updates and errors are announced to screen readers
- **Error Announcements**: Validation errors are announced with appropriate priority
- **Form Structure**: Proper heading hierarchy and landmark roles

### Keyboard Navigation

- **Tab Navigation**: All interactive elements are keyboard accessible
- **Arrow Key Navigation**: Enhanced navigation within form elements
- **Focus Management**: Proper focus handling for modals and error states
- **Skip Links**: Skip to main content functionality

### Visual Accessibility

- **High Contrast Mode**: Toggle for high contrast color scheme
- **Text Scaling**: Adjustable text size from 80% to 150%
- **Focus Indicators**: Enhanced focus indicators for keyboard navigation
- **Reduced Motion**: Option to disable animations and transitions

### Implementation Example

```tsx
// Enable all accessibility features
<AccessibleLoginForm 
  highContrast={true}
  textScale={1.2}
/>

// Add global accessibility controls
<AccessibilityControls />
```

## Performance Optimization

### Code Splitting

Use lazy loading to reduce initial bundle size:

```tsx
import { LazyLoginForm } from '@/components/forms/LazyLoginForm';

// This will be loaded only when needed
<LazyLoginForm accessible={true} />
```

### Memoization

Components use React.memo and useMemo for optimization:

```tsx
// Automatically optimized with memoization
import { OptimizedLoginForm } from '@/components/forms/OptimizedLoginForm';
```

### Performance Monitoring

Monitor component performance in real-time:

```tsx
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

const performanceMonitor = usePerformanceMonitor({
  componentName: 'LoginForm',
  enableMemoryTracking: true,
  reportThreshold: 16, // Report if render takes > 16ms
});
```

### Performance Budgets

Set performance budgets for components:

```tsx
import { PERFORMANCE_BUDGETS } from '@/utils/performanceBudgets';

// Check if component exceeds budget
const isWithinBudget = renderTime <= PERFORMANCE_BUDGETS.LOGIN_FORM_RENDER;
```

## Testing

### Unit Tests

Test individual components and hooks:

```bash
npm test -- --testPathPattern=LoginForm
npm test -- --testPathPattern=useScreenReader
```

### Integration Tests

Test complete authentication flows:

```bash
npm test -- --testPathPattern=authentication-flow
```

### Accessibility Tests

Test accessibility features:

```bash
npm test -- --testPathPattern=accessibility
```

### Performance Tests

Monitor performance in tests:

```tsx
import { render } from '@testing-library/react';
import { OptimizedLoginForm } from '@/components/forms/OptimizedLoginForm';

test('should render within performance budget', () => {
  const startTime = performance.now();
  render(<OptimizedLoginForm />);
  const renderTime = performance.now() - startTime;
  
  expect(renderTime).toBeLessThan(16); // 60fps budget
});
```

## Troubleshooting

### Common Issues

#### 1. Form Not Submitting

**Problem**: Form submission doesn't work
**Solution**: Check if validation is passing and no rate limiting is active

```tsx
// Debug validation
const { validateForm } = useMemoizedValidation();
const validation = validateForm(formData);
console.log('Validation result:', validation);
```

#### 2. Accessibility Features Not Working

**Problem**: Screen reader announcements not heard
**Solution**: Ensure live regions are properly created

```tsx
// Check if live regions exist
const liveRegion = document.getElementById('sr-live-region-polite');
console.log('Live region exists:', !!liveRegion);
```

#### 3. Performance Issues

**Problem**: Component renders slowly
**Solution**: Use performance monitoring to identify bottlenecks

```tsx
const performanceMonitor = usePerformanceMonitor({
  componentName: 'LoginForm',
  reportThreshold: 16,
});

// Check performance summary
const summary = performanceMonitor.getPerformanceSummary();
console.log('Performance issues:', summary);
```

#### 4. Validation Cache Issues

**Problem**: Validation results not updating
**Solution**: Clear validation cache

```tsx
const { clearValidationCache } = useMemoizedValidation();
clearValidationCache();
```

### Debug Mode

Enable debug mode in development:

```tsx
// Add to your component
{process.env.NODE_ENV === 'development' && (
  <div className="debug-info">
    <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
  </div>
)}
```

### Performance Debugging

Monitor performance in development:

```tsx
// Enable performance overlay
const PERFORMANCE_CONFIG = {
  DEVELOPMENT: {
    SHOW_PERFORMANCE_OVERLAY: true,
    LOG_TO_CONSOLE: true,
  }
};
```

## API Reference

### Types

```typescript
interface StudentLoginDTO {
  studentId: string;
  password: string;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  mountTime: number;
  updateTime?: number;
  interactionTime?: number;
  memoryUsage?: number;
}
```

### Constants

```typescript
// Performance budgets
export const PERFORMANCE_BUDGETS = {
  LOGIN_FORM_RENDER: 16,
  INPUT_VALIDATION: 100,
  FORM_SUBMISSION: 1000,
};

// Validation messages
export const VALIDATION_MESSAGES = {
  STUDENT_ID_REQUIRED: 'กรุณากรอกรหัสนักศึกษา',
  STUDENT_ID_INVALID: 'รหัสนักศึกษาต้องมี 8-10 หลัก',
  PASSWORD_REQUIRED: 'กรุณากรอกรหัสผ่าน',
};
```

## Contributing

When contributing to the authentication system:

1. **Follow Accessibility Guidelines**: Ensure all new components meet WCAG 2.1 AA standards
2. **Add Performance Monitoring**: Include performance monitoring for new components
3. **Write Tests**: Add unit and integration tests for new features
4. **Update Documentation**: Update this documentation for any new features or changes
5. **Check Performance Budgets**: Ensure new components meet performance budgets

## Support

For support with authentication components:

1. Check this documentation first
2. Review the troubleshooting section
3. Check existing tests for usage examples
4. Create an issue with detailed reproduction steps