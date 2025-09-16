import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';
import React from 'react';

// Mock console.error to avoid noise in tests
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('เกิดข้อผิดพลาดในระบบ')).toBeInTheDocument();
    expect(screen.getByText(/ระบบไม่สามารถแสดงข้อมูลได้ในขณะนี้/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ลองใหม่/ })).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('เกิดข้อผิดพลาดในระบบ')).not.toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', () => {
    const mockOnRetry = vi.fn();

    render(
      <ErrorBoundary onRetry={mockOnRetry}>
        <ThrowError />
      </ErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: /ลองใหม่/ });
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('should reset error state when retry button is clicked', () => {
    const TestComponent: React.FC = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      return (
        <ErrorBoundary onRetry={() => setShouldThrow(false)}>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    };

    render(<TestComponent />);

    // Initially should show error
    expect(screen.getByText('เกิดข้อผิดพลาดในระบบ')).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /ลองใหม่/ });
    fireEvent.click(retryButton);

    // Should now show the component without error
    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(screen.queryByText('เกิดข้อผิดพลาดในระบบ')).not.toBeInTheDocument();
  });

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Test error/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should not show error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.queryByText(/Test error/)).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should log error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(mockConsoleError).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('should handle multiple error-retry cycles', () => {
    const TestComponent: React.FC = () => {
      const [errorCount, setErrorCount] = React.useState(0);

      return (
        <ErrorBoundary onRetry={() => setErrorCount(prev => prev + 1)}>
          <ThrowError shouldThrow={errorCount < 2} />
        </ErrorBoundary>
      );
    };

    render(<TestComponent />);

    // Initially should show error
    expect(screen.getByText('เกิดข้อผิดพลาดในระบบ')).toBeInTheDocument();

    // First retry - still error
    fireEvent.click(screen.getByRole('button', { name: /ลองใหม่/ }));
    expect(screen.getByText('เกิดข้อผิดพลาดในระบบ')).toBeInTheDocument();

    // Second retry - success
    fireEvent.click(screen.getByRole('button', { name: /ลองใหม่/ }));
    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});