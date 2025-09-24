"use client";

import { useContext, useCallback, useEffect } from "react";
import { AuthContext } from "@/components/providers/AuthProvider";
import type { 
  AuthContextValue, 
  StudentLoginDTO, 
  AdminLoginDTO, 
  RegistrationDTO,
  AuthUser,
  AuthError 
} from "@/types/auth";

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * Enhanced useAuth hook with additional authentication features
 * Provides automatic token refresh, session persistence, and error handling
 */
export const useEnhancedAuth = () => {
  const auth = useAuth();

  // Automatic token refresh
  const refreshTokenIfNeeded = useCallback(async () => {
    if (!auth.user || !auth.isAuthenticated) return;

    try {
      // Check if token expires within 5 minutes
      const tokenExpiry = new Date(auth.user.lastLogin || '');
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      if (tokenExpiry <= fiveMinutesFromNow) {
        await auth.refreshAuth();
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Don't logout automatically, let the user decide
    }
  }, [auth]);

  // Set up automatic token refresh interval
  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const interval = setInterval(refreshTokenIfNeeded, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [auth.isAuthenticated, refreshTokenIfNeeded]);

  // Enhanced login with user type detection
  const enhancedLogin = useCallback(async (
    credentials: StudentLoginDTO | AdminLoginDTO,
    userType?: 'student' | 'admin'
  ) => {
    // Auto-detect user type if not provided
    const detectedUserType = userType || ('student_id' in credentials ? 'student' : 'admin');
    return auth.login(credentials, detectedUserType);
  }, [auth]);

  // Enhanced logout with cleanup
  const enhancedLogout = useCallback(async (redirectTo?: string) => {
    try {
      // Clear any pending refresh timers
      // Perform cleanup operations
      await auth.logout(redirectTo);
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      await auth.logout(redirectTo);
    }
  }, [auth]);

  // Session persistence check
  const checkSessionPersistence = useCallback(() => {
    const storedUser = localStorage.getItem("user_account");
    const storedToken = localStorage.getItem("access_token");
    
    return !!(storedUser && storedToken);
  }, []);

  // Get user role information
  const getUserRole = useCallback((): string | null => {
    if (!auth.user) return null;
    return auth.user.role;
  }, [auth.user]);

  // Check if user has specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!auth.user) return false;
    return auth.user.permissions.includes(permission) || auth.user.permissions.includes('*');
  }, [auth.user]);

  // Get user display name
  const getUserDisplayName = useCallback((): string => {
    if (!auth.user) return '';
    return `${auth.user.firstName} ${auth.user.lastName}`.trim();
  }, [auth.user]);

  return {
    ...auth,
    // Enhanced methods
    login: enhancedLogin,
    logout: enhancedLogout,
    refreshTokenIfNeeded,
    checkSessionPersistence,
    getUserRole,
    hasPermission,
    getUserDisplayName,
    
    // Utility methods
    isStudent: auth.userType === 'student',
    isAdmin: auth.userType === 'admin',
    isSuperAdmin: auth.user?.role === 'super_admin',
  };
};