/**
 * Example: Login Form with integrated error reporting and analytics
 * This demonstrates how to integrate the error reporting system with authentication forms
 */

import React, { useState } from 'react';
import { useAuthFormErrors, createValidators } from '../utils/authErrorIntegration';
import { ErrorReportModal } from '../components/ErrorReportModal';
import { AuthErrorBoundary } from '../components/AuthErrorBoundary';

interface LoginFormData {
  student_id: string;
  password: string;
}

export const LoginFormWithErrorReporting: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    student_id: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    errorState,
    clearErrors,
    clearFieldError,
    addValidationError,
    addAuthError,
    showReportModal,
    hideReportModal,
    submitErrorReport,
    getFieldError,
    getGeneralErrors,
    hasFieldError
  } = useAuthFormErrors();

  const validators = createValidators(addValidationError);

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (hasFieldError(field)) {
      clearFieldError(field);
    }
  };

  const validateForm = (): boolean => {
    clearErrors();
    let isValid = true;

    // Validate student ID
    if (!validators.validateRequired('student_id', formData.student_id)) {
      isValid = false;
    } else if (!validators.validateStudentId('student_id', formData.student_id)) {
      isValid = false;
    }

    // Validate password
    if (!validators.validateRequired('password', formData.password)) {
      isValid = false;
    } else if (!validators.validatePassword('password', formData.password)) {
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    clearErrors();

    try {
      // Simulate API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        (error as any).response = { status: response.status };
        throw error;
      }

      const data = await response.json();
      
      // Handle successful login
      console.log('Login successful:', data);
      
    } catch (error: any) {
      // Log and display error using error reporting system
      addAuthError(error, 'login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportSubmit = async (
    userFeedback?: string,
    reproductionSteps?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) => {
    try {
      await submitErrorReport(userFeedback, reproductionSteps, severity);
    } catch (err) {
      console.error('Failed to submit error report:', err);
    }
  };

  const studentIdError = getFieldError('student_id');
  const passwordError = getFieldError('password');
  const generalErrors = getGeneralErrors();

  return (
    <AuthErrorBoundary>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              เข้าสู่ระบบ
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              สำหรับนักศึกษา
            </p>
          </div>

          {/* General Error Messages */}
          {generalErrors.length > 0 && (
            <div className="space-y-2">
              {generalErrors.map((error, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm text-red-800">{error.message}</p>
                      {error.errorId && (
                        <button
                          onClick={showReportModal}
                          className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                        >
                          รายงานปัญหานี้
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Student ID Field */}
              <div>
                <label htmlFor="student_id" className="block text-sm font-medium text-gray-700">
                  รหัสนักศึกษา
                </label>
                <input
                  id="student_id"
                  name="student_id"
                  type="text"
                  inputMode="numeric"
                  autoComplete="username"
                  value={formData.student_id}
                  onChange={(e) => handleInputChange('student_id', e.target.value)}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    studentIdError ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="กรอกรหัสนักศึกษา 8-10 หลัก"
                />
                {studentIdError && (
                  <p className="mt-1 text-sm text-red-600">{studentIdError.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  รหัสผ่าน
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    passwordError ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="กรอกรหัสผ่าน"
                />
                {passwordError && (
                  <p className="mt-1 text-sm text-red-600">{passwordError.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  ลืมรหัสผ่าน?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                ยังไม่มีบัญชี?{' '}
                <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                  สมัครสมาชิก
                </a>
              </p>
            </div>
          </form>

          {/* Error Report Modal */}
          {errorState.reportableErrorId && (
            <ErrorReportModal
              isOpen={errorState.showReportModal}
              onClose={hideReportModal}
              errorId={errorState.reportableErrorId}
              errorMessage={generalErrors[0]?.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}
              onReportSubmitted={() => {
                console.log('Error report submitted successfully');
              }}
            />
          )}
        </div>
      </div>
    </AuthErrorBoundary>
  );
};