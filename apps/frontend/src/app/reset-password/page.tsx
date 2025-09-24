import { Suspense } from 'react';
import { PasswordResetForm } from '@/components/forms/PasswordResetForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        }>
          <PasswordResetForm />
        </Suspense>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'เปลี่ยนรหัสผ่าน - ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน',
  description: 'เปลี่ยนรหัสผ่านใหม่สำหรับระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน',
};