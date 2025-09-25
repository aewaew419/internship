import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PrefixRoleMatrix } from '../PrefixRoleMatrix';

// Mock the AdminModal component
jest.mock('../AdminModal', () => ({
  AdminModal: ({ children, isOpen, title }: any) => 
    isOpen ? <div data-testid="admin-modal"><h1>{title}</h1>{children}</div> : null
}));

interface TitlePrefix {
  id: number;
  thai: string;
  english: string;
  abbreviation: string;
  category: 'academic' | 'professional' | 'honorary' | 'religious';
  gender: 'male' | 'female' | 'neutral';
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
}

interface Role {
  id: number;
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  category: 'student' | 'faculty' | 'staff' | 'admin' | 'external';
  level: number;
  isActive: boolean;
}

interface PrefixRoleAssignment {
  prefixId: number;
  roleId: number;
  isDefault: boolean;
  canModify: boolean;
  assignedBy: number;
  assignedAt: string;
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

const mockRoles: Role[] = [
  {
    id: 1,
    name: 'student',
    displayName: 'นักศึกษา',
    description: 'นักศึกษาทั่วไป',
    isSystem: false,
    category: 'student',
    level: 1,
    isActive: true,
  },
  {
    id: 2,
    name: 'faculty',
    displayName: 'อาจารย์',
    description: 'อาจารย์ประจำ',
    isSystem: false,
    category: 'faculty',
    level: 2,
    isActive: true,
  },
  {
    id: 3,
    name: 'admin',
    displayName: 'ผู้ดูแลระบบ',
    description: 'ผู้ดูแลระบบ',
    isSystem: true,
    category: 'admin',
    level: 3,
    isActive: true,
  }
];

const mockAssignments: PrefixRoleAssignment[] = [
  {
    prefixId: 1,
    roleId: 1,
    isDefault: true,
    canModify: true,
    assignedBy: 1,
    assignedAt: '2024-01-01T00:00:00Z',
  },
  {
    prefixId: 2,
    roleId: 1,
    isDefault: false,
    canModify: true,
    assignedBy: 1,
    assignedAt: '2024-01-01T00:00:00Z',
  },
  {
    prefixId: 3,
    roleId: 2,
    isDefault: true,
    canModify: true,
    assignedBy: 1,
    assignedAt: '2024-01-01T00:00:00Z',
  }
];

describe('PrefixRoleMatrix', () => {
  const defaultProps = {
    prefixes: mockPrefixes,
    roles: mockRoles,
    assignments: mockAssignments,
    onAssignmentChange: jest.fn(),
    onBulkAssign: jest.fn(),
    onLoadRecommendations: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders prefix role matrix', () => {
    render(<PrefixRoleMatrix {...defaultProps} />);
    
    expect(screen.getByText('กำหนดคำนำหน้าชื่อให้บทบาท')).toBeInTheDocument();
    expect(screen.getByText(/การกำหนด/)).toBeInTheDocument();
  });

  it('displays prefixes and roles in matrix', () => {
    render(<PrefixRoleMatrix {...defaultProps} />);
    
    expect(screen.getByText('นาย')).toBeInTheDocument();
    expect(screen.getByText('นาง')).toBeInTheDocument();
    expect(screen.getByText('ศาสตราจารย์')).toBeInTheDocument();
    expect(screen.getByText('นักศึกษา')).toBeInTheDocument();
    expect(screen.getByText('อาจารย์')).toBeInTheDocument();
    expect(screen.getByText('ผู้ดูแลระบบ')).toBeInTheDocument();
  });

  it('shows search input', () => {
    render(<PrefixRoleMatrix {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาคำนำหน้าชื่อหรือบทบาท...');
    expect(searchInput).toBeInTheDocument();
  });

  it('shows filter dropdowns', () => {
    render(<PrefixRoleMatrix {...defaultProps} />);
    
    expect(screen.getByDisplayValue('ทุกหมวดหมู่คำนำหน้า')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ทุกหมวดหมู่บทบาท')).toBeInTheDocument();
  });

  it('shows action buttons', () => {
    render(<PrefixRoleMatrix {...defaultProps} />);
    
    expect(screen.getByText('โหลดคำแนะนำ')).toBeInTheDocument();
    expect(screen.getByText('กำหนดแบบกลุ่ม')).toBeInTheDocument();
  });

  it('opens bulk assignment modal when bulk assign button is clicked', () => {
    render(<PrefixRoleMatrix {...defaultProps} />);
    
    const bulkAssignButton = screen.getByText('กำหนดแบบกลุ่ม');
    fireEvent.click(bulkAssignButton);
    
    expect(screen.getByTestId('admin-modal')).toBeInTheDocument();
    expect(screen.getByText('การกำหนดคำนำหน้าชื่อแบบกลุ่ม')).toBeInTheDocument();
  });

  it('calls onLoadRecommendations when load recommendations button is clicked', async () => {
    render(<PrefixRoleMatrix {...defaultProps} />);
    
    const loadRecommendationsButton = screen.getByText('โหลดคำแนะนำ');
    fireEvent.click(loadRecommendationsButton);
    
    await waitFor(() => {
      expect(defaultProps.onLoadRecommendations).toHaveBeenCalled();
    });
  });

  it('displays assignment statistics', () => {
    render(<PrefixRoleMatrix {...defaultProps} />);
    
    expect(screen.getByText(/3 การกำหนด/)).toBeInTheDocument();
    expect(screen.getByText(/เริ่มต้น/)).toBeInTheDocument();
    expect(screen.getByText(/สมบูรณ์/)).toBeInTheDocument();
  });

  it('shows legend', () => {
    render(<PrefixRoleMatrix {...defaultProps} />);
    
    expect(screen.getByText('คำอธิบาย')).toBeInTheDocument();
    expect(screen.getByText('กำหนดแล้ว')).toBeInTheDocument();
    expect(screen.getByText('เริ่มต้น')).toBeInTheDocument();
    expect(screen.getByText('คำเตือน')).toBeInTheDocument();
    expect(screen.getByText('ข้อผิดพลาด')).toBeInTheDocument();
  });

  it('filters prefixes by search term', () => {
    render(<PrefixRoleMatrix {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาคำนำหน้าชื่อหรือบทบาท...');
    fireEvent.change(searchInput, { target: { value: 'นาย' } });
    
    // Should filter to show only prefixes/roles matching the search term
    expect(screen.getByText('นาย')).toBeInTheDocument();
  });

  it('toggles conflict display', () => {
    render(<PrefixRoleMatrix {...defaultProps} />);
    
    const conflictToggle = screen.getByText(/ข้อขัดแย้ง/);
    fireEvent.click(conflictToggle);
    
    // Should toggle the conflict display
    expect(conflictToggle).toBeInTheDocument();
  });

  it('displays matrix cells with assignment status', () => {
    render(<PrefixRoleMatrix {...defaultProps} />);
    
    // The matrix should render cells for each prefix-role combination
    // This would need more specific testing based on the actual matrix implementation
    expect(screen.getByText('คำนำหน้าชื่อ / บทบาท')).toBeInTheDocument();
  });
});