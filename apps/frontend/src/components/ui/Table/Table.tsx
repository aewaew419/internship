"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ResponsiveTable, TableColumn } from "./ResponsiveTable";
import { MobileTable } from "./MobileTable";
import { TableCard } from "./TableCard";

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (row: T, index: number) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  
  // Responsive behavior
  mobileBreakpoint?: number;
  mobileView?: "cards" | "horizontal-scroll" | "auto";
  cardLayout?: "vertical" | "horizontal" | "grid";
  
  // Sorting
  sortable?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
  
  // Pagination
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  
  // Selection
  selectable?: boolean;
  selectedRows?: number[];
  onSelectionChange?: (selectedRows: number[]) => void;
  
  // Actions
  actions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: (row: T, index: number) => void;
    variant?: "primary" | "secondary" | "danger";
  }[];
}

export function Table<T = any>({
  data,
  columns,
  onRowClick,
  loading = false,
  emptyMessage = "No data available",
  className,
  mobileBreakpoint = 768,
  mobileView = "auto",
  cardLayout = "vertical",
  sortable = false,
  onSort,
  defaultSort,
  pagination,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  actions = [],
}: TableProps<T>) {
  const isMobile = useMediaQuery(`(max-width: ${mobileBreakpoint}px)`);
  const [viewMode, setViewMode] = useState<"table" | "cards" | "scroll">("table");

  // Add selection column if selectable
  const enhancedColumns: TableColumn<T>[] = [
    ...(selectable ? [{
      key: '__selection__',
      label: (
        <input
          type="checkbox"
          checked={selectedRows.length === data.length && data.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              onSelectionChange?.(data.map((_, index) => index));
            } else {
              onSelectionChange?.([]);
            }
          }}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
      ),
      render: (_, __, index) => (
        <input
          type="checkbox"
          checked={selectedRows.includes(index)}
          onChange={(e) => {
            if (e.target.checked) {
              onSelectionChange?.([...selectedRows, index]);
            } else {
              onSelectionChange?.(selectedRows.filter(i => i !== index));
            }
          }}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
      ),
      width: '50px',
      mobileHidden: true,
    }] : []),
    ...columns,
    ...(actions.length > 0 ? [{
      key: '__actions__',
      label: 'Actions',
      render: (_, row: T, index: number) => (
        <div className="flex gap-2">
          {actions.map((action, actionIndex) => (
            <button
              key={actionIndex}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(row, index);
              }}
              className={cn(
                "px-2 py-1 text-xs rounded transition-colors",
                action.variant === "danger" && "bg-red-100 text-red-700 hover:bg-red-200",
                action.variant === "secondary" && "bg-gray-100 text-gray-700 hover:bg-gray-200",
                (!action.variant || action.variant === "primary") && "bg-primary-100 text-primary-700 hover:bg-primary-200"
              )}
            >
              {action.icon && <span className="mr-1">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      ),
      width: `${actions.length * 80}px`,
      mobileHidden: true,
    }] : []),
  ];

  // Determine which view to use
  const effectiveViewMode = (() => {
    if (!isMobile) return "table";
    
    if (mobileView === "cards") return "cards";
    if (mobileView === "horizontal-scroll") return "scroll";
    
    // Auto mode: use cards for complex tables, scroll for simple ones
    return columns.length > 4 ? "cards" : "scroll";
  })();

  const renderPagination = () => {
    if (!pagination) return null;
    
    const { currentPage, totalPages, onPageChange } = pagination;
    
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex items-center text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const renderViewToggle = () => {
    if (!isMobile) return null;
    
    return (
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-600">View:</span>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            onClick={() => setViewMode("cards")}
            className={cn(
              "px-3 py-1 text-sm transition-colors",
              viewMode === "cards" ? "bg-primary-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
            )}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode("scroll")}
            className={cn(
              "px-3 py-1 text-sm transition-colors border-l border-gray-300",
              viewMode === "scroll" ? "bg-primary-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
            )}
          >
            Table
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("w-full", className)}>
      {renderViewToggle()}
      
      {effectiveViewMode === "cards" || viewMode === "cards" ? (
        <div className="space-y-3">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">📋</div>
              <p className="text-gray-500">{emptyMessage}</p>
            </div>
          ) : (
            data.map((row, index) => (
              <TableCard
                key={index}
                data={row}
                columns={columns}
                index={index}
                onClick={onRowClick}
                layout={cardLayout}
              />
            ))
          )}
        </div>
      ) : effectiveViewMode === "scroll" || viewMode === "scroll" ? (
        <MobileTable
          data={data}
          columns={enhancedColumns}
          onRowClick={onRowClick}
          loading={loading}
          emptyMessage={emptyMessage}
        />
      ) : (
        <ResponsiveTable
          data={data}
          columns={enhancedColumns}
          onRowClick={onRowClick}
          loading={loading}
          emptyMessage={emptyMessage}
          mobileBreakpoint={mobileBreakpoint}
          showMobileCards={false}
          sortable={sortable}
          onSort={onSort}
          defaultSort={defaultSort}
        />
      )}
      
      {renderPagination()}
    </div>
  );
}