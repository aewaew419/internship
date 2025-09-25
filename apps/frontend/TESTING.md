# Frontend Testing Guide

## Overview

This document describes the comprehensive testing infrastructure for the frontend application, including unit tests, integration tests, and end-to-end tests.

## Testing Stack

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **MSW (Mock Service Worker)**: API mocking for integration tests
- **Puppeteer**: End-to-end testing (configured separately)
- **@testing-library/jest-dom**: Custom Jest matchers for DOM testing

## Test Types

### 1. Unit Tests
- **Location**: `src/__tests__/unit/` or `*.unit.test.(ts|tsx)`
- **Purpose**: Test individual components, hooks, and utilities in isolation
- **Command**: `npm run test:unit`
- **Coverage Threshold**: 85%

### 2. Integration Tests
- **Location**: `src/__tests__/integration/` or `*.integration.test.(ts|tsx)`
- **Purpose**: Test component interactions and API integration
- **Command**: `npm run test:integration`
- **Coverage Threshold**: 75%

### 3. End-to-End Tests
- **Location**: `src/__tests__/e2e/` or `*.e2e.test.(ts|tsx)`
- **Purpose**: Test complete user workflows
- **Command**: `npm run test:e2e` (to be configured)

## Configuration Files

### Jest Configurations
- `jest.config.enhanced.js` - Main configuration with comprehensive settings
- `jest.config.unit.js` - Optimized for fast unit testing
- `jest.config.integration.js` - Setup for integration testing
- `jest.setup.js` - Global test setup and mocks
- `jest.setup.integration.js` - Additional setup for integration tests

### Support Files
- `jest.global-setup.js` - Runs once before all tests
- `jest.global-teardown.js` - Runs once after all tests
- `jest.results-processor.js` - Custom test results formatting
- `__mocks__/fileMock.js` - Mock for static assets

## Test Utilities

### Custom Render Functions
```typescript
import { render, renderWithAuth } from '@/test-utils'

// Basic render with theme providers
render(<MyComponent />)

// Render with authentication context
renderWithAuth(<MyComponent />, { 
  user: { id: 1, name: 'Test User', role: 'admin' } 
})
```

### Mock Data Factories
```typescript
import { 
  createMockUser, 
  createMockRole, 
  createMockAuditEvent 
} from '@/test-utils'

const user = createMockUser({ name: 'Custom Name' })
const role = createMockRole({ permissions: ['read', 'write'] })
```

### API Mocking
```typescript
import { mockApiResponse, mockApiError } from '@/test-utils'

// Mock successful API response
const mockData = await mockApiResponse({ id: 1, name: 'Test' })

// Mock API error
await expect(mockApiError('Not found', 404)).rejects.toThrow('Not found')
```

## Writing Tests

### Unit Test Example
```typescript
// src/__tests__/unit/components/Button.unit.test.tsx
import { render, screen, fireEvent } from '@/test-utils'
import { Button } from '@/components/Button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('matches snapshot', () => {
    const { container } = render(<Button>Click me</Button>)
    expect(container.firstChild).toMatchSnapshot()
  })
})
```

### Integration Test Example
```typescript
// src/__tests__/integration/LoginForm.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@/test-utils'
import { LoginForm } from '@/components/LoginForm'

describe('LoginForm Integration', () => {
  it('submits form and handles successful login', async () => {
    render(<LoginForm />)
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument()
    })
  })
})
```

### Hook Testing Example
```typescript
// src/__tests__/unit/hooks/useAuth.unit.test.tsx
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'

describe('useAuth Hook', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.loading).toBe(false)
  })

  it('handles login correctly', async () => {
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })
    
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toBeTruthy()
  })
})
```

## Test Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI/CD
npm run test:ci

# Debug tests
npm run test:debug
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format for CI tools
- `coverage/coverage-final.json` - JSON format

### Coverage Thresholds
- **Global**: 80% (branches, functions, lines, statements)
- **Components**: 85%
- **Hooks**: 90%
- **Services**: 85%
- **Utils**: 85%

## Best Practices

### 1. Test Structure
- Use `describe` blocks to group related tests
- Use descriptive test names that explain the expected behavior
- Follow the Arrange-Act-Assert pattern

### 2. Mocking
- Mock external dependencies and APIs
- Use MSW for API mocking in integration tests
- Mock only what's necessary for the test

### 3. Assertions
- Use specific assertions (`toHaveTextContent` vs `toBeTruthy`)
- Test user-visible behavior, not implementation details
- Use `screen.getByRole` for better accessibility testing

### 4. Async Testing
- Use `waitFor` for async operations
- Use `findBy` queries for elements that appear asynchronously
- Set appropriate timeouts for slow operations

### 5. Cleanup
- Tests should be independent and not affect each other
- Use `afterEach` for cleanup when necessary
- Reset mocks between tests

## Debugging Tests

### Common Issues
1. **Tests timing out**: Increase timeout or check for unresolved promises
2. **Elements not found**: Use `screen.debug()` to see rendered output
3. **Async issues**: Ensure proper use of `waitFor` and `findBy`
4. **Mock issues**: Check mock setup and reset between tests

### Debug Commands
```bash
# Run specific test file
npm test -- LoginForm.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="login"

# Run with verbose output
npm test -- --verbose

# Debug with Node inspector
npm run test:debug
```

## CI/CD Integration

The testing infrastructure is configured for CI/CD with:
- Parallel test execution
- Coverage reporting
- Test result artifacts
- Performance monitoring

### GitHub Actions Example
```yaml
- name: Run Tests
  run: npm run test:ci
  
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

## Performance Considerations

- Unit tests should run in under 5 seconds
- Integration tests should run in under 15 seconds
- Use `maxWorkers` to control parallel execution
- Mock heavy dependencies to improve test speed

## Accessibility Testing

Include accessibility checks in your tests:
```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

it('should not have accessibility violations', async () => {
  const { container } = render(<MyComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Visual Regression Testing

For visual regression testing (to be implemented):
- Use tools like Chromatic or Percy
- Take screenshots of components in different states
- Compare against baseline images

## Maintenance

### Regular Tasks
- Update test dependencies monthly
- Review and update coverage thresholds quarterly
- Clean up obsolete tests when refactoring
- Monitor test performance and optimize slow tests

### Metrics to Track
- Test coverage percentage
- Test execution time
- Number of flaky tests
- Test maintenance overhead