"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface AdminRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const AdminRoute = ({ children, fallback }: AdminRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to admin login
        router.push("/admin/login");
        return;
      }

      // Check if user has admin role
      const isAdmin = user?.roles?.list?.includes('admin') || 
                     user?.user?.roleId === 1; // Assuming roleId 1 is admin
      
      if (!isAdmin) {
        // Not admin, redirect to admin login with access denied
        router.push("/admin/login?error=access_denied");
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      )
    );
  }

  // Don't render if not authenticated or not admin
  if (!isAuthenticated || !user?.roles?.list?.includes('admin')) {
    return null;
  }

  return <>{children}</>;
};