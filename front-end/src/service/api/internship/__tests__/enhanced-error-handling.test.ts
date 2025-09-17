import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  classifyInternshipError,
  getInternshipErrorMessage,
  executeInternshipApiCall,
  handleConcurrentUpdateConflict,
  InternshipErrorType,
  type InternshipError,
  type ConflictResolutionStrategy
} from '../enhanced-error-handling';
import { ErrorType } from '../../../../utils/errorHandling';

// Mock the utility functions
vi.mock('../../../../utils/errorHandling', () => ({
  classifyError: vi.fn(),
  logError: vi.fn(),
  ErrorType: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  }
}));

vi.mock('../../../../utils/retryMechanism', () => ({
  retryApiCall: vi.fn()
}));

describe('Enhanced Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('classifyInternshipError', () => {
    it('should classify concurrent update error correctly', () => {
      const mockError = {
        response: {
          status: 409,
          data: {
            type: 'concurrent_update',
            conflictData: { currentStatus: 't.approved', serverStatus: 'c.approved' }
          }
        }
      };

      const mockBaseError = {
        type: ErrorType.VALIDATION_ERROR,
        message: 'Conflict error',
        originalError: mockError,
        isRetryable: false,
        userMessage: 'Conflict occurred'
      };

      const { classifyError } = require('../../../../utils/errorHandling');
      classifyError.mockReturnValue(mockBaseError);

      const result = classifyInternshipError(mockError, {
        studentEnrollId: 123,
        currentStatus: 'registered',
        targetStatus: 't.approved'
      });

      expect(result).toEqual({
        ...mockBaseError,
        internshipErrorType: InternshipErrorType.CONCURRENT_UPDATE_ERROR,
        studentEnrollId: 123,
        currentStatus: 'registered',
        targetStatus: 't.approved',
        conflictData: { currentStatus: 't.approved', serverStatus: 'c.approved' }
      });
    });

    it('should classify status transition error correctly', () => {
      const mockError = {
        response: {
          status: 409,
          data: {
            type: 'status_transition'
          }
        }
      };

      const mockBaseError = {
        type: ErrorType.VALIDATION_ERROR,
        message: 'Status transition error',
        originalError: mockError,
        isRetryable: false,
        userMessage: 'Invalid transition'
      };

      const { classifyError } = require('../../../../utils/errorHandling');
      classifyError.mockReturnValue(mockBaseError);

      const result = classifyInternshipError(mockError);

      expect(result.internshipErrorType).toBe(InternshipErrorType.STATUS_TRANSITION_ERROR);
    });

    it('should classify permission error correctly', () => {
      const mockError = {
        response: {
          status: 403,
          data: { message: 'Access forbidden' }
        }
      };

      const mockBaseError = {
        type: ErrorType.AUTHORIZATION_ERROR,
        message: 'Access forbidden',
        originalError: mockError,
        isRetryable: false,
        userMessage: 'Access denied'
      };

      const { classifyError } = require('../../../../utils/errorHandling');
      classifyError.mockReturnValue(mockBaseError);

      const result = classifyInternshipError(mockError);

      expect(result.internshipErrorType).toBe(InternshipErrorType.PERMISSION_ERROR);
    });
  });

  describe('getInternshipErrorMessage', () => {
    it('should return correct Thai message for status transition error', () => {
      const error: InternshipError = {
        type: ErrorType.VALIDATION_ERROR,
        message: 'Status transition error',
        originalError: {},
        isRetryable: false,
        userMessage: 'Invalid transition',
        internshipErrorType: InternshipErrorType.STATUS_TRANSITION_ERROR,
        currentStatus: 'registered',
        targetStatus: 't.approved'
      };

      const result = getInternshipErrorMessage(error);
      expect(result).toBe('ไม่สามารถเปลี่ยนสถานะได้ เนื่องจากการเปลี่ยนแปลงนี้ไม่ถูกต้องตามขั้นตอน');
    });

    it('should return correct Thai message for concurrent update error', () => {
      const error: InternshipError = {
        type: ErrorType.VALIDATION_ERROR,
        message: 'Concurrent update error',
        originalError: {},
        isRetryable: false,
        userMessage: 'Conflict occurred',
        internshipErrorType: InternshipErrorType.CONCURRENT_UPDATE_ERROR,
        currentStatus: 'registered',
        targetStatus: 't.approved'
      };

      const result = getInternshipErrorMessage(error);
      expect(result).toBe('สถานะได้ถูกเปลี่ยนแปลงโดยผู้ใช้อื่นแล้ว กรุณารีเฟรชและลองใหม่');
    });

    it('should return correct Thai message for permission error', () => {
      const error: InternshipError = {
        type: ErrorType.AUTHORIZATION_ERROR,
        message: 'Permission error',
        originalError: {},
        isRetryable: false,
        userMessage: 'Access denied',
        internshipErrorType: InternshipErrorType.PERMISSION_ERROR,
        currentStatus: 'registered',
        targetStatus: 't.approved'
      };

      const result = getInternshipErrorMessage(error);
      expect(result).toBe('คุณไม่มีสิทธิ์ในการดำเนินการนี้');
    });

    it('should return default message for unknown error type', () => {
      const error: InternshipError = {
        type: ErrorType.UNKNOWN_ERROR,
        message: 'Unknown error',
        originalError: {},
        isRetryable: false,
        userMessage: 'Something went wrong'
      };

      const result = getInternshipErrorMessage(error);
      expect(result).toBe('Something went wrong');
    });
  });

  describe('executeInternshipApiCall', () => {
    it('should execute API call successfully', async () => {
      const mockApiCall = vi.fn().mockResolvedValue('success');
      const { retryApiCall } = require('../../../../utils/retryMechanism');
      retryApiCall.mockResolvedValue('success');

      const result = await executeInternshipApiCall(
        mockApiCall,
        {
          operation: 'test',
          studentEnrollId: 123
        }
      );

      expect(result).toBe('success');
      expect(retryApiCall).toHaveBeenCalledWith(
        mockApiCall,
        expect.objectContaining({
          maxRetries: 3,
          baseDelay: 1000
        })
      );
    });

    it('should handle and classify errors', async () => {
      const mockError = new Error('API call failed');
      const mockApiCall = vi.fn().mockRejectedValue(mockError);
      const { retryApiCall } = require('../../../../utils/retryMechanism');
      const { logError } = require('../../../../utils/errorHandling');
      
      retryApiCall.mockRejectedValue(mockError);

      await expect(
        executeInternshipApiCall(
          mockApiCall,
          {
            operation: 'test',
            studentEnrollId: 123
          }
        )
      ).rejects.toThrow();

      expect(logError).toHaveBeenCalledWith(
        expect.any(Object),
        'Internship API: test'
      );
    });

    it('should not retry on permission errors', async () => {
      const mockApiCall = vi.fn();
      const { retryApiCall } = require('../../../../utils/retryMechanism');
      
      const retryCondition = vi.fn();
      retryApiCall.mockImplementation((apiCall, config) => {
        // Simulate the retry condition being called
        const error = { response: { status: 403 } };
        const shouldRetry = config.retryCondition(error);
        expect(shouldRetry).toBe(false);
        throw error;
      });

      await expect(
        executeInternshipApiCall(mockApiCall, { operation: 'test' })
      ).rejects.toThrow();
    });
  });

  describe('handleConcurrentUpdateConflict', () => {
    const mockError: InternshipError = {
      type: ErrorType.VALIDATION_ERROR,
      message: 'Concurrent update',
      originalError: {},
      isRetryable: false,
      userMessage: 'Conflict',
      internshipErrorType: InternshipErrorType.CONCURRENT_UPDATE_ERROR,
      currentStatus: 'registered',
      targetStatus: 't.approved'
    };

    it('should abort on abort strategy', async () => {
      const mockRetryOperation = vi.fn();
      const strategy: ConflictResolutionStrategy = { type: 'abort' };

      await expect(
        handleConcurrentUpdateConflict(mockError, mockRetryOperation, strategy)
      ).rejects.toThrow('Operation aborted due to concurrent update conflict');

      expect(mockRetryOperation).not.toHaveBeenCalled();
    });

    it('should retry on overwrite strategy', async () => {
      const mockRetryOperation = vi.fn().mockResolvedValue('success');
      const strategy: ConflictResolutionStrategy = { type: 'overwrite' };

      const result = await handleConcurrentUpdateConflict(mockError, mockRetryOperation, strategy);

      expect(result).toBe('success');
      expect(mockRetryOperation).toHaveBeenCalledOnce();
    });

    it('should throw error for user_choice strategy', async () => {
      const mockRetryOperation = vi.fn();
      const strategy: ConflictResolutionStrategy = { type: 'user_choice' };

      await expect(
        handleConcurrentUpdateConflict(mockError, mockRetryOperation, strategy)
      ).rejects.toBe(mockError);

      expect(mockRetryOperation).not.toHaveBeenCalled();
    });

    it('should throw error for non-concurrent update errors', async () => {
      const nonConcurrentError: InternshipError = {
        ...mockError,
        internshipErrorType: InternshipErrorType.PERMISSION_ERROR
      };
      
      const mockRetryOperation = vi.fn();
      const strategy: ConflictResolutionStrategy = { type: 'overwrite' };

      await expect(
        handleConcurrentUpdateConflict(nonConcurrentError, mockRetryOperation, strategy)
      ).rejects.toBe(nonConcurrentError);

      expect(mockRetryOperation).not.toHaveBeenCalled();
    });
  });
});