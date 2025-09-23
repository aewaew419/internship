"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { useLogin } from "@/hooks/api/useUser";
import type { LoginDTO } from "@/types/api";

interface LoginFormProps {
  onSubmit?: (data: LoginDTO) => Promise<void>;
}

export const LoginForm = ({ onSubmit }: LoginFormProps) => {
  const [formData, setFormData] = useState<LoginDTO>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<LoginDTO>>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

  const { setCredential } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use the login mutation hook
  const {
    mutate: login,
    loading: isLoading,
    error: loginError,
  } = useLogin();

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginDTO> = {};

    if (!formData.email) {
      newErrors.email = "กรุณากรอกอีเมล";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    if (!formData.password) {
      newErrors.password = "กรุณากรอกรหัสผ่าน";
    } else if (formData.password.length < 6) {
      newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Use the API service for login
        const userData = await login(formData);
        setCredential(userData);
      }

      // Redirect to intended page or dashboard
      const redirectTo = searchParams.get("redirect") || "/";
      router.push(redirectTo);
    } catch (error) {
      // Error is handled by the mutation hook
      console.error("Login error:", error);
    }
  };

  const handleInputChange = (field: keyof LoginDTO) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Login error is managed by the mutation hook
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implement forgot password logic here
    console.log("Forgot password for:", forgotPasswordEmail);
    setShowForgotPassword(false);
    setForgotPasswordEmail("");
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Logo */}
        <div className="text-center mb-6">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-16 sm:h-20 mx-auto mb-4" 
          />
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
            เข้าสู่ระบบ
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน
          </p>
        </div>

        {/* Error Message */}
        {loginError && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {loginError.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง"}
          </div>
        )}

        {/* Email Input */}
        <Input
          type="email"
          label="อีเมล"
          placeholder="กรุณากรอกอีเมล"
          value={formData.email}
          onChange={handleInputChange("email")}
          error={errors.email}
          fullWidth
          autoComplete="email"
          inputMode="email"
        />

        {/* Password Input */}
        <Input
          type="password"
          label="รหัสผ่าน"
          placeholder="กรุณากรอกรหัสผ่าน"
          value={formData.password}
          onChange={handleInputChange("password")}
          error={errors.password}
          fullWidth
          autoComplete="current-password"
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="gradient"
          size="lg"
          fullWidth
          isLoading={isLoading}
          className="mt-6"
        >
          เข้าสู่ระบบ
        </Button>

        {/* Forgot Password Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ลืมรหัสผ่าน?
          </button>
        </div>
      </form>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        title="ลืมรหัสผ่าน"
        size="md"
      >
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              กรุณากรอกอีเมล
            </p>
            <p className="text-sm text-gray-600">
              ระบบจะส่งลิงก์เพื่อเปลี่ยนรหัสผ่านไปยังอีเมลของคุณ
            </p>
          </div>

          <Input
            type="email"
            label="อีเมล"
            placeholder="กรุณากรอกอีเมล"
            value={forgotPasswordEmail}
            onChange={(e) => setForgotPasswordEmail(e.target.value)}
            fullWidth
            required
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForgotPassword(false)}
              fullWidth
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="gradient"
              fullWidth
            >
              ส่งลิงก์
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};