"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ResponsiveButton } from "@/components/ui/Button/ResponsiveButton";
import { Input } from "@/components/ui/Input";
import { ResponsiveInput } from "@/components/ui/Input/ResponsiveInput";
import { ResponsiveFormContainer } from "@/components/ui/Form/ResponsiveFormContainer";
import { ForgotPasswordModal } from "@/components/forms/ForgotPasswordModal";
import { 
  FormSubmissionOverlay, 
  InlineFieldLoading,
  FormInitializationSkeleton 
} from "@/components/ui/LoadingStates";
import { useAuth } from "@/hooks/useAuth";
import { useStudentLogin } from "@/hooks/api/useUser";
import { useAuthLoadingStates } from "@/hooks/useAuthLoadingStates";
import { validateStudentId, validatePassword, debounce } from "@/lib/utils";
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
  const [isInitialized, setIsInitialized] = useState(false);

  const { setCredential } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Responsive queries for mobile optimizations
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1023px)");

  // Enhanced loading state management
  const authLoading = useAuthLoadingStates();

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

    try {
      await authLoading.submitFormWithProgress(
        'student-login',
        async () => {
          if (onSubmit) {
            return await onSubmit(formData);
          } else {
            // Use the API service for student login
            const userData = await studentLogin(formData);
            setCredential(userData);
            return userData;
          }
        },
        {
          showProgress: true,
          progressSteps: [
            'กำลังตรวจสอบข้อมูล...',
            'กำลังเข้าสู่ระบบ...',
            'กำลังโหลดข้อมูลผู้ใช้...',
            'เสร็จสิ้น'
          ],
          onSuccess: () => {
            // Redirect to intended page or dashboard
            const redirectTo = searchParams.get("redirect") || "/";
            router.push(redirectTo);
          },
          onError: (error) => {
            console.error("Login error:", error);
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
    
    // For studentId, only allow numeric input
    if (field === 'studentId') {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [field]: numericValue }));
      
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
      
      // Trigger real-time validation
      if (numericValue && numericValue.length >= 8) {
        validateStudentIdRealTime(numericValue);
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
      
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

  return (
    <>
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