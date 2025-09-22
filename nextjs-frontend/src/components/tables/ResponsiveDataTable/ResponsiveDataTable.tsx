'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  mobileHidden?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface ResponsiveDataTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  className?: string;
  mobileCardView?: boolean;
  sortable?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  initialSort?: {
    key: string;
    direction: 'asc' | 'desc';
  };
}

type SortDirection = 'asc' | 'desc' | null;

export function ResponsiveDataTable<T = any>({
  data,
  columns,
  loading = false,
  emptyMessage = 'ไม่พบข้อมูล',
  onRowClick,
  className,
  mobileCardView = true,
  sortable = false,
  onSort,
  initialSort
}: ResponsiveDataTableProps<T>) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: SortDirection;
  }>({
    key: initialSort?.key || '',
    direction: initialSort?.direction || null
  });

  // Filter columns for mobile view
  const visibleColumns = useMemo(() => {
    if (isMobile && mobileCardView) {
      return columns.filter(col => !col.mobileHidden);
    }
    return columns;
  }, [columns, isMobile, mobileCardView]);

  // Handle sorting
  const handleSort = (key: string) => {
    if (!sortable) return;

    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }

    setSortConfig({ key, direction });
    
    if (onSort && direction) {
      onSort(key, direction);
    }
  };

  // Sort data locally if no external sort handler
  const sortedData = useMemo(() => {
    if (!sortable || !sortConfig.direction || onSort) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key as keyof T];
      const bVal = b[sortConfig.key as keyof T];
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig, sortable, onSort]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {isMobile && mobileCardView ? (
          // Mobile loading cards
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))
        ) : (
          // Desktop loading table
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="animate-pulse">
              <div className="bg-gray-100 p-4">
                <div className="flex space-x-4">
                  {visibleColumns.map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded flex-1"></div>
                  ))}
                </div>
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border-t p-4">
                  <div className="flex space-x-4">
                    {visibleColumns.map((_, j) => (
                      <div key={j} className="h-4 bg-gray-200 rounded flex-1"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Empty state
  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <div className="text-gray-500 text-lg mb-2">📋</div>
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    );
  }

  // Mobile card view
  if (isMobile && mobileCardView) {
    return (
      <div className={cn('space-y-3', className)}>
        {sortedData.map((row, index) => (
          <div
            key={index}
            className={cn(
              'bg-white rounded-lg border p-4 transition-all duration-200',
              onRowClick && 'cursor-pointer hover:shadow-md hover:border-blue-300 active:scale-[0.98] touch-manipulation'
            )}
            onClick={() => onRowClick?.(row, index)}
            role={onRowClick ? 'button' : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onKeyDown={onRowClick ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onRowClick(row, index);
              }
            } : undefined}
          >
            <div className="space-y-2">
              {visibleColumns.map((column) => {
                const value = row[column.key as keyof T];
                const displayValue = column.render 
                  ? column.render(value, row, index)
                  : String(value || '-');

                return (
                  <div key={column.key} className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-600 flex-shrink-0 mr-3">
                      {column.label}:
                    </span>
                    <span className={cn(
                      'text-sm text-gray-900 text-right',
                      column.className
                    )}>
                      {displayValue}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className={cn('bg-white rounded-lg border overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary-600 text-white">
            <tr>
              {visibleColumns.map((column, index) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-left font-medium',
                    index === 0 && 'rounded-tl-lg',
                    index === visibleColumns.length - 1 && 'rounded-tr-lg',
                    sortable && column.sortable && 'cursor-pointer hover:bg-primary-700 select-none',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right'
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center justify-between">
                    <span>{column.label}</span>
                    {sortable && column.sortable && (
                      <span className="ml-2 text-xs">
                        {sortConfig.key === column.key ? (
                          sortConfig.direction === 'asc' ? '↑' : 
                          sortConfig.direction === 'desc' ? '↓' : '↕'
                        ) : '↕'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr
                key={index}
                className={cn(
                  'border-t border-gray-100 hover:bg-gray-50 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-blue-50'
                )}
                onClick={() => onRowClick?.(row, index)}
              >
                {visibleColumns.map((column) => {
                  const value = row[column.key as keyof T];
                  const displayValue = column.render 
                    ? column.render(value, row, index)
                    : String(value || '-');

                  return (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 py-3 text-sm text-gray-900',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        column.className
                      )}
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResponsiveDataTable;