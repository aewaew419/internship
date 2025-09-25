/**
 * Test Utilities
 * Custom render functions and test helpers
 */

import React, { ReactElement, ReactNode } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { theme } from '@/lib/theme'

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
}

// Test wrapper component
interface TestWrapperProps {
  children: ReactNode
}

const TestWrapper: React.FC<TestWrapperProps> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  )
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => {
  return render(ui, { wrapper: TestWrapper, ...options })
}

// Auth wrapper for testing authenticated components
interface AuthWrapperProps {
  children: ReactNode
  user?: {
    id: number
    email: string
    name: string
    role: string
  }
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ 
  children, 
  user = { id: 1, email: 'test@example.com', name: 'Test User', role: 'admin' }
}) => {
  // Mock auth context
  const mockAuthContext = {
    user,
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
  }

  return (
    <TestWrapper>
      {/* In real implementation, this would use actual AuthContext */}
      <div data-testid="auth-wrapper" data-user={JSON.stringify(user)}>
        {children}
      </div>
    </TestWrapper>
  )
}

// Render with auth context
const renderWithAuth = (
  ui: ReactElement,
  options?: {
    user?: AuthWrapperProps['user']
    renderOptions?: Omit<RenderOptions, 'wrapper'>
  }
): RenderResult => {
  const { user, renderOptions } = options || {}
  
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <AuthWrapper user={user}>{children}</AuthWrapper>
  )
  
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock API responses
export const mockApiResponse = <T>(data: T, delay = 0): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

export const mockApiError = (message: string, status = 500, delay = 0): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message)
      ;(error as any).status = status
      reject(error)
    }, delay)
  })
}

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockRole = (overrides = {}) => ({
  id: 1,
  name: 'test-role',
  displayName: 'Test Role',
  description: 'Test role description',
  permissions: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockAuditEvent = (overrides = {}) => ({
  id: 'event-1',
  userId: 1,
  userEmail: 'test@example.com',
  userName: 'Test User',
  action: 'create',
  entityType: 'user',
  entityId: 'user-1',
  oldValue: null,
  newValue: { name: 'Test' },
  changes: [
    {
      field: 'name',
      oldValue: null,
      newValue: 'Test',
      fieldType: 'string' as const,
    }
  ],
  timestamp: '2024-01-01T00:00:00Z',
  ipAddress: '127.0.0.1',
  userAgent: 'Test Agent',
  sessionId: 'session-1',
  severity: 'low' as const,
  category: 'data_modification' as const,
  metadata: {},
  success: true,
  ...overrides,
})

// Form testing utilities
export const fillForm = async (form: HTMLFormElement, data: Record<string, string>) => {
  const { fireEvent } = await import('@testing-library/react')
  
  Object.entries(data).forEach(([name, value]) => {
    const input = form.querySelector(`[name="${name}"]`) as HTMLInputElement
    if (input) {
      fireEvent.change(input, { target: { value } })
    }
  })
}

export const submitForm = async (form: HTMLFormElement) => {
  const { fireEvent } = await import('@testing-library/react')
  fireEvent.submit(form)
}

// Wait utilities
export const waitForLoadingToFinish = async () => {
  const { waitForElementToBeRemoved, screen } = await import('@testing-library/react')
  
  try {
    await waitForElementToBeRemoved(
      () => screen.queryByTestId('loading') || screen.queryByText(/loading/i),
      { timeout: 5000 }
    )
  } catch {
    // Loading element might not exist, which is fine
  }
}

// Snapshot testing utilities
export const createSnapshot = (component: ReactElement, name?: string) => {
  const { render } = require('@testing-library/react')
  const { container } = render(component, { wrapper: TestWrapper })
  expect(container.firstChild).toMatchSnapshot(name)
}

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    get length() {
      return Object.keys(store).length
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  }
}

// Mock sessionStorage
export const mockSessionStorage = mockLocalStorage

// Export everything
export * from '@testing-library/react'
export { customRender as render, renderWithAuth, mockRouter }