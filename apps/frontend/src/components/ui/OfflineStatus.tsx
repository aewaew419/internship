import React, { useState, useEffect } from 'react';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';

interface OfflineStatusProps {
  className?: string;
  showDetailedInfo?: boolean;
  autoHideDelay?: number;
  onStatusChange?: (isOnline: boolean) => void;
}

const OfflineStatus: React.FC<OfflineStatusProps> = ({
  className = '',
  showDetailedInfo = false,
  autoHideDelay = 3000,
  onStatusChange,
}) => {
  const { 
    isOnline, 
    isChecking, 
    lastChecked, 
    retryCount, 
    checkConnection, 
    retry, 
    resetRetryCount 
  } = useOfflineDetection();

  const [isVisible, setIsVisible] = useState(!isOnline);
  const [justCameOnline, setJustCameOnline] = useState(false);

  // Handle status changes
  useEffect(() => {
    onStatusChange?.(isOnline);

    if (isOnline) {
      setJustCameOnline(true);
      setIsVisible(true);
      
      // Auto-hide success message after delay
      const timer = setTimeout(() => {
        setIsVisible(false);
        setJustCameOnline(false);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
      setJustCameOnline(false);
    }
  }, [isOnline, autoHideDelay, onStatusChange]);

  if (!isVisible) {
    return null;
  }

  const getStatusColor = () => {
    if (justCameOnline) return 'bg-green-50 border-green-200 text-green-800';
    if (isOnline) return 'bg-green-50 border-green-200 text-green-800';
    return 'bg-red-50 border-red-200 text-red-800';
  };

  const getIconColor = () => {
    if (justCameOnline) return 'text-green-500';
    if (isOnline) return 'text-green-500';
    return 'text-red-500';
  };

  const formatLastChecked = () => {
    if (!lastChecked) return 'ไม่เคยตรวจสอบ';
    
    const now = new Date();
    const diff = now.getTime() - lastChecked.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes} นาทีที่แล้ว`;
    }
    return `${seconds} วินาทีที่แล้ว`;
  };

  const getStatusMessage = () => {
    if (isChecking) {
      return {
        title: 'กำลังตรวจสอบการเชื่อมต่อ',
        description: 'กรุณารอสักครู่...'
      };
    }

    if (justCameOnline) {
      return {
        title: 'เชื่อมต่ออินเทอร์เน็ตสำเร็จ',
        description: 'คุณสามารถใช้งานระบบได้ตามปกติแล้ว'
      };
    }

    if (isOnline) {
      return {
        title: 'เชื่อมต่ออินเทอร์เน็ตแล้ว',
        description: 'ระบบทำงานปกติ'
      };
    }

    return {
      title: 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต',
      description: 'กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง'
    };
  };

  const handleManualCheck = async () => {
    await checkConnection();
  };

  const handleRetry = () => {
    retry();
  };

  const handleDismiss = () => {
    if (isOnline) {
      setIsVisible(false);
      resetRetryCount();
    }
  };

  const { title, description } = getStatusMessage();

  return (
    <div className={`rounded-lg border p-4 ${getStatusColor()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {isChecking ? (
            <svg className={`h-5 w-5 animate-spin ${getIconColor()}`} fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : isOnline ? (
            <svg className={`h-5 w-5 ${getIconColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg className={`h-5 w-5 ${getIconColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          )}
        </div>

        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="mt-1 text-sm opacity-75">{description}</p>

          {showDetailedInfo && (
            <div className="mt-2 text-xs opacity-60">
              <p>ตรวจสอบล่าสุด: {formatLastChecked()}</p>
              {retryCount > 0 && (
                <p>จำนวนครั้งที่ลองใหม่: {retryCount}</p>
              )}
            </div>
          )}

          <div className="mt-3 flex space-x-2">
            {!isOnline && (
              <button
                onClick={handleRetry}
                disabled={isChecking}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChecking ? 'กำลังลองใหม่...' : 'ลองใหม่'}
              </button>
            )}

            <button
              onClick={handleManualCheck}
              disabled={isChecking}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChecking ? 'กำลังตรวจสอบ...' : 'ตรวจสอบการเชื่อมต่อ'}
            </button>

            {isOnline && (
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                ปิด
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineStatus;