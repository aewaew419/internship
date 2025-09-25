"use client";

import { useState, useMemo } from "react";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

export interface TableColumn<T> {
  key: keyof T;
  title: string;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  headerRender?: () => React.ReactNode;
}

export interface TableAction<T> {
  label: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick: (row: T) => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: (row: T) => boolean;
}

export interface AdminDataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  actions?: TableAction<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function AdminDataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  actions,
  onRowClick,
  emptyMessage = "No data available",
  className = "",
}: AdminDataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortOrder]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  if (loading) {
    return (
      <div className={`bg-white shadow rounded-lg ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? "cursor-pointer hover:bg-gray-100" : ""
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center space-x-1">
                    {column.headerRender ? column.headerRender() : <span>{column.title}</span>}
                    {column.sortable && (
                      <span className="flex flex-col">
                        <ChevronUpIcon
                          className={`h-3 w-3 ${
                            sortKey === column.key && sortOrder === "asc"
                              ? "text-red-600"
                              : "text-gray-400"
                          }`}
                        />
                        <ChevronDownIcon
                          className={`h-3 w-3 -mt-1 ${
                            sortKey === column.key && sortOrder === "desc"
                              ? "text-red-600"
                              : "text-gray-400"
                          }`}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions && actions.length > 0 ? 1 : 0)}
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 ${onRowClick ? "cursor-pointer" : ""}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render
                        ? column.render(row[column.key], row, index)
                        : String(row[column.key] || "")}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {actions.map((action, actionIndex) => {
                          const isDisabled = action.disabled?.(row) || false;
                          const buttonClass = `inline-flex items-center px-3 py-1 border text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            action.variant === "danger"
                              ? "border-red-300 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500"
                              : action.variant === "primary"
                              ? "border-red-300 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500"
                              : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500"
                          } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`;

                          return (
                            <button
                              key={actionIndex}
                              className={buttonClass}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isDisabled) {
                                  action.onClick(row);
                                }
                              }}
                              disabled={isDisabled}
                            >
                              {action.icon && (
                                <action.icon className="h-4 w-4 mr-1" />
                              )}
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}