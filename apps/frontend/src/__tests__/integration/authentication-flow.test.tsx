import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibleLoginForm } from '@/components/forms/AccessibleLoginForm';
import { LoginForm } from '@/components/forms/LoginForm';

// Mock all dependencies
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

describe('Authentication Flow Integration Tests', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };

  const mockSearchParams = {
    get: jest.fn(),
  };

  const mockSecureAuth = {
    secureLogin: jest.fn(),
    isRateLimited: false,
    remainingAttempts: 5,
    isSessionWarningActive: false,
    sessionTimeRemaining: 0,
    extendSession: jest.fn(),
    secureLogout: jest.fn(),
  };

  const mockAuth = {
    setCredential: jest.fn(),
    user: null,
    isAuthenticated: false,
    logout: jest.fn(),
  };

  const mockStudentLogin = {
    mutate: jest.fn(),
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    require('next/navigation').useRouter.mockReturnValue(mockRouter);
    require('next/navigation').useSearchParams.mockReturnValue(mockSearchParams);
    require('@/hooks/useAuth').useAuth.mockReturnValue(mockAuth);
    require('@/hooks/useSecureAuth').useSecureAuth.mockReturnValue(mockSecureAuth);
    require('@/hooks/api/useUser').useStudentLogin.mockReturnValue(mockStudentLogin);
    require('@/hooks/useMediaQuery').useMediaQuery.mockReturnValue(false);

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
  });

  describe('Complete Authentication Flow', () => {
    it('should complete successful login flow with AccessibleLoginForm', async () => {
      const user = userEvent.setup();
      mockSecureAuth.secureLogin.mockResolvedValue({ success: true });

      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Fill in credentials
      await user.type(screen.getByLabelText(/รหัสนักศึกษา/), '12345678');
      await user.type(screen.getByLabelText(/รหัสผ่าน/), 'validpassword');

      // Submit form
      await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/ }));

      await waitFor(() => {
        expect(mockSecureAuth.secureLogin).toHaveBeenCalledWith(
          {
            studentId: '12345678',
            password: 'validpassword',
          },
          'student'
        );
      });

      // Should redirect to dashboard
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/');
      });
    });

    it('should complete successful login flow with regular LoginForm', async () => {
      const user = userEvent.setup();
      mockSecureAuth.secureLogin.mockResolvedValue({ success: true });

      render(<LoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Fill in credentials
      await user.type(screen.getByLabelText(/รหัสนักศึกษา/), '87654321');
      await user.type(screen.getByLabelText(/รหัสผ่าน/), 'anotherpassword');

      // Submit form
      await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/ }));

      await waitFor(() => {
        expect(mockSecureAuth.secureLogin).toHaveBeenCalledWith(
          {
            studentId: '87654321',
            password: 'anotherpassword',
          },
          'student'
        );
      });
    });

    it('should handle redirect parameter correctly', async () => {
      const user = userEvent.setup();
      mockSecureAuth.secureLogin.mockResolvedValue({ success: true });
      mockSearchParams.get.mockReturnValue('/dashboard');

      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Fill and submit form
      await user.type(screen.getByLabelText(/รหัสนักศึกษา/), '12345678');
      await user.type(screen.getByLabelText(/รหัสผ่าน/), 'validpassword');
      await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/ }));

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Error Handling Flow', () => {
    it('should handle authentication errors gracefully', async () => {
      const user = userEvent.setup();
      mockSecureAuth.secureLogin.mockResolvedValue({ 
        success: false, 
        error: 'Invalid credentials' 
      });

      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Fill and submit form
      await user.type(screen.getByLabelText(/รหัสนักศึกษา/), '12345678');
      await user.type(screen.getByLabelText(/รหัสผ่าน/), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/ }));

      // Should not redirect on error
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      mockSecureAuth.secureLogin.mockRejectedValue(new Error('Network error'));

      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Fill and submit form
      await user.type(screen.getByLabelText(/รหัสนักศึกษา/), '12345678');
      await user.type(screen.getByLabelText(/รหัสผ่าน/), 'validpassword');
      await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/ }));

      // Should not redirect on error
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('Rate Limiting Flow', () => {
    it('should prevent submission when rate limited', async () => {
      const user = userEvent.setup();
      mockSecureAuth.isRateLimited = true;
      mockSecureAuth.remainingAttempts = 0;

      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Should show rate limiting message
      expect(screen.getByText(/การเข้าสู่ระบบถูกจำกัดชั่วคราว/)).toBeInTheDocument();

      // Fill and try to submit form
      await user.type(screen.getByLabelText(/รหัสนักศึกษา/), '12345678');
      await user.type(screen.getByLabelText(/รหัสผ่าน/), 'validpassword');
      await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/ }));

      // Should not call login when rate limited
      expect(mockSecureAuth.secureLogin).not.toHaveBeenCalled();
    });

    it('should show remaining attempts warning', async () => {
      mockSecureAuth.remainingAttempts = 2;

      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByText(/เหลือความพยายามในการเข้าสู่ระบบ 2 ครั้ง/)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation Flow', () => {
    it('should validate all fields before submission', async () => {
      const user = userEvent.setup();

      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Submit without filling fields
      await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/ }));

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/รหัสนักศึกษาต้องมี 8-10 หลัก/)).toBeInTheDocument();
        expect(screen.getByText(/กรุณากรอกรหัสผ่าน/)).toBeInTheDocument();
      });

      // Should not call login with invalid data
      expect(mockSecureAuth.secureLogin).not.toHaveBeenCalled();
    });

    it('should validate individual fields on blur', async () => {
      const user = userEvent.setup();

      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      const studentIdInput = screen.getByLabelText(/รหัสนักศึกษา/);

      // Enter invalid student ID and blur
      await user.type(studentIdInput, '123');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/รหัสนักศึกษาต้องมี 8-10 หลัก/)).toBeInTheDocument();
      });
    });

    it('should clear validation errors when user corrects input', async () => {
      const user = userEvent.setup();

      render(<AccessibleLoginForm />);

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

      // Correct the input
      await user.clear(studentIdInput);
      await user.type(studentIdInput, '12345678');

      await waitFor(() => {
        expect(screen.queryByText(/รหัสนักศึกษาต้องมี 8-10 หลัก/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Flow', () => {
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

    it('should show error summary with proper ARIA attributes', async () => {
      const user = userEvent.setup();

      render(<AccessibleLoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Submit form to trigger validation
      await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/ }));

      await waitFor(() => {
        const errorSummary = screen.getByRole('alert');
        expect(errorSummary).toBeInTheDocument();
        expect(errorSummary).toHaveAttribute('aria-labelledby', 'error-summary-title');
        expect(errorSummary).toHaveAttribute('tabIndex', '-1');
      });
    });
  });

  describe('Responsive Design Flow', () => {
    it('should adapt to mobile viewport', async () => {
      require('@/hooks/useMediaQuery').useMediaQuery.mockReturnValue(true);

      render(<AccessibleLoginForm />);

      await waitFor(() => {
        const inputs = screen.getAllByRole('textbox');
        inputs.forEach(input => {
          expect(input).toHaveClass('text-lg', 'py-3');
        });
      });
    });

    it('should use desktop layout by default', async () => {
      require('@/hooks/useMediaQuery').useMediaQuery.mockReturnValue(false);

      render(<AccessibleLoginForm />);

      await waitFor(() => {
        const inputs = screen.getAllByRole('textbox');
        inputs.forEach(input => {
          expect(input).toHaveClass('text-base');
        });
      });
    });
  });

  describe('Offline Support Flow', () => {
    it('should show offline indicator when offline', async () => {
      require('@/hooks/useOfflineDetection').useOfflineDetection.mockReturnValue({
        isOffline: true,
      });

      render(<LoginForm />);

      await waitFor(() => {
        expect(screen.getByText(/ออฟไลน์ - ข้อมูลจะถูกบันทึกไว้/)).toBeInTheDocument();
      });
    });

    it('should persist form data when offline', async () => {
      const mockSaveFormData = jest.fn();
      require('@/hooks/useAuthFormPersistence').useAuthFormPersistence.mockReturnValue({
        persistedData: null,
        showRestorationPrompt: false,
        saveFormData: mockSaveFormData,
        clearPersistedData: jest.fn(),
        acceptRestoration: jest.fn(),
        rejectRestoration: jest.fn(),
      });

      const user = userEvent.setup();
      render(<LoginForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Type in student ID
      await user.type(screen.getByLabelText(/รหัสนักศึกษา/), '12345678');

      // Should save form data
      expect(mockSaveFormData).toHaveBeenCalledWith({
        studentId: '12345678',
        password: '',
      });
    });
  });

  describe('Custom onSubmit Flow', () => {
    it('should use custom onSubmit when provided', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(<AccessibleLoginForm onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Fill and submit form
      await user.type(screen.getByLabelText(/รหัสนักศึกษา/), '12345678');
      await user.type(screen.getByLabelText(/รหัสผ่าน/), 'validpassword');
      await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/ }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          studentId: '12345678',
          password: 'validpassword',
        });
      });

      // Should not call secure auth when custom onSubmit is provided
      expect(mockSecureAuth.secureLogin).not.toHaveBeenCalled();
    });
  });
});