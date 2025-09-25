"use client";

import { useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { ProcessedAuthError } from '@/lib/auth/error-handler';

export interface AuthErrorAlertProps {
  error: ProcessedAuthError | null;
  onRetry?: () => Promise<void>;
  onDismiss?: () => void;
  onFeedback?: (feedback: string) => void;
  showRecoverySteps?: boolean;
  compact?: boolean;
  className?: string;
}

export const AuthErrorAlert = ({
  error,
  onRetry,
  onDismiss,
  onFeedback,
  showRecoverySteps = false,
  compact = false,
  className = '',
}: AuthErrorAlertProps) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!error) return null;

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
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
      }, 3000);
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-500',
          button: 'text-red-600 hover:text-red-700',
        };
      case 'high':
        return {
          container: 'bg-orange-50 border-orange-200 text-orange-800',
          icon: 'text-orange-500',
          button: 'text-orange-600 hover:text-orange-700',
        };
      case 'medium':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: 'text-yellow-500',
          button: 'text-yellow-600 hover:text-yellow-700',
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-500',
          button: 'text-blue-600 hover:text-blue-700',
        };
    }
  };

  const styles = getSeverityStyles(error.severity);

  const getSeverityIcon = (severity: string) => {
    const iconClass = `${isMobile ? 'w-5 h-5' : 'w-6 h-6'} ${styles.icon}`;
    
    switch (severity) {
      case 'critical':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'high':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className={`
      border rounded-md ${styles.container}
      ${compact ? 'p-3' : 'p-4'}
      ${className}
    `}>
      {/* Main Error Content */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getSeverityIcon(error.severity)}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Error Message */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={`font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
                {error.userMessage}
              </p>
              
              {!compact && error.recovery.suggestedActions.length > 0 && (
                <div className="mt-2">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-75 mb-1`}>
                    คำแนะนำ:
                  </p>
                  <ul className={`list-disc list-inside space-y-0.5 ${isMobile ? 'text-xs' : 'text-sm'} opacity-90`}>
                    {error.recovery.suggestedActions.slice(0, isExpanded ? undefined : 2).map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                  
                  {error.recovery.suggestedActions.length > 2 && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className={`mt-1 ${styles.button} ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}
                    >
                      {isExpanded ? 'แสดงน้อยลง' : `แสดงเพิ่มเติม (${error.recovery.suggestedActions.length - 2})`}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Dismiss Button */}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>

          {/* Recovery Steps */}
          {showRecoverySteps && error.recovery.recoverySteps.length > 0 && (
            <div className="mt-3 pt-3 border-t border-current border-opacity-20">
              <p className={`font-medium mb-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
                วิธีแก้ไข:
              </p>
              <ol className="space-y-2">
                {error.recovery.recoverySteps.map((step, index) => (
                  <li key={step.id} className="flex items-start gap-2">
                    <span className={`
                      flex-shrink-0 rounded-full flex items-center justify-center font-medium
                      ${step.isRequired ? 'bg-current bg-opacity-20' : 'bg-current bg-opacity-10'}
                      ${isMobile ? 'w-4 h-4 text-xs' : 'w-5 h-5 text-xs'}
                    `}>
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        {step.title}
                      </p>
                      <p className={`opacity-75 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Retry Information */}
          {error.recovery.retryAfter && (
            <div className="mt-3 pt-3 border-t border-current border-opacity-20">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-90`}>
                  สามารถลองใหม่ได้ในอีก {Math.ceil(error.recovery.retryAfter / 60)} นาที
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {/* Retry Button */}
            {error.recovery.canRetry && onRetry && (
              <button
                onClick={handleRetry}
                disabled={isRetrying || !!error.recovery.retryAfter}
                className={`
                  inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors
                  ${styles.button} bg-current bg-opacity-10 hover:bg-opacity-20
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${isMobile ? 'text-xs' : 'text-sm'}
                `}
              >
                {isRetrying && (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isRetrying ? 'กำลังลองใหม่...' : 'ลองใหม่'}
              </button>
            )}

            {/* Feedback Button */}
            {!showFeedback && !feedbackSubmitted && onFeedback && (
              <button
                onClick={() => setShowFeedback(true)}
                className={`${styles.button} ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}
              >
                💬 แจ้งปัญหา
              </button>
            )}
          </div>

          {/* Feedback Form */}
          {showFeedback && !feedbackSubmitted && (
            <div className="mt-3 pt-3 border-t border-current border-opacity-20 space-y-2">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="กรุณาอธิบายสิ่งที่เกิดขึ้น..."
                className={`
                  w-full border border-gray-300 rounded-md px-3 py-2 
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${isMobile ? 'text-xs min-h-[60px]' : 'text-sm min-h-[80px]'}
                `}
                rows={isMobile ? 2 : 3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={!feedback.trim()}
                  className={`
                    px-3 py-1.5 rounded-md font-medium transition-colors
                    ${styles.button} bg-current bg-opacity-10 hover:bg-opacity-20
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isMobile ? 'text-xs' : 'text-sm'}
                  `}
                >
                  ส่ง
                </button>
                <button
                  onClick={() => setShowFeedback(false)}
                  className={`${styles.button} ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}

          {/* Feedback Success */}
          {feedbackSubmitted && (
            <div className="mt-3 pt-3 border-t border-current border-opacity-20">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <p className={`text-green-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  ขอบคุณสำหรับข้อมูลเพิ่มเติม
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};