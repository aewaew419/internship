import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useSuperviseReportViewModel from '../viewModel';
import { VisitorService } from '../../../service/api/visitor';
import type { 
  VisitorInterface, 
  VisitorEvaluateStudentInterface 
} from '../../../service/api/visitor/type';
import * as dataTransformation from '../../../utils/dataTransformation';
import * as retryMechanism from '../../../utils/retryMechanism';
import * as errorHandling from '../../../utils/errorHandling';

// Mock dependencies
vi.mock('../../../service/api/visitor');
vi.mock('../../../utils/dataTransformation');
vi.mock('../../../utils/retryMechanism');
vi.mock('../../../utils/errorHandling');

describe('useSuperviseReportViewModel', () => {
  let mockVisitorService: any;
  let mockTransformVisitorToReportData: any;
  let mockValidateVisitorData: any;
  let mockSanitizeVisitorData: any;
  let mockRetryApiCall: any;
  let mockClassifyError: any;
  let mockLogError: any;

  const mockVisitorData: VisitorInterface[] = [
    {
      id: 1,
      visitorInstructorId: 1,
      studentEnrollId: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      studentEnroll: {
        id: 1,
        studentId: 1,
        courseSectionId: 1,
        grade: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        student: {
          id: 1,
          userId: 1,
          studentId: '64000001',
          name: 'John',
          middleName: null,
          surname: 'Doe',
          gpax: 3.5,
          phoneNumber: '0123456789',
          picture: null,
          email: 'john@example.com',
          campusId: 1,
          facultyId: 1,
          programId: 1,
          curriculumId: 1,
          majorId: 1
        }
      },
      schedules: [
        {
          id: 1,
          visitorTrainingId: 1,
          visitNo: 1,
          visitAt: '2024-01-15T10:00:00Z',
          comment: 'First visit',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ]
    }
  ];

  const mockEvaluationData: VisitorEvaluateStudentInterface[] = [
    {
      id: 1,
      visitorTrainingId: 1,
      score: 85,
      questions: 'How well did the student perform?',
      comment: 'Good performance',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      training: {
        id: 1,
        visitorInstructorId: 1,
        studentEnrollId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    }
  ];

  const mockReportDisplayData = {
    id: 1,
    studentName: 'John Doe',
    studentCode: '64000001',
    companyName: 'Test Company',
    supervisorName: 'Test Supervisor',
    jobPosition: 'Developer',
    appointmentStatus: 'นัดหมาย 1 ครั้ง' as any,
    appointmentCount: 1,
    visitReports: [
      {
        visitNo: 1,
        visitDate: '15 มกราคม 2567',
        comment: 'First visit'
      }
    ]
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup VisitorService mock
    mockVisitorService = {
      reqGetVisitor: vi.fn(),
      reqGetVisitorEvaluateStudent: vi.fn(),
      reqGetVisitorEvaluateCompany: vi.fn()
    };
    (VisitorService as any).mockImplementation(() => mockVisitorService);

    // Setup data transformation mocks
    mockTransformVisitorToReportData = vi.fn().mockReturnValue(mockReportDisplayData);
    mockValidateVisitorData = vi.fn().mockReturnValue(true);
    mockSanitizeVisitorData = vi.fn().mockImplementation((visitor) => visitor);
    
    (dataTransformation as any).transformVisitorToReportData = mockTransformVisitorToReportData;
    (dataTransformation as any).validateVisitorData = mockValidateVisitorData;
    (dataTransformation as any).sanitizeVisitorData = mockSanitizeVisitorData;

    // Setup retry mechanism mock
    mockRetryApiCall = vi.fn().mockImplementation((fn) => fn());
    (retryMechanism as any).retryApiCall = mockRetryApiCall;

    // Setup error handling mocks
    mockClassifyError = vi.fn().mockReturnValue({
      userMessage: 'Test error',
      type: 'network',
      severity: 'medium'
    });
    mockLogError = vi.fn();
    (errorHandling as any).classifyError = mockClassifyError;
    (errorHandling as any).logError = mockLogError;

    // Setup default API responses
    mockVisitorService.reqGetVisitor.mockResolvedValue(mockVisitorData);
    mockVisitorService.reqGetVisitorEvaluateStudent.mockResolvedValue(mockEvaluationData);
    mockVisitorService.reqGetVisitorEvaluateCompany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      expect(result.current.reportData).toEqual([]);
      expect(result.current.loading).toBe(true); // Loading starts immediately
      expect(result.current.error).toBe(null);
      expect(result.current.enhancedError).toBe(null);
      expect(result.current.retryCount).toBe(0);
      expect(result.current.isRetrying).toBe(false);
      expect(result.current.filters).toEqual({
        search: '',
        position: '',
        major: '',
        appointmentStatus: ''
      });
      expect(result.current.totalCount).toBe(0);
      expect(result.current.hasData).toBe(false);
    });
  });

  describe('Data Fetching', () => {
    it('should fetch report data successfully', async () => {
      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockVisitorService.reqGetVisitor).toHaveBeenCalledTimes(1);
      expect(result.current.reportData).toHaveLength(1);
      expect(result.current.hasData).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it('should handle API errors gracefully', async () => {
      const testError = new Error('API Error');
      mockVisitorService.reqGetVisitor.mockRejectedValue(testError);

      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Test error');
      expect(result.current.enhancedError).toBeTruthy();
      expect(mockClassifyError).toHaveBeenCalledWith(testError);
      expect(mockLogError).toHaveBeenCalled();
    });

    it('should validate response format', async () => {
      mockVisitorService.reqGetVisitor.mockResolvedValue('invalid response');

      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Test error');
      expect(mockClassifyError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid response format: expected array'
        })
      );
    });
  });

  describe('Evaluation Data Fetching', () => {
    it('should fetch visitor evaluations successfully', async () => {
      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let evaluationScores: any;
      await act(async () => {
        evaluationScores = await result.current.fetchVisitorEvaluations(1);
      });

      expect(mockVisitorService.reqGetVisitorEvaluateStudent).toHaveBeenCalledWith(1);
      expect(mockVisitorService.reqGetVisitorEvaluateCompany).toHaveBeenCalledWith(1);
      expect(evaluationScores).toEqual([
        {
          question: 'How well did the student perform?',
          score: 85
        }
      ]);
    });

    it('should handle evaluation fetch errors', async () => {
      mockVisitorService.reqGetVisitorEvaluateStudent.mockRejectedValue(new Error('Evaluation error'));

      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let evaluationScores: any;
      await act(async () => {
        evaluationScores = await result.current.fetchVisitorEvaluations(1);
      });

      expect(evaluationScores).toEqual([]);
    });
  });

  describe('Filtering and Search', () => {
    it('should apply search filters correctly', async () => {
      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.applyFilters({ search: 'John' });
      });

      expect(result.current.filters.search).toBe('John');
      expect(result.current.filteredReportData).toHaveLength(1);
    });

    it('should filter by student code', async () => {
      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.applyFilters({ search: '64000001' });
      });

      expect(result.current.filteredReportData).toHaveLength(1);
    });

    it('should filter by appointment status', async () => {
      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.applyFilters({ appointmentStatus: 'นัดหมาย 1 ครั้ง' });
      });

      expect(result.current.filteredReportData).toHaveLength(1);
    });

    it('should return empty results for non-matching search', async () => {
      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.applyFilters({ search: 'NonExistent' });
      });

      expect(result.current.filteredReportData).toHaveLength(0);
    });
  });

  describe('Summary Statistics', () => {
    it('should calculate summary statistics correctly', async () => {
      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Wait for evaluation data to be fetched
      await waitFor(() => {
        expect(result.current.summaryStats.totalStudents).toBe(1);
      });

      expect(result.current.summaryStats.totalStudents).toBe(1);
      expect(result.current.summaryStats.completedEvaluations).toBeGreaterThanOrEqual(0);
      expect(result.current.summaryStats.averageScore).toBeGreaterThanOrEqual(0);
      expect(result.current.summaryStats.pendingReports).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Detailed Report Generation', () => {
    it('should generate detailed report for specific visitor', async () => {
      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let detailedReport: any;
      await act(async () => {
        detailedReport = await result.current.generateDetailedReport(1);
      });

      expect(detailedReport).toBeTruthy();
      expect(detailedReport.id).toBe(1);
      expect(detailedReport.evaluationScores).toBeDefined();
      expect(detailedReport.averageScore).toBeGreaterThanOrEqual(0);
    });

    it('should return null for non-existent visitor', async () => {
      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let detailedReport: any;
      await act(async () => {
        detailedReport = await result.current.generateDetailedReport(999);
      });

      expect(detailedReport).toBe(null);
    });
  });

  describe('Error Handling and Retry', () => {
    it('should clear error state', async () => {
      mockVisitorService.reqGetVisitor.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.enhancedError).toBe(null);
    });

    it('should retry fetch operation', async () => {
      mockVisitorService.reqGetVisitor
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValue(mockVisitorData);

      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      const initialRetryCount = result.current.retryCount;

      await act(async () => {
        await result.current.retryFetch();
      });

      // After successful retry, retryCount is reset to 0, but we should have called the API twice
      expect(mockVisitorService.reqGetVisitor).toHaveBeenCalledTimes(2);
      expect(result.current.error).toBe(null); // Error should be cleared after successful retry
    });

    it('should refresh data', async () => {
      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshData();
      });

      expect(mockVisitorService.reqGetVisitor).toHaveBeenCalledTimes(2);
    });
  });

  describe('Data Validation', () => {
    it('should validate visitor data before processing', async () => {
      mockValidateVisitorData.mockReturnValue(false);

      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockValidateVisitorData).toHaveBeenCalledWith(mockVisitorData[0]);
      expect(result.current.reportData).toHaveLength(0);
    });

    it('should sanitize visitor data', async () => {
      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSanitizeVisitorData).toHaveBeenCalledWith(mockVisitorData[0]);
    });

    it('should handle null sanitized data', async () => {
      mockSanitizeVisitorData.mockReturnValue(null);

      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.reportData).toHaveLength(0);
    });
  });

  describe('Retry Mechanism Integration', () => {
    it('should use retry mechanism for API calls', async () => {
      const { result } = renderHook(() => useSuperviseReportViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockRetryApiCall).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 8000,
          backoffFactor: 2
        })
      );
    });
  });
});