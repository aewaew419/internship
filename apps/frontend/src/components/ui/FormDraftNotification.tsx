"use client";

import { useState, useEffect } from "react";
import { ResponsiveButton } from "@/components/ui/Button/ResponsiveButton";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface FormDraftNotificationProps {
  isVisible: boolean;
  onAccept: () => void;
  onReject: () => void;
  draftAge: number;
  formType: 'student-login' | 'admin-login' | 'registration';
  autoHideDelay?: number;
}

export const FormDraftNotification = ({
  isVisible,
  onAccept,
  onReject,
  draftAge,
  formType,
  autoHideDelay = 10000, // 10 seconds
}: FormDraftNotificationProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(autoHideDelay / 1000);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Auto-hide countdown
  useEffect(() => {
    if (isVisible && !isExpanded) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            onReject(); // Auto-reject if user doesn't interact
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isVisible, isExpanded, onReject]);

  // Reset timer when visibility changes
  useEffect(() => {
    if (isVisible) {
      setTimeLeft(autoHideDelay / 1000);
    }
  }, [isVisible, autoHideDelay]);

  if (!isVisible) return null;

  const formatDraftAge = (age: number): string => {
    const minutes = Math.floor(age / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} วันที่แล้ว`;
    if (hours > 0) return `${hours} ชั่วโมงที่แล้ว`;
    if (minutes > 0) return `${minutes} นาทีที่แล้ว`;
    return 'เมื่อสักครู่';
  };

  const getFormTypeText = () => {
    switch (formType) {
      case 'student-login':
        return 'เข้าสู่ระบบนักศึกษา';
      case 'admin-login':
        return 'เข้าสู่ระบบผู้ดูแล';
      case 'registration':
        return 'สมัครสมาชิก';
      default:
        return 'ฟอร์ม';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isMobile ? 'left-4 right-4' : 'max-w-sm'
    }`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
        {/* Compact View */}
        {!isExpanded && (
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  พบข้อมูลที่บันทึกไว้
                </p>
                <p className="text-xs text-gray-600">
                  ฟอร์ม{getFormTypeText()} • {formatDraftAge(draftAge)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <ResponsiveButton
                    size="xs"
                    variant="gradient"
                    onClick={onAccept}
                    className="text-xs"
                  >
                    กู้คืน
                  </ResponsiveButton>
                  <ResponsiveButton
                    size="xs"
                    variant="ghost"
                    onClick={onReject}
                    className="text-xs"
                  >
                    ยกเลิก
                  </ResponsiveButton>
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="text-xs text-gray-500 hover:text-gray-700 ml-auto"
                  >
                    รายละเอียด
                  </button>
                </div>
              </div>
            </div>
            
            {/* Auto-hide progress bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-600 h-1 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(timeLeft / (autoHideDelay / 1000)) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                ซ่อนอัตโนมัติใน {timeLeft} วินาที
              </p>
            </div>
          </div>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="font-medium text-gray-900">ข้อมูลที่บันทึกไว้</h3>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">ประเภทฟอร์ม:</span>
                  <span className="font-medium text-gray-900">{getFormTypeText()}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">บันทึกเมื่อ:</span>
                  <span className="font-medium text-gray-900">{formatDraftAge(draftAge)}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      ข้อมูลจะถูกลบอัตโนมัติ
                    </p>
                    <p className="text-xs text-blue-700">
                      เพื่อความปลอดภัย ข้อมูลจะถูกลบหลังจาก 24 ชั่วโมง
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <ResponsiveButton
                  variant="gradient"
                  size="sm"
                  onClick={onAccept}
                  className="flex-1"
                  mobileOptimized
                  touchOptimized
                >
                  กู้คืนข้อมูล
                </ResponsiveButton>
                <ResponsiveButton
                  variant="outline"
                  size="sm"
                  onClick={onReject}
                  className="flex-1"
                  mobileOptimized
                  touchOptimized
                >
                  ลบข้อมูล
                </ResponsiveButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormDraftNotification;