import React from 'react';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';

interface OfflineIndicatorProps {
  className?: string;
  showWhenOnline?: boolean;
  position?: 'top' | 'bottom' | 'fixed-top' | 'fixed-bottom';
  onRetry?: () => void;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showWhenOnline = false,
  position = 'fixed-top',
  onRetry,
}) => {
  const { isOnline, isChecking, retry, retryCount } = useOfflineDetection();

  // Don't show anything if online and showWhenOnline is false
  if (isOnline && !showWhenOnline) {
    return null;
  }

  const handleRetry = () => {
    retry();
    onRetry?.();
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'fixed-top':
        return 'fixed top-0 left-0 right-0 z-50';
      case 'fixed-bottom':
        return 'fixed bottom-0 left-0 right-0 z-50';
      case 'top':
        return 'relative';
      case 'bottom':
        return 'relative';
      default:
        return 'fixed top-0 left-0 right-0 z-50';
    }
  };

  const getStatusClasses = () => {
    if (isOnline) {
      return 'bg-green-500 text-white';
    }
    return 'bg-red-500 text-white';
  };

  const getStatusIcon = () => {
    if (isChecking) {
      return (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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
      );
    }

    if (isOnline) {
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }

    return (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
    );
  };

  const getStatusMessage = () => {
    if (isChecking) {
      return 'กำลังตรวจสอบการเชื่อมต่อ...';
    }

    if (isOnline) {
      return 'เชื่อมต่ออินเทอร์เน็ตแล้ว';
    }

    return 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต';
  };

  return (
    <div className={`${getPositionClasses()} ${className}`}>
      <div className={`${getStatusClasses()} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusMessage()}</span>
          {retryCount > 0 && !isOnline && (
            <span className="text-xs opacity-75">
              (ลองครั้งที่ {retryCount})
            </span>
          )}
        </div>

        {!isOnline && !isChecking && (
          <button
            onClick={handleRetry}
            className="text-sm underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded px-2 py-1"
            disabled={isChecking}
          >
            ลองใหม่
          </button>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;