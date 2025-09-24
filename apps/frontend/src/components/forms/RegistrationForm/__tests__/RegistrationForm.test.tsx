import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegistrationForm } from '../RegistrationForm';
import { useRegister, useCheckStudentId, useCheckEmail } from '@/hooks/api/useUser';
import { useAuth } from '@/hooks/useAuth';

// Mock the hooks
jest.mock('@/hooks/api/useUser');
jest.mock('@/hooks/useAuth');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockUseRegister = useRegister as jest.MockedFunction<typeof useRegister>;
const mockUseCheckStudentId = useCheckStudentId as jest.MockedFunction<typeof useCheckStudentId>;
const mockUseCheckEmail = useCheckEmail as jest.MockedFunction<typeof useCheckEmail>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('RegistrationForm', () => {
  beforeEach(() => {
    mockUseRegister.mockReturnValue({
      mutate: jest.fn(),
      loading: false,
      error: null,
    });
    
    mockUseCheckStudentId.mockReturnValue({
      mutate: jest.fn(),
      loading: false,
    });
    
    mockUseCheckEmail.mockReturnValue({
      mutate: jest.fn(),
      loading: false,
    });
    
    mockUseAuth.mockReturnValue({
      setCredential: jest.fn(),
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });
  });

  it('renders the registration form with personal information step', () => {
    render(<RegistrationForm />);
    
    expect(screen.getByText('สมัครสมาชิก')).toBeInTheDocument();
    expect(screen.getByText('ข้อมูลส่วนตัว')).toBeInTheDocument();
    expect(screen.getByLabelText('ชื่อ')).toBeInTheDocument();
    expect(screen.getByLabelText('นามสกุล')).toBeInTheDocument();
    expect(screen.getByLabelText('รหัสนักศึกษา')).toBeInTheDocument();
    expect(screen.getByText('ถัดไป')).toBeInTheDocument();
  });

  it('validates required fields in personal information step', async () => {
    render(<RegistrationForm />);
    
    const nextButton = screen.getByText('ถัดไป');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('กรุณากรอกชื่อ')).toBeInTheDocument();
      expect(screen.getByText('กรุณากรอกนามสกุล')).toBeInTheDocument();
      expect(screen.getByText('กรุณากรอกรหัสนักศึกษา')).toBeInTheDocument();
    });
  });

  it('validates student ID format', async () => {
    render(<RegistrationForm />);
    
    const studentIdInput = screen.getByLabelText('รหัสนักศึกษา');
    fireEvent.change(studentIdInput, { target: { value: '123' } });
    fireEvent.blur(studentIdInput);
    
    await waitFor(() => {
      expect(screen.getByText('รหัสนักศึกษาต้องมีอย่างน้อย 8 หลัก')).toBeInTheDocument();
    });
  });

  it('moves to credentials step when personal information is valid', async () => {
    render(<RegistrationForm />);
    
    // Fill in personal information
    fireEvent.change(screen.getByLabelText('ชื่อ'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('นามสกุล'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('รหัสนักศึกษา'), { target: { value: '12345678' } });
    
    const nextButton = screen.getByText('ถัดไป');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('ข้อมูลการเข้าสู่ระบบ')).toBeInTheDocument();
      expect(screen.getByLabelText('อีเมล')).toBeInTheDocument();
      expect(screen.getByLabelText('รหัสผ่าน')).toBeInTheDocument();
      expect(screen.getByLabelText('ยืนยันรหัสผ่าน')).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    render(<RegistrationForm />);
    
    // Move to credentials step
    fireEvent.change(screen.getByLabelText('ชื่อ'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('นามสกุล'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('รหัสนักศึกษา'), { target: { value: '12345678' } });
    fireEvent.click(screen.getByText('ถัดไป'));
    
    await waitFor(() => {
      expect(screen.getByText('ข้อมูลการเข้าสู่ระบบ')).toBeInTheDocument();
    });
    
    // Test password mismatch
    const passwordInput = screen.getByLabelText('รหัสผ่าน');
    const confirmPasswordInput = screen.getByLabelText('ยืนยันรหัสผ่าน');
    
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });
    fireEvent.blur(confirmPasswordInput);
    
    await waitFor(() => {
      expect(screen.getByText('รหัสผ่านไม่ตรงกัน')).toBeInTheDocument();
    });
  });

  it('shows login link when showLoginLink is true', () => {
    render(<RegistrationForm showLoginLink={true} />);
    
    expect(screen.getByText('มีบัญชีอยู่แล้ว?')).toBeInTheDocument();
    expect(screen.getByText('เข้าสู่ระบบ')).toBeInTheDocument();
  });

  it('hides login link when showLoginLink is false', () => {
    render(<RegistrationForm showLoginLink={false} />);
    
    expect(screen.queryByText('มีบัญชีอยู่แล้ว?')).not.toBeInTheDocument();
  });
});