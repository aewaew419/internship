/**
 * 🎭 Mock Data Module
 * ===================
 * Central export point for all mock data functionality
 */

// Export mock data store
export { mockDataStore } from './store';

// Export mock API service
export { mockApiService, MockAPIService } from './service';

// Export existing admin mock data for backward compatibility
export * from './admin';

// Export API adapter
export { apiService, mockApiService as directMockService, switchToMockAPI, switchToRealAPI } from '../api/mock-adapter';
export type { APIInterface } from '../api/mock-adapter';

// Export types
export * from '../../types/mock';

// Import the service for configuration utilities
import { mockApiService } from './service';

// Utility functions for development and testing
export const configureMockAPI = {
  /**
   * Enable error simulation for testing error handling
   */
  enableErrors: (errorRate: number = 0.1) => {
    mockApiService.setErrorMode(true, errorRate);
  },

  /**
   * Disable error simulation
   */
  disableErrors: () => {
    mockApiService.setErrorMode(false);
  },

  /**
   * Simulate different network conditions
   */
  setNetworkCondition: (condition: 'fast' | 'slow' | 'mobile' | 'offline') => {
    mockApiService.setNetworkSimulation(condition);
  },

  /**
   * Reset to default configuration
   */
  reset: () => {
    mockApiService.setErrorMode(false);
    mockApiService.setNetworkSimulation('fast');
  },
};

// Development utilities (only available in development mode)
if (process.env.NODE_ENV === 'development') {
  // Make mock configuration available globally for debugging
  (globalThis as any).__mockAPI = {
    service: mockApiService,
    configure: configureMockAPI,
    store: mockDataStore,
  };

  console.log('🎭 Mock API utilities available at window.__mockAPI');
}