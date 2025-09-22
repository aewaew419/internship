import type { Meta, StoryObj } from '@storybook/react';
import { Table, ResponsiveTable, MobileTable, TableCard } from './index';

const meta: Meta = {
  title: 'UI/Table Components',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

// Sample data
const sampleData = [
  { 
    id: 1, 
    name: 'John Doe', 
    email: 'john.doe@example.com', 
    role: 'Student',
    status: 'Active', 
    joinDate: '2024-01-15',
    gpa: 3.85
  },
  { 
    id: 2, 
    name: 'Jane Smith', 
    email: 'jane.smith@example.com', 
    role: 'Instructor',
    status: 'Active', 
    joinDate: '2023-08-20',
    gpa: null
  },
  { 
    id: 3, 
    name: 'Bob Johnson', 
    email: 'bob.johnson@example.com', 
    role: 'Student',
    status: 'Inactive', 
    joinDate: '2023-12-01',
    gpa: 3.42
  },
  { 
    id: 4, 
    name: 'Alice Brown', 
    email: 'alice.brown@example.com', 
    role: 'Admin',
    status: 'Active', 
    joinDate: '2022-05-10',
    gpa: null
  },
  { 
    id: 5, 
    name: 'Charlie Wilson', 
    email: 'charlie.wilson@example.com', 
    role: 'Student',
    status: 'Active', 
    joinDate: '2024-02-28',
    gpa: 3.91
  },
];

const sampleColumns = [
  { 
    key: 'id', 
    label: 'ID', 
    sortable: true, 
    priority: 1,
    width: '80px',
    align: 'center' as const
  },
  { 
    key: 'name', 
    label: 'Name', 
    sortable: true, 
    priority: 2,
    render: (value: string, row: any) => (
      <div className="flex items-center">
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
          <span className="text-primary-600 font-medium text-sm">
            {value.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.role}</div>
        </div>
      </div>
    )
  },
  { 
    key: 'email', 
    label: 'Email', 
    mobileHidden: true,
    render: (value: string) => (
      <a href={`mailto:${value}`} className="text-primary-600 hover:text-primary-800">
        {value}
      </a>
    )
  },
  { 
    key: 'status', 
    label: 'Status', 
    priority: 3,
    render: (value: string) => (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        value === 'Active' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {value}
      </span>
    )
  },
  { 
    key: 'gpa', 
    label: 'GPA', 
    align: 'right' as const,
    render: (value: number | null) => value ? value.toFixed(2) : 'N/A'
  },
  { 
    key: 'joinDate', 
    label: 'Join Date', 
    mobileHidden: true,
    render: (value: string) => new Date(value).toLocaleDateString()
  },
];

export const BasicTable: StoryObj = {
  render: () => (
    <div className="max-w-6xl">
      <h3 className="text-lg font-semibold mb-4">Basic Responsive Table</h3>
      <ResponsiveTable 
        data={sampleData} 
        columns={sampleColumns}
        onRowClick={(row) => alert(`Clicked on ${row.name}`)}
      />
    </div>
  ),
};

export const SortableTable: StoryObj = {
  render: () => (
    <div className="max-w-6xl">
      <h3 className="text-lg font-semibold mb-4">Sortable Table</h3>
      <ResponsiveTable 
        data={sampleData} 
        columns={sampleColumns}
        sortable
        defaultSort={{ key: 'name', direction: 'asc' }}
        onSort={(key, direction) => console.log(`Sort by ${key} ${direction}`)}
      />
    </div>
  ),
};

export const MobileScrollTable: StoryObj = {
  render: () => (
    <div className="max-w-sm mx-auto">
      <h3 className="text-lg font-semibold mb-4">Mobile Horizontal Scroll</h3>
      <MobileTable 
        data={sampleData} 
        columns={sampleColumns}
        onRowClick={(row) => alert(`Clicked on ${row.name}`)}
      />
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TableCards: StoryObj = {
  render: () => (
    <div className="max-w-sm mx-auto space-y-4">
      <h3 className="text-lg font-semibold mb-4">Table Cards</h3>
      
      <div className="space-y-3">
        <h4 className="font-medium">Vertical Layout</h4>
        <TableCard
          data={sampleData[0]}
          columns={sampleColumns}
          index={0}
          layout="vertical"
          onClick={(data) => alert(`Clicked on ${data.name}`)}
        />
      </div>
      
      <div className="space-y-3">
        <h4 className="font-medium">Horizontal Layout</h4>
        <TableCard
          data={sampleData[1]}
          columns={sampleColumns}
          index={1}
          layout="horizontal"
          onClick={(data) => alert(`Clicked on ${data.name}`)}
        />
      </div>
      
      <div className="space-y-3">
        <h4 className="font-medium">Grid Layout</h4>
        <TableCard
          data={sampleData[2]}
          columns={sampleColumns}
          index={2}
          layout="grid"
          onClick={(data) => alert(`Clicked on ${data.name}`)}
        />
      </div>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TableWithPagination: StoryObj = {
  render: () => (
    <div className="max-w-6xl">
      <h3 className="text-lg font-semibold mb-4">Table with Pagination</h3>
      <Table 
        data={sampleData} 
        columns={sampleColumns}
        pagination={{
          currentPage: 1,
          totalPages: 3,
          pageSize: 5,
          onPageChange: (page) => console.log(`Go to page ${page}`)
        }}
      />
    </div>
  ),
};

export const SelectableTable: StoryObj = {
  render: () => (
    <div className="max-w-6xl">
      <h3 className="text-lg font-semibold mb-4">Selectable Table</h3>
      <Table 
        data={sampleData} 
        columns={sampleColumns}
        selectable
        selectedRows={[0, 2]}
        onSelectionChange={(selected) => console.log('Selected rows:', selected)}
      />
    </div>
  ),
};

export const TableWithActions: StoryObj = {
  render: () => (
    <div className="max-w-6xl">
      <h3 className="text-lg font-semibold mb-4">Table with Actions</h3>
      <Table 
        data={sampleData} 
        columns={sampleColumns}
        actions={[
          {
            label: 'Edit',
            icon: (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ),
            onClick: (row) => alert(`Edit ${row.name}`),
          },
          {
            label: 'Delete',
            icon: (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            ),
            onClick: (row) => alert(`Delete ${row.name}`),
            variant: 'danger',
          },
        ]}
      />
    </div>
  ),
};

export const LoadingTable: StoryObj = {
  render: () => (
    <div className="max-w-6xl">
      <h3 className="text-lg font-semibold mb-4">Loading State</h3>
      <Table 
        data={[]} 
        columns={sampleColumns}
        loading
      />
    </div>
  ),
};

export const EmptyTable: StoryObj = {
  render: () => (
    <div className="max-w-6xl">
      <h3 className="text-lg font-semibold mb-4">Empty State</h3>
      <Table 
        data={[]} 
        columns={sampleColumns}
        emptyMessage="No students found. Try adjusting your search criteria."
      />
    </div>
  ),
};

export const MobileAdaptiveTable: StoryObj = {
  render: () => (
    <div className="w-full max-w-sm mx-auto">
      <h3 className="text-lg font-semibold mb-4">Mobile Adaptive Table</h3>
      <Table 
        data={sampleData} 
        columns={sampleColumns}
        mobileView="auto"
        cardLayout="horizontal"
        onRowClick={(row) => alert(`Clicked on ${row.name}`)}
      />
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};