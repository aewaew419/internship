"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ResponsiveButton } from "@/components/ui/Button/ResponsiveButton";
import { Input } from "@/components/ui/Input";
import { ResponsiveInput } from "@/components/ui/Input/ResponsiveInput";
import { ResponsiveFormContainer } from "@/components/ui/Form/ResponsiveFormContainer";
import { ForgotPasswordModal } from "@/components/forms/ForgotPasswordModal";
import { FormRestorationPrompt } from "@/components/ui/FormRestorationPrompt";
import { FormDraftNotification } from "@/components/ui/FormDraftNotification";
import { useAuth } from "@/hooks/useAuth";
import { useAdminLogin } from "@/hooks/api/useUser";
import { useAuthFormPersistence } from "@/hooks/useAuthFormPersistence";
import { useFormDraftManager } from "@/hooks/useFormDraftManager";
import { useOfflineDetection } from "@/hooks/useOfflineDetection";
import { validateEmail, validatePassword, debounce } from "@/lib/utils";
import { mapApiErrorToMessage, VALIDATION_MESSAGES } from "@/lib/validation-messages";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { LoginDTO } from "@/types/api";

interface AdminLoginFormProps {
  onSubmit?: (data: LoginDTO) => Promise<void>;
}

export const AdminLoginForm = ({ onSubmit }: AdminLoginFormProps) => {
  const [formData, setFormData] = useState<LoginDTO>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<LoginDTO>>({});
  const [isValidating, setIsValidating] = useState<Partial<LoginDTO>>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { setCredential } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Responsive queries for mobile optimizations
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1023px)");

  // Offline detection
  const { isOffline } = useOfflineDetection();

  // Form persistence hooks
  const formPersistence = useAuthFormPersistence<LoginDTO>({
    formType: 'admin-login',
    clearOnSubmit: true,
    enableOfflinePersistence: true,
  });

  const draftManager = useFormDraftManager<LoginDTO>({
    formType: 'admin-login',
    autoSaveInterval: 15000, // 15 seconds for admin login
    enableNotifications: true,
  });

  // Use the admin login mutation hook
  const {
    mutate: adminLogin,
    loading: isLoading,
    error: loginError,
  } = useAdminLogin();

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginDTO> = {};

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.message;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time validation for email with debouncing
  const validateEmailRealTime = useCallback(
    debounce((email: string) => {
      setIsValidating(prev => ({ ...prev, email: true }));
      
      const validation = validateEmail(email);
      
      setTimeout(() => {
        setErrors(prev => ({ 
          ...prev, 
          email: validation.isValid ? undefined : validation.message 
        }));
        setIsValidating(prev => ({ ...prev, email: false }));
      }, 100);
    }, 300),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Use the API service for admin login
        const userData = await adminLogin(formData);
        
        // Validate admin role
        const isAdmin = userData?.roles?.list?.includes('admin') || 
                       userData?.user?.roleId === 1; // Assuming roleId 1 is admin
        
        if (!isAdmin) {
          throw new Error("ไม่มีสิทธิ์เข้าถึงระบบผู้ดูแล");
        }
        
        setCredential(userData);
      }

      // Clear persistence data on successful login
      handleSuccessfulSubmit();
      
      // Redirect to admin dashboard
      const redirectTo = searchParams.get("redirect") || "/admin";
      router.push(redirectTo);
    } catch (error: any) {
      console.error("Admin login error:", error);
      
      // Handle specific admin access errors
      if (error.message === "ไม่มีสิทธิ์เข้าถึงระบบผู้ดูแล") {
        // Show access denied message and redirect to student login
        router.push("/login?error=admin_access_denied");
      }
      // Other errors are handled by the mutation hook
    }
  };

  // Handle form restoration
  const handleAcceptRestoration = useCallback(() => {
    const restoredData = formPersistence.persistedData;
    if (restoredData) {
      setFormData(prev => ({
        ...prev,
        email: restoredData.email || "",
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
        email: draftData.email || "",
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
const handleInputChange = (field: keyof LoginDTO) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    const newFormData = { ...formData, [field]: value };
    
    setFormData(newFormData);
    
    // Save form data for persistence (excluding password)
    if (field !== 'password') {
      formPersistence.saveFormData({ ...newFormData, password: "" });
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Trigger real-time validation for email
    if (field === 'email' && value) {
      validateEmailRealTime(value);
    }
  };

  // Handle blur validation
  const handleInputBlur = (field: keyof LoginDTO) => (
    e: React.FocusEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    
    if (!value) return;
    
    let validation: { isValid: boolean; message?: string };
    
    switch (field) {
      case 'email':
        validation = validateEmail(value);
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



  // Get persisted field names for restoration prompt
  const getPersistedFields = (): string[] => {
    const fields: string[] = [];
    if (formPersistence.persistedData?.email) fields.push('email');
    return fields;
  };

  return (
    <>
      {/* Form Restoration Prompt */}
      <FormRestorationPrompt
        isOpen={formPersistence.showRestorationPrompt}
        onAccept={handleAcceptRestoration}
        onReject={formPersistence.rejectRestoration}
        formType="admin-login"
        persistedFields={getPersistedFields()}
      />

      {/* Draft Notification */}
      <FormDraftNotification
        isVisible={draftManager.showDraftNotification}
        onAccept={handleAcceptDraft}
        onReject={draftManager.rejectDraft}
        draftAge={draftManager.draftAge}
        formType="admin-login"
      />

      <ResponsiveFormContainer variant="default" size="md" mobileOptimized>
      <form onSubmit={handleSubmit} className={`space-y-4 ${isMobile ? 'space-y-5' : 'space-y-4'}`}>
        {/* Admin Logo and Branding */}
        <div className="text-center mb-6">
          <div className={`bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ${
            isMobile ? 'w-24 h-24' : 'w-20 h-20'
          }`}>
            <svg
              className={`text-white ${isMobile ? 'w-12 h-12' : 'w-10 h-10'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className={`font-semibold text-gray-900 mb-2 ${isMobile ? 'text-2xl' : 'text-xl sm:text-2xl'}`}>
            เข้าสู่ระบบผู้ดูแลระบบ
          </h1>
          <p className={`text-gray-600 ${isMobile ? 'text-base' : 'text-sm sm:text-base'}`}>
            ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน - Admin Panel
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

        {/* Email Input */}
        <ResponsiveInput
          fieldType="EMAIL"
          label="อีเมล"
          placeholder="กรุณากรอกอีเมลผู้ดูแลระบบ"
          value={formData.email}
          onChange={handleInputChange("email")}
          onBlur={handleInputBlur("email")}
          error={errors.email}
          fullWidth
          size={isMobile ? "lg" : "md"}
          mobileOptimized
          enableHapticFeedback
          rightIcon={
            formData.email && (
              isValidating.email ? (
                <svg className={`animate-spin text-gray-400 ${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : errors.email ? (
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

        {/* Submit Button with Admin Styling */}
        <ResponsiveButton
          type="submit"
          variant="gradient"
          size={isMobile ? "xl" : "lg"}
          fullWidth
          isLoading={isLoading}
          className={`${isMobile ? "mt-8" : "mt-6"} bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-500`}
          mobileOptimized
          touchOptimized
          enableHapticFeedback
        >
          {isLoading ? VALIDATION_MESSAGES.LOADING.SIGNING_IN : "เข้าสู่ระบบผู้ดูแล"}
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

        {/* Back to Student Login */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className={`text-gray-600 mb-2 ${isMobile ? 'text-base' : 'text-sm'}`}>
            ไม่ใช่ผู้ดูแลระบบ?
          </p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className={`text-blue-600 hover:text-blue-800 transition-colors font-medium ${
              isMobile ? 'text-base py-2 px-3 min-h-[40px]' : 'text-sm'
            }`}
          >
            เข้าสู่ระบบนักศึกษา
          </button>
        </div>
      </form>      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        userType="admin"
      />
    </ResponsiveFormContainer>
  );
};

export default AdminLoginForm;