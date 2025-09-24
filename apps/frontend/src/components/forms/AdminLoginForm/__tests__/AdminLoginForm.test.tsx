import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { AdminLoginForm } from '../AdminLoginForm';
import { useAuth } from '@/hooks/useAuth';
import { useAdminLogin } from '@/hooks/api/useUser';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/api/useUser');
jest.mock('@/lib/utils', () => ({
  validateEmail: jest.fn(),
  validatePassword: jest.fn(),
  debounce: jest.fn((fn) => fn),
}));
jest.mock('@/lib/validation-messages', () => ({
  mapApiErrorToMessage: jest.fn((error) => error),
  VALIDATION_MESSAGES: {
    LOADING: {
      SIGNING_IN: 'กำลังเข้าสู่ระบบ...',
    },
  },
}));

const mockRouter = {
  push: jest.fn(),
};

const mockAuth = {
  setCredential: jest.fn(),
};

const mockAdminLogin = {
  mutate: jest.fn(),
  loading: false,
  error: null,
};

describe('AdminLoginForm', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue(mockAuth);
    (useAdminLogin as jest.Mock).mockReturnValue(mockAdminLogin);
    
    // Mock validation functions
    const { validateEmail, validatePassword } = require('@/lib/utils');
    validateEmail.mockReturnValue({ isValid: true });
    validatePassword.mockReturnValue({ isValid: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders admin login form with correct branding', () => {
    render(<AdminLoginForm />);
    
    expect(screen.getByText('เข้าสู่ระบบผู้ดูแลระบบ')).toBeInTheDocument();
    expect(screen.getByText('ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน - Admin Panel')).toBeInTheDocument();
    expect(screen.getByLabelText('อีเมล')).toBeInTheDocument();
    expect(screen.getByLabelText('รหัสผ่าน')).toBeInTheDocument();
  });

  it('shows admin-specific styling and branding', () => {
    render(<AdminLoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบผู้ดูแล/i });
    expect(submitButton).toHaveClass('from-red-600', 'to-red-700');
  });

  it('validates email format', async () => {
    const { validateEmail } = require('@/lib/utils');
    validateEmail.mockReturnValue({ isValid: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    
    render(<AdminLoginForm />);
    
    const emailInput = screen.getByLabelText('อีเมล');
    const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบผู้ดูแล/i });
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(validateEmail).toHaveBeenCalledWith('invalid-email');
    });
  });

  it('submits form with admin login API', async () => {
    const mockUserData = {
      user: { id: 1, email: 'admin@test.com', roleId: 1 },
      roles: { list: ['admin'] },
      access_token: 'admin-token',
    };
    
    mockAdminLogin.mutate.mockResolvedValue(mockUserData);
    
    render(<AdminLoginForm />);
    
    const emailInput = screen.getByLabelText('อีเมล');
    const passwordInput = screen.getByLabelText('รหัสผ่าน');
    const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบผู้ดูแล/i });
    
    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockAdminLogin.mutate).toHaveBeenCalledWith({
        email: 'admin@test.com',
        password: 'password123',
      });
    });
  });

  it('redirects to admin dashboard on successful login', async () => {
    const mockUserData = {
      user: { id: 1, email: 'admin@test.com', roleId: 1 },
      roles: { list: ['admin'] },
      access_token: 'admin-token',
    };
    
    mockAdminLogin.mutate.mockResolvedValue(mockUserData);
    
    render(<AdminLoginForm />);
    
    const emailInput = screen.getByLabelText('อีเมล');
    const passwordInput = screen.getByLabelText('รหัสผ่าน');
    const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบผู้ดูแล/i });
    
    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockAuth.setCredential).toHaveBeenCalledWith(mockUserData);
      expect(mockRouter.push).toHaveBeenCalledWith('/admin');
    });
  });

  it('handles non-admin user access denial', async () => {
    const mockUserData = {
      user: { id: 1, email: 'student@test.com', roleId: 2 },
      roles: { list: ['student'] },
      access_token: 'student-token',
    };
    
    mockAdminLogin.mutate.mockResolvedValue(mockUserData);
    
    render(<AdminLoginForm />);
    
    const emailInput = screen.getByLabelText('อีเมล');
    const passwordInput = screen.getByLabelText('รหัสผ่าน');
    const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบผู้ดูแล/i });
    
    fireEvent.change(emailInput, { target: { value: 'student@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login?error=admin_access_denied');
    });
  });

  it('shows loading state during submission', () => {
    mockAdminLogin.loading = true;
    
    render(<AdminLoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /กำลังเข้าสู่ระบบ/i });
    expect(submitButton).toBeDisabled();
  });

  it('displays API error messages', () => {
    mockAdminLogin.error = 'Invalid credentials';
    
    render(<AdminLoginForm />);
    
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('provides link back to student login', () => {
    render(<AdminLoginForm />);
    
    const studentLoginLink = screen.getByText('เข้าสู่ระบบนักศึกษา');
    fireEvent.click(studentLoginLink);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('opens forgot password modal', () => {
    render(<AdminLoginForm />);
    
    const forgotPasswordLink = screen.getByText('ลืมรหัสผ่าน?');
    fireEvent.click(forgotPasswordLink);
    
    expect(screen.getByText('ลืมรหัสผ่าน - ผู้ดูแลระบบ')).toBeInTheDocument();
  });
});