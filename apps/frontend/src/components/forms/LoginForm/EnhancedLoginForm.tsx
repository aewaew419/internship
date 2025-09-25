"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ResponsiveButton } from "@/components/ui/Button/ResponsiveButton";
import { ResponsiveInput } from "@/components/ui/Input/ResponsiveInput";
import { ResponsiveFormContainer } from "@/components/ui/Form/ResponsiveFormContainer";
import { ForgotPasswordModal } from "@/components/forms/ForgotPasswordModal";
import { EnhancedAuthForm } from "@/components/forms/EnhancedAuthForm";
import { useAuth } from "@/hooks/useAuth";
import { useStudentLogin } from "@/hooks/api/useUser";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { validateStudentId, validatePassword } from "@/lib/utils";
import type { StudentLoginDTO } from "@/types/api";

interface EnhancedLoginFormProps {
  onSubmit?: (data: StudentLoginDTO) => Promise<void>;
}

/**
 * Enhanced login form with comprehensive error handling
 * Integrates the new authentication error handling system
 */
export const EnhancedLoginForm = ({ onSubmit }: EnhancedLoginFormProps) => {
  const [formData, setFormData] = useState<StudentLoginDTO>({
    studentId: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<StudentLoginDTO>>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { setCredential } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const { mutate: studentLogin } = useStudentLogin();

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

  const handleFormSubmit = useCallback(async (data: StudentLoginDTO) => {
    if (onSubmit) {
      return await onSubmit(data);
    } else {
      // Use the API service for student login
      const userData = await studentLogin(data);
      setCredential(userData);
      return userData;
    }
  }, [onSubmit, studentLogin, setCredential]);

  const handleSuccess = useCallback((result: any) => {
    // Redirect to intended page or dashboard
    const redirectTo = searchParams.get("redirect") || "/";
    router.push(redirectTo);
  }, [router, searchParams]);

  const handleInputChange = (field: keyof StudentLoginDTO) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    
    // For studentId, only allow numeric input
    if (field === 'studentId') {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [field]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

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

  return (
    <>
      <EnhancedAuthForm
        action="login"
        userType="student"
        onSubmit={handleFormSubmit}
        onSuccess={handleSuccess}
        maxRetries={5}
        autoRetry={false}
        showInlineErrors={true}
        showErrorDialog={true}
      >
        {({ handleSubmit, isSubmitting, hasError, clearError }) => (
          <ResponsiveFormContainer variant="default" size="md" mobileOptimized>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (validateForm()) {
                  handleSubmit(formData);
                }
              }} 
              className={`space-y-4 ${isMobile ? 'space-y-5' : 'space-y-4'}`}
            >
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
                    errors.studentId ? (
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
                isLoading={isSubmitting}
                className={isMobile ? "mt-8" : "mt-6"}
                mobileOptimized
                touchOptimized
                enableHapticFeedback
                disabled={isSubmitting}
              >
                {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
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
          </ResponsiveFormContainer>
        )}
      </EnhancedAuthForm>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        userType="student"
      />
    </>
  );
};