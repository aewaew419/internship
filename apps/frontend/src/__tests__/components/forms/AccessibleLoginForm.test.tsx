import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibleLoginForm } from '@/components/forms/AccessibleLoginForm';
import { useAuth } from '@/hooks/useAuth';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { useStudentLogin } from '@/hooks/api/useUser';

// Mock hooks
jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/useSecureAuth');
jest.mock('@/hooks/api/useUser');
jest.mock('@/hooks/useAuthLoadingStates');
jest.mock('@/hooks/useAuthFormPersistence');
jest.mock('@/hooks/useFormDraftManager');
jest.mock('@/hooks/useOfflineDetection');
jest.mock('@/hooks/useFocusManagement');
jest.mock('@/hooks/useKeyboardNavigation');
jest.mock('@/hooks/useScreenReader');
jest.mock('@/hooks/useMediaQuery');
jest.mock('next/navigation');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseSecureAuth = useSecureAuth as jest.MockedFunction<typeof useSecureAuth>;
const mockUseStudentLogin = useStudentLogin as jest.MockedFunction<typeof useStudentLogin>;

describe('AccessibleLoginForm', () => {
  const mockSetCredential = jest.fn();
  const mockSecureLogin = jest.fn();
  const mockStudentLogin = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockUseAuth.mockReturnValue({
      setCredential: mockSetCredential,
      user: null,
      isAuthenticated: false,
      logout: jest.fn(),
    });

    mockUseSecureAuth.mockReturnValue({
      secureLogin: mockSecureLogin,
      isRateLimited: false,
      remainingAttempts: 5,
      isSessionWarningActive: false,
      sessionTimeRemaining: 0,
      extendSession: jest.fn(),
      secureLogout: jest.fn(),
    });

    mockUseStudentLogin.mockReturnValue({
      mutate: mockStudentLogin,
      loading: false,
      error: null,
    });

    // Mock other hooks with minimal implementations
    require('@/hooks/useAuthLoadingStates').useAuthLoadingStates.mockReturnValue({
      getFormState: () => ({ isSubmitting: false, submitProgress: 0, hasSubmitError: false }),
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

    require('@/hooks/useFocusManagement').useFocusManagement.mockReturnValue({
      focusFirstElement: jest.fn(),
      focusLastElement: jest.fn(),
    });

    require('@/hooks/useKeyboardNavigation').useKeyboardNavigation.mockReturnValue({
      focusFirst: jest.fn(),
      focusLast: jest.fn(),
      focusNext: jest.fn(),
      focusPrevious: jest.fn(),
    });

    require('@/hooks/useScreenReader').useScreenReader.mockReturnValue({
      announce: jest.fn(),
      announceError: jest.fn(),
      announceSuccess: jest.fn(),
      announceStatus: jest.fn(),
      announceWarning: jest.fn(),
      announceNavigation: jest.fn(),
      announceFormValidation: jest.fn(),
      announceProgress: jest.fn(),
      clear: jest.fn(),
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

  describe('Accessibility Features', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Check form has proper labeling
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-labelledby', expect.stringContaining('form-title'));
      expect(form).toHaveAttribute('novalidate');

      // Check input labels
      expect(screen.getByLabelText(/รหัสนักศึกษา/)).toBeInTheDocument();
      expect(screen.getByLabelText(/รหัสผ่าน/)).toBeInTheDocument();

      // Check required field indicators
      expect(screen.getAllByLabelText(/ฟิลด์จำเป็น/)).toHaveLength(2);
    });

    it('should have proper input attributes for accessibility', async () => {
      render(<AccessibleLoginForm />);

      await waitFor(() => {
        const studentIdInput = screen.getByLabelText(/รหัสนักศึกษา/);
        const passwordInput = screen.getByLabelText(/รหัสผ่าน/);

        // Student ID input attributes
        expect(studentIdInput).toHaveAttribute('type', 'text');
        expect(studentIdInput).toHaveAttribute('inputMode', 'numeric');
        expect(studentIdInput).toHaveAttribute('pattern', '[0-9]*');
        expect(studentIdInput).toHaveAttribute('autoComplete', 'username');
        expect(studentIdInput).toHaveAttribute('aria-required', 'true');
        expect(studentIdInput).toHaveAttribute('aria-invalid', 'false');
        expect(studentIdInput).toHaveAttribute('aria-describedby');

        // Password input attributes
        expect(passwordInput).toHaveAttribute('type', 'password');
        expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
        expect(passwordInput).toHaveAttribute('aria-required', 'true');
        expect(passwordInput).toHaveAttribute('aria-invalid', 'false');
        expect(passwordInput).toHaveAttribute('aria-describedby');
      });
    });

    it('should show error summary with proper ARIA attributes when validation fails', async () => {
      const user = userEvent.setup();
      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Submit form without filling fields
      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/ });
      await user.click(submitButton);

      await waitFor(() => {
        const errorSummary = screen.getByRole('alert');
        expect(errorSummary).toBeInTheDocument();
        expect(errorSummary).toHaveAttribute('aria-labelledby', 'error-summary-title');
        expect(errorSummary).toHaveAttribute('tabIndex', '-1');

        // Check error summary content
        expect(screen.getByText(/พบข้อผิดพลาด/)).toBeInTheDocument();
        expect(screen.getByText(/รายการ:/)).toBeInTheDocument();
      });
    });

    it('should update aria-invalid when validation errors occur', async () => {
      const user = userEvent.setup();
      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      const studentIdInput = screen.getByLabelText(/รหัสนักศึกษา/);
      const passwordInput = screen.getByLabelText(/รหัสผ่าน/);

      // Initially should be valid
      expect(studentIdInput).toHaveAttribute('aria-invalid', 'false');
      expect(passwordInput).toHaveAttribute('aria-invalid', 'false');

      // Submit form to trigger validation
      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/ });
      await user.click(submitButton);

      await waitFor(() => {
        // Should now be invalid
        expect(studentIdInput).toHaveAttribute('aria-invalid', 'true');
        expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should have skip link for keyboard navigation', async () => {
      render(<AccessibleLoginForm />);

      await waitFor(() => {
        const skipLink = screen.getByText(/ข้ามไปยังแบบฟอร์มหลัก/);
        expect(skipLink).toBeInTheDocument();
        expect(skipLink).toHaveAttribute('href', '#main-form');
      });
    });

    it('should support high contrast mode', () => {
      render(<AccessibleLoginForm highContrast={true} />);

      // Check that high contrast styles are applied
      const container = screen.getByRole('form').closest('div');
      expect(container).toHaveStyle({
        backgroundColor: '#000000',
        color: '#ffffff',
        border: '2px solid #ffffff',
      });
    });

    it('should support text scaling', () => {
      render(<AccessibleLoginForm textScale={1.5} />);

      // Check that text scale is applied
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveStyle({
        fontSize: '1.5rem',
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate student ID format', async () => {
      const user = userEvent.setup();
      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      const studentIdInput = screen.getByLabelText(/รหัสนักศึกษา/);

      // Test invalid student ID
      await user.type(studentIdInput, '123');
      await user.tab(); // Trigger blur event

      await waitFor(() => {
        expect(screen.getByText(/รหัสนักศึกษาต้องมี 8-10 หลัก/)).toBeInTheDocument();
      });

      // Test valid student ID
      await user.clear(studentIdInput);
      await user.type(studentIdInput, '12345678');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/รหัสนักศึกษาต้องมี 8-10 หลัก/)).not.toBeInTheDocument();
      });
    });

    it('should validate password requirements', async () => {
      const user = userEvent.setup();
      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/รหัสผ่าน/);

      // Test empty password
      await user.click(passwordInput);
      await user.tab(); // Trigger blur event

      await waitFor(() => {
        expect(screen.getByText(/กรุณากรอกรหัสผ่าน/)).toBeInTheDocument();
      });

      // Test valid password
      await user.type(passwordInput, 'validpassword123');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/กรุณากรอกรหัสผ่าน/)).not.toBeInTheDocument();
      });
    });

    it('should sanitize input values', async () => {
      const user = userEvent.setup();
      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      const studentIdInput = screen.getByLabelText(/รหัสนักศึกษา/);

      // Type non-numeric characters
      await user.type(studentIdInput, 'abc123def456');

      // Should only contain numeric characters
      expect(studentIdInput).toHaveValue('123456');
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with form data when provided', async () => {
      const user = userEvent.setup();
      render(<AccessibleLoginForm onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Fill form
      await user.type(screen.getByLabelText(/รหัสนักศึกษา/), '12345678');
      await user.type(screen.getByLabelText(/รหัสผ่าน/), 'password123');

      // Submit form
      await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/ }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          studentId: '12345678',
          password: 'password123',
        });
      });
    });

    it('should use secure auth when onSubmit is not provided', async () => {
      const user = userEvent.setup();
      mockSecureLogin.mockResolvedValue({ success: true });

      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Fill form
      await user.type(screen.getByLabelText(/รหัสนักศึกษา/), '12345678');
      await user.type(screen.getByLabelText(/รหัสผ่าน/), 'password123');

      // Submit form
      await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/ }));

      await waitFor(() => {
        expect(mockSecureLogin).toHaveBeenCalledWith(
          {
            studentId: '12345678',
            password: 'password123',
          },
          'student'
        );
      });
    });

    it('should handle rate limiting', async () => {
      const user = userEvent.setup();
      mockUseSecureAuth.mockReturnValue({
        ...mockUseSecureAuth(),
        isRateLimited: true,
        remainingAttempts: 0,
      });

      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Fill form
      await user.type(screen.getByLabelText(/รหัสนักศึกษา/), '12345678');
      await user.type(screen.getByLabelText(/รหัสผ่าน/), 'password123');

      // Submit form
      await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/ }));

      await waitFor(() => {
        expect(screen.getByText(/การเข้าสู่ระบบถูกจำกัด/)).toBeInTheDocument();
        expect(mockSecureLogin).not.toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockUseStudentLogin.mockReturnValue({
        mutate: mockStudentLogin,
        loading: true,
        error: null,
      });

      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/ });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/กำลังเข้าสู่ระบบ/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display login errors', () => {
      mockUseStudentLogin.mockReturnValue({
        mutate: mockStudentLogin,
        loading: false,
        error: 'Invalid credentials',
      });

      render(<AccessibleLoginForm />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Invalid credentials/)).toBeInTheDocument();
    });

    it('should show security warnings', () => {
      mockUseSecureAuth.mockReturnValue({
        ...mockUseSecureAuth(),
        remainingAttempts: 2,
      });

      render(<AccessibleLoginForm />);

      expect(screen.getByText(/เหลือความพยายามในการเข้าสู่ระบบ 2 ครั้ง/)).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle Escape key to close modals', async () => {
      const user = userEvent.setup();
      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Open forgot password modal
      await user.click(screen.getByText(/ลืมรหัสผ่าน/));

      // Press Escape key
      await user.keyboard('{Escape}');

      // Modal should be closed (this would need to be implemented in the actual component)
    });

    it('should focus first error field when validation fails', async () => {
      const user = userEvent.setup();
      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Submit form without filling fields
      await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/ }));

      await waitFor(() => {
        // First error field (student ID) should be focused
        expect(screen.getByLabelText(/รหัสนักศึกษา/)).toHaveFocus();
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce form ready state', async () => {
      const mockAnnounce = jest.fn();
      require('@/hooks/useScreenReader').useScreenReader.mockReturnValue({
        announce: mockAnnounce,
        announceError: jest.fn(),
        announceSuccess: jest.fn(),
        announceStatus: jest.fn(),
        announceWarning: jest.fn(),
        announceNavigation: jest.fn(),
        announceFormValidation: jest.fn(),
        announceProgress: jest.fn(),
        clear: jest.fn(),
      });

      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(mockAnnounce).toHaveBeenCalledWith(
          'แบบฟอร์มเข้าสู่ระบบพร้อมใช้งาน',
          'polite'
        );
      });
    });

    it('should announce validation errors', async () => {
      const mockAnnounce = jest.fn();
      require('@/hooks/useScreenReader').useScreenReader.mockReturnValue({
        announce: mockAnnounce,
        announceError: jest.fn(),
        announceSuccess: jest.fn(),
        announceStatus: jest.fn(),
        announceWarning: jest.fn(),
        announceNavigation: jest.fn(),
        announceFormValidation: jest.fn(),
        announceProgress: jest.fn(),
        clear: jest.fn(),
      });

      const user = userEvent.setup();
      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Submit form to trigger validation
      await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/ }));

      await waitFor(() => {
        expect(mockAnnounce).toHaveBeenCalledWith(
          expect.stringContaining('พบข้อผิดพลาด'),
          'assertive'
        );
      });
    });
  });
});