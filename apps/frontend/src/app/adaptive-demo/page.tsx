"use client";

import { useState } from "react";
import { AdaptiveAuthForm } from "@/components/forms/AdaptiveAuthForm";

export default function AdaptiveDemoPage() {
  const [formType, setFormType] = useState<"login" | "register" | "admin">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log("Form submitted:", data);
      
      // Simulate random error for demo
      if (Math.random() > 0.7) {
        throw new Error("Demo error: Invalid credentials");
      }
      
      alert("Form submitted successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Form Type Selector */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4 text-center">
            Adaptive Form Demo
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setFormType("login")}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                formType === "login"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setFormType("register")}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                formType === "register"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Register
            </button>
            <button
              onClick={() => setFormType("admin")}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                formType === "admin"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Admin
            </button>
          </div>
        </div>
      </div>

      {/* Adaptive Form */}
      <AdaptiveAuthForm
        formType={formType}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
      />

      {/* Instructions */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl mt-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Responsive Features Demo
          </h3>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <strong className="text-gray-900">Mobile (≤767px):</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Touch-optimized inputs with larger sizes</li>
                <li>Haptic feedback on supported devices</li>
                <li>Mobile-specific input modes (numeric, email)</li>
                <li>Larger touch targets (44px minimum)</li>
                <li>Simplified layout with full-width components</li>
              </ul>
            </div>
            
            <div>
              <strong className="text-gray-900">Tablet (768px-1023px):</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Balanced sizing between mobile and desktop</li>
                <li>Card-based layout with shadows</li>
                <li>Improved spacing and typography</li>
                <li>Touch-friendly but more compact</li>
              </ul>
            </div>
            
            <div>
              <strong className="text-gray-900">Desktop (≥1024px):</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Enhanced hover effects and animations</li>
                <li>Keyboard shortcuts (Alt+P for password toggle)</li>
                <li>Tooltips on form elements</li>
                <li>Elevated card design with advanced shadows</li>
                <li>Two-column layout for registration form</li>
                <li>Ripple effects on button interactions</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Try resizing your browser window</strong> to see how the form adapts to different screen sizes!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}