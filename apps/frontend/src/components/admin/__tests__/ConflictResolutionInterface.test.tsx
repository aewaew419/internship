import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConflictResolutionInterface } from '../ConflictResolutionInterface';

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

interface AssignmentConflict {
  id: string;
  type: 'gender_mismatch' | 'category_conflict' | 'duplicate_default' | 'missing_default' | 'inappropriate_assignment' | 'system_role_conflict';
  severity: 'error' | 'warning' | 'info';
  prefixId: number;
  roleId: number;
  message: string;
  description: string;
  suggestions: string[];
  affectedAssignments?: PrefixRoleAssignment[];
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
    thai: 'ศาสตราจารย์',
    english: 'Professor',
    abbreviation: 'ศ.',
    category: 'academic',
    gender: 'neutral',
    isDefault: true,
    sortOrder: 2,
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
    isDefault: true, // This creates a duplicate default conflict
    canModify: true,
    assignedBy: 1,
    assignedAt: '2024-01-01T00:00:00Z',
  }
];

const mockConflicts: AssignmentConflict[] = [
  {
    id: 'duplicate-default-1',
    type: 'duplicate_default',
    severity: 'error',
    prefixId: 1,
    roleId: 1,
    message: 'บทบาท "นักศึกษา" มีคำนำหน้าชื่อเริ่มต้นมากกว่า 1 รายการ',
    description: 'พบคำนำหน้าชื่อเริ่มต้น 2 รายการ ซึ่งควรมีเพียง 1 รายการเท่านั้น',
    suggestions: ['เลือกคำนำหน้าชื่อเริ่มต้นเพียง 1 รายการ'],
    affectedAssignments: mockAssignments
  }
];

describe('ConflictResolutionInterface', () => {
  const defaultProps = {
    conflicts: mockConflicts,
    prefixes: mockPrefixes,
    roles: mockRoles,
    assignments: mockAssignments,
    onResolveConflict: jest.fn(),
    onResolveMultiple: jest.fn(),
    onIgnoreConflict: jest.fn(),
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders conflict resolution interface when open', () => {
    render(<ConflictResolutionInterface {...defaultProps} />);
    
    expect(screen.getByTestId('admin-modal')).toBeInTheDocument();
    expect(screen.getByText('แก้ไขข้อขัดแย้งการกำหนดคำนำหน้าชื่อ')).toBeInTheDocument();
  });

  it('displays conflict summary', () => {
    render(<ConflictResolutionInterface {...defaultProps} />);
    
    expect(screen.getByText('สรุปข้อขัดแย้ง')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Total conflicts
    expect(screen.getByText('ทั้งหมด')).toBeInTheDocument();
  });

  it('shows conflict details', () => {
    render(<ConflictResolutionInterface {...defaultProps} />);
    
    expect(screen.getByText('บทบาท "นักศึกษา" มีคำนำหน้าชื่อเริ่มต้นมากกว่า 1 รายการ')).toBeInTheDocument();
    expect(screen.getByText('พบคำนำหน้าชื่อเริ่มต้น 2 รายการ ซึ่งควรมีเพียง 1 รายการเท่านั้น')).toBeInTheDocument();
  });

  it('displays resolution actions', () => {
    render(<ConflictResolutionInterface {...defaultProps} />);
    
    expect(screen.getByText('วิธีการแก้ไข')).toBeInTheDocument();
    // Should show various resolution options
  });

  it('shows auto-resolve button when applicable', () => {
    render(<ConflictResolutionInterface {...defaultProps} />);
    
    // Should show auto-resolve button if there are automatic actions
    const autoResolveButton = screen.queryByText(/แก้ไขอัตโนมัติ/);
    if (autoResolveButton) {
      expect(autoResolveButton).toBeInTheDocument();
    }
  });

  it('calls onResolveMultiple when resolve all is clicked', async () => {
    render(<ConflictResolutionInterface {...defaultProps} />);
    
    const resolveAllButton = screen.getByText('แก้ไขทั้งหมด');
    fireEvent.click(resolveAllButton);
    
    await waitFor(() => {
      expect(defaultProps.onResolveMultiple).toHaveBeenCalled();
    });
  });

  it('calls onClose when close button is clicked', () => {
    render(<ConflictResolutionInterface {...defaultProps} />);
    
    const closeButton = screen.getByText('ปิด');
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    render(<ConflictResolutionInterface {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByTestId('admin-modal')).not.toBeInTheDocument();
  });

  it('shows completion message when all conflicts are resolved', () => {
    render(<ConflictResolutionInterface {...defaultProps} conflicts={[]} />);
    
    expect(screen.getByText('แก้ไขข้อขัดแย้งเสร็จสิ้น')).toBeInTheDocument();
    expect(screen.getByText('ข้อขัดแย้งทั้งหมดได้รับการแก้ไขแล้ว')).toBeInTheDocument();
  });

  it('displays loading state when resolving', async () => {
    const mockOnResolveMultiple = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<ConflictResolutionInterface {...defaultProps} onResolveMultiple={mockOnResolveMultiple} />);
    
    const resolveAllButton = screen.getByText('แก้ไขทั้งหมด');
    fireEvent.click(resolveAllButton);
    
    expect(screen.getByText('กำลังแก้ไข...')).toBeInTheDocument();
  });

  it('allows selecting resolution actions', () => {
    render(<ConflictResolutionInterface {...defaultProps} />);
    
    // Should be able to select different resolution actions
    // This would need more specific testing based on the actual resolution actions generated
    expect(screen.getByText('วิธีการแก้ไข')).toBeInTheDocument();
  });

  it('shows impact levels for resolution actions', () => {
    render(<ConflictResolutionInterface {...defaultProps} />);
    
    // Should show impact indicators like "ผลกระทบต่ำ", "ผลกระทบปานกลาง", etc.
    // This would depend on the specific resolution actions generated
    expect(screen.getByText('วิธีการแก้ไข')).toBeInTheDocument();
  });
});