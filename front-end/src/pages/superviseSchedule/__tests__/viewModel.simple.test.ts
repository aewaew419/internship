import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useSuperviseScheduleViewModel from '../viewModel';

// Mock the VisitorService
vi.mock('../../../service/api/visitor', () => ({
  VisitorService: vi.fn().mockImplementation(() => ({
    reqGetVisitor: vi.fn().mockResolvedValue([])
  }))
}));

describe('useSuperviseScheduleViewModel - Basic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', async () => {
    const { result } = renderHook(() => useSuperviseScheduleViewModel());
    
    // Check initial state
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
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should have all required methods', () => {
    const { result } = renderHook(() => useSuperviseScheduleViewModel());
    
    expect(typeof result.current.fetchVisitors).toBe('function');
    expect(typeof result.current.applyFilters).toBe('function');
    expect(typeof result.current.refreshData).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });
});