import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import useSuperviseScheduleViewModel from '../viewModel';
import { VisitorService } from '../../../service/api/visitor';

// Mock the VisitorService
vi.mock('../../../service/api/visitor');
const MockedVisitorService = vi.mocked(VisitorService);

// Mock localStorage for token
vi.mock('../../../utils/localStorage', () => ({
  useToken: () => ({
    user: {
      instructors: {
        id: 1
      }
    }
  })
}));

// Test component that uses the viewModel
const TestComponent: React.FC = () => {
  const {
    loading,
    error,
    enhancedError,
    retryCount,
    isRetrying,
    hasData,
    filteredVisitors,
    retryFetch,
    refreshData,
    clearError
  } = useSuperviseScheduleViewModel();

  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="retry-count">{retryCount}</div>
      <div data-testid="is-retrying">{isRetrying.toString()}</div>
      <div data-testid="has-data">{hasData.toString()}</div>
      <div data-testid="visitor-count">{filteredVisitors.length}</div>
      <button onClick={retryFetch} data-testid="retry-button">Retry</button>
      <button onClick={refreshData} data-testid="refresh-button">Refresh</button>
      <button onClick={clearError} data-testid="clear-error-button">Clear Error</button>
      {enhancedError && (
        <div data-testid="enhanced-error-type">{enhancedError.type}</div>
      )}
    </div>
  );
};

describe('SuperviseScheduleViewModel Error Handling Integration', () => {
  let mockVisitorService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    mockVisitorService = {
      reqGetVisitor: vi.fn()
    };
    MockedVisitorService.mockImplementation(() => mockVisitorService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle network errors with retry mechanism', async () => {
    // Mock network error then success
    mockVisitorService.reqGetVisitor
      .mockRejectedValueOnce({ code: 'NETWORK_ERROR' })
      .mockResolvedValue([
        {
          id: 1,
          studentEnroll: {
            student: {
              name: 'John',
              middleName: '',
              surname: 'Doe',
              studentId: 'STU001'
            }
          },
          schedules: []
        }
      ]);

    render(<TestComponent />);

    // Wait for initial load and error
    await vi.runAllTimersAsync();
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(/เครือข่าย/);
      expect(screen.getByTestId('enhanced-error-type')).toHaveTextContent('NETWORK_ERROR');
    });

    // Click retry button
    fireEvent.click(screen.getByTestId('retry-button'));
    
    // Wait for retry
    await vi.runAllTimersAsync();
    
    // Should eventually succeed
    await waitFor(() => {
      expect(screen.getByTestId('has-data')).toHaveTextContent('true');
      expect(screen.getByTestId('visitor-count')).toHaveTextContent('1');
    });

    // Should have made 2 attempts (initial + retry)
    expect(mockVisitorService.reqGetVisitor).toHaveBeenCalledTimes(2);
  });

  it('should handle server errors with exponential backoff', async () => {
    // Mock server error then success
    mockVisitorService.reqGetVisitor
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValue([]);

    render(<TestComponent />);

    // Wait for initial load and automatic retry
    await vi.runAllTimersAsync();
    
    await waitFor(() => {
      expect(screen.getByTestId('enhanced-error-type')).toHaveTextContent('SERVER_ERROR');
    });

    // Should have retried automatically (initial + retry)
    expect(mockVisitorService.reqGetVisitor).toHaveBeenCalledTimes(2);
  });

  it('should not retry on authentication errors', async () => {
    // Mock authentication error
    mockVisitorService.reqGetVisitor.mockRejectedValue({ 
      response: { status: 401, data: { message: 'Unauthorized' } } 
    });

    render(<TestComponent />);

    // Wait for initial load and error
    await vi.runAllTimersAsync();
    
    await waitFor(() => {
      expect(screen.getByTestId('enhanced-error-type')).toHaveTextContent('AUTHENTICATION_ERROR');
      expect(screen.getByTestId('error')).toHaveTextContent(/สิทธิ์เข้าถึง/);
    });

    // Should only have made one attempt (no automatic retry for auth errors)
    expect(mockVisitorService.reqGetVisitor).toHaveBeenCalledTimes(1);
  });

  it('should handle timeout errors with retry', async () => {
    // Mock timeout error then success
    mockVisitorService.reqGetVisitor
      .mockRejectedValueOnce({ response: { status: 408 } })
      .mockResolvedValue([]);

    render(<TestComponent />);

    // Wait for initial load and automatic retry
    await vi.runAllTimersAsync();
    
    await waitFor(() => {
      expect(screen.getByTestId('enhanced-error-type')).toHaveTextContent('TIMEOUT_ERROR');
    });

    // Should have retried automatically
    expect(mockVisitorService.reqGetVisitor).toHaveBeenCalledTimes(2);
  });

  it('should show loading state during initial load', async () => {
    // Mock slow response
    mockVisitorService.reqGetVisitor.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 1000))
    );

    render(<TestComponent />);

    // Should show loading state
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    
    // Fast forward time
    await vi.advanceTimersByTimeAsync(1000);
    
    // Should complete loading
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  it('should show no data state when empty response', async () => {
    // Mock empty response
    mockVisitorService.reqGetVisitor.mockResolvedValue([]);

    render(<TestComponent />);

    // Wait for load to complete
    await vi.runAllTimersAsync();
    
    await waitFor(() => {
      expect(screen.getByTestId('has-data')).toHaveTextContent('false');
      expect(screen.getByTestId('visitor-count')).toHaveTextContent('0');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });

  it('should handle manual refresh after error', async () => {
    // Mock error then success
    mockVisitorService.reqGetVisitor
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValue([
        {
          id: 1,
          studentEnroll: {
            student: {
              name: 'Jane',
              middleName: '',
              surname: 'Smith',
              studentId: 'STU002'
            }
          },
          schedules: []
        }
      ]);

    render(<TestComponent />);

    // Wait for initial error
    await vi.runAllTimersAsync();
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).not.toHaveTextContent('no-error');
    });

    // Click refresh button
    fireEvent.click(screen.getByTestId('refresh-button'));

    // Wait for refresh to complete
    await vi.runAllTimersAsync();
    
    await waitFor(() => {
      expect(screen.getByTestId('has-data')).toHaveTextContent('true');
      expect(screen.getByTestId('visitor-count')).toHaveTextContent('1');
    });
  });

  it('should preserve existing data on subsequent errors', async () => {
    // Mock initial success then error
    mockVisitorService.reqGetVisitor
      .mockResolvedValueOnce([
        {
          id: 1,
          studentEnroll: {
            student: {
              name: 'Initial',
              middleName: '',
              surname: 'Data',
              studentId: 'STU003'
            }
          },
          schedules: []
        }
      ])
      .mockRejectedValue({ response: { status: 500 } });

    render(<TestComponent />);

    // Wait for initial load
    await vi.runAllTimersAsync();
    
    await waitFor(() => {
      expect(screen.getByTestId('has-data')).toHaveTextContent('true');
      expect(screen.getByTestId('visitor-count')).toHaveTextContent('1');
    });

    // Trigger refresh which will fail
    fireEvent.click(screen.getByTestId('refresh-button'));

    // Wait for error
    await vi.runAllTimersAsync();
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).not.toHaveTextContent('no-error');
    });

    // Should still show the previous data
    expect(screen.getByTestId('visitor-count')).toHaveTextContent('1');
  });

  it('should clear error state', async () => {
    // Mock error
    mockVisitorService.reqGetVisitor.mockRejectedValue({ 
      response: { status: 500 } 
    });

    render(<TestComponent />);

    // Wait for error
    await vi.runAllTimersAsync();
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).not.toHaveTextContent('no-error');
    });

    // Clear error
    fireEvent.click(screen.getByTestId('clear-error-button'));

    // Error should be cleared
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  it('should show retry count after retries', async () => {
    // Mock persistent error
    mockVisitorService.reqGetVisitor.mockRejectedValue({ 
      response: { status: 500 } 
    });

    render(<TestComponent />);

    // Wait for initial error and automatic retries
    await vi.runAllTimersAsync();
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).not.toHaveTextContent('no-error');
    });

    // Click manual retry
    fireEvent.click(screen.getByTestId('retry-button'));
    
    await vi.runAllTimersAsync();

    // Should show retry count
    await waitFor(() => {
      expect(screen.getByTestId('retry-count')).not.toHaveTextContent('0');
    });
  });
});