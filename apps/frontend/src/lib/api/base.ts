'use client';

import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

export interface APIError {
  message: string;
  status: number;
  code?: string;
}

export class BaseAPI {
  private axiosInstance: AxiosInstance;

  constructor(configInstance: AxiosRequestConfig) {
    this.axiosInstance = axios.create({
      ...configInstance,
      timeout: 30000, // 30 second timeout for mobile networks
    });

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );

    // Request interceptor for authentication
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getToken();

        if (typeof token === "string" && token.trim().length > 0) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  private handleError(error: AxiosError): void {
    if (typeof window === 'undefined') return; // Skip on server-side

    const status = error.response?.status;
    const message = (error.response?.data as any)?.message || error.message;

    // Handle different error scenarios for mobile users
    switch (status) {
      case 401:
        this.handleUnauthorized();
        break;
      case 403:
        console.error('Access forbidden:', message);
        break;
      case 404:
        console.error('Resource not found:', message);
        break;
      case 422:
        console.error('Validation error:', message);
        break;
      case 429:
        console.error('Rate limit exceeded. Please try again later.');
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        console.error('Server error. Please try again later.');
        break;
      default:
        // Network errors or other issues
        if (!error.response) {
          console.error('Network error. Please check your connection.');
        } else {
          console.error('API Error:', message);
        }
    }
  }

  private handleUnauthorized(): void {
    if (typeof window === 'undefined') return;

    try {
      // Clear user data from localStorage
      localStorage.removeItem('user_account');
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Error handling unauthorized access:', error);
    }
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const userAccount = localStorage.getItem('user_account');
      if (!userAccount || userAccount === 'undefined') return null;
      
      const user = JSON.parse(userAccount);
      return user?.access_token ?? null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Utility method for handling network retries on mobile
  async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx)
        if (error instanceof AxiosError && error.response?.status && error.response.status < 500) {
          throw error;
        }

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }

    throw lastError!;
  }
}

export function getUserFromStorage(): any {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem("user_account");
    if (!raw || raw === "undefined") return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}