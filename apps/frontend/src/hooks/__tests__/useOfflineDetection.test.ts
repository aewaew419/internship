import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfflineDetection } from '../useOfflineDetection';

// Mock fetch
global.fetch = jest.fn();

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('useOfflineDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (navigator as any).onLine = true;
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should initialize with online status', () => {
    const { result } = renderHook(() => useOfflineDetection());
    
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isChecking).toBe(false);
    expect(result.current.retryCount).toBe(0);
  });

  it('should detect offline status when navigator.onLine is false', async () => {
    (navigator as any).onLine = false;
    
    const { result } = renderHook(() => useOfflineDetection());
    
    await act(async () => {
      await result.current.checkConnection();
    });
    
    expect(result.current.isOnline).toBe(false);
  });

  it('should detect offline status when server ping fails', async () => {
    (navigator as any).onLine = true;
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useOfflineDetection());
    
    await act(async () => {
      await result.current.checkConnection();
    });
    
    expect(result.current.isOnline).toBe(false);
  });

  it('should detect online status when both navigator and server are available', async () => {
    (navigator as any).onLine = true;
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    });
    
    const { result } = renderHook(() => useOfflineDetection());
    
    await act(async () => {
      await result.current.checkConnection();
    });
    
    expect(result.current.isOnline).toBe(true);
  });

  it('should handle retry mechanism', async () => {
    (navigator as any).onLine = true;
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useOfflineDetection({
      retryAttempts: 2,
      retryDelay: 100,
    }));
    
    await act(async () => {
      await result.current.checkConnection();
    });
    
    expect(result.current.isOnline).toBe(false);
    expect(result.current.retryCount).toBe(0);
    
    act(() => {
      result.current.retry();
    });
    
    await waitFor(() => {
      expect(result.current.retryCount).toBe(1);
    });
  });

  it('should reset retry count when connection is restored', async () => {
    const { result } = renderHook(() => useOfflineDetection());
    
    // Simulate offline
    (navigator as any).onLine = true;
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    await act(async () => {
      await result.current.checkConnection();
    });
    
    act(() => {
      result.current.retry();
    });
    
    // Simulate back online
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    });
    
    await act(async () => {
      await result.current.checkConnection();
    });
    
    expect(result.current.isOnline).toBe(true);
    expect(result.current.retryCount).toBe(0);
  });

  it('should use custom ping endpoint', async () => {
    const customEndpoint = '/api/custom-health';
    
    renderHook(() => useOfflineDetection({
      pingEndpoint: customEndpoint,
    }));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        customEndpoint,
        expect.objectContaining({
          method: 'HEAD',
          cache: 'no-cache',
        })
      );
    });
  });

  it('should handle timeout correctly', async () => {
    jest.useFakeTimers();
    
    (fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 10000))
    );
    
    const { result } = renderHook(() => useOfflineDetection({
      timeout: 1000,
    }));
    
    const checkPromise = act(async () => {
      return result.current.checkConnection();
    });
    
    // Fast-forward time to trigger timeout
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await checkPromise;
    
    expect(result.current.isOnline).toBe(false);
    
    jest.useRealTimers();
  });
});