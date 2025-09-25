"use client";

import { useState, useCallback, useEffect, useId, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFocusManagement } from "@/hooks/useFocusManagement";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { useScreenReader } from "@/hooks/useScreenReader";
import { useAuth } from "@/hooks/useAuth";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { useStudentLogin } from "@/hooks/api/useUser";
import { useAuthLoadingStates } from "@/hooks/useAuthLoadingStates";
import { useAuthFormPersistence } from "@/hooks/useAuthFormPersistence";
import { useFormDraftManager } from "@/hooks/useFormDraftManager";
import { useOfflineDetection } from "@/hooks/useOfflineDetection";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { validateStudentId, validatePassword, debounce } from "@/lib/utils";
import { sanitizeStudentId, sanitizePassword } from "@/lib/security";
import { mapApiErrorToMessage, VALIDATION_MESSAGES } from "@/lib/validation-messages";
import type { StudentLoginDTO } from "@/types/api";

interface AccessibleLoginFormProps {
  onSubmit?: (data: StudentLoginDTO) => Promise<void>;
  highContrast?: boolean;
  textScale?: number;
}

export const AccessibleLoginForm = ({ 
  onSubmit, 
  highContrast = false,
  textScale = 1 
}: AccessibleLoginFormProps) => {
  const [formData, setFormData] = useState<StudentLoginDTO>({
    studentId: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<StudentLoginDTO>>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Generate unique IDs for accessibility
  const formId = useId();
  const studentIdId = useId();
  const passwordId = useId();
  const errorSummaryId = useId();

  // Refs for focus management
  const formRef = useRef<HTMLFormElement>(null);
  const studentIdRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const { setCredential } = useAuth();
  const secureAuth = useSecureAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Responsive queries
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Enhanced loading state management
  const authLoading = useAuthLoadingStates();

  // Offline detection
  const { isOffline } = useOfflineDetection();

  // Accessibility hooks
  const focusManager = useFocusManagement({
    containerRef: formRef,
    trapFocus: true,
    restoreFocus: true,
  });

  const keyboardNav = useKeyboardNavigation({
    containerRef: formRef,
    focusableElements: [studentIdRef, passwordRef, submitButtonRef],
    enableArrowKeys: true,
    enableTabNavigation: true,
  });

  const screenReader = useScreenReader();

  // Form persistence hooks
  const formPersistence = useAuthFormPersistence<StudentLoginDTO>({
    formType: 'student-login',
    clearOnSubmit: true,
    enableOfflinePersistence: true,
  });

  const draftManager = useFormDraftManager<StudentLoginDTO>({
    formType: 'student-login',
    autoSaveInterval: 15000,
    enableNotifications: true,
  });

  // Use the student login mutation hook
  const {
    mutate: studentLogin,
    loading: isLoading,
    error: loginError,
  } = useStudentLogin();

  // Initialize form
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
      screenReader.announce("แบบฟอร์มเข้าสู่ระบบพร้อมใช้งาน", "polite");
    }, 800);

    return () => clearTimeout(timer);
  }, [screenReader]);

  // Focus management for errors
  useEffect(() => {
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors && errorSummaryRef.current) {
      errorSummaryRef.current.focus();
      const errorCount = Object.keys(errors).length;
      screenReader.announce(
        `พบข้อผิดพลาด ${errorCount} รายการ กรุณาตรวจสอบและแก้ไข`,
        "assertive"
      );
    }
  }, [errors, screenReader]);

  const validateForm = (): boolean => {
    const newErrors: Partial<StudentLoginDTO> = {};

    const studentIdValidation = validateStudentId(formData.studentId);
    if (!studentIdValidation.isValid) {
      newErrors.studentId = studentIdValidation.message;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstErrorField = Object.keys(errors)[0] as keyof StudentLoginDTO;
      if (firstErrorField === 'studentId' && studentIdRef.current) {
        studentIdRef.current.focus();
      } else if (firstErrorField === 'password' && passwordRef.current) {
        passwordRef.current.focus();
      }
      return;
    }

    if (secureAuth.isRateLimited) {
      setErrors({ studentId: 'การเข้าสู่ระบบถูกจำกัด กรุณารอสักครู่' });
      screenReader.announce("การเข้าสู่ระบบถูกจำกัดชั่วคราว เพื่อความปลอดภัย", "assertive");
      return;
    }

    screenReader.announce("กำลังเข้าสู่ระบบ กรุณารอสักครู่", "polite");

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        const result = await secureAuth.secureLogin(formData, 'student');
        
        if (!result.success) {
          throw new Error(result.error || 'เข้าสู่ระบบไม่สำเร็จ');
        }
        
        screenReader.announce("เข้าสู่ระบบสำเร็จ กำลังเปลี่ยนหน้า", "assertive");
        const redirectTo = searchParams.get("redirect") || "/";
        router.push(redirectTo);
      }
    } catch (error: any) {
      console.error("Login submission error:", error);
      screenReader.announce(`เข้าสู่ระบบไม่สำเร็จ: ${error.message}`, "assertive");
    }
  };

  const handleInputChange = (field: keyof StudentLoginDTO) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    
    if (field === 'studentId') {
      const sanitizedValue = sanitizeStudentId(value);
      setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
      
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
        screenReader.announce("ข้อผิดพลาดถูกล้างแล้ว", "polite");
      }
    } else if (field === 'password') {
      const sanitizedValue = sanitizePassword(value);
      setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
      
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
        screenReader.announce("ข้อผิดพลาดถูกล้างแล้ว", "polite");
      }
    }
  };

  const handleInputBlur = (field: keyof StudentLoginDTO) => (
    e: React.FocusEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    if (!value) return;
    
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

  // Calculate dynamic styles based on accessibility preferences
  const accessibilityStyles = {
    fontSize: `${textScale}rem`,
    ...(highContrast && {
      backgroundColor: '#1c1d20', // Use protected dark mode background
      color: '#eceef1', // Use protected dark mode foreground
      border: '2px solid #334155', // Use protected dark mode border
    }),
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Skip to main content link */}
      <a
        href="#main-form"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
        style={accessibilityStyles}
      >
        ข้ามไปยังแบบฟอร์มหลัก
      </a>

      <div 
        className={`max-w-md mx-auto p-6 rounded-lg shadow-lg ${
          highContrast ? 'bg-black border-2 border-white' : 'bg-white'
        }`}
        style={highContrast ? accessibilityStyles : undefined}
      >
        {/* Live region for status announcements */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />

        {/* Error summary for screen readers */}
        {Object.keys(errors).length > 0 && (
          <div
            ref={errorSummaryRef}
            id={errorSummaryId}
            role="alert"
            aria-labelledby="error-summary-title"
            tabIndex={-1}
            className={`mb-4 p-4 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
              highContrast 
                ? 'bg-red-900 border-red-300 text-red-100' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
            style={accessibilityStyles}
          >
            <h2 id="error-summary-title" className="font-semibold mb-2">
              พบข้อผิดพลาด {Object.keys(errors).length} รายการ:
            </h2>
            <ul className="list-disc list-inside space-y-1">
              {Object.entries(errors).map(([field, message]) => (
                <li key={field}>
                  <a
                    href={`#${field === 'studentId' ? studentIdId : passwordId}`}
                    className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                    onClick={(e) => {
                      e.preventDefault();
                      if (field === 'studentId' && studentIdRef.current) {
                        studentIdRef.current.focus();
                      } else if (field === 'password' && passwordRef.current) {
                        passwordRef.current.focus();
                      }
                    }}
                  >
                    {field === 'studentId' ? 'รหัสนักศึกษา' : 'รหัสผ่าน'}: {message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form 
          ref={formRef}
          id="main-form"
          onSubmit={handleSubmit}
          className="space-y-4"
          aria-labelledby="form-title"
          aria-describedby={Object.keys(errors).length > 0 ? errorSummaryId : undefined}
          noValidate
        >
          {/* Logo and Title */}
          <div className="text-center mb-6">
            <img 
              src="/logo.png" 
              alt="โลโก้ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน" 
              className="mx-auto mb-4 h-16"
            />
            <h1 
              id="form-title"
              className={`text-xl font-semibold mb-2 ${
                highContrast ? 'text-white' : 'text-gray-900'
              }`}
              style={accessibilityStyles}
            >
              เข้าสู่ระบบ
            </h1>
            <p 
              className={`text-sm ${
                highContrast ? 'text-gray-200' : 'text-gray-600'
              }`}
              style={accessibilityStyles}
            >
              ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน
            </p>
          </div>

          {/* Login Error Message */}
          {loginError && (
            <div 
              role="alert"
              className={`p-3 text-sm rounded-md flex items-center gap-2 ${
                highContrast 
                  ? 'text-red-100 bg-red-900 border-2 border-red-300' 
                  : 'text-red-600 bg-red-50 border border-red-200'
              }`}
              style={accessibilityStyles}
            >
              <svg 
                className="w-4 h-4 flex-shrink-0" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {mapApiErrorToMessage(loginError)}
            </div>
          )}

          {/* Security Status */}
          {(secureAuth.isRateLimited || secureAuth.remainingAttempts < 5) && (
            <div 
              role="alert"
              className={`p-3 text-sm rounded-md flex items-center gap-2 ${
                secureAuth.isRateLimited 
                  ? highContrast 
                    ? 'text-red-100 bg-red-900 border-2 border-red-300'
                    : 'text-red-600 bg-red-50 border border-red-200'
                  : highContrast
                    ? 'text-yellow-100 bg-yellow-900 border-2 border-yellow-300'
                    : 'text-yellow-600 bg-yellow-50 border border-yellow-200'
              }`}
              style={accessibilityStyles}
            >
              <svg 
                className="w-4 h-4 flex-shrink-0" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
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
            ref={studentIdRef}
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
            aria-describedby={`${studentIdId}-description ${errors.studentId ? `${studentIdId}-error` : ''}`}
            aria-invalid={errors.studentId ? 'true' : 'false'}
            aria-required="true"
            style={highContrast ? accessibilityStyles : undefined}
          />
          <div id={`${studentIdId}-description`} className="sr-only">
            กรุณากรอกรหัสนักศึกษา 8 ถึง 10 หลัก ตัวเลขเท่านั้น
          </div>

          {/* Password Input */}
          <ResponsiveInput
            ref={passwordRef}
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
            aria-describedby={`${passwordId}-description ${errors.password ? `${passwordId}-error` : ''}`}
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-required="true"
            style={highContrast ? accessibilityStyles : undefined}
          />
          <div id={`${passwordId}-description`} className="sr-only">
            กรุณากรอกรหัสผ่านของคุณ
          </div>

          {/* Submit Button */}
          <button
            ref={submitButtonRef}
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
              isMobile ? 'py-4 text-lg' : 'py-3 text-base'
            } ${
              isLoading
                ? highContrast
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : highContrast
                  ? 'bg-blue-800 text-white hover:bg-blue-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            style={accessibilityStyles}
          >
            {isLoading ? (
              <>
                <span className="sr-only">กำลังเข้าสู่ระบบ กรุณารอสักครู่</span>
                <span aria-hidden="true">กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </button>

          {/* Forgot Password Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className={`transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded ${
                isMobile ? 'text-base py-3 px-4 min-h-[44px]' : 'text-sm py-2 px-3'
              } ${
                highContrast 
                  ? 'text-blue-200 hover:text-blue-100' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={accessibilityStyles}
            >
              ลืมรหัสผ่าน?
            </button>
          </div>
        </form>
      </div>
    </>
  );
};