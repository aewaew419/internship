"use client";

import { useState } from "react";

export const TestLoginForm = () => {
  const [formData, setFormData] = useState({
    studentId: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:8080/api/v1/auth/student-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: formData.studentId,
          password: formData.password,
        }),
      });

      const userData = await response.json();
      
      if (response.ok) {
        setSuccess("เข้าสู่ระบบสำเร็จ! กำลังเปลี่ยนหน้า...");
        
        // Store user data in localStorage
        localStorage.setItem("user_account", JSON.stringify(userData));
        localStorage.setItem("access_token", userData.token);
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      } else {
        setError(userData.message || "เข้าสู่ระบบไม่สำเร็จ");
      }
    } catch (err) {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="text-center mb-6">
        <img 
          src="/logo.png" 
          alt="Logo" 
          className="mx-auto mb-4 h-16 sm:h-20"
        />
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
          เข้าสู่ระบบ
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Student ID Input */}
        <div>
          <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
            รหัสนักศึกษา
          </label>
          <input
            id="studentId"
            type="text"
            value={formData.studentId}
            onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            placeholder="กรุณากรอกรหัสนักศึกษา (8-10 หลัก)"
            required
          />
        </div>

        {/* Password Input */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            รหัสผ่าน
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            placeholder="กรุณากรอกรหัสผ่าน"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 px-4 rounded-lg hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
        >
          {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>

        {/* Forgot Password Link */}
        <div className="text-center">
          <button
            type="button"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ลืมรหัสผ่าน?
          </button>
        </div>
      </form>
    </div>
  );
};