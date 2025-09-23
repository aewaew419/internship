/**
 * 🧪 Simple Mock Data Infrastructure Test
 * =======================================
 * Basic tests to verify mock data infrastructure is working
 */

import { describe, it, expect } from '@jest/globals';
import { mockApiService, mockDataStore, configureMockAPI } from '../../lib/mock-data';

describe('Mock Data Infrastructure - Basic Tests', () => {
  it('should have mock data store with users', () => {
    expect(mockDataStore.users).toBeDefined();
    expect(Array.isArray(mockDataStore.users)).toBe(true);
    expect(mockDataStore.users.length).toBeGreaterThan(0);
  });

  it('should have mock data store with companies', () => {
    expect(mockDataStore.companies).toBeDefined();
    expect(Array.isArray(mockDataStore.companies)).toBe(true);
    expect(mockDataStore.companies.length).toBeGreaterThan(0);
  });

  it('should have mock API service', () => {
    expect(mockApiService).toBeDefined();
    expect(typeof mockApiService.login).toBe('function');
    expect(typeof mockApiService.getUsers).toBe('function');
  });

  it('should have configuration utilities', () => {
    expect(configureMockAPI).toBeDefined();
    expect(typeof configureMockAPI.enableErrors).toBe('function');
    expect(typeof configureMockAPI.disableErrors).toBe('function');
    expect(typeof configureMockAPI.setNetworkCondition).toBe('function');
    expect(typeof configureMockAPI.reset).toBe('function');
  });

  it('should login with valid credentials', async () => {
    const credentials = {
      email: 'somchai.s@student.university.ac.th',
      password: 'password123',
    };

    const response = await mockApiService.login(credentials);
    
    expect(response.user).toBeDefined();
    expect(response.token).toBeDefined();
    expect(response.tokenType).toBe('Bearer');
    expect(response.user.email).toBe(credentials.email);
  });

  it('should fetch users', async () => {
    const response = await mockApiService.getUsers();
    
    expect(response.data).toBeDefined();
    expect(response.data.data).toBeDefined();
    expect(Array.isArray(response.data.data)).toBe(true);
    expect(response.data.pagination).toBeDefined();
  });

  it('should fetch companies', async () => {
    const response = await mockApiService.getCompanies();
    
    expect(response.data).toBeDefined();
    expect(response.data.data).toBeDefined();
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  it('should handle configuration changes', () => {
    expect(() => {
      configureMockAPI.enableErrors(0.5);
      configureMockAPI.setNetworkCondition('slow');
      configureMockAPI.disableErrors();
      configureMockAPI.reset();
    }).not.toThrow();
  });
});