'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BookmarkIcon,
  XMarkIcon,
  PlusIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { AdminModal } from './AdminModal';

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

export interface AdvancedSearchProps {
  searchableFields: SearchableField[];
  savedSearches: SavedSearch[];
  onSearch: (criteria: SearchCriteria[], query?: string) => void;
  onSaveSearch: (search: Omit<SavedSearch, 'id' | 'createdAt' | 'useCount'>) => void;
  onDeleteSavedSearch: (searchId: string) => void;
  onLoadSavedSearch: (search: SavedSearch) => void;
  placeholder?: string;
  className?: string;
}

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

const getOperatorsForType = (type: string) => {
  switch (type) {
    case 'text':
      return ['equals', 'contains', 'starts_with', 'ends_with', 'in', 'not_in'];
    case 'number':
      return ['equals', 'greater_than', 'less_than', 'between'];
    case 'date':
      return ['equals', 'greater_than', 'less_than', 'between'];
    case 'select':
      return ['equals', 'in', 'not_in'];
    case 'boolean':
      return ['equals'];
    default:
      return ['equals', 'contains'];
  }
};

const CriteriaBuilder: React.FC<{
  criteria: SearchCriteria[];
  searchableFields: SearchableField[];
  onChange: (criteria: SearchCriteria[]) => void;
}> = ({ criteria, searchableFields, onChange }) => {
  const addCriteria = () => {
    const newCriteria: SearchCriteria = {
      field: searchableFields[0]?.key || '',
      operator: 'contains',
      value: ''
    };
    onChange([...criteria, newCriteria]);
  };

  const updateCriteria = (index: number, updates: Partial<SearchCriteria>) => {
    const newCriteria = [...criteria];
    newCriteria[index] = { ...newCriteria[index], ...updates };
    onChange(newCriteria);
  };

  const removeCriteria = (index: number) => {
    onChange(criteria.filter((_, i) => i !== index));
  };

  const renderValueInput = (criterion: SearchCriteria, index: number) => {
    const field = searchableFields.find(f => f.key === criterion.field);
    if (!field) return null;

    switch (field.type) {
      case 'select':
        if (criterion.operator === 'in' || criterion.operator === 'not_in') {
          return (
            <select
              multiple
              value={Array.isArray(criterion.value) ? criterion.value : []}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                updateCriteria(index, { value: values });
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        } else {
          return (
            <select
              value={criterion.value as string}
              onChange={(e) => updateCriteria(index, { value: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">เลือก...</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        }

      case 'boolean':
        return (
          <select
            value={criterion.value as string}
            onChange={(e) => updateCriteria(index, { value: e.target.value === 'true' })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">เลือก...</option>
            <option value="true">ใช่</option>
            <option value="false">ไม่</option>
          </select>
        );

      case 'date':
        if (criterion.operator === 'between') {
          const values = Array.isArray(criterion.value) ? criterion.value : ['', ''];
          return (
            <div className="flex space-x-2">
              <input
                type="date"
                value={values[0] as string}
                onChange={(e) => {
                  const newValues = [...values];
                  newValues[0] = e.target.value;
                  updateCriteria(index, { value: newValues });
                }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              />
              <span className="self-center text-gray-500">ถึง</span>
              <input
                type="date"
                value={values[1] as string}
                onChange={(e) => {
                  const newValues = [...values];
                  newValues[1] = e.target.value;
                  updateCriteria(index, { value: newValues });
                }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          );
        } else {
          return (
            <input
              type="date"
              value={criterion.value as string}
              onChange={(e) => updateCriteria(index, { value: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          );
        }

      case 'number':
        if (criterion.operator === 'between') {
          const values = Array.isArray(criterion.value) ? criterion.value : [0, 0];
          return (
            <div className="flex space-x-2">
              <input
                type="number"
                value={values[0] as number}
                onChange={(e) => {
                  const newValues = [...values];
                  newValues[0] = parseFloat(e.target.value) || 0;
                  updateCriteria(index, { value: newValues });
                }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              />
              <span className="self-center text-gray-500">ถึง</span>
              <input
                type="number"
                value={values[1] as number}
                onChange={(e) => {
                  const newValues = [...values];
                  newValues[1] = parseFloat(e.target.value) || 0;
                  updateCriteria(index, { value: newValues });
                }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          );
        } else {
          return (
            <input
              type="number"
              value={criterion.value as number}
              onChange={(e) => updateCriteria(index, { value: parseFloat(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          );
        }

      default:
        if (criterion.operator === 'in' || criterion.operator === 'not_in') {
          return (
            <input
              type="text"
              value={Array.isArray(criterion.value) ? criterion.value.join(', ') : ''}
              onChange={(e) => {
                const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                updateCriteria(index, { value: values });
              }}
              placeholder="ค่าหลายค่า คั่นด้วยจุลภาค"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          );
        } else {
          return (
            <input
              type="text"
              value={criterion.value as string}
              onChange={(e) => updateCriteria(index, { value: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          );
        }
    }
  };

  return (
    <div className="space-y-3">
      {criteria.map((criterion, index) => {
        const field = searchableFields.find(f => f.key === criterion.field);
        const availableOperators = field ? getOperatorsForType(field.type) : [];

        return (
          <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <select
              value={criterion.field}
              onChange={(e) => {
                const newField = searchableFields.find(f => f.key === e.target.value);
                const newOperators = newField ? getOperatorsForType(newField.type) : [];
                updateCriteria(index, {
                  field: e.target.value,
                  operator: newOperators[0] as any,
                  value: ''
                });
              }}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              {searchableFields.map(field => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
            </select>

            <select
              value={criterion.operator}
              onChange={(e) => updateCriteria(index, { operator: e.target.value as any, value: '' })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              {availableOperators.map(op => (
                <option key={op} value={op}>
                  {operatorLabels[op as keyof typeof operatorLabels]}
                </option>
              ))}
            </select>

            <div className="flex-1">
              {renderValueInput(criterion, index)}
            </div>

            <button
              onClick={() => removeCriteria(index)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        );
      })}

      <button
        onClick={addCriteria}
        className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        <span>เพิ่มเงื่อนไข</span>
      </button>
    </div>
  );
};

const SavedSearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (search: Omit<SavedSearch, 'id' | 'createdAt' | 'useCount'>) => void;
  criteria: SearchCriteria[];
}> = ({ isOpen, onClose, onSave, criteria }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'roles' | 'calendar' | 'prefixes' | 'global'>('global');
  const [isPublic, setIsPublic] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      criteria,
      category,
      isPublic,
      createdBy: 'current-user', // In real app, get from auth context
      lastUsed: new Date()
    });

    setName('');
    setDescription('');
    setCategory('global');
    setIsPublic(false);
    onClose();
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="บันทึกการค้นหา"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ชื่อการค้นหา *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ตั้งชื่อการค้นหา"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            คำอธิบาย
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="อธิบายการค้นหานี้ (ไม่บังคับ)"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            หมวดหมู่
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="global">ทั่วไป</option>
            <option value="roles">บทบาท</option>
            <option value="calendar">ปฏิทิน</option>
            <option value="prefixes">คำนำหน้าชื่อ</option>
          </select>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">แชร์ให้ผู้ใช้อื่นใช้ได้</span>
          </label>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600 mb-2">เงื่อนไขการค้นหา:</p>
          <div className="text-xs text-gray-500">
            {criteria.length === 0 ? (
              <span>ไม่มีเงื่อนไข</span>
            ) : (
              criteria.map((c, i) => (
                <div key={i}>
                  {c.field} {operatorLabels[c.operator]} {Array.isArray(c.value) ? c.value.join(', ') : c.value}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            บันทึก
          </button>
        </div>
      </div>
    </AdminModal>
  );
};

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  searchableFields,
  savedSearches,
  onSearch,
  onSaveSearch,
  onDeleteSavedSearch,
  onLoadSavedSearch,
  placeholder = "ค้นหาข้อมูล...",
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [criteria, setCriteria] = useState<SearchCriteria[]>([]);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Group saved searches by category
  const groupedSavedSearches = useMemo(() => {
    return savedSearches.reduce((groups, search) => {
      if (!groups[search.category]) {
        groups[search.category] = [];
      }
      groups[search.category].push(search);
      return groups;
    }, {} as Record<string, SavedSearch[]>);
  }, [savedSearches]);

  // Handle search execution
  const handleSearch = useCallback(() => {
    onSearch(criteria, searchQuery);
    
    // Add to recent searches if it's a text query
    if (searchQuery.trim()) {
      setRecentSearches(prev => {
        const newRecent = [searchQuery, ...prev.filter(q => q !== searchQuery)].slice(0, 5);
        return newRecent;
      });
    }
  }, [criteria, searchQuery, onSearch]);

  // Handle Enter key in search input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Load saved search
  const handleLoadSavedSearch = (search: SavedSearch) => {
    setCriteria(search.criteria);
    setSearchQuery('');
    onLoadSavedSearch(search);
    setShowSavedSearches(false);
  };

  // Clear all filters
  const clearAll = () => {
    setSearchQuery('');
    setCriteria([]);
    onSearch([], '');
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Main Search Bar */}
      <div className="p-4">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-lg transition-colors ${
              isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="ตัวกรองขั้นสูง"
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowSavedSearches(!showSavedSearches)}
            className={`p-2 rounded-lg transition-colors ${
              showSavedSearches ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="การค้นหาที่บันทึกไว้"
          >
            <BookmarkIcon className="w-5 h-5" />
          </button>

          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ค้นหา
          </button>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && !isExpanded && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">ค้นหาล่าสุด:</p>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((query, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchQuery(query);
                    onSearch([], query);
                  }}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">ตัวกรองขั้นสูง</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSaveModal(true)}
                disabled={criteria.length === 0}
                className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
              >
                บันทึกการค้นหา
              </button>
              <button
                onClick={clearAll}
                className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                ล้างทั้งหมด
              </button>
            </div>
          </div>

          <CriteriaBuilder
            criteria={criteria}
            searchableFields={searchableFields}
            onChange={setCriteria}
          />
        </div>
      )}

      {/* Saved Searches */}
      {showSavedSearches && (
        <div className="border-t border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-4">การค้นหาที่บันทึกไว้</h3>
          
          {Object.keys(groupedSavedSearches).length === 0 ? (
            <p className="text-gray-500 text-center py-4">ยังไม่มีการค้นหาที่บันทึกไว้</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedSavedSearches).map(([category, searches]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {category === 'global' && 'ทั่วไป'}
                    {category === 'roles' && 'บทบาท'}
                    {category === 'calendar' && 'ปฏิทิน'}
                    {category === 'prefixes' && 'คำนำหน้าชื่อ'}
                  </h4>
                  <div className="space-y-2">
                    {searches.map(search => (
                      <div
                        key={search.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1 cursor-pointer" onClick={() => handleLoadSavedSearch(search)}>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{search.name}</span>
                            {search.isPublic && <StarIcon className="w-4 h-4 text-yellow-500" />}
                          </div>
                          {search.description && (
                            <p className="text-sm text-gray-600 mt-1">{search.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>ใช้ {search.useCount} ครั้ง</span>
                            {search.lastUsed && (
                              <span>ใช้ล่าสุด: {search.lastUsed.toLocaleDateString('th-TH')}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteSavedSearch(search.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {(criteria.length > 0 || searchQuery) && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">ตัวกรองที่ใช้:</span>
            <button
              onClick={clearAll}
              className="text-xs text-red-600 hover:text-red-700"
            >
              ล้างทั้งหมด
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                ข้อความ: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-1 hover:text-blue-600"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            {criteria.map((criterion, index) => {
              const field = searchableFields.find(f => f.key === criterion.field);
              return (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
                >
                  {field?.label}: {operatorLabels[criterion.operator]} {Array.isArray(criterion.value) ? criterion.value.join(', ') : criterion.value}
                  <button
                    onClick={() => setCriteria(criteria.filter((_, i) => i !== index))}
                    className="ml-1 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Save Search Modal */}
      <SavedSearchModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={onSaveSearch}
        criteria={criteria}
      />
    </div>
  );
};

export default AdvancedSearch;