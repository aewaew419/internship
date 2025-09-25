"use client";

import { useState, useCallback, useEffect, useId, useRef, memo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { useStudentLogin } from "@/hooks/api/useUser";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useMemoizedValidation } from "@/hooks/useMemoizedValidation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { sanitizeStudentId, sanitizePassword } from "@/lib/security";
import { mapApiErrorToMessage, VALIDATION_MESSAGES } from "@/lib/validation-messages";
import type { StudentLoginDTO } from "@/types/api";

interface OptimizedLoginFormProps {
  onSubmit?: (data: StudentLoginDTO) => Promise<void>;
}

// Memoized input component to prevent unnecessary re-renders
const MemoizedInput = memo(({ 
  id, 
  type, 
  value, 
  onChange, 
  onBlur, 
  placeholder, 
  error, 
  label,
  required = false,
  ...props 
}: {
  id: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
  label: string;
  required?: boolean;
  [key: string]: any;
}) => {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="ฟิลด์จำเป็น">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : 'false'}
        aria-required={required}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error 
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300'
        }`}
        {...props}
      />
      {error && (
        <div
          role="alert"
          className="text-sm text-red-600"
        >
          <span className="sr-only">ข้อผิดพลาด: </span>
          {error}
        </div>
      )}
    </div>
  );
});

MemoizedInput.displayName = 'MemoizedInput';

// Memoized button component
const MemoizedButton = memo(({ 
  children, 
  disabled, 
  loading, 
  onClick, 
  type = "button",
  className = "",
  ...props 
}: {
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  [key: string]: any;
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`w-full py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
        disabled || loading
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      } ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <span className="sr-only">กำลังเข้าสู่ระบบ กรุณารอสักครู่</span>
          <span aria-hidden="true">กำลังเข้าสู่ระบบ...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

MemoizedButton.displayName = 'MemoizedButton';

export const OptimizedLoginForm = memo(({ onSubmit }: OptimizedLoginFormProps) => {
  const [formData, setFormData] = useState<StudentLoginDTO>({
    studentId: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<StudentLoginDTO>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate unique IDs for accessibility
  const studentIdId = useId();
  const passwordId = useId();

  // Refs for performance optimization
  const formRef = useRef<HTMLFormElement>(null);
  const renderCountRef = useRef(0);

  const { setCredential } = useAuth();
  const secureAuth = useSecureAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Responsive queries
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Performance monitoring
  const performanceMonitor = usePerformanceMonitor({
    componentName: 'OptimizedLoginForm',
    enableMemoryTracking: true,
    enableInteractionTracking: true,
    reportThreshold: 16,
  });

  // Memoized validation
  const { validateStudentId, validatePassword, validateForm } = useMemoizedValidation();

  // Use the student login mutation hook
  const {
    mutate: studentLogin,
    loading: isLoading,
    error: loginError,
  } = useStudentLogin();

  // Track render count for performance monitoring
  useEffect(() => {
    renderCountRef.current += 1;
    performanceMonitor.startMeasurement();
    
    return () => {
      performanceMonitor.endMeasurement('update');
    };
  });

  // Memoized form validation
  const validateFormData = useCallback(() => {
    performanceMonitor.startMeasurement();
    
    const validation = validateForm(formData);
    setErrors(validation.errors);
    
    performanceMonitor.endMeasurement('interaction');
    
    return validation.isValid;
  }, [formData, validateForm, performanceMonitor]);

  // Optimized input change handler
  const handleInputChange = useCallback((field: keyof StudentLoginDTO) => {
    return performanceMonitor.measureInteraction(`input-change-${field}`, (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      let sanitizedValue = value;
      if (field === 'studentId') {
        sanitizedValue = sanitizeStudentId(value);
      } else if (field === 'password') {
        sanitizedValue = sanitizePassword(value);
      }
      
      setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
      
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    });
  }, [errors, performanceMonitor]);

  // Optimized blur handler
  const handleInputBlur = useCallback((field: keyof StudentLoginDTO) => {
    return performanceMonitor.measureInteraction(`input-blur-${field}`, (e: React.FocusEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (!value) return;
      
      let validation;
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
    });
  }, [validateStudentId, validatePassword, performanceMonitor]);

  // Optimized submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateFormData()) {
      return;
    }

    if (secureAuth.isRateLimited) {
      setErrors({ studentId: 'การเข้าสู่ระบบถูกจำกัด กรุณารอสักครู่' });
      return;
    }

    setIsSubmitting(true);

    try {
      await performanceMonitor.measureInteraction('form-submission', async () => {
        if (onSubmit) {
          await onSubmit(formData);
        } else {
          const result = await secureAuth.secureLogin(formData, 'student');
          
          if (!result.success) {
            throw new Error(result.error || 'เข้าสู่ระบบไม่สำเร็จ');
          }
          
          const redirectTo = searchParams.get("redirect") || "/";
          router.push(redirectTo);
        }
      });
    } catch (error: any) {
      console.error("Login submission error:", error);
      setErrors({ studentId: error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validateFormData,
    secureAuth,
    formData,
    onSubmit,
    searchParams,
    router,
    performanceMonitor
  ]);

  // Performance summary logging (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const timer = setTimeout(() => {
        const summary = performanceMonitor.getPerformanceSummary();
        if (summary) {
          console.log('OptimizedLoginForm Performance Summary:', summary);
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [performanceMonitor]);

  return (
    <div className="max-w-md mx-auto p-6 rounded-lg shadow-lg bg-white">
      {/* Performance debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
          Renders: {renderCountRef.current}
        </div>
      )}

      {/* Logo and Title */}
      <div className="text-center mb-6">
        <img 
          src="/logo.png" 
          alt="โลโก้ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน" 
          className="mx-auto mb-4 h-16"
          loading="lazy"
        />
        <h1 className="text-xl font-semibold mb-2 text-gray-900">
          เข้าสู่ระบบ
        </h1>
        <p className="text-sm text-gray-600">
          ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน
        </p>
      </div>

      {/* Login Error Message */}
      {loginError && (
        <div 
          role="alert"
          className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 mb-4"
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
          className={`p-3 text-sm rounded-md flex items-center gap-2 mb-4 ${
            secureAuth.isRateLimited 
              ? 'text-red-600 bg-red-50 border border-red-200'
              : 'text-yellow-600 bg-yellow-50 border border-yellow-200'
          }`}
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

      <form 
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-4"
        noValidate
      >
        {/* Student ID Input */}
        <MemoizedInput
          id={studentIdId}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="username"
          placeholder="กรุณากรอกรหัสนักศึกษา (8-10 หลัก)"
          value={formData.studentId}
          onChange={handleInputChange("studentId")}
          onBlur={handleInputBlur("studentId")}
          error={errors.studentId}
          label="รหัสนักศึกษา"
          required
        />

        {/* Password Input */}
        <MemoizedInput
          id={passwordId}
          type="password"
          autoComplete="current-password"
          placeholder="กรุณากรอกรหัสผ่าน"
          value={formData.password}
          onChange={handleInputChange("password")}
          onBlur={handleInputBlur("password")}
          error={errors.password}
          label="รหัสผ่าน"
          required
        />

        {/* Submit Button */}
        <MemoizedButton
          type="submit"
          disabled={isSubmitting || isLoading}
          loading={isSubmitting || isLoading}
          className="mt-6"
        >
          เข้าสู่ระบบ
        </MemoizedButton>

        {/* Forgot Password Link */}
        <div className="text-center">
          <button
            type="button"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded py-2 px-3"
          >
            ลืมรหัสผ่าน?
          </button>
        </div>
      </form>
    </div>
  );
});

OptimizedLoginForm.displayName = 'OptimizedLoginForm';