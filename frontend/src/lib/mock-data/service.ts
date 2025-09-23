/**
 * 🎭 Mock API Service
 * ===================
 * Comprehensive mock API service with realistic response times and error simulation
 * Designed for seamless migration to real API
 */

import type {
  User,
  StudentProfile,
  InstructorProfile,
  VisitorProfile,
  Company,
  CoopInfo,
  StudentEvaluateCompany,
  CompanyEvaluateStudent,
  VisitorEvaluation,
  StatusItem,
  Document,
  VisitorSchedule,
  Notification,
  DashboardStats,
  CompanyStats,
  MockAPIResponse,
  MockAPIError,
  PaginatedResponse,
  LoginCredentials,
  AuthResponse,
  SearchFilters,
} from '../../types/mock';

import { mockDataStore } from './store';

// Configuration for mock behavior
interface MockConfig {
  enableErrors: boolean;
  errorRate: number; // 0-1, percentage of requests that should fail
  minDelay: number; // minimum response delay in ms
  maxDelay: number; // maximum response delay in ms
  networkSimulation: 'fast' | 'slow' | 'mobile' | 'offline';
}

class MockAPIService {
  private config: MockConfig = {
    enableErrors: false,
    errorRate: 0.1, // 10% error rate when enabled
    minDelay: 200,
    maxDelay: 1000,
    networkSimulation: 'fast',
  };

  // Configuration methods
  setErrorMode(enabled: boolean, errorRate: number = 0.1): void {
    this.config.enableErrors = enabled;
    this.config.errorRate = errorRate;
  }

  setNetworkSimulation(type: 'fast' | 'slow' | 'mobile' | 'offline'): void {
    this.config.networkSimulation = type;
    
    switch (type) {
      case 'fast':
        this.config.minDelay = 50;
        this.config.maxDelay = 200;
        break;
      case 'slow':
        this.config.minDelay = 500;
        this.config.maxDelay = 2000;
        break;
      case 'mobile':
        this.config.minDelay = 800;
        this.config.maxDelay = 3000;
        break;
      case 'offline':
        this.config.minDelay = 5000;
        this.config.maxDelay = 10000;
        break;
    }
  }

  // Utility methods
  private async simulateDelay(): Promise<void> {
    const delay = Math.random() * (this.config.maxDelay - this.config.minDelay) + this.config.minDelay;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private shouldSimulateError(): boolean {
    if (!this.config.enableErrors) return false;
    return Math.random() < this.config.errorRate;
  }

  private createError(message: string, status: number = 500, code?: string): MockAPIError {
    return {
      code: code || `ERROR_${status}`,
      message,
      status,
      timestamp: new Date().toISOString(),
    };
  }

  private createResponse<T>(data: T, message?: string): MockAPIResponse<T> {
    return {
      data,
      message,
      status: 200,
      timestamp: new Date().toISOString(),
    };
  }

  private createPaginatedResponse<T>(
    data: T[],
    page: number = 1,
    limit: number = 10,
    total?: number
  ): MockAPIResponse<PaginatedResponse<T>> {
    const actualTotal = total || data.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = data.slice(startIndex, endIndex);
    const totalPages = Math.ceil(actualTotal / limit);

    return this.createResponse({
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: actualTotal,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  }

  // Authentication API
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw new Error('Network error occurred');
    }

    // Simulate invalid credentials
    if (credentials.email === 'invalid@test.com') {
      throw new Error('Invalid email or password');
    }

    // Find user by email
    const user = mockDataStore.users.find(u => u.email === credentials.email);
    if (!user) {
      throw new Error('User not found');
    }

    // Simulate password check (in real app, this would be hashed)
    if (credentials.password !== 'password123') {
      throw new Error('Invalid email or password');
    }

    return {
      user,
      token: `mock_token_${user.id}_${Date.now()}`,
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      refreshToken: `refresh_token_${user.id}_${Date.now()}`,
    };
  }

  async logout(): Promise<void> {
    await this.simulateDelay();
    
    if (this.shouldSimulateError()) {
      throw this.createError('Logout failed', 500, 'LOGOUT_ERROR');
    }
    
    // In real implementation, this would invalidate the token
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw this.createError('Token refresh failed', 401, 'TOKEN_REFRESH_FAILED');
    }

    // Extract user ID from refresh token (mock implementation)
    const userId = refreshToken.split('_')[2];
    const user = mockDataStore.users.find(u => u.id === userId);
    
    if (!user) {
      throw this.createError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    return {
      user,
      token: `mock_token_${user.id}_${Date.now()}`,
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      refreshToken: `refresh_token_${user.id}_${Date.now()}`,
    };
  }

  // User Management API
  async getUsers(filters?: SearchFilters): Promise<MockAPIResponse<PaginatedResponse<User>>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw new Error('Failed to fetch users');
    }

    let filteredUsers = [...mockDataStore.users];

    // Apply filters
    if (filters?.query) {
      const query = filters.query.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    if (filters?.roles && filters.roles.length > 0) {
      filteredUsers = filteredUsers.filter(user =>
        user.roles.some(role => filters.roles!.includes(role))
      );
    }

    // Apply sorting
    if (filters?.sortBy) {
      filteredUsers.sort((a, b) => {
        const aValue = (a as any)[filters.sortBy!];
        const bValue = (b as any)[filters.sortBy!];
        const order = filters.sortOrder === 'desc' ? -1 : 1;
        return aValue > bValue ? order : -order;
      });
    }

    return this.createPaginatedResponse(
      filteredUsers,
      filters?.page || 1,
      filters?.limit || 10
    );
  }

  async getUserById(id: string): Promise<MockAPIResponse<User>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw new Error('Failed to fetch user');
    }

    const user = mockDataStore.users.find(u => u.id === id);
    if (!user) {
      throw new Error('User not found');
    }

    return this.createResponse(user);
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<MockAPIResponse<User>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw new Error('Failed to create user');
    }

    // Check if email already exists
    if (mockDataStore.users.some(u => u.email === userData.email)) {
      throw new Error('Email already exists');
    }

    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockDataStore.users.push(newUser);
    return this.createResponse(newUser, 'User created successfully');
  }

  async updateUser(id: string, userData: Partial<User>): Promise<MockAPIResponse<User>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw this.createError('Failed to update user', 500, 'UPDATE_USER_ERROR');
    }

    const userIndex = mockDataStore.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw this.createError('User not found', 404, 'USER_NOT_FOUND');
    }

    const updatedUser = {
      ...mockDataStore.users[userIndex],
      ...userData,
      updatedAt: new Date().toISOString(),
    };

    mockDataStore.users[userIndex] = updatedUser;
    return this.createResponse(updatedUser, 'User updated successfully');
  }

  async deleteUser(id: string): Promise<MockAPIResponse<void>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw new Error('Failed to delete user');
    }

    const userIndex = mockDataStore.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    mockDataStore.users.splice(userIndex, 1);
    return this.createResponse(undefined, 'User deleted successfully');
  }

  // Student Profile API
  async getStudentProfile(id: string): Promise<MockAPIResponse<StudentProfile>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw this.createError('Failed to fetch student profile', 500, 'FETCH_STUDENT_ERROR');
    }

    const profile = mockDataStore.studentProfiles.find(p => p.id === id);
    if (!profile) {
      throw this.createError('Student profile not found', 404, 'STUDENT_NOT_FOUND');
    }

    return this.createResponse(profile);
  }

  async updateStudentProfile(id: string, profileData: Partial<StudentProfile>): Promise<MockAPIResponse<StudentProfile>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw this.createError('Failed to update student profile', 500, 'UPDATE_STUDENT_ERROR');
    }

    const profileIndex = mockDataStore.studentProfiles.findIndex(p => p.id === id);
    if (profileIndex === -1) {
      throw this.createError('Student profile not found', 404, 'STUDENT_NOT_FOUND');
    }

    const updatedProfile = {
      ...mockDataStore.studentProfiles[profileIndex],
      ...profileData,
      updatedAt: new Date().toISOString(),
    };

    mockDataStore.studentProfiles[profileIndex] = updatedProfile;
    return this.createResponse(updatedProfile, 'Student profile updated successfully');
  }

  // Company API
  async getCompanies(filters?: SearchFilters): Promise<MockAPIResponse<PaginatedResponse<Company>>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw this.createError('Failed to fetch companies', 500, 'FETCH_COMPANIES_ERROR');
    }

    let filteredCompanies = [...mockDataStore.companies];

    // Apply filters
    if (filters?.query) {
      const query = filters.query.toLowerCase();
      filteredCompanies = filteredCompanies.filter(company =>
        company.name.toLowerCase().includes(query) ||
        company.industry.toLowerCase().includes(query)
      );
    }

    return this.createPaginatedResponse(
      filteredCompanies,
      filters?.page || 1,
      filters?.limit || 10
    );
  }

  async getCompanyById(id: string): Promise<MockAPIResponse<Company>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw this.createError('Failed to fetch company', 500, 'FETCH_COMPANY_ERROR');
    }

    const company = mockDataStore.companies.find(c => c.id === id);
    if (!company) {
      throw this.createError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    return this.createResponse(company);
  }

  // Co-op Information API
  async getCoopInfos(studentId?: string): Promise<MockAPIResponse<CoopInfo[]>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw this.createError('Failed to fetch co-op information', 500, 'FETCH_COOP_ERROR');
    }

    let coopInfos = mockDataStore.coopInfos;
    if (studentId) {
      coopInfos = coopInfos.filter(coop => coop.studentId === studentId);
    }

    return this.createResponse(coopInfos);
  }

  async createCoopInfo(coopData: Omit<CoopInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<MockAPIResponse<CoopInfo>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw this.createError('Failed to create co-op information', 500, 'CREATE_COOP_ERROR');
    }

    const newCoopInfo: CoopInfo = {
      ...coopData,
      id: `coop_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockDataStore.coopInfos.push(newCoopInfo);
    return this.createResponse(newCoopInfo, 'Co-op information created successfully');
  }

  // Status Tracking API
  async getStatusItems(relatedEntityId?: string): Promise<MockAPIResponse<StatusItem[]>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw this.createError('Failed to fetch status items', 500, 'FETCH_STATUS_ERROR');
    }

    let statusItems = mockDataStore.statusItems;
    if (relatedEntityId) {
      statusItems = statusItems.filter(item => item.relatedEntityId === relatedEntityId);
    }

    return this.createResponse(statusItems);
  }

  async updateStatusItem(id: string, statusData: Partial<StatusItem>): Promise<MockAPIResponse<StatusItem>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw this.createError('Failed to update status item', 500, 'UPDATE_STATUS_ERROR');
    }

    const itemIndex = mockDataStore.statusItems.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      throw this.createError('Status item not found', 404, 'STATUS_NOT_FOUND');
    }

    const updatedItem = {
      ...mockDataStore.statusItems[itemIndex],
      ...statusData,
      updatedAt: new Date().toISOString(),
    };

    mockDataStore.statusItems[itemIndex] = updatedItem;
    return this.createResponse(updatedItem, 'Status item updated successfully');
  }

  // Evaluation API
  async submitStudentEvaluation(evaluation: Omit<StudentEvaluateCompany, 'id' | 'submittedAt' | 'createdAt' | 'updatedAt'>): Promise<MockAPIResponse<StudentEvaluateCompany>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw this.createError('Failed to submit evaluation', 500, 'SUBMIT_EVALUATION_ERROR');
    }

    const newEvaluation: StudentEvaluateCompany = {
      ...evaluation,
      id: `eval_${Date.now()}`,
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockDataStore.studentEvaluateCompanies.push(newEvaluation);
    return this.createResponse(newEvaluation, 'Evaluation submitted successfully');
  }

  // Notification API
  async getNotifications(userId: string): Promise<MockAPIResponse<Notification[]>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw this.createError('Failed to fetch notifications', 500, 'FETCH_NOTIFICATIONS_ERROR');
    }

    const notifications = mockDataStore.notifications.filter(n => n.userId === userId);
    return this.createResponse(notifications);
  }

  async markNotificationAsRead(id: string): Promise<MockAPIResponse<void>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw this.createError('Failed to mark notification as read', 500, 'MARK_READ_ERROR');
    }

    const notificationIndex = mockDataStore.notifications.findIndex(n => n.id === id);
    if (notificationIndex !== -1) {
      mockDataStore.notifications[notificationIndex].isRead = true;
      mockDataStore.notifications[notificationIndex].readAt = new Date().toISOString();
    }

    return this.createResponse(undefined, 'Notification marked as read');
  }

  // Dashboard API
  async getDashboardStats(): Promise<MockAPIResponse<DashboardStats>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw this.createError('Failed to fetch dashboard stats', 500, 'FETCH_STATS_ERROR');
    }

    return this.createResponse(mockDataStore.dashboardStats);
  }

  async getCompanyStats(): Promise<MockAPIResponse<CompanyStats>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw this.createError('Failed to fetch company stats', 500, 'FETCH_COMPANY_STATS_ERROR');
    }

    return this.createResponse(mockDataStore.companyStats);
  }

  // File Upload API (mock)
  async uploadFile(file: File, entityId: string, entityType: string): Promise<MockAPIResponse<Document>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      throw new Error('File upload failed');
    }

    // Simulate file size validation
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size too large');
    }

    // Simulate file type validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed');
    }

    const newDocument: Document = {
      id: `doc_${Date.now()}`,
      name: file.name,
      type: 'document',
      fileName: file.name,
      filePath: `/uploads/${entityType}/${entityId}/${file.name}`,
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy: 'current_user_id', // In real app, this would come from auth context
      relatedEntityId: entityId,
      relatedEntityType: entityType,
      status: 'pending',
      version: 1,
      isLatest: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockDataStore.documents.push(newDocument);
    return this.createResponse(newDocument, 'File uploaded successfully');
  }

  // Health Check API
  async healthCheck(): Promise<MockAPIResponse<{ status: string; timestamp: string }>> {
    await this.simulateDelay();

    if (this.config.networkSimulation === 'offline') {
      throw new Error('Service unavailable');
    }

    return this.createResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  }
}

// Export singleton instance
export const mockApiService = new MockAPIService();

// Export class for testing
export { MockAPIService };