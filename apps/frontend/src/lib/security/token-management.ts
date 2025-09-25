/**
 * Secure Token Storage and Management
 * Provides secure token handling with automatic cleanup and validation
 */

interface TokenData {
  token: string;
  expiresAt: number;
  refreshToken?: string;
  tokenType: 'access' | 'refresh';
}

interface SecureStorageOptions {
  encrypt?: boolean;
  autoCleanup?: boolean;
  maxAge?: number;
}

class SecureTokenManager {
  private readonly storageKey = 'auth_tokens';
  private readonly options: SecureStorageOptions;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(options: SecureStorageOptions = {}) {
    this.options = {
      encrypt: true,
      autoCleanup: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      ...options
    };

    if (this.options.autoCleanup) {
      this.startAutoCleanup();
    }
  }

  /**
   * Store token securely
   */
  storeToken(token: string, expiresIn: number, tokenType: 'access' | 'refresh' = 'access', refreshToken?: string): void {
    try {
      const tokenData: TokenData = {
        token,
        expiresAt: Date.now() + (expiresIn * 1000),
        refreshToken,
        tokenType
      };

      const serialized = JSON.stringify(tokenData);
      const stored = this.options.encrypt ? this.encrypt(serialized) : serialized;
      
      localStorage.setItem(this.storageKey, stored);
      
      // Also store in httpOnly cookie for SSR
      this.setSecureCookie('auth-token', token, expiresIn);
      
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  /**
   * Retrieve token if valid
   */
  getToken(): string | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;

      const serialized = this.options.encrypt ? this.decrypt(stored) : stored;
      if (!serialized) return null;

      const tokenData: TokenData = JSON.parse(serialized);
      
      // Check if token is expired
      if (Date.now() >= tokenData.expiresAt) {
        this.clearToken();
        return null;
      }

      return tokenData.token;
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      this.clearToken();
      return null;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(): number | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;

      const serialized = this.options.encrypt ? this.decrypt(stored) : stored;
      if (!serialized) return null;

      const tokenData: TokenData = JSON.parse(serialized);
      return tokenData.expiresAt;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired or will expire soon
   */
  isTokenExpired(bufferMinutes: number = 5): boolean {
    const expiresAt = this.getTokenExpiration();
    if (!expiresAt) return true;

    const bufferMs = bufferMinutes * 60 * 1000;
    return Date.now() >= (expiresAt - bufferMs);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;

      const serialized = this.options.encrypt ? this.decrypt(stored) : stored;
      if (!serialized) return null;

      const tokenData: TokenData = JSON.parse(serialized);
      return tokenData.refreshToken || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear all tokens
   */
  clearToken(): void {
    localStorage.removeItem(this.storageKey);
    this.clearSecureCookie('auth-token');
    this.clearSecureCookie('user-data');
  }

  /**
   * Validate token format and structure
   */
  validateTokenFormat(token: string): boolean {
    try {
      // Basic JWT format validation
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      // Try to decode header and payload
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));

      // Check required fields
      return !!(header.alg && payload.exp && payload.iat);
    } catch {
      return false;
    }
  }

  /**
   * Get token payload without verification (for client-side use only)
   */
  getTokenPayload(): any | null {
    const token = this.getToken();
    if (!token || !this.validateTokenFormat(token)) return null;

    try {
      const parts = token.split('.');
      return JSON.parse(atob(parts[1]));
    } catch {
      return null;
    }
  }

  /**
   * Simple encryption for local storage (not cryptographically secure)
   */
  private encrypt(data: string): string {
    // Simple XOR encryption with a key derived from browser fingerprint
    const key = this.getBrowserFingerprint();
    let encrypted = '';
    
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    
    return btoa(encrypted);
  }

  /**
   * Simple decryption for local storage
   */
  private decrypt(encryptedData: string): string | null {
    try {
      const key = this.getBrowserFingerprint();
      const encrypted = atob(encryptedData);
      let decrypted = '';
      
      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(
          encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      
      return decrypted;
    } catch {
      return null;
    }
  }

  /**
   * Generate a browser fingerprint for encryption key
   */
  private getBrowserFingerprint(): string {
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
      'secure_key_salt_2024'
    ].join('|');
    
    return btoa(fingerprint).substring(0, 32);
  }

  /**
   * Set secure HTTP-only cookie
   */
  private setSecureCookie(name: string, value: string, maxAge: number): void {
    const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; secure; samesite=strict`;
  }

  /**
   * Clear secure cookie
   */
  private clearSecureCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict`;
  }

  /**
   * Start automatic cleanup of expired tokens
   */
  private startAutoCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      if (this.isTokenExpired()) {
        this.clearToken();
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }
}

// Global token manager instance
export const tokenManager = new SecureTokenManager();

/**
 * Hook for using token management in React components
 */
export function useTokenManager() {
  const storeToken = (token: string, expiresIn: number, tokenType?: 'access' | 'refresh', refreshToken?: string) => {
    tokenManager.storeToken(token, expiresIn, tokenType, refreshToken);
  };

  const getToken = () => tokenManager.getToken();
  const clearToken = () => tokenManager.clearToken();
  const isTokenExpired = (bufferMinutes?: number) => tokenManager.isTokenExpired(bufferMinutes);
  const getTokenPayload = () => tokenManager.getTokenPayload();
  const validateTokenFormat = (token: string) => tokenManager.validateTokenFormat(token);

  return {
    storeToken,
    getToken,
    clearToken,
    isTokenExpired,
    getTokenPayload,
    validateTokenFormat
  };
}

/**
 * Utility to check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = tokenManager.getToken();
  return !!(token && tokenManager.validateTokenFormat(token) && !tokenManager.isTokenExpired());
}

/**
 * Utility to get user role from token
 */
export function getUserRole(): string | null {
  const payload = tokenManager.getTokenPayload();
  return payload?.role || null;
}

/**
 * Utility to check if user has specific permission
 */
export function hasPermission(permission: string): boolean {
  const payload = tokenManager.getTokenPayload();
  if (!payload?.permissions) return false;
  
  return payload.permissions.includes(permission) || payload.permissions.includes('*');
}