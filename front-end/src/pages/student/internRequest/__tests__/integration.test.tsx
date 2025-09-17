import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import InternRequest from '../index';
import type { ApprovalStatusData, InternshipApprovalStatus } from '../../../../service/api/internship/type';

// Mock the viewModel
vi.mock('../viewModel', () => ({
  default: vi.fn()
}));

// Mock the ApprovalStatusDisplay component
vi.mock('../../../../component/information/ApprovalStatusDisplay', () => ({
  ApprovalStatusDisplay: ({ studentEnrollId, showTimestamp, showRefreshButton, compact }: any) => (
    <div data-testid={`approval-status-${studentEnrollId}`}>
      <span>Mock Approval Status</span>
      <span data-testid="show-timestamp">{showTimestamp ? 'with-timestamp' : 'no-timestamp'}</span>
      <span data-testid="show-refresh">{showRefreshButton ? 'with-refresh' : 'no-refresh'}</span>
      <span data-testid="compact">{compact ? 'compact' : 'full'}</span>
    </div>
  )
}));

// Mock the Layout component
vi.mock('../../../../component/layout', () => ({
  Layout: ({ children }: any) => <div data-testid="layout">{children}</div>
}));

import useViewModel from '../viewModel';

const mockUseViewModel = useViewModel as any;

const mockStudentEnrollments = [
  {
    id: 1,
    course_section: {
      course: {
        courseNameTh: 'สหกิจศึกษา'
      },
      year: 2567,
      semester: 1
    }
  },
  {
    id: 2,
    course_section: {
      course: {
        courseNameTh: 'ฝึกงาน'
      },
      year: 2567,
      semester: 2
    }
  }
];

describe('InternRequest Integration with ApprovalStatusDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseViewModel.mockReturnValue({
      studentEnrollments: mockStudentEnrollments
    });
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('should render approval status for each student enrollment', async () => {
    renderWithRouter(<InternRequest />);

    await waitFor(() => {
      expect(screen.getByTestId('approval-status-1')).toBeInTheDocument();
      expect(screen.getByTestId('approval-status-2')).toBeInTheDocument();
    });
  });

  it('should pass correct props to ApprovalStatusDisplay', async () => {
    renderWithRouter(<InternRequest />);

    await waitFor(() => {
      // Check first enrollment
      const firstStatus = screen.getByTestId('approval-status-1');
      expect(firstStatus.querySelector('[data-testid="show-timestamp"]')).toHaveTextContent('with-timestamp');
      expect(firstStatus.querySelector('[data-testid="show-refresh"]')).toHaveTextContent('with-refresh');
      expect(firstStatus.querySelector('[data-testid="compact"]')).toHaveTextContent('full');

      // Check second enrollment
      const secondStatus = screen.getByTestId('approval-status-2');
      expect(secondStatus.querySelector('[data-testid="show-timestamp"]')).toHaveTextContent('with-timestamp');
      expect(secondStatus.querySelector('[data-testid="show-refresh"]')).toHaveTextContent('with-refresh');
      expect(secondStatus.querySelector('[data-testid="compact"]')).toHaveTextContent('full');
    });
  });

  it('should display course information alongside approval status', async () => {
    renderWithRouter(<InternRequest />);

    await waitFor(() => {
      expect(screen.getByText('สหกิจศึกษา')).toBeInTheDocument();
      expect(screen.getByText('ฝึกงาน')).toBeInTheDocument();
      expect(screen.getByText('ปีการศึกษา: 3110')).toBeInTheDocument(); // 2567 + 543
      expect(screen.getByText('เทอม: 1')).toBeInTheDocument();
      expect(screen.getByText('เทอม: 2')).toBeInTheDocument();
    });
  });

  it('should maintain existing functionality with edit buttons', async () => {
    renderWithRouter(<InternRequest />);

    await waitFor(() => {
      const editButtons = screen.getAllByText('แก้ไขข้อมูล');
      expect(editButtons).toHaveLength(2);
    });
  });

  it('should handle empty student enrollments gracefully', async () => {
    mockUseViewModel.mockReturnValue({
      studentEnrollments: []
    });

    renderWithRouter(<InternRequest />);

    await waitFor(() => {
      expect(screen.queryByTestId(/approval-status-/)).not.toBeInTheDocument();
    });
  });

  it('should apply proper styling classes for layout', async () => {
    renderWithRouter(<InternRequest />);

    await waitFor(() => {
      const enrollmentCards = screen.getAllByText('สหกิจศึกษา').map(el => 
        el.closest('.flex.gap-5.my-3.p-4.border.border-gray-200.rounded-lg')
      );
      expect(enrollmentCards[0]).toBeInTheDocument();
    });
  });
});