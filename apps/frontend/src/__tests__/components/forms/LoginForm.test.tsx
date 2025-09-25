import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/forms/LoginForm';

// Mock all the hooks and dependencies
jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/useSecureAuth');
jest.mock('@/hooks/api/useUser');
jest.mock('@/hooks/useAuthLoadingStates');
jest.mock('@/hooks/useAuthFormPersistence');
jest.mock('@/hooks/useFormDraftManager');
jest.mock('@/hooks/useOfflineDetection');
jest.mock('@/hooks/useMediaQuery');
jest.mock('next/navigation');

describe('LoginForm', () => {
  const mockSetCredential = jest.fn();
  const mockSecureLogin = jest.fn();
  const mockStudentLogin = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    require('@/hooks/useAuth').useAuth.mockReturnValue({
      setCredential: mockSetCredential,
      user: null,
      isAuthenticated: false,
      logout: jest.fn(),
    });

    require('@/hooks/useSecureAuth').useSecureAuth.mockReturnValue({
      secureLogin: mockSecureLogin,
      isRateLimited: false,
      remainingAttempts: 5,
      isSessionWarningActive: false,
      sessionTimeRemaining: 0,
      extendSession: jest.fn(),
      secureLogout: jest.fn(),
    });

    require('@/hooks/api/useUser').useStudentLogin.mockReturnValue({
      mutate: mockStudentLogin,
      loading: false,
      error: null,
    });

    require('@/hooks/useAuthLoadingStates').useAuthLoadingStates.mockReturnValue({
      getFormState: () => ({ 
        isSubmitting: false, 
        submitProgress: 0, 
        hasSubmitError: false,
        submitErrorMessage: null 
      }),
      getFieldState: () => ({ isValidating: false, hasError: false }),
      isAnyFieldValidating: false,
      validateFieldWithTimeout: jest.fn(),
      submitFormWithProgress: jest.fn(),
    });

    require('@/hooks/useAuthFormPersistence').useAuthFormPersistence.mockReturnValue({
      persistedData: null,
      showRestorationPrompt: false,
      saveFormData: jest.fn(),
      clearPersistedData: jest.fn(),
      acceptRestoration: jest.fn(),
      rejectRestoration: jest.fn(),
    });

    require('@/hooks/useFormDraftManager').useFormDraftManager.mockReturnValue({
      showDraftNotification: false,
      isAutoSaving: false,
      draftAge: 0,
      loadDraft: jest.fn(),
      clearDraft: jest.fn(),
      acceptDraft: jest.fn(),
      rejectDraft: jest.fn(),
    });

    require('@/hooks/useOfflineDetection').useOfflineDetection.mockReturnValue({
      isOffline: false,
    });

    require('@/hooks/useMediaQuery').useMediaQuery.mockReturnValue(false);

    require('next/navigation').useRouter.mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    });

    require('next/navigation').useSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    });
  });

  describe('Form Rendering', () => {
    it('should render login form with all required fields', async () => {
      render(<LoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Check for form elements
      expect(screen.getByLabelText(/รหัสนักศึกษา/)).toBeInTheDocument();
      expect(screen.getByLabelText(/รหัสผ่าน/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /เข้าสู่ระบบ/ })).toBeInTheDocument();
      expect(screen.getByText(/ลืมรหัสผ่าน/)).toBeInTheDocument();
    });

    it('should show loading skeleton initially', () => {
      render(<LoginForm />);
      
      // Should show skeleton loading initially
      expect(screen.getByTestId('form-skeleton')).toBeInTheDocument();
    });

    it('should render logo and title', async () => {
      render(<LoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('img', { name: /Logo/ })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /เข้าสู่ระบบ/ })).toBeInTheDocument();
        expect(screen.getByText(/ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน/)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate student ID format on blur', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      const studentIdInput = screen.getByLabelText(/รหัสนักศึกษา/);

      // Enter invalid student ID
      await user.type(studentIdInput, '123');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/รหัสนักศึกษาต้องมี 8-10 หลัก/)).toBeInTheDocument();
      });
    });

    it('should validate password on blur', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/รหัสผ่าน/);

      // Focus and blur without entering password
      await user.click(passwordInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/กรุณากรอกรหัสผ่าน/)).toBeInTheDocument();
      });
    });

    it('should clear validation errors when user starts typing', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      const studentIdInput = screen.getByLabelText(/รหัสนักศึกษา/);

      // Trigger validation error
      await user.type(studentIdInput, '123');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/รหัสนักศึกษาต้องมี 8-10 หลัก/)).toBeInTheDocument();
      });

      // Start typing again - error should clear
      await user.type(studentIdInput, '4');

      await waitFor(() => {
        expect(screen.queryByText(/รหัสนักศึกษาต้องมี 8-10 หลัก/)).not.toBeInTheDocument();
      });
    });

    it('should sanitize student ID input to only allow numbers', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      const studentIdInput = screen.getByLabelText(/รหัสนักศึกษา/);

      // Type mixed characters
      await user.type(studentIdInput, 'abc123def456ghi');

      // Should only contain numbers
      expect(studentIdInput).toHaveValue('123456');
    });
  });

  describe('Form Submission', () => {
    it('should prevent submission with invalid data', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Submit without filling fields
      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/ });
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/รหัสนักศึกษาต้องมี 8-10 หลัก/)).toBeInTheDocument();
        expect(screen.getByText(/กรุณากรอกรหัสผ่าน/)).toBeInTheDocument();
      });

      // Should not call login functions
      expect(mockSecureLogin).not.toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should submit with valid data', async () => {
      const user = userEvent.setup();
      mockSecureLogin.mockResolvedValue({ success: true });

      render(<LoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Fill form with valid data
      await user.type(screen.getByLabelText(/รหัสนักศึกษา/), '12345678');
      await user.type(screen.getByLabelText(/รหัสผ่าน/), 'validpassword');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSecureLogin).toHaveBeenCalledWith(
          {
            studentId: '12345678',
            password: 'validpassword',
          },
          'student'
        );
      });
    });

    it('should call custom onSubmit when provided', async () => {
      const user = userEvent.setup();
      render(<LoginForm onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Fill form with valid data
      await user.type(screen.getByLabelText(/รหัสนักศึกษา/), '12345678');
      await user.type(screen.getByLabelText(/รหัสผ่าน/), 'validpassword');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          studentId: '12345678',
          password: 'validpassword',
        });
      });
    });
  });

  describe('Security Features', () => {
    it('should show rate limiting message', () => {
      require('@/hooks/useSecureAuth').useSecureAuth.mockReturnValue({
        secureLogin: mockSecureLogin,
        isRateLimited: true,
        remainingAttempts: 0,
        isSessionWarningActive: false,
        sessionTimeRemaining: 0,
        extendSession: jest.fn(),
        secureLogout: jest.fn(),
      });

      render(<LoginForm />);

      expect(screen.getByText(/การเข้าสู่ระบบถูกจำกัดชั่วคราว เพื่อความปลอดภัย/)).toBeInTheDocument();
    });

    it('should show remaining attempts warning', () => {
      require('@/hooks/useSecureAuth').useSecureAuth.mockReturnValue({
        secureLogin: mockSecureLogin,
        isRateLimited: false,
        remainingAttempts: 2,
        isSessionWarningActive: false,
        sessionTimeRemaining: 0,
        extendSession: jest.fn(),
        secureLogout: jest.fn(),
      });

      render(<LoginForm />);

      expect(screen.getByText(/เหลือความพยายามในการเข้าสู่ระบบ 2 ครั้ง/)).toBeInTheDocument();
    });

    it('should prevent submission when rate limited', async () => {
      const user = userEvent.setup();
      require('@/hooks/useSecureAuth').useSecureAuth.mockReturnValue({
        secureLogin: mockSecureLogin,
        isRateLimited: true,
        remainingAttempts: 0,
        isSessionWarningActive: false,
        sessionTimeRemaining: 0,
        extendSession: jest.fn(),
        secureLogout: jest.fn(),
      });

      render(<LoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Fill form with valid data
      await user.type(screen.getByLabelText(/รหัสนักศึกษา/), '12345678');
      await user.type(screen.getByLabelText(/รหัสผ่าน/), 'validpassword');

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/ });
      await user.click(submitButton);

      // Should not call login
      expect(mockSecureLogin).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during submission', () => {
      require('@/hooks/useAuthLoadingStates').useAuthLoadingStates.mockReturnValue({
        getFormState: () => ({ 
          isSubmitting: true, 
          submitProgress: 50, 
          hasSubmitError: false,
          submitErrorMessage: null 
        }),
        getFieldState: () => ({ isValidating: false, hasError: false }),
        isAnyFieldValidating: false,
        validateFieldWithTimeout: jest.fn(),
        submitFormWithProgress: jest.fn(),
      });

      render(<LoginForm />);

      expect(screen.getByText(/กำลังเข้าสู่ระบบ/)).toBeInTheDocument();
    });

    it('should show field validation loading', () => {
      require('@/hooks/useAuthLoadingStates').useAuthLoadingStates.mockReturnValue({
        getFormState: () => ({ 
          isSubmitting: false, 
          submitProgress: 0, 
          hasSubmitError: false,
          submitErrorMessage: null 
        }),
        getFieldState: () => ({ isValidating: true, hasError: false }),
        isAnyFieldValidating: true,
        validateFieldWithTimeout: jest.fn(),
        submitFormWithProgress: jest.fn(),
      });

      render(<LoginForm />);

      expect(screen.getByText(/กำลังตรวจสอบรหัสนักศึกษา/)).toBeInTheDocument();
    });
  });

  describe('Offline Support', () => {
    it('should show offline indicator', () => {
      require('@/hooks/useOfflineDetection').useOfflineDetection.mockReturnValue({
        isOffline: true,
      });

      render(<LoginForm />);

      expect(screen.getByText(/ออฟไลน์ - ข้อมูลจะถูกบันทึกไว้/)).toBeInTheDocument();
    });

    it('should show auto-saving indicator', () => {
      require('@/hooks/useFormDraftManager').useFormDraftManager.mockReturnValue({
        showDraftNotification: false,
        isAutoSaving: true,
        draftAge: 0,
        loadDraft: jest.fn(),
        clearDraft: jest.fn(),
        acceptDraft: jest.fn(),
        rejectDraft: jest.fn(),
      });

      render(<LoginForm />);

      expect(screen.getByText(/กำลังบันทึกข้อมูล/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display login errors', () => {
      require('@/hooks/api/useUser').useStudentLogin.mockReturnValue({
        mutate: mockStudentLogin,
        loading: false,
        error: 'Invalid credentials',
      });

      render(<LoginForm />);

      expect(screen.getByText(/Invalid credentials/)).toBeInTheDocument();
    });

    it('should handle submission errors', () => {
      require('@/hooks/useAuthLoadingStates').useAuthLoadingStates.mockReturnValue({
        getFormState: () => ({ 
          isSubmitting: false, 
          submitProgress: 0, 
          hasSubmitError: true,
          submitErrorMessage: 'Network error' 
        }),
        getFieldState: () => ({ isValidating: false, hasError: false }),
        isAnyFieldValidating: false,
        validateFieldWithTimeout: jest.fn(),
        submitFormWithProgress: jest.fn(),
      });

      render(<LoginForm />);

      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', () => {
      require('@/hooks/useMediaQuery').useMediaQuery.mockReturnValue(true);

      render(<LoginForm />);

      // Check for mobile-specific classes or styles
      const form = screen.getByRole('form');
      expect(form).toHaveClass('space-y-5'); // Mobile spacing
    });

    it('should use desktop layout by default', () => {
      require('@/hooks/useMediaQuery').useMediaQuery.mockReturnValue(false);

      render(<LoginForm />);

      const form = screen.getByRole('form');
      expect(form).toHaveClass('space-y-4'); // Desktop spacing
    });
  });

  describe('Form Persistence', () => {
    it('should show restoration prompt when data is available', () => {
      require('@/hooks/useAuthFormPersistence').useAuthFormPersistence.mockReturnValue({
        persistedData: { studentId: '12345678', password: '' },
        showRestorationPrompt: true,
        saveFormData: jest.fn(),
        clearPersistedData: jest.fn(),
        acceptRestoration: jest.fn(),
        rejectRestoration: jest.fn(),
      });

      render(<LoginForm />);

      expect(screen.getByText(/กู้คืนข้อมูลฟอร์ม/)).toBeInTheDocument();
    });

    it('should show draft notification', () => {
      require('@/hooks/useFormDraftManager').useFormDraftManager.mockReturnValue({
        showDraftNotification: true,
        isAutoSaving: false,
        draftAge: 300000, // 5 minutes
        loadDraft: jest.fn(),
        clearDraft: jest.fn(),
        acceptDraft: jest.fn(),
        rejectDraft: jest.fn(),
      });

      render(<LoginForm />);

      expect(screen.getByText(/พบข้อมูลร่างที่บันทึกไว้/)).toBeInTheDocument();
    });
  });
});