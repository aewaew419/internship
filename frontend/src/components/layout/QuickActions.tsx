'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { PROTECTED_PATH } from '@/constants/navigation';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  CloudArrowUpIcon, 
  EyeIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface QuickAction {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  color: string;
  roles?: string[];
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'upload-document',
    name: 'อัปโหลดเอกสาร',
    description: 'อัปโหลดเอกสารประกอบคำร้อง',
    path: PROTECTED_PATH.DOCUMENTS_UPLOAD,
    icon: <CloudArrowUpIcon className="w-6 h-6" />,
    color: 'bg-blue-500',
    roles: ['student']
  },
  {
    id: 'check-status',
    name: 'ติดตามสถานะ',
    description: 'ดูสถานะคำร้องขอฝึกงาน',
    path: PROTECTED_PATH.INTERN_REQUEST_STATUS,
    icon: <EyeIcon className="w-6 h-6" />,
    color: 'bg-green-500',
    roles: ['student']
  },
  {
    id: 'new-request',
    name: 'ยื่นคำร้องใหม่',
    description: 'สร้างคำร้องขอฝึกงานใหม่',
    path: PROTECTED_PATH.REGISTER_PERSONAL_INFO,
    icon: <DocumentTextIcon className="w-6 h-6" />,
    color: 'bg-purple-500',
    roles: ['student']
  },
  {
    id: 'notifications',
    name: 'การแจ้งเตือน',
    description: 'ดูการแจ้งเตือนทั้งหมด',
    path: PROTECTED_PATH.NOTIFICATIONS,
    icon: <BellIcon className="w-6 h-6" />,
    color: 'bg-orange-500'
  },
  {
    id: 'settings',
    name: 'ตั้งค่า',
    description: 'จัดการการตั้งค่าบัญชี',
    path: PROTECTED_PATH.NOTIFICATIONS_SETTINGS,
    icon: <Cog6ToothIcon className="w-6 h-6" />,
    color: 'bg-gray-500'
  }
];

export const QuickActions = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;

  // Filter actions based on user roles
  const availableActions = QUICK_ACTIONS.filter(action => {
    if (!action.roles) return true;
    
    return action.roles.some(role => {
      switch (role) {
        case 'student':
          return user.roles.student;
        case 'instructor':
          return user.roles.courseInstructor;
        case 'admin':
          return user.user.roleId === 1;
        default:
          return false;
      }
    });
  });

  const handleActionClick = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center ${
            isOpen ? 'rotate-45' : ''
          }`}
          aria-label="เปิดเมนูด่วน"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Quick Actions Menu */}
      {isOpen && (
        <div className="fixed bottom-36 right-4 md:bottom-20 md:right-6 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 w-72 animate-in slide-in-from-bottom-2 fade-in-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">เมนูด่วน</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              {availableActions.map((action, index) => (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action.path)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {action.name}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">
                      {action.description}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Quick tip */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                💡 เคล็ดลับ: กดปุ่ม + เพื่อเข้าถึงฟีเจอร์ที่ใช้บ่อย
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};