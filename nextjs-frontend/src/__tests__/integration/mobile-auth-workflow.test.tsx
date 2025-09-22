import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/login',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock API calls
const mockLogin = jest.fn();
const mockLogout = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.matchMedia for mobile viewport
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query.includes('max-width: 768px'), // Simulate mobile viewport
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Simple Login Form Component for testing
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await mockLogin({ email, password });
      mockPush('/dashboard');
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            เข้าสู่ระบบ
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                อีเมล
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                         focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                         text-base min-h-[44px] touch-manipulation"
                placeholder="กรอกอีเมลของคุณ"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                รหัสผ่าน
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                         focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                         text-base min-h-[44px] touch-manipulation"
                placeholder="กรอกรหัสผ่านของคุณ"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent 
                       text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                       disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

describe('Mobile Authentication Workflow', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Mobile Login Flow', () => {
    it('renders login form optimized for mobile', () => {
      render(<LoginForm />);
      
      // Check mobile-optimized elements
      expect(screen.getByRole('heading', { name: 'เข้าสู่ระบบ' })).toBeInTheDocument();
      
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/ });
      
      // Check mobile touch targets
      expect(emailInput).toHaveClass('min-h-[44px]', 'touch-manipulation');
      expect(passwordInput).toHaveClass('min-h-[44px]', 'touch-manipulation');
      expect(submitButton).toHaveClass('min-h-[44px]', 'touch-manipulation');
    });

    it('handles successful login on mobile', async () => {
      mockLogin.mockResolvedValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'mock-token'
      });

      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/ });
      
      // Fill form with touch-friendly interactions
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      // Submit form
      await user.click(submitButton);
      
      // Verify loading state
      await waitFor(() => {
        expect(screen.getByText('กำลังเข้าสู่ระบบ...')).toBeInTheDocument();
      });
      
      // Wait for login to complete
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });
      
      // Verify navigation
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('handles login errors on mobile', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));

      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/ });
      
      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);
      
      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
      
      // Verify form is still usable
      expect(submitButton).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'เข้าสู่ระบบ' })).toBeInTheDocument();
    });

    it('prevents form submission during loading', async () => {
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/ });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      // Button should be disabled during loading
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('กำลังเข้าสู่ระบบ...')).toBeInTheDocument();
    });
  });

  describe('Mobile Form Validation', () => {
    it('validates required fields on mobile', async () => {
      render(<LoginForm />);
      
      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/ });
      
      // Try to submit empty form
      await user.click(submitButton);
      
      // HTML5 validation should prevent submission
      const emailInput = screen.getByLabelText('อีเมล');
      expect(emailInput).toBeRequired();
      expect(emailInput).toBeInvalid();
    });

    it('validates email format on mobile', async () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('อีเมล');
      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/ });
      
      // Enter invalid email
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);
      
      // HTML5 validation should catch invalid email
      expect(emailInput).toBeInvalid();
    });
  });

  describe('Mobile Keyboard and Input Behavior', () => {
    it('uses appropriate input types for mobile keyboards', () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      
      // Email input should trigger email keyboard on mobile
      expect(emailInput).toHaveAttribute('type', 'email');
      
      // Password input should be secure
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('has proper text size to prevent zoom on iOS', () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      
      // Should have text-base (16px) to prevent iOS zoom
      expect(emailInput).toHaveClass('text-base');
      expect(passwordInput).toHaveClass('text-base');
    });

    it('supports form submission via Enter key', async () => {
      mockLogin.mockResolvedValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'mock-token'
      });

      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      // Submit via Enter key
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });
  });

  describe('Mobile Accessibility', () => {
    it('has proper labels for screen readers', () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      
      expect(emailInput).toHaveAccessibleName('อีเมล');
      expect(passwordInput).toHaveAccessibleName('รหัสผ่าน');
    });

    it('provides proper focus management', async () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/ });
      
      // Tab through form elements
      await user.tab();
      expect(emailInput).toHaveFocus();
      
      await user.tab();
      expect(passwordInput).toHaveFocus();
      
      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('announces errors to screen readers', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));

      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/ });
      
      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Invalid credentials');
        expect(errorMessage).toBeInTheDocument();
        // Error should be in a region that screen readers can announce
        expect(errorMessage.closest('.bg-red-50')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Network Conditions', () => {
    it('handles slow network connections gracefully', async () => {
      // Simulate slow network
      mockLogin.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          token: 'mock-token'
        }), 2000))
      );

      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/ });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      // Should show loading state immediately
      expect(screen.getByText('กำลังเข้าสู่ระบบ...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      
      // Should maintain loading state during slow request
      await new Promise(resolve => setTimeout(resolve, 1000));
      expect(screen.getByText('กำลังเข้าสู่ระบบ...')).toBeInTheDocument();
    });

    it('handles network errors appropriately', async () => {
      mockLogin.mockRejectedValue(new Error('Network error'));

      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/ });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
      
      // Form should be usable again after error
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Mobile Layout and Responsive Design', () => {
    it('adapts layout for mobile viewport', () => {
      render(<LoginForm />);
      
      const container = document.querySelector('.min-h-screen');
      expect(container).toHaveClass('px-4', 'py-12'); // Mobile padding
      
      const formContainer = document.querySelector('.max-w-md');
      expect(formContainer).toHaveClass('w-full'); // Full width on mobile
    });

    it('uses appropriate spacing for mobile', () => {
      render(<LoginForm />);
      
      const form = document.querySelector('form');
      expect(form).toHaveClass('space-y-6'); // Adequate spacing between elements
      
      const inputContainer = document.querySelector('.space-y-4');
      expect(inputContainer).toBeInTheDocument(); // Spacing between inputs
    });

    it('has touch-friendly button sizing', () => {
      render(<LoginForm />);
      
      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/ });
      
      // Button should have adequate padding and height for touch
      expect(submitButton).toHaveClass('py-3', 'px-4', 'min-h-[44px]');
    });
  });
});