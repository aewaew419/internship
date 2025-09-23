import { renderHook, act } from '@testing-library/react';
import { usePullToRefresh } from '../usePullToRefresh';

// Mock touch events
const createTouchEvent = (type: string, touches: Array<{ clientX: number; clientY: number }>) => {
  return new TouchEvent(type, {
    touches: touches.map(touch => ({
      ...touch,
      identifier: 0,
      target: document.createElement('div'),
      radiusX: 0,
      radiusY: 0,
      rotationAngle: 0,
      force: 1,
    })) as any,
    changedTouches: touches.map(touch => ({
      ...touch,
      identifier: 0,
      target: document.createElement('div'),
      radiusX: 0,
      radiusY: 0,
      rotationAngle: 0,
      force: 1,
    })) as any,
    targetTouches: touches.map(touch => ({
      ...touch,
      identifier: 0,
      target: document.createElement('div'),
      radiusX: 0,
      radiusY: 0,
      rotationAngle: 0,
      force: 1,
    })) as any,
  });
};

describe('usePullToRefresh', () => {
  let mockElement: HTMLDivElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
    
    // Mock scrollTop property
    Object.defineProperty(mockElement, 'scrollTop', {
      value: 0,
      writable: true,
    });
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('initializes with correct default state', () => {
      const onRefresh = jest.fn();
      const { result } = renderHook(() => usePullToRefresh({
        onRefresh,
      }));

      expect(result.current.isPulling).toBe(false);
      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.pullDistance).toBe(0);
      expect(result.current.ref.current).toBe(null);
    });

    it('attaches event listeners when element is set', () => {
      const onRefresh = jest.fn();
      const { result } = renderHook(() => usePullToRefresh({
        onRefresh,
      }));

      const addEventListenerSpy = jest.spyOn(mockElement, 'addEventListener');

      act(() => {
        result.current.ref.current = mockElement;
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false });
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
    });
  });

  describe('Pull Detection', () => {
    it('starts pulling when scrolled to top and pulling down', () => {
      const onRefresh = jest.fn();
      const { result } = renderHook(() => usePullToRefresh({
        onRefresh,
      }));

      act(() => {
        result.current.ref.current = mockElement;
      });

      // Start touch at top
      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 50 }]);
        mockElement.dispatchEvent(touchStart);
      });

      // Move down
      act(() => {
        const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 100 }]);
        mockElement.dispatchEvent(touchMove);
      });

      expect(result.current.isPulling).toBe(true);
      expect(result.current.pullDistance).toBe(50);
    });

    it('does not start pulling when not at top of scroll', () => {
      const onRefresh = jest.fn();
      const { result } = renderHook(() => usePullToRefresh({
        onRefresh,
      }));

      act(() => {
        result.current.ref.current = mockElement;
        // Set scroll position away from top
        mockElement.scrollTop = 100;
      });

      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 50 }]);
        mockElement.dispatchEvent(touchStart);
      });

      act(() => {
        const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 100 }]);
        mockElement.dispatchEvent(touchMove);
      });

      expect(result.current.isPulling).toBe(false);
      expect(result.current.pullDistance).toBe(0);
    });

    it('does not start pulling when moving up', () => {
      const onRefresh = jest.fn();
      const { result } = renderHook(() => usePullToRefresh({
        onRefresh,
      }));

      act(() => {
        result.current.ref.current = mockElement;
      });

      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
        mockElement.dispatchEvent(touchStart);
      });

      // Move up instead of down
      act(() => {
        const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 50 }]);
        mockElement.dispatchEvent(touchMove);
      });

      expect(result.current.isPulling).toBe(false);
      expect(result.current.pullDistance).toBe(0);
    });
  });

  describe('Refresh Trigger', () => {
    it('triggers refresh when pull distance exceeds threshold', async () => {
      const onRefresh = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => usePullToRefresh({
        onRefresh,
        threshold: 80,
      }));

      act(() => {
        result.current.ref.current = mockElement;
      });

      // Start pulling
      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 50 }]);
        mockElement.dispatchEvent(touchStart);
      });

      // Pull beyond threshold
      act(() => {
        const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 150 }]);
        mockElement.dispatchEvent(touchMove);
      });

      // End touch
      act(() => {
        const touchEnd = createTouchEvent('touchend', []);
        mockElement.dispatchEvent(touchEnd);
      });

      expect(result.current.isRefreshing).toBe(true);
      expect(onRefresh).toHaveBeenCalled();

      // Wait for refresh to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.isPulling).toBe(false);
      expect(result.current.pullDistance).toBe(0);
    });

    it('does not trigger refresh when pull distance is below threshold', () => {
      const onRefresh = jest.fn();
      const { result } = renderHook(() => usePullToRefresh({
        onRefresh,
        threshold: 100,
      }));

      act(() => {
        result.current.ref.current = mockElement;
      });

      // Start pulling
      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 50 }]);
        mockElement.dispatchEvent(touchStart);
      });

      // Pull below threshold
      act(() => {
        const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 120 }]);
        mockElement.dispatchEvent(touchMove);
      });

      // End touch
      act(() => {
        const touchEnd = createTouchEvent('touchend', []);
        mockElement.dispatchEvent(touchEnd);
      });

      expect(result.current.isRefreshing).toBe(false);
      expect(onRefresh).not.toHaveBeenCalled();
      expect(result.current.isPulling).toBe(false);
      expect(result.current.pullDistance).toBe(0);
    });
  });

  describe('Configuration Options', () => {
    it('uses custom threshold', () => {
      const onRefresh = jest.fn();
      const { result } = renderHook(() => usePullToRefresh({
        onRefresh,
        threshold: 120,
      }));

      act(() => {
        result.current.ref.current = mockElement;
      });

      // Pull to custom threshold
      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 50 }]);
        mockElement.dispatchEvent(touchStart);
      });

      act(() => {
        const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 170 }]);
        mockElement.dispatchEvent(touchMove);
      });

      act(() => {
        const touchEnd = createTouchEvent('touchend', []);
        mockElement.dispatchEvent(touchEnd);
      });

      expect(onRefresh).toHaveBeenCalled();
    });

    it('uses custom resistance factor', () => {
      const onRefresh = jest.fn();
      const { result } = renderHook(() => usePullToRefresh({
        onRefresh,
        resistance: 0.5, // Half resistance
      }));

      act(() => {
        result.current.ref.current = mockElement;
      });

      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 50 }]);
        mockElement.dispatchEvent(touchStart);
      });

      // Move 100px down
      act(() => {
        const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 150 }]);
        mockElement.dispatchEvent(touchMove);
      });

      // With 0.5 resistance, 100px movement should result in 50px pull distance
      expect(result.current.pullDistance).toBe(50);
    });

    it('respects disabled state', () => {
      const onRefresh = jest.fn();
      const { result } = renderHook(() => usePullToRefresh({
        onRefresh,
        disabled: true,
      }));

      act(() => {
        result.current.ref.current = mockElement;
      });

      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 50 }]);
        mockElement.dispatchEvent(touchStart);
      });

      act(() => {
        const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 150 }]);
        mockElement.dispatchEvent(touchMove);
      });

      expect(result.current.isPulling).toBe(false);
      expect(result.current.pullDistance).toBe(0);
    });
  });

  describe('State Management', () => {
    it('prevents multiple simultaneous refreshes', async () => {
      const onRefresh = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const { result } = renderHook(() => usePullToRefresh({
        onRefresh,
      }));

      act(() => {
        result.current.ref.current = mockElement;
      });

      // First refresh
      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 50 }]);
        mockElement.dispatchEvent(touchStart);
      });

      act(() => {
        const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 150 }]);
        mockElement.dispatchEvent(touchMove);
      });

      act(() => {
        const touchEnd = createTouchEvent('touchend', []);
        mockElement.dispatchEvent(touchEnd);
      });

      expect(result.current.isRefreshing).toBe(true);

      // Try to trigger another refresh while first is in progress
      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 50 }]);
        mockElement.dispatchEvent(touchStart);
      });

      act(() => {
        const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 150 }]);
        mockElement.dispatchEvent(touchMove);
      });

      // Should not start pulling while refreshing
      expect(result.current.isPulling).toBe(false);
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('resets state after refresh completes', async () => {
      const onRefresh = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => usePullToRefresh({
        onRefresh,
      }));

      act(() => {
        result.current.ref.current = mockElement;
      });

      // Trigger refresh
      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 50 }]);
        mockElement.dispatchEvent(touchStart);
      });

      act(() => {
        const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 150 }]);
        mockElement.dispatchEvent(touchMove);
      });

      act(() => {
        const touchEnd = createTouchEvent('touchend', []);
        mockElement.dispatchEvent(touchEnd);
      });

      expect(result.current.isRefreshing).toBe(true);

      // Wait for refresh to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.isPulling).toBe(false);
      expect(result.current.pullDistance).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('handles refresh errors gracefully', async () => {
      const onRefresh = jest.fn().mockRejectedValue(new Error('Refresh failed'));
      const { result } = renderHook(() => usePullToRefresh({
        onRefresh,
      }));

      act(() => {
        result.current.ref.current = mockElement;
      });

      // Trigger refresh
      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 50 }]);
        mockElement.dispatchEvent(touchStart);
      });

      act(() => {
        const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 150 }]);
        mockElement.dispatchEvent(touchMove);
      });

      act(() => {
        const touchEnd = createTouchEvent('touchend', []);
        mockElement.dispatchEvent(touchEnd);
      });

      // Wait for error to be handled
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should reset state even after error
      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.isPulling).toBe(false);
      expect(result.current.pullDistance).toBe(0);
    });

    it('handles missing touch data gracefully', () => {
      const onRefresh = jest.fn();
      const { result } = renderHook(() => usePullToRefresh({
        onRefresh,
      }));

      act(() => {
        result.current.ref.current = mockElement;
      });

      // Touch move without touch start
      act(() => {
        const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 150 }]);
        mockElement.dispatchEvent(touchMove);
      });

      expect(result.current.isPulling).toBe(false);
      expect(result.current.pullDistance).toBe(0);
    });
  });

  describe('Cleanup', () => {
    it('removes event listeners when element changes', () => {
      const onRefresh = jest.fn();
      const { result } = renderHook(() => usePullToRefresh({
        onRefresh,
      }));

      const removeEventListenerSpy = jest.spyOn(mockElement, 'removeEventListener');

      act(() => {
        result.current.ref.current = mockElement;
      });

      // Change element
      const newElement = document.createElement('div');
      act(() => {
        result.current.ref.current = newElement;
      });

      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
    });

    it('removes event listeners on unmount', () => {
      const onRefresh = jest.fn();
      const { result, unmount } = renderHook(() => usePullToRefresh({
        onRefresh,
      }));

      const removeEventListenerSpy = jest.spyOn(mockElement, 'removeEventListener');

      act(() => {
        result.current.ref.current = mockElement;
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
    });
  });
});