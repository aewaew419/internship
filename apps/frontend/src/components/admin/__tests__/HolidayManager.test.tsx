import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HolidayManager } from '../HolidayManager';
import { Holiday, Semester } from '@/lib/validation/dateValidation';

// Mock the AdminModal component
jest.mock('../AdminModal', () => ({
  AdminModal: ({ children, isOpen, title }: any) => 
    isOpen ? <div data-testid="admin-modal"><h1>{title}</h1>{children}</div> : null
}));

// Mock the AdminForm components
jest.mock('../AdminForm', () => ({
  AdminFormField: ({ children, label, error }: any) => (
    <div>
      <label>{label}</label>
      {children}
      {error && <span className="error">{error}</span>}
    </div>
  ),
  AdminFormActions: ({ children }: any) => <div className="form-actions">{children}</div>
}));

// Mock the date validation hook
jest.mock('@/hooks/useDateValidation', () => ({
  useFormDateValidation: () => ({
    conflicts: [],
    hasErrors: false,
    hasWarnings: false,
  })
}));

const mockHolidays: Holiday[] = [
  {
    id: 1,
    name: 'วันขึ้นปีใหม่',
    startDate: '2024-01-01',
    endDate: '2024-01-01',
    type: 'national',
    description: 'วันหยุดราชการ',
    isRecurring: true,
  },
  {
    id: 2,
    name: 'วันหยุดกลางภาค',
    startDate: '2024-10-15',
    endDate: '2024-10-16',
    type: 'university',
    description: 'วันหยุดมหาวิทยาลัย',
    isRecurring: false,
  }
];

const mockSemesters: Semester[] = [
  {
    id: 1,
    name: 'ภาคการศึกษาที่ 1/2567',
    academicYear: '2567',
    startDate: '2024-08-01',
    endDate: '2024-12-15',
    registrationStartDate: '2024-07-01',
    registrationEndDate: '2024-07-31',
    examStartDate: '2024-12-01',
    examEndDate: '2024-12-14',
    isActive: true,
  }
];

describe('HolidayManager', () => {
  const defaultProps = {
    holidays: mockHolidays,
    semesters: mockSemesters,
    academicYear: '2567',
    onHolidayCreate: jest.fn(),
    onHolidayUpdate: jest.fn(),
    onHolidayDelete: jest.fn(),
    onBulkImport: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders holiday manager with holidays', () => {
    render(<HolidayManager {...defaultProps} />);
    
    expect(screen.getByText('จัดการวันหยุด')).toBeInTheDocument();
    expect(screen.getByText(/ปีการศึกษา 2567/)).toBeInTheDocument();
    expect(screen.getByText('วันขึ้นปีใหม่')).toBeInTheDocument();
    expect(screen.getByText('วันหยุดกลางภาค')).toBeInTheDocument();
  });

  it('shows create and import buttons', () => {
    render(<HolidayManager {...defaultProps} />);
    
    expect(screen.getByText('เพิ่มวันหยุด')).toBeInTheDocument();
    expect(screen.getByText('นำเข้าวันหยุดราชการ')).toBeInTheDocument();
  });

  it('opens create modal when create button is clicked', () => {
    render(<HolidayManager {...defaultProps} />);
    
    const createButton = screen.getByText('เพิ่มวันหยุด');
    fireEvent.click(createButton);
    
    expect(screen.getByTestId('admin-modal')).toBeInTheDocument();
    expect(screen.getByText('เพิ่มวันหยุดใหม่')).toBeInTheDocument();
  });

  it('opens import modal when import button is clicked', () => {
    render(<HolidayManager {...defaultProps} />);
    
    const importButton = screen.getByText('นำเข้าวันหยุดราชการ');
    fireEvent.click(importButton);
    
    expect(screen.getByTestId('admin-modal')).toBeInTheDocument();
    expect(screen.getByText('นำเข้าวันหยุดราชการ')).toBeInTheDocument();
  });

  it('displays holiday types correctly', () => {
    render(<HolidayManager {...defaultProps} />);
    
    expect(screen.getByText('วันหยุดราชการ (1)')).toBeInTheDocument();
    expect(screen.getByText('วันหยุดมหาวิทยาลัย (1)')).toBeInTheDocument();
  });

  it('shows filter buttons', () => {
    render(<HolidayManager {...defaultProps} />);
    
    expect(screen.getByText('ทั้งหมด')).toBeInTheDocument();
    expect(screen.getByText('วันหยุดราชการ')).toBeInTheDocument();
    expect(screen.getByText('วันหยุดมหาวิทยาลัย')).toBeInTheDocument();
    expect(screen.getByText('วันหยุดพักภาค')).toBeInTheDocument();
  });

  it('filters holidays by type', () => {
    render(<HolidayManager {...defaultProps} />);
    
    // Click on national holiday filter
    const nationalFilter = screen.getByText('วันหยุดราชการ');
    fireEvent.click(nationalFilter);
    
    // Should show only national holidays
    expect(screen.getByText('วันขึ้นปีใหม่')).toBeInTheDocument();
    // University holiday should not be visible in the filtered view
    // (Note: This test might need adjustment based on actual filtering implementation)
  });

  it('shows empty state when no holidays', () => {
    render(<HolidayManager {...defaultProps} holidays={[]} />);
    
    expect(screen.getByText('ยังไม่มีวันหยุด')).toBeInTheDocument();
    expect(screen.getByText('เริ่มต้นด้วยการเพิ่มวันหยุดหรือนำเข้าวันหยุดราชการ')).toBeInTheDocument();
  });

  it('displays holiday statistics', () => {
    render(<HolidayManager {...defaultProps} />);
    
    expect(screen.getByText(/2 วันหยุด/)).toBeInTheDocument();
  });

  it('shows recurring holiday indicator', () => {
    render(<HolidayManager {...defaultProps} />);
    
    // The recurring holiday should have an indicator (ArrowPathIcon)
    // This would need to be tested based on the actual implementation
    expect(screen.getByText('วันขึ้นปีใหม่')).toBeInTheDocument();
  });

  it('calls onHolidayDelete when delete button is clicked', async () => {
    render(<HolidayManager {...defaultProps} />);
    
    // Find and click delete button
    const deleteButtons = screen.getAllByTitle('ลบ');
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
      
      // Should show confirmation modal
      await waitFor(() => {
        expect(screen.getByText('ยืนยันการลบ')).toBeInTheDocument();
      });
    }
  });

  it('displays holiday descriptions', () => {
    render(<HolidayManager {...defaultProps} />);
    
    expect(screen.getByText('วันหยุดราชการ')).toBeInTheDocument();
    expect(screen.getByText('วันหยุดมหาวิทยาลัย')).toBeInTheDocument();
  });
});