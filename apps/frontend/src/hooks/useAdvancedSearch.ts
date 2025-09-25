'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';

export interface SearchCriteria {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: string | string[] | number | Date;
  label?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  criteria: SearchCriteria[];
  category: 'roles' | 'calendar' | 'prefixes' | 'global';
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}

export interface SearchableField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  category: 'roles' | 'calendar' | 'prefixes' | 'system';
  options?: Array<{ value: string; label: string }>;
  searchable: boolean;
  filterable: boolean;
}

export interface SearchResult<T = any> {
  items: T[];
  totalCount: number;
  searchTime: number;
  suggestions?: string[];
  facets?: Record<string, Array<{ value: string; count: number }>>;
}

export interface UseAdvancedSearchOptions {
  searchableFields: SearchableField[];
  onSearch?: (criteria: SearchCriteria[], query?: string) => Promise<SearchResult>;
  debounceMs?: number;
  enableAutoComplete?: boolean;
  enableFacets?: boolean;
}

export const useAdvancedSearch = (options: UseAdvancedSearchOptions) => {
  const {
    searchableFields,
    onSearch,
    debounceMs = 300,
    enableAutoComplete = true,
    enableFacets = false
  } = options;

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult>({
    items: [],
    totalCount: 0,
    searchTime: 0
  });
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [autoCompleteResults, setAutoCompleteResults] = useState<string[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentCriteria, setCurrentCriteria] = useState<SearchCriteria[]>([]);

  // Load saved searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin-saved-searches');
      if (saved) {
        const parsedSaved = JSON.parse(saved).map((search: any) => ({
          ...search,
          createdAt: new Date(search.createdAt),
          lastUsed: search.lastUsed ? new Date(search.lastUsed) : undefined
        }));
        setSavedSearches(parsedSaved);
      }

      const history = localStorage.getItem('admin-search-history');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  }, []);

  // Save searches to localStorage
  const saveSavedSearches = useCallback((searches: SavedSearch[]) => {
    try {
      localStorage.setItem('admin-saved-searches', JSON.stringify(searches));
      setSavedSearches(searches);
    } catch (error) {
      console.error('Failed to save searches:', error);
    }
  }, []);

  const saveSearchHistory = useCallback((history: string[]) => {
    try {
      localStorage.setItem('admin-search-history', JSON.stringify(history));
      setSearchHistory(history);
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (criteria: SearchCriteria[], query?: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        if (!onSearch) return;

        setIsSearching(true);
        const startTime = Date.now();

        try {
          const results = await onSearch(criteria, query);
          const searchTime = Date.now() - startTime;
          
          setSearchResults({
            ...results,
            searchTime
          });

          // Add to search history if it's a text query
          if (query && query.trim()) {
            const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
            saveSearchHistory(newHistory);
          }
        } catch (error) {
          console.error('Search failed:', error);
          setSearchResults({
            items: [],
            totalCount: 0,
            searchTime: Date.now() - startTime
          });
        } finally {
          setIsSearching(false);
        }
      }, debounceMs);
    };
  }, [onSearch, debounceMs, searchHistory, saveSearchHistory]);

  // Execute search
  const executeSearch = useCallback((criteria: SearchCriteria[], query?: string) => {
    setCurrentQuery(query || '');
    setCurrentCriteria(criteria);
    debouncedSearch(criteria, query);
  }, [debouncedSearch]);

  // Save a search
  const saveSearch = useCallback((search: Omit<SavedSearch, 'id' | 'createdAt' | 'useCount'>) => {
    const newSearch: SavedSearch = {
      ...search,
      id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      useCount: 0
    };

    const updatedSearches = [...savedSearches, newSearch];
    saveSavedSearches(updatedSearches);
    return newSearch;
  }, [savedSearches, saveSavedSearches]);

  // Delete a saved search
  const deleteSavedSearch = useCallback((searchId: string) => {
    const updatedSearches = savedSearches.filter(search => search.id !== searchId);
    saveSavedSearches(updatedSearches);
  }, [savedSearches, saveSavedSearches]);

  // Load a saved search
  const loadSavedSearch = useCallback((search: SavedSearch) => {
    // Update use count and last used
    const updatedSearch = {
      ...search,
      useCount: search.useCount + 1,
      lastUsed: new Date()
    };

    const updatedSearches = savedSearches.map(s => 
      s.id === search.id ? updatedSearch : s
    );
    saveSavedSearches(updatedSearches);

    // Execute the search
    executeSearch(search.criteria);
  }, [savedSearches, saveSavedSearches, executeSearch]);

  // Get auto-complete suggestions
  const getAutoCompleteSuggestions = useCallback(async (query: string) => {
    if (!enableAutoComplete || !query.trim()) {
      setAutoCompleteResults([]);
      return;
    }

    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/admin/search/autocomplete?q=${encodeURIComponent(query)}`);
      // const suggestions = await response.json();

      // Mock auto-complete suggestions
      const mockSuggestions = [
        'นาย',
        'นาง', 
        'นางสาว',
        'ดร.',
        'ศาสตราจารย์',
        'รองศาสตราจารย์',
        'ผู้ช่วยศาสตราจารย์',
        'นักศึกษา',
        'อาจารย์',
        'ผู้ดูแลระบบ',
        'ภาคเรียนที่ 1',
        'ภาคเรียนที่ 2',
        'ภาคฤดูร้อน',
        'วันหยุดราชการ',
        'วันสงกรานต์'
      ].filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);

      setAutoCompleteResults(mockSuggestions);
    } catch (error) {
      console.error('Auto-complete failed:', error);
      setAutoCompleteResults([]);
    }
  }, [enableAutoComplete]);

  // Build search query for display
  const buildSearchQuery = useCallback((criteria: SearchCriteria[], query?: string) => {
    const parts = [];
    
    if (query) {
      parts.push(`ข้อความ: "${query}"`);
    }

    criteria.forEach(criterion => {
      const field = searchableFields.find(f => f.key === criterion.field);
      if (field) {
        const operatorLabels = {
          equals: 'เท่ากับ',
          contains: 'มีคำว่า',
          starts_with: 'เริ่มต้นด้วย',
          ends_with: 'ลงท้ายด้วย',
          greater_than: 'มากกว่า',
          less_than: 'น้อยกว่า',
          between: 'อยู่ระหว่าง',
          in: 'อยู่ใน',
          not_in: 'ไม่อยู่ใน'
        };

        const value = Array.isArray(criterion.value) 
          ? criterion.value.join(', ') 
          : criterion.value;

        parts.push(`${field.label} ${operatorLabels[criterion.operator]} ${value}`);
      }
    });

    return parts.join(' และ ');
  }, [searchableFields]);

  // Get search statistics
  const getSearchStats = useCallback(() => {
    const totalSavedSearches = savedSearches.length;
    const publicSearches = savedSearches.filter(s => s.isPublic).length;
    const mostUsedSearch = savedSearches.reduce((prev, current) => 
      (prev.useCount > current.useCount) ? prev : current, savedSearches[0]
    );

    return {
      totalSavedSearches,
      publicSearches,
      privateSearches: totalSavedSearches - publicSearches,
      mostUsedSearch,
      searchHistoryCount: searchHistory.length
    };
  }, [savedSearches, searchHistory]);

  // Clear search results
  const clearSearch = useCallback(() => {
    setSearchResults({
      items: [],
      totalCount: 0,
      searchTime: 0
    });
    setCurrentQuery('');
    setCurrentCriteria([]);
    setAutoCompleteResults([]);
  }, []);

  // Export saved searches
  const exportSavedSearches = useCallback(() => {
    const dataStr = JSON.stringify(savedSearches, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-saved-searches-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [savedSearches]);

  // Import saved searches
  const importSavedSearches = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSearches = JSON.parse(e.target?.result as string);
          const validSearches = importedSearches.filter((search: any) => 
            search.id && search.name && search.criteria && search.category
          ).map((search: any) => ({
            ...search,
            createdAt: new Date(search.createdAt),
            lastUsed: search.lastUsed ? new Date(search.lastUsed) : undefined
          }));

          const mergedSearches = [...savedSearches, ...validSearches];
          saveSavedSearches(mergedSearches);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }, [savedSearches, saveSavedSearches]);

  return {
    // State
    isSearching,
    searchResults,
    savedSearches,
    searchHistory,
    autoCompleteResults,
    currentQuery,
    currentCriteria,

    // Actions
    executeSearch,
    saveSearch,
    deleteSavedSearch,
    loadSavedSearch,
    getAutoCompleteSuggestions,
    clearSearch,
    exportSavedSearches,
    importSavedSearches,

    // Utilities
    buildSearchQuery,
    getSearchStats
  };
};

export default useAdvancedSearch;