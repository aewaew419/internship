import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useSuperviseScheduleViewModel from '../viewModel';
import { VisitorService } from '../../../service/api/visitor';

// Mock the VisitorService
vi.mock('../../../service/api/visitor', () => ({
  VisitorService: vi.fn().mockImplementation(() => ({
    reqGetVisitor: vi.fn()
  }))
}));

describe('SuperviseScheduleViewModel Integration Tests', () => {
  const mockVisitorData = [
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

  it('should integrate with VisitorService API successfully', async () => {
    const mockService = {
      reqGetVisitor: vi.fn().mockResolvedValue(mockVisitorData)
    };
    
    (VisitorService as any).mockImplementation(() => mockService);
    
    const { result } = renderHook(() => useSuperviseScheduleViewModel());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(mockService.reqGetVisitor).toHaveBeenCalledTimes(1);
    expect(result.current.visitors).toHaveLength(1);
    expect(result.current.hasData).toBe(true);
    expect(result.current.totalCount).toBe(1);
  });

  it('should handle search functionality', async () => {
    const mockService = {
      reqGetVisitor: vi.fn().mockResolvedValue(mockVisitorData)
    };
    
    (VisitorService as any).mockImplementation(() => mockService);
    
    const { result } = renderHook(() => useSuperviseScheduleViewModel());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Test search functionality
    act(() => {
      result.current.applyFilters({ search: 'สมชาย' });
    });
    
    expect(result.current.filters.search).toBe('สมชาย');
    expect(result.current.filteredVisitors.length).toBeGreaterThan(0);
  });

  it('should handle error states properly', async () => {
    const mockService = {
      reqGetVisitor: vi.fn().mockRejectedValue(new Error('API Error'))
    };
    
    (VisitorService as any).mockImplementation(() => mockService);
    
    const { result } = renderHook(() => useSuperviseScheduleViewModel());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.error).toBeTruthy();
    expect(result.current.visitors).toEqual([]);
    
    // Test error clearing
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBe(null);
  });

  it('should support data refresh', async () => {
    const mockService = {
      reqGetVisitor: vi.fn().mockResolvedValue(mockVisitorData)
    };
    
    (VisitorService as any).mockImplementation(() => mockService);
    
    const { result } = renderHook(() => useSuperviseScheduleViewModel());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Clear previous calls
    mockService.reqGetVisitor.mockClear();
    
    // Test refresh
    await act(async () => {
      await result.current.refreshData();
    });
    
    expect(mockService.reqGetVisitor).toHaveBeenCalledTimes(1);
  });
});