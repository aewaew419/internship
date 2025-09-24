"use client";

import { useState, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { ResponsiveButton } from "@/components/ui/Button/ResponsiveButton";
import { ResponsiveInput } from "@/components/ui/Input/ResponsiveInput";
import { FormSubmissionOverlay } from "@/components/ui/LoadingStates";
import { useForgotPassword } from "@/hooks/api/useUser";
import { validateEmail, debounce } from "@/lib/utils";
import { mapApiErrorToMessage } from "@/lib/validation-messages";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: 'student' | 'admin';
  initialEmail?: string;
}

export const ForgotPasswordModal = ({ 
  isOpen, 
  onClose, 
  userType = 'student',
  initialEmail = ""
}: ForgotPasswordModalProps) => {
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState<string>();
  const [isValidating, setIsValidating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const isMobile = useMediaQuery("(max-width: 768px)");

  const {
    mutate: forgotPassword,
    loading: isLoading,
    error: forgotPasswordError,
  } = useForgotPassword();

  // Real-time email validation with debouncing
  const validateEmailRealTime = useCallback(
    debounce((emailValue: string) => {
      if (!emailValue) {
        setEmailError(undefined);
        return;
      }

      setIsValidating(true);
      
      const validation = validateEmail(emailValue);
      
      setTimeout(() => {
        setEmailError(validation.isValid ? undefined : validation.message);
        setIsValidating(false);
      }, 300);
    }, 500),
    []
  );

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear error when user starts typing
    if (emailError) {
      setEmailError(undefined);
    }
    
    // Trigger real-time validation
    validateEmailRealTime(value);
  };

  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (!value) return;
    
    const validation = validateEmail(value);
    if (!validation.isValid) {
      setEmailError(validation.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.message);
      return;
    }

    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        setIsSuccess(true);
        setSuccessMessage(result.message || "ระบบได้ส่งลิงก์เพื่อเปลี่ยนรหัสผ่านไปยังอีเมลของคุณแล้ว");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      // Error is handled by the mutation hook
    }
  };

  const handleClose = () => {
    setEmail(initialEmail);
    setEmailError(undefined);
    setIsValidating(false);
    setIsSuccess(false);
    setSuccessMessage("");
    onClose();
  };

  const isAdmin = userType === 'admin';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={isSuccess ? "อีเมลถูกส่งแล้ว" : `ลืมรหัสผ่าน${isAdmin ? " - ผู้ดูแลระบบ" : ""}`}
        size="md"
        mobileFullScreen={isMobile}
      >
        {isSuccess ? (
          // Success State
          <div className="text-center space-y-6">
            <div className={`${isAdmin ? 'bg-red-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto ${isMobile ? 'w-24 h-24' : 'w-20 h-20'}`}>
              <svg
                className={`${isAdmin ? 'text-red-600' : 'text-green-600'} ${isMobile ? 'w-12 h-12' : 'w-10 h-10'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            
            <div className="space-y-3">
              <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-xl' : 'text-lg'}`}>
                ส่งอีเมลสำเร็จ!
              </h3>
              <p className={`text-gray-600 leading-relaxed ${isMobile ? 'text-base' : 'text-sm'}`}>
                {successMessage}
              </p>
              <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${isMobile ? 'text-base' : 'text-sm'}`}>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-blue-800">
                    <p className="font-medium mb-1">ขั้นตอนถัดไป:</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• ตรวจสอบอีเมลของคุณ (รวมถึงโฟลเดอร์ Spam)</li>
                      <li>• คลิกลิงก์ในอีเมลเพื่อเปลี่ยนรหัสผ่าน</li>
                      <li>• ลิงก์จะหมดอายุใน 24 ชั่วโมง</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <ResponsiveButton
              type="button"
              variant={isAdmin ? "gradient" : "gradient"}
              onClick={handleClose}
              fullWidth
              size={isMobile ? "lg" : "md"}
              className={isAdmin ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800" : ""}
              mobileOptimized
              enableHapticFeedback
            >
              เข้าใจแล้ว
            </ResponsiveButton>
          </div>
        ) : (
          // Form State
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center space-y-4">
              <div className={`${isAdmin ? 'bg-red-100' : 'bg-gray-200'} rounded-full flex items-center justify-center mx-auto ${isMobile ? 'w-24 h-24' : 'w-20 h-20'}`}>
                <svg
                  className={`${isAdmin ? 'text-red-600' : 'text-gray-500'} ${isMobile ? 'w-12 h-12' : 'w-10 h-10'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isAdmin ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  )}
                </svg>
              </div>
              
              <div className="space-y-2">
                <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-xl' : 'text-lg'}`}>
                  กรุณากรอกอีเมล{isAdmin ? 'ผู้ดูแลระบบ' : ''}
                </h3>
                <p className={`text-gray-600 leading-relaxed ${isMobile ? 'text-base' : 'text-sm'}`}>
                  ระบบจะส่งลิงก์เพื่อเปลี่ยนรหัสผ่านไปยังอีเมลของคุณ
                </p>
              </div>
            </div>

            {/* Error Message */}
            {forgotPasswordError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {mapApiErrorToMessage(forgotPasswordError)}
              </div>
            )}

            {/* Email Input */}
            <ResponsiveInput
              fieldType="EMAIL"
              label={`อีเมล${isAdmin ? 'ผู้ดูแลระบบ' : ''}`}
              placeholder={`กรุณากรอกอีเมล${isAdmin ? 'ผู้ดูแลระบบ' : ''}`}
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              error={emailError}
              fullWidth
              size={isMobile ? "lg" : "md"}
              mobileOptimized
              enableHapticFeedback
              required
              rightIcon={
                email && (
                  isValidating ? (
                    <svg className={`animate-spin text-gray-400 ${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : emailError ? (
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

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <ResponsiveButton
                type="button"
                variant="outline"
                onClick={handleClose}
                fullWidth
                size={isMobile ? "lg" : "md"}
                mobileOptimized
                disabled={isLoading}
              >
                ยกเลิก
              </ResponsiveButton>
              <ResponsiveButton
                type="submit"
                variant="gradient"
                fullWidth
                size={isMobile ? "lg" : "md"}
                className={isAdmin ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800" : ""}
                mobileOptimized
                enableHapticFeedback
                isLoading={isLoading}
                disabled={isValidating || !!emailError || !email.trim()}
              >
                {isLoading ? "กำลังส่ง..." : "ส่งลิงก์"}
              </ResponsiveButton>
            </div>
          </form>
        )}
      </Modal>

      {/* Form submission overlay */}
      <FormSubmissionOverlay
        isLoading={isLoading}
        loadingText="กำลังส่งอีเมล..."
        showProgress={false}
      />
    </>
  );
};