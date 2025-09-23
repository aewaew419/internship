'use client';

import { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
}

interface MobileSearchProps {
  onSearch: (query: string) => Promise<SearchResult[]>;
  placeholder?: string;
  recentSearches?: string[];
  onRecentSearchClick?: (query: string) => void;
  onClearRecent?: () => void;
}

export const MobileSearch = ({
  onSearch,
  placeholder = 'ค้นหา...',
  recentSearches = [],
  onRecentSearchClick,
  onClearRecent
}: MobileSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRecent, setShowRecent] = useState(true);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim()) {
      setShowRecent(false);
      
      // Debounce search
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      
      searchTimeout.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const searchResults = await onSearch(query);
          setResults(searchResults);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setResults([]);
      setShowRecent(true);
      setIsLoading(false);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query, onSearch]);

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setShowRecent(true);
  };

  const handleRecentClick = (recentQuery: string) => {
    setQuery(recentQuery);
    if (onRecentSearchClick) {
      onRecentSearchClick(recentQuery);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'documents': 'bg-blue-100 text-blue-800',
      'requests': 'bg-green-100 text-green-800',
      'notifications': 'bg-orange-100 text-orange-800',
      'settings': 'bg-gray-100 text-gray-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.default;
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 w-full bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 text-left transition-colors md:max-w-md"
      >
        <MagnifyingGlassIcon className="w-4 h-4 text-gray-500" />
        <span className="text-gray-500 text-sm">{placeholder}</span>
      </button>

      {/* Full Screen Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col md:hidden">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleClose}
              className="text-blue-600 font-medium px-2 py-1"
            >
              ยกเลิก
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">กำลังค้นหา...</span>
              </div>
            )}

            {/* Recent Searches */}
            {showRecent && recentSearches.length > 0 && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">ค้นหาล่าสุด</h3>
                  {onClearRecent && (
                    <button
                      onClick={onClearRecent}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      ล้างทั้งหมด
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {recentSearches.map((recent, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentClick(recent)}
                      className="flex items-center gap-3 w-full p-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <ClockIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">{recent}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {results.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  ผลการค้นหา ({results.length})
                </h3>
                <div className="space-y-3">
                  {results.map((result) => (
                    <a
                      key={result.id}
                      href={result.url}
                      className="block p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                      onClick={handleClose}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                          {result.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getCategoryColor(result.category)}`}>
                          {result.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {result.description}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {query && !isLoading && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ไม่พบผลการค้นหา
                </h3>
                <p className="text-gray-500 text-center">
                  ลองใช้คำค้นหาอื่น หรือตรวจสอบการสะกดคำ
                </p>
              </div>
            )}

            {/* Search Tips */}
            {!query && !showRecent && (
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">เคล็ดลับการค้นหา</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• ใช้คำสำคัญที่เกี่ยวข้องกับสิ่งที่ต้องการหา</p>
                  <p>• ลองค้นหาด้วยชื่อเอกสารหรือประเภทคำร้อง</p>
                  <p>• ใช้คำค้นหาสั้นๆ เพื่อผลลัพธ์ที่ดีกว่า</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};