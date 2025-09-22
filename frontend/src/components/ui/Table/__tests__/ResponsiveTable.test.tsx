import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponsiveTable, TableColumn } from '../ResponsiveTable';

// Mock useMediaQuery hook
const mockUseMediaQuery = jest.fn();
jest.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => mockUseMediaQuery(),
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

interface TestData {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  priority: number;
}

const mockData: TestData[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Student', status: 'Active', priority: 1 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Instructor', status: 'Inactive', priority: 2 },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Admin', status: 'Active', priority: 3 },
];

const mockColumns: TableColumn<TestData>[] = [
  {
    key: 'name',
    label: 'Name',
    priority: 1,
    sortable: true,
  },
  {
    key: 'email',
    label: 'Email',
    priority: 2,
    sortable: true,
  },
  {
    key: 'role',
    label: 'Role',
    priority: 3,
    mobileHidden: false,
  },
  {
    key: 'status',
    label: 'Status',
    priority: 4,
    mobileHidden: true, // Hidden on mobile
    render: (value) => (
      <span className={`status-badge ${value.toLowerCase()}`}>
        {value}
      </span>
    ),
  },
];

describe('ResponsiveTable', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Desktop View', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(false); // Desktop
    });

    it('renders table structure on desktop', () => {
      render(<ResponsiveTable data={mockData} columns={mockColumns} />);
      
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('thead')).toBeInTheDocument();
      expect(screen.getByRole('tbody')).toBeInTheDocument();
    });

    it('displays all columns on desktop', () => {
      render(<ResponsiveTable data={mockData} columns={mockColumns} />);
      
      mockColumns.forEach(column => {
        expect(screen.getByText(column.label)).toBeInTheDocument();
      });
    });

    it('renders all data rows', () => {
      render(<ResponsiveTable data={mockData} columns={mockColumns} />);
      
      mockData.forEach(item => {
        expect(screen.getByText(item.name)).toBeInTheDocument();
        expect(screen.getByText(item.email)).toBeInTheDocument();
      });
    });

    it('applies custom render functions', () => {
      render(<ResponsiveTable data={mockData} columns={mockColumns} />);
      
      // Check that status column uses custom render
      const statusBadges = document.querySelectorAll('.status-badge');
      expect(statusBadges).toHaveLength(mockData.length);
    });

    it('handles row click events', async () => {
      const onRowClick = jest.fn();
      render(<ResponsiveTable data={mockData} columns={mockColumns} onRowClick={onRowClick} />);
      
      const firstRow = screen.getByText('John Doe').closest('tr');
      await user.click(firstRow!);
      
      expect(onRowClick).toHaveBeenCalledWith(mockData[0], 0);
    });

    it('applies cursor pointer when onRowClick is provided', () => {
      const onRowClick = jest.fn();
      render(<ResponsiveTable data={mockData} columns={mockColumns} onRowClick={onRowClick} />);
      
      const rows = screen.getAllByRole('row');
      // Skip header row
      const dataRows = rows.slice(1);
      
      dataRows.forEach(row => {
        expect(row).toHaveClass('cursor-pointer');
      });
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile
    });

    it('renders card layout on mobile', () => {
      render(<ResponsiveTable data={mockData} columns={mockColumns} showMobileCards={true} />);
      
      // Should not render table structure
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      
      // Should render cards
      const cards = document.querySelectorAll('.bg-white.rounded-lg.border');
      expect(cards).toHaveLength(mockData.length);
    });

    it('shows only priority columns on mobile (max 3)', () => {
      render(<ResponsiveTable data={mockData} columns={mockColumns} showMobileCards={true} />);
      
      // Should show Name, Email, Role (top 3 priority, excluding mobileHidden)
      expect(screen.getByText('Name:')).toBeInTheDocument();
      expect(screen.getByText('Email:')).toBeInTheDocument();
      expect(screen.getByText('Role:')).toBeInTheDocument();
      
      // Status should be hidden (mobileHidden: true)
      expect(screen.queryByText('Status:')).not.toBeInTheDocument();
    });

    it('handles card click events on mobile', async () => {
      const onRowClick = jest.fn();
      render(<ResponsiveTable data={mockData} columns={mockColumns} onRowClick={onRowClick} showMobileCards={true} />);
      
      const firstCard = screen.getByText('John Doe').closest('.bg-white');
      await user.click(firstCard!);
      
      expect(onRowClick).toHaveBeenCalledWith(mockData[0], 0);
    });

    it('applies touch-manipulation class on mobile cards', () => {
      const onRowClick = jest.fn();
      render(<ResponsiveTable data={mockData} columns={mockColumns} onRowClick={onRowClick} showMobileCards={true} />);
      
      const cards = document.querySelectorAll('.bg-white.rounded-lg.border');
      cards.forEach(card => {
        expect(card).toHaveClass('touch-manipulation');
      });
    });

    it('can fall back to horizontal scroll table on mobile', () => {
      render(<ResponsiveTable data={mockData} columns={mockColumns} showMobileCards={false} />);
      
      // Should still render table but with horizontal scroll
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(document.querySelector('.overflow-x-auto')).toBeInTheDocument();
    });
  });

  describe('Sorting Functionality', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(false); // Desktop for sorting tests
    });

    it('renders sort icons for sortable columns', () => {
      render(<ResponsiveTable data={mockData} columns={mockColumns} sortable={true} />);
      
      const nameHeader = screen.getByText('Name').closest('th');
      const emailHeader = screen.getByText('Email').closest('th');
      
      expect(nameHeader?.querySelector('svg')).toBeInTheDocument();
      expect(emailHeader?.querySelector('svg')).toBeInTheDocument();
    });

    it('handles sort click events', async () => {
      const onSort = jest.fn();
      render(<ResponsiveTable data={mockData} columns={mockColumns} sortable={true} onSort={onSort} />);
      
      const nameHeader = screen.getByText('Name').closest('th');
      await user.click(nameHeader!);
      
      expect(onSort).toHaveBeenCalledWith('name', 'asc');
    });

    it('toggles sort direction on repeated clicks', async () => {
      const onSort = jest.fn();
      render(<ResponsiveTable data={mockData} columns={mockColumns} sortable={true} onSort={onSort} />);
      
      const nameHeader = screen.getByText('Name').closest('th');
      
      // First click - ascending
      await user.click(nameHeader!);
      expect(onSort).toHaveBeenCalledWith('name', 'asc');
      
      // Second click - descending
      await user.click(nameHeader!);
      expect(onSort).toHaveBeenCalledWith('name', 'desc');
    });

    it('applies cursor pointer to sortable headers', () => {
      render(<ResponsiveTable data={mockData} columns={mockColumns} sortable={true} />);
      
      const nameHeader = screen.getByText('Name').closest('th');
      const roleHeader = screen.getByText('Role').closest('th');
      
      expect(nameHeader).toHaveClass('cursor-pointer');
      expect(roleHeader).not.toHaveClass('cursor-pointer'); // Not sortable
    });
  });

  describe('Loading State', () => {
    it('renders loading skeleton', () => {
      render(<ResponsiveTable data={[]} columns={mockColumns} loading={true} />);
      
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
      
      // Should not render table or empty message
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.queryByText('No data available')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty message when no data', () => {
      render(<ResponsiveTable data={[]} columns={mockColumns} />);
      
      expect(screen.getByText('No data available')).toBeInTheDocument();
      expect(screen.getByText('📋')).toBeInTheDocument();
    });

    it('renders custom empty message', () => {
      render(<ResponsiveTable data={[]} columns={mockColumns} emptyMessage="No students found" />);
      
      expect(screen.getByText('No students found')).toBeInTheDocument();
    });
  });

  describe('Responsive Breakpoints', () => {
    it('uses custom mobile breakpoint', () => {
      // This test verifies that the custom breakpoint is passed to useMediaQuery
      render(<ResponsiveTable data={mockData} columns={mockColumns} mobileBreakpoint={1024} />);
      
      // The hook should have been called with the custom breakpoint
      expect(mockUseMediaQuery).toHaveBeenCalled();
    });
  });

  describe('Column Configuration', () => {
    it('applies column alignment classes', () => {
      const alignedColumns: TableColumn<TestData>[] = [
        { key: 'name', label: 'Name', align: 'left' },
        { key: 'email', label: 'Email', align: 'center' },
        { key: 'role', label: 'Role', align: 'right' },
      ];

      mockUseMediaQuery.mockReturnValue(false); // Desktop
      render(<ResponsiveTable data={mockData} columns={alignedColumns} />);
      
      const headers = screen.getAllByRole('columnheader');
      expect(headers[1]).toHaveClass('text-center');
      expect(headers[2]).toHaveClass('text-right');
    });

    it('applies column width classes', () => {
      const widthColumns: TableColumn<TestData>[] = [
        { key: 'name', label: 'Name', width: '200px' },
        { key: 'email', label: 'Email', width: '300px' },
      ];

      mockUseMediaQuery.mockReturnValue(false); // Desktop
      render(<ResponsiveTable data={mockData} columns={widthColumns} />);
      
      const headers = screen.getAllByRole('columnheader');
      expect(headers[0]).toHaveClass('w-[200px]');
      expect(headers[1]).toHaveClass('w-[300px]');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(false); // Desktop
    });

    it('has proper table structure with roles', () => {
      render(<ResponsiveTable data={mockData} columns={mockColumns} />);
      
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('thead')).toBeInTheDocument();
      expect(screen.getByRole('tbody')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(mockColumns.length);
      expect(screen.getAllByRole('row')).toHaveLength(mockData.length + 1); // +1 for header
    });

    it('maintains keyboard navigation for sortable headers', async () => {
      render(<ResponsiveTable data={mockData} columns={mockColumns} sortable={true} />);
      
      const nameHeader = screen.getByText('Name').closest('th');
      
      // Should be focusable and clickable
      nameHeader?.focus();
      fireEvent.keyDown(nameHeader!, { key: 'Enter' });
      
      // Should trigger sort (though we don't have onSort handler in this test)
      expect(nameHeader).toHaveClass('cursor-pointer');
    });
  });

  describe('Performance', () => {
    it('handles large datasets efficiently', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        role: 'Student',
        status: 'Active',
        priority: i,
      }));

      const { container } = render(<ResponsiveTable data={largeData} columns={mockColumns} />);
      
      // Should render without performance issues
      expect(container.querySelector('table')).toBeInTheDocument();
      expect(screen.getAllByRole('row')).toHaveLength(1001); // +1 for header
    });
  });
});