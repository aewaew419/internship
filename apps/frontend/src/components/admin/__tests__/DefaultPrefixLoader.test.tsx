import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DefaultPrefixLoader } from '../DefaultPrefixLoader';

// Mock the AdminModal component
jest.mock('../AdminModal', () => ({
  AdminModal: ({ children, isOpen, title }: any) => 
    isOpen ? <div data-testid="admin-modal"><h1>{title}</h1>{children}</div> : null
}));

interface TitlePrefix {
  id?: number;
  thai: string;
  english: string;
  abbreviation: string;
  category: 'academic' | 'professional' | 'honorary' | 'religious';
  gender: 'male' | 'female' | 'neutral';
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
}

const mockExistingPrefixes: TitlePrefix[] = [
  {
    id: 1,
    thai: 'นาย',
    english: 'Mr.',
    abbreviation: 'นาย',
    category: 'professional',
    gender: 'male',
    isDefault: true,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 2,
    thai: 'นาง',
    english: 'Mrs.',
    abbreviation: 'นาง',
    category: 'professional',
    gender: 'female',
    isDefault: true,
    sortOrder: 2,
    isActive: true,
  }
];

describe('DefaultPrefixLoader', () => {
  const defaultProps = {
    existingPrefixes: mockExistingPrefixes,
    onLoadDefaults: jest.fn(),
    onPreviewDefaults: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders load defaults button', () => {
    render(<DefaultPrefixLoader {...defaultProps} />);
    
    expect(screen.getByText('โหลดค่าเริ่มต้น')).toBeInTheDocument();
  });

  it('opens modal when button is clicked', () => {
    render(<DefaultPrefixLoader {...defaultProps} />);
    
    const loadButton = screen.getByText('โหลดค่าเริ่มต้น');
    fireEvent.click(loadButton);
    
    expect(screen.getByTestId('admin-modal')).toBeInTheDocument();
    expect(screen.getByText('โหลดคำนำหน้าชื่อเริ่มต้น')).toBeInTheDocument();
  });

  it('displays template options in modal', () => {
    render(<DefaultPrefixLoader {...defaultProps} />);
    
    const loadButton = screen.getByText('โหลดค่าเริ่มต้น');
    fireEvent.click(loadButton);
    
    expect(screen.getByText('สถาบันการศึกษา')).toBeInTheDocument();
    expect(screen.getByText('หน่วยงานราชการ')).toBeInTheDocument();
    expect(screen.getByText('องค์กรเอกชน')).toBeInTheDocument();
    expect(screen.getByText('ครบถ้วนสมบูรณ์')).toBeInTheDocument();
  });

  it('shows template descriptions', () => {
    render(<DefaultPrefixLoader {...defaultProps} />);
    
    const loadButton = screen.getByText('โหลดค่าเริ่มต้น');
    fireEvent.click(loadButton);
    
    expect(screen.getByText(/คำนำหน้าชื่อสำหรับสถาบันการศึกษา/)).toBeInTheDocument();
    expect(screen.getByText(/คำนำหน้าชื่อสำหรับหน่วยงานราชการ/)).toBeInTheDocument();
  });

  it('displays statistics for each template', () => {
    render(<DefaultPrefixLoader {...defaultProps} />);
    
    const loadButton = screen.getByText('โหลดค่าเริ่มต้น');
    fireEvent.click(loadButton);
    
    // Should show counts for total, new, and duplicate prefixes
    expect(screen.getAllByText('ทั้งหมด')).toHaveLength(4); // One for each template
    expect(screen.getAllByText('ใหม่')).toHaveLength(4);
    expect(screen.getAllByText('ซ้ำ')).toHaveLength(4);
  });

  it('shows preview when template is selected', async () => {
    render(<DefaultPrefixLoader {...defaultProps} />);
    
    const loadButton = screen.getByText('โหลดค่าเริ่มต้น');
    fireEvent.click(loadButton);
    
    // Click on academic template
    const academicTemplate = screen.getByText('สถาบันการศึกษา');
    fireEvent.click(academicTemplate);
    
    await waitFor(() => {
      expect(screen.getByText(/ตัวอย่าง: สถาบันการศึกษา/)).toBeInTheDocument();
    });
  });

  it('calls onPreviewDefaults when template is selected', async () => {
    render(<DefaultPrefixLoader {...defaultProps} />);
    
    const loadButton = screen.getByText('โหลดค่าเริ่มต้น');
    fireEvent.click(loadButton);
    
    const academicTemplate = screen.getByText('สถาบันการศึกษา');
    fireEvent.click(academicTemplate);
    
    await waitFor(() => {
      expect(defaultProps.onPreviewDefaults).toHaveBeenCalled();
    });
  });

  it('shows back button in preview mode', async () => {
    render(<DefaultPrefixLoader {...defaultProps} />);
    
    const loadButton = screen.getByText('โหลดค่าเริ่มต้น');
    fireEvent.click(loadButton);
    
    const academicTemplate = screen.getByText('สถาบันการศึกษา');
    fireEvent.click(academicTemplate);
    
    await waitFor(() => {
      expect(screen.getByText('← กลับ')).toBeInTheDocument();
    });
  });

  it('calls onLoadDefaults when confirmed', async () => {
    render(<DefaultPrefixLoader {...defaultProps} />);
    
    const loadButton = screen.getByText('โหลดค่าเริ่มต้น');
    fireEvent.click(loadButton);
    
    const academicTemplate = screen.getByText('สถาบันการศึกษา');
    fireEvent.click(academicTemplate);
    
    await waitFor(() => {
      const confirmButton = screen.getByText('โหลดคำนำหน้าชื่อ');
      fireEvent.click(confirmButton);
    });
    
    await waitFor(() => {
      expect(defaultProps.onLoadDefaults).toHaveBeenCalled();
    });
  });

  it('shows information about duplicate handling', () => {
    render(<DefaultPrefixLoader {...defaultProps} />);
    
    const loadButton = screen.getByText('โหลดค่าเริ่มต้น');
    fireEvent.click(loadButton);
    
    expect(screen.getByText(/คำนำหน้าชื่อที่มีอยู่แล้วจะไม่ถูกเพิ่มซ้ำ/)).toBeInTheDocument();
    expect(screen.getByText(/คุณสามารถแก้ไขคำนำหน้าชื่อได้หลังจากโหลดเสร็จ/)).toBeInTheDocument();
  });

  it('closes modal when cancel is clicked', () => {
    render(<DefaultPrefixLoader {...defaultProps} />);
    
    const loadButton = screen.getByText('โหลดค่าเริ่มต้น');
    fireEvent.click(loadButton);
    
    const cancelButton = screen.getByText('ยกเลิก');
    fireEvent.click(cancelButton);
    
    expect(screen.queryByTestId('admin-modal')).not.toBeInTheDocument();
  });

  it('shows loading state during confirmation', async () => {
    // Mock a delayed response
    const mockOnLoadDefaults = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<DefaultPrefixLoader {...defaultProps} onLoadDefaults={mockOnLoadDefaults} />);
    
    const loadButton = screen.getByText('โหลดค่าเริ่มต้น');
    fireEvent.click(loadButton);
    
    const academicTemplate = screen.getByText('สถาบันการศึกษา');
    fireEvent.click(academicTemplate);
    
    await waitFor(() => {
      const confirmButton = screen.getByText('โหลดคำนำหน้าชื่อ');
      fireEvent.click(confirmButton);
    });
    
    expect(screen.getByText('กำลังโหลดคำนำหน้าชื่อ')).toBeInTheDocument();
    expect(screen.getByText('กรุณารอสักครู่...')).toBeInTheDocument();
  });
});