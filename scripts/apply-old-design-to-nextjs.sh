#!/bin/bash

echo "🎨 Apply Old Design to Next.js"
echo "=============================="

echo "📋 Copying old design to Next.js..."

# Copy logo
echo "📸 Copying logo..."
cp front-end/public/logo.png apps/frontend/public/

# Create old design CSS for Next.js
echo "🎨 Creating old design CSS..."
cat > apps/frontend/src/styles/old-design.css << 'OLDCSS'
/* Old Design Styles for Next.js */
@import url('https://fonts.googleapis.com/css2?family=Bai+Jamjuree:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;1,200;1,300;1,400;1,500;1,600;1,700&display=swap');

:root {
  font-family: "Bai Jamjuree", sans-serif;
  --color-primary-50: #ffe6db;
  --color-primary-100: #ffd1bd;
  --color-primary-200: #ffc1a8;
  --color-primary-300: #ffaf92;
  --color-primary-400: #ff9c7f;
  --color-primary-500: #f28362;
  --color-primary-600: #f45626;
  --color-primary-700: #e44a18;
  --color-primary-800: #cf4111;
  --color-primary-900: #4e281c;

  --color-secondary-50: #ffebcd;
  --color-secondary-100: #ffdfb6;
  --color-secondary-200: #ffd19e;
  --color-secondary-300: #ffc38d;
  --color-secondary-400: #f1b07c;
  --color-secondary-500: #d89967;
  --color-secondary-600: #966033;
  --color-secondary-700: #54371e;
  --color-secondary-800: #482d16;
  --color-secondary-900: #412610;

  --color-bg-100: #fcfcfd;
  --color-bg-200: #f8f8fa;

  --color-text-50: #eceef1;
  --color-text-100: #e3e5e9;
  --color-text-200: #dbdde2;
  --color-text-300: #d2d4db;
  --color-text-400: #c6c8d1;
  --color-text-500: #b0b3be;
  --color-text-600: #80828d;
  --color-text-700: #747781;
  --color-text-800: #575860;
  --color-text-900: #1c1d20;

  --color-error: #a01f38;
  --color-success: #2f7b69;
}

body {
  font-family: "Bai Jamjuree", sans-serif;
  background-color: #f3f3f3;
  color: #575860;
}

.gradient-text {
  background: linear-gradient(137deg, #d89967 16.63%, #966033 37.95%, #412610 88.14%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.bg-gradient {
  background: linear-gradient(137deg, #d89967 16.63%, #966033 37.95%, #412610 88.14%);
}

.old-login-container {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 384px;
  background: white;
  border-radius: 16px;
  padding: 40px 32px;
  color: black;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid #d1d5db;
}

.old-login-logo {
  width: fit-content;
  margin-bottom: 20px;
  margin-left: auto;
  margin-right: auto;
}

.old-login-logo img {
  height: 80px;
}

.old-login-title {
  font-size: 1.25rem;
  margin-bottom: 8px;
  text-align: center;
  font-weight: 600;
  color: var(--color-text-900);
}

.old-login-subtitle {
  text-align: center;
  color: var(--color-text-800);
  margin-bottom: 24px;
}

.old-login-form {
  display: grid;
  gap: 12px;
  margin: 16px auto;
}

.old-login-error {
  margin-bottom: -12px;
  text-align: right;
  font-size: 0.75rem;
  color: #dc2626;
}

.old-login-field {
  margin-bottom: 16px;
}

.old-login-field label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.875rem;
  color: var(--color-text-800);
}

.old-login-field input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.old-login-field input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 2px rgba(242, 131, 98, 0.2);
}

.old-login-button {
  background: linear-gradient(137deg, #d89967 16.63%, #966033 37.95%, #412610 88.14%);
  color: white;
  font-weight: 500;
  padding: 8px 64px;
  border-radius: 6px;
  width: 100%;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.old-login-button:hover {
  opacity: 0.9;
}

.old-login-forgot {
  font-size: 0.875rem;
  color: var(--color-text-700);
  text-align: right;
  margin-top: 8px;
}

.old-login-forgot:hover {
  color: var(--color-text-900);
}

/* Responsive */
@media (max-width: 480px) {
  .old-login-container {
    width: calc(100vw - 40px);
    padding: 30px 24px;
  }
}
OLDCSS

# Create old design login component
echo "🔧 Creating old design login component..."
mkdir -p apps/frontend/src/components/auth
cat > apps/frontend/src/components/auth/OldLoginForm.tsx << 'LOGINCOMPONENT'
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
LOGINCOMPONENT

# Update Next.js login page
echo "📝 Updating Next.js login page..."
cat > apps/frontend/src/app/login/page.tsx << 'LOGINPAGE'
import OldLoginForm from '@/components/auth/OldLoginForm';
import '@/styles/old-design.css';

export default function LoginPage() {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#f3f3f3',
      fontFamily: '"Bai Jamjuree", sans-serif'
    }}>
      <OldLoginForm />
    </div>
  );
}
LOGINPAGE

# Update global CSS
echo "🎨 Updating global CSS..."
cat >> apps/frontend/src/app/globals.css << 'GLOBALCSS'

/* Old Design Integration */
@import url('https://fonts.googleapis.com/css2?family=Bai+Jamjuree:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;1,200;1,300;1,400;1,500;1,600;1,700&display=swap');

body {
  font-family: "Bai Jamjuree", sans-serif;
}
GLOBALCSS

echo "✅ Old design applied to Next.js!"
echo ""
echo "📋 Changes made:"
echo "   ✅ Copied logo.png to Next.js public folder"
echo "   ✅ Created old-design.css with original styles"
echo "   ✅ Created OldLoginForm component"
echo "   ✅ Updated login page to use old design"
echo "   ✅ Added Bai Jamjuree font"
echo "   ✅ Applied original color scheme"
echo ""
echo "🚀 Next steps:"
echo "   1. Build and deploy Next.js with old design"
echo "   2. Test login functionality with new API"
echo "   3. Verify design matches original"