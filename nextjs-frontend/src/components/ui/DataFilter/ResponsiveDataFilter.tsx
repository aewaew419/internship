'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SearchInput } from './SearchInput';
import { FilterSelect, FilterOption } from './FilterSelect';

export interface FilterState {
  search: string;
  [key: string]: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  mobileHidden?: boolean;
}

export interface ResponsiveDataFilterProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onSearch?: (searchTerm: string) => void;
  onReset?: () => void;
  filterConfigs: FilterConfig[];
  loading?: boolean;
  searchPlaceholder?: string;
  showAdvancedToggle?: boolean;
  className?: string;
}

export const ResponsiveDataFilter: React.FC<ResponsiveDataFilterProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  filterConfigs,
  loading = false,
  searchPlaceholder = 'ค้นหา...',
  showAdvancedToggle = true,
  className
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Count active filters (excluding search)
  const activeFilterCount = Object.entries(filters)
    .filter(([key, value]) => key !== 'search' && value && value.trim() !== '')
    .length;

  const hasActiveFilters = activeFilterCount > 0 || (filters.search && filters.search.trim() !== '');

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: string) => {
    onFiltersChange({ [key]: value });
  }, [onFiltersChange]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (onReset) {
      onReset();
    } else {
      const resetFilters: Partial<FilterState> = { search: '' };
      filterConfigs.forEach(config => {
        resetFilters[config.key] = '';
      });
      onFiltersChange(resetFilters);
    }
  }, [onReset, onFiltersChange, filterConfigs]);

  // Filter configs for mobile (hide mobile-hidden filters)
  const visibleConfigs = isMobile 
    ? filterConfigs.filter(config => !config.mobileHidden)
    : filterConfigs;

  // Split configs into primary (always visible) and advanced (collapsible)
  const primaryConfigs = visibleConfigs.slice(0, isMobile ? 1 : 2);
  const advancedConfigs = visibleConfigs.slice(isMobile ? 1 : 2);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Search and Primary Filters */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-end sm:space-x-4">
        {/* Search Input */}
        <div className="flex-1 min-w-0">
          <SearchInput
            value={filters.search}
            onChange={(value) => handleFilterChange('search', value)}
            onSearch={onSearch}
            placeholder={searchPlaceholder}
            disabled={loading}
            loading={loading}
            size={isMobile ? 'lg' : 'md'}
          />
        </div>

        {/* Primary Filters */}
        {primaryConfigs.map((config) => (
          <div key={config.key} className={cn(
            'flex-shrink-0',
            isMobile ? 'w-full' : 'w-48'
          )}>
            <FilterSelect
              value={filters[config.key] || ''}
              onChange={(value) => handleFilterChange(config.key, value)}
              options={config.options}
              placeholder={config.placeholder}
              label={isMobile ? config.label : undefined}
              disabled={loading}
              loading={loading}
              searchable={config.searchable}
              clearable={config.clearable}
              size={isMobile ? 'lg' : 'md'}
            />
          </div>
        ))}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Advanced Toggle */}
          {showAdvancedToggle && advancedConfigs.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn(
                'relative p-2 rounded-lg border transition-all duration-200 touch-manipulation',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                hasActiveFilters 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              )}
              aria-label={`${showAdvanced ? 'ซ่อน' : 'แสดง'}ตัวกรองขั้นสูง`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              
              {/* Active filter count badge */}
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className={cn(
                'p-2 rounded-lg border border-red-300 bg-white text-red-600 transition-all duration-200 touch-manipulation',
                'hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              aria-label="ล้างตัวกรอง"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedToggle && advancedConfigs.length > 0 && (
        <div className={cn(
          'transition-all duration-300 overflow-hidden',
          showAdvanced ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-gray-700">ตัวกรองขั้นสูง</h3>
            </div>
            
            <div className={cn(
              'grid gap-4',
              isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'
            )}>
              {advancedConfigs.map((config) => (
                <FilterSelect
                  key={config.key}
                  value={filters[config.key] || ''}
                  onChange={(value) => handleFilterChange(config.key, value)}
                  options={config.options}
                  placeholder={config.placeholder}
                  label={config.label}
                  disabled={loading}
                  loading={loading}
                  searchable={config.searchable}
                  clearable={config.clearable}
                  size="md"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">ตัวกรองที่ใช้:</span>
          
          {/* Search filter chip */}
          {filters.search && filters.search.trim() !== '' && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              <span>ค้นหา: "{filters.search}"</span>
              <button
                type="button"
                onClick={() => handleFilterChange('search', '')}
                className="ml-2 text-blue-600 hover:text-blue-800 touch-manipulation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Other filter chips */}
          {filterConfigs.map((config) => {
            const value = filters[config.key];
            if (!value || value.trim() === '') return null;

            const option = config.options.find(opt => opt.value === value);
            const displayValue = option ? option.label : value;

            return (
              <div key={config.key} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                <span>{config.label}: {displayValue}</span>
                <button
                  type="button"
                  onClick={() => handleFilterChange(config.key, '')}
                  className="ml-2 text-gray-600 hover:text-gray-800 touch-manipulation"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResponsiveDataFilter;