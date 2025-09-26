'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface LoginFormData {
  email: string;
  password: string;
}

export default function OldLoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
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
      // Call your Next.js API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        // Handle successful login
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      } else {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
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
            <p className="old-login-error">{error}</p>
          )}
          
          <div className="old-login-field">
            <label htmlFor="email">อีเมล</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="email"
              value={formData.email}
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
              placeholder="password"
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

// Forgot Password Modal Component
function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle forgot password logic
    alert('ระบบจะส่งลิงก์เพื่อเปลี่ยนรหัสผ่านไปยังอีเมลของคุณ');
    onClose();
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-50">
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-fit mx-auto bg-white p-6 rounded-lg shadow-lg">
        <div
          onClick={onClose}
          className="ml-auto cursor-pointer w-fit mb-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
        
        <div className="px-12">
          <p className="text-center text-2xl text-secondary-600 font-bold mb-6">
            ลืมรหัสผ่าน
          </p>
          
          <div className="w-fit mx-auto my-8 bg-gray-300 rounded-full p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>

          <p className="underline text-center text-secondary-600 text-lg mb-6">
            กรุณากรอกอีเมล
          </p>
          
          <form onSubmit={handleSubmit} className="text-center">
            <input
              type="email"
              placeholder="อีเมล (Email)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded mb-4"
              required
            />
            
            <p className="font-semibold text-lg text-secondary-600 mb-4">
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
