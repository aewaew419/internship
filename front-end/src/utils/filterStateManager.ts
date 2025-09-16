import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// Generic filter state interface
export interface FilterState {
  [key: string]: string | number | boolean | undefined;
}

// Filter validation interface
export interface FilterValidation<T extends FilterState> {
  isValid: boolean;
  errors: string[];
  sanitizedFilters: T;
}

// Filter state manager configuration
export interface FilterStateConfig<T extends FilterState> {
  defaultFilters: T;
  urlParamPrefix?: string;
  validateFilters?: (filters: T) => FilterValidation<T>;
  debounceMs?: number;
  persistToUrl?: boolean;
}

// Hook for managing filter state with URL persistence
export function useFilterState<T extends FilterState>(
  config: FilterStateConfig<T>
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<T>(config.defaultFilters);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Load filters from URL on mount
  useEffect(() => {
    if (!config.persistToUrl) return;

    const urlFilters = { ...config.defaultFilters };
    let hasUrlParams = false;

    // Extract filter values from URL parameters
    Object.keys(config.defaultFilters).forEach(key => {
      const paramKey = config.urlParamPrefix ? `${config.urlParamPrefix}_${key}` : key;
      const urlValue = searchParams.get(paramKey);
      
      if (urlValue !== null) {
        hasUrlParams = true;
        // Type conversion based on default value type
        const defaultValue = config.defaultFilters[key];
        
        if (typeof defaultValue === 'number') {
          const numValue = Number(urlValue);
          if (!isNaN(numValue)) {
            urlFilters[key] = numValue as T[Extract<keyof T, string>];
          }
        } else if (typeof defaultValue === 'boolean') {
          urlFilters[key] = (urlValue === 'true') as T[Extract<keyof T, string>];
        } else {
          urlFilters[key] = urlValue as T[Extract<keyof T, string>];
        }
      }
    });

    if (hasUrlParams) {
      setFilters(urlFilters);
    }
  }, [searchParams, config.defaultFilters, config.urlParamPrefix, config.persistToUrl]);

  // Update URL when filters change
  useEffect(() => {
    if (!config.persistToUrl) return;

    const newSearchParams = new URLSearchParams(searchParams);
    let hasChanges = false;

    // Update URL parameters based on current filters
    Object.entries(filters).forEach(([key, value]) => {
      const paramKey = config.urlParamPrefix ? `${config.urlParamPrefix}_${key}` : key;
      const defaultValue = config.defaultFilters[key];
      
      // Only add to URL if different from default
      if (value !== defaultValue && value !== '' && value !== undefined) {
        newSearchParams.set(paramKey, String(value));
        hasChanges = true;
      } else {
        if (newSearchParams.has(paramKey)) {
          newSearchParams.delete(paramKey);
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [filters, searchParams, setSearchParams, config.defaultFilters, config.urlParamPrefix, config.persistToUrl]);

  // Validate filters when they change
  useEffect(() => {
    if (!config.validateFilters) return;

    setIsValidating(true);
    const validation = config.validateFilters(filters);
    setValidationErrors(validation.errors);
    setIsValidating(false);

    // Update filters with sanitized values if validation passed
    if (validation.isValid && JSON.stringify(validation.sanitizedFilters) !== JSON.stringify(filters)) {
      setFilters(validation.sanitizedFilters);
    }
  }, [filters, config.validateFilters]);

  // Apply filter changes
  const applyFilters = useCallback((newFilters: Partial<T>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Reset filters to default
  const resetFilters = useCallback(() => {
    setFilters(config.defaultFilters);
  }, [config.defaultFilters]);

  // Clear specific filter
  const clearFilter = useCallback((key: keyof T) => {
    setFilters(prev => ({ ...prev, [key]: config.defaultFilters[key] }));
  }, [config.defaultFilters]);

  // Check if filters are at default state
  const isDefaultState = useCallback(() => {
    return JSON.stringify(filters) === JSON.stringify(config.defaultFilters);
  }, [filters, config.defaultFilters]);

  // Get active filter count (non-default values)
  const activeFilterCount = useCallback(() => {
    return Object.entries(filters).filter(([key, value]) => {
      const defaultValue = config.defaultFilters[key];
      return value !== defaultValue && value !== '' && value !== undefined;
    }).length;
  }, [filters, config.defaultFilters]);

  return {
    filters,
    validationErrors,
    isValidating,
    applyFilters,
    resetFilters,
    clearFilter,
    isDefaultState,
    activeFilterCount
  };
}

// Debounced filter hook for search inputs
export function useDebouncedFilter<T>(
  value: T,
  delay: number,
  callback: (value: T) => void
) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  useEffect(() => {
    callback(debouncedValue);
  }, [debouncedValue, callback]);

  return debouncedValue;
}

// Filter preset management
export interface FilterPreset<T extends FilterState> {
  id: string;
  name: string;
  filters: T;
  isDefault?: boolean;
}

export function useFilterPresets<T extends FilterState>(
  storageKey: string,
  defaultPresets: FilterPreset<T>[] = []
) {
  const [presets, setPresets] = useState<FilterPreset<T>[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : defaultPresets;
    } catch {
      return defaultPresets;
    }
  });

  // Save presets to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(presets));
    } catch (error) {
      console.warn('Failed to save filter presets:', error);
    }
  }, [presets, storageKey]);

  const savePreset = useCallback((name: string, filters: T) => {
    const newPreset: FilterPreset<T> = {
      id: Date.now().toString(),
      name,
      filters
    };
    setPresets(prev => [...prev, newPreset]);
  }, []);

  const deletePreset = useCallback((id: string) => {
    setPresets(prev => prev.filter(preset => preset.id !== id));
  }, []);

  const updatePreset = useCallback((id: string, updates: Partial<FilterPreset<T>>) => {
    setPresets(prev => prev.map(preset => 
      preset.id === id ? { ...preset, ...updates } : preset
    ));
  }, []);

  return {
    presets,
    savePreset,
    deletePreset,
    updatePreset
  };
}