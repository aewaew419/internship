/**
 * Session Timeout and Management
 * Provides session timeout warnings and automatic logout functionality
 */

import { tokenManager } from './token-management';

interface SessionConfig {
  warningTimeMs: number;
  idleTimeoutMs: number;
  checkIntervalMs: number;
  enableIdleDetection: boolean;
  enableVisibilityDetection: boolean;
}

interface SessionCallbacks {
  onWarning?: (remainingTime: number) => void;
  onTimeout?: () => void;
  onExtend?: () => void;
  onActivity?: () => void;
}

class SessionManager {
  private config: SessionConfig;
  private callbacks: SessionCallbacks;
  private lastActivity: number = Date.now();
  private warningShown: boolean = false;
  private timeoutTimer?: NodeJS.Timeout;
  private checkTimer?: NodeJS.Timeout;
  private isActive: boolean = true;

  constructor(config: Partial<SessionConfig> = {}, callbacks: SessionCallbacks = {}) {
    this.config = {
      warningTimeMs: 5 * 60 * 1000, // 5 minutes warning
      idleTimeoutMs: 30 * 60 * 1000, // 30 minutes idle timeout
      checkIntervalMs: 60 * 1000, // Check every minute
      enableIdleDetection: true,
      enableVisibilityDetection: true,
      ...config
    };
    
    this.callbacks = callbacks;
    this.initialize();
  }

  /**
   * Initialize session management
   */
  private initialize(): void {
    if (this.config.enableIdleDetection) {
      this.setupActivityListeners();
    }
    
    if (this.config.enableVisibilityDetection) {
      this.setupVisibilityListener();
    }
    
    this.startSessionCheck();
  }

  /**
   * Setup activity listeners for idle detection
   */
  private setupActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const activityHandler = () => {
      this.recordActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, activityHandler, { passive: true });
    });
  }

  /**
   * Setup visibility change listener
   */
  private setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.isActive = true;
        this.recordActivity();
        this.checkSession();
      } else {
        this.isActive = false;
      }
    });
  }

  /**
   * Record user activity
   */
  recordActivity(): void {
    this.lastActivity = Date.now();
    this.warningShown = false;
    
    if (this.callbacks.onActivity) {
      this.callbacks.onActivity();
    }
  }

  /**
   * Start session checking interval
   */
  private startSessionCheck(): void {
    this.checkTimer = setInterval(() => {
      this.checkSession();
    }, this.config.checkIntervalMs);
  }

  /**
   * Check session status and handle timeouts
   */
  private checkSession(): void {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    const tokenExpiration = tokenManager.getTokenExpiration();
    
    // Check if token is expired
    if (!tokenExpiration || now >= tokenExpiration) {
      this.handleTimeout();
      return;
    }
    
    // Check for idle timeout
    if (timeSinceActivity >= this.config.idleTimeoutMs) {
      this.handleTimeout();
      return;
    }
    
    // Check for warning threshold
    const timeUntilTimeout = this.config.idleTimeoutMs - timeSinceActivity;
    if (timeUntilTimeout <= this.config.warningTimeMs && !this.warningShown) {
      this.showWarning(timeUntilTimeout);
    }
  }

  /**
   * Show session timeout warning
   */
  private showWarning(remainingTime: number): void {
    this.warningShown = true;
    
    if (this.callbacks.onWarning) {
      this.callbacks.onWarning(remainingTime);
    }
  }

  /**
   * Handle session timeout
   */
  private handleTimeout(): void {
    this.cleanup();
    
    if (this.callbacks.onTimeout) {
      this.callbacks.onTimeout();
    }
  }

  /**
   * Extend session (refresh token)
   */
  extendSession(): void {
    this.recordActivity();
    
    if (this.callbacks.onExtend) {
      this.callbacks.onExtend();
    }
  }

  /**
   * Get remaining session time
   */
  getRemainingTime(): number {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    return Math.max(0, this.config.idleTimeoutMs - timeSinceActivity);
  }

  /**
   * Get time until warning
   */
  getTimeUntilWarning(): number {
    const remainingTime = this.getRemainingTime();
    return Math.max(0, remainingTime - this.config.warningTimeMs);
  }

  /**
   * Check if session is active
   */
  isSessionActive(): boolean {
    return this.getRemainingTime() > 0 && !!tokenManager.getToken();
  }

  /**
   * Check if warning should be shown
   */
  shouldShowWarning(): boolean {
    return this.getRemainingTime() <= this.config.warningTimeMs && this.getRemainingTime() > 0;
  }

  /**
   * Update session configuration
   */
  updateConfig(newConfig: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Update callbacks
   */
  updateCallbacks(newCallbacks: SessionCallbacks): void {
    this.callbacks = { ...this.callbacks, ...newCallbacks };
  }

  /**
   * Cleanup session manager
   */
  cleanup(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = undefined;
    }
    
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = undefined;
    }
  }

  /**
   * Destroy session manager
   */
  destroy(): void {
    this.cleanup();
    // Remove event listeners would require keeping references
  }
}

// Global session manager instance
let sessionManager: SessionManager | null = null;

/**
 * Initialize session management
 */
export function initializeSessionManager(
  config: Partial<SessionConfig> = {},
  callbacks: SessionCallbacks = {}
): SessionManager {
  if (sessionManager) {
    sessionManager.destroy();
  }
  
  sessionManager = new SessionManager(config, callbacks);
  return sessionManager;
}

/**
 * Get current session manager instance
 */
export function getSessionManager(): SessionManager | null {
  return sessionManager;
}

/**
 * Hook for using session management in React components
 */
export function useSessionManager() {
  const manager = getSessionManager();
  
  const extendSession = () => manager?.extendSession();
  const getRemainingTime = () => manager?.getRemainingTime() || 0;
  const getTimeUntilWarning = () => manager?.getTimeUntilWarning() || 0;
  const isSessionActive = () => manager?.isSessionActive() || false;
  const shouldShowWarning = () => manager?.shouldShowWarning() || false;
  const recordActivity = () => manager?.recordActivity();

  return {
    extendSession,
    getRemainingTime,
    getTimeUntilWarning,
    isSessionActive,
    shouldShowWarning,
    recordActivity
  };
}

/**
 * Format time for display
 */
export function formatSessionTime(timeMs: number): string {
  const minutes = Math.floor(timeMs / (60 * 1000));
  const seconds = Math.floor((timeMs % (60 * 1000)) / 1000);
  
  if (minutes > 0) {
    return `${minutes} นาที ${seconds} วินาที`;
  }
  
  return `${seconds} วินาที`;
}

/**
 * Session timeout warning component props
 */
export interface SessionWarningProps {
  remainingTime: number;
  onExtend: () => void;
  onLogout: () => void;
}

/**
 * Default session configuration
 */
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  warningTimeMs: 5 * 60 * 1000, // 5 minutes
  idleTimeoutMs: 30 * 60 * 1000, // 30 minutes
  checkIntervalMs: 60 * 1000, // 1 minute
  enableIdleDetection: true,
  enableVisibilityDetection: true
};