'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  debounceMs?: number;
  showSearchButton?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = 'ค้นหา...',
  disabled = false,
  loading = false,
  debounceMs = 300,
  showSearchButton = false,
  className,
  size = 'md'
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced search
  const debouncedSearch = useCallback((searchValue: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onChange(searchValue);
      if (onSearch && !showSearchButton) {
        onSearch(searchValue);
      }
    }, debounceMs);
  }, [onChange, onSearch, debounceMs, showSearchButton]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedSearch(newValue);
  };

  const handleSearchClick = () => {
    if (onSearch) {
      onSearch(localValue);
    }
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    if (onSearch && !showSearchButton) {
      onSearch('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      e.preventDefault();
      onSearch(localValue);
    }
  };

  const sizeClasses = {
    sm: 'h-8 text-sm px-3',
    md: 'h-10 text-sm px-4',
    lg: 'h-12 text-base px-4'
  };

  return (
    <div className={cn('relative flex items-center', className)}>
      {/* Search Icon */}
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
        {loading ? (
          <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
      </div>

      {/* Input Field */}
      <input
        type="text"
        value={localValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || loading}
        className={cn(
          'w-full border border-gray-300 rounded-lg pl-10 pr-10 transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          'placeholder:text-gray-400',
          sizeClasses[size]
        )}
      />

      {/* Clear Button */}
      {localValue && !loading && (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 touch-manipulation"
          aria-label="ล้างการค้นหา"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Search Button */}
      {showSearchButton && (
        <button
          type="button"
          onClick={handleSearchClick}
          disabled={disabled || loading}
          className={cn(
            'ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg transition-all duration-200',
            'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'disabled:bg-gray-400 disabled:cursor-not-allowed',
            'touch-manipulation',
            sizeClasses[size].includes('h-8') && 'h-8 px-3 text-sm',
            sizeClasses[size].includes('h-12') && 'h-12 px-6'
          )}
        >
          ค้นหา
        </button>
      )}
    </div>
  );
};

export default SearchInput;