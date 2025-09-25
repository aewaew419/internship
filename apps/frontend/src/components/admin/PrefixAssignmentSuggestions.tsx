'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  LightBulbIcon,
  CheckCircleIcon,
  XMarkIcon,
  InformationCircleIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  StarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface TitlePrefix {
  id: number;
  thai: string;
  english: string;
  abbreviation: string;
  category: 'academic' | 'professional' | 'honorary' | 'religious';
  gender: 'male' | 'female' | 'neutral';
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
}

interface Role {
  id: number;
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  category: 'student' | 'faculty' | 'staff' | 'admin' | 'external';
  level: number;
  isActive: boolean;
}

interface PrefixRoleAssignment {
  prefixId: number;
  roleId: number;
  isDefault: boolean;
  canModify: boolean;
  assignedBy: number;
  assignedAt: string;
}

interface AssignmentSuggestion {
  id: string;
  prefixId: number;
  roleId: number;
  action: 'assign' | 'unassign' | 'set_default' | 'unset_default';
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  category: 'missing_basic' | 'inappropriate' | 'missing_default' | 'optimization';
  priority: number;
}

interface PrefixAssignmentSuggestionsProps {
  prefixes: TitlePrefix[];
  roles: Role[];
  assignments: PrefixRoleAssignment[];
  onApplySuggestion: (suggestion: AssignmentSuggestion) => Promise<void>;
  onApplyBulkSuggestions: (suggestions: AssignmentSuggestion[]) => Promise<void>;
  onDismissSuggestion: (suggestionId: string) => void;
}

const ROLE_CATEGORIES = {
  student: { 
    label: 'นักศึกษา', 
    color: 'bg-blue-50 text-blue-800',
    icon: AcademicCapIcon,
    expectedPrefixes: ['นาย', 'นาง', 'นางสาว'],
    defaultPrefix: 'นาย'
  },
  faculty: { 
    label: 'อาจารย์', 
    color: 'bg-green-50 text-green-800',
    icon: AcademicCapIcon,
    expectedPrefixes: ['อาจารย์', 'ผู้ช่วยศาสตราจารย์', 'รองศาสตราจารย์', 'ศาสตราจารย์', 'ดร.', 'นาย', 'นาง', 'นางสาว'],
    defaultPrefix: 'อาจารย์'
  },
  staff: { 
    label: 'เจ้าหน้าที่', 
    color: 'bg-yellow-50 text-yellow-800',
    icon: BuildingOfficeIcon,
    expectedPrefixes: ['นาย', 'นาง', 'นางสาว', 'ดร.', 'คุณ'],
    defaultPrefix: 'นาย'
  },
  admin: { 
    label: 'ผู้ดูแลระบบ', 
    color: 'bg-purple-50 text-purple-800',
    icon: UserGroupIcon,
    expectedPrefixes: [], // Admin can have all prefixes
    defaultPrefix: 'นาย'
  },
  external: { 
    label: 'บุคคลภายนอก', 
    color: 'bg-gray-50 text-gray-800',
    icon: UserGroupIcon,
    expectedPrefixes: ['นาย', 'นาง', 'นางสาว', 'ดร.', 'คุณ'],
    defaultPrefix: 'นาย'
  },
};

const generateAssignmentSuggestions = (
  prefixes: TitlePrefix[],
  roles: Role[],
  assignments: PrefixRoleAssignment[]
): AssignmentSuggestion[] => {
  const suggestions: AssignmentSuggestion[] = [];
  const assignmentMap = new Map<string, PrefixRoleAssignment>();
  
  assignments.forEach(assignment => {
    assignmentMap.set(`${assignment.prefixId}-${assignment.roleId}`, assignment);
  });

  roles.forEach(role => {
    const roleConfig = ROLE_CATEGORIES[role.category];
    const roleAssignments = assignments.filter(a => a.roleId === role.id);
    const hasDefault = roleAssignments.some(a => a.isDefault);
    
    // Check for missing basic prefixes
    if (roleConfig.expectedPrefixes.length > 0) {
      roleConfig.expectedPrefixes.forEach(expectedPrefixName => {
        const expectedPrefix = prefixes.find(p => p.thai === expectedPrefixName);
        if (expectedPrefix) {
          const key = `${expectedPrefix.id}-${role.id}`;
          if (!assignmentMap.has(key)) {
            suggestions.push({
              id: `missing-basic-${expectedPrefix.id}-${role.id}`,
              prefixId: expectedPrefix.id,
              roleId: role.id,
              action: 'assign',
              reason: `บทบาท "${role.displayName}" ควรมีคำนำหน้าชื่อ "${expectedPrefix.thai}" สำหรับใช้งานพื้นฐาน`,
              confidence: 'high',
              category: 'missing_basic',
              priority: 1
            });
          }
        }
      });
    }

    // Check for missing default prefix
    if (!hasDefault && roleConfig.defaultPrefix) {
      const defaultPrefix = prefixes.find(p => p.thai === roleConfig.defaultPrefix);
      if (defaultPrefix) {
        const key = `${defaultPrefix.id}-${role.id}`;
        if (assignmentMap.has(key)) {
          // Already assigned but not default
          suggestions.push({
            id: `missing-default-${defaultPrefix.id}-${role.id}`,
            prefixId: defaultPrefix.id,
            roleId: role.id,
            action: 'set_default',
            reason: `กำหนด "${defaultPrefix.thai}" เป็นคำนำหน้าชื่อเริ่มต้นสำหรับ "${role.displayName}"`,
            confidence: 'high',
            category: 'missing_default',
            priority: 2
          });
        } else {
          // Not assigned at all
          suggestions.push({
            id: `missing-default-assign-${defaultPrefix.id}-${role.id}`,
            prefixId: defaultPrefix.id,
            roleId: role.id,
            action: 'assign',
            reason: `เพิ่มและกำหนด "${defaultPrefix.thai}" เป็นคำนำหน้าชื่อเริ่มต้นสำหรับ "${role.displayName}"`,
            confidence: 'high',
            category: 'missing_default',
            priority: 1
          });
        }
      }
    }

    // Check for inappropriate assignments
    roleAssignments.forEach(assignment => {
      const prefix = prefixes.find(p => p.id === assignment.prefixId);
      if (!prefix) return;

      // Academic prefixes for non-faculty roles
      if (prefix.category === 'academic' && role.category === 'student') {
        suggestions.push({
          id: `inappropriate-${prefix.id}-${role.id}`,
          prefixId: prefix.id,
          roleId: role.id,
          action: 'unassign',
          reason: `คำนำหน้าชื่อวิชาการ "${prefix.thai}" อาจไม่เหมาะสมสำหรับนักศึกษา`,
          confidence: 'medium',
          category: 'inappropriate',
          priority: 3
        });
      }

      // Religious prefixes for inappropriate roles
      if (prefix.category === 'religious' && !['external', 'admin'].includes(role.category)) {
        suggestions.push({
          id: `inappropriate-religious-${prefix.id}-${role.id}`,
          prefixId: prefix.id,
          roleId: role.id,
          action: 'unassign',
          reason: `คำนำหน้าชื่อทางศาสนา "${prefix.thai}" อาจไม่เหมาะสมสำหรับ "${role.displayName}"`,
          confidence: 'low',
          category: 'inappropriate',
          priority: 4
        });
      }
    });

    // Optimization suggestions
    if (role.category === 'faculty') {
      // Faculty should have academic progression
      const academicPrefixes = ['อาจารย์', 'ผู้ช่วยศาสตราจารย์', 'รองศาสตราจารย์', 'ศาสตราจารย์'];
      academicPrefixes.forEach(prefixName => {
        const prefix = prefixes.find(p => p.thai === prefixName);
        if (prefix) {
          const key = `${prefix.id}-${role.id}`;
          if (!assignmentMap.has(key)) {
            suggestions.push({
              id: `optimization-academic-${prefix.id}-${role.id}`,
              prefixId: prefix.id,
              roleId: role.id,
              action: 'assign',
              reason: `เพิ่มคำนำหน้าชื่อ "${prefix.thai}" สำหรับความก้าวหน้าทางวิชาการ`,
              confidence: 'medium',
              category: 'optimization',
              priority: 5
            });
          }
        }
      });
    }

    // Check for multiple defaults (error case)
    const defaultAssignments = roleAssignments.filter(a => a.isDefault);
    if (defaultAssignments.length > 1) {
      // Keep the first one, unset others
      defaultAssignments.slice(1).forEach(assignment => {
        const prefix = prefixes.find(p => p.id === assignment.prefixId);
        if (prefix) {
          suggestions.push({
            id: `multiple-default-${prefix.id}-${role.id}`,
            prefixId: prefix.id,
            roleId: role.id,
            action: 'unset_default',
            reason: `ยกเลิกการเป็นค่าเริ่มต้นของ "${prefix.thai}" เนื่องจากมีค่าเริ่มต้นหลายรายการ`,
            confidence: 'high',
            category: 'optimization',
            priority: 1
          });
        }
      });
    }
  });

  // Sort by priority and confidence
  return suggestions.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const confidenceOrder = { high: 0, medium: 1, low: 2 };
    return confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
  });
};

const SuggestionCard: React.FC<{
  suggestion: AssignmentSuggestion;
  prefix: TitlePrefix;
  role: Role;
  onApply: () => void;
  onDismiss: () => void;
  isApplying?: boolean;
}> = ({ suggestion, prefix, role, onApply, onDismiss, isApplying = false }) => {
  const getActionIcon = () => {
    switch (suggestion.action) {
      case 'assign': return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'unassign': return <XMarkIcon className="w-4 h-4 text-red-600" />;
      case 'set_default': return <StarIcon className="w-4 h-4 text-yellow-600" />;
      case 'unset_default': return <StarIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionLabel = () => {
    switch (suggestion.action) {
      case 'assign': return 'เพิ่ม';
      case 'unassign': return 'ลบ';
      case 'set_default': return 'ตั้งเป็นเริ่มต้น';
      case 'unset_default': return 'ยกเลิกเริ่มต้น';
    }
  };

  const getConfidenceColor = () => {
    switch (suggestion.confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceLabel = () => {
    switch (suggestion.confidence) {
      case 'high': return 'แนะนำสูง';
      case 'medium': return 'แนะนำปานกลาง';
      case 'low': return 'แนะนำต่ำ';
    }
  };

  const getCategoryColor = () => {
    switch (suggestion.category) {
      case 'missing_basic': return 'border-l-blue-500';
      case 'inappropriate': return 'border-l-red-500';
      case 'missing_default': return 'border-l-yellow-500';
      case 'optimization': return 'border-l-purple-500';
    }
  };

  const roleConfig = ROLE_CATEGORIES[role.category];
  const Icon = roleConfig.icon;

  return (
    <div className={`border border-gray-200 rounded-lg p-4 border-l-4 ${getCategoryColor()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getActionIcon()}
          <span className="font-medium text-gray-900">{getActionLabel()}</span>
          <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor()}`}>
            {getConfidenceLabel()}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onApply}
            disabled={isApplying}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isApplying ? 'กำลังดำเนินการ...' : 'ใช้'}
          </button>
          <button
            onClick={onDismiss}
            disabled={isApplying}
            className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 disabled:opacity-50"
          >
            ข้าม
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-sm">
          <span className="font-medium text-gray-900">{prefix.thai}</span>
          <span className="text-gray-500">({prefix.english})</span>
          <ArrowRightIcon className="w-3 h-3 text-gray-400" />
          <Icon className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-900">{role.displayName}</span>
        </div>
        
        <p className="text-sm text-gray-600">{suggestion.reason}</p>
      </div>
    </div>
  );
};

export const PrefixAssignmentSuggestions: React.FC<PrefixAssignmentSuggestionsProps> = ({
  prefixes,
  roles,
  assignments,
  onApplySuggestion,
  onApplyBulkSuggestions,
  onDismissSuggestion
}) => {
  const [applyingIds, setApplyingIds] = useState<Set<string>>(new Set());
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);

  const suggestions = useMemo(() => {
    return generateAssignmentSuggestions(prefixes, roles, assignments);
  }, [prefixes, roles, assignments]);

  const groupedSuggestions = useMemo(() => {
    return {
      missing_basic: suggestions.filter(s => s.category === 'missing_basic'),
      missing_default: suggestions.filter(s => s.category === 'missing_default'),
      inappropriate: suggestions.filter(s => s.category === 'inappropriate'),
      optimization: suggestions.filter(s => s.category === 'optimization'),
    };
  }, [suggestions]);

  const categoryLabels = {
    missing_basic: 'คำนำหน้าชื่อพื้นฐานที่ขาดหายไป',
    missing_default: 'ค่าเริ่มต้นที่ขาดหายไป',
    inappropriate: 'การกำหนดที่ไม่เหมาะสม',
    optimization: 'การปรับปรุงเพิ่มเติม',
  };

  const categoryIcons = {
    missing_basic: CheckCircleIcon,
    missing_default: StarIcon,
    inappropriate: XMarkIcon,
    optimization: LightBulbIcon,
  };

  const handleApplySuggestion = useCallback(async (suggestion: AssignmentSuggestion) => {
    setApplyingIds(prev => new Set(prev).add(suggestion.id));
    
    try {
      await onApplySuggestion(suggestion);
    } catch (error) {
      console.error('Error applying suggestion:', error);
    } finally {
      setApplyingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestion.id);
        return newSet;
      });
    }
  }, [onApplySuggestion]);

  const handleToggleSelection = useCallback((suggestionId: string) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  }, []);

  const handleApplySelected = useCallback(async () => {
    if (selectedSuggestions.size === 0) return;

    setIsApplyingBulk(true);
    try {
      const selectedSuggestionObjects = suggestions.filter(s => selectedSuggestions.has(s.id));
      await onApplyBulkSuggestions(selectedSuggestionObjects);
      setSelectedSuggestions(new Set());
    } catch (error) {
      console.error('Error applying bulk suggestions:', error);
    } finally {
      setIsApplyingBulk(false);
    }
  }, [selectedSuggestions, suggestions, onApplyBulkSuggestions]);

  const handleSelectAll = useCallback((category: keyof typeof groupedSuggestions) => {
    const categoryIds = groupedSuggestions[category].map(s => s.id);
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      categoryIds.forEach(id => newSet.add(id));
      return newSet;
    });
  }, [groupedSuggestions]);

  if (suggestions.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-medium text-green-800 mb-2">
          การกำหนดคำนำหน้าชื่อเหมาะสมแล้ว
        </h3>
        <p className="text-green-600">
          ไม่มีคำแนะนำเพิ่มเติมสำหรับการปรับปรุงการกำหนดคำนำหน้าชื่อ
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">คำแนะนำการกำหนดคำนำหน้าชื่อ</h3>
          <p className="text-sm text-gray-600">
            พบคำแนะนำ {suggestions.length} รายการสำหรับการปรับปรุงการกำหนดคำนำหน้าชื่อ
          </p>
        </div>
        
        {selectedSuggestions.size > 0 && (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              เลือกแล้ว {selectedSuggestions.size} รายการ
            </span>
            <button
              onClick={handleApplySelected}
              disabled={isApplyingBulk}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isApplyingBulk ? 'กำลังดำเนินการ...' : 'ใช้ที่เลือก'}
            </button>
            <button
              onClick={() => setSelectedSuggestions(new Set())}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
            >
              ยกเลิก
            </button>
          </div>
        )}
      </div>

      {/* Suggestions by Category */}
      {Object.entries(groupedSuggestions).map(([category, categorySuggestions]) => {
        if (categorySuggestions.length === 0) return null;
        
        const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons];
        
        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 flex items-center">
                <CategoryIcon className="w-5 h-5 mr-2" />
                {categoryLabels[category as keyof typeof categoryLabels]} ({categorySuggestions.length})
              </h4>
              
              <button
                onClick={() => handleSelectAll(category as keyof typeof groupedSuggestions)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                เลือกทั้งหมด
              </button>
            </div>
            
            <div className="space-y-3">
              {categorySuggestions.map((suggestion) => {
                const prefix = prefixes.find(p => p.id === suggestion.prefixId)!;
                const role = roles.find(r => r.id === suggestion.roleId)!;
                
                return (
                  <div key={suggestion.id} className="relative">
                    <input
                      type="checkbox"
                      checked={selectedSuggestions.has(suggestion.id)}
                      onChange={() => handleToggleSelection(suggestion.id)}
                      className="absolute top-2 left-2 z-10"
                    />
                    <div className="ml-6">
                      <SuggestionCard
                        suggestion={suggestion}
                        prefix={prefix}
                        role={role}
                        onApply={() => handleApplySuggestion(suggestion)}
                        onDismiss={() => onDismissSuggestion(suggestion.id)}
                        isApplying={applyingIds.has(suggestion.id)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <InformationCircleIcon className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-800">เกี่ยวกับคำแนะนำ</span>
        </div>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• คำแนะนำจะถูกสร้างขึ้นตามหลักการและแนวปฏิบัติที่ดี</li>
          <li>• คุณสามารถเลือกใช้เฉพาะคำแนะนำที่เหมาะสมกับองค์กรของคุณ</li>
          <li>• การใช้คำแนะนำจะไม่ลบการกำหนดที่มีอยู่แล้ว</li>
          <li>• คุณสามารถแก้ไขการกำหนดได้ทุกเมื่อหลังจากใช้คำแนะนำ</li>
        </ul>
      </div>
    </div>
  );
};

export default PrefixAssignmentSuggestions;