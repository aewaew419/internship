/**
 * Integration test for responsive chart components
 * This test verifies that the components work together correctly
 */

import { render, screen } from '@testing-library/react';
import { DonutChart, ResponsiveChart } from '../index';
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery';

// Mock the media query hooks
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(),
  useIsTablet: jest.fn(),
}));

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Doughnut: jest.fn(() => <div data-testid="chart-canvas">Mock Chart</div>),
}));

describe('Responsive Chart Integration', () => {
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

  it('renders DonutChart inside ResponsiveChart container', () => {
    (useIsMobile as jest.Mock).mockReturnValue(false);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    render(
      <ResponsiveChart>
        <DonutChart data={mockData} />
      </ResponsiveChart>
    );

    expect(screen.getByTestId('chart-canvas')).toBeInTheDocument();
  });

  it('applies mobile optimizations when on mobile device', () => {
    (useIsMobile as jest.Mock).mockReturnValue(true);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    const { container } = render(
      <ResponsiveChart enableFullscreen={true}>
        <DonutChart data={mockData} enableTouch={true} />
      </ResponsiveChart>
    );

    // Should show fullscreen button on mobile
    expect(screen.getByLabelText('Enter fullscreen')).toBeInTheDocument();
    
    // Should show touch indicators
    const indicators = container.querySelectorAll('.bg-gray-300.rounded-full');
    expect(indicators.length).toBeGreaterThan(0);
  });

  it('exports components correctly from index', () => {
    expect(DonutChart).toBeDefined();
    expect(ResponsiveChart).toBeDefined();
  });

  it('handles responsive sizing correctly', () => {
    (useIsMobile as jest.Mock).mockReturnValue(true);
    (useIsTablet as jest.Mock).mockReturnValue(false);

    const { container } = render(
      <ResponsiveChart minHeight={150} maxHeight={300}>
        <DonutChart data={mockData} />
      </ResponsiveChart>
    );

    const chartContainer = container.firstChild as HTMLElement;
    expect(chartContainer.style.maxWidth).toBe('280px'); // Mobile max width
  });
});