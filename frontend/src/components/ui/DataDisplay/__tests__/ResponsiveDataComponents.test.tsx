import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatisticsCard, StatisticsGrid } from '../StatisticsCard';
import { SearchInput, FilterSelect, ResponsiveDataFilter } from '../DataFilter';
import { ResponsiveDataTable } from '../../tables/ResponsiveDataTable';

// Mock useMediaQuery hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: jest.fn(() => false) // Default to desktop
}));

describe('StatisticsCard', () => {
  it('renders basic statistics card correctly', () => {
    render(
      <StatisticsCard
        title="Total Users"
        value={100}
        subtitle="Active users"
      />
    );

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Active users')).toBeInTheDocument();
  });

  it('handles click events when clickable', () => {
    const handleClick = jest.fn();
    render(
      <StatisticsCard
        title="Clickable Card"
        value={50}
        onClick={handleClick}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('displays trend information correctly', () => {
    render(
      <StatisticsCard
        title="Revenue"
        value="$1,000"
        trend={{
          value: 15,
          isPositive: true,
          label: 'vs last month'
        }}
      />
    );

    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });
});

describe('StatisticsGrid', () => {
  const mockCards = [
    { title: 'Card 1', value: 10 },
    { title: 'Card 2', value: 20 },
    { title: 'Card 3', value: 30 }
  ];

  it('renders multiple statistics cards', () => {
    render(<StatisticsGrid cards={mockCards} />);

    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
    expect(screen.getByText('Card 3')).toBeInTheDocument();
  });

  it('shows empty state when no cards provided', () => {
    render(<StatisticsGrid cards={[]} />);
    expect(screen.getByText('ไม่มีข้อมูลสถิติ')).toBeInTheDocument();
  });
});

describe('SearchInput', () => {
  it('renders search input with placeholder', () => {
    render(
      <SearchInput
        value=""
        onChange={jest.fn()}
        placeholder="Search here..."
      />
    );

    expect(screen.getByPlaceholderText('Search here...')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const handleChange = jest.fn();
    render(
      <SearchInput
        value=""
        onChange={handleChange}
        debounceMs={0} // Disable debounce for testing
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith('test');
    });
  });

  it('shows clear button when has value', () => {
    render(
      <SearchInput
        value="test value"
        onChange={jest.fn()}
      />
    );

    expect(screen.getByLabelText('ล้างการค้นหา')).toBeInTheDocument();
  });
});

describe('FilterSelect', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ];

  it('renders filter select with placeholder', () => {
    render(
      <FilterSelect
        value=""
        onChange={jest.fn()}
        options={mockOptions}
        placeholder="Select option..."
      />
    );

    expect(screen.getByText('Select option...')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    render(
      <FilterSelect
        value=""
        onChange={jest.fn()}
        options={mockOptions}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('calls onChange when option selected', () => {
    const handleChange = jest.fn();
    render(
      <FilterSelect
        value=""
        onChange={handleChange}
        options={mockOptions}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Option 1'));

    expect(handleChange).toHaveBeenCalledWith('option1');
  });
});

describe('ResponsiveDataTable', () => {
  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];

  const mockColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', mobileHidden: true }
  ];

  it('renders table with data', () => {
    render(
      <ResponsiveDataTable
        data={mockData}
        columns={mockColumns}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(
      <ResponsiveDataTable
        data={[]}
        columns={mockColumns}
        emptyMessage="No data found"
      />
    );

    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <ResponsiveDataTable
        data={mockData}
        columns={mockColumns}
        loading={true}
      />
    );

    expect(screen.getByRole('table')).toHaveClass('animate-pulse');
  });

  it('handles row clicks', () => {
    const handleRowClick = jest.fn();
    render(
      <ResponsiveDataTable
        data={mockData}
        columns={mockColumns}
        onRowClick={handleRowClick}
      />
    );

    fireEvent.click(screen.getByText('John Doe').closest('tr')!);
    expect(handleRowClick).toHaveBeenCalledWith(mockData[0], 0);
  });
});

describe('ResponsiveDataFilter', () => {
  const mockFilters = {
    search: '',
    category: '',
    status: ''
  };

  const mockFilterConfigs = [
    {
      key: 'category',
      label: 'Category',
      options: [
        { value: 'cat1', label: 'Category 1' },
        { value: 'cat2', label: 'Category 2' }
      ]
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ];

  it('renders search input and filters', () => {
    render(
      <ResponsiveDataFilter
        filters={mockFilters}
        onFiltersChange={jest.fn()}
        filterConfigs={mockFilterConfigs}
      />
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('shows advanced filters toggle when configured', () => {
    render(
      <ResponsiveDataFilter
        filters={mockFilters}
        onFiltersChange={jest.fn()}
        filterConfigs={mockFilterConfigs}
        showAdvancedToggle={true}
      />
    );

    expect(screen.getByLabelText(/แสดงตัวกรองขั้นสูง/)).toBeInTheDocument();
  });

  it('calls onFiltersChange when search changes', async () => {
    const handleFiltersChange = jest.fn();
    render(
      <ResponsiveDataFilter
        filters={mockFilters}
        onFiltersChange={handleFiltersChange}
        filterConfigs={mockFilterConfigs}
      />
    );

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    await waitFor(() => {
      expect(handleFiltersChange).toHaveBeenCalledWith({ search: 'test search' });
    });
  });
});