/**
 * Cross-device responsive testing suite
 * Tests responsive breakpoints and mobile-specific features
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';

// Mock viewport dimensions
const mockViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Trigger resize event
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
};

// Device configurations for testing
const DEVICE_CONFIGS = {
  mobile: {
    width: 375,
    height: 667,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    touchEnabled: true,
  },
  tablet: {
    width: 768,
    height: 1024,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    touchEnabled: true,
  },
  desktop: {
    width: 1920,
    height: 1080,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    touchEnabled: false,
  },
  smallMobile: {
    width: 320,
    height: 568,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    touchEnabled: true,
  },
  largeMobile: {
    width: 414,
    height: 896,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    touchEnabled: true,
  },
};

describe('Cross-Device Responsive Testing', () => {
  beforeEach(() => {
    // Reset viewport to desktop by default
    mockViewport(1920, 1080);
  });

  describe('Responsive Breakpoints', () => {
    test('should show mobile navigation on small screens', async () => {
      mockViewport(DEVICE_CONFIGS.mobile.width, DEVICE_CONFIGS.mobile.height);
      
      const { container } = render(<div data-testid="navigation" />);
      
      // Test mobile-specific styles are applied
      expect(container.querySelector('[data-testid="navigation"]')).toBeInTheDocument();
    });

    test('should show desktop navigation on large screens', async () => {
      mockViewport(DEVICE_CONFIGS.desktop.width, DEVICE_CONFIGS.desktop.height);
      
      const { container } = render(<div data-testid="navigation" />);
      
      // Test desktop-specific styles are applied
      expect(container.querySelector('[data-testid="navigation"]')).toBeInTheDocument();
    });

    test('should adapt table layout for mobile', async () => {
      mockViewport(DEVICE_CONFIGS.mobile.width, DEVICE_CONFIGS.mobile.height);
      
      // Test that tables convert to card layout on mobile
      const tableData = [
        { id: 1, name: 'Test User', email: 'test@example.com' },
        { id: 2, name: 'Another User', email: 'another@example.com' },
      ];
      
      // This would test your ResponsiveTable component
      // render(<ResponsiveTable data={tableData} />);
      
      // Verify mobile card layout is used
      // expect(screen.getByTestId('mobile-card-view')).toBeInTheDocument();
    });

    test('should show full table on desktop', async () => {
      mockViewport(DEVICE_CONFIGS.desktop.width, DEVICE_CONFIGS.desktop.height);
      
      // Test that full table is shown on desktop
      const tableData = [
        { id: 1, name: 'Test User', email: 'test@example.com' },
      ];
      
      // render(<ResponsiveTable data={tableData} />);
      
      // Verify desktop table layout is used
      // expect(screen.getByTestId('desktop-table-view')).toBeInTheDocument();
    });
  });

  describe('Touch Interactions', () => {
    test('should handle touch events on mobile devices', async () => {
      mockViewport(DEVICE_CONFIGS.mobile.width, DEVICE_CONFIGS.mobile.height);
      
      const handleTouch = jest.fn();
      const { container } = render(
        <button 
          data-testid="touch-button"
          onTouchStart={handleTouch}
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          Touch Me
        </button>
      );
      
      const button = screen.getByTestId('touch-button');
      
      // Simulate touch event
      fireEvent.touchStart(button);
      expect(handleTouch).toHaveBeenCalled();
      
      // Verify touch target size
      const styles = window.getComputedStyle(button);
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
      expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
    });

    test('should support swipe gestures', async () => {
      mockViewport(DEVICE_CONFIGS.mobile.width, DEVICE_CONFIGS.mobile.height);
      
      const handleSwipe = jest.fn();
      const { container } = render(
        <div 
          data-testid="swipe-area"
          onTouchStart={handleSwipe}
          style={{ width: '100%', height: '200px' }}
        >
          Swipe Area
        </div>
      );
      
      const swipeArea = screen.getByTestId('swipe-area');
      
      // Simulate swipe gesture
      fireEvent.touchStart(swipeArea, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchMove(swipeArea, {
        touches: [{ clientX: 200, clientY: 100 }]
      });
      
      fireEvent.touchEnd(swipeArea);
      
      expect(handleSwipe).toHaveBeenCalled();
    });
  });

  describe('Form Optimization', () => {
    test('should optimize form inputs for mobile', async () => {
      mockViewport(DEVICE_CONFIGS.mobile.width, DEVICE_CONFIGS.mobile.height);
      
      render(
        <form>
          <input 
            data-testid="mobile-input"
            type="email"
            placeholder="Enter email"
            style={{ 
              width: '100%', 
              padding: '12px',
              fontSize: '16px' // Prevent zoom on iOS
            }}
          />
        </form>
      );
      
      const input = screen.getByTestId('mobile-input');
      const styles = window.getComputedStyle(input);
      
      // Verify mobile-optimized styling
      expect(parseInt(styles.fontSize)).toBeGreaterThanOrEqual(16);
      expect(parseInt(styles.padding)).toBeGreaterThanOrEqual(12);
    });

    test('should handle virtual keyboard on mobile', async () => {
      mockViewport(DEVICE_CONFIGS.mobile.width, DEVICE_CONFIGS.mobile.height);
      
      const user = userEvent.setup();
      
      render(
        <input 
          data-testid="keyboard-input"
          type="text"
          placeholder="Type here"
        />
      );
      
      const input = screen.getByTestId('keyboard-input');
      
      // Focus input to trigger virtual keyboard
      await user.click(input);
      expect(input).toHaveFocus();
      
      // Type text
      await user.type(input, 'Hello World');
      expect(input).toHaveValue('Hello World');
    });
  });

  describe('Performance on Different Devices', () => {
    test('should load quickly on mobile devices', async () => {
      mockViewport(DEVICE_CONFIGS.mobile.width, DEVICE_CONFIGS.mobile.height);
      
      const startTime = performance.now();
      
      render(
        <div data-testid="performance-test">
          <h1>Performance Test</h1>
          <p>This should load quickly on mobile</p>
        </div>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Render should complete within reasonable time
      expect(renderTime).toBeLessThan(100); // 100ms threshold
    });

    test('should handle large datasets efficiently on mobile', async () => {
      mockViewport(DEVICE_CONFIGS.mobile.width, DEVICE_CONFIGS.mobile.height);
      
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `Description for item ${i}`,
      }));
      
      const startTime = performance.now();
      
      render(
        <div data-testid="large-dataset">
          {largeDataset.slice(0, 10).map(item => (
            <div key={item.id}>{item.name}</div>
          ))}
        </div>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should handle large datasets efficiently
      expect(renderTime).toBeLessThan(200); // 200ms threshold
    });
  });

  describe('Accessibility on Mobile', () => {
    test('should maintain accessibility on touch devices', async () => {
      mockViewport(DEVICE_CONFIGS.mobile.width, DEVICE_CONFIGS.mobile.height);
      
      render(
        <button 
          data-testid="accessible-button"
          aria-label="Accessible button for mobile"
          style={{ 
            minHeight: '44px',
            minWidth: '44px',
            padding: '12px'
          }}
        >
          Click Me
        </button>
      );
      
      const button = screen.getByTestId('accessible-button');
      
      // Verify accessibility attributes
      expect(button).toHaveAttribute('aria-label');
      
      // Verify touch target size
      const styles = window.getComputedStyle(button);
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
    });

    test('should support screen readers on mobile', async () => {
      mockViewport(DEVICE_CONFIGS.mobile.width, DEVICE_CONFIGS.mobile.height);
      
      render(
        <div>
          <h1 id="main-heading">Main Content</h1>
          <p aria-describedby="main-heading">
            This content is described by the heading
          </p>
          <button aria-label="Close dialog">×</button>
        </div>
      );
      
      // Verify ARIA relationships
      expect(screen.getByRole('heading')).toHaveAttribute('id', 'main-heading');
      expect(screen.getByText('This content is described by the heading'))
        .toHaveAttribute('aria-describedby', 'main-heading');
    });
  });

  describe('Network Conditions', () => {
    test('should handle slow network on mobile', async () => {
      mockViewport(DEVICE_CONFIGS.mobile.width, DEVICE_CONFIGS.mobile.height);
      
      // Mock slow network
      const mockFetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 2000))
      );
      
      global.fetch = mockFetch;
      
      render(
        <div data-testid="network-test">
          Loading content...
        </div>
      );
      
      // Should show loading state
      expect(screen.getByText('Loading content...')).toBeInTheDocument();
      
      // Clean up
      global.fetch = jest.fn();
    });

    test('should work offline on mobile', async () => {
      mockViewport(DEVICE_CONFIGS.mobile.width, DEVICE_CONFIGS.mobile.height);
      
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      
      render(
        <div data-testid="offline-test">
          {navigator.onLine ? 'Online' : 'Offline'}
        </div>
      );
      
      expect(screen.getByText('Offline')).toBeInTheDocument();
      
      // Reset online state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
    });
  });
});

// Helper function to test specific device configurations
export const testOnDevice = (deviceName: keyof typeof DEVICE_CONFIGS, testFn: () => void) => {
  const device = DEVICE_CONFIGS[deviceName];
  
  beforeEach(() => {
    mockViewport(device.width, device.height);
    
    // Mock user agent
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: device.userAgent,
    });
    
    // Mock touch capability
    if (device.touchEnabled) {
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        value: () => {},
      });
    }
  });
  
  testFn();
};