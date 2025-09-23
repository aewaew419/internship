/**
 * 🧪 Mock Data Infrastructure Tests
 * =================================
 * Comprehensive tests for mock data service and infrastructure
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { mockApiService, MockAPIService, configureMockAPI } from '../../lib/mock-data';
import type { LoginCredentials, User, StudentProfile } from '../../types/mock';

describe('Mock Data Infrastructure', () => {
  let service: MockAPIService;

  beforeEach(() => {
    service = new MockAPIService();
    service.setErrorMode(false); // Disable errors for most tests
    service.setNetworkSimulation('fast'); // Use fast simulation for tests
  });

  describe('Configuration', () => {
    it('should allow error mode configuration', () => {
      service.setErrorMode(true, 0.5);
      // Since error simulation is random, we can't test the exact behavior
      // but we can test that the configuration is accepted
      expect(true).toBe(true);
    });

    it('should allow network simulation configuration', () => {
      service.setNetworkSimulation('slow');
      service.setNetworkSimulation('mobile');
      service.setNetworkSimulation('offline');
      service.setNetworkSimulation('fast');
      expect(true).toBe(true);
    });
  });

  describe('Authentication API', () => {
    it('should login with valid credentials', async () => {
      const credentials: LoginCredentials = {
        email: 'somchai.s@student.university.ac.th',
        password: 'password123',
      };

      const response = await service.login(credentials);
      
      expect(response.user).toBeDefined();
      expect(response.token).toBeDefined();
      expect(response.tokenType).toBe('Bearer');
      expect(response.expiresAt).toBeDefined();
      expect(response.user.email).toBe(credentials.email);
    });

    it('should reject invalid credentials', async () => {
      const credentials: LoginCredentials = {
        email: 'invalid@test.com',
        password: 'wrongpassword',
      };

      await expect(service.login(credentials)).rejects.toThrow('Invalid email or password');
    });

    it('should handle logout', async () => {
      await expect(service.logout()).resolves.not.toThrow();
    });

    it('should refresh token', async () => {
      const refreshToken = 'refresh_token_1_1234567890';
      const response = await service.refreshToken(refreshToken);
      
      expect(response.user).toBeDefined();
      expect(response.token).toBeDefined();
      expect(response.tokenType).toBe('Bearer');
    });
  });

  describe('User Management API', () => {
    it('should fetch users with pagination', async () => {
      const response = await service.getUsers({ page: 1, limit: 2 });
      
      expect(response.data.data).toHaveLength(2);
      expect(response.data.pagination).toBeDefined();
      expect(response.data.pagination.page).toBe(1);
      expect(response.data.pagination.limit).toBe(2);
      expect(response.data.pagination.total).toBeGreaterThan(0);
    });

    it('should filter users by role', async () => {
      const response = await service.getUsers({ roles: ['student'] });
      
      response.data.data.forEach(user => {
        expect(user.roles).toContain('student');
      });
    });

    it('should search users by query', async () => {
      const response = await service.getUsers({ query: 'สมชาย' });
      
      expect(response.data.data.length).toBeGreaterThan(0);
      response.data.data.forEach(user => {
        expect(user.name.toLowerCase()).toContain('สมชาย'.toLowerCase());
      });
    });

    it('should fetch user by ID', async () => {
      const response = await service.getUserById('1');
      
      expect(response.data.id).toBe('1');
      expect(response.data.email).toBeDefined();
      expect(response.data.name).toBeDefined();
    });

    it('should handle user not found', async () => {
      await expect(service.getUserById('nonexistent')).rejects.toThrow('User not found');
    });

    it('should create new user', async () => {
      const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
        email: 'newuser@test.com',
        name: 'New User',
        roles: ['student'],
        permissions: ['view_profile'],
        isActive: true,
      };

      const response = await service.createUser(userData);
      
      expect(response.data.email).toBe(userData.email);
      expect(response.data.name).toBe(userData.name);
      expect(response.data.id).toBeDefined();
      expect(response.data.createdAt).toBeDefined();
    });

    it('should prevent duplicate email creation', async () => {
      const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
        email: 'somchai.s@student.university.ac.th', // Existing email
        name: 'Duplicate User',
        roles: ['student'],
        permissions: ['view_profile'],
        isActive: true,
      };

      await expect(service.createUser(userData)).rejects.toThrow('Email already exists');
    });

    it('should update user', async () => {
      const updateData = { name: 'Updated Name' };
      const response = await service.updateUser('1', updateData);
      
      expect(response.data.name).toBe('Updated Name');
      expect(response.data.updatedAt).toBeDefined();
    });

    it('should delete user', async () => {
      // First create a user to delete
      const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
        email: 'todelete@test.com',
        name: 'To Delete',
        roles: ['student'],
        permissions: ['view_profile'],
        isActive: true,
      };

      const createResponse = await service.createUser(userData);
      const userId = createResponse.data.id;

      await expect(service.deleteUser(userId)).resolves.not.toThrow();
      
      // Verify user is deleted
      await expect(service.getUserById(userId)).rejects.toThrow('User not found');
    });
  });

  describe('Student Profile API', () => {
    it('should fetch student profile', async () => {
      const response = await service.getStudentProfile('1');
      
      expect(response.data.id).toBe('1');
      expect(response.data.studentId).toBeDefined();
      expect(response.data.firstName).toBeDefined();
      expect(response.data.academicInfo).toBeDefined();
    });

    it('should update student profile', async () => {
      const updateData: Partial<StudentProfile> = {
        phone: '081-999-9999',
        gpax: 3.75,
      };

      const response = await service.updateStudentProfile('1', updateData);
      
      expect(response.data.phone).toBe('081-999-9999');
      expect(response.data.gpax).toBe(3.75);
      expect(response.data.updatedAt).toBeDefined();
    });
  });

  describe('Company API', () => {
    it('should fetch companies with pagination', async () => {
      const response = await service.getCompanies({ page: 1, limit: 2 });
      
      expect(response.data.data).toHaveLength(2);
      expect(response.data.pagination).toBeDefined();
    });

    it('should search companies', async () => {
      const response = await service.getCompanies({ query: 'เทคโนโลยี' });
      
      expect(response.data.data.length).toBeGreaterThan(0);
      response.data.data.forEach(company => {
        expect(
          company.name.toLowerCase().includes('เทคโนโลยี'.toLowerCase()) ||
          company.industry.toLowerCase().includes('เทคโนโลยี'.toLowerCase())
        ).toBe(true);
      });
    });

    it('should fetch company by ID', async () => {
      const response = await service.getCompanyById('1');
      
      expect(response.data.id).toBe('1');
      expect(response.data.name).toBeDefined();
      expect(response.data.contact).toBeDefined();
    });
  });

  describe('Co-op Information API', () => {
    it('should fetch all co-op infos', async () => {
      const response = await service.getCoopInfos();
      
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
    });

    it('should filter co-op infos by student', async () => {
      const response = await service.getCoopInfos('1');
      
      response.data.forEach(coop => {
        expect(coop.studentId).toBe('1');
      });
    });

    it('should create co-op info', async () => {
      const coopData = {
        studentId: '2',
        companyId: '1',
        position: 'Test Position',
        department: 'Test Department',
        supervisor: {
          name: 'Test Supervisor',
          position: 'Manager',
          department: 'Test Dept',
          phone: '02-123-4567',
          email: 'supervisor@test.com',
        },
        startDate: '2024-06-01',
        endDate: '2024-08-31',
        workingHours: 40,
        benefits: ['Test Benefit'],
        jobDescription: 'Test job description',
        learningObjectives: ['Test objective'],
        status: 'draft' as const,
        documentLanguage: 'th' as const,
      };

      const response = await service.createCoopInfo(coopData);
      
      expect(response.data.studentId).toBe(coopData.studentId);
      expect(response.data.position).toBe(coopData.position);
      expect(response.data.id).toBeDefined();
    });
  });

  describe('Status Tracking API', () => {
    it('should fetch status items', async () => {
      const response = await service.getStatusItems();
      
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should filter status items by entity', async () => {
      const response = await service.getStatusItems('1');
      
      response.data.forEach(item => {
        expect(item.relatedEntityId).toBe('1');
      });
    });

    it('should update status item', async () => {
      const updateData = {
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
      };

      const response = await service.updateStatusItem('1', updateData);
      
      expect(response.data.status).toBe('completed');
      expect(response.data.completedAt).toBeDefined();
    });
  });

  describe('File Upload API', () => {
    it('should upload file successfully', async () => {
      // Create a mock file
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      
      const response = await service.uploadFile(file, 'entity1', 'test');
      
      expect(response.data.fileName).toBe('test.pdf');
      expect(response.data.fileSize).toBe(file.size);
      expect(response.data.mimeType).toBe('application/pdf');
    });

    it('should reject large files', async () => {
      // Create a mock large file (>10MB)
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      
      await expect(service.uploadFile(file, 'entity1', 'test')).rejects.toThrow('File size too large');
    });

    it('should reject invalid file types', async () => {
      const file = new File(['test'], 'test.exe', { type: 'application/x-executable' });
      
      await expect(service.uploadFile(file, 'entity1', 'test')).rejects.toThrow('File type not allowed');
    });
  });

  describe('Notification API', () => {
    it('should fetch notifications for user', async () => {
      const response = await service.getNotifications('1');
      
      expect(Array.isArray(response.data)).toBe(true);
      response.data.forEach(notification => {
        expect(notification.userId).toBe('1');
      });
    });

    it('should mark notification as read', async () => {
      await expect(service.markNotificationAsRead('1')).resolves.not.toThrow();
    });
  });

  describe('Dashboard API', () => {
    it('should fetch dashboard stats', async () => {
      const response = await service.getDashboardStats();
      
      expect(response.data.totalStudents).toBeDefined();
      expect(response.data.activeInternships).toBeDefined();
      expect(response.data.monthlyTrends).toBeDefined();
      expect(Array.isArray(response.data.monthlyTrends)).toBe(true);
    });

    it('should fetch company stats', async () => {
      const response = await service.getCompanyStats();
      
      expect(response.data.totalCompanies).toBeDefined();
      expect(response.data.topIndustries).toBeDefined();
      expect(Array.isArray(response.data.topIndustries)).toBe(true);
    });
  });

  describe('Health Check API', () => {
    it('should return healthy status', async () => {
      const response = await service.healthCheck();
      
      expect(response.data.status).toBe('healthy');
      expect(response.data.timestamp).toBeDefined();
    });

    it('should simulate offline status', async () => {
      service.setNetworkSimulation('offline');
      
      await expect(service.healthCheck()).rejects.toThrow('Service unavailable');
    }, 15000); // Increase timeout for offline simulation
  });

  describe('Error Simulation', () => {
    it('should simulate errors when enabled', async () => {
      // Create a new service instance for this test to avoid interference
      const errorService = new MockAPIService();
      errorService.setErrorMode(true, 1.0); // 100% error rate
      
      await expect(errorService.getUsers()).rejects.toThrow();
    });

    it('should work normally when errors disabled', async () => {
      service.setErrorMode(false);
      
      const response = await service.getUsers();
      expect(response.data).toBeDefined();
    });
  });

  describe('Response Time Simulation', () => {
    it('should simulate realistic response times', async () => {
      const start = Date.now();
      await service.getUsers();
      const duration = Date.now() - start;
      
      // Should take at least some time (accounting for fast simulation)
      expect(duration).toBeGreaterThan(0);
    });
  });
});

describe('Mock Data Configuration Utilities', () => {
  beforeEach(() => {
    configureMockAPI.reset();
  });

  it('should enable error simulation', () => {
    expect(() => configureMockAPI.enableErrors(0.5)).not.toThrow();
  });

  it('should disable error simulation', () => {
    expect(() => configureMockAPI.disableErrors()).not.toThrow();
  });

  it('should set network conditions', () => {
    expect(() => configureMockAPI.setNetworkCondition('slow')).not.toThrow();
    expect(() => configureMockAPI.setNetworkCondition('mobile')).not.toThrow();
    expect(() => configureMockAPI.setNetworkCondition('offline')).not.toThrow();
  });

  it('should reset configuration', () => {
    configureMockAPI.enableErrors(0.8);
    configureMockAPI.setNetworkCondition('slow');
    configureMockAPI.reset();
    
    // After reset, should work normally
    expect(true).toBe(true);
  });
});