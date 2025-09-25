/**
 * CSRF Protection for Authentication Forms
 * Provides Cross-Site Request Forgery protection
 */

interface CSRFConfig {
  tokenName: string;
  headerName: string;
  cookieName: string;
  tokenLength: number;
  autoRefresh: boolean;
  refreshInterval: number;
}

class CSRFProtection {
  private config: CSRFConfig;
  private currentToken: string | null = null;
  private refreshInterval?: NodeJS.Timeout;

  constructor(config: Partial<CSRFConfig> = {}) {
    this.config = {
      tokenName: 'csrf_token',
      headerName: 'X-CSRF-Token',
      cookieName: 'csrf_token',
      tokenLength: 32,
      autoRefresh: true,
      refreshInterval: 30 * 60 * 1000, // 30 minutes
      ...config
    };

    this.initializeToken();
    
    if (this.config.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  /**
   * Generate a new CSRF token
   */
  generateToken(): string {
    // Check if crypto is available (browser environment)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(this.config.tokenLength);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback for environments without crypto.getRandomValues
    let token = '';
    const chars = '0123456789abcdef';
    for (let i = 0; i < this.config.tokenLength * 2; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
    return token;
  }

  /**
   * Initialize CSRF token
   */
  private initializeToken(): void {
    // Try to get existing token from cookie or generate new one
    this.currentToken = this.getTokenFromCookie() || this.generateToken();
    this.setTokenCookie(this.currentToken);
  }

  /**
   * Get current CSRF token
   */
  getToken(): string {
    if (!this.currentToken) {
      this.initializeToken();
    }
    return this.currentToken!;
  }

  /**
   * Refresh CSRF token
   */
  refreshToken(): string {
    this.currentToken = this.generateToken();
    this.setTokenCookie(this.currentToken);
    return this.currentToken;
  }

  /**
   * Get CSRF token from cookie
   */
  private getTokenFromCookie(): string | null {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return null;
    }

    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === this.config.cookieName) {
          return decodeURIComponent(value);
        }
      }
    } catch (error) {
      console.warn('Error reading CSRF token from cookie:', error);
    }
    
    return null;
  }

  /**
   * Set CSRF token in cookie
   */
  private setTokenCookie(token: string): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    try {
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString(); // 24 hours
      document.cookie = `${this.config.cookieName}=${encodeURIComponent(token)}; expires=${expires}; path=/; secure; samesite=strict`;
    } catch (error) {
      console.warn('Error setting CSRF token cookie:', error);
    }
  }

  /**
   * Get headers for API requests
   */
  getHeaders(): Record<string, string> {
    return {
      [this.config.headerName]: this.getToken()
    };
  }

  /**
   * Get form data for form submissions
   */
  getFormData(): Record<string, string> {
    return {
      [this.config.tokenName]: this.getToken()
    };
  }

  /**
   * Validate CSRF token (client-side validation)
   */
  validateToken(token: string): boolean {
    return token === this.currentToken && token.length === this.config.tokenLength * 2;
  }

  /**
   * Start automatic token refresh
   */
  private startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      this.refreshToken();
    }, this.config.refreshInterval);
  }

  /**
   * Stop automatic token refresh
   */
  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }
  }

  /**
   * Clear CSRF token
   */
  clearToken(): void {
    this.currentToken = null;
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        document.cookie = `${this.config.cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict`;
      } catch (error) {
        console.warn('Error clearing CSRF token cookie:', error);
      }
    }
    
    this.stopAutoRefresh();
  }
}

// Global CSRF protection instance
export const csrfProtection = new CSRFProtection();

/**
 * Hook for using CSRF protection in React components
 */
export function useCSRFProtection() {
  const getToken = () => csrfProtection.getToken();
  const refreshToken = () => csrfProtection.refreshToken();
  const getHeaders = () => csrfProtection.getHeaders();
  const getFormData = () => csrfProtection.getFormData();
  const validateToken = (token: string) => csrfProtection.validateToken(token);

  return {
    getToken,
    refreshToken,
    getHeaders,
    getFormData,
    validateToken
  };
}

/**
 * Higher-order function to add CSRF protection to API calls
 */
export function withCSRFProtection<T extends (...args: any[]) => Promise<any>>(
  apiCall: T
): T {
  return (async (...args: Parameters<T>) => {
    const headers = csrfProtection.getHeaders();
    
    // If the first argument is an options object, add headers
    if (args[0] && typeof args[0] === 'object' && 'headers' in args[0]) {
      args[0].headers = { ...args[0].headers, ...headers };
    } else if (args.length > 1 && typeof args[1] === 'object') {
      args[1] = { ...args[1], headers: { ...args[1].headers, ...headers } };
    }
    
    return apiCall(...args);
  }) as T;
}

/**
 * Utility to add CSRF token to form data
 */
export function addCSRFToFormData(formData: FormData): FormData {
  const token = csrfProtection.getToken();
  const formDataObj = csrfProtection.getFormData();
  const tokenName = Object.keys(formDataObj)[0];
  formData.append(tokenName, token);
  return formData;
}

/**
 * Utility to add CSRF token to URL search params
 */
export function addCSRFToParams(params: URLSearchParams): URLSearchParams {
  const token = csrfProtection.getToken();
  const formDataObj = csrfProtection.getFormData();
  const tokenName = Object.keys(formDataObj)[0];
  params.append(tokenName, token);
  return params;
}

/**
 * Middleware for fetch requests to automatically add CSRF protection
 */
export function createCSRFMiddleware() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof window.fetch === 'undefined') {
    return;
  }

  const originalFetch = window.fetch;
  
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    
    // Only add CSRF token to same-origin requests
    if (request.url.startsWith(window.location.origin)) {
      const headers = new Headers(request.headers);
      const csrfHeaders = csrfProtection.getHeaders();
      
      Object.entries(csrfHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
      
      return originalFetch(request.url, {
        ...init,
        headers
      });
    }
    
    return originalFetch(input, init);
  };
}

/**
 * Initialize CSRF protection on app startup
 */
export function initializeCSRFProtection(): void {
  // Only initialize in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  // Create CSRF middleware for fetch requests
  createCSRFMiddleware();
  
  // Initialize token
  csrfProtection.getToken();
}