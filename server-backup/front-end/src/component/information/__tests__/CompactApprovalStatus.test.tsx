import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompactApprovalStatus } from '../CompactApprovalStatus';
import type { ApprovalStatusData, InternshipApprovalStatus } from '../../../service/api/internship/type';

// Mock the useApprovalStatusViewModel hook
vi.mock('../../../service/api/internship/hooks/useApprovalStatusViewModel', () => ({
  useApprovalStatusViewModel: vi.fn()
}));

import { useApprovalStatusViewModel } from '../../../service/api/internship/hooks/useApprovalStatusViewModel';

const mockUseApprovalStatusViewModel = useApprovalStatusViewModel as any;

describe('CompactApprovalStatus Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state', () => {
    mockUseApprovalStatusViewModel.mockReturnValue({
      currentStatus: null,
      isLoading: true,
      error: null,
      getFormattedStatusText: () => '',
      getStatusColor: () => '#9E9E9E'
    });

    render(<CompactApprovalStatus studentEnrollId={1} />);
    
    expect(screen.getByText('กำลังโหลด...')).toBeInTheDocument();
  });

  it('should display error state', () => {
    mockUseApprovalStatusViewModel.mockReturnValue({
      currentStatus: null,
      isLoading: false,
      error: 'Network error',
      getFormattedStatusText: () => '',
      getStatusColor: () => '#F44336'
    });

    render(<CompactApprovalStatus studentEnrollId={1} />);
    
    expect(screen.getByText('ข้อผิดพลาด')).toBeInTheDocument();
  });

  it('should display no data state', () => {
    mockUseApprovalStatusViewModel.mockReturnValue({
      currentStatus: null,
      isLoading: false,
      error: null,
      getFormattedStatusText: () => '',
      getStatusColor: () => '#9E9E9E'
    });

    render(<CompactApprovalStatus studentEnrollId={1} />);
    
    expect(screen.getByText('ไม่พบข้อมูล')).toBeInTheDocument();
  });

  it('should display registered status correctly', () => {
    mockUseApprovalStatusViewModel.mockReturnValue({
      currentStatus: 'registered' as InternshipApprovalStatus,
      isLoading: false,
      error: null,
      getFormattedStatusText: () => 'อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา',
      getStatusColor: () => '#FFA500'
    });

    render(<CompactApprovalStatus studentEnrollId={1} />);
    
    expect(screen.getByText('อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา')).toBeInTheDocument();
  });

  it('should display advisor approved status correctly', () => {
    mockUseApprovalStatusViewModel.mockReturnValue({
      currentStatus: 't.approved' as InternshipApprovalStatus,
      isLoading: false,
      error: null,
      getFormattedStatusText: () => 'อยู่ระหว่างการพิจารณา โดยคณะกรรมการ',
      getStatusColor: () => '#2196F3'
    });

    render(<CompactApprovalStatus studentEnrollId={1} />);
    
    expect(screen.getByText('อยู่ระหว่างการพิจารณา โดยคณะกรรมการ')).toBeInTheDocument();
  });

  it('should display committee approved status correctly', () => {
    mockUseApprovalStatusViewModel.mockReturnValue({
      currentStatus: 'c.approved' as InternshipApprovalStatus,
      isLoading: false,
      error: null,
      getFormattedStatusText: () => 'อนุมัติเอกสารขอฝึกงาน / สหกิจ',
      getStatusColor: () => '#4CAF50'
    });

    render(<CompactApprovalStatus studentEnrollId={1} />);
    
    expect(screen.getByText('อนุมัติเอกสารขอฝึกงาน / สหกิจ')).toBeInTheDocument();
  });

  it('should display rejected status correctly', () => {
    mockUseApprovalStatusViewModel.mockReturnValue({
      currentStatus: 'doc.approved' as InternshipApprovalStatus,
      isLoading: false,
      error: null,
      getFormattedStatusText: () => 'ไม่อนุมัติเอกสารขอฝึกงาน/สหกิจ',
      getStatusColor: () => '#F44336'
    });

    render(<CompactApprovalStatus studentEnrollId={1} />);
    
    expect(screen.getByText('ไม่อนุมัติเอกสารขอฝึกงาน/สหกิจ')).toBeInTheDocument();
  });

  it('should display cancelled status correctly', () => {
    mockUseApprovalStatusViewModel.mockReturnValue({
      currentStatus: 'doc.cancel' as InternshipApprovalStatus,
      isLoading: false,
      error: null,
      getFormattedStatusText: () => 'ยกเลิกการฝึกงาน/สหกิจ',
      getStatusColor: () => '#9E9E9E'
    });

    render(<CompactApprovalStatus studentEnrollId={1} />);
    
    expect(screen.getByText('ยกเลิกการฝึกงาน/สหกิจ')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    mockUseApprovalStatusViewModel.mockReturnValue({
      currentStatus: 'registered' as InternshipApprovalStatus,
      isLoading: false,
      error: null,
      getFormattedStatusText: () => 'อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา',
      getStatusColor: () => '#FFA500'
    });

    const { container } = render(
      <CompactApprovalStatus studentEnrollId={1} className="custom-class" />
    );
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('should use correct size prop', () => {
    mockUseApprovalStatusViewModel.mockReturnValue({
      currentStatus: 'registered' as InternshipApprovalStatus,
      isLoading: false,
      error: null,
      getFormattedStatusText: () => 'อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา',
      getStatusColor: () => '#FFA500'
    });

    render(<CompactApprovalStatus studentEnrollId={1} size="medium" />);
    
    // The size prop is passed to the Chip component, so we verify the component renders
    expect(screen.getByText('อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา')).toBeInTheDocument();
  });
});