/**
 * Audit Context Provider
 * Provides audit logging context throughout the application
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuditContext as AuditContextType, AuditConfiguration } from '../types/audit';
import { auditService } from '../services/auditService';
import { useAudit, useSuspiciousActivityMonitor } from '../hooks/useAudit';

interface AuditProviderProps {
  children: ReactNode;
  config?: Partial<AuditConfiguration>;
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

interface AuditContextValue {
  isInitialized: boolean;
  currentUser: AuditContextType | null;
  suspiciousActivitiesCount: number;
  setUser: (user: { id: number; email: string; name: string }) => void;
  clearUser: () => void;
}

const AuditContext = createContext<AuditContextValue | undefined>(undefined);

export function AuditProvider({ children, config, user }: AuditProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuditContextType | null>(null);
  const { setContext, clearContext } = useAudit();
  const { suspiciousActivities } = useSuspiciousActivityMonitor();

  // Initialize audit service with configuration
  useEffect(() => {
    if (config) {
      // In a real implementation, this would update the service configuration
      console.log('Audit configuration updated:', config);
    }
    setIsInitialized(true);
  }, [config]);

  // Set initial user context
  useEffect(() => {
    if (user && isInitialized) {
      setUser(user);
    }
  }, [user, isInitialized]);

  const setUser = (userData: { id: number; email: string; name: string }) => {
    const auditContext: AuditContextType = {
      userId: userData.id,
      userEmail: userData.email,
      userName: userData.name,
      ipAddress: getClientIP(),
      userAgent: navigator.userAgent,
      sessionId: getSessionId(),
      requestId: generateRequestId(),
      correlationId: generateCorrelationId()
    };

    setCurrentUser(auditContext);
    setContext(auditContext);

    // Log user session start
    auditService.logAction(
      'login',
      'session',
      auditContext.sessionId,
      [],
      {
        loginTime: new Date().toISOString(),
        userAgent: auditContext.userAgent,
        ipAddress: auditContext.ipAddress
      }
    );
  };

  const clearUser = () => {
    if (currentUser) {
      // Log user session end
      auditService.logAction(
        'logout',
        'session',
        currentUser.sessionId,
        [],
        {
          logoutTime: new Date().toISOString(),
          sessionDuration: Date.now() - new Date(currentUser.sessionId.split('_')[1]).getTime()
        }
      );
    }

    setCurrentUser(null);
    clearContext();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentUser) {
        clearUser();
      }
    };
  }, []);

  // Monitor for suspicious activities and log them
  useEffect(() => {
    if (suspiciousActivities.length > 0) {
      console.warn(`Detected ${suspiciousActivities.length} suspicious activities`);
      
      // You could trigger notifications or alerts here
      suspiciousActivities.forEach(activity => {
        if (activity.severity === 'critical') {
          // Trigger immediate alert for critical activities
          console.error('Critical suspicious activity detected:', activity);
        }
      });
    }
  }, [suspiciousActivities]);

  const contextValue: AuditContextValue = {
    isInitialized,
    currentUser,
    suspiciousActivitiesCount: suspiciousActivities.length,
    setUser,
    clearUser
  };

  return (
    <AuditContext.Provider value={contextValue}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAuditContext() {
  const context = useContext(AuditContext);
  if (context === undefined) {
    throw new Error('useAuditContext must be used within an AuditProvider');
  }
  return context;
}

// Helper functions
function getClientIP(): string {
  // In a real implementation, this would get the actual client IP
  // For now, return a placeholder
  return '127.0.0.1';
}

function getSessionId(): string {
  // Check if session ID exists in sessionStorage
  let sessionId = sessionStorage.getItem('audit_session_id');
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('audit_session_id', sessionId);
  }
  
  return sessionId;
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// HOC for automatic audit context setup
export function withAuditContext<P extends object>(
  Component: React.ComponentType<P>,
  config?: Partial<AuditConfiguration>
) {
  return function AuditWrappedComponent(props: P) {
    return (
      <AuditProvider config={config}>
        <Component {...props} />
      </AuditProvider>
    );
  };
}

// Hook for automatic audit logging of component lifecycle
export function useComponentAudit(
  componentName: string,
  entityType: AuditContextType['entityType'] = 'system_settings'
) {
  const { logAction } = useAudit();

  useEffect(() => {
    // Log component mount
    logAction(
      'read',
      entityType,
      componentName,
      [],
      {
        componentName,
        mountTime: new Date().toISOString(),
        action: 'component_mount'
      }
    );

    return () => {
      // Log component unmount
      logAction(
        'read',
        entityType,
        componentName,
        [],
        {
          componentName,
          unmountTime: new Date().toISOString(),
          action: 'component_unmount'
        }
      );
    };
  }, [componentName, entityType, logAction]);
}