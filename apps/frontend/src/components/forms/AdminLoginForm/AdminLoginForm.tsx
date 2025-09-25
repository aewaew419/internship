"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { LoginDTO } from "@/types/api";

interface AdminLoginFormProps {
  onSubmit?: (data: LoginDTO) => Promise<void>;
}

const AdminLoginForm = ({ onSubmit }: AdminLoginFormProps) => {
  const [formData, setFormData] = useState<LoginDTO>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<LoginDTO>>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginDTO) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">เข้าสู่ระบบผู้ดูแล</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="อีเมล"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={errors.email}
            required
          />
        </div>
        
        <div>
          <Input
            type="password"
            placeholder="รหัสผ่าน"
            value={formData.password}
            onChange={handleInputChange('password')}
            error={errors.password}
            required
          />
        </div>
        
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </Button>
        
        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            เข้าสู่ระบบนักศึกษา
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminLoginForm;