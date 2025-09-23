import { renderHook, act } from '@testing-library/react';
import { useSwipeGesture } from '../useSwipeGesture';

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

describe('useSwipeGesture', () => {
  let mockElement: HTMLDivElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
  });

  describe('Swipe Detection', () => {
    it('detects swipe left gesture', () => {
      const onSwipeLeft = jest.fn();
      const { result } = renderHook(() => useSwipeGesture({
        onSwipeLeft,
        threshold: 50,
      }));

      // Set the ref
      act(() => {
        result.current.current = mockElement;
      });

      // Simulate swipe left (start at x:100, end at x:30)
      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 50 }]);
        mockElement.dispatchEvent(touchStart);
      });

      act(() => {
        const touchEnd = createTouchEvent('touchend', [{ clientX: 30, clientY: 50 }]);
        mockElement.dispatchEvent(touchEnd);
      });

      expect(onSwipeLeft).toHaveBeenCalled();
    });

    it('detects swipe right gesture', () => {
      const onSwipeRight = jest.fn();
      const { result } = renderHook(() => useSwipeGesture({
        onSwipeRight,
        threshold: 50,
      }));

      act(() => {
        result.current.current = mockElement;
      });

      // Simulate swipe right (start at x:30, end at x:100)
      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 30, clientY: 50 }]);
        mockElement.dispatchEvent(touchStart);
      });

      act(() => {
        const touchEnd = createTouchEvent('touchend', [{ clientX: 100, clientY: 50 }]);
        mockElement.dispatchEvent(touchEnd);
      });

      expect(onSwipeRight).toHaveBeenCalled();
    });

    it('detects swipe up gesture', () => {
      const onSwipeUp = jest.fn();
      const { result } = renderHook(() => useSwipeGesture({
        onSwipeUp,
        threshold: 50,
      }));

      act(() => {
        result.current.current = mockElement;
      });

      // Simulate swipe up (start at y:100, end at y:30)
      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 50, clientY: 100 }]);
        mockElement.dispatchEvent(touchStart);
      });

      act(() => {
        const touchEnd = createTouchEvent('touchend', [{ clientX: 50, clientY: 30 }]);
        mockElement.dispatchEvent(touchEnd);
      });

      expect(onSwipeUp).toHaveBeenCalled();
    });

    it('detects swipe down gesture', () => {
      const onSwipeDown = jest.fn();
      const { result } = renderHook(() => useSwipeGesture({
        onSwipeDown,
        threshold: 50,
      }));

      act(() => {
        result.current.current = mockElement;
      });

      // Simulate swipe down (start at y:30, end at y:100)
      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 50, clientY: 30 }]);
        mockElement.dispatchEvent(touchStart);
      });

      act(() => {
        const touchEnd = createTouchEvent('touchend', [{ clientX: 50, clientY: 100 }]);
        mockElement.dispatchEvent(touchEnd);
      });

      expect(onSwipeDown).toHaveBeenCalled();
    });
  });

  describe('Threshold Behavior', () => {
    it('does not trigger swipe if below threshold', () => {
      const onSwipeLeft = jest.fn();
      const { result } = renderHook(() => useSwipeGesture({
        onSwipeLeft,
        threshold: 100, // High threshold
      }));

      act(() => {
        result.current.current = mockElement;
      });

      // Small swipe (below threshold)
      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 50 }]);
        mockElement.dispatchEvent(touchStart);
      });

      act(() => {
        const touchEnd = createTouchEvent('touchend', [{ clientX: 80, clientY: 50 }]);
        mockElement.dispatchEvent(touchEnd);
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('uses default threshold when not specified', () => {
      const onSwipeLeft = jest.fn();
      const { result } = renderHook(() => useSwipeGesture({
        onSwipeLeft,
        // No threshold specified, should use default (50)
      }));

      act(() => {
        result.current.current = mockElement;
      });

      // Swipe that meets default threshold
      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 50 }]);
        mockElement.dispatchEvent(touchStart);
      });

      act(() => {
        const touchEnd = createTouchEvent('touchend', [{ clientX: 40, clientY: 50 }]);
        mockElement.dispatchEvent(touchEnd);
      });

      expect(onSwipeLeft).toHaveBeenCalled();
    });
  });

  describe('Direction Priority', () => {
    it('prioritizes horizontal swipe over vertical when both exceed threshold', () => {
      const onSwipeLeft = jest.fn();
      const onSwipeUp = jest.fn();
      const { result } = renderHook(() => useSwipeGesture({
        onSwipeLeft,
        onSwipeUp,
        threshold: 30,
      }));

      act(() => {
        result.current.current = mockElement;
      });

      // Diagonal swipe with more horizontal movement
      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
        mockElement.dispatchEvent(touchStart);
      });

      act(() => {
        const touchEnd = createTouchEvent('touchend', [{ clientX: 30, clientY: 60 }]);
        mockElement.dispatchEvent(touchEnd);
      });

      expect(onSwipeLeft).toHaveBeenCalled();
      expect(onSwipeUp).not.toHaveBeenCalled();
    });

    it('prioritizes vertical swipe when vertical movement is greater', () => {
      const onSwipeLeft = jest.fn();
      const onSwipeUp = jest.fn();
      const { result } = renderHook(() => useSwipeGesture({
        onSwipeLeft,
        onSwipeUp,
        threshold: 30,
      }));

      act(() => {
        result.current.current = mockElement;
      });

      // Diagonal swipe with more vertical movement
      act(() => {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
        mockElement.dispatchEvent(touchStart);
      });

      act(() => {
        const touchEnd = createTouchEvent('touchend', [{ clientX: 60, clientY: 30 }]);
        mockElement.dispatchEvent(touchEnd);
      });

      expect(onSwipeUp).toHaveBeenCalled();
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    it('handles missing touch events gracefully', () => {
      const onSwipeLeft = jest.fn();
      const { result } = renderHook(() => useSwipeGesture({
        onSwipeLeft,
        threshold: 50,
      }));

      act(() => {
        result.current.current = mockElement;
      });

      // Only touchend without touchstart
      act(() => {
        const touchEnd = createTouchEvent('touchend', [{ clientX: 30, clientY: 50 }]);
        mockElement.dispatchEvent(touchEnd);
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('handles multiple touches by using first touch', () => {
      const onSwipeLeft = jest.fn();
      const { result } = renderHook(() => useSwipeGesture({
        onSwipeLeft,
        threshold: 50,
      }));

      act(() => {
        result.current.current = mockElement;
      });

      // Multiple touches - should use first one
      act(() => {
        const touchStart = createTouchEvent('touchstart', [
          { clientX: 100, clientY: 50 },
          { clientX: 200, clientY: 50 }
        ]);
        mockElement.dispatchEvent(touchStart);
      });

      act(() => {
        const touchEnd = createTouchEvent('touchend', [
          { clientX: 30, clientY: 50 },
          { clientX: 180, clientY: 50 }
        ]);
        mockElement.dispatchEvent(touchEnd);
      });

      expect(onSwipeLeft).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('removes event listeners when element changes', () => {
      const onSwipeLeft = jest.fn();
      const { result } = renderHook(() => useSwipeGesture({
        onSwipeLeft,
        threshold: 50,
      }));

      const removeEventListenerSpy = jest.spyOn(mockElement, 'removeEventListener');

      act(() => {
        result.current.current = mockElement;
      });

      // Change element
      const newElement = document.createElement('div');
      act(() => {
        result.current.current = newElement;
      });

      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
    });

    it('removes event listeners on unmount', () => {
      const onSwipeLeft = jest.fn();
      const { result, unmount } = renderHook(() => useSwipeGesture({
        onSwipeLeft,
        threshold: 50,
      }));

      const removeEventListenerSpy = jest.spyOn(mockElement, 'removeEventListener');

      act(() => {
        result.current.current = mockElement;
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
    });
  });

  describe('Performance', () => {
    it('does not create new handlers on every render', () => {
      const onSwipeLeft = jest.fn();
      const { result, rerender } = renderHook(() => useSwipeGesture({
        onSwipeLeft,
        threshold: 50,
      }));

      const firstRef = result.current;
      
      rerender();
      
      const secondRef = result.current;
      
      // Ref should be stable across renders
      expect(firstRef).toBe(secondRef);
    });
  });
});