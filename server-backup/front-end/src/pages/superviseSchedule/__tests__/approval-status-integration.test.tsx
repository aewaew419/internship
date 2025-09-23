import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import SupervisorSchedule from '../index';

// Mock the viewModel
vi.mock('../viewModel', () => ({
  default: vi.fn()
}));

// Mock the CompactApprovalStatus component
vi.mock('../../../component/information/CompactApprovalStatus', () => ({
  CompactApprovalStatus: ({ studentEnrollId, size }: any) => (
    <div data-testid={`compact-approval-status-${studentEnrollId}`}>
      <span>Mock Compact Status</span>
      <span data-testid="size">{size}</span>
    </div>
  )
}));

// Mock other components
vi.mock('../../../component/layout', () => ({
  Layout: ({ children }: any) => <div data-testid="layout">{children}</div>
}));

vi.mock('../../../component/table', () => ({
  Table: ({ header, data }: any) => (
    <div data-testid="table">
      <div data-testid="table-header">
        {header.map((h: string, i: number) => (
          <span key={i} data-testid={`header-${i}`}>{h}</span>
        ))}
      </div>
      <div data-testid="table-data">
        {data}
      </div>
    </div>
  )
}));

vi.mock('../../../component/error', () => ({
  ErrorBoundary: ({ children }: any) => <div data-testid="error-boundary">{children}</div>,
  FallbackUI: () => <div data-testid="fallback-ui">Fallback UI</div>,
  TableSkeleton: () => <div data-testid="table-skeleton">Loading...</div>
}));

vi.mock('../../../component/information/DataStalenessIndicator', () => ({
  DataStalenessIndicator: () => <div data-testid="staleness-indicator">Staleness Indicator</div>
}));

import useSuperviseScheduleViewModel from '../viewModel';

const mockUseSuperviseScheduleViewModel = useSuperviseScheduleViewModel as any;

const mockVisitors = [
  {
    id: 1,
    studentEnrollId: 101,
    studentName: 'นาย ทดสอบ หนึ่ง',
    studentCode: '6501001',
    companyName: 'บริษัท ทดสอบ จำกัด',
    contactName: 'คุณ ติดต่อ หนึ่ง',
    supervisorName: 'อาจารย์ นิเทศ หนึ่ง',
    appointmentStatus: 'นัดหมายแล้ว',
    appointmentCount: 2
  },
  {
    id: 2,
    studentEnrollId: 102,
    studentName: 'นางสาว ทดสอบ สอง',
    studentCode: '6501002',
    companyName: 'บริษัท ทดสอบ สอง จำกัด',
    contactName: 'คุณ ติดต่อ สอง',
    supervisorName: 'อาจารย์ นิเทศ สอง',
    appointmentStatus: 'ยังไม่นัดหมาย',
    appointmentCount: 0
  }
];

describe('SupervisorSchedule Integration with CompactApprovalStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSuperviseScheduleViewModel.mockReturnValue({
      filteredVisitors: mockVisitors,
      loading: false,
      error: null,
      enhancedError: null,
      filters: { search: '', position: '', major: '' },
      applyFilters: vi.fn(),
      refreshData: vi.fn(),
      clearError: vi.fn(),
      retryFetch: vi.fn(),
      hasData: true,
      totalCount: 2,
      retryCount: 0,
      isRetrying: false,
      stalenessInfo: null,
      isAutoRefreshing: false,
      triggerManualRefresh: vi.fn(),
      toggleAutoRefresh: vi.fn(),
      isSyncing: false,
      syncStatus: 'idle',
      connectionStatus: 'connected',
      lastSyncTime: null,
      forceSynchronization: vi.fn(),
      updateRefreshInterval: vi.fn()
    });
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('should include approval status column in table header', async () => {
    renderWithRouter(<SupervisorSchedule />);

    await waitFor(() => {
      expect(screen.getByTestId('header-5')).toHaveTextContent('สถานะอนุมัติ');
    });
  });

  it('should render compact approval status for each visitor', async () => {
    renderWithRouter(<SupervisorSchedule />);

    await waitFor(() => {
      expect(screen.getByTestId('compact-approval-status-101')).toBeInTheDocument();
      expect(screen.getByTestId('compact-approval-status-102')).toBeInTheDocument();
    });
  });

  it('should pass correct props to CompactApprovalStatus', async () => {
    renderWithRouter(<SupervisorSchedule />);

    await waitFor(() => {
      const firstStatus = screen.getByTestId('compact-approval-status-101');
      expect(firstStatus.querySelector('[data-testid="size"]')).toHaveTextContent('small');

      const secondStatus = screen.getByTestId('compact-approval-status-102');
      expect(secondStatus.querySelector('[data-testid="size"]')).toHaveTextContent('small');
    });
  });

  it('should maintain correct table structure with approval status column', async () => {
    renderWithRouter(<SupervisorSchedule />);

    await waitFor(() => {
      // Check all expected headers are present
      const expectedHeaders = [
        'ชื่อ',
        'รหัส', 
        'ชื่อบริษัท',
        'ผู้ติดต่อ',
        'อาจารย์นิเทศ',
        'สถานะอนุมัติ',
        'นัดหมาย',
        'ข้อมูลเพิ่มเติม'
      ];

      expectedHeaders.forEach((header, index) => {
        expect(screen.getByTestId(`header-${index}`)).toHaveTextContent(header);
      });
    });
  });

  it('should handle visitors without studentEnrollId gracefully', async () => {
    const visitorsWithoutEnrollId = [
      {
        ...mockVisitors[0],
        studentEnrollId: undefined
      }
    ];

    mockUseSuperviseScheduleViewModel.mockReturnValue({
      ...mockUseSuperviseScheduleViewModel(),
      filteredVisitors: visitorsWithoutEnrollId
    });

    renderWithRouter(<SupervisorSchedule />);

    await waitFor(() => {
      // Should fallback to using visitor.id
      expect(screen.getByTestId('compact-approval-status-1')).toBeInTheDocument();
    });
  });

  it('should maintain existing appointment status display', async () => {
    renderWithRouter(<SupervisorSchedule />);

    await waitFor(() => {
      expect(screen.getByText('นัดหมายแล้ว 2 ครั้ง')).toBeInTheDocument();
      expect(screen.getByText('ยังไม่นัดหมาย')).toBeInTheDocument();
    });
  });

  it('should handle loading state correctly', async () => {
    mockUseSuperviseScheduleViewModel.mockReturnValue({
      ...mockUseSuperviseScheduleViewModel(),
      loading: true,
      hasData: false
    });

    renderWithRouter(<SupervisorSchedule />);

    await waitFor(() => {
      expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    });
  });

  it('should handle error state correctly', async () => {
    mockUseSuperviseScheduleViewModel.mockReturnValue({
      ...mockUseSuperviseScheduleViewModel(),
      loading: false,
      hasData: false,
      error: 'Network error',
      enhancedError: {
        type: 'NETWORK_ERROR',
        isRetryable: true
      }
    });

    renderWithRouter(<SupervisorSchedule />);

    await waitFor(() => {
      expect(screen.getByTestId('fallback-ui')).toBeInTheDocument();
    });
  });
});