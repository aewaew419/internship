'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface LoginFormData {
  student_id: string;
  password: string;
}

export default function OldLoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    student_id: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Call real API through Next.js proxy
      const response = await fetch('/api/v1/student-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: formData.student_id,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        alert(`🎉 เข้าสู่ระบบสำเร็จ!\n\nรหัสนักศึกษา: ${data.user.student_id}\nชื่อ: ${data.user.first_name} ${data.user.last_name}\nบทบาท: ${data.user.role}`);
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.error || 'รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
      
      <div className="old-login-container">
        <div className="old-login-logo">
          <Image src="/logo.png" alt="Logo" width={80} height={80} />
        </div>
        
        <h1 className="old-login-title">เข้าสู่ระบบ</h1>
        <p className="old-login-subtitle">
          ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน
        </p>

        <form onSubmit={handleSubmit} className="old-login-form">
          {error && (
            <p className="text-right text-xs text-red-600 -mb-3">{error}</p>
          )}
          
          <div className="old-login-field">
            <label htmlFor="student_id">รหัสนักศึกษา</label>
            <input
              type="text"
              id="student_id"
              name="student_id"
              placeholder="รหัสนักศึกษา"
              value={formData.student_id}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="old-login-field">
            <label htmlFor="password">รหัสผ่าน</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="รหัสผ่าน"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          <button
            type="submit"
            className="old-login-button"
            disabled={isLoading}
          >
            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>

          <button
            type="button"
            className="old-login-forgot"
            onClick={() => setShowForgotPassword(true)}
          >
            ลืมรหัสผ่าน
          </button>
        </form>
      </div>
    </>
  );
}

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [studentId, setStudentId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('ระบบจะส่งลิงก์เพื่อเปลี่ยนรหัสผ่านไปยังอีเมลที่ลงทะเบียนไว้');
    onClose();
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-50">
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg">
        <div
          onClick={onClose}
          className="ml-auto cursor-pointer w-fit mb-4"
        >
          ✕
        </div>
        
        <div className="px-12">
          <p className="text-center text-2xl font-bold mb-6">
            ลืมรหัสผ่าน
          </p>
          
          <form onSubmit={handleSubmit} className="text-center">
            <input
              type="text"
              placeholder="รหัสนักศึกษา"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded mb-4"
              required
            />
            
            <p className="font-semibold text-lg mb-4">
              ระบบจะส่งลิงก์เพื่อเปลี่ยนรหัสผ่าน
            </p>

            <button
              type="submit"
              className="bg-gradient text-white px-12 py-2 text-lg rounded"
            >
              ส่งอีกครั้ง
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}