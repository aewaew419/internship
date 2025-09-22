import { render, screen, fireEvent } from '@testing-library/react';
import { DonutChart } from '../DonutChart/DonutChart';
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery';

// Mock the media query hooks
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(),
  useIsTablet: jest.fn(),
}));

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Doughnut: jest.fn(({ data, options, ref }) => (
    <div 
      data-testid="donut-chart"
      data-responsive={options.responsive}
      data-mobile={options.layout?.padding?.top === 10}
      ref={ref}
    >
      Mock Donut Chart
    </div>
  )),
}));

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: jest.fn(),
});

describe('DonutChart', () => {
  const mockData = {
    labels: ['Test 1', 'Test 2', 'Test 3'],
    datasets: [
      {
        data: [30, 40, 30],
        backgroundColor: ['#344BFD', '#F4A79D', '#F68D2B'],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default data when no data provided', () => {
    (useIsMobile as jest.Mock).mockReturnValue(false);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    render(<DonutChart />);
    
    expect(screen.getByTestId('donut-chart')).toBeInTheDocument();
  });

  it('renders with provided data', () => {
    (useIsMobile as jest.Mock).mockReturnValue(false);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    render(<DonutChart data={mockData} />);
    
    expect(screen.getByTestId('donut-chart')).toBeInTheDocument();
  });

  it('applies mobile-specific styling on mobile devices', () => {
    (useIsMobile as jest.Mock).mockReturnValue(true);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    render(<DonutChart data={mockData} />);
    
    const chart = screen.getByTestId('donut-chart');
    expect(chart).toHaveAttribute('data-mobile', 'true');
  });

  it('applies desktop styling on desktop devices', () => {
    (useIsMobile as jest.Mock).mockReturnValue(false);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    render(<DonutChart data={mockData} />);
    
    const chart = screen.getByTestId('donut-chart');
    expect(chart).toHaveAttribute('data-mobile', 'false');
  });

  it('enables touch manipulation on mobile', () => {
    (useIsMobile as jest.Mock).mockReturnValue(true);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    const { container } = render(<DonutChart data={mockData} enableTouch={true} />);
    
    const chartContainer = container.firstChild as HTMLElement;
    expect(chartContainer).toHaveClass('touch-manipulation');
    expect(chartContainer).toHaveStyle('touch-action: none');
  });

  it('disables touch manipulation when enableTouch is false', () => {
    (useIsMobile as jest.Mock).mockReturnValue(true);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    const { container } = render(<DonutChart data={mockData} enableTouch={false} />);
    
    const chartContainer = container.firstChild as HTMLElement;
    expect(chartContainer).toHaveStyle('touch-action: auto');
  });

  it('applies responsive options correctly', () => {
    (useIsMobile as jest.Mock).mockReturnValue(false);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    render(<DonutChart data={mockData} />);
    
    const chart = screen.getByTestId('donut-chart');
    expect(chart).toHaveAttribute('data-responsive', 'true');
  });

  it('applies custom className', () => {
    (useIsMobile as jest.Mock).mockReturnValue(false);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    const { container } = render(<DonutChart data={mockData} className="custom-class" />);
    
    const chartContainer = container.firstChild as HTMLElement;
    expect(chartContainer).toHaveClass('custom-class');
  });
});