'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  UserIcon,
  Cog6ToothIcon,
  ClockIcon,
  ArrowRightIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { AdvancedSearch, SearchCriteria, SavedSearch, SearchableField } from './AdvancedSearch';
import { SmartFiltering } from './SmartFiltering';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import { useSmartFiltering } from '@/hooks/useSmartFiltering';
import Link from 'next/link';

export interface GlobalSearchResult {
  id: string;
  title: string;
  description: string;
  category: 'roles' | 'calendar' | 'prefixes' | 'users' | 'system';
  url: string;
  metadata?: Record<string, any>;
  relevanceScore: number;
  highlightedText?: string;
}

export interface GlobalSearchProps {
  onResultClick?: (result: GlobalSearchResult) => void;
  className?: string;
}

const categoryIcons = {
  roles: UserGroupIcon,
  calendar: CalendarDaysIcon,
  prefixes: UserIcon,
  users: UserIcon,
  system: Cog6ToothIcon
};

const categoryLabels = {
  roles: 'บทบาท',
  calendar: 'ปฏิทิน',
  prefixes: 'คำนำหน้าชื่อ',
  users: 'ผู้ใช้',
  system: 'ระบบ'
};

const categoryColors = {
  roles: 'bg-blue-50 text-blue-700 border-blue-200',
  calendar: 'bg-green-50 text-green-700 border-green-200',
  prefixes: 'bg-purple-50 text-purple-700 border-purple-200',
  users: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  system: 'bg-gray-50 text-gray-700 border-gray-200'
};

// Mock searchable fields for global search
const globalSearchableFields: SearchableField[] = [
  // Role fields
  { key: 'role.name', label: 'ชื่อบทบาท', type: 'text', category: 'roles', searchable: true, filterable: true },
  { key: 'role.displayName', label: 'ชื่อแสดงบทบาท', type: 'text', category: 'roles', searchable: true, filterable: true },
  { key: 'role.isSystem', label: 'บทบาทระบบ', type: 'boolean', category: 'roles', searchable: false, filterable: true },
  { key: 'role.userCount', label: 'จำนวนผู้ใช้', type: 'number', category: 'roles', searchable: false, filterable: true },

  // Calendar fields
  { key: 'calendar.name', label: 'ชื่อกิจกรรม', type: 'text', category: 'calendar', searchable: true, filterable: true },
  { key: 'calendar.type', label: 'ประเภท', type: 'select', category: 'calendar', searchable: false, filterable: true,
    options: [
      { value: 'semester', label: 'ภาคการศึกษา' },
      { value: 'holiday', label: 'วันหยุด' },
      { value: 'exam', label: 'การสอบ' },
      { value: 'registration', label: 'ลงทะเบียน' }
    ]
  },
  { key: 'calendar.startDate', label: 'วันที่เริ่ม', type: 'date', category: 'calendar', searchable: false, filterable: true },
  { key: 'calendar.academicYear', label: 'ปีการศึกษา', type: 'select', category: 'calendar', searchable: false, filterable: true,
    options: [
      { value: '2567', label: '2567' },
      { value: '2568', label: '2568' },
      { value: '2569', label: '2569' }
    ]
  },

  // Prefix fields
  { key: 'prefix.thai', label: 'คำนำหน้าไทย', type: 'text', category: 'prefixes', searchable: true, filterable: true },
  { key: 'prefix.english', label: 'คำนำหน้าอังกฤษ', type: 'text', category: 'prefixes', searchable: true, filterable: true },
  { key: 'prefix.category', label: 'หมวดหมู่', type: 'select', category: 'prefixes', searchable: false, filterable: true,
    options: [
      { value: 'academic', label: 'วิชาการ' },
      { value: 'professional', label: 'อาชีพ' },
      { value: 'honorary', label: 'กิตติมศักดิ์' },
      { value: 'religious', label: 'ศาสนา' }
    ]
  },
  { key: 'prefix.gender', label: 'เพศ', type: 'select', category: 'prefixes', searchable: false, filterable: true,
    options: [
      { value: 'male', label: 'ชาย' },
      { value: 'female', label: 'หญิง' },
      { value: 'neutral', label: 'ทั่วไป' }
    ]
  },

  // System fields
  { key: 'system.module', label: 'โมดูล', type: 'select', category: 'system', searchable: false, filterable: true,
    options: [
      { value: 'admin', label: 'ผู้ดูแลระบบ' },
      { value: 'roles', label: 'บทบาท' },
      { value: 'calendar', label: 'ปฏิทิน' },
      { value: 'prefixes', label: 'คำนำหน้าชื่อ' }
    ]
  }
];

const SearchResultItem: React.FC<{
  result: GlobalSearchResult;
  onClick?: (result: GlobalSearchResult) => void;
}> = ({ result, onClick }) => {
  const Icon = categoryIcons[result.category];
  const categoryColor = categoryColors[result.category];

  const handleClick = () => {
    if (onClick) {
      onClick(result);
    }
  };

  return (
    <div
      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Icon className="w-4 h-4 text-gray-500" />
            <span className={`text-xs px-2 py-1 rounded-full border ${categoryColor}`}>
              {categoryLabels[result.category]}
            </span>
            <span className="text-xs text-gray-500">
              คะแนน: {(result.relevanceScore * 100).toFixed(0)}%
            </span>
          </div>
          
          <h3 className="font-medium text-gray-900 mb-1">
            {result.highlightedText ? (
              <span dangerouslySetInnerHTML={{ __html: result.highlightedText }} />
            ) : (
              result.title
            )}
          </h3>
          
          <p className="text-sm text-gray-600 mb-2">{result.description}</p>
          
          {result.metadata && Object.keys(result.metadata).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.metadata).map(([key, value]) => (
                <span key={key} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {key}: {value}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <ArrowRightIcon className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
      </div>
    </div>
  );
};

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onResultClick,
  className = ''
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSmartFilters, setShowSmartFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock search function
  const mockSearch = useCallback(async (criteria: SearchCriteria[], query?: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock search results
    const mockResults: GlobalSearchResult[] = [
      {
        id: '1',
        title: 'นาย - คำนำหน้าชื่อ',
        description: 'คำนำหน้าชื่อสำหรับเพศชาย ประเภทอาชีพ',
        category: 'prefixes',
        url: '/admin/prefixes',
        metadata: { เพศ: 'ชาย', หมวดหมู่: 'อาชีพ' },
        relevanceScore: 0.95,
        highlightedText: query ? `<mark>${query}</mark>` : undefined
      },
      {
        id: '2',
        title: 'บทบาทนักศึกษา',
        description: 'บทบาทสำหรับนักศึกษาในระบบ มีสิทธิ์เข้าถึงข้อมูลส่วนตัวและการลงทะเบียน',
        category: 'roles',
        url: '/admin/roles',
        metadata: { ผู้ใช้: '150 คน', สิทธิ์: '8 รายการ' },
        relevanceScore: 0.88
      },
      {
        id: '3',
        title: 'ภาคเรียนที่ 1/2567',
        description: 'ภาคการศึกษาที่ 1 ปีการศึกษา 2567',
        category: 'calendar',
        url: '/admin/calendar',
        metadata: { 'วันเริ่ม': '1 มิ.ย. 2567', 'วันสิ้นสุด': '31 ต.ค. 2567' },
        relevanceScore: 0.82
      },
      {
        id: '4',
        title: 'วันสงกรานต์',
        description: 'วันหยุดราชการประจำปี 13-15 เมษายน',
        category: 'calendar',
        url: '/admin/calendar',
        metadata: { ประเภท: 'วันหยุดราชการ', ระยะเวลา: '3 วัน' },
        relevanceScore: 0.75
      },
      {
        id: '5',
        title: 'ดร. - คำนำหน้าชื่อ',
        description: 'คำนำหน้าชื่อสำหรับผู้ที่มีปริญญาเอก',
        category: 'prefixes',
        url: '/admin/prefixes',
        metadata: { เพศ: 'ทั่วไป', หมวดหมู่: 'วิชาการ' },
        relevanceScore: 0.70
      }
    ];

    // Filter by category if selected
    let filteredResults = mockResults;
    if (selectedCategory !== 'all') {
      filteredResults = mockResults.filter(result => result.category === selectedCategory);
    }

    // Filter by query if provided
    if (query && query.trim()) {
      filteredResults = filteredResults.filter(result =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply criteria filters
    if (criteria.length > 0) {
      // Mock criteria filtering
      filteredResults = filteredResults.filter(result => {
        return criteria.every(criterion => {
          // Simple mock filtering logic
          if (criterion.field.includes('category') && criterion.operator === 'equals') {
            return result.category === criterion.value;
          }
          return true;
        });
      });
    }

    // Sort by relevance score
    filteredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      items: filteredResults,
      totalCount: filteredResults.length,
      searchTime: Math.random() * 100 + 50, // Mock search time
      suggestions: query ? [`${query} ในบทบาท`, `${query} ในปฏิทิน`] : undefined,
      facets: {
        category: [
          { value: 'roles', count: 15 },
          { value: 'calendar', count: 23 },
          { value: 'prefixes', count: 18 },
          { value: 'system', count: 7 }
        ]
      }
    };
  }, [selectedCategory]);

  const {
    isSearching,
    searchResults,
    savedSearches,
    currentCriteria,
    executeSearch,
    saveSearch,
    deleteSavedSearch,
    loadSavedSearch,
    getAutoCompleteSuggestions,
    clearSearch
  } = useAdvancedSearch({
    searchableFields: globalSearchableFields,
    onSearch: mockSearch,
    enableAutoComplete: true,
    enableFacets: true
  });

  // Smart filtering hook
  const {
    smartSuggestions,
    learnFromUsage,
    saveFilterPreset,
    useFilterPreset
  } = useSmartFiltering({
    context: selectedCategory === 'all' ? 'global' : selectedCategory as any,
    enablePatternLearning: true,
    enableContextualSuggestions: true
  });

  const handleResultClick = (result: GlobalSearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      // Default behavior: navigate to the result URL
      window.location.href = result.url;
    }
  };

  // Handle smart filter application
  const handleSmartFilterApply = useCallback((criteria: SearchCriteria[]) => {
    executeSearch(criteria);
    learnFromUsage(criteria);
  }, [executeSearch, learnFromUsage]);

  // Handle filter preset save
  const handleFilterPresetSave = useCallback((preset: any) => {
    saveFilterPreset(preset);
  }, [saveFilterPreset]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Category Filter */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ทั้งหมด
        </button>
        {Object.entries(categoryLabels).map(([key, label]) => {
          const Icon = categoryIcons[key as keyof typeof categoryIcons];
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedCategory === key
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Interface */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">ค้นหาข้อมูลทั่วระบบ</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSmartFilters(!showSmartFilters)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                showSmartFilters
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <SparklesIcon className="w-4 h-4" />
              <span>ตัวกรองอัจฉริยะ</span>
            </button>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                showAdvanced
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FunnelIcon className="w-4 h-4" />
              <span>ค้นหาขั้นสูง</span>
            </button>
          </div>
        </div>

        {/* Smart Filtering */}
        {showSmartFilters && (
          <SmartFiltering
            currentContext={selectedCategory === 'all' ? 'global' : selectedCategory as any}
            currentCriteria={currentCriteria}
            onApplyFilter={handleSmartFilterApply}
            onSavePreset={handleFilterPresetSave}
          />
        )}

        <AdvancedSearch
          searchableFields={globalSearchableFields}
          savedSearches={savedSearches}
          onSearch={executeSearch}
          onSaveSearch={saveSearch}
          onDeleteSavedSearch={deleteSavedSearch}
          onLoadSavedSearch={loadSavedSearch}
          placeholder="ค้นหาบทบาท, ปฏิทิน, คำนำหน้าชื่อ, หรือข้อมูลอื่นๆ..."
        />
      </div>

      {/* Search Results */}
      {(searchResults.items.length > 0 || isSearching) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="font-medium text-gray-900">
                ผลการค้นหา {!isSearching && `(${searchResults.totalCount} รายการ)`}
              </h3>
              {!isSearching && searchResults.searchTime && (
                <span className="text-sm text-gray-500">
                  ใช้เวลา {searchResults.searchTime.toFixed(0)} มิลลิวินาที
                </span>
              )}
            </div>
            {searchResults.items.length > 0 && (
              <button
                onClick={clearSearch}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ล้างผลการค้นหา
              </button>
            )}
          </div>

          {isSearching ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                      <div className="w-16 h-4 bg-gray-200 rounded-full"></div>
                      <div className="w-12 h-4 bg-gray-200 rounded"></div>
                    </div>
                    <div className="w-3/4 h-5 bg-gray-200 rounded mb-2"></div>
                    <div className="w-full h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.items.map((result) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  onClick={handleResultClick}
                />
              ))}
            </div>
          )}

          {/* Search Suggestions */}
          {searchResults.suggestions && searchResults.suggestions.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">คำแนะนำการค้นหา:</h4>
              <div className="flex flex-wrap gap-2">
                {searchResults.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => executeSearch([], suggestion)}
                    className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Facets */}
          {searchResults.facets && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">กรองตามหมวดหมู่:</h4>
              <div className="flex flex-wrap gap-2">
                {searchResults.facets.category?.map((facet) => (
                  <button
                    key={facet.value}
                    onClick={() => setSelectedCategory(facet.value)}
                    className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {categoryLabels[facet.value as keyof typeof categoryLabels]} ({facet.count})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {!isSearching && searchResults.totalCount === 0 && searchResults.items.length === 0 && (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            เริ่มต้นการค้นหา
          </h3>
          <p className="text-gray-600">
            ใช้ช่องค้นหาด้านบนเพื่อค้นหาข้อมูลในระบบ
          </p>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;