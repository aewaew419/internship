import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useSuperviseScheduleViewModel from '../viewModel';
import { VisitorService } from '../../../service/api/visitor';
import type { VisitorInterface } from '../../../service/api/visitor/type';

// Mock the VisitorService
vi.mock('../../../service/api/visitor', () => ({
  VisitorService: vi.fn().mockImplementation(() => ({
    reqGetVisitor: vi.fn()
  }))
}));

// Mock the data transformation utilities
vi.mock('../../../utils/dataTransformation', () => ({
  transformVisitorToScheduleData: vi.fn(),
  validateVisitorData: vi.fn(),
  sanitizeVisitorData: vi.fn()
}));

describe('useSuperviseScheduleViewModel', () => {
  let mockVisitorService: any;
  let mockTransformVisitorToScheduleData: any;
  let mockValidateVisitorData: any;
  let mockSanitizeVisitorData: any;

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
          name: 'สมชาย',
          middleName: null,
          surname: 'ใจดี',
          gpax: 3.5,
          phoneNumber: '0812345678',
          picture: null,
          email: 'somchai@example.com',
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
          visitAt: '2024-02-01T10:00:00Z',
          comment: 'การนิเทศครั้งที่ 1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ]
    }
  ];

  const mockScheduleDisplayData = {
    id: 1,
    studentName: 'สมชาย ใจดี',
    studentCode: '64000001',
    companyName: 'ไม่ระบุบริษัท',
    contactName: 'ไม่ระบุผู้ติดต่อ',
    supervisorName: 'อาจารย์นิเทศ',
    appointmentStatus: 'นัดหมาย' as any,
    appointmentCount: 1,
    lastVisitDate: undefined,
    nextVisitDate: '1 กุมภาพันธ์ 2567'
  };

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup mock implementations
    mockVisitorService = {
      reqGetVisitor: vi.fn()
    };
    
    (VisitorService as any).mockImplementation(() => mockVisitorService);
    
    const dataTransformationModule = await import('../../../utils/dataTransformation');
    mockTransformVisitorToScheduleData = dataTransformationModule.transformVisitorToScheduleData;
    mockValidateVisitorData = dataTransformationModule.validateVisitorData;
    mockSanitizeVisitorData = dataTransformationModule.sanitizeVisitorData;
    
    // Default mock implementations
    mockValidateVisitorData.mockReturnValue(true);
    mockSanitizeVisitorData.mockImplementation((visitor: any) => visitor);
    mockTransformVisitorToScheduleData.mockReturnValue(mockScheduleDisplayData);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      expect(result.current.visitors).toEqual([]);
      expect(result.current.loading).toBe(true); // Should be loading initially
      expect(result.current.error).toBe(null);
      expect(result.current.filters).toEqual({
        search: '',
        position: '',
        major: ''
      });
      expect(result.current.filteredVisitors).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.hasData).toBe(false);
    });
  });

  describe('Data Fetching', () => {
    it('should fetch visitors data successfully', async () => {
      mockVisitorService.reqGetVisitor.mockResolvedValue(mockVisitorData);
      
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(mockVisitorService.reqGetVisitor).toHaveBeenCalledTimes(1);
      expect(result.current.visitors).toEqual([mockScheduleDisplayData]);
      expect(result.current.error).toBe(null);
      expect(result.current.hasData).toBe(true);
      expect(result.current.totalCount).toBe(1);
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      mockVisitorService.reqGetVisitor.mockRejectedValue(mockError);
      
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.error).toBe('เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง');
      expect(result.current.visitors).toEqual([]);
    });

    it('should handle 401 unauthorized error', async () => {
      const mockError = { response: { status: 401 } };
      mockVisitorService.reqGetVisitor.mockRejectedValue(mockError);
      
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.error).toBe('ไม่มีสิทธิ์เข้าถึงข้อมูล กรุณาเข้าสู่ระบบใหม่');
    });

    it('should handle 404 not found error', async () => {
      const mockError = { response: { status: 404 } };
      mockVisitorService.reqGetVisitor.mockRejectedValue(mockError);
      
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.error).toBe('ไม่พบข้อมูลนิเทศ');
    });

    it('should handle server errors (5xx)', async () => {
      const mockError = { response: { status: 500 } };
      mockVisitorService.reqGetVisitor.mockRejectedValue(mockError);
      
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.error).toBe('เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง');
    });

    it('should handle network errors', async () => {
      const mockError = { code: 'NETWORK_ERROR' };
      mockVisitorService.reqGetVisitor.mockRejectedValue(mockError);
      
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.error).toBe('ไม่สามารถเชื่อมต่อเครือข่ายได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    });

    it('should handle invalid response format', async () => {
      mockVisitorService.reqGetVisitor.mockResolvedValue('invalid response');
      
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.error).toBe('เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง');
    });
  });

  describe('Data Validation and Transformation', () => {
    it('should filter out invalid visitor data', async () => {
      const invalidVisitorData = [
        mockVisitorData[0],
        { id: 2, invalid: 'data' } // Invalid data
      ];
      
      mockVisitorService.reqGetVisitor.mockResolvedValue(invalidVisitorData);
      mockValidateVisitorData.mockImplementation((visitor: any) => 
        visitor.id === 1 // Only first visitor is valid
      );
      
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(mockValidateVisitorData).toHaveBeenCalledTimes(2);
      expect(result.current.visitors).toEqual([mockScheduleDisplayData]);
      expect(result.current.totalCount).toBe(1);
    });

    it('should sanitize visitor data before transformation', async () => {
      mockVisitorService.reqGetVisitor.mockResolvedValue(mockVisitorData);
      
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(mockSanitizeVisitorData).toHaveBeenCalledWith(mockVisitorData[0]);
      expect(mockTransformVisitorToScheduleData).toHaveBeenCalledWith(mockVisitorData[0]);
    });

    it('should handle null sanitized data', async () => {
      mockVisitorService.reqGetVisitor.mockResolvedValue(mockVisitorData);
      mockSanitizeVisitorData.mockReturnValue(null);
      
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.visitors).toEqual([]);
      expect(result.current.totalCount).toBe(0);
    });
  });

  describe('Search and Filter Functionality', () => {
    beforeEach(async () => {
      const multipleVisitors = [
        mockVisitorData[0],
        {
          ...mockVisitorData[0],
          id: 2,
          studentEnroll: {
            ...mockVisitorData[0].studentEnroll,
            student: {
              ...mockVisitorData[0].studentEnroll.student,
              id: 2,
              studentId: '64000002',
              name: 'สมหญิง',
              surname: 'ใจงาม'
            }
          }
        }
      ];
      
      mockVisitorService.reqGetVisitor.mockResolvedValue(multipleVisitors);
      mockTransformVisitorToScheduleData.mockImplementation((visitor: any) => ({
        ...mockScheduleDisplayData,
        id: visitor.id,
        studentName: visitor.id === 1 ? 'สมชาย ใจดี' : 'สมหญิง ใจงาม',
        studentCode: visitor.id === 1 ? '64000001' : '64000002'
      }));
    });

    it('should filter visitors by search term (name)', async () => {
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      act(() => {
        result.current.applyFilters({ search: 'สมชาย' });
      });
      
      expect(result.current.filteredVisitors).toHaveLength(1);
      expect(result.current.filteredVisitors[0].studentName).toBe('สมชาย ใจดี');
    });

    it('should filter visitors by search term (student code)', async () => {
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      act(() => {
        result.current.applyFilters({ search: '64000002' });
      });
      
      expect(result.current.filteredVisitors).toHaveLength(1);
      expect(result.current.filteredVisitors[0].studentCode).toBe('64000002');
    });

    it('should be case insensitive in search', async () => {
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      act(() => {
        result.current.applyFilters({ search: 'สมชาย' });
      });
      
      expect(result.current.filteredVisitors).toHaveLength(1);
    });

    it('should return all visitors when search is empty', async () => {
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      act(() => {
        result.current.applyFilters({ search: '' });
      });
      
      expect(result.current.filteredVisitors).toHaveLength(2);
    });

    it('should update filters correctly', async () => {
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      act(() => {
        result.current.applyFilters({ 
          search: 'test',
          position: 'developer',
          major: 'computer science'
        });
      });
      
      expect(result.current.filters).toEqual({
        search: 'test',
        position: 'developer',
        major: 'computer science'
      });
    });

    it('should partially update filters', async () => {
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      act(() => {
        result.current.applyFilters({ search: 'initial' });
      });
      
      act(() => {
        result.current.applyFilters({ position: 'developer' });
      });
      
      expect(result.current.filters).toEqual({
        search: 'initial',
        position: 'developer',
        major: ''
      });
    });
  });

  describe('Utility Methods', () => {
    it('should refresh data successfully', async () => {
      mockVisitorService.reqGetVisitor.mockResolvedValue(mockVisitorData);
      
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Clear the mock call count
      mockVisitorService.reqGetVisitor.mockClear();
      
      await act(async () => {
        await result.current.refreshData();
      });
      
      expect(mockVisitorService.reqGetVisitor).toHaveBeenCalledTimes(1);
    });

    it('should clear error state', async () => {
      const mockError = new Error('Test error');
      mockVisitorService.reqGetVisitor.mockRejectedValue(mockError);
      
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
      
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBe(null);
    });

    it('should manually fetch visitors', async () => {
      mockVisitorService.reqGetVisitor.mockResolvedValue(mockVisitorData);
      
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      // Clear the initial call
      mockVisitorService.reqGetVisitor.mockClear();
      
      await act(async () => {
        await result.current.fetchVisitors();
      });
      
      expect(mockVisitorService.reqGetVisitor).toHaveBeenCalledTimes(1);
    });
  });

  describe('Computed Values', () => {
    it('should calculate totalCount correctly', async () => {
      mockVisitorService.reqGetVisitor.mockResolvedValue(mockVisitorData);
      
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      await waitFor(() => {
        expect(result.current.totalCount).toBe(1);
      });
    });

    it('should calculate hasData correctly when data exists', async () => {
      mockVisitorService.reqGetVisitor.mockResolvedValue(mockVisitorData);
      
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      await waitFor(() => {
        expect(result.current.hasData).toBe(true);
      });
    });

    it('should calculate hasData correctly when no data', async () => {
      mockVisitorService.reqGetVisitor.mockResolvedValue([]);
      
      const { result } = renderHook(() => useSuperviseScheduleViewModel());
      
      await waitFor(() => {
        expect(result.current.hasData).toBe(false);
      });
    });
  });
});