import { render, screen, fireEvent } from '@testing-library/react';
import { ResponsiveTable, MobileTable, TableCard, Table } from './index';

// Mock the utils and hooks
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

jest.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: jest.fn(() => false) // Default to desktop
}));

const mockData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active' },
];

const mockColumns = [
  { key: 'id', label: 'ID', sortable: true, priority: 1 },
  { key: 'name', label: 'Name', sortable: true, priority: 2 },
  { key: 'email', label: 'Email', mobileHidden: true },
  { 
    key: 'status', 
    label: 'Status', 
    render: (value: string) => (
      <span className={`px-2 py-1 rounded text-xs ${value === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {value}
      </span>
    )
  },
];

describe('ResponsiveTable Component', () => {
  it('renders table with data', () => {
    render(<ResponsiveTable data={mockData} columns={mockColumns} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('ID')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<ResponsiveTable data={[]} columns={mockColumns} loading />);
    
    expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
  });

  it('shows empty message', () => {
    render(<ResponsiveTable data={[]} columns={mockColumns} emptyMessage="No users found" />);
    
    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  it('handles row clicks', () => {
    const onRowClick = jest.fn();
    render(<ResponsiveTable data={mockData} columns={mockColumns} onRowClick={onRowClick} />);
    
    fireEvent.click(screen.getByText('John Doe').closest('tr')!);
    expect(onRowClick).toHaveBeenCalledWith(mockData[0], 0);
  });

  it('handles sorting', () => {
    const onSort = jest.fn();
    render(<ResponsiveTable data={mockData} columns={mockColumns} sortable onSort={onSort} />);
    
    fireEvent.click(screen.getByText('Name'));
    expect(onSort).toHaveBeenCalledWith('name', 'asc');
  });
});

describe('MobileTable Component', () => {
  it('renders horizontal scrollable table', () => {
    render(<MobileTable data={mockData} columns={mockColumns} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    const container = screen.getByText('John Doe').closest('div[class*="overflow-x-auto"]');
    expect(container).toBeInTheDocument();
  });

  it('shows scroll indicators', () => {
    render(<MobileTable data={mockData} columns={mockColumns} showScrollIndicator />);
    
    expect(screen.getByText('← Swipe to see more columns →')).toBeInTheDocument();
  });
});

describe('TableCard Component', () => {
  it('renders card with vertical layout', () => {
    render(
      <TableCard 
        data={mockData[0]} 
        columns={mockColumns} 
        index={0}
        layout="vertical"
      />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('ID:')).toBeInTheDocument();
  });

  it('renders card with horizontal layout', () => {
    render(
      <TableCard 
        data={mockData[0]} 
        columns={mockColumns} 
        index={0}
        layout="horizontal"
      />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('handles card clicks', () => {
    const onClick = jest.fn();
    render(
      <TableCard 
        data={mockData[0]} 
        columns={mockColumns} 
        index={0}
        onClick={onClick}
      />
    );
    
    fireEvent.click(screen.getByText('John Doe').closest('div')!);
    expect(onClick).toHaveBeenCalledWith(mockData[0], 0);
  });
});

describe('Table Component', () => {
  it('renders with pagination', () => {
    const pagination = {
      currentPage: 1,
      totalPages: 5,
      pageSize: 10,
      onPageChange: jest.fn(),
    };
    
    render(<Table data={mockData} columns={mockColumns} pagination={pagination} />);
    
    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('handles selection', () => {
    const onSelectionChange = jest.fn();
    render(
      <Table 
        data={mockData} 
        columns={mockColumns} 
        selectable 
        selectedRows={[0]} 
        onSelectionChange={onSelectionChange}
      />
    );
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(4); // Header + 3 rows
    
    fireEvent.click(checkboxes[1]);
    expect(onSelectionChange).toHaveBeenCalled();
  });

  it('renders with actions', () => {
    const actions = [
      { label: 'Edit', onClick: jest.fn() },
      { label: 'Delete', onClick: jest.fn(), variant: 'danger' as const },
    ];
    
    render(<Table data={mockData} columns={mockColumns} actions={actions} />);
    
    expect(screen.getAllByText('Edit')).toHaveLength(3);
    expect(screen.getAllByText('Delete')).toHaveLength(3);
  });

  it('handles action clicks', () => {
    const editAction = jest.fn();
    const actions = [{ label: 'Edit', onClick: editAction }];
    
    render(<Table data={mockData} columns={mockColumns} actions={actions} />);
    
    fireEvent.click(screen.getAllByText('Edit')[0]);
    expect(editAction).toHaveBeenCalledWith(mockData[0], 0);
  });
});