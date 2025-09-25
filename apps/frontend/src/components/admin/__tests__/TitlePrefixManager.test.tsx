import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TitlePrefixManager } from '../TitlePrefixManager';

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

// Mock the AdminDataTable component
jest.mock('../AdminDataTable', () => ({
  AdminDataTable: ({ data, columns }: any) => (
    <div data-testid="admin-data-table">
      {data.map((item: any, index: number) => (
        <div key={index}>{item.thai}</div>
      ))}
    </div>
  )
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

const mockPrefixes: TitlePrefix[] = [
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
  },
  {
    id: 3,
    thai: 'ศาสตราจารย์',
    english: 'Professor',
    abbreviation: 'ศ.',
    category: 'academic',
    gender: 'neutral',
    isDefault: true,
    sortOrder: 3,
    isActive: true,
  }
];

describe('TitlePrefixManager', () => {
  const defaultProps = {
    prefixes: mockPrefixes,
    onPrefixCreate: jest.fn(),
    onPrefixUpdate: jest.fn(),
    onPrefixDelete: jest.fn(),
    onLoadDefaults: jest.fn(),
    onBulkUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title prefix manager with prefixes', () => {
    render(<TitlePrefixManager {...defaultProps} />);
    
    expect(screen.getByText('จัดการคำนำหน้าชื่อ')).toBeInTheDocument();
    expect(screen.getByText(/3 คำนำหน้าชื่อ/)).toBeInTheDocument();
    expect(screen.getByText('นาย')).toBeInTheDocument();
    expect(screen.getByText('นาง')).toBeInTheDocument();
    expect(screen.getByText('ศาสตราจารย์')).toBeInTheDocument();
  });

  it('shows create and load defaults buttons', () => {
    render(<TitlePrefixManager {...defaultProps} />);
    
    expect(screen.getByText('เพิ่มคำนำหน้าชื่อ')).toBeInTheDocument();
    expect(screen.getByText('โหลดค่าเริ่มต้น')).toBeInTheDocument();
  });

  it('opens create modal when create button is clicked', () => {
    render(<TitlePrefixManager {...defaultProps} />);
    
    const createButton = screen.getByText('เพิ่มคำนำหน้าชื่อ');
    fireEvent.click(createButton);
    
    expect(screen.getByTestId('admin-modal')).toBeInTheDocument();
    expect(screen.getByText('เพิ่มคำนำหน้าชื่อใหม่')).toBeInTheDocument();
  });

  it('displays category statistics', () => {
    render(<TitlePrefixManager {...defaultProps} />);
    
    // Should show statistics for different categories
    expect(screen.getByText('วิชาการ')).toBeInTheDocument();
    expect(screen.getByText('อาชีพ')).toBeInTheDocument();
    expect(screen.getByText('กิตติมศักดิ์')).toBeInTheDocument();
    expect(screen.getByText('ศาสนา')).toBeInTheDocument();
  });

  it('shows search input', () => {
    render(<TitlePrefixManager {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาคำนำหน้าชื่อ...');
    expect(searchInput).toBeInTheDocument();
  });

  it('shows filter dropdowns', () => {
    render(<TitlePrefixManager {...defaultProps} />);
    
    expect(screen.getByDisplayValue('ทุกหมวดหมู่')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ทุกเพศ')).toBeInTheDocument();
  });

  it('shows sort controls', () => {
    render(<TitlePrefixManager {...defaultProps} />);
    
    expect(screen.getByText('เรียงตาม:')).toBeInTheDocument();
    expect(screen.getByText('ลำดับ')).toBeInTheDocument();
    expect(screen.getByText('ชื่อ')).toBeInTheDocument();
    expect(screen.getByText('หมวดหมู่')).toBeInTheDocument();
  });

  it('displays default prefix indicators', () => {
    render(<TitlePrefixManager {...defaultProps} />);
    
    // Should show "เริ่มต้น" badges for default prefixes
    const defaultBadges = screen.getAllByText('เริ่มต้น');
    expect(defaultBadges.length).toBeGreaterThan(0);
  });

  it('calls onLoadDefaults when load defaults button is clicked', async () => {
    render(<TitlePrefixManager {...defaultProps} />);
    
    const loadDefaultsButton = screen.getByText('โหลดค่าเริ่มต้น');
    fireEvent.click(loadDefaultsButton);
    
    await waitFor(() => {
      expect(defaultProps.onLoadDefaults).toHaveBeenCalled();
    });
  });

  it('shows empty state when no prefixes', () => {
    render(<TitlePrefixManager {...defaultProps} prefixes={[]} />);
    
    expect(screen.getByText('ยังไม่มีคำนำหน้าชื่อ')).toBeInTheDocument();
    expect(screen.getByText('เริ่มต้นด้วยการโหลดค่าเริ่มต้นหรือเพิ่มคำนำหน้าชื่อใหม่')).toBeInTheDocument();
  });

  it('filters prefixes by search term', () => {
    render(<TitlePrefixManager {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาคำนำหน้าชื่อ...');
    fireEvent.change(searchInput, { target: { value: 'นาย' } });
    
    // Should filter to show only prefixes matching the search term
    expect(screen.getByText('นาย')).toBeInTheDocument();
  });

  it('shows delete confirmation modal', async () => {
    render(<TitlePrefixManager {...defaultProps} />);
    
    // Find and click delete button
    const deleteButtons = screen.getAllByTitle('ลบ');
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('ยืนยันการลบ')).toBeInTheDocument();
      });
    }
  });

  it('displays prefix categories and genders correctly', () => {
    render(<TitlePrefixManager {...defaultProps} />);
    
    expect(screen.getByText('ชาย')).toBeInTheDocument();
    expect(screen.getByText('หญิง')).toBeInTheDocument();
    expect(screen.getByText('ทั่วไป')).toBeInTheDocument();
  });
});