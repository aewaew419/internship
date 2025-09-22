"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallbackPath?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  fallbackPath = "/login" 
}: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Redirect if not authenticated
    if (!isAuthenticated) {
      router.push(fallbackPath);
      return;
    }

    // Check role requirements
    if (requiredRoles.length > 0 && user) {
      const userRoles = user.roles?.list || [];
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        router.push("/"); // Redirect to dashboard if no required role
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRoles, router, fallbackPath]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Don't render children if not authenticated or doesn't have required role
  if (!isAuthenticated) {
    return null;
  }

  if (requiredRoles.length > 0 && user) {
    const userRoles = user.roles?.list || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return null;
    }
  }

  return <>{children}</>;
};