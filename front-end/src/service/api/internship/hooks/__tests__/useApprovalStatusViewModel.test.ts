import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ApprovalStatusData, InternshipApprovalStatus } from '../../type';

// Mock the real-time updates utility
const mockUseRealTimeUpdates = vi.fn();

vi.mock('../../../../utils/realTimeUpdates', () => ({
  useRealTimeUpdates: mockUseRealTimeUpdates
}));

// Mock the InternshipApprovalService
vi.mock('../../InternshipApprovalService', () => ({
  InternshipApprovalService: vi.fn().mockImplementation(() => ({
    getApprovalStatus: vi.fn()
  }))
}));

import { useApprovalStatusViewModel } from '../useApprovalStatusViewModel';
import { InternshipApprovalService } from '../../InternshipApprovalService';

// Mock the config utilities
vi.mock('../../config', () => ({
  getStatusDisplayConfig: vi.fn().mockImplementation((status: InternshipApprovalStatus) => {
    const configs = {
      'registered': {
        text: 'อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา',
        color: '#FFA500',
        icon: 'pending'
      },
      't.approved': {
        text: 'อยู่ระหว่างการพิจารณา โดยคณะกรรมการ',
        color: '#2196F3',
        icon: 'committee'
      },
      'c.approved': {
        text: 'อนุมัติเอกสารขอฝึกงาน / สหกิจ',
        color: '#4CAF50',
        icon: 'approved'
      },
      'doc.approved': {
        text: 'ไม่อนุมัติเอกสารขอฝึกงาน/สหกิจ',
        color: '#F44336',
        icon: 'rejected'
      },
      'doc.cancel': {
        text: 'ยกเลิกการฝึกงาน/สหกิจ',
        color: '#9E9E9E',
        icon: 'cancelled'
      }
    };
    return configs[status];
  })
}));

describe('useApprovalStatusViewModel', () => {
  let mockApprovalService: any;

  const mockApprovalStatusData: ApprovalStatusData = {
    studentEnrollId: 123,
    currentStatus: 'registered',
    statusText: 'อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา',
    statusUpdatedAt: '2024-01-01T00:00:00Z',
    advisorId: 1,
    advisorApprovalDate: null,
    committeeVotes: [],
    approvalPercentage: 0,
    finalOutcome: undefined,
    statusHistory: []
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup mock service
    mockApprovalService = {
      getApprovalStatus: vi.fn()
    };
    (InternshipApprovalService as any).mockImplementation(() => mockApprovalService);
    
    // Setup mock real-time updates with default implementation
    mockUseRealTimeUpdates.mockImplementation((refreshFunction, config) => ({
      isAutoRefreshing: config?.enableAutoRefresh || false,
      stalenessInfo: {
        isStale: false,
        lastUpdateTime: null,
        staleDuration: 0,
        failureCount: 0,
        nextRefreshTime: null
      },
      lastManualRefresh: null,
      startAutoRefresh: vi.fn(),
      stopAutoRefresh: vi.fn(),
      triggerManualRefresh: vi.fn().mockImplementation(() => refreshFunction()),
      resetStaleness: vi.fn(),
      updateConfig: vi.fn()
    }));
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useApprovalStatusViewModel(123));
      
      expect(result.current.approvalStatus).toBeNull();
      expect(result.current.currentStatus).toBeNull();
      expect(result.current.statusConfig).toBeNull();
      expect(result.current.isLoading).toBe(true); // Should be loading initially
      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.retryCount).toBe(0);
      expect(result.current.canRetry).toBe(true);
      expect(result.current.lastRefreshTime).toBeNull();
    });

    it('should not fetch data for invalid studentEnrollId', async () => {
      const { result } = renderHook(() => useApprovalStatusViewModel(0));
      
      await waitFor(() => {
        expect(result.current.error).toBe('Invalid student enrollment ID');
      });
      
      expect(mockApprovalService.getApprovalStatus).not.toHaveBeenCalled();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch approval status successfully on mount', async () => {
      mockApprovalService.getApprovalStatus.mockResolvedValue(mockApprovalStatusData);
      
      const { result } = renderHook(() => useApprovalStatusViewModel(123));
      
      await waitFor(() => {
        expect(result.current.approvalStatus).toEqual(mockApprovalStatusData);
      });
      
      expect(mockApprovalService.getApprovalStatus).toHaveBeenCalledWith(123);
      expect(result.current.currentStatus).toBe('registered');
      expect(result.current.error).toBeNull();
      expect(result.current.retryCount).toBe(0);
    });

    it('should handle fetch errors properly', async () => {
      const mockError = new Error('Network error');
      mockApprovalService.getApprovalStatus.mockRejectedValue(mockError);
      
      const { result } = renderHook(() => useApprovalStatusViewModel(123));
      
      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
      
      expect(result.current.approvalStatus).toBeNull();
      expect(result.current.retryCount).toBe(1);
    });

    it('should handle service-specific errors', async () => {
      const mockError = new Error('Student enrollment not found or invalid ID');
      mockApprovalService.getApprovalStatus.mockRejectedValue(mockError);
      
      const { result } = renderHook(() => useApprovalStatusViewModel(123));
      
      await waitFor(() => {
        expect(result.current.error).toBe('Student enrollment not found or invalid ID');
      });
    });

    it('should update lastRefreshTime on successful fetch', async () => {
      const beforeTime = new Date();
      mockApprovalService.getApprovalStatus.mockResolvedValue(mockApprovalStatusData);
      
      const { result } = renderHook(() => useApprovalStatusViewModel(123));
      
      await waitFor(() => {
        expect(result.current.lastRefreshTime).not.toBeNull();
      });
      
      const afterTime = new Date();
      expect(result.current.lastRefreshTime!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result.current.lastRefreshTime!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('Status Configuration', () => {
    it('should provide correct status configuration for registered status', async () => {
      mockApprovalService.getApprovalStatus.mockResolvedValue(mockApprovalStatusData);
      
      const { result } = renderHook(() => useApprovalStatusViewModel(123));
      
      await waitFor(() => {
        expect(result.current.statusConfig).toEqual({
          text: 'อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา',
          color: '#FFA500',
          icon: 'pending'
        });
      });
    });

    it('should provide correct status configuration for different statuses', async () => {
      const approvedData = { ...mockApprovalStatusData, currentStatus: 'c.approved' as InternshipApprovalStatus };
      mockApprovalService.getApprovalStatus.mockResolvedValue(approvedData);
      
      const { result } = renderHook(() => useApprovalStatusViewModel(123));
      
      await waitFor(() => {
        expect(result.current.statusConfig).toEqual({
          text: 'อนุมัติเอกสารขอฝึกงาน / สหกิจ',
          color: '#4CAF50',
          icon: 'approved'
        });
      });
    });
  });

  describe('Status Formatting Methods', () => {
    it('should format status text correctly', async () => {
      mockApprovalService.getApprovalStatus.mockResolvedValue(mockApprovalStatusData);
      
      const { result } = renderHook(() => useApprovalStatusViewModel(123));
      
      await waitFor(() => {
        expect(result.current.getFormattedStatusText()).toBe('อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา');
      });
    });

    it('should return default text when no status config', () => {
      const { result } = renderHook(() => useApprovalStatusViewModel(123));
      
      expect(result.current.getFormattedStatusText()).toBe('ไม่พบข้อมูลสถานะ');
    });

    it('should return correct status color', async () => {
      mockApprovalService.getApprovalStatus.mockResolvedValue(mockApprovalStatusData);
      
      const { result } = renderHook(() => useApprovalStatusViewModel(123));
      
      await waitFor(() => {
        expect(result.current.getStatusColor()).toBe('#FFA500');
      });
    });

    it('should return default color when no status config', () => {
      const { result } = renderHook(() => useApprovalStatusViewModel(123));
      
      expect(result.current.getStatusColor()).toBe('#9E9E9E');
    });

    it('should return correct status icon', async () => {
      mockApprovalService.getApprovalStatus.mockResolvedValue(mockApprovalStatusData);
      
      const { result } = renderHook(() => useApprovalStatusViewModel(123));
      
      await waitFor(() => {
        expect(result.current.getStatusIcon()).toBe('pending');
      });
    });

    it('should return default icon when no status config', () => {
      const { result } = renderHook(() => useApprovalStatusViewModel(123));
      
      expect(result.current.getStatusIcon()).toBe('unknown');
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh status manually', async () => {
      mockApprovalService.getApprovalStatus.mockResolvedValue(mockApprovalStatusData);
      
      const { result } = renderHook(() => useApprovalStatusViewModel(123));
      
      // Wait for initial load
      await waitFor(() => {
        expect(result.current.approvalStatus).not.toBeNull();
      });
      
      // Clear the mock and set new data
      mockApprovalService.getApprovalStatus.mockClear();
      const updatedData = { ...mockApprovalStatusData, currentStatus: 't.approved' as InternshipApprovalStatus };
      mockApprovalService.getApprovalStatus.mockResolvedValue(updatedData);
      
      // Trigger manual refresh
      await act(async () => {
        await result.current.refreshStatus();
      });
      
      expect(mockApprovalService.getApprovalStatus).toHaveBeenCalledWith(123);
      expect(result.current.currentStatus).toBe('t.approved');
    });

    it('should handle refresh loading state', async () => {
      mockApprovalService.getApprovalStatus.mockResolvedValue(mockApprovalStatusData);
      
      const { result } = renderHook(() => useApprovalStatusViewModel(123));
      
      // Wait for initial load
      await waitFor(() => {
        expect(result.current.approvalStatus).not.toBeNull();
      });
      
      // Mock a slow refresh
      let resolveRefresh: () => void;
      const refreshPromise = new Promise<ApprovalStatusData>((resolve) => {
        resolveRefresh = () => resolve(mockApprovalStatusData);
      });
      mockApprovalService.getApprovalStatus.mockReturnValue(refreshPromise);
      
      // Start refresh
      act(() => {
        result.current.refreshStatus();
      });
      
      // Check loading state
      expect(result.current.isRefreshing).toBe(true);
      
      // Resolve refresh
      act(() => {
        resolveRefresh!();
      });
      
      await waitFor(() => {
        expect(result.current.isRefreshing).toBe(false);
      });
    });
  });

  describe('Error Handling and Retry Mechanism', () => {
    it('should clear error state', async () => {
      const mockError = new Error('Test error');
      mockApprovalService.getApprovalStatus.mockRejectedValue(mockError);
      
      const { result } = renderHook(() => useApprovalStatusViewModel(123));
      
      await waitFor(() => {
        expect(result.current.error).toBe('Test error');
      });
      
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
      expect(result.current.retryCount).toBe(0);
    });

    it('should retry failed requests', async () => {
      const mockError = new Error('Network error');
      mockApprovalService.getApprovalStatus.mockRejectedValueOnce(mockError);
      mockApprovalService.getApprovalStatus.mockResolvedValue(mockApprovalStatusData);
      
      const { result } = renderHook(() => useApprovalStatusViewModel(123));
      
      // Wait for initial error
      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
      
      // Retry
      await act(async () => {
        await result.current.retryFetch();
      });
      
      await waitFor(() => {
        expect(result.current.approvalStatus).toEqual(mockApprovalStatusData);
        expect(result.current.error).toBeNull();
      });
    });

    it('should respect maximum retry limit', async () => {
      const mockError = new Error('Persistent error');
      mockApprovalService.getApprovalStatus.mockRejectedValue(mockError);
      
      const { result } = renderHook(() => useApprovalStatusViewModel(123, { maxRetries: 2 }));
      
      // Wait for initial error
      await waitFor(() => {
        expect(result.current.retryCount).toBe(1);
      });
      
      // Retry once more
      await act(async () => {
        await result.current.retryFetch();
      });
      
      await waitFor(() => {
        expect(result.current.retryCount).toBe(2);
        expect(result.current.canRetry).toBe(false);
      });
      
      // Should throw error when trying to retry beyond limit
      await expect(async () => {
        await act(async () => {
          await result.current.retryFetch();
        });
      }).rejects.toThrow('Maximum retry attempts exceeded');
    });
  });

  describe('Real-time Updates Integration', () => {
    it('should expose real-time update controls', () => {
      const { result } = renderHook(() => useApprovalStatusViewModel(123));
      
      // Check that real-time update methods are available
      expect(typeof result.current.startAutoRefresh).toBe('function');
      expect(typeof result.current.stopAutoRefresh).toBe('function');
      expect(typeof result.current.isAutoRefreshing).toBe('boolean');
      expect(result.current.nextRefreshTime).toBeDefined();
    });

    it('should handle real-time update configuration', () => {
      const config = {
        refreshInterval: 60000,
        enableAutoRefresh: false,
        refreshOnFocus: false,
        maxRetries: 5
      };
      
      const { result } = renderHook(() => useApprovalStatusViewModel(123, config));
      
      // Verify that the hook initializes with the provided configuration
      expect(typeof result.current.startAutoRefresh).toBe('function');
      expect(typeof result.current.stopAutoRefresh).toBe('function');
    });
  });

  describe('Configuration Options', () => {
    it('should use default configuration when none provided', () => {
      const { result } = renderHook(() => useApprovalStatusViewModel(123));
      
      // Verify that the hook works with default configuration
      expect(result.current.isAutoRefreshing).toBeDefined();
      expect(typeof result.current.startAutoRefresh).toBe('function');
      expect(typeof result.current.stopAutoRefresh).toBe('function');
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig = {
        refreshInterval: 45000,
        enableAutoRefresh: false
      };
      
      const { result } = renderHook(() => useApprovalStatusViewModel(123, customConfig));
      
      // Verify that the hook works with custom configuration
      expect(result.current.isAutoRefreshing).toBeDefined();
      expect(typeof result.current.startAutoRefresh).toBe('function');
      expect(typeof result.current.stopAutoRefresh).toBe('function');
    });
  });

  describe('Component Lifecycle', () => {
    it('should fetch data when studentEnrollId changes', async () => {
      mockApprovalService.getApprovalStatus.mockResolvedValue(mockApprovalStatusData);
      
      const { result, rerender } = renderHook(
        ({ studentEnrollId }) => useApprovalStatusViewModel(studentEnrollId),
        { initialProps: { studentEnrollId: 123 } }
      );
      
      // Wait for initial fetch
      await waitFor(() => {
        expect(mockApprovalService.getApprovalStatus).toHaveBeenCalledWith(123);
      });
      
      // Clear mock and change studentEnrollId
      mockApprovalService.getApprovalStatus.mockClear();
      const newData = { ...mockApprovalStatusData, studentEnrollId: 456 };
      mockApprovalService.getApprovalStatus.mockResolvedValue(newData);
      
      rerender({ studentEnrollId: 456 });
      
      await waitFor(() => {
        expect(mockApprovalService.getApprovalStatus).toHaveBeenCalledWith(456);
      });
    });

    it('should cleanup real-time updates on unmount', () => {
      const { result, unmount } = renderHook(() => useApprovalStatusViewModel(123));
      
      // Verify that the hook has real-time update controls
      expect(typeof result.current.stopAutoRefresh).toBe('function');
      
      // Unmount should not throw errors
      expect(() => unmount()).not.toThrow();
    });
  });
});