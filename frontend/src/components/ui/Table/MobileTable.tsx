"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TableColumn } from "./ResponsiveTable";

export interface MobileTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (row: T, index: number) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  showScrollIndicator?: boolean;
}

export function MobileTable<T = any>({
  data,
  columns,
  onRowClick,
  loading = false,
  emptyMessage = "No data available",
  className,
  showScrollIndicator = true,
}: MobileTableProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScrollability();
    const scrollElement = scrollRef.current;
    
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      
      return () => {
        scrollElement.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [data]);

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

  return (
    <div className={cn("relative w-full", className)}>
      {/* Scroll indicators */}
      {showScrollIndicator && (
        <>
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none flex items-center">
              <svg className="w-4 h-4 text-gray-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none flex items-center justify-end">
              <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </>
      )}

      {/* Scrollable table container */}
      <div 
        ref={scrollRef}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        style={{ 
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
        }}
      >
        <table className="w-full border-collapse bg-white min-w-max">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 sticky top-0 z-5">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-3 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.width && `w-[${column.width}]`
                  )}
                  style={{ minWidth: column.width || '120px' }}
                >
                  {column.label}
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
                  onRowClick && "cursor-pointer touch-manipulation"
                )}
                onClick={() => onRowClick?.(row, index)}
              >
                {columns.map((column) => {
                  const value = row[column.key];
                  const displayValue = column.render ? column.render(value, row, index) : value;
                  
                  return (
                    <td
                      key={column.key}
                      className={cn(
                        "px-3 py-3 text-sm text-gray-900 whitespace-nowrap",
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right"
                      )}
                      style={{ minWidth: column.width || '120px' }}
                    >
                      <div className="max-w-[200px] truncate" title={typeof displayValue === 'string' ? displayValue : undefined}>
                        {displayValue}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Scroll hint for first-time users */}
      {showScrollIndicator && canScrollRight && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          ← Swipe to see more columns →
        </div>
      )}
    </div>
  );
}