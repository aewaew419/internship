"use client";

import { useState, useEffect } from 'react';
import { Button } from './Button';
import { formatSessionTime, type SessionWarningProps } from '@/lib/security';

interface SessionTimeoutWarningModalProps extends SessionWarningProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionTimeoutWarning = ({ 
  isOpen, 
  remainingTime, 
  onExtend, 
  onLogout, 
  onClose 
}: SessionTimeoutWarningModalProps) => {
  const [timeLeft, setTimeLeft] = useState(remainingTime);

  useEffect(() => {
    setTimeLeft(remainingTime);
  }, [remainingTime]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          onLogout();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onLogout]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              เซสชันกำลังจะหมดอายุ
            </h3>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3">
            เซสชันของคุณจะหมดอายุใน
          </p>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {formatSessionTime(timeLeft)}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${Math.max(0, (timeLeft / remainingTime) * 100)}%` 
                }}
              />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-3 text-center">
            คุณต้องการขยายเวลาเซสชันหรือไม่?
          </p>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onLogout}
            className="flex-1"
          >
            ออกจากระบบ
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onExtend();
              onClose();
            }}
            className="flex-1"
          >
            ขยายเวลา
          </Button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          หากไม่มีการดำเนินการ ระบบจะออกจากระบบโดยอัตโนมัติ
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning;