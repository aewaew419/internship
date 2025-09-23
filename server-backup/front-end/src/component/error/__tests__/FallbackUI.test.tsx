import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FallbackUI, { TableSkeleton } from '../FallbackUI';
import { ErrorType } from '../../../utils/errorHandling';

describe('FallbackUI', () => {
  describe('TableSkeleton', () => {
    it('should render default number of skeleton rows', () => {
      render(<TableSkeleton />);
      
      // Should render skeleton elements (MUI Skeleton components)
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render custom number of skeleton rows', () => {
      render(<TableSkeleton rows={3} />);
      
      // Should render skeleton elements (MUI Skeleton components)
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('FallbackUI', () => {
    it('should render skeleton when showSkeleton is true', () => {
      render(<FallbackUI showSkeleton={true} />);
      
      expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument();
    });

    it('should render generic fallback when no error', () => {
      render(<FallbackUI />);
      
      expect(screen.getByText('ไม่พบข้อมูล')).toBeInTheDocument();
      expect(screen.getByText('ไม่มีข้อมูลให้แสดงในขณะนี้')).toBeInTheDocument();
    });

    it('should render custom title and description', () => {
      render(
        <FallbackUI 
          title="Custom Title" 
          description="Custom Description" 
        />
      );
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom Description')).toBeInTheDocument();
    });

    it('should render retry button when onRetry is provided', () => {
      const mockOnRetry = vi.fn();
      
      render(<FallbackUI onRetry={mockOnRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /ลองใหม่/ });
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('should render refresh button when onRefresh is provided', () => {
      const mockOnRefresh = vi.fn();
      
      render(<FallbackUI onRefresh={mockOnRefresh} />);
      
      const refreshButton = screen.getByRole('button', { name: /รีเฟรช/ });
      expect(refreshButton).toBeInTheDocument();
      
      fireEvent.click(refreshButton);
      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });

    it('should render error fallback when error is provided', () => {
      const mockError = {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network error',
        originalError: {},
        isRetryable: true,
        userMessage: 'ไม่สามารถเชื่อมต่อเครือข่ายได้'
      };
      
      render(<FallbackUI error={mockError} />);
      
      expect(screen.getAllByText('ไม่สามารถเชื่อมต่อเครือข่ายได้')).toHaveLength(2);
      expect(screen.getByText('เกิดข้อผิดพลาดในการโหลดข้อมูล')).toBeInTheDocument();
    });

    it('should show appropriate icon for network error', () => {
      const mockError = {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network error',
        originalError: {},
        isRetryable: true,
        userMessage: 'Network error message'
      };
      
      render(<FallbackUI error={mockError} />);
      
      // Should show WifiOff icon for network errors
      expect(screen.getByTestId('WifiOffIcon')).toBeInTheDocument();
    });

    it('should show appropriate icon for timeout error', () => {
      const mockError = {
        type: ErrorType.TIMEOUT_ERROR,
        message: 'Timeout error',
        originalError: {},
        isRetryable: true,
        userMessage: 'Timeout error message'
      };
      
      render(<FallbackUI error={mockError} />);
      
      // Should show CloudOff icon for timeout errors
      expect(screen.getByTestId('CloudOffIcon')).toBeInTheDocument();
    });

    it('should show appropriate icon for server error', () => {
      const mockError = {
        type: ErrorType.SERVER_ERROR,
        message: 'Server error',
        originalError: {},
        isRetryable: true,
        userMessage: 'Server error message'
      };
      
      render(<FallbackUI error={mockError} />);
      
      // Should show ErrorOutline icon for server errors (appears in both Alert and Card)
      expect(screen.getAllByTestId('ErrorOutlineIcon')).toHaveLength(2);
    });

    it('should show retry button only for retryable errors', () => {
      const retryableError = {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network error',
        originalError: {},
        isRetryable: true,
        userMessage: 'Network error message'
      };
      
      const nonRetryableError = {
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'Auth error',
        originalError: {},
        isRetryable: false,
        userMessage: 'Auth error message'
      };
      
      const mockOnRetry = vi.fn();
      
      // Test retryable error
      const { rerender } = render(
        <FallbackUI error={retryableError} onRetry={mockOnRetry} />
      );
      
      expect(screen.getAllByRole('button', { name: /ลองใหม่/ })).toHaveLength(2);
      
      // Test non-retryable error
      rerender(<FallbackUI error={nonRetryableError} onRetry={mockOnRetry} />);
      
      expect(screen.queryByRole('button', { name: /ลองใหม่/ })).not.toBeInTheDocument();
    });

    it('should show technical details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const mockError = {
        type: ErrorType.SERVER_ERROR,
        message: 'Server error',
        originalError: {},
        isRetryable: true,
        userMessage: 'Server error message',
        technicalMessage: 'Technical details here'
      };
      
      render(<FallbackUI error={mockError} />);
      
      expect(screen.getByText(/Technical: Technical details here/)).toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not show technical details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const mockError = {
        type: ErrorType.SERVER_ERROR,
        message: 'Server error',
        originalError: {},
        isRetryable: true,
        userMessage: 'Server error message',
        technicalMessage: 'Technical details here'
      };
      
      render(<FallbackUI error={mockError} />);
      
      expect(screen.queryByText(/Technical: Technical details here/)).not.toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should call both onRetry and onRefresh when both are provided', () => {
      const mockOnRetry = vi.fn();
      const mockOnRefresh = vi.fn();
      
      const mockError = {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network error',
        originalError: {},
        isRetryable: true,
        userMessage: 'Network error message'
      };
      
      render(
        <FallbackUI 
          error={mockError} 
          onRetry={mockOnRetry} 
          onRefresh={mockOnRefresh} 
        />
      );
      
      const retryButtons = screen.getAllByRole('button', { name: /ลองใหม่/ });
      const refreshButtons = screen.getAllByRole('button', { name: /รีเฟรช/ });
      
      fireEvent.click(retryButtons[0]);
      fireEvent.click(refreshButtons[0]);
      
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });
  });
});