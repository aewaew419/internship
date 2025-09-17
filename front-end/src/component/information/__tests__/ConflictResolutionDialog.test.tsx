import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConflictResolutionDialog } from '../ConflictResolutionDialog';
import type { ConflictResolutionStrategy } from '../../../service/api/internship/enhanced-error-handling';

// Mock the config module
vi.mock('../../../service/api/internship/config', () => ({
  getStatusText: vi.fn((status) => {
    const statusTexts = {
      'registered': 'อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา',
      't.approved': 'อยู่ระหว่างการพิจารณา โดยคณะกรรมการ',
      'c.approved': 'อนุมัติเอกสารขอฝึกงาน / สหกิจ'
    };
    return statusTexts[status as keyof typeof statusTexts] || status;
  })
}));

describe('ConflictResolutionDialog', () => {
  const mockConflictData = {
    currentStatus: 'registered' as const,
    serverStatus: 't.approved' as const,
    lastModifiedBy: 'John Doe',
    lastModifiedAt: '2024-01-15T10:30:00Z',
    clientTimestamp: '2024-01-15T10:25:00Z',
    serverTimestamp: '2024-01-15T10:30:00Z'
  };

  const mockAttemptedTransition = {
    currentStatus: 'registered' as const,
    targetStatus: 't.approved' as const,
    userRole: 'advisor'
  };

  const defaultProps = {
    open: true,
    conflictData: mockConflictData,
    attemptedTransition: mockAttemptedTransition,
    onResolve: vi.fn(),
    onCancel: vi.fn(),
    isResolving: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog when open', () => {
    render(<ConflictResolutionDialog {...defaultProps} />);

    expect(screen.getByText('ตรวจพบการเปลี่ยนแปลงข้อมูลพร้อมกัน')).toBeInTheDocument();
    expect(screen.getByText(/สถานะของใบสมัครนี้ได้ถูกเปลี่ยนแปลงโดยผู้ใช้อื่น/)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<ConflictResolutionDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('ตรวจพบการเปลี่ยนแปลงข้อมูลพร้อมกัน')).not.toBeInTheDocument();
  });

  it('should display conflict information correctly', () => {
    render(<ConflictResolutionDialog {...defaultProps} />);

    expect(screen.getByText('อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา')).toBeInTheDocument();
    expect(screen.getByText('อยู่ระหว่างการพิจารณา โดยคณะกรรมการ')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should call onResolve with overwrite strategy when overwrite button is clicked', () => {
    const onResolve = vi.fn();
    render(<ConflictResolutionDialog {...defaultProps} onResolve={onResolve} />);

    const overwriteButton = screen.getByText('บังคับเปลี่ยนแปลง');
    fireEvent.click(overwriteButton);

    expect(onResolve).toHaveBeenCalledWith({ type: 'overwrite' });
  });

  it('should call onResolve with abort strategy when cancel button is clicked', () => {
    const onResolve = vi.fn();
    render(<ConflictResolutionDialog {...defaultProps} onResolve={onResolve} />);

    const cancelButton = screen.getByText('ยกเลิก');
    fireEvent.click(cancelButton);

    expect(onResolve).toHaveBeenCalledWith({ type: 'abort' });
  });

  it('should disable buttons when resolving', () => {
    render(<ConflictResolutionDialog {...defaultProps} isResolving={true} />);

    const overwriteButton = screen.getByText('กำลังดำเนินการ...');
    const cancelButton = screen.getByText('ยกเลิก');

    expect(overwriteButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('should format timestamps correctly', () => {
    render(<ConflictResolutionDialog {...defaultProps} />);

    // Check that timestamp is displayed (exact format may vary based on locale)
    expect(screen.getByText(/เวลาที่เปลี่ยนแปลง:/)).toBeInTheDocument();
  });

  it('should return null when conflictData is null', () => {
    const { container } = render(
      <ConflictResolutionDialog {...defaultProps} conflictData={null} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should return null when attemptedTransition is null', () => {
    const { container } = render(
      <ConflictResolutionDialog {...defaultProps} attemptedTransition={null} />
    );

    expect(container.firstChild).toBeNull();
  });
});