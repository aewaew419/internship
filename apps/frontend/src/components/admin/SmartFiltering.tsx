'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  FunnelIcon,
  SparklesIcon,
  ClockIcon,
  StarIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  LightBulbIcon,
  BookmarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { SearchCriteria } from './AdvancedSearch';

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  criteria: SearchCriteria[];
  category: 'common' | 'recent' | 'suggested' | 'custom';
  useCount: number;
  lastUsed?: Date;
  isPublic: boolean;
  tags: string[];
}

export interface FilterSuggestion {
  id: string;
  title: string;
  description: string;
  criteria: SearchCriteria[];
  confidence: number;
  reason: string;
  category: 'pattern' | 'context' | 'trending' | 'similar';
}

export interface SmartFilteringProps {
  currentContext: 'roles' | 'calendar' | 'prefixes' | 'global';
  currentCriteria: SearchCriteria[];
  userPatterns?: Array<{
    criteria: SearchCriteria[];
    frequency: number;
    lastUsed: Date;
  }>;
  onApplyFilter: (criteria: SearchCriteria[]) => void;
  onSavePreset: (preset: Omit<FilterPreset, 'id' | 'useCount' | 'lastUsed'>) => void;
  className?: string;
}

const SmartFilteringComponent: React.FC<SmartFilteringProps> = ({
  currentContext,
  currentCriteria,
  userPatterns = [],
  onApplyFilter,
  onSavePreset,
  className = ''
}) => {
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showPresets, setShowPresets] = useState(false);
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([]);

  // Mock filter presets based on context
  const contextPresets = useMemo(() => {
    const basePresets: Record<string, FilterPreset[]> = {
      roles: [
        {
          id: 'active-roles',
          name: 'บทบาทที่ใช้งาน',
          description: 'บทบาทที่มีผู้ใช้งานอยู่',
          criteria: [
            { field: 'role.userCount', operator: 'greater_than', value: 0 }
          ],
          category: 'common',
          useCount: 45,
          lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          isPublic: true,
          tags: ['บทบาท', 'ใช้งาน']
        },
        {
          id: 'system-roles',
          name: 'บทบาทระบบ',
          description: 'บทบาทที่เป็นของระบบ',
          criteria: [
            { field: 'role.isSystem', operator: 'equals', value: true }
          ],
          category: 'common',
          useCount: 23,
          isPublic: true,
          tags: ['บทบาท', 'ระบบ']
        },
        {
          id: 'high-permission-roles',
          name: 'บทบาทสิทธิ์สูง',
          description: 'บทบาทที่มีสิทธิ์มากกว่า 10 รายการ',
          criteria: [
            { field: 'role.permissionCount', operator: 'greater_than', value: 10 }
          ],
          category: 'suggested',
          useCount: 12,
          isPublic: true,
          tags: ['บทบาท', 'สิทธิ์']
        }
      ],
      calendar: [
        {
          id: 'current-semester',
          name: 'ภาคการศึกษาปัจจุบัน',
          description: 'ภาคการศึกษาที่กำลังดำเนินการ',
          criteria: [
            { field: 'calendar.type', operator: 'equals', value: 'semester' },
            { field: 'calendar.isActive', operator: 'equals', value: true }
          ],
          category: 'common',
          useCount: 67,
          lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          isPublic: true,
          tags: ['ปฏิทิน', 'ภาคการศึกษา']
        },
        {
          id: 'upcoming-holidays',
          name: 'วันหยุดที่จะมาถึง',
          description: 'วันหยุดในอนาคต 30 วัน',
          criteria: [
            { field: 'calendar.type', operator: 'equals', value: 'holiday' },
            { field: 'calendar.startDate', operator: 'greater_than', value: new Date().toISOString().split('T')[0] }
          ],
          category: 'common',
          useCount: 34,
          isPublic: true,
          tags: ['ปฏิทิน', 'วันหยุด']
        },
        {
          id: 'exam-periods',
          name: 'ช่วงสอบ',
          description: 'ช่วงเวลาการสอบทั้งหมด',
          criteria: [
            { field: 'calendar.type', operator: 'equals', value: 'exam' }
          ],
          category: 'common',
          useCount: 28,
          isPublic: true,
          tags: ['ปฏิทิน', 'สอบ']
        }
      ],
      prefixes: [
        {
          id: 'academic-prefixes',
          name: 'คำนำหน้าวิชาการ',
          description: 'คำนำหน้าชื่อประเภทวิชาการ',
          criteria: [
            { field: 'prefix.category', operator: 'equals', value: 'academic' }
          ],
          category: 'common',
          useCount: 41,
          isPublic: true,
          tags: ['คำนำหน้า', 'วิชาการ']
        },
        {
          id: 'default-prefixes',
          name: 'คำนำหน้าเริ่มต้น',
          description: 'คำนำหน้าชื่อที่เป็นค่าเริ่มต้น',
          criteria: [
            { field: 'prefix.isDefault', operator: 'equals', value: true }
          ],
          category: 'common',
          useCount: 56,
          lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          isPublic: true,
          tags: ['คำนำหน้า', 'เริ่มต้น']
        },
        {
          id: 'gender-neutral-prefixes',
          name: 'คำนำหน้าเพศทั่วไป',
          description: 'คำนำหน้าชื่อที่ใช้ได้ทุกเพศ',
          criteria: [
            { field: 'prefix.gender', operator: 'equals', value: 'neutral' }
          ],
          category: 'suggested',
          useCount: 19,
          isPublic: true,
          tags: ['คำนำหน้า', 'เพศ']
        }
      ],
      global: [
        {
          id: 'recent-changes',
          name: 'เปลี่ยนแปลงล่าสุด',
          description: 'ข้อมูลที่มีการเปลี่ยนแปลงใน 7 วันที่ผ่านมา',
          criteria: [
            { field: 'updatedAt', operator: 'greater_than', value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
          ],
          category: 'common',
          useCount: 89,
          lastUsed: new Date(Date.now() - 1 * 60 * 60 * 1000),
          isPublic: true,
          tags: ['ทั่วไป', 'ล่าสุด']
        },
        {
          id: 'active-items',
          name: 'รายการที่ใช้งาน',
          description: 'รายการที่อยู่ในสถานะใช้งาน',
          criteria: [
            { field: 'isActive', operator: 'equals', value: true }
          ],
          category: 'common',
          useCount: 123,
          isPublic: true,
          tags: ['ทั่วไป', 'ใช้งาน']
        }
      ]
    };

    return basePresets[currentContext] || [];
  }, [currentContext]);

  // Generate smart suggestions based on context and patterns
  const smartSuggestions = useMemo((): FilterSuggestion[] => {
    const suggestions: FilterSuggestion[] = [];

    // Pattern-based suggestions
    if (userPatterns.length > 0) {
      const frequentPatterns = userPatterns
        .filter(pattern => pattern.frequency > 2)
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 3);

      frequentPatterns.forEach((pattern, index) => {
        suggestions.push({
          id: `pattern-${index}`,
          title: 'ตัวกรองที่คุณใช้บ่อย',
          description: `คุณใช้ตัวกรองนี้ ${pattern.frequency} ครั้ง`,
          criteria: pattern.criteria,
          confidence: Math.min(0.9, pattern.frequency / 10),
          reason: 'ตามรูปแบบการใช้งานของคุณ',
          category: 'pattern'
        });
      });
    }

    // Context-based suggestions
    const contextSuggestions: Record<string, FilterSuggestion[]> = {
      roles: [
        {
          id: 'roles-with-conflicts',
          title: 'บทบาทที่มีข้อขัดแย้ง',
          description: 'บทบาทที่อาจมีปัญหาด้านสิทธิ์',
          criteria: [
            { field: 'role.hasConflicts', operator: 'equals', value: true }
          ],
          confidence: 0.8,
          reason: 'ตรวจพบปัญหาในระบบ',
          category: 'context'
        },
        {
          id: 'unused-roles',
          title: 'บทบาทที่ไม่มีผู้ใช้',
          description: 'บทบาทที่อาจไม่จำเป็น',
          criteria: [
            { field: 'role.userCount', operator: 'equals', value: 0 }
          ],
          confidence: 0.7,
          reason: 'เพื่อการจัดการที่ดีขึ้น',
          category: 'context'
        }
      ],
      calendar: [
        {
          id: 'overlapping-events',
          title: 'กิจกรรมที่ซ้อนทับ',
          description: 'กิจกรรมที่อาจมีปัญหาด้านเวลา',
          criteria: [
            { field: 'calendar.hasConflicts', operator: 'equals', value: true }
          ],
          confidence: 0.85,
          reason: 'ตรวจพบความขัดแย้งในปฏิทิน',
          category: 'context'
        },
        {
          id: 'this-month-events',
          title: 'กิจกรรมเดือนนี้',
          description: 'กิจกรรมที่จะเกิดขึ้นในเดือนนี้',
          criteria: [
            { field: 'calendar.startDate', operator: 'between', value: [
              new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
              new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
            ]}
          ],
          confidence: 0.75,
          reason: 'ตามช่วงเวลาปัจจุบัน',
          category: 'context'
        }
      ],
      prefixes: [
        {
          id: 'unassigned-prefixes',
          title: 'คำนำหน้าที่ไม่ได้กำหนดบทบาท',
          description: 'คำนำหน้าที่อาจต้องการการกำหนด',
          criteria: [
            { field: 'prefix.assignedRoles', operator: 'equals', value: 0 }
          ],
          confidence: 0.7,
          reason: 'เพื่อความสมบูรณ์ของระบบ',
          category: 'context'
        },
        {
          id: 'gender-mismatched',
          title: 'คำนำหน้าที่อาจไม่เหมาะสมกับเพศ',
          description: 'คำนำหน้าที่อาจต้องตรวจสอบ',
          criteria: [
            { field: 'prefix.hasGenderConflict', operator: 'equals', value: true }
          ],
          confidence: 0.8,
          reason: 'ตรวจพบความไม่สอดคล้อง',
          category: 'context'
        }
      ]
    };

    suggestions.push(...(contextSuggestions[currentContext] || []));

    // Trending suggestions (mock)
    if (currentContext === 'global') {
      suggestions.push({
        id: 'trending-search',
        title: 'การค้นหายอดนิยม',
        description: 'ตัวกรองที่ผู้ใช้อื่นใช้บ่อยในสัปดาห์นี้',
        criteria: [
          { field: 'category', operator: 'in', value: ['academic', 'professional'] }
        ],
        confidence: 0.6,
        reason: 'ตามแนวโน้มการใช้งาน',
        category: 'trending'
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }, [currentContext, userPatterns]);

  // Apply filter preset
  const applyPreset = useCallback((preset: FilterPreset) => {
    onApplyFilter(preset.criteria);
    
    // Update usage statistics
    const updatedPresets = filterPresets.map(p => 
      p.id === preset.id 
        ? { ...p, useCount: p.useCount + 1, lastUsed: new Date() }
        : p
    );
    setFilterPresets(updatedPresets);
  }, [onApplyFilter, filterPresets]);

  // Apply suggestion
  const applySuggestion = useCallback((suggestion: FilterSuggestion) => {
    onApplyFilter(suggestion.criteria);
  }, [onApplyFilter]);

  // Save current criteria as preset
  const saveCurrentAsPreset = useCallback(() => {
    if (currentCriteria.length === 0) return;

    const presetName = prompt('ตั้งชื่อตัวกรองนี้:');
    if (!presetName) return;

    const newPreset: Omit<FilterPreset, 'id' | 'useCount' | 'lastUsed'> = {
      name: presetName,
      description: `ตัวกรองที่บันทึกจาก ${currentContext}`,
      criteria: currentCriteria,
      category: 'custom',
      isPublic: false,
      tags: [currentContext]
    };

    onSavePreset(newPreset);
  }, [currentCriteria, currentContext, onSavePreset]);

  const getSuggestionIcon = (category: string) => {
    switch (category) {
      case 'pattern': return ClockIcon;
      case 'context': return LightBulbIcon;
      case 'trending': return StarIcon;
      case 'similar': return ArrowPathIcon;
      default: return SparklesIcon;
    }
  };

  const getPresetIcon = (category: string) => {
    switch (category) {
      case 'common': return StarIcon;
      case 'recent': return ClockIcon;
      case 'suggested': return LightBulbIcon;
      case 'custom': return BookmarkIcon;
      default: return FunnelIcon;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">ตัวกรองอัจฉริยะ</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className={`text-sm px-3 py-1 rounded-lg transition-colors ${
              showSuggestions ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            คำแนะนำ
          </button>
          <button
            onClick={() => setShowPresets(!showPresets)}
            className={`text-sm px-3 py-1 rounded-lg transition-colors ${
              showPresets ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            ตัวกรองสำเร็จรูป
          </button>
          {currentCriteria.length > 0 && (
            <button
              onClick={saveCurrentAsPreset}
              className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              บันทึกตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Smart Suggestions */}
      {showSuggestions && smartSuggestions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <LightBulbIcon className="w-4 h-4 mr-2 text-yellow-500" />
            คำแนะนำตัวกรองสำหรับคุณ
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {smartSuggestions.map((suggestion) => {
              const Icon = getSuggestionIcon(suggestion.category);
              return (
                <div
                  key={suggestion.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => applySuggestion(suggestion)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-sm">{suggestion.title}</span>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                  <p className="text-xs text-gray-500">{suggestion.reason}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Presets */}
      {showPresets && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <FunnelIcon className="w-4 h-4 mr-2 text-blue-500" />
            ตัวกรองสำเร็จรูป - {currentContext === 'roles' ? 'บทบาท' : 
                                currentContext === 'calendar' ? 'ปฏิทิน' : 
                                currentContext === 'prefixes' ? 'คำนำหน้าชื่อ' : 'ทั่วไป'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {contextPresets.map((preset) => {
              const Icon = getPresetIcon(preset.category);
              return (
                <div
                  key={preset.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => applyPreset(preset)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-sm">{preset.name}</span>
                    </div>
                    {preset.category === 'common' && (
                      <StarIcon className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{preset.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>ใช้ {preset.useCount} ครั้ง</span>
                    {preset.lastUsed && (
                      <span>ล่าสุด: {preset.lastUsed.toLocaleDateString('th-TH')}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {preset.tags.map((tag, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Filters for Current Context */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2 text-green-500" />
          ตัวกรองด่วน
        </h4>
        <div className="flex flex-wrap gap-2">
          {contextPresets.filter(p => p.category === 'common').slice(0, 5).map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export { SmartFilteringComponent as SmartFiltering };
export default SmartFilteringComponent;