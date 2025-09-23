'use client';

import { AxiosError } from 'axios';
import type { APIError } from '../../types/api';

export class APIErrorHandler {
  /**
   * Convert axios error to standardized API error
   */
  static handleError(error: AxiosError): APIError {
    const status = error.response?.status || 500;
    const message = (error.response?.data as any)?.message || error.message;

    return {
      message,
      status,
      code: (error.response?.data as any)?.code,
    };
  }

  /**
   * Get user-friendly error message for mobile users
   */
  static getUserFriendlyMessage(error: APIError): string {
    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Please log in to continue.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 422:
        return 'Please check your input and try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Server error. Please try again later.';
      default:
        if (error.status >= 500) {
          return 'Server error. Please try again later.';
        }
        return error.message || 'An unexpected error occurred.';
    }
  }

  /**
   * Check if error is a network error (no response from server)
   */
  static isNetworkError(error: AxiosError): boolean {
    return !error.response && error.code !== 'ECONNABORTED';
  }

  /**
   * Check if error is a timeout error
   */
  static isTimeoutError(error: AxiosError): boolean {
    return error.code === 'ECONNABORTED' || error.message.includes('timeout');
  }

  /**
   * Check if error should be retried (for mobile networks)
   */
  static shouldRetry(error: AxiosError): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      this.isNetworkError(error) ||
      this.isTimeoutError(error) ||
      (error.response?.status && error.response.status >= 500)
    );
  }

  /**
   * Show appropriate error message to user
   */
  static showErrorToUser(error: APIError): void {
    const message = this.getUserFriendlyMessage(error);
    
    // In a real app, you might use a toast library or modal
    // For now, we'll use console.error and could integrate with a notification system
    console.error('API Error:', message);
    
    // You could integrate with a toast notification library here
    // toast.error(message);
  }
}