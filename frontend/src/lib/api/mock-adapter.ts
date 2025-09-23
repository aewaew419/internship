/**
 * 🔄 Mock API Adapter
 * ===================
 * Adapter layer that allows seamless switching between mock and real API
 * Maintains consistent interface for easy migration
 */

import { mockApiService } from '../mock-data/service';
import { apiClient } from './client';
import type {
  User,
  StudentProfile,
  Company,
  CoopInfo,
  StatusItem,
  Notification,
  DashboardStats,
  LoginCredentials,
  AuthResponse,
  SearchFilters,
  MockAPIResponse,
  PaginatedResponse,
} from '../../types/mock';

// Environment configuration
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' || process.env.NODE_ENV === 'development';

// API Interface that both mock and real API must implement
export interface APIInterface {
  // Authentication
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  logout(): Promise<void>;
  refreshToken(refreshToken: string): Promise<AuthResponse>;

  // Users
  getUsers(filters?: SearchFilters): Promise<MockAPIResponse<PaginatedResponse<User>>>;
  getUserById(id: string): Promise<MockAPIResponse<User>>;
  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<MockAPIResponse<User>>;
  updateUser(id: string, userData: Partial<User>): Promise<MockAPIResponse<User>>;
  deleteUser(id: string): Promise<MockAPIResponse<void>>;

  // Student Profiles
  getStudentProfile(id: string): Promise<MockAPIResponse<StudentProfile>>;
  updateStudentProfile(id: string, profileData: Partial<StudentProfile>): Promise<MockAPIResponse<StudentProfile>>;

  // Companies
  getCompanies(filters?: SearchFilters): Promise<MockAPIResponse<PaginatedResponse<Company>>>;
  getCompanyById(id: string): Promise<MockAPIResponse<Company>>;

  // Co-op Information
  getCoopInfos(studentId?: string): Promise<MockAPIResponse<CoopInfo[]>>;
  createCoopInfo(coopData: Omit<CoopInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<MockAPIResponse<CoopInfo>>;

  // Status Tracking
  getStatusItems(relatedEntityId?: string): Promise<MockAPIResponse<StatusItem[]>>;
  updateStatusItem(id: string, statusData: Partial<StatusItem>): Promise<MockAPIResponse<StatusItem>>;

  // Notifications
  getNotifications(userId: string): Promise<MockAPIResponse<Notification[]>>;
  markNotificationAsRead(id: string): Promise<MockAPIResponse<void>>;

  // Dashboard
  getDashboardStats(): Promise<MockAPIResponse<DashboardStats>>;

  // File Upload
  uploadFile(file: File, entityId: string, entityType: string): Promise<MockAPIResponse<any>>;

  // Health Check
  healthCheck(): Promise<MockAPIResponse<{ status: string; timestamp: string }>>;
}

// Real API Implementation (placeholder for when backend is ready)
class RealAPIService implements APIInterface {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.getAxiosInstance().post('/auth/login', credentials);
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.getAxiosInstance().post('/auth/logout');
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.getAxiosInstance().post('/auth/refresh', { refreshToken });
    return response.data;
  }

  async getUsers(filters?: SearchFilters): Promise<MockAPIResponse<PaginatedResponse<User>>> {
    const response = await apiClient.getAxiosInstance().get('/users', { params: filters });
    return response.data;
  }

  async getUserById(id: string): Promise<MockAPIResponse<User>> {
    const response = await apiClient.getAxiosInstance().get(`/users/${id}`);
    return response.data;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<MockAPIResponse<User>> {
    const response = await apiClient.getAxiosInstance().post('/users', userData);
    return response.data;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<MockAPIResponse<User>> {
    const response = await apiClient.getAxiosInstance().put(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: string): Promise<MockAPIResponse<void>> {
    const response = await apiClient.getAxiosInstance().delete(`/users/${id}`);
    return response.data;
  }

  async getStudentProfile(id: string): Promise<MockAPIResponse<StudentProfile>> {
    const response = await apiClient.getAxiosInstance().get(`/students/${id}`);
    return response.data;
  }

  async updateStudentProfile(id: string, profileData: Partial<StudentProfile>): Promise<MockAPIResponse<StudentProfile>> {
    const response = await apiClient.getAxiosInstance().put(`/students/${id}`, profileData);
    return response.data;
  }

  async getCompanies(filters?: SearchFilters): Promise<MockAPIResponse<PaginatedResponse<Company>>> {
    const response = await apiClient.getAxiosInstance().get('/companies', { params: filters });
    return response.data;
  }

  async getCompanyById(id: string): Promise<MockAPIResponse<Company>> {
    const response = await apiClient.getAxiosInstance().get(`/companies/${id}`);
    return response.data;
  }

  async getCoopInfos(studentId?: string): Promise<MockAPIResponse<CoopInfo[]>> {
    const params = studentId ? { studentId } : {};
    const response = await apiClient.getAxiosInstance().get('/coop-infos', { params });
    return response.data;
  }

  async createCoopInfo(coopData: Omit<CoopInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<MockAPIResponse<CoopInfo>> {
    const response = await apiClient.getAxiosInstance().post('/coop-infos', coopData);
    return response.data;
  }

  async getStatusItems(relatedEntityId?: string): Promise<MockAPIResponse<StatusItem[]>> {
    const params = relatedEntityId ? { relatedEntityId } : {};
    const response = await apiClient.getAxiosInstance().get('/status-items', { params });
    return response.data;
  }

  async updateStatusItem(id: string, statusData: Partial<StatusItem>): Promise<MockAPIResponse<StatusItem>> {
    const response = await apiClient.getAxiosInstance().put(`/status-items/${id}`, statusData);
    return response.data;
  }

  async getNotifications(userId: string): Promise<MockAPIResponse<Notification[]>> {
    const response = await apiClient.getAxiosInstance().get(`/notifications?userId=${userId}`);
    return response.data;
  }

  async markNotificationAsRead(id: string): Promise<MockAPIResponse<void>> {
    const response = await apiClient.getAxiosInstance().put(`/notifications/${id}/read`);
    return response.data;
  }

  async getDashboardStats(): Promise<MockAPIResponse<DashboardStats>> {
    const response = await apiClient.getAxiosInstance().get('/dashboard/stats');
    return response.data;
  }

  async uploadFile(file: File, entityId: string, entityType: string): Promise<MockAPIResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityId', entityId);
    formData.append('entityType', entityType);

    const response = await apiClient.getAxiosInstance().post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async healthCheck(): Promise<MockAPIResponse<{ status: string; timestamp: string }>> {
    const response = await apiClient.getAxiosInstance().get('/health');
    return response.data;
  }
}

// Mock API Wrapper that implements the same interface
class MockAPIWrapper implements APIInterface {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return mockApiService.login(credentials);
  }

  async logout(): Promise<void> {
    return mockApiService.logout();
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return mockApiService.refreshToken(refreshToken);
  }

  async getUsers(filters?: SearchFilters): Promise<MockAPIResponse<PaginatedResponse<User>>> {
    return mockApiService.getUsers(filters);
  }

  async getUserById(id: string): Promise<MockAPIResponse<User>> {
    return mockApiService.getUserById(id);
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<MockAPIResponse<User>> {
    return mockApiService.createUser(userData);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<MockAPIResponse<User>> {
    return mockApiService.updateUser(id, userData);
  }

  async deleteUser(id: string): Promise<MockAPIResponse<void>> {
    return mockApiService.deleteUser(id);
  }

  async getStudentProfile(id: string): Promise<MockAPIResponse<StudentProfile>> {
    return mockApiService.getStudentProfile(id);
  }

  async updateStudentProfile(id: string, profileData: Partial<StudentProfile>): Promise<MockAPIResponse<StudentProfile>> {
    return mockApiService.updateStudentProfile(id, profileData);
  }

  async getCompanies(filters?: SearchFilters): Promise<MockAPIResponse<PaginatedResponse<Company>>> {
    return mockApiService.getCompanies(filters);
  }

  async getCompanyById(id: string): Promise<MockAPIResponse<Company>> {
    return mockApiService.getCompanyById(id);
  }

  async getCoopInfos(studentId?: string): Promise<MockAPIResponse<CoopInfo[]>> {
    return mockApiService.getCoopInfos(studentId);
  }

  async createCoopInfo(coopData: Omit<CoopInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<MockAPIResponse<CoopInfo>> {
    return mockApiService.createCoopInfo(coopData);
  }

  async getStatusItems(relatedEntityId?: string): Promise<MockAPIResponse<StatusItem[]>> {
    return mockApiService.getStatusItems(relatedEntityId);
  }

  async updateStatusItem(id: string, statusData: Partial<StatusItem>): Promise<MockAPIResponse<StatusItem>> {
    return mockApiService.updateStatusItem(id, statusData);
  }

  async getNotifications(userId: string): Promise<MockAPIResponse<Notification[]>> {
    return mockApiService.getNotifications(userId);
  }

  async markNotificationAsRead(id: string): Promise<MockAPIResponse<void>> {
    return mockApiService.markNotificationAsRead(id);
  }

  async getDashboardStats(): Promise<MockAPIResponse<DashboardStats>> {
    return mockApiService.getDashboardStats();
  }

  async uploadFile(file: File, entityId: string, entityType: string): Promise<MockAPIResponse<any>> {
    return mockApiService.uploadFile(file, entityId, entityType);
  }

  async healthCheck(): Promise<MockAPIResponse<{ status: string; timestamp: string }>> {
    return mockApiService.healthCheck();
  }
}

// Create the appropriate service instance based on configuration
const createAPIService = (): APIInterface => {
  if (USE_MOCK_API) {
    console.log('🎭 Using Mock API Service');
    return new MockAPIWrapper();
  } else {
    console.log('🌐 Using Real API Service');
    return new RealAPIService();
  }
};

// Export the configured API service
export const apiService = createAPIService();

// Export utilities for testing and configuration
export const switchToMockAPI = () => {
  console.log('🎭 Switching to Mock API');
  // In a real implementation, you might want to reload the service
  // For now, this is mainly for development/testing purposes
};

export const switchToRealAPI = () => {
  console.log('🌐 Switching to Real API');
  // In a real implementation, you might want to reload the service
};

// Export mock service for direct access (useful for testing)
export { mockApiService };

// Export types
export type { APIInterface };