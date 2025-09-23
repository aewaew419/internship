import { render, screen, fireEvent } from '@testing-library/react';
import { ResponsiveChart } from '../ResponsiveChart/ResponsiveChart';
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery';

// Mock the media query hooks
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(),
  useIsTablet: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock fullscreen API
Object.defineProperty(document, 'fullscreenElement', {
  writable: true,
  value: null,
});

Object.defineProperty(document, 'exitFullscreen', {
  writable: true,
  value: jest.fn(),
});

describe('ResponsiveChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children correctly', () => {
    (useIsMobile as jest.Mock).mockReturnValue(false);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    render(
      <ResponsiveChart>
        <div data-testid="chart-content">Test Chart</div>
      </ResponsiveChart>
    );
    
    expect(screen.getByTestId('chart-content')).toBeInTheDocument();
  });

  it('applies mobile dimensions on mobile devices', () => {
    (useIsMobile as jest.Mock).mockReturnValue(true);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    const { container } = render(
      <ResponsiveChart>
        <div>Test Chart</div>
      </ResponsiveChart>
    );
    
    const chartContainer = container.firstChild as HTMLElement;
    expect(chartContainer.style.maxWidth).toBe('280px');
  });

  it('applies tablet dimensions on tablet devices', () => {
    (useIsMobile as jest.Mock).mockReturnValue(false);
    (useIsTablet as jest.Mock).mockReturnValue(true);

    const { container } = render(
      <ResponsiveChart>
        <div>Test Chart</div>
      </ResponsiveChart>
    );
    
    const chartContainer = container.firstChild as HTMLElement;
    expect(chartContainer.style.maxWidth).toBe('350px');
  });

  it('applies desktop dimensions on desktop devices', () => {
    (useIsMobile as jest.Mock).mockReturnValue(false);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    const { container } = render(
      <ResponsiveChart>
        <div>Test Chart</div>
      </ResponsiveChart>
    );
    
    const chartContainer = container.firstChild as HTMLElement;
    expect(chartContainer.style.maxWidth).toBe('400px');
  });

  it('shows fullscreen button on mobile when enabled', () => {
    (useIsMobile as jest.Mock).mockReturnValue(true);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    render(
      <ResponsiveChart enableFullscreen={true}>
        <div>Test Chart</div>
      </ResponsiveChart>
    );
    
    expect(screen.getByLabelText('Enter fullscreen')).toBeInTheDocument();
  });

  it('does not show fullscreen button on desktop', () => {
    (useIsMobile as jest.Mock).mockReturnValue(false);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    render(
      <ResponsiveChart enableFullscreen={true}>
        <div>Test Chart</div>
      </ResponsiveChart>
    );
    
    expect(screen.queryByLabelText('Enter fullscreen')).not.toBeInTheDocument();
  });

  it('shows touch indicators on mobile', () => {
    (useIsMobile as jest.Mock).mockReturnValue(true);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    const { container } = render(
      <ResponsiveChart>
        <div>Test Chart</div>
      </ResponsiveChart>
    );
    
    const indicators = container.querySelectorAll('.bg-gray-300.rounded-full');
    expect(indicators).toHaveLength(3);
  });

  it('does not show touch indicators on desktop', () => {
    (useIsMobile as jest.Mock).mockReturnValue(false);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    const { container } = render(
      <ResponsiveChart>
        <div>Test Chart</div>
      </ResponsiveChart>
    );
    
    const indicators = container.querySelectorAll('.bg-gray-300.rounded-full');
    expect(indicators).toHaveLength(0);
  });

  it('applies custom className', () => {
    (useIsMobile as jest.Mock).mockReturnValue(false);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    const { container } = render(
      <ResponsiveChart className="custom-class">
        <div>Test Chart</div>
      </ResponsiveChart>
    );
    
    const chartContainer = container.firstChild as HTMLElement;
    expect(chartContainer).toHaveClass('custom-class');
  });

  it('respects minHeight and maxHeight props', () => {
    (useIsMobile as jest.Mock).mockReturnValue(false);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    const { container } = render(
      <ResponsiveChart minHeight={100} maxHeight={600}>
        <div>Test Chart</div>
      </ResponsiveChart>
    );
    
    const chartContainer = container.firstChild as HTMLElement;
    // Height should be within the specified range
    const height = parseInt(chartContainer.style.height);
    expect(height).toBeGreaterThanOrEqual(100);
    expect(height).toBeLessThanOrEqual(600);
  });
});