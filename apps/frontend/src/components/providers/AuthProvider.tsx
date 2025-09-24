"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { UserInterface } from "@/types/user";
import type { 
  AuthContextValue, 
  AuthUser, 
  StudentLoginDTO, 
  AdminLoginDTO, 
  RegistrationDTO,
  TokenRefreshResponse,
  AuthError 
} from "@/types/auth";

// Legacy interface for backward compatibility
interface LegacyAuthContextType {
  user: UserInterface | null;
  setCredential: (user: UserInterface) => void;
  logout: (redirectTo?: string) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshAuth: () => void;
}

// Enhanced AuthContext that extends legacy interface
interface EnhancedAuthContextType extends LegacyAuthContextType, AuthContextValue {}

export const AuthContext = createContext<EnhancedAuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to set secure cookies
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Strict; Secure=${window.location.protocol === 'https:'}`;
};

// Helper function to delete cookies
const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
};

// Helper function to validate token expiration
const isTokenValid = (user: UserInterface): boolean => {
  if (!user?.token?.expiresAt && !user?.expiresAt) return false;
  
  const expirationTime = user.token?.expiresAt || user.expiresAt;
  const currentTime = new Date().toISOString();
  
  return new Date(expirationTime) > new Date(currentTime);
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserInterface | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const router = useRouter();

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Check localStorage for user data
        const storedUser = localStorage.getItem("user_account");
        const storedToken = localStorage.getItem("access_token");
        
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          
          // Validate token expiration
          if (isTokenValid(parsedUser)) {
            setUser(parsedUser);
            
            // Set cookies for middleware
            setCookie('auth-token', parsedUser.access_token);
            setCookie('user-data', encodeURIComponent(JSON.stringify(parsedUser)));
          } else {
            // Token expired, clear storage
            clearAuthData();
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Clear authentication data
  const clearAuthData = useCallback(() => {
    localStorage.removeItem("user_account");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    deleteCookie('auth-token');
    deleteCookie('user-data');
    setUser(null);
    setRefreshToken(null);
    setError(null);
  }, []);

  // Set user credentials
  const setCredential = useCallback((userData: any) => {
    try {
      // Handle both demo API response and production API response
      const token = userData.token || userData.access_token;
      const user = userData.user || userData;
      
      // Validate required fields
      if (!token || !user) {
        throw new Error("Invalid user data: missing required fields");
      }

      // Normalize the data structure
      const normalizedData = {
        token,
        access_token: token,
        user: user,
        success: userData.success || true,
        message: userData.message || "Login successful"
      };

      setUser(normalizedData);
      
      // Store in localStorage
      localStorage.setItem("user_account", JSON.stringify(normalizedData));
      localStorage.setItem("access_token", token);
      
      // Set secure cookies for middleware
      setCookie('auth-token', token);
      setCookie('user-data', encodeURIComponent(JSON.stringify(userData)));
      
    } catch (error) {
      console.error("Error setting credentials:", error);
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback((redirectTo?: string) => {
    clearAuthData();
    
    // Determine redirect path based on current user role or provided path
    const currentPath = window.location.pathname;
    const isAdminPath = currentPath.startsWith('/admin');
    const defaultRedirect = isAdminPath ? '/admin/login' : '/login';
    
    router.push(redirectTo || defaultRedirect);
  }, [clearAuthData, router]);

  // Enhanced login method
  const login = useCallback(async (
    credentials: StudentLoginDTO | AdminLoginDTO,
    userType: 'student' | 'admin'
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = userType === 'admin' ? '/api/admin/login' : '/api/auth/login';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const userData = await response.json();
      setCredential(userData);
      
      // Redirect based on user type
      const redirectPath = userType === 'admin' ? '/admin/dashboard' : '/dashboard';
      router.push(redirectPath);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router, setCredential]);

  // Enhanced registration method
  const register = useCallback(async (data: RegistrationDTO): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const userData = await response.json();
      setCredential(userData);
      router.push('/dashboard');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router, setCredential]);

  // Forgot password method
  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send reset email');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset password method
  const resetPassword = useCallback(async (token: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password reset failed');
      }

      router.push('/login');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Enhanced refresh authentication with token refresh
  const refreshAuth = useCallback(async (): Promise<void> => {
    const storedUser = localStorage.getItem("user_account");
    const storedRefreshToken = localStorage.getItem("refresh_token");
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        if (isTokenValid(parsedUser)) {
          setUser(parsedUser);
          return;
        }

        // Try to refresh token if available
        if (storedRefreshToken) {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${storedRefreshToken}`,
            },
          });

          if (response.ok) {
            const refreshData: TokenRefreshResponse = await response.json();
            
            // Update user data with new token
            const updatedUser = {
              ...parsedUser,
              access_token: refreshData.access_token,
              token: {
                ...parsedUser.token,
                token: refreshData.access_token,
                expiresAt: refreshData.expires_at,
              },
              expiresAt: refreshData.expires_at,
            };

            setCredential(updatedUser);
            
            // Update refresh token if provided
            if (refreshData.refresh_token) {
              localStorage.setItem("refresh_token", refreshData.refresh_token);
              setRefreshToken(refreshData.refresh_token);
            }
            
            return;
          }
        }

        // If refresh fails, logout
        logout();
        
      } catch (error) {
        console.error("Error refreshing auth:", error);
        logout();
      }
    }
  }, [logout, setCredential]);

  // Clear error method
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check authentication status periodically
  useEffect(() => {
    if (!user) return;

    const checkTokenExpiration = () => {
      if (!isTokenValid(user)) {
        console.warn("Token expired, logging out");
        logout();
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user, logout]);

  const isAuthenticated = !!user && isTokenValid(user);

  // Determine user type from user data
  const userType = user?.user?.students ? 'student' : 
                   user?.user?.instructors ? 'admin' : null;

  // Convert legacy user to AuthUser format for new methods
  const authUser: AuthUser | null = user ? {
    id: user.user.id,
    email: user.user.email,
    firstName: user.user.students?.name || user.user.instructors?.name || '',
    lastName: user.user.students?.surname || user.user.instructors?.surname || '',
    role: userType === 'student' ? 'student' : 'admin',
    permissions: user.abilities || ['*'],
    lastLogin: user.token.lastUsedAt,
    isActive: true,
    ...(userType === 'student' && {
      student_id: user.user.students?.studentId || '',
      profile: user.user.students,
    }),
    ...(userType === 'admin' && {
      department: user.user.instructors?.facultyId?.toString(),
    }),
  } as AuthUser : null;

  const contextValue: EnhancedAuthContextType = {
    // Legacy properties for backward compatibility
    user,
    setCredential,
    logout,
    isLoading,
    isAuthenticated,
    refreshAuth,
    
    // Enhanced properties
    error,
    userType,
    
    // Enhanced methods
    login,
    register,
    forgotPassword,
    resetPassword,
    clearError,
    
    // AuthUser for new methods (mapped from legacy user)
    user: authUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};