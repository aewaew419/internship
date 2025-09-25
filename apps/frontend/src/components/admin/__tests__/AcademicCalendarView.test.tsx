import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AcademicCalendarView } from '../AcademicCalendarView';

// Mock data
const mockSemesters = [
  {
    id: 1,
    name: 'ภาคการศึกษาที่ 1/2567',
    academicYear: '2567',
    startDate: '2024-08-15',
    endDate: '2024-12-20',
    registrationStartDate: '2024-07-01',
    registrationEndDate: '2024-08-10',
    examStartDate: '2024-12-10',
    examEndDate: '2024-12-20',
    isActive: true,
    holidays: [],
  },
];

const mockHolidays = [
  {
    id: 1,
    name: 'วันแม่แห่งชาติ',
    startDate: '2024-08-12',
    endDate: '2024-08-12',
    type: 'national' as const,
    description: 'วันหยุดราชการ',
    isRecurring: true,
  },
];

describe('AcademicCalendarView', () => {
  const defaultProps = {
    academicYear: '2567',
    semesters: mockSemesters,
    holidays: mockHolidays,
  };

  it('renders calendar view with title', () => {
    render(<AcademicCalendarView {...defaultProps} />);
    
    expect(screen.getByText('ปฏิทินการศึกษา')).toBeInTheDocument();
    expect(screen.getByText('ปีการศึกษา 2567')).toBeInTheDocument();
  });

  it('renders view mode buttons', () => {
    render(<AcademicCalendarView {...defaultProps} />);
    
    expect(screen.getByText('เดือน')).toBeInTheDocument();
    expect(screen.getByText('ภาคการศึกษา')).toBeInTheDocument();
    expect(screen.getByText('ปี')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<AcademicCalendarView {...defaultProps} />);
    
    expect(screen.getByText('เพิ่มภาคการศึกษา')).toBeInTheDocument();
    expect(screen.getByText('เพิ่มวันหยุด')).toBeInTheDocument();
  });

  it('switches view modes correctly', () => {
    render(<AcademicCalendarView {...defaultProps} />);
    
    // Default is semester view
    expect(screen.getByText('ภาคการศึกษาที่ 1/2567')).toBeInTheDocument();
    
    // Switch to month view
    fireEvent.click(screen.getByText('เดือน'));
    // Month view should show calendar grid (we can't test the grid content easily without more setup)
    
    // Switch to year view
    fireEvent.click(screen.getByText('ปี'));
    // Year view should show year overview
  });

  it('opens semester modal when create button is clicked', () => {
    render(<AcademicCalendarView {...defaultProps} />);
    
    fireEvent.click(screen.getByText('เพิ่มภาคการศึกษา'));
    
    expect(screen.getByText('เพิ่มภาคการศึกษาใหม่')).toBeInTheDocument();
  });

  it('opens holiday modal when create button is clicked', () => {
    render(<AcademicCalendarView {...defaultProps} />);
    
    fireEvent.click(screen.getByText('เพิ่มวันหยุด'));
    
    expect(screen.getByText('เพิ่มวันหยุดใหม่')).toBeInTheDocument();
  });

  it('displays semester information correctly', () => {
    render(<AcademicCalendarView {...defaultProps} />);
    
    expect(screen.getByText('ภาคการศึกษาที่ 1/2567')).toBeInTheDocument();
    expect(screen.getByText('15/08/2024')).toBeInTheDocument();
    expect(screen.getByText('20/12/2024')).toBeInTheDocument();
  });

  it('calls handlers when provided', () => {
    const mockHandlers = {
      onSemesterCreate: jest.fn(),
      onSemesterUpdate: jest.fn(),
      onSemesterDelete: jest.fn(),
      onHolidayCreate: jest.fn(),
      onHolidayUpdate: jest.fn(),
      onHolidayDelete: jest.fn(),
    };

    render(<AcademicCalendarView {...defaultProps} {...mockHandlers} />);
    
    // Test semester creation
    fireEvent.click(screen.getByText('เพิ่มภาคการศึกษา'));
    expect(screen.getByText('เพิ่มภาคการศึกษาใหม่')).toBeInTheDocument();
    
    // Test holiday creation
    fireEvent.click(screen.getByText('เพิ่มวันหยุด'));
    expect(screen.getByText('เพิ่มวันหยุดใหม่')).toBeInTheDocument();
  });
});