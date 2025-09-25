"use client";

import { useState } from "react";
import { ResponsiveButton } from "@/components/ui/Button/ResponsiveButton";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface FormRestorationPromptProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
  formType: 'student-login' | 'admin-login' | 'registration';
  persistedFields?: string[];
}

export const FormRestorationPrompt = ({
  isOpen,
  onAccept,
  onReject,
  formType,
  persistedFields = [],
}: FormRestorationPromptProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (!isOpen) return null;

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

  const handleAccept = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onAccept();
      setIsAnimating(false);
    }, 150);
  };

  const handleReject = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onReject();
      setIsAnimating(false);
    }, 150);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all duration-200 ${
          isAnimating ? 'scale-95 opacity-90' : 'scale-100 opacity-100'
        } ${isMobile ? 'mx-4' : ''}`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg 
                className="w-8 h-8 text-blue-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
            </div>
            <div>
              <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                พบข้อมูลที่บันทึกไว้
              </h3>
              <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-base'}`}>
                ระบบพบข้อมูลฟอร์ม{getFormTypeText()}ที่บันทึกไว้
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className={`text-gray-700 mb-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
              ต้องการกู้คืนข้อมูลที่กรอกไว้หรือไม่? ข้อมูลที่จะกู้คืน:
            </p>
            
            {persistedFields.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <ul className="space-y-1">
                  {persistedFields.map((field, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {getFieldDisplayName(field)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className={`text-blue-800 font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
                    หมายเหตุ
                  </p>
                  <p className={`text-blue-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    ข้อมูลรหัสผ่านจะไม่ถูกบันทึกเพื่อความปลอดภัย
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className={`flex gap-3 ${isMobile ? 'flex-col-reverse' : 'flex-row-reverse'}`}>
            <ResponsiveButton
              variant="gradient"
              size={isMobile ? "lg" : "md"}
              onClick={handleAccept}
              className={isMobile ? "w-full" : ""}
              mobileOptimized
              touchOptimized
              enableHapticFeedback
            >
              กู้คืนข้อมูล
            </ResponsiveButton>
            
            <ResponsiveButton
              variant="outline"
              size={isMobile ? "lg" : "md"}
              onClick={handleReject}
              className={isMobile ? "w-full" : ""}
              mobileOptimized
              touchOptimized
            >
              เริ่มใหม่
            </ResponsiveButton>
          </div>
          
          {isMobile && (
            <p className="text-xs text-gray-500 text-center mt-3">
              แตะนอกกรอบเพื่อปิด
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Get display name for form fields in Thai
 */
const getFieldDisplayName = (field: string): string => {
  const fieldNames: Record<string, string> = {
    email: 'อีเมล',
    studentId: 'รหัสนักศึกษา',
    student_id: 'รหัสนักศึกษา',
    firstName: 'ชื่อ',
    lastName: 'นามสกุล',
    password: 'รหัสผ่าน',
    confirmPassword: 'ยืนยันรหัสผ่าน',
  };
  
  return fieldNames[field] || field;
};

export default FormRestorationPrompt;