"use client";

import { useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ResponsiveInput } from "@/components/ui/Input/ResponsiveInput";
import { ResponsiveButton } from "@/components/ui/Button/ResponsiveButton";
import { ResponsiveFormContainer } from "@/components/ui/Form/ResponsiveFormContainer";
import { DesktopInput } from "@/components/ui/Input/DesktopInput";
import { DesktopButton } from "@/components/ui/Button/DesktopButton";
import { DesktopFormContainer } from "@/components/ui/Form/DesktopFormContainer";

export interface AdaptiveAuthFormProps {
  formType: "login" | "register" | "admin";
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export const AdaptiveAuthForm = ({ 
  formType, 
  onSubmit, 
  isLoading = false, 
  error 
}: AdaptiveAuthFormProps) => {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<any>({});

  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Choose components based on screen size
  const InputComponent = isMobile ? ResponsiveInput : DesktopInput;
  const ButtonComponent = isMobile ? ResponsiveButton : DesktopButton;
  const FormContainer = isMobile ? ResponsiveFormContainer : DesktopFormContainer;

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <FormContainer 
      variant={isMobile ? "default" : isTablet ? "card" : "elevated"} 
      size={isMobile ? "md" : "lg"}
      enableHoverEffects={isDesktop}
      showShadow={!isMobile}
    >
      <div className="text-center mb-6">
        <img 
          src="/logo.png" 
          alt="Logo" 
          className={`mx-auto mb-4 ${isMobile ? 'h-20' : isTablet ? 'h-24' : 'h-28'}`}
        />
        <h1 className={`font-semibold text-gray-900 mb-2 ${
          isMobile ? 'text-2xl' : isTablet ? 'text-3xl' : 'text-4xl'
        }`}>
          {formType === 'login' ? 'เข้าสู่ระบบ' : 
           formType === 'register' ? 'สมัครสมาชิก' : 
           'เข้าสู่ระบบผู้ดูแล'}
        </h1>
      </div>

      {error && (
        <div className={`p-3 text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 mb-4 ${
          isDesktop ? 'p-4 text-base' : 'text-sm'
        }`}>
          <svg className={`flex-shrink-0 ${isDesktop ? 'w-5 h-5' : 'w-4 h-4'}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={`space-y-4 ${
        isTablet ? 'space-y-6' : isDesktop ? 'space-y-8' : 'space-y-5'
      }`}>
        <InputComponent
          fieldType={formType === 'admin' ? "EMAIL" : "STUDENT_ID"}
          label={formType === 'admin' ? "อีเมล" : "รหัสนักศึกษา"}
          placeholder={formType === 'admin' ? "กรุณากรอกอีเมลผู้ดูแลระบบ" : "กรุณากรอกรหัสนักศึกษา"}
          value={formData[formType === 'admin' ? 'email' : 'student_id'] || ''}
          onChange={handleInputChange(formType === 'admin' ? 'email' : 'student_id')}
          error={errors[formType === 'admin' ? 'email' : 'student_id']}
          fullWidth
          size={isMobile ? "lg" : "lg"}
          mobileOptimized={isMobile}
          enableHoverEffects={isDesktop}
        />

        <InputComponent
          fieldType="PASSWORD"
          label="รหัสผ่าน"
          placeholder="กรุณากรอกรหัสผ่าน"
          value={formData.password || ''}
          onChange={handleInputChange('password')}
          error={errors.password}
          fullWidth
          size={isMobile ? "lg" : "lg"}
          showPasswordToggle
          mobileOptimized={isMobile}
          enableHoverEffects={isDesktop}
        />

        <ButtonComponent
          type="submit"
          variant="gradient"
          size={isMobile ? "xl" : "lg"}
          fullWidth
          isLoading={isLoading}
          className={isMobile ? "mt-8" : isTablet ? "mt-10" : "mt-12"}
          mobileOptimized={isMobile}
          enableHoverEffects={isDesktop}
        >
          {isLoading ? 'กำลังดำเนินการ...' : 
           formType === 'login' ? 'เข้าสู่ระบบ' : 
           formType === 'register' ? 'สมัครสมาชิก' : 
           'เข้าสู่ระบบผู้ดูแล'}
        </ButtonComponent>
      </form>
    </FormContainer>
  );
};