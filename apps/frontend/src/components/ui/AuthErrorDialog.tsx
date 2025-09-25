"use client";

import { useState } from 'react';
import { Button } from './Button';
import { ResponsiveButton } from './Button/ResponsiveButton';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { ProcessedAuthError } from '@/lib/auth/error-handler';

export interface AuthErrorDialogProps {
  isOpen: boolean;
  error: ProcessedAuthError | null;
  onClose: () => void;
  onRetry?: () => Promise<void>;
  onFeedback?: (feedback: string) => void;
  className?: string;
}

export const AuthErrorDialog = ({
  isOpen,
  error,
  onClose,
  onRetry,
  onFeedback,
  className = '',
}: AuthErrorDialogProps) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!isOpen || !error) return null;

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
      onClose();
    } catch (retryError) {
      // Error will be handled by the error handler
    } finally {
      setIsRetrying(false);
    }
  };

  const handleFeedbackSubmit = () => {
    if (feedback.trim() && onFeedback) {
      onFeedback(feedback.trim());
      setFeedbackSubmitted(true);
      setTimeout(() => {
        setShowFeedback(false);
        setFeedback('');
        setFeedbackSubmitted(false);
      }, 2000);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'high':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`
          relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto
          ${isMobile ? 'max-w-sm' : 'max-w-md'}
          ${className}
        `}>
          {/* Header */}
          <div className={`
            flex items-center gap-3 p-4 border-b border-gray-200
            ${getSeverityColor(error.severity)}
          `}>
            {getSeverityIcon(error.severity)}
            <div className="flex-1">
              <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
                {getErrorTitle(error.code)}
              </h3>
              <p className={`text-sm opacity-75 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {error.category} • {error.severity}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Error Message */}
            <div>
              <p className={`text-gray-700 ${isMobile ? 'text-sm' : 'text-base'}`}>
                {error.userMessage}
              </p>
            </div>

            {/* Recovery Steps */}
            {error.recovery.recoverySteps.length > 0 && (
              <div>
                <h4 className={`font-medium text-gray-900 mb-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  วิธีแก้ไข:
                </h4>
                <ul className="space-y-2">
                  {error.recovery.recoverySteps.map((step, index) => (
                    <li key={step.id} className="flex items-start gap-2">
                      <span className={`
                        flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium
                        ${step.isRequired ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}
                        ${isMobile ? 'w-4 h-4 text-xs' : 'w-5 h-5 text-xs'}
                      `}>
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className={`font-medium text-gray-900 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {step.title}
                        </p>
                        <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {step.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Actions */}
            {error.recovery.suggestedActions.length > 0 && (
              <div>
                <h4 className={`font-medium text-gray-900 mb-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  คำแนะนำ:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  {error.recovery.suggestedActions.map((action, index) => (
                    <li key={index} className={isMobile ? 'text-xs' : 'text-sm'}>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Retry Information */}
            {error.recovery.retryAfter && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <p className={`text-yellow-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    สามารถลองใหม่ได้ในอีก {Math.ceil(error.recovery.retryAfter / 60)} นาที
                  </p>
                </div>
              </div>
            )}

            {/* Feedback Section */}
            {!showFeedback && !feedbackSubmitted && (
              <div className="pt-2">
                <button
                  onClick={() => setShowFeedback(true)}
                  className={`text-blue-600 hover:text-blue-700 transition-colors ${isMobile ? 'text-xs' : 'text-sm'}`}
                >
                  💬 แจ้งปัญหาเพิ่มเติม
                </button>
              </div>
            )}

            {showFeedback && !feedbackSubmitted && (
              <div className="space-y-3">
                <div>
                  <label className={`block font-medium text-gray-700 mb-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
                    รายละเอียดเพิ่มเติม (ไม่บังคับ):
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="กรุณาอธิบายสิ่งที่เกิดขึ้นหรือสิ่งที่คุณคาดหวัง..."
                    className={`
                      w-full border border-gray-300 rounded-md px-3 py-2 
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${isMobile ? 'text-sm min-h-[80px]' : 'text-base min-h-[100px]'}
                    `}
                    rows={isMobile ? 3 : 4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleFeedbackSubmit}
                    disabled={!feedback.trim()}
                    size={isMobile ? 'sm' : 'md'}
                    className="flex-1"
                  >
                    ส่งข้อมูล
                  </Button>
                  <Button
                    onClick={() => setShowFeedback(false)}
                    variant="outline"
                    size={isMobile ? 'sm' : 'md'}
                  >
                    ยกเลิก
                  </Button>
                </div>
              </div>
            )}

            {feedbackSubmitted && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <p className={`text-green-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    ขอบคุณสำหรับข้อมูลเพิ่มเติม
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-4 border-t border-gray-200">
            {error.recovery.canRetry && onRetry && (
              <ResponsiveButton
                onClick={handleRetry}
                isLoading={isRetrying}
                disabled={isRetrying || !!error.recovery.retryAfter}
                variant="primary"
                size={isMobile ? 'sm' : 'md'}
                className="flex-1"
                mobileOptimized
              >
                {isRetrying ? 'กำลังลองใหม่...' : 'ลองใหม่'}
              </ResponsiveButton>
            )}
            
            <ResponsiveButton
              onClick={onClose}
              variant="outline"
              size={isMobile ? 'sm' : 'md'}
              className={error.recovery.canRetry && onRetry ? 'flex-1' : 'w-full'}
              mobileOptimized
            >
              {error.recovery.canRetry && onRetry ? 'ปิด' : 'เข้าใจแล้ว'}
            </ResponsiveButton>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Get user-friendly error title
 */
function getErrorTitle(errorCode: string): string {
  switch (errorCode) {
    case 'AUTH_INVALID_CREDENTIALS':
      return 'ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง';
    case 'AUTH_ACCOUNT_LOCKED':
      return 'บัญชีถูกล็อค';
    case 'AUTH_ACCOUNT_DISABLED':
      return 'บัญชีถูกปิดใช้งาน';
    case 'AUTH_TOO_MANY_ATTEMPTS':
      return 'พยายามเข้าสู่ระบบบ่อยเกินไป';
    case 'NETWORK_ERROR':
      return 'ปัญหาการเชื่อมต่อ';
    case 'SERVER_ERROR':
      return 'ข้อผิดพลาดของระบบ';
    case 'REGISTRATION_EMAIL_EXISTS':
    case 'REGISTRATION_STUDENT_ID_EXISTS':
      return 'ข้อมูลซ้ำในระบบ';
    case 'VALIDATION_INVALID_STUDENT_ID':
    case 'VALIDATION_INVALID_EMAIL':
    case 'VALIDATION_WEAK_PASSWORD':
      return 'ข้อมูลไม่ถูกต้อง';
    default:
      return 'เกิดข้อผิดพลาด';
  }
}