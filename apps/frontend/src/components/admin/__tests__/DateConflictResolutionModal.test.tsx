import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DateConflictResolutionModal } from '../DateConflictResolutionModal';
import { DateConflict } from '@/lib/validation/dateValidation';

// Mock the AdminModal component
jest.mock('../AdminModal', () => ({
  AdminModal: ({ children, isOpen, title }: any) => 
    isOpen ? <div data-testid="admin-modal"><h1>{title}</h1>{children}</div> : null
}));

const mockConflicts: DateConflict[] = [
  {
    type: 'overlap',
    entity1: {
      id: 1,
      name: 'ภาคการศึกษาที่ 1/2567',
      type: 'semester',
      startDate: '2024-08-01',
      endDate: '2024-12-15'
    },
    entity2: {
      id: 2,
      name: 'ภาคการศึกษาที่ 2/2567',
      type: 'semester',
      startDate: '2024-12-01',
      endDate: '2025-04-15'
    },
    conflictDates: {
      startDate: '2024-12-01',
      endDate: '2024-12-15'
    },
    severity: 'error',
    message: 'ภาคการศึกษาซ้อนทับกัน',
    suggestions: ['ปรับวันที่เริ่มต้นหรือสิ้นสุด', 'ตรวจสอบปฏิทินการศึกษา']
  }
];

describe('DateConflictResolutionModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    conflicts: mockConflicts,
    onResolveConflict: jest.fn(),
    onResolveAll: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(<DateConflictResolutionModal {...defaultProps} />);
    
    expect(screen.getByTestId('admin-modal')).toBeInTheDocument();
    expect(screen.getByText('แก้ไขข้อขัดแย้งในปฏิทิน')).toBeInTheDocument();
  });

  it('displays conflict summary', () => {
    render(<DateConflictResolutionModal {...defaultProps} />);
    
    expect(screen.getByText('สรุปข้อขัดแย้ง')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Total conflicts
    expect(screen.getByText('ทั้งหมด')).toBeInTheDocument();
  });

  it('displays conflict details', () => {
    render(<DateConflictResolutionModal {...defaultProps} />);
    
    expect(screen.getByText('ภาคการศึกษาซ้อนทับกัน')).toBeInTheDocument();
    expect(screen.getByText('ภาคการศึกษาที่ 1/2567')).toBeInTheDocument();
    expect(screen.getByText('ภาคการศึกษาที่ 2/2567')).toBeInTheDocument();
  });

  it('shows resolution suggestions', () => {
    render(<DateConflictResolutionModal {...defaultProps} />);
    
    expect(screen.getByText('ปรับวันที่ให้ไม่ซ้อนทับ')).toBeInTheDocument();
    expect(screen.getByText('รวมกิจกรรมเป็นช่วงเดียวกัน')).toBeInTheDocument();
  });

  it('allows selecting resolution options', () => {
    render(<DateConflictResolutionModal {...defaultProps} />);
    
    const resolutionOption = screen.getByText('ปรับวันที่ให้ไม่ซ้อนทับ');
    fireEvent.click(resolutionOption);
    
    // Should show as selected (this would need more specific testing based on UI implementation)
    expect(resolutionOption).toBeInTheDocument();
  });

  it('calls onResolveAll when resolve all button is clicked', async () => {
    render(<DateConflictResolutionModal {...defaultProps} />);
    
    // First select a resolution
    const resolutionOption = screen.getByText('ปรับวันที่ให้ไม่ซ้อนทับ');
    fireEvent.click(resolutionOption);
    
    const resolveAllButton = screen.getByText('แก้ไขทั้งหมด');
    fireEvent.click(resolveAllButton);
    
    await waitFor(() => {
      expect(defaultProps.onResolveAll).toHaveBeenCalled();
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<DateConflictResolutionModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('ยกเลิก');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    render(<DateConflictResolutionModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByTestId('admin-modal')).not.toBeInTheDocument();
  });
});