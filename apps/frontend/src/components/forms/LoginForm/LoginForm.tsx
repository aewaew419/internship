"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ResponsiveButton } from "@/components/ui/Button/ResponsiveButton";
import { Input } from "@/components/ui/Input";
import { ResponsiveInput } from "@/components/ui/Input/ResponsiveInput";
import { ResponsiveFormContainer } from "@/components/ui/Form/ResponsiveFormContainer";
import { ForgotPasswordModal } from "@/components/forms/ForgotPasswordModal";
import { FormRestorationPrompt } from "@/components/ui/FormRestorationPrompt";
import { FormDraftNotification } from "@/components/ui/FormDraftNotification";
import { SessionTimeoutWarning } from "@/components/ui/SessionTimeoutWarning";
import { 
  FormSubmissionOverlay, 
  InlineFieldLoading,
  FormInitializationSkeleton 
} from "@/components/ui/LoadingStates";
import { useAuth } from "@/hooks/useAuth";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { useStudentLogin } from "@/hooks/api/useUser";
import { useAuthLoadingStates } from "@/hooks/useAuthLoadingStates";
import { useAuthFormPersistence } from "@/hooks/useAuthFormPersistence";
import { useFormDraftManager } from "@/hooks/useFormDraftManager";
import { useOfflineDetection } from "@/hooks/useOfflineDetection";
import { validateStudentId, validatePassword, debounce } from "@/lib/utils";
import { sanitizeStudentId, sanitizePassword } from "@/lib/security";
import { mapApiErrorToMessage, VALIDATION_MESSAGES } from "@/lib/validation-messages";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { StudentLoginDTO } from "@/types/api";

interface LoginFormProps {
  onSubmit?: (data: StudentLoginDTO) => Promise<void>;
}

export const LoginForm = ({ onSubmit }: LoginFormProps) => {
  const [formData, setFormData] = useState<StudentLoginDTO>({
    studentId: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<StudentLoginDTO>>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { setCredential } = useAuth();
  const secureAuth = useSecureAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Responsive queries for mobile optimizations
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1023px)");

  // Enhanced loading state management
  const authLoading = useAuthLoadingStates();

  // Offline detection
  const { isOffline } = useOfflineDetection();

  // Form persistence hooks
  const formPersistence = useAuthFormPersistence<StudentLoginDTO>({
    formType: 'student-login',
    clearOnSubmit: true,
    enableOfflinePersistence: true,
  });

  const draftManager = useFormDraftManager<StudentLoginDTO>({
    formType: 'student-login',
    autoSaveInterval: 15000, // 15 seconds for login forms
    enableNotifications: true,
  });

  // Use the student login mutation hook
  const {
    mutate: studentLogin,
    loading: isLoading,
    error: loginError,
  } = useStudentLogin();

  // Initialize form with delay to show skeleton
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Monitor session warning
  useEffect(() => {
    setShowSessionWarning(secureAuth.isSessionWarningActive);
  }, [secureAuth.isSessionWarningActive]);

  // Handle form restoration
  const handleAcceptRestoration = useCallback(() => {
    const restoredData = formPersistence.persistedData;
    if (restoredData) {
      setFormData(prev => ({
        ...prev,
        studentId: restoredData.studentId || "",
        // Never restore password for security
      }));
    }
    formPersistence.acceptRestoration();
  }, [formPersistence]);

  // Handle draft restoration
  const handleAcceptDraft = useCallback(() => {
    const draftData = draftManager.loadDraft();
    if (draftData) {
      setFormData(prev => ({
        ...prev,
        studentId: draftData.studentId || "",
        // Never restore password for security
      }));
    }
    draftManager.acceptDraft();
  }, [draftManager]);

  // Clear persistence data on successful submit
  const handleSuccessfulSubmit = useCallback(() => {
    formPersistence.clearPersistedData();
    draftManager.clearDraft();
  }, [formPersistence, draftManager]);

  const validateForm = (): boolean => {
    const newErrors: Partial<StudentLoginDTO> = {};

    // Validate student ID
    const studentIdValidation = validateStudentId(formData.studentId);
    if (!studentIdValidation.isValid) {
      newErrors.studentId = studentIdValidation.message;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time validation for student ID with enhanced loading states
  const validateStudentIdRealTime = useCallback(
    debounce(async (studentId: string) => {
      if (!studentId) return;
      
      try {
        await authLoading.validateFieldWithTimeout(
          'studentId',
          async () => {
            const validation = validateStudentId(studentId);
            
            // Simulate API call delay for realistic UX
            await new Promise(resolve => setTimeout(resolve, 300));
            
            setErrors(prev => ({ 
              ...prev, 
              studentId: validation.isValid ? undefined : validation.message 
            }));
            
            return {
              isValid: validation.isValid,
              errorMessage: validation.message,
            };
          },
          5000
        );
      } catch (error) {
        console.error('Student ID validation error:', error);
      }
    }, 500),
    [authLoading]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Check if rate limited
    if (secureAuth.isRateLimited) {
      setErrors({ studentId: 'การเข้าสู่ระบบถูกจำกัด กรุณารอสักครู่' });
      return;
    }

    try {
      await authLoading.submitFormWithProgress(
        'student-login',
        async () => {
          if (onSubmit) {
            return await onSubmit(formData);
          } else {
            // Use secure authentication
            const result = await secureAuth.secureLogin(formData, 'student');
            
            if (!result.success) {
              if (result.rateLimited) {
                throw new Error(result.error);
              }
              throw new Error(result.error || 'เข้าสู่ระบบไม่สำเร็จ');
            }
            
            return result;
          }
        },
        {
          showProgress: true,
          progressSteps: [
            'กำลังตรวจสอบความปลอดภัย...',
            'กำลังตรวจสอบข้อมูล...',
            'กำลังเข้าสู่ระบบ...',
            'กำลังโหลดข้อมูลผู้ใช้...',
            'เสร็จสิ้น'
          ],
          onSuccess: () => {
            // Clear persistence data on successful login
            handleSuccessfulSubmit();
            
            // Redirect to intended page or dashboard
            const redirectTo = searchParams.get("redirect") || "/";
            router.push(redirectTo);
          },
          onError: (error) => {
            console.error("Login error:", error);
            // Show rate limiting info if applicable
            if (secureAuth.remainingAttempts < 5) {
              setErrors({ 
                studentId: `เหลือความพยายามในการเข้าสู่ระบบ ${secureAuth.remainingAttempts} ครั้ง` 
              });
            }
          }
        }
      );
    } catch (error) {
      // Error is handled by the enhanced loading state
      console.error("Login submission error:", error);
    }
  };

  const handleInputChange = (field: keyof StudentLoginDTO) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    
    // For studentId, sanitize and only allow numeric input
    if (field === 'studentId') {
      const sanitizedValue = sanitizeStudentId(value);
      const newFormData = { ...formData, [field]: sanitizedValue };
      setFormData(newFormData);
      
      // Save form data for persistence (excluding password)
      formPersistence.saveFormData({ studentId: sanitizedValue, password: "" });
      
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
      
      // Trigger real-time validation
      if (sanitizedValue && sanitizedValue.length >= 8) {
        validateStudentIdRealTime(sanitizedValue);
      }
    } else if (field === 'password') {
      // Sanitize password input
      const sanitizedValue = sanitizePassword(value);
      const newFormData = { ...formData, [field]: sanitizedValue };
      setFormData(newFormData);
      
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    } else {
      const newFormData = { ...formData, [field]: value };
      setFormData(newFormData);
      
      // Save form data for persistence (excluding password for security)
      if (field !== 'password') {
        formPersistence.saveFormData({ ...newFormData, password: "" });
      }
      
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    }
  };

  // Handle blur validation
  const handleInputBlur = (field: keyof StudentLoginDTO) => (
    e: React.FocusEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    
    if (!value) return; // Don't validate empty fields on blur
    
    let validation: { isValid: boolean; message?: string };
    
    switch (field) {
      case 'studentId':
        validation = validateStudentId(value);
        break;
      case 'password':
        validation = validatePassword(value);
        break;
      default:
        return;
    }
    
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, [field]: validation.message }));
    }
  };



  // Show skeleton loading during initialization
  if (!isInitialized) {
    return (
      <ResponsiveFormContainer variant="default" size="md" mobileOptimized>
        <FormInitializationSkeleton 
          formType="login" 
          showValidationStates={true}
        />
      </ResponsiveFormContainer>
    );
  }

  const formState = authLoading.getFormState('student-login');
  const studentIdFieldState = authLoading.getFieldState('studentId');

  // Get persisted field names for restoration prompt
  const getPersistedFields = (): string[] => {
    const fields: string[] = [];
    if (formPersistence.persistedData?.studentId) fields.push('studentId');
    return fields;
  };

  return (
    <>
      {/* Form Restoration Prompt */}
      <FormRestorationPrompt
        isOpen={formPersistence.showRestorationPrompt}
        onAccept={handleAcceptRestoration}
        onReject={formPersistence.rejectRestoration}
        formType="student-login"
        persistedFields={getPersistedFields()}
      />

      {/* Draft Notification */}
      <FormDraftNotification
        isVisible={draftManager.showDraftNotification}
        onAccept={handleAcceptDraft}
        onReject={draftManager.rejectDraft}
        draftAge={draftManager.draftAge}
        formType="student-login"
      />

      <ResponsiveFormContainer variant="default" size="md" mobileOptimized>
        <form onSubmit={handleSubmit} className={`space-y-4 ${isMobile ? 'space-y-5' : 'space-y-4'}`}>
        {/* Logo */}
        <div className="text-center mb-6">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className={`mx-auto mb-4 ${isMobile ? 'h-20' : 'h-16 sm:h-20'}`}
          />
          <h1 className={`font-semibold text-gray-900 mb-2 ${isMobile ? 'text-2xl' : 'text-xl sm:text-2xl'}`}>
            เข้าสู่ระบบ
          </h1>
          <p className={`text-gray-600 ${isMobile ? 'text-base' : 'text-sm sm:text-base'}`}>
            ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน
          </p>
        </div>

        {/* Error Message */}
        {loginError && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {mapApiErrorToMessage(loginError)}
          </div>
        )}

        {/* Security Status */}
        {(secureAuth.isRateLimited || secureAuth.remainingAttempts < 5) && (
          <div className={`p-3 text-sm rounded-md flex items-center gap-2 ${
            secureAuth.isRateLimited 
              ? 'text-red-600 bg-red-50 border border-red-200' 
              : 'text-yellow-600 bg-yellow-50 border border-yellow-200'
          }`}>
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            {secureAuth.isRateLimited 
              ? 'การเข้าสู่ระบบถูกจำกัดชั่วคราว เพื่อความปลอดภัย'
              : `เหลือความพยายามในการเข้าสู่ระบบ ${secureAuth.remainingAttempts} ครั้ง`
            }
          </div>
        )}

        {/* Student ID Input */}
        <ResponsiveInput
          fieldType="STUDENT_ID"
          label="รหัสนักศึกษา"
          placeholder="กรุณากรอกรหัสนักศึกษา (8-10 หลัก)"
          value={formData.studentId}
          onChange={handleInputChange("studentId")}
          onBlur={handleInputBlur("studentId")}
          error={errors.studentId}
          fullWidth
          size={isMobile ? "lg" : "md"}
          mobileOptimized
          enableHapticFeedback
          rightIcon={
            formData.studentId && (
              studentIdFieldState.isValidating ? (
                <svg className={`animate-spin text-gray-400 ${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : errors.studentId || studentIdFieldState.hasError ? (
                <svg className={`text-red-500 ${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className={`text-green-500 ${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )
            )
          }
        />

        {/* Enhanced field validation feedback */}
        <InlineFieldLoading
          isValidating={studentIdFieldState.isValidating}
          hasError={Boolean(errors.studentId || studentIdFieldState.hasError)}
          hasSuccess={formData.studentId && !errors.studentId && !studentIdFieldState.hasError && !studentIdFieldState.isValidating}
          loadingText="กำลังตรวจสอบรหัสนักศึกษา..."
        />

        {/* Password Input */}
        <ResponsiveInput
          fieldType="PASSWORD"
          label="รหัสผ่าน"
          placeholder="กรุณากรอกรหัสผ่าน"
          value={formData.password}
          onChange={handleInputChange("password")}
          onBlur={handleInputBlur("password")}
          error={errors.password}
          fullWidth
          size={isMobile ? "lg" : "md"}
          showPasswordToggle
          mobileOptimized
          enableHapticFeedback
        />

        {/* Persistence Status Indicator */}
        {(isOffline || draftManager.isAutoSaving) && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 py-2">
            {draftManager.isAutoSaving && (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>กำลังบันทึกข้อมูล...</span>
              </>
            )}
            {isOffline && (
              <>
                <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-orange-600">ออฟไลน์ - ข้อมูลจะถูกบันทึกไว้</span>
              </>
            )}
          </div>
        )}

        {/* Submit Button */}
        <ResponsiveButton
          type="submit"
          variant="gradient"
          size={isMobile ? "xl" : "lg"}
          fullWidth
          isLoading={formState.isSubmitting || isLoading}
          className={isMobile ? "mt-8" : "mt-6"}
          mobileOptimized
          touchOptimized
          enableHapticFeedback
          disabled={authLoading.isAnyFieldValidating || formState.isSubmitting}
        >
          {formState.isSubmitting || isLoading ? VALIDATION_MESSAGES.LOADING.SIGNING_IN : "เข้าสู่ระบบ"}
        </ResponsiveButton>

        {/* Forgot Password Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className={`text-gray-600 hover:text-gray-900 transition-colors ${
              isMobile ? 'text-base py-3 px-4 min-h-[44px]' : 'text-sm'
            }`}
          >
            ลืมรหัสผ่าน?
          </button>
        </div>
      </form>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        userType="student"
      />

      {/* Session Timeout Warning */}
      <SessionTimeoutWarning
        isOpen={showSessionWarning}
        remainingTime={secureAuth.sessionTimeRemaining}
        onExtend={secureAuth.extendSession}
        onLogout={() => secureAuth.secureLogout('timeout')}
        onClose={() => setShowSessionWarning(false)}
      />
    </ResponsiveFormContainer>

    {/* Enhanced form submission overlay */}
    <FormSubmissionOverlay
      isLoading={formState.isSubmitting}
      loadingText="กำลังเข้าสู่ระบบ..."
      progress={formState.submitProgress}
      showProgress={true}
      successText={formState.submitProgress === 100 && !formState.hasSubmitError ? "เข้าสู่ระบบสำเร็จ!" : undefined}
      errorText={formState.hasSubmitError ? formState.submitErrorMessage : undefined}
    />
  </>
  );
};