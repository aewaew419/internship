import { renderHook } from '@testing-library/react';
import { useFocusManagement } from '@/hooks/useFocusManagement';
import { RefObject } from 'react';

describe('useFocusManagement', () => {
  let mockContainer: HTMLDivElement;
  let mockContainerRef: RefObject<HTMLDivElement>;
  let mockPreviousActiveElement: HTMLElement;

  beforeEach(() => {
    // Create mock container element
    mockContainer = {
      focus: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(),
    } as any;

    mockContainerRef = { current: mockContainer };

    // Mock previous active element
    mockPreviousActiveElement = {
      focus: jest.fn(),
    } as any;

    // Mock document.activeElement
    Object.defineProperty(document, 'activeElement', {
      value: mockPreviousActiveElement,
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should store previous active element when restoreFocus is true', () => {
      renderHook(() => 
        useFocusManagement({
          containerRef: mockContainerRef,
          restoreFocus: true,
        })
      );

      // Previous active element should be stored
      expect(document.activeElement).toBe(mockPreviousActiveElement);
    });

    it('should auto focus container when autoFocus is true', () => {
      renderHook(() => 
        useFocusManagement({
          containerRef: mockContainerRef,
          autoFocus: true,
        })
      );

      expect(mockContainer.focus).toHaveBeenCalled();
    });

    it('should not auto focus when autoFocus is false', () => {
      renderHook(() => 
        useFocusManagement({
          containerRef: mockContainerRef,
          autoFocus: false,
        })
      );

      expect(mockContainer.focus).not.toHaveBeenCalled();
    });
  });

  describe('focus restoration', () => {
    it('should restore focus on unmount when restoreFocus is true', () => {
      const { unmount } = renderHook(() => 
        useFocusManagement({
          containerRef: mockContainerRef,
          restoreFocus: true,
        })
      );

      unmount();

      expect(mockPreviousActiveElement.focus).toHaveBeenCalled();
    });

    it('should not restore focus on unmount when restoreFocus is false', () => {
      const { unmount } = renderHook(() => 
        useFocusManagement({
          containerRef: mockContainerRef,
          restoreFocus: false,
        })
      );

      unmount();

      expect(mockPreviousActiveElement.focus).not.toHaveBeenCalled();
    });
  });

  describe('focus trap', () => {
    let mockFocusableElements: HTMLElement[];
    let mockFirstElement: HTMLElement;
    let mockLastElement: HTMLElement;

    beforeEach(() => {
      mockFirstElement = { focus: jest.fn() } as any;
      mockLastElement = { focus: jest.fn() } as any;
      mockFocusableElements = [mockFirstElement, mockLastElement];

      mockContainer.querySelectorAll.mockReturnValue(mockFocusableElements);
    });

    it('should set up focus trap when trapFocus is true', () => {
      renderHook(() => 
        useFocusManagement({
          containerRef: mockContainerRef,
          trapFocus: true,
        })
      );

      expect(mockContainer.addEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('should not set up focus trap when trapFocus is false', () => {
      renderHook(() => 
        useFocusManagement({
          containerRef: mockContainerRef,
          trapFocus: false,
        })
      );

      expect(mockContainer.addEventListener).not.toHaveBeenCalled();
    });

    it('should handle Tab key to trap focus forward', () => {
      renderHook(() => 
        useFocusManagement({
          containerRef: mockContainerRef,
          trapFocus: true,
        })
      );

      // Get the keydown handler
      const keydownHandler = mockContainer.addEventListener.mock.calls[0][1];

      // Mock document.activeElement as last element
      Object.defineProperty(document, 'activeElement', {
        value: mockLastElement,
        writable: true,
      });

      // Simulate Tab key press
      const mockEvent = {
        key: 'Tab',
        shiftKey: false,
        preventDefault: jest.fn(),
      };

      keydownHandler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockFirstElement.focus).toHaveBeenCalled();
    });

    it('should handle Shift+Tab key to trap focus backward', () => {
      renderHook(() => 
        useFocusManagement({
          containerRef: mockContainerRef,
          trapFocus: true,
        })
      );

      const keydownHandler = mockContainer.addEventListener.mock.calls[0][1];

      // Mock document.activeElement as first element
      Object.defineProperty(document, 'activeElement', {
        value: mockFirstElement,
        writable: true,
      });

      // Simulate Shift+Tab key press
      const mockEvent = {
        key: 'Tab',
        shiftKey: true,
        preventDefault: jest.fn(),
      };

      keydownHandler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockLastElement.focus).toHaveBeenCalled();
    });

    it('should ignore non-Tab keys', () => {
      renderHook(() => 
        useFocusManagement({
          containerRef: mockContainerRef,
          trapFocus: true,
        })
      );

      const keydownHandler = mockContainer.addEventListener.mock.calls[0][1];

      const mockEvent = {
        key: 'Enter',
        shiftKey: false,
        preventDefault: jest.fn(),
      };

      keydownHandler(mockEvent);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(mockFirstElement.focus).not.toHaveBeenCalled();
      expect(mockLastElement.focus).not.toHaveBeenCalled();
    });

    it('should clean up event listener on unmount', () => {
      const { unmount } = renderHook(() => 
        useFocusManagement({
          containerRef: mockContainerRef,
          trapFocus: true,
        })
      );

      unmount();

      expect(mockContainer.removeEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });
  });

  describe('focus utility methods', () => {
    let mockFocusableElement: HTMLElement;

    beforeEach(() => {
      mockFocusableElement = { focus: jest.fn() } as any;
      mockContainer.querySelector.mockReturnValue(mockFocusableElement);
      mockContainer.querySelectorAll.mockReturnValue([mockFocusableElement]);
    });

    it('should focus first element', () => {
      const { result } = renderHook(() => 
        useFocusManagement({
          containerRef: mockContainerRef,
        })
      );

      result.current.focusFirstElement();

      expect(mockContainer.querySelector).toHaveBeenCalledWith(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      expect(mockFocusableElement.focus).toHaveBeenCalled();
    });

    it('should focus last element', () => {
      const { result } = renderHook(() => 
        useFocusManagement({
          containerRef: mockContainerRef,
        })
      );

      result.current.focusLastElement();

      expect(mockContainer.querySelectorAll).toHaveBeenCalledWith(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      expect(mockFocusableElement.focus).toHaveBeenCalled();
    });

    it('should handle no focusable elements gracefully', () => {
      mockContainer.querySelector.mockReturnValue(null);
      mockContainer.querySelectorAll.mockReturnValue([]);

      const { result } = renderHook(() => 
        useFocusManagement({
          containerRef: mockContainerRef,
        })
      );

      // Should not throw errors
      expect(() => {
        result.current.focusFirstElement();
        result.current.focusLastElement();
      }).not.toThrow();
    });

    it('should handle null container ref gracefully', () => {
      const nullContainerRef = { current: null };

      const { result } = renderHook(() => 
        useFocusManagement({
          containerRef: nullContainerRef,
        })
      );

      // Should not throw errors
      expect(() => {
        result.current.focusFirstElement();
        result.current.focusLastElement();
      }).not.toThrow();
    });
  });

  describe('focusable element selector', () => {
    it('should use correct selector for focusable elements', () => {
      const { result } = renderHook(() => 
        useFocusManagement({
          containerRef: mockContainerRef,
        })
      );

      result.current.focusFirstElement();

      const expectedSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      expect(mockContainer.querySelector).toHaveBeenCalledWith(expectedSelector);
    });

    it('should exclude elements with tabindex="-1"', () => {
      const { result } = renderHook(() => 
        useFocusManagement({
          containerRef: mockContainerRef,
        })
      );

      result.current.focusLastElement();

      const expectedSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      expect(mockContainer.querySelectorAll).toHaveBeenCalledWith(expectedSelector);
    });
  });
});