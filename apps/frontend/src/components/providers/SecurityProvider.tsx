"use client";

import { ReactNode, useEffect, useState } from "react";
import { initializeSecurity, initializeSessionManager, useSessionManager } from "@/lib/security";
import { useAuth } from "@/hooks/useAuth";
import { SessionTimeoutWarning } from "@/components/ui/SessionTimeoutWarning";

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider = ({ children }: SecurityProviderProps) => {
  const auth = useAuth();
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0);

  // Initialize security features
  useEffect(() => {
    initializeSecurity();
  }, []);

  // Initialize session management when user is authenticated
  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      const sessionManager = initializeSessionManager({
        warningTimeMs: 5 * 60 * 1000, // 5 minutes warning
        idleTimeoutMs: 30 * 60 * 1000, // 30 minutes idle timeout
        enableIdleDetection: true,
        enableVisibilityDetection: true
      }, {
        onWarning: (remainingTime) => {
          setSessionTimeRemaining(remainingTime);
          setShowSessionWarning(true);
        },
        onTimeout: async () => {
          setShowSessionWarning(false);
          await auth.logout();
        },
        onActivity: () => {
          // Reset warning if user is active
          if (showSessionWarning) {
            setShowSessionWarning(false);
          }
        }
      });

      return () => {
        sessionManager?.destroy();
      };
    }
  }, [auth.isAuthenticated, auth.user, auth.logout, showSessionWarning]);

  const handleExtendSession = () => {
    const sessionManager = useSessionManager();
    sessionManager.extendSession();
    setShowSessionWarning(false);
  };

  const handleLogout = async () => {
    setShowSessionWarning(false);
    await auth.logout();
  };

  return (
    <>
      {children}
      
      {/* Global Session Timeout Warning */}
      <SessionTimeoutWarning
        isOpen={showSessionWarning}
        remainingTime={sessionTimeRemaining}
        onExtend={handleExtendSession}
        onLogout={handleLogout}
        onClose={() => setShowSessionWarning(false)}
      />
    </>
  );
};