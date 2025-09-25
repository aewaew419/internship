import { renderHook, act } from '@testing-library/react';
import { useScreenReader } from '@/hooks/useScreenReader';

// Mock DOM methods
const mockGetElementById = jest.fn();
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();

Object.defineProperty(document, 'getElementById', {
  value: mockGetElementById,
});

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
});

describe('useScreenReader', () => {
  let mockLiveRegion: HTMLDivElement;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Create mock live region element
    mockLiveRegion = {
      id: '',
      textContent: '',
      setAttribute: jest.fn(),
      style: { cssText: '' },
      className: '',
    } as any;

    mockCreateElement.mockReturnValue(mockLiveRegion);
    mockGetElementById.mockReturnValue(null); // Initially no element exists
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('announce', () => {
    it('should create live region if it does not exist', () => {
      const { result } = renderHook(() => useScreenReader());

      act(() => {
        result.current.announce('Test message', 'polite');
      });

      expect(mockCreateElement).toHaveBeenCalledWith('div');
      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('aria-live', 'polite');
      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('aria-atomic', 'true');
      expect(mockAppendChild).toHaveBeenCalledWith(mockLiveRegion);
    });

    it('should use existing live region if it exists', () => {
      mockGetElementById.mockReturnValue(mockLiveRegion);

      const { result } = renderHook(() => useScreenReader());

      act(() => {
        result.current.announce('Test message', 'polite');
      });

      expect(mockCreateElement).not.toHaveBeenCalled();
      expect(mockAppendChild).not.toHaveBeenCalled();
    });

    it('should debounce announcements', () => {
      const { result } = renderHook(() => useScreenReader({ debounceTime: 100 }));

      act(() => {
        result.current.announce('First message', 'polite');
        result.current.announce('Second message', 'polite');
        result.current.announce('Third message', 'polite');
      });

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should only announce the last message
      expect(mockLiveRegion.textContent).toBe('Third message');
    });

    it('should clear region before announcing', () => {
      const { result } = renderHook(() => useScreenReader());

      act(() => {
        result.current.announce('Test message', 'polite');
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should clear first, then set content
      expect(mockLiveRegion.textContent).toBe('');

      act(() => {
        jest.advanceTimersByTime(10);
      });

      expect(mockLiveRegion.textContent).toBe('Test message');
    });

    it('should not announce empty messages', () => {
      const { result } = renderHook(() => useScreenReader());

      act(() => {
        result.current.announce('', 'polite');
        result.current.announce('   ', 'polite');
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockCreateElement).not.toHaveBeenCalled();
    });

    it('should use default priority when not specified', () => {
      const { result } = renderHook(() => useScreenReader({ defaultPriority: 'assertive' }));

      act(() => {
        result.current.announce('Test message');
      });

      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('aria-live', 'assertive');
    });
  });

  describe('specialized announce methods', () => {
    it('should announce errors with assertive priority', () => {
      const { result } = renderHook(() => useScreenReader());

      act(() => {
        result.current.announceError('Error message');
      });

      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('aria-live', 'assertive');

      act(() => {
        jest.advanceTimersByTime(110);
      });

      expect(mockLiveRegion.textContent).toBe('ข้อผิดพลาด: Error message');
    });

    it('should announce success with polite priority', () => {
      const { result } = renderHook(() => useScreenReader());

      act(() => {
        result.current.announceSuccess('Success message');
      });

      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('aria-live', 'polite');

      act(() => {
        jest.advanceTimersByTime(110);
      });

      expect(mockLiveRegion.textContent).toBe('สำเร็จ: Success message');
    });

    it('should announce warnings with assertive priority', () => {
      const { result } = renderHook(() => useScreenReader());

      act(() => {
        result.current.announceWarning('Warning message');
      });

      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('aria-live', 'assertive');

      act(() => {
        jest.advanceTimersByTime(110);
      });

      expect(mockLiveRegion.textContent).toBe('คำเตือน: Warning message');
    });

    it('should announce form validation results', () => {
      const { result } = renderHook(() => useScreenReader());

      // Valid field
      act(() => {
        result.current.announceFormValidation('รหัสนักศึกษา', 'ถูกต้อง', true);
      });

      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('aria-live', 'polite');

      act(() => {
        jest.advanceTimersByTime(110);
      });

      expect(mockLiveRegion.textContent).toBe('รหัสนักศึกษา ถูกต้อง: ถูกต้อง');

      // Invalid field
      act(() => {
        result.current.announceFormValidation('รหัสผ่าน', 'ไม่ถูกต้อง', false);
      });

      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('aria-live', 'assertive');

      act(() => {
        jest.advanceTimersByTime(110);
      });

      expect(mockLiveRegion.textContent).toBe('รหัสผ่าน ไม่ถูกต้อง: ไม่ถูกต้อง');
    });

    it('should announce progress updates', () => {
      const { result } = renderHook(() => useScreenReader());

      act(() => {
        result.current.announceProgress(3, 5, 'กำลังอัปโหลด');
      });

      act(() => {
        jest.advanceTimersByTime(110);
      });

      expect(mockLiveRegion.textContent).toBe('กำลังอัปโหลด 60% เสร็จสิ้น');

      // Without description
      act(() => {
        result.current.announceProgress(2, 4);
      });

      act(() => {
        jest.advanceTimersByTime(110);
      });

      expect(mockLiveRegion.textContent).toBe('ความคืบหน้า 50%');
    });
  });

  describe('clear', () => {
    it('should clear all live regions', () => {
      const mockPoliteRegion = { textContent: 'polite message' } as HTMLDivElement;
      const mockAssertiveRegion = { textContent: 'assertive message' } as HTMLDivElement;

      mockGetElementById
        .mockReturnValueOnce(mockPoliteRegion)
        .mockReturnValueOnce(mockAssertiveRegion);

      const { result } = renderHook(() => useScreenReader());

      act(() => {
        result.current.clear();
      });

      expect(mockPoliteRegion.textContent).toBe('');
      expect(mockAssertiveRegion.textContent).toBe('');
    });

    it('should clear pending timeouts', () => {
      const { result } = renderHook(() => useScreenReader());

      act(() => {
        result.current.announce('First message', 'polite');
        result.current.clear();
        result.current.announce('Second message', 'polite');
      });

      act(() => {
        jest.advanceTimersByTime(110);
      });

      // Should only announce the second message
      expect(mockLiveRegion.textContent).toBe('Second message');
    });
  });

  describe('live region creation', () => {
    it('should create live region with proper attributes and styles', () => {
      const { result } = renderHook(() => useScreenReader());

      act(() => {
        result.current.announce('Test message', 'polite');
      });

      expect(mockLiveRegion.id).toBe('sr-live-region-polite');
      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('aria-live', 'polite');
      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('aria-atomic', 'true');
      expect(mockLiveRegion.className).toBe('sr-only');
      expect(mockLiveRegion.style.cssText).toContain('position: absolute');
      expect(mockLiveRegion.style.cssText).toContain('width: 1px');
      expect(mockLiveRegion.style.cssText).toContain('height: 1px');
    });

    it('should create separate regions for different priorities', () => {
      const { result } = renderHook(() => useScreenReader());

      act(() => {
        result.current.announce('Polite message', 'polite');
        result.current.announce('Assertive message', 'assertive');
      });

      expect(mockCreateElement).toHaveBeenCalledTimes(2);
    });
  });

  describe('configuration options', () => {
    it('should use custom default priority', () => {
      const { result } = renderHook(() => 
        useScreenReader({ defaultPriority: 'assertive' })
      );

      act(() => {
        result.current.announce('Test message');
      });

      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('aria-live', 'assertive');
    });

    it('should use custom debounce time', () => {
      const { result } = renderHook(() => 
        useScreenReader({ debounceTime: 200 })
      );

      act(() => {
        result.current.announce('Test message', 'polite');
      });

      // Should not announce yet
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockLiveRegion.textContent).toBe('');

      // Should announce after custom debounce time
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockLiveRegion.textContent).toBe('');

      act(() => {
        jest.advanceTimersByTime(10);
      });

      expect(mockLiveRegion.textContent).toBe('Test message');
    });
  });
});