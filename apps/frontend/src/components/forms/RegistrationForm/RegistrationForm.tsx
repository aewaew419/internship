"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ResponsiveButton } from "@/components/ui/Button/ResponsiveButton";
import { Input } from "@/components/ui/Input";
import { ResponsiveInput } from "@/components/ui/Input/ResponsiveInput";
import { ResponsiveFormContainer } from "@/components/ui/Form/ResponsiveFormContainer";
import { FormRestorationPrompt } from "@/components/ui/FormRestorationPrompt";
import { FormDraftNotification } from "@/components/ui/FormDraftNotification";
import { validateStudentId, validateEmail, validatePassword, validateName, validateConfirmPassword, debounce } from "@/lib/utils";
import { VALIDATION_MESSAGES, mapApiErrorToMessage } from "@/lib/validation-messages";
import { useRegister, useCheckStudentId, useCheckEmail } from "@/hooks/api/useUser";
import { useAuth } from "@/hooks/useAuth";
import { useAuthFormPersistence } from "@/hooks/useAuthFormPersistence";
import { useFormDraftManager } from "@/hooks/useFormDraftManager";
import { useOfflineDetection } from "@/hooks/useOfflineDetection";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export interface RegistrationDTO {
  student_id: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

interface RegistrationFormProps {
  onSubmit?: (data: RegistrationDTO) => Promise<void>;
  showLoginLink?: boolean;
}

type RegistrationStep = 'personal' | 'credentials';

interface RegistrationFormState {
  formData: RegistrationDTO;
  errors: Partial<RegistrationDTO>;
  isLoading: boolean;
  step: RegistrationStep;
}

export const RegistrationForm = ({ onSubmit, showLoginLink = true }: RegistrationFormProps) => {
  const [state, setState] = useState<RegistrationFormState>({
    formData: {
      student_id: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
    errors: {},
    isLoading: false,
    step: 'personal',
  });

  const [isValidating, setIsValidating] = useState<Partial<RegistrationDTO>>({});
  const [availabilityChecks, setAvailabilityChecks] = useState<{
    student_id?: { available: boolean; checked: boolean };
    email?: { available: boolean; checked: boolean };
  }>({});

  const router = useRouter();
  const { setCredential } = useAuth();
  
  // Responsive queries for mobile optimizations
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1023px)");

  // Offline detection
  const { isOffline } = useOfflineDetection();

  // Form persistence hooks
  const formPersistence = useAuthFormPersistence<RegistrationDTO>({
    formType: 'registration',
    clearOnSubmit: true,
    maxAge: 60 * 60 * 1000, // 1 hour for registration forms
    enableOfflinePersistence: true,
  });

  const draftManager = useFormDraftManager<RegistrationDTO>({
    formType: 'registration',
    autoSaveInterval: 10000, // 10 seconds for registration
    draftExpiration: 24 * 60 * 60 * 1000, // 24 hours
    enableNotifications: true,
  });

  // API hooks
  const {
    mutate: register,
    loading: isRegistering,
    error: registrationError,
  } = useRegister();

  const {
    mutate: checkStudentId,
    loading: isCheckingStudentId,
  } = useCheckStudentId();

  const {
    mutate: checkEmail,
    loading: isCheckingEmail,
  } = useCheckEmail();

  // Check student ID availability
  const checkStudentIdAvailability = useCallback(
    debounce(async (studentId: string) => {
      if (!studentId || studentId.length < 8) return;
      
      try {
        const result = await checkStudentId(studentId);
        setAvailabilityChecks(prev => ({
          ...prev,
          student_id: { available: result.available, checked: true }
        }));
        
        if (!result.available) {
          setState(prev => ({
            ...prev,
            errors: {
              ...prev.errors,
              student_id: result.message || VALIDATION_MESSAGES.STUDENT_ID.ALREADY_EXISTS
            }
          }));
        }
      } catch (error) {
        console.error('Error checking student ID availability:', error);
      }
    }, 500),
    [checkStudentId]
  );

  // Check email availability
  const checkEmailAvailability = useCallback(
    debounce(async (email: string) => {
      if (!email || !validateEmail(email).isValid) return;
      
      try {
        const result = await checkEmail(email);
        setAvailabilityChecks(prev => ({
          ...prev,
          email: { available: result.available, checked: true }
        }));
        
        if (!result.available) {
          setState(prev => ({
            ...prev,
            errors: {
              ...prev.errors,
              email: result.message || VALIDATION_MESSAGES.EMAIL.ALREADY_EXISTS
            }
          }));
        }
      } catch (error) {
        console.error('Error checking email availability:', error);
      }
    }, 500),
    [checkEmail]
  );  // Real-ti
me validation with debouncing
  const validateFieldRealTime = useCallback(
    debounce((field: keyof RegistrationDTO, value: string) => {
      setIsValidating(prev => ({ ...prev, [field]: true }));
      
      let validation: { isValid: boolean; message?: string };
      
      switch (field) {
        case 'student_id':
          validation = validateStudentId(value);
          // Also check availability if validation passes
          if (validation.isValid) {
            checkStudentIdAvailability(value);
          }
          break;
        case 'email':
          validation = validateEmail(value);
          // Also check availability if validation passes
          if (validation.isValid) {
            checkEmailAvailability(value);
          }
          break;
        case 'password':
          validation = validatePassword(value);
          break;
        case 'confirmPassword':
          validation = validateConfirmPassword(state.formData.password, value);
          break;
        case 'firstName':
        case 'lastName':
          validation = validateName(value, field);
          break;
        default:
          validation = { isValid: true };
      }
      
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            [field]: validation.isValid ? undefined : validation.message
          }
        }));
        setIsValidating(prev => ({ ...prev, [field]: false }));
      }, 100);
    }, 300),
    [state.formData.password]
  );

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const newErrors: Partial<RegistrationDTO> = {};
    
    if (state.step === 'personal') {
      // Validate personal information
      const firstNameValidation = validateName(state.formData.firstName, 'firstName');
      if (!firstNameValidation.isValid) {
        newErrors.firstName = firstNameValidation.message;
      }
      
      const lastNameValidation = validateName(state.formData.lastName, 'lastName');
      if (!lastNameValidation.isValid) {
        newErrors.lastName = lastNameValidation.message;
      }
      
      const studentIdValidation = validateStudentId(state.formData.student_id);
      if (!studentIdValidation.isValid) {
        newErrors.student_id = studentIdValidation.message;
      } else if (availabilityChecks.student_id?.checked && !availabilityChecks.student_id.available) {
        newErrors.student_id = VALIDATION_MESSAGES.STUDENT_ID.ALREADY_EXISTS;
      }
    } else if (state.step === 'credentials') {
      // Validate credentials
      const emailValidation = validateEmail(state.formData.email);
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.message;
      } else if (availabilityChecks.email?.checked && !availabilityChecks.email.available) {
        newErrors.email = VALIDATION_MESSAGES.EMAIL.ALREADY_EXISTS;
      }
      
      const passwordValidation = validatePassword(state.formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
      }
      
      const confirmPasswordValidation = validateConfirmPassword(
        state.formData.password, 
        state.formData.confirmPassword
      );
      if (!confirmPasswordValidation.isValid) {
        newErrors.confirmPassword = confirmPasswordValidation.message;
      }
    }
    
    setState(prev => ({ ...prev, errors: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof RegistrationDTO) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = e.target.value;
    
    // For student_id, only allow numeric input
    if (field === 'student_id') {
      value = value.replace(/\D/g, '');
    }
    
    const newFormData = { ...state.formData, [field]: value };
    
    setState(prev => ({
      ...prev,
      formData: newFormData,
      errors: { ...prev.errors, [field]: undefined }
    }));
    
    // Save form data for persistence (excluding passwords)
    const persistData = { ...newFormData };
    delete persistData.password;
    delete persistData.confirmPassword;
    formPersistence.saveFormData(persistData);
    
    // Auto-save draft periodically
    draftManager.saveDraft(persistData, false);
    
    // Clear availability checks when value changes
    if (field === 'student_id' || field === 'email') {
      setAvailabilityChecks(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
    
    // Trigger real-time validation
    if (value) {
      validateFieldRealTime(field, value);
    }
  };

  // Handle input blur
  const handleInputBlur = (field: keyof RegistrationDTO) => (
    e: React.FocusEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    if (!value) return;
    
    let validation: { isValid: boolean; message?: string };
    
    switch (field) {
      case 'student_id':
        validation = validateStudentId(value);
        break;
      case 'email':
        validation = validateEmail(value);
        break;
      case 'password':
        validation = validatePassword(value);
        break;
      case 'confirmPassword':
        validation = validateConfirmPassword(state.formData.password, value);
        break;
      case 'firstName':
      case 'lastName':
        validation = validateName(value, field);
        break;
      default:
        return;
    }
    
    if (!validation.isValid) {
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, [field]: validation.message }
      }));
    }
  };

  // Handle next step
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setState(prev => ({ ...prev, step: 'credentials' }));
    }
  };

  // Handle previous step
  const handlePreviousStep = () => {
    setState(prev => ({ ...prev, step: 'personal' }));
  };

  // Handle form restoration
  const handleAcceptRestoration = useCallback(() => {
    const restoredData = formPersistence.persistedData;
    if (restoredData) {
      setState(prev => ({
        ...prev,
        formData: {
          ...prev.formData,
          student_id: restoredData.student_id || "",
          email: restoredData.email || "",
          firstName: restoredData.firstName || "",
          lastName: restoredData.lastName || "",
          // Never restore passwords for security
        }
      }));
    }
    formPersistence.acceptRestoration();
  }, [formPersistence]);

  // Handle draft restoration
  const handleAcceptDraft = useCallback(() => {
    const draftData = draftManager.loadDraft();
    if (draftData) {
      setState(prev => ({
        ...prev,
        formData: {
          ...prev.formData,
          student_id: draftData.student_id || "",
          email: draftData.email || "",
          firstName: draftData.firstName || "",
          lastName: draftData.lastName || "",
          // Never restore passwords for security
        }
      }));
    }
    draftManager.acceptDraft();
  }, [draftManager]);

  // Clear persistence data on successful submit
  const handleSuccessfulSubmit = useCallback(() => {
    formPersistence.clearPersistedData();
    draftManager.clearDraft();
  }, [formPersistence, draftManager]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      if (onSubmit) {
        await onSubmit(state.formData);
      } else {
        // Use the registration API
        const registrationData = {
          student_id: state.formData.student_id,
          email: state.formData.email,
          password: state.formData.password,
          firstName: state.formData.firstName,
          lastName: state.formData.lastName,
        };
        
        const userData = await register(registrationData);
        setCredential(userData);
      }
      
      // Clear persistence data on successful registration
      handleSuccessfulSubmit();
      
      // Redirect to dashboard or login
      router.push("/?message=registration-success");
    } catch (error) {
      console.error("Registration error:", error);
      // Error is handled by the mutation hook
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Get validation icon for input fields
  const getValidationIcon = (field: keyof RegistrationDTO) => {
    const value = state.formData[field];
    if (!value) return null;
    
    // Show loading for validation or availability checks
    if (isValidating[field] || 
        (field === 'student_id' && isCheckingStudentId) ||
        (field === 'email' && isCheckingEmail)) {
      return (
        <svg className={`animate-spin text-gray-400 ${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }
    
    if (state.errors[field]) {
      return (
        <svg className={`text-red-500 ${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    
    // Show success for fields that have been validated and are available
    const isAvailable = field === 'student_id' 
      ? availabilityChecks.student_id?.available 
      : field === 'email' 
        ? availabilityChecks.email?.available 
        : true;
    
    if (isAvailable) {
      return (
        <svg className={`text-green-500 ${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return null;
  };

  // Get persisted field names for restoration prompt
  const getPersistedFields = (): string[] => {
    const fields: string[] = [];
    const data = formPersistence.persistedData;
    if (data?.student_id) fields.push('student_id');
    if (data?.email) fields.push('email');
    if (data?.firstName) fields.push('firstName');
    if (data?.lastName) fields.push('lastName');
    return fields;
  };

  return (
    <>
      {/* Form Restoration Prompt */}
      <FormRestorationPrompt
        isOpen={formPersistence.showRestorationPrompt}
        onAccept={handleAcceptRestoration}
        onReject={formPersistence.rejectRestoration}
        formType="registration"
        persistedFields={getPersistedFields()}
      />

      {/* Draft Notification */}
      <FormDraftNotification
        isVisible={draftManager.showDraftNotification}
        onAccept={handleAcceptDraft}
        onReject={draftManager.rejectDraft}
        draftAge={draftManager.draftAge}
        formType="registration"
      />

      <ResponsiveFormContainer variant="default" size="md" mobileOptimized>
      {/* Header */}
      <div className="text-center mb-6">
        <img 
          src="/logo.png" 
          alt="Logo" 
          className={`mx-auto mb-4 ${isMobile ? 'h-20' : 'h-16 sm:h-20'}`}
        />
        <h1 className={`font-semibold text-gray-900 mb-2 ${isMobile ? 'text-2xl' : 'text-xl sm:text-2xl'}`}>
          สมัครสมาชิก
        </h1>
        <p className={`text-gray-600 ${isMobile ? 'text-base' : 'text-sm sm:text-base'}`}>
          ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className={`font-medium ${state.step === 'personal' ? 'text-blue-600' : 'text-gray-500'} ${isMobile ? 'text-base' : 'text-sm'}`}>
            ข้อมูลส่วนตัว
          </span>
          <span className={`font-medium ${state.step === 'credentials' ? 'text-blue-600' : 'text-gray-500'} ${isMobile ? 'text-base' : 'text-sm'}`}>
            ข้อมูลการเข้าสู่ระบบ
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: state.step === 'personal' ? '50%' : '100%' }}
          ></div>
        </div>
      </div>

      {/* Error Message */}
      {registrationError && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {mapApiErrorToMessage(registrationError)}
        </div>
      )}

      <form onSubmit={state.step === 'credentials' ? handleSubmit : undefined} className={`space-y-4 ${isMobile ? 'space-y-5' : 'space-y-4'}`}>
        {state.step === 'personal' && (
          <>
            {/* Personal Information Step */}
            <div className={`space-y-4 ${isMobile ? 'space-y-5' : 'space-y-4'}`}>
              <h2 className={`font-medium text-gray-900 mb-4 ${isMobile ? 'text-xl' : 'text-lg'}`}>ข้อมูลส่วนตัว</h2>
              
              {/* First Name */}
              <ResponsiveInput
                fieldType="FIRST_NAME"
                label="ชื่อ"
                placeholder="กรุณากรอกชื่อ"
                value={state.formData.firstName}
                onChange={handleInputChange("firstName")}
                onBlur={handleInputBlur("firstName")}
                error={state.errors.firstName}
                fullWidth
                size={isMobile ? "lg" : "md"}
                mobileOptimized
                enableHapticFeedback
                rightIcon={getValidationIcon("firstName")}
              />

              {/* Last Name */}
              <ResponsiveInput
                fieldType="LAST_NAME"
                label="นามสกุล"
                placeholder="กรุณากรอกนามสกุล"
                value={state.formData.lastName}
                onChange={handleInputChange("lastName")}
                onBlur={handleInputBlur("lastName")}
                error={state.errors.lastName}
                fullWidth
                size={isMobile ? "lg" : "md"}
                mobileOptimized
                enableHapticFeedback
                rightIcon={getValidationIcon("lastName")}
              />

              {/* Student ID */}
              <ResponsiveInput
                fieldType="STUDENT_ID"
                label="รหัสนักศึกษา"
                placeholder="กรุณากรอกรหัสนักศึกษา (8-10 หลัก)"
                value={state.formData.student_id}
                onChange={handleInputChange("student_id")}
                onBlur={handleInputBlur("student_id")}
                error={state.errors.student_id}
                fullWidth
                size={isMobile ? "lg" : "md"}
                mobileOptimized
                enableHapticFeedback
                rightIcon={getValidationIcon("student_id")}
              />
            </div>

            {/* Next Button */}
            <ResponsiveButton
              type="button"
              variant="gradient"
              size={isMobile ? "xl" : "lg"}
              fullWidth
              onClick={handleNextStep}
              className={isMobile ? "mt-8" : "mt-6"}
              mobileOptimized
              touchOptimized
              enableHapticFeedback
            >
              ถัดไป
            </ResponsiveButton>
          </>
        )}

        {state.step === 'credentials' && (
          <>
            {/* Credentials Step */}
            <div className={`space-y-4 ${isMobile ? 'space-y-5' : 'space-y-4'}`}>
              <h2 className={`font-medium text-gray-900 mb-4 ${isMobile ? 'text-xl' : 'text-lg'}`}>ข้อมูลการเข้าสู่ระบบ</h2>
              
              {/* Email */}
              <ResponsiveInput
                fieldType="EMAIL"
                label="อีเมล"
                placeholder="กรุณากรอกอีเมล"
                value={state.formData.email}
                onChange={handleInputChange("email")}
                onBlur={handleInputBlur("email")}
                error={state.errors.email}
                fullWidth
                size={isMobile ? "lg" : "md"}
                mobileOptimized
                enableHapticFeedback
                rightIcon={getValidationIcon("email")}
              />

              {/* Password */}
              <ResponsiveInput
                fieldType="NEW_PASSWORD"
                label="รหัสผ่าน"
                placeholder="กรุณากรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                value={state.formData.password}
                onChange={handleInputChange("password")}
                onBlur={handleInputBlur("password")}
                error={state.errors.password}
                fullWidth
                size={isMobile ? "lg" : "md"}
                showPasswordToggle
                mobileOptimized
                enableHapticFeedback
                rightIcon={getValidationIcon("password")}
              />

              {/* Confirm Password */}
              <ResponsiveInput
                fieldType="NEW_PASSWORD"
                label="ยืนยันรหัสผ่าน"
                placeholder="กรุณากรอกรหัสผ่านอีกครั้ง"
                value={state.formData.confirmPassword}
                onChange={handleInputChange("confirmPassword")}
                onBlur={handleInputBlur("confirmPassword")}
                error={state.errors.confirmPassword}
                fullWidth
                size={isMobile ? "lg" : "md"}
                showPasswordToggle
                mobileOptimized
                enableHapticFeedback
                rightIcon={getValidationIcon("confirmPassword")}
              />
            </div>

            {/* Persistence Status Indicator */}
            {(isOffline || draftManager.isAutoSaving) && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 py-2">
                {draftManager.isAutoSaving && (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>กำลังบันทึกแบบร่าง...</span>
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

            {/* Action Buttons */}
            <div className={`flex gap-3 ${isMobile ? 'mt-8' : 'mt-6'}`}>
              <ResponsiveButton
                type="button"
                variant="outline"
                size={isMobile ? "xl" : "lg"}
                onClick={handlePreviousStep}
                className="flex-1"
                mobileOptimized
                touchOptimized
              >
                ย้อนกลับ
              </ResponsiveButton>
              <ResponsiveButton
                type="submit"
                variant="gradient"
                size={isMobile ? "xl" : "lg"}
                isLoading={state.isLoading || isRegistering}
                className="flex-1"
                mobileOptimized
                touchOptimized
                enableHapticFeedback
              >
                {(state.isLoading || isRegistering) ? VALIDATION_MESSAGES.LOADING.REGISTERING : "สมัครสมาชิก"}
              </ResponsiveButton>
            </div>
          </>
        )}

        {/* Login Link */}
        {showLoginLink && (
          <div className={`text-center ${isMobile ? 'mt-8' : 'mt-6'}`}>
            <p className={`text-gray-600 ${isMobile ? 'text-base' : 'text-sm'}`}>
              มีบัญชีอยู่แล้ว?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className={`text-blue-600 hover:text-blue-800 font-medium transition-colors ${
                  isMobile ? 'text-base py-2 px-3 min-h-[40px]' : ''
                }`}
              >
                เข้าสู่ระบบ
              </button>
            </p>
          </div>
        )}
      </form>
    </ResponsiveFormContainer>
  );
};