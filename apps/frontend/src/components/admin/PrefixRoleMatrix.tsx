'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  UserGroupIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { AdminModal } from './AdminModal';
import { PrefixAssignmentSuggestions } from './PrefixAssignmentSuggestions';
import { ConflictResolutionInterface } from './ConflictResolutionInterface';
import { AssignmentConflictDetector } from './AssignmentConflictDetector';

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

interface PrefixRoleMatrixProps {
  prefixes: TitlePrefix[];
  roles: Role[];
  assignments: PrefixRoleAssignment[];
  onAssignmentChange: (prefixId: number, roleId: number, assigned: boolean, isDefault?: boolean) => Promise<void>;
  onBulkAssign: (prefixIds: number[], roleIds: number[], assigned: boolean) => Promise<void>;
  onLoadRecommendations: () => Promise<void>;
}

interface AssignmentConflict {
  type: 'gender_mismatch' | 'category_conflict' | 'duplicate_default' | 'missing_default';
  severity: 'error' | 'warning' | 'info';
  prefixId: number;
  roleId: number;
  message: string;
  suggestions: string[];
}

const ROLE_CATEGORIES = {
  student: { label: 'นักศึกษา', color: 'bg-blue-50 text-blue-800' },
  faculty: { label: 'อาจารย์', color: 'bg-green-50 text-green-800' },
  staff: { label: 'เจ้าหน้าที่', color: 'bg-yellow-50 text-yellow-800' },
  admin: { label: 'ผู้ดูแลระบบ', color: 'bg-purple-50 text-purple-800' },
  external: { label: 'บุคคลภายนอก', color: 'bg-gray-50 text-gray-800' },
};

const PREFIX_CATEGORIES = {
  academic: { label: 'วิชาการ', color: 'bg-blue-100 text-blue-800' },
  professional: { label: 'อาชีพ', color: 'bg-green-100 text-green-800' },
  honorary: { label: 'กิตติมศักดิ์', color: 'bg-purple-100 text-purple-800' },
  religious: { label: 'ศาสนา', color: 'bg-yellow-100 text-yellow-800' },
};

const MatrixCell: React.FC<{
  prefix: TitlePrefix;
  role: Role;
  assignment: PrefixRoleAssignment | undefined;
  conflicts: AssignmentConflict[];
  onChange: (assigned: boolean, isDefault?: boolean) => void;
  disabled?: boolean;
}> = ({ prefix, role, assignment, conflicts, onChange, disabled = false }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const isAssigned = !!assignment;
  const isDefault = assignment?.isDefault || false;
  const canModify = assignment?.canModify !== false;
  
  const cellConflicts = conflicts.filter(c => c.prefixId === prefix.id && c.roleId === role.id);
  const hasError = cellConflicts.some(c => c.severity === 'error');
  const hasWarning = cellConflicts.some(c => c.severity === 'warning');

  const handleClick = () => {
    if (disabled || !canModify) return;
    
    if (isAssigned) {
      onChange(false);
    } else {
      onChange(true);
    }
  };

  const handleDefaultToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || !canModify || !isAssigned) return;
    onChange(true, !isDefault);
  };

  const getCellStyle = () => {
    let baseStyle = 'relative w-12 h-12 border border-gray-200 cursor-pointer transition-all duration-200 ';
    
    if (disabled || !canModify) {
      baseStyle += 'cursor-not-allowed opacity-50 ';
    }
    
    if (hasError) {
      baseStyle += 'bg-red-100 border-red-300 ';
    } else if (hasWarning) {
      baseStyle += 'bg-yellow-100 border-yellow-300 ';
    } else if (isAssigned) {
      baseStyle += isDefault 
        ? 'bg-green-200 border-green-400 ' 
        : 'bg-blue-100 border-blue-300 ';
    } else {
      baseStyle += 'bg-white hover:bg-gray-50 ';
    }
    
    return baseStyle;
  };

  return (
    <div
      className={getCellStyle()}
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      title={`${prefix.thai} - ${role.displayName}`}
    >
      {/* Assignment Status */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isAssigned && (
          <CheckIcon className={`w-6 h-6 ${
            isDefault ? 'text-green-700' : 'text-blue-600'
          }`} />
        )}
      </div>

      {/* Default Indicator */}
      {isAssigned && (
        <button
          onClick={handleDefaultToggle}
          className={`absolute top-0 right-0 w-3 h-3 rounded-full border ${
            isDefault 
              ? 'bg-green-500 border-green-600' 
              : 'bg-gray-300 border-gray-400 hover:bg-gray-400'
          }`}
          title={isDefault ? 'คำนำหน้าชื่อเริ่มต้น' : 'กำหนดเป็นเริ่มต้น'}
        />
      )}

      {/* Conflict Indicator */}
      {cellConflicts.length > 0 && (
        <div className={`absolute bottom-0 left-0 w-3 h-3 rounded-full ${
          hasError ? 'bg-red-500' : 'bg-yellow-500'
        }`} />
      )}

      {/* Tooltip */}
      {showTooltip && cellConflicts.length > 0 && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap">
          {cellConflicts[0].message}
        </div>
      )}
    </div>
  );
};

const ConflictPanel: React.FC<{
  conflicts: AssignmentConflict[];
  onResolveConflict: (conflict: AssignmentConflict, resolution: string) => void;
}> = ({ conflicts, onResolveConflict }) => {
  const { errors, warnings, infos } = useMemo(() => {
    return {
      errors: conflicts.filter(c => c.severity === 'error'),
      warnings: conflicts.filter(c => c.severity === 'warning'),
      infos: conflicts.filter(c => c.severity === 'info'),
    };
  }, [conflicts]);

  if (conflicts.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-3">ข้อขัดแย้งในการกำหนดคำนำหน้าชื่อ</h3>
      
      <div className="space-y-4">
        {errors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center">
              <XMarkIcon className="w-4 h-4 mr-1" />
              ข้อผิดพลาด ({errors.length})
            </h4>
            <div className="space-y-2">
              {errors.map((conflict, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-800 mb-2">{conflict.message}</p>
                  <div className="flex flex-wrap gap-1">
                    {conflict.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => onResolveConflict(conflict, suggestion)}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
              <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
              คำเตือน ({warnings.length})
            </h4>
            <div className="space-y-2">
              {warnings.map((conflict, index) => (
                <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm text-yellow-800 mb-2">{conflict.message}</p>
                  <div className="flex flex-wrap gap-1">
                    {conflict.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => onResolveConflict(conflict, suggestion)}
                        className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BulkAssignmentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  prefixes: TitlePrefix[];
  roles: Role[];
  onBulkAssign: (prefixIds: number[], roleIds: number[], assigned: boolean) => void;
}> = ({ isOpen, onClose, prefixes, roles, onBulkAssign }) => {
  const [selectedPrefixes, setSelectedPrefixes] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [assignmentType, setAssignmentType] = useState<'assign' | 'unassign'>('assign');

  const handleSubmit = () => {
    if (selectedPrefixes.length > 0 && selectedRoles.length > 0) {
      onBulkAssign(selectedPrefixes, selectedRoles, assignmentType === 'assign');
      setSelectedPrefixes([]);
      setSelectedRoles([]);
      onClose();
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="การกำหนดคำนำหน้าชื่อแบบกลุ่ม"
      size="lg"
      type="form"
    >
      <div className="space-y-6">
        {/* Assignment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ประเภทการดำเนินการ
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="assign"
                checked={assignmentType === 'assign'}
                onChange={(e) => setAssignmentType(e.target.value as any)}
                className="mr-2"
              />
              กำหนดคำนำหน้าชื่อ
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="unassign"
                checked={assignmentType === 'unassign'}
                onChange={(e) => setAssignmentType(e.target.value as any)}
                className="mr-2"
              />
              ยกเลิกการกำหนด
            </label>
          </div>
        </div>

        {/* Prefix Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เลือกคำนำหน้าชื่อ ({selectedPrefixes.length} รายการ)
          </label>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded p-2">
            {prefixes.map((prefix) => (
              <label key={prefix.id} className="flex items-center p-2 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedPrefixes.includes(prefix.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPrefixes(prev => [...prev, prefix.id]);
                    } else {
                      setSelectedPrefixes(prev => prev.filter(id => id !== prefix.id));
                    }
                  }}
                  className="mr-3"
                />
                <div>
                  <span className="font-medium">{prefix.thai}</span>
                  <span className="text-sm text-gray-500 ml-2">({prefix.english})</span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded ${PREFIX_CATEGORIES[prefix.category].color}`}>
                    {PREFIX_CATEGORIES[prefix.category].label}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เลือกบทบาท ({selectedRoles.length} รายการ)
          </label>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded p-2">
            {roles.map((role) => (
              <label key={role.id} className="flex items-center p-2 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRoles(prev => [...prev, role.id]);
                    } else {
                      setSelectedRoles(prev => prev.filter(id => id !== role.id));
                    }
                  }}
                  className="mr-3"
                />
                <div>
                  <span className="font-medium">{role.displayName}</span>
                  <span className="text-sm text-gray-500 ml-2">({role.name})</span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded ${ROLE_CATEGORIES[role.category].color}`}>
                    {ROLE_CATEGORIES[role.category].label}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedPrefixes.length === 0 || selectedRoles.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assignmentType === 'assign' ? 'กำหนด' : 'ยกเลิก'} ({selectedPrefixes.length} × {selectedRoles.length})
          </button>
        </div>
      </div>
    </AdminModal>
  );
};

export const PrefixRoleMatrix: React.FC<PrefixRoleMatrixProps> = ({
  prefixes,
  roles,
  assignments,
  onAssignmentChange,
  onBulkAssign,
  onLoadRecommendations
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrefixCategory, setFilterPrefixCategory] = useState<string>('all');
  const [filterRoleCategory, setFilterRoleCategory] = useState<string>('all');
  const [showConflicts, setShowConflicts] = useState(true);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showResolutionInterface, setShowResolutionInterface] = useState(false);

  // Create assignment lookup map
  const assignmentMap = useMemo(() => {
    const map = new Map<string, PrefixRoleAssignment>();
    assignments.forEach(assignment => {
      map.set(`${assignment.prefixId}-${assignment.roleId}`, assignment);
    });
    return map;
  }, [assignments]);

  // Filter prefixes and roles
  const filteredPrefixes = useMemo(() => {
    return prefixes.filter(prefix => {
      const matchesSearch = 
        prefix.thai.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prefix.english.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterPrefixCategory === 'all' || prefix.category === filterPrefixCategory;
      return matchesSearch && matchesCategory && prefix.isActive;
    });
  }, [prefixes, searchTerm, filterPrefixCategory]);

  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      const matchesSearch = 
        role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterRoleCategory === 'all' || role.category === filterRoleCategory;
      return matchesSearch && matchesCategory && role.isActive;
    });
  }, [roles, searchTerm, filterRoleCategory]);

  // Detect conflicts
  const conflicts = useMemo((): AssignmentConflict[] => {
    const detectedConflicts: AssignmentConflict[] = [];

    assignments.forEach(assignment => {
      const prefix = prefixes.find(p => p.id === assignment.prefixId);
      const role = roles.find(r => r.id === assignment.roleId);
      
      if (!prefix || !role) return;

      // Gender mismatch check
      if (prefix.gender !== 'neutral' && role.category === 'student') {
        // For students, we might want to check if the prefix gender matches expected gender
        // This is a simplified check - in real implementation, you'd have more sophisticated logic
        if (prefix.gender === 'male' && role.name.includes('female')) {
          detectedConflicts.push({
            type: 'gender_mismatch',
            severity: 'warning',
            prefixId: prefix.id,
            roleId: role.id,
            message: `คำนำหน้าชื่อ "${prefix.thai}" สำหรับเพศชายอาจไม่เหมาะสมกับบทบาท "${role.displayName}"`,
            suggestions: ['ตรวจสอบความเหมาะสม', 'เปลี่ยนคำนำหน้าชื่อ']
          });
        }
      }

      // Category conflict check
      if (prefix.category === 'academic' && role.category === 'student') {
        detectedConflicts.push({
          type: 'category_conflict',
          severity: 'warning',
          prefixId: prefix.id,
          roleId: role.id,
          message: `คำนำหน้าชื่อวิชาการ "${prefix.thai}" อาจไม่เหมาะสมกับนักศึกษา`,
          suggestions: ['ใช้คำนำหน้าชื่อทั่วไป', 'ตรวจสอบนโยบาย']
        });
      }

      // Check for multiple defaults in same role
      const roleDefaults = assignments.filter(a => 
        a.roleId === assignment.roleId && a.isDefault
      );
      if (roleDefaults.length > 1 && assignment.isDefault) {
        detectedConflicts.push({
          type: 'duplicate_default',
          severity: 'error',
          prefixId: prefix.id,
          roleId: role.id,
          message: `บทบาท "${role.displayName}" มีคำนำหน้าชื่อเริ่มต้นมากกว่า 1 รายการ`,
          suggestions: ['เลือกคำนำหน้าชื่อเริ่มต้นเพียง 1 รายการ']
        });
      }
    });

    // Check for missing defaults
    roles.forEach(role => {
      const roleAssignments = assignments.filter(a => a.roleId === role.id);
      const hasDefault = roleAssignments.some(a => a.isDefault);
      
      if (roleAssignments.length > 0 && !hasDefault) {
        detectedConflicts.push({
          type: 'missing_default',
          severity: 'warning',
          prefixId: roleAssignments[0].prefixId,
          roleId: role.id,
          message: `บทบาท "${role.displayName}" ไม่มีคำนำหน้าชื่อเริ่มต้น`,
          suggestions: ['กำหนดคำนำหน้าชื่อเริ่มต้น']
        });
      }
    });

    return detectedConflicts;
  }, [assignments, prefixes, roles]);

  // Statistics
  const stats = useMemo(() => {
    const totalAssignments = assignments.length;
    const defaultAssignments = assignments.filter(a => a.isDefault).length;
    const conflictCount = conflicts.length;
    const errorCount = conflicts.filter(c => c.severity === 'error').length;

    return {
      totalAssignments,
      defaultAssignments,
      conflictCount,
      errorCount,
      completionRate: Math.round((totalAssignments / (prefixes.length * roles.length)) * 100)
    };
  }, [assignments, conflicts, prefixes.length, roles.length]);

  const handleAssignmentChange = useCallback(async (
    prefixId: number, 
    roleId: number, 
    assigned: boolean, 
    isDefault?: boolean
  ) => {
    try {
      await onAssignmentChange(prefixId, roleId, assigned, isDefault);
    } catch (error) {
      console.error('Error changing assignment:', error);
    }
  }, [onAssignmentChange]);

  const handleBulkAssign = useCallback(async (
    prefixIds: number[], 
    roleIds: number[], 
    assigned: boolean
  ) => {
    try {
      await onBulkAssign(prefixIds, roleIds, assigned);
    } catch (error) {
      console.error('Error bulk assigning:', error);
    }
  }, [onBulkAssign]);

  const handleResolveConflict = useCallback((conflict: AssignmentConflict, resolution: string) => {
    console.log('Resolving conflict:', conflict, 'with resolution:', resolution);
    // Implement conflict resolution logic here
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">กำหนดคำนำหน้าชื่อให้บทบาท</h2>
          <p className="text-sm text-gray-600">
            {stats.totalAssignments} การกำหนด • {stats.defaultAssignments} เริ่มต้น • 
            {stats.completionRate}% สมบูรณ์
            {stats.conflictCount > 0 && (
              <span className="text-red-600"> • {stats.conflictCount} ข้อขัดแย้ง</span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <InformationCircleIcon className="w-4 h-4 mr-2" />
            คำแนะนำ
          </button>
          <button
            onClick={onLoadRecommendations}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            โหลดคำแนะนำ
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserGroupIcon className="w-4 h-4 mr-2" />
            กำหนดแบบกลุ่ม
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาคำนำหน้าชื่อหรือบทบาท..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <FunnelIcon className="w-4 h-4 text-gray-500" />
          
          <select
            value={filterPrefixCategory}
            onChange={(e) => setFilterPrefixCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ทุกหมวดหมู่คำนำหน้า</option>
            {Object.entries(PREFIX_CATEGORIES).map(([key, category]) => (
              <option key={key} value={key}>{category.label}</option>
            ))}
          </select>

          <select
            value={filterRoleCategory}
            onChange={(e) => setFilterRoleCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ทุกหมวดหมู่บทบาท</option>
            {Object.entries(ROLE_CATEGORIES).map(([key, category]) => (
              <option key={key} value={key}>{category.label}</option>
            ))}
          </select>

          <button
            onClick={() => setShowConflicts(!showConflicts)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              showConflicts
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {showConflicts ? 'ซ่อน' : 'แสดง'}ข้อขัดแย้ง
          </button>
        </div>
      </div>

      {/* Suggestions Panel */}
      {showSuggestions && (
        <PrefixAssignmentSuggestions
          prefixes={prefixes}
          roles={roles}
          assignments={assignments}
          onApplySuggestion={async (suggestion) => {
            if (suggestion.action === 'assign') {
              await handleAssignmentChange(suggestion.prefixId, suggestion.roleId, true, false);
            } else if (suggestion.action === 'set_default') {
              await handleAssignmentChange(suggestion.prefixId, suggestion.roleId, true, true);
            } else if (suggestion.action === 'unassign') {
              await handleAssignmentChange(suggestion.prefixId, suggestion.roleId, false);
            }
          }}
          onApplyBulkSuggestions={async (suggestions) => {
            for (const suggestion of suggestions) {
              if (suggestion.action === 'assign') {
                await handleAssignmentChange(suggestion.prefixId, suggestion.roleId, true, false);
              } else if (suggestion.action === 'set_default') {
                await handleAssignmentChange(suggestion.prefixId, suggestion.roleId, true, true);
              } else if (suggestion.action === 'unassign') {
                await handleAssignmentChange(suggestion.prefixId, suggestion.roleId, false);
              }
            }
          }}
          onDismissSuggestion={(suggestionId) => {
            console.log('Dismissed suggestion:', suggestionId);
          }}
        />
      )}

      {/* Assignment Conflict Detector */}
      {showConflicts && (
        <AssignmentConflictDetector
          prefixes={prefixes}
          roles={roles}
          assignments={assignments}
          onResolveConflict={(conflict, resolution) => {
            console.log('Resolving assignment conflict:', conflict, 'with:', resolution);
            setShowResolutionInterface(true);
          }}
          showResolutions={true}
        />
      )}

      {/* Matrix */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header */}
            <div className="flex">
              <div className="w-48 p-4 bg-gray-50 border-b border-r border-gray-200">
                <span className="font-medium text-gray-900">คำนำหน้าชื่อ / บทบาท</span>
              </div>
              {filteredRoles.map((role) => (
                <div
                  key={role.id}
                  className="w-12 p-2 bg-gray-50 border-b border-r border-gray-200 text-center"
                  title={role.displayName}
                >
                  <div className="transform -rotate-45 origin-center text-xs font-medium text-gray-700 whitespace-nowrap">
                    {role.displayName.length > 8 
                      ? role.displayName.substring(0, 8) + '...' 
                      : role.displayName
                    }
                  </div>
                </div>
              ))}
            </div>

            {/* Matrix Body */}
            {filteredPrefixes.map((prefix) => (
              <div key={prefix.id} className="flex">
                <div className="w-48 p-4 bg-gray-50 border-b border-r border-gray-200">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{prefix.thai}</span>
                    <span className="text-sm text-gray-500">({prefix.english})</span>
                  </div>
                  <div className="mt-1">
                    <span className={`inline-block px-2 py-1 text-xs rounded ${PREFIX_CATEGORIES[prefix.category].color}`}>
                      {PREFIX_CATEGORIES[prefix.category].label}
                    </span>
                  </div>
                </div>
                {filteredRoles.map((role) => (
                  <MatrixCell
                    key={`${prefix.id}-${role.id}`}
                    prefix={prefix}
                    role={role}
                    assignment={assignmentMap.get(`${prefix.id}-${role.id}`)}
                    conflicts={conflicts}
                    onChange={(assigned, isDefault) => 
                      handleAssignmentChange(prefix.id, role.id, assigned, isDefault)
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">คำอธิบาย</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-100 border border-blue-300 rounded flex items-center justify-center">
              <CheckIcon className="w-4 h-4 text-blue-600" />
            </div>
            <span>กำหนดแล้ว</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-200 border border-green-400 rounded flex items-center justify-center">
              <CheckIcon className="w-4 h-4 text-green-700" />
            </div>
            <span>เริ่มต้น</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-yellow-100 border border-yellow-300 rounded" />
            <span>คำเตือน</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-red-100 border border-red-300 rounded" />
            <span>ข้อผิดพลาด</span>
          </div>
        </div>
      </div>

      {/* Bulk Assignment Modal */}
      <BulkAssignmentModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        prefixes={prefixes}
        roles={roles}
        onBulkAssign={handleBulkAssign}
      />

      {/* Conflict Resolution Interface */}
      <ConflictResolutionInterface
        isOpen={showResolutionInterface}
        onClose={() => setShowResolutionInterface(false)}
        conflicts={[]} // This would be populated with actual conflicts
        prefixes={prefixes}
        roles={roles}
        assignments={assignments}
        onResolveConflict={async (conflict, action) => {
          console.log('Resolving conflict:', conflict, 'with action:', action);
          // Implement actual conflict resolution logic here
        }}
        onResolveMultiple={async (resolutions) => {
          console.log('Resolving multiple conflicts:', resolutions);
          // Implement batch conflict resolution logic here
        }}
        onIgnoreConflict={(conflictId) => {
          console.log('Ignoring conflict:', conflictId);
        }}
      />
    </div>
  );
};

export default PrefixRoleMatrix;