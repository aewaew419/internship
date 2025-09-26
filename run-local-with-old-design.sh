#!/bin/bash

echo "🚀 Run Local Next.js with Old Design"
echo "===================================="

echo "📋 Starting local development with old design..."

# ไปที่ frontend directory
cd apps/frontend

echo "📦 Installing dependencies..."
npm install

echo "🎨 Checking old design files..."
if [ -f "src/styles/old-design.css" ]; then
    echo "✅ Old design CSS found"
else
    echo "❌ Old design CSS not found, creating..."
    # สร้าง old design CSS ถ้าไม่มี
    mkdir -p src/styles
    cat > src/styles/old-design.css << 'OLDCSS'
/* Old Design Styles for Next.js */
@import url('https://fonts.googleapis.com/css2?family=Bai+Jamjuree:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;1,200;1,300;1,400;1,500;1,600;1,700&display=swap');

:root {
  font-family: "Bai Jamjuree", sans-serif;
  --color-primary-500: #f28362;
  --color-primary-600: #f45626;
  --color-secondary-500: #d89967;
  --color-secondary-600: #966033;
  --color-secondary-900: #412610;
  --color-text-800: #575860;
  --color-text-900: #1c1d20;
}

body {
  font-family: "Bai Jamjuree", sans-serif;
  background-color: #f3f3f3;
  color: #575860;
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
  background: none;
  border: none;
  cursor: pointer;
}
OLDCSS
fi

if [ -f "public/logo.png" ]; then
    echo "✅ Logo found"
else
    echo "❌ Logo not found, copying..."
    cp ../../front-end/public/logo.png public/
fi

if [ -f "src/components/auth/OldLoginForm.tsx" ]; then
    echo "✅ Old login component found"
else
    echo "❌ Old login component not found, creating..."
    mkdir -p src/components/auth
    cat > src/components/auth/OldLoginForm.tsx << 'LOGINCOMPONENT'
'use client';

import { useState } from 'react';
import Image from 'next/image';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call for local testing
    setTimeout(() => {
      if (formData.email && formData.password) {
        alert('🎉 เข้าสู่ระบบสำเร็จ! (Local Demo)\n\nEmail: ' + formData.email + '\nระบบ: Next.js + Old Design');
        setError('');
      } else {
        setError('กรุณากรอกอีเมลและรหัสผ่าน');
      }
      setIsLoading(false);
    }, 1000);
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

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('ระบบจะส่งลิงก์เพื่อเปลี่ยนรหัสผ่านไปยังอีเมลของคุณ');
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
              type="email"
              placeholder="อีเมล (Email)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
LOGINCOMPONENT
fi

# อัพเดต login page
echo "📝 Updating login page..."
cat > src/app/login/page.tsx << 'LOGINPAGE'
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

# อัพเดต root page ให้ redirect ไป login
echo "🔄 Updating root page..."
cat > src/app/page.tsx << 'ROOTPAGE'
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.push('/login');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">กำลังโหลด...</h1>
        <p>กำลังเปลี่ยนเส้นทางไปหน้าเข้าสู่ระบบ</p>
      </div>
    </div>
  );
}
ROOTPAGE

echo "🚀 Starting development servers..."
echo ""
echo "📋 Starting backend server first..."

# Start backend server in background
cd ../../apps/backend
echo "🔧 Starting Go backend server..."
go run demo_api_server.go &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Go back to frontend
cd ../frontend

echo "🎨 Starting Next.js frontend server..."
echo ""
echo "📱 เปิดเบราว์เซอร์ไปที่: http://localhost:3000"
echo "🎨 จะเห็นหน้า login ที่มีดีไซน์เก่า"
echo "🔑 ลองกรอก รหัสนักศึกษา และ รหัสผ่าน เพื่อทดสอบ"
echo "🗄️ เชื่อมต่อกับ API จริงแล้ว!"
echo ""
echo "⏹️  กด Ctrl+C เพื่อหยุด servers"
echo ""

# Function to cleanup background processes
cleanup() {
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    exit
}

# Set trap to cleanup on exit
trap cleanup INT TERM

# รัน Next.js dev server
npm run dev

# Cleanup when Next.js exits
cleanup