"use client";

import { cn } from "@/lib/utils";
import { TableColumn } from "./ResponsiveTable";

export interface TableCardProps<T = any> {
  data: T;
  columns: TableColumn<T>[];
  index: number;
  onClick?: (data: T, index: number) => void;
  className?: string;
  layout?: "vertical" | "horizontal" | "grid";
  showAllColumns?: boolean;
  primaryColumn?: string;
  secondaryColumns?: string[];
}

export function TableCard<T = any>({
  data,
  columns,
  index,
  onClick,
  className,
  layout = "vertical",
  showAllColumns = false,
  primaryColumn,
  secondaryColumns = [],
}: TableCardProps<T>) {
  // Determine which columns to show
  const displayColumns = showAllColumns 
    ? columns 
    : columns.filter(col => 
        col.key === primaryColumn || 
        secondaryColumns.includes(col.key) || 
        (!col.mobileHidden && (col.priority || 999) <= 3)
      );

  const primaryCol = primaryColumn ? columns.find(col => col.key === primaryColumn) : displayColumns[0];
  const otherColumns = displayColumns.filter(col => col.key !== primaryCol?.key);

  const renderValue = (column: TableColumn<T>) => {
    const value = data[column.key];
    return column.render ? column.render(value, data, index) : value;
  };

  const cardClasses = cn(
    "bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200",
    onClick && "cursor-pointer hover:shadow-md hover:border-gray-300 touch-manipulation active:scale-[0.98]",
    className
  );

  if (layout === "horizontal") {
    return (
      <div 
        className={cardClasses}
        onClick={() => onClick?.(data, index)}
      >
        <div className="p-4 flex items-center justify-between">
          {primaryCol && (
            <div className="flex-1 min-w-0 mr-4">
              <div className="text-sm font-medium text-gray-900 truncate">
                {renderValue(primaryCol)}
              </div>
              {otherColumns.length > 0 && (
                <div className="text-sm text-gray-500 truncate">
                  {renderValue(otherColumns[0])}
                </div>
              )}
            </div>
          )}
          
          <div className="flex-shrink-0 text-right">
            {otherColumns.slice(1, 3).map((column) => (
              <div key={column.key} className="text-sm text-gray-900">
                {renderValue(column)}
              </div>
            ))}
          </div>
          
          {onClick && (
            <div className="ml-3 flex-shrink-0">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (layout === "grid") {
    return (
      <div 
        className={cardClasses}
        onClick={() => onClick?.(data, index)}
      >
        <div className="p-4">
          {primaryCol && (
            <div className="mb-3 pb-3 border-b border-gray-100">
              <div className="text-base font-semibold text-gray-900">
                {renderValue(primaryCol)}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            {otherColumns.map((column) => (
              <div key={column.key}>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  {column.label}
                </div>
                <div className="text-sm text-gray-900">
                  {renderValue(column)}
                </div>
              </div>
            ))}
          </div>
          
          {onClick && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default vertical layout
  return (
    <div 
      className={cardClasses}
      onClick={() => onClick?.(data, index)}
    >
      <div className="p-4">
        {primaryCol && (
          <div className="mb-3">
            <div className="text-base font-semibold text-gray-900">
              {renderValue(primaryCol)}
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          {otherColumns.map((column) => (
            <div key={column.key} className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-600 min-w-0 flex-shrink-0 mr-3">
                {column.label}:
              </span>
              <span className="text-sm text-gray-900 text-right min-w-0 flex-1">
                {renderValue(column)}
              </span>
            </div>
          ))}
        </div>
        
        {onClick && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}