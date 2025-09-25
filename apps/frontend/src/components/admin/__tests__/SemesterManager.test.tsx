import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SemesterManager } from '../SemesterManager';
import { Semester } from '@/lib/validation/dateValidation';

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
  },
  {
    id: 2,
    name: 'ภาคการศึกษาที่ 2/2567',
    academicYear: '2567',
    startDate: '2025-01-01',
    endDate: '2025-05-15',
    registrationStartDate: '2024-12-01',
    registrationEndDate: '2024-12-31',
    examStartDate: '2025-05-01',
    examEndDate: '2025-05-14',
    isActive: false,
  }
];

describe('SemesterManager', () => {
  const defaultProps = {
    semesters: mockSemesters,
    academicYear: '2567',
    onSemesterCreate: jest.fn(),
    onSemesterUpdate: jest.fn(),
    onSemesterDelete: jest.fn(),
    onSemesterActivate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders semester manager with semesters', () => {
    render(<SemesterManager {...defaultProps} />);
    
    expect(screen.getByText('จัดการภาคการศึกษา')).toBeInTheDocument();
    expect(screen.getByText('ปีการศึกษา 2567')).toBeInTheDocument();
    expect(screen.getByText('ภาคการศึกษาที่ 1/2567')).toBeInTheDocument();
    expect(screen.getByText('ภาคการศึกษาที่ 2/2567')).toBeInTheDocument();
  });

  it('shows create button', () => {
    render(<SemesterManager {...defaultProps} />);
    
    const createButton = screen.getByText('เพิ่มภาคการศึกษา');
    expect(createButton).toBeInTheDocument();
  });

  it('opens create modal when create button is clicked', () => {
    render(<SemesterManager {...defaultProps} />);
    
    const createButton = screen.getByText('เพิ่มภาคการศึกษา');
    fireEvent.click(createButton);
    
    expect(screen.getByTestId('admin-modal')).toBeInTheDocument();
    expect(screen.getByText('เพิ่มภาคการศึกษาใหม่')).toBeInTheDocument();
  });

  it('displays semester status indicators', () => {
    render(<SemesterManager {...defaultProps} />);
    
    expect(screen.getByText('เปิดใช้งาน')).toBeInTheDocument();
  });

  it('shows empty state when no semesters', () => {
    render(<SemesterManager {...defaultProps} semesters={[]} />);
    
    expect(screen.getByText('ยังไม่มีภาคการศึกษา')).toBeInTheDocument();
    expect(screen.getByText('เริ่มต้นด้วยการสร้างภาคการศึกษาแรกสำหรับปีการศึกษา 2567')).toBeInTheDocument();
  });

  it('filters semesters by academic year', () => {
    const semestersWithDifferentYears = [
      ...mockSemesters,
      {
        id: 3,
        name: 'ภาคการศึกษาที่ 1/2568',
        academicYear: '2568',
        startDate: '2025-08-01',
        endDate: '2025-12-15',
        registrationStartDate: '2025-07-01',
        registrationEndDate: '2025-07-31',
        examStartDate: '2025-12-01',
        examEndDate: '2025-12-14',
        isActive: false,
      }
    ];

    render(<SemesterManager {...defaultProps} semesters={semestersWithDifferentYears} />);
    
    // Should only show semesters for academic year 2567
    expect(screen.getByText('ภาคการศึกษาที่ 1/2567')).toBeInTheDocument();
    expect(screen.getByText('ภาคการศึกษาที่ 2/2567')).toBeInTheDocument();
    expect(screen.queryByText('ภาคการศึกษาที่ 1/2568')).not.toBeInTheDocument();
  });

  it('calls onSemesterActivate when activate button is clicked', async () => {
    render(<SemesterManager {...defaultProps} />);
    
    // Find the activate button for the inactive semester
    const semesterCards = screen.getAllByRole('button', { name: /เปิดใช้งาน/i });
    if (semesterCards.length > 0) {
      fireEvent.click(semesterCards[0]);
      
      await waitFor(() => {
        expect(defaultProps.onSemesterActivate).toHaveBeenCalled();
      });
    }
  });

  it('shows delete confirmation modal', async () => {
    render(<SemesterManager {...defaultProps} />);
    
    // Find and click delete button
    const deleteButtons = screen.getAllByTitle('ลบ');
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('ยืนยันการลบ')).toBeInTheDocument();
      });
    }
  });

  it('displays semester progress for current semester', () => {
    // Mock current date to be within semester period
    const mockDate = new Date('2024-10-01');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
    
    render(<SemesterManager {...defaultProps} />);
    
    // Should show progress bar for active semester
    expect(screen.getByText('ความคืบหน้า')).toBeInTheDocument();
    
    // Restore Date
    (global.Date as any).mockRestore();
  });
});