'use client';

import { useState, useEffect } from 'react';
import { WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      
      // Hide the "back online" indicator after 3 seconds
      setTimeout(() => {
        setShowIndicator(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show indicator if online and not recently changed
  if (isOnline && !showIndicator) {
    return null;
  }

  return (
    <div className={`fixed top-16 left-4 right-4 md:top-4 md:left-4 md:right-auto md:max-w-sm z-50 ${
      showIndicator ? 'animate-in slide-in-from-top-2' : ''
    }`}>
      <div className={`rounded-lg p-3 shadow-lg border ${
        isOnline 
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <WifiIcon className="w-5 h-5 text-green-600" />
          ) : (
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
          )}
          
          <div className="flex-1">
            <p className="text-sm font-medium">
              {isOnline ? 'เชื่อมต่ออินเทอร์เน็ตแล้ว' : 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต'}
            </p>
            {!isOnline && (
              <p className="text-xs opacity-75 mt-1">
                บางฟีเจอร์อาจไม่สามารถใช้งานได้
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};