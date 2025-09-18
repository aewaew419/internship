import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStatusTransitionHandler } from '../useStatusTransitionHandler';

// Mock dependencies
vi.mock('../../EnhancedInternshipApprovalService');
vi.mock('../../enhanced-error-handling');

describe('useStatusTransitionHandler', () => {
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useStatusTransitionHandler());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.isConflictDialogOpen).toBe(false);
    expect(result.current.conflictData).toBe(null);
    expect(result.current.lastAttemptedTransition).toBe(null);
  });

  it('should provide all required methods', () => {
    const { result } = renderHook(() => useStatusTransitionHandler());

    expect(typeof result.current.executeTransition).toBe('function');
    expect(typeof result.current.retryLastTransition).toBe('function');
    expect(typeof result.current.resolveConflict).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
    expect(typeof result.current.dismissConflictDialog).toBe('function');
  });

  it('should clear error when clearError is called', () => {
    const { result } = renderHook(() => useStatusTransitionHandler());

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('should dismiss conflict dialog when dismissConflictDialog is called', () => {
    const { result } = renderHook(() => useStatusTransitionHandler());

    act(() => {
      result.current.dismissConflictDialog();
    });

    expect(result.current.isConflictDialogOpen).toBe(false);
    expect(result.current.conflictData).toBe(null);
    expect(result.current.lastAttemptedTransition).toBe(null);
  });
});