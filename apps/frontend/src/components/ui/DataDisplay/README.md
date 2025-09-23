# Responsive Data Display Components

This directory contains responsive data display components designed for mobile-first applications. These components automatically adapt to different screen sizes and provide optimal user experience across devices.

## Components Overview

### 1. StatisticsCard & StatisticsGrid

Display key metrics and statistics in a responsive card layout.

#### Features
- Mobile-first responsive design
- Touch-friendly interactions
- Support for trends and icons
- Clickable cards with proper accessibility
- Multiple color themes
- Automatic grid layout adaptation

#### Usage

```tsx
import { StatisticsCard, StatisticsGrid } from '@/components/ui';

// Single card
<StatisticsCard
  title="Total Users"
  value={1250}
  subtitle="Active users"
  color="primary"
  trend={{
    value: 15,
    isPositive: true,
    label: "vs last month"
  }}
  icon={<UserIcon />}
  onClick={() => console.log('Card clicked')}
/>

// Grid of cards
<StatisticsGrid
  cards={[
    { title: "Revenue", value: "$12,500", color: "success" },
    { title: "Orders", value: 89, color: "primary" },
    { title: "Customers", value: 1250, color: "secondary" }
  ]}
  columns={3}
  gap="md"
/>
```

### 2. ResponsiveDataTable

A data table that automatically switches between table view (desktop) and card view (mobile).

#### Features
- Automatic mobile/desktop layout switching
- Column hiding on mobile screens
- Sortable columns
- Row click handling
- Loading and empty states
- Touch-optimized interactions
- Responsive column widths

#### Usage

```tsx
import { ResponsiveDataTable } from '@/components/tables';

const columns = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', mobileHidden: true },
  { 
    key: 'status', 
    label: 'Status',
    render: (value) => <StatusBadge status={value} />
  }
];

<ResponsiveDataTable
  data={users}
  columns={columns}
  loading={loading}
  onRowClick={(user) => navigate(`/users/${user.id}`)}
  sortable={true}
  emptyMessage="No users found"
/>
```

### 3. Data Filter Components

Responsive search and filtering components optimized for mobile use.

#### SearchInput

```tsx
import { SearchInput } from '@/components/ui';

<SearchInput
  value={searchTerm}
  onChange={setSearchTerm}
  onSearch={handleSearch}
  placeholder="Search users..."
  debounceMs={300}
  showSearchButton={false}
/>
```

#### FilterSelect

```tsx
import { FilterSelect } from '@/components/ui';

<FilterSelect
  value={selectedCategory}
  onChange={setSelectedCategory}
  options={[
    { value: 'all', label: 'All Categories' },
    { value: 'tech', label: 'Technology', count: 15 },
    { value: 'design', label: 'Design', count: 8 }
  ]}
  placeholder="Select category..."
  searchable={true}
  clearable={true}
/>
```

#### ResponsiveDataFilter

Complete filtering solution with search, filters, and advanced options.

```tsx
import { ResponsiveDataFilter } from '@/components/ui';

const filterConfigs = [
  {
    key: 'category',
    label: 'Category',
    options: categoryOptions,
    searchable: true
  },
  {
    key: 'status',
    label: 'Status',
    options: statusOptions,
    mobileHidden: true // Hide on mobile to save space
  }
];

<ResponsiveDataFilter
  filters={filters}
  onFiltersChange={setFilters}
  onSearch={handleSearch}
  filterConfigs={filterConfigs}
  searchPlaceholder="Search anything..."
  showAdvancedToggle={true}
/>
```

## Responsive Behavior

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

### Mobile Optimizations
- Touch targets minimum 44px
- Simplified layouts on small screens
- Card-based data display instead of tables
- Collapsible advanced filters
- Optimized spacing and typography
- Swipe-friendly interactions

### Desktop Features
- Full table layouts
- More detailed information display
- Hover states and interactions
- Advanced filtering always visible
- Multi-column layouts

## Accessibility

All components include:
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- High contrast support
- Touch-friendly interactions

## Performance

- Debounced search inputs
- Virtualized large data sets (when needed)
- Optimized re-renders with React.memo
- Lazy loading for dropdown options
- Efficient sorting and filtering

## Examples

See the complete example in `DataDisplayExample.tsx` which demonstrates:
- Statistics cards with real data
- Responsive data table with filtering
- Complete search and filter workflow
- Mobile-optimized interactions

Visit `/data-display-demo` to see all components in action.

## Requirements Satisfied

This implementation satisfies the following requirements from the NextJS Mobile Migration spec:

- **Requirement 2.3**: Mobile-optimized data tables with card fallbacks
- **Requirement 2.6**: Responsive data filtering and search components
- **Mobile-first design**: All components start with mobile layout and enhance for larger screens
- **Touch optimization**: Proper touch targets and interactions
- **Performance**: Optimized for mobile networks and devices