"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { UserInterface } from "@/types/user";

interface AuthContextType {
  user: UserInterface | null;
  setCredential: (user: UserInterface) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshAuth: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

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
    deleteCookie('auth-token');
    deleteCookie('user-data');
    setUser(null);
  }, []);

  // Set user credentials
  const setCredential = useCallback((userData: UserInterface) => {
    try {
      // Validate required fields
      if (!userData.access_token || !userData.user) {
        throw new Error("Invalid user data: missing required fields");
      }

      setUser(userData);
      
      // Store in localStorage
      localStorage.setItem("user_account", JSON.stringify(userData));
      localStorage.setItem("access_token", userData.access_token);
      
      // Set secure cookies for middleware
      setCookie('auth-token', userData.access_token);
      setCookie('user-data', encodeURIComponent(JSON.stringify(userData)));
      
    } catch (error) {
      console.error("Error setting credentials:", error);
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    clearAuthData();
    router.push('/login');
  }, [clearAuthData, router]);

  // Refresh authentication state
  const refreshAuth = useCallback(() => {
    const storedUser = localStorage.getItem("user_account");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (isTokenValid(parsedUser)) {
          setUser(parsedUser);
        } else {
          logout();
        }
      } catch (error) {
        console.error("Error refreshing auth:", error);
        logout();
      }
    }
  }, [logout]);

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

  const contextValue: AuthContextType = {
    user,
    setCredential,
    logout,
    isLoading,
    isAuthenticated,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};