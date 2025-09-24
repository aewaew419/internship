"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ResponsiveButton } from "@/components/ui/Button/ResponsiveButton";
import { ResponsiveInput } from "@/components/ui/Input/ResponsiveInput";
import { ResponsiveFormContainer } from "@/components/ui/Form/ResponsiveFormContainer";
import { FormSubmissionOverlay } from "@/components/ui/LoadingStates";
import { useResetPassword } from "@/hooks/api/useUser";
import { validatePassword, debounce } from "@/lib/utils";
import { mapApiErrorToMessage } from "@/lib/validation-messages";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface PasswordResetFormProps {
  token?: string;
  onSuccess?: () => void;
}

interface PasswordResetFormData {
  password: string;
  confirmPassword: string;
}

export const PasswordResetForm = ({ token: propToken, onSuccess }: PasswordResetFormProps) => {
  const [formData, setFormData] = useState<PasswordResetFormData>({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<PasswordResetFormData>>({});
  const [isValidating, setIsValidating] = useState<Partial<PasswordResetFormData>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Get token from props or URL params
  const token = propToken || searchParams.get("token") || "";

  const {
    mutate: resetPassword,
    loading: isLoading,
    error: resetPasswordError,
  } = useResetPassword();

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      router.push("/login?error=invalid_reset_token");
    }
  }, [token, router]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PasswordResetFormData> = {};

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "กรุณายืนยันรหัสผ่าน";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PasswordResetFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const result = await resetPassword({
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      
      if (result.success) {
        setIsSuccess(true);
        setSuccessMessage(result.message || "เปลี่ยนรหัสผ่านสำเร็จ");
        
        if (onSuccess) {
          onSuccess();
        } else {
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/login?message=password_reset_success");
          }, 3000);
        }
      }
    } catch (error) {
      console.error("Password reset error:", error);
    }
  };

  if (!token) {
    return null; // Will redirect
  }

  if (isSuccess) {
    return (
      <ResponsiveFormContainer variant="default" size="md" mobileOptimized>
        <div className="text-center space-y-6">
          <div className="bg-green-100 rounded-full flex items-center justify-center mx-auto w-20 h-20">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          
          <div className="space-y-3">
            <h1 className={`font-semibold text-gray-900 ${isMobile ? 'text-2xl' : 'text-xl'}`}>
              เปลี่ยนรหัสผ่านสำเร็จ!
            </h1>
            <p className={`text-gray-600 leading-relaxed ${isMobile ? 'text-base' : 'text-sm'}`}>
              {successMessage}
            </p>
          </div>

          <ResponsiveButton
            type="button"
            variant="gradient"
            onClick={() => router.push("/login")}
            fullWidth
            size={isMobile ? "lg" : "md"}
            mobileOptimized
            enableHapticFeedback
          >
            เข้าสู่ระบบ
          </ResponsiveButton>
        </div>
      </ResponsiveFormContainer>
    );
  }

  return (
    <>
      <ResponsiveFormContainer variant="default" size="md" mobileOptimized>
        <form onSubmit={handleSubmit} className={`space-y-4 ${isMobile ? 'space-y-5' : 'space-y-4'}`}>
          {/* Header */}
          <div className="text-center mb-6">
            <div className="bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 w-20 h-20">
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h1 className={`font-semibold text-gray-900 mb-2 ${isMobile ? 'text-2xl' : 'text-xl'}`}>
              เปลี่ยนรหัสผ่านใหม่
            </h1>
            <p className={`text-gray-600 ${isMobile ? 'text-base' : 'text-sm'}`}>
              กรุณากรอกรหัสผ่านใหม่ของคุณ
            </p>
          </div>

          {/* Error Message */}
          {resetPasswordError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {mapApiErrorToMessage(resetPasswordError)}
            </div>
          )}

          {/* New Password Input */}
          <ResponsiveInput
            fieldType="PASSWORD"
            label="รหัสผ่านใหม่"
            placeholder="กรุณากรอกรหัสผ่านใหม่"
            value={formData.password}
            onChange={handleInputChange("password")}
            error={errors.password}
            fullWidth
            size={isMobile ? "lg" : "md"}
            showPasswordToggle
            mobileOptimized
            enableHapticFeedback
          />

          {/* Confirm Password Input */}
          <ResponsiveInput
            fieldType="PASSWORD"
            label="ยืนยันรหัสผ่านใหม่"
            placeholder="กรุณายืนยันรหัสผ่านใหม่"
            value={formData.confirmPassword}
            onChange={handleInputChange("confirmPassword")}
            error={errors.confirmPassword}
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
            isLoading={isLoading}
            className={isMobile ? "mt-8" : "mt-6"}
            mobileOptimized
            touchOptimized
            enableHapticFeedback
          >
            {isLoading ? "กำลังเปลี่ยนรหัสผ่าน..." : "เปลี่ยนรหัสผ่าน"}
          </ResponsiveButton>

          {/* Back to Login */}
          <div className="text-center pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className={`text-gray-600 hover:text-gray-900 transition-colors ${
                isMobile ? 'text-base py-2 px-3 min-h-[40px]' : 'text-sm'
              }`}
            >
              กลับไปหน้าเข้าสู่ระบบ
            </button>
          </div>
        </form>
      </ResponsiveFormContainer>

      {/* Form submission overlay */}
      <FormSubmissionOverlay
        isLoading={isLoading}
        loadingText="กำลังเปลี่ยนรหัสผ่าน..."
        showProgress={false}
      />
    </>
  );
};