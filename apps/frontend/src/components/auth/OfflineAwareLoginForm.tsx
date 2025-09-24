import React, { useState, useEffect } from 'react';
import { useOfflineAuth } from '@/hooks/useOfflineAuth';
import OfflineStatus from '@/components/ui/OfflineStatus';

interface LoginFormData {
  student_id: string;
  password: string;
}

interface OfflineAwareLoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<any>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

const OfflineAwareLoginForm: React.FC<OfflineAwareLoginFormProps> = ({
  onSubmit,
  onSuccess,
  onError,
  className = '',
}) => {
  const [formData, setFormData] = useState<LoginFormData>({
    student_id: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string>('');

  const {
    isOnline,
    hasQueuedRequests,
    isProcessingQueue,
    saveFormData,
    restoreFormData,
    clearFormData,
    hasPersistedData,
    handleOfflineSubmit,
    getOfflineMessage,
    dismissOfflineMessage,
  } = useOfflineAuth({
    enableFormPersistence: true,
    enableRequestQueue: true,
    showOfflineMessages: true,
    autoRetryOnReconnect: true,
  });

  const FORM_ID = 'student-login';

  /**
   * Restore form data on component mount
   */
  useEffect(() => {
    const persistedData = restoreFormData<LoginFormData>(FORM_ID);
    if (persistedData) {
      setFormData(persistedData);
      setSubmitMessage('ข้อมูลที่บันทึกไว้ถูกกู้คืนแล้ว');
    }
  }, [restoreFormData]);

  /**
   * Save form data when it changes
   */
  useEffect(() => {
    if (formData.student_id || formData.password) {
      saveFormData(FORM_ID, formData);
    }
  }, [formData, saveFormData]);

  /**
   * Handle input changes
   */
  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear submit message when user modifies form
    if (submitMessage) {
      setSubmitMessage('');
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.student_id.trim()) {
      newErrors.student_id = 'กรุณากรอกรหัสนักศึกษา';
    } else if (!/^[0-9]{8,10}$/.test(formData.student_id)) {
      newErrors.student_id = 'รหัสนักศึกษาต้องเป็นตัวเลข 8-10 หลัก';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (formData.password.length < 6) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const result = await handleOfflineSubmit(
        FORM_ID,
        'login',
        formData,
        onSubmit
      );

      if (result.success) {
        setSubmitMessage('เข้าสู่ระบบสำเร็จ');
        clearFormData(FORM_ID);
        onSuccess?.();
      } else if (result.queued) {
        setSubmitMessage('คำขอถูกเก็บไว้ในคิว จะดำเนินการเมื่อเชื่อมต่ออินเทอร์เน็ตใหม่');
      } else {
        const errorMessage = result.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
        setSubmitMessage(errorMessage);
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
      setSubmitMessage(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Clear persisted data
   */
  const handleClearPersistedData = () => {
    clearFormData(FORM_ID);
    setFormData({ student_id: '', password: '' });
    setSubmitMessage('ข้อมูลที่บันทึกไว้ถูกลบแล้ว');
  };

  const offlineMessage = getOfflineMessage();

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {/* Offline Status Indicator */}
      {(!isOnline || hasQueuedRequests || isProcessingQueue) && (
        <div className="mb-4">
          <OfflineStatus
            showDetailedInfo={true}
            onStatusChange={(online) => {
              if (online && hasQueuedRequests) {
                setSubmitMessage('เชื่อมต่ออินเทอร์เน็ตแล้ว กำลังดำเนินการคำขอที่ค้างอยู่...');
              }
            }}
          />
        </div>
      )}

      {/* Offline Message */}
      {offlineMessage && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex justify-between items-start">
            <p className="text-sm text-yellow-800">{offlineMessage}</p>
            <button
              onClick={dismissOfflineMessage}
              className="text-yellow-600 hover:text-yellow-800 ml-2"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Persisted Data Notice */}
      {hasPersistedData(FORM_ID) && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-sm text-blue-800">
              มีข้อมูลที่บันทึกไว้ก่อนหน้านี้
            </p>
            <button
              onClick={handleClearPersistedData}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              ลบข้อมูล
            </button>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="student_id" className="block text-sm font-medium text-gray-700 mb-1">
            รหัสนักศึกษา
          </label>
          <input
            type="text"
            id="student_id"
            value={formData.student_id}
            onChange={(e) => handleInputChange('student_id', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.student_id ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="กรอกรหัสนักศึกษา 8-10 หลัก"
            inputMode="numeric"
            autoComplete="username"
            disabled={isSubmitting}
          />
          {errors.student_id && (
            <p className="mt-1 text-sm text-red-600">{errors.student_id}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            รหัสผ่าน
          </label>
          <input
            type="password"
            id="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="กรอกรหัสผ่าน"
            autoComplete="current-password"
            disabled={isSubmitting}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Submit Message */}
        {submitMessage && (
          <div className={`p-3 rounded-lg text-sm ${
            submitMessage.includes('สำเร็จ') || submitMessage.includes('คิว')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {submitMessage}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || isProcessingQueue}
          className={`w-full py-2 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isSubmitting || isProcessingQueue
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
              : isOnline
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-yellow-600 text-white hover:bg-yellow-700'
          }`}
        >
          {isSubmitting
            ? 'กำลังเข้าสู่ระบบ...'
            : isProcessingQueue
            ? 'กำลังดำเนินการคำขอที่ค้างอยู่...'
            : isOnline
            ? 'เข้าสู่ระบบ'
            : 'เข้าสู่ระบบ (จะส่งเมื่อเชื่อมต่อใหม่)'
          }
        </button>

        {/* Queue Status */}
        {hasQueuedRequests && (
          <div className="text-center">
            <p className="text-xs text-gray-600">
              มีคำขอที่ค้างอยู่ในคิว จะดำเนินการเมื่อเชื่อมต่ออินเทอร์เน็ตใหม่
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default OfflineAwareLoginForm;