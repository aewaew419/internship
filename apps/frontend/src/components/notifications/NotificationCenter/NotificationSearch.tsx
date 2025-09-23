'use client';

import React, { forwardRef, useCallback, useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface NotificationSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export const NotificationSearch = forwardRef<HTMLInputElement, NotificationSearchProps>(
  ({ value, onChange, placeholder = 'Search notifications...', className = '', debounceMs = 300 }, ref) => {
    const [localValue, setLocalValue] = useState(value);

    // Debounce the search input
    useEffect(() => {
      const timer = setTimeout(() => {
        if (localValue !== value) {
          onChange(localValue);
        }
      }, debounceMs);

      return () => clearTimeout(timer);
    }, [localValue, onChange, value, debounceMs]);

    // Update local value when prop value changes
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(event.target.value);
    }, []);

    const handleClear = useCallback(() => {
      setLocalValue('');
      onChange('');
    }, [onChange]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        handleClear();
        (event.target as HTMLInputElement).blur();
      }
    }, [handleClear]);

    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <input
          ref={ref}
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        
        {localValue && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  }
);

NotificationSearch.displayName = 'NotificationSearch';