"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export interface TableColumn<T = any> {
  key: string;
  label: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  mobileHidden?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  priority?: number; // Lower numbers have higher priority on mobile
}

export interface ResponsiveTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (row: T, index: number) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  mobileBreakpoint?: number;
  showMobileCards?: boolean;
  sortable?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
}

export function ResponsiveTable<T = any>({
  data,
  columns,
  onRowClick,
  loading = false,
  emptyMessage = "No data available",
  className,
  mobileBreakpoint = 768,
  showMobileCards = true,
  sortable = false,
  onSort,
  defaultSort,
}: ResponsiveTableProps<T>) {
  const isMobile = useMediaQuery(`(max-width: ${mobileBreakpoint}px)`);
  const [sortConfig, setSortConfig] = useState(defaultSort);

  // Filter columns based on mobile visibility and priority
  const visibleColumns = useMemo(() => {
    if (!isMobile) return columns;
    
    const mobileColumns = columns
      .filter(col => !col.mobileHidden)
      .sort((a, b) => (a.priority || 999) - (b.priority || 999));
    
    // Show top 3 priority columns on mobile
    return mobileColumns.slice(0, 3);
  }, [columns, isMobile]);

  const handleSort = (key: string) => {
    if (!sortable) return;
    
    const direction = sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
    onSort?.(key, direction);
  };

  const renderSortIcon = (column: TableColumn<T>) => {
    if (!sortable || !column.sortable) return null;
    
    const isActive = sortConfig?.key === column.key;
    const direction = sortConfig?.direction;
    
    return (
      <span className="ml-1 inline-flex flex-col">
        <svg 
          className={cn(
            "w-3 h-3 -mb-1",
            isActive && direction === 'asc' ? "text-primary-600" : "text-gray-400"
          )} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
        <svg 
          className={cn(
            "w-3 h-3 rotate-180",
            isActive && direction === 'desc' ? "text-primary-600" : "text-gray-400"
          )} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full text-center py-12">
        <div className="text-gray-500 text-lg mb-2">📋</div>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // Mobile card view
  if (isMobile && showMobileCards) {
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((row, index) => (
          <div
            key={index}
            className={cn(
              "bg-white rounded-lg border border-gray-200 p-4 shadow-sm",
              onRowClick && "cursor-pointer hover:shadow-md transition-shadow touch-manipulation"
            )}
            onClick={() => onRowClick?.(row, index)}
          >
            <div className="space-y-2">
              {visibleColumns.map((column) => {
                const value = row[column.key];
                const displayValue = column.render ? column.render(value, row, index) : value;
                
                return (
                  <div key={column.key} className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-600 min-w-0 flex-shrink-0 mr-3">
                      {column.label}:
                    </span>
                    <span className="text-sm text-gray-900 text-right min-w-0 flex-1">
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
    <div className={cn("w-full overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left text-sm font-semibold text-gray-900",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.sortable && sortable && "cursor-pointer hover:bg-gray-100 select-none",
                    column.width && `w-[${column.width}]`
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.label}
                    {renderSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={index}
                className={cn(
                  "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row, index)}
              >
                {visibleColumns.map((column) => {
                  const value = row[column.key];
                  const displayValue = column.render ? column.render(value, row, index) : value;
                  
                  return (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3 text-sm text-gray-900",
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right"
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