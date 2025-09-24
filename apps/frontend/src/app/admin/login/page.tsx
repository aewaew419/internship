"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminLoginForm } from "@/components/forms/AdminLoginForm";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLoginPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check for error messages from URL params
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "access_denied") {
      setErrorMessage("ไม่มีสิทธิ์เข้าถึงระบบผู้ดูแล กรุณาติดต่อผู้ดูแลระบบ");
    }
  }, [searchParams]);

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Check if user has admin role
      const isAdmin = user?.roles?.list?.includes('admin') || 
                     user?.user?.roleId === 1; // Assuming roleId 1 is admin
      
      if (isAdmin) {
        router.push("/admin");
      } else {
        // If authenticated but not admin, show access denied
        setErrorMessage("ไม่มีสิทธิ์เข้าถึงระบบผู้ดูแล กรุณาติดต่อผู้ดูแลระบบ");
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Don't render login form if already authenticated as admin
  if (isAuthenticated && user?.roles?.list?.includes('admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errorMessage}
          </div>
        )}
        
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-200">
          <AdminLoginForm />
        </div>
      </div>
      
      {/* Mobile-specific styling */}
      <style jsx>{`
        @media (max-width: 640px) {
          .bg-white {
            box-shadow: none;
            border: none;
            border-radius: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}