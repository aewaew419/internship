'use client';

import React, { useState, useMemo } from 'react';
import { 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  InformationCircleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LightBulbIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { DateConflict, ValidationResult } from '@/lib/validation/dateValidation';
import dayjs from 'dayjs';

interface ValidationMessagePanelProps {
  validationResult: ValidationResult | null;
  className?: string;
  showSuggestions?: boolean;
  collapsible?: boolean;
  onResolveConflict?: (conflict: DateConflict) => void;
  onResolveAll?: () => void;
}

interface MessageGroup {
  type: 'error' | 'warning' | 'info';
  title: string;
  conflicts: DateConflict[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const ValidationMessage: React.FC<{
  conflict: DateConflict;
  showSuggestions?: boolean;
  onResolve?: () => void;
}> = ({ conflict, showSuggestions = true, onResolve }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const typeLabels = {
    overlap: 'ซ้อนทับ',
    gap: 'ช่วงห่าง',
    invalid_sequence: 'ลำดับไม่ถูกต้อง',
    past_date: 'วันที่ในอดีต',
    future_limit: 'วันที่ไกลเกินไป',
  };

  const severityColors = {
    error: 'border-red-200 bg-red-50',
    warning: 'border-yellow-200 bg-yellow-50',
  };

  const severityTextColors = {
    error: 'text-red-800',
    warning: 'text-yellow-800',
  };

  return (
    <div className={`border rounded-lg p-3 ${severityColors[conflict.severity]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`text-xs font-medium ${severityTextColors[conflict.severity]}`}>
              {typeLabels[conflict.type]}
            </span>
            <span className="text-xs text-gray-500">
              {dayjs(conflict.conflictDates.startDate).format('DD/MM/YYYY')}
            </span>
          </div>
          <p className={`text-sm font-medium ${severityTextColors[conflict.severity]} mb-1`}>
            {conflict.message}
          </p>
          <div className="text-xs text-gray-600">
            <span className="font-medium">{conflict.entity1.name}</span>
            {conflict.entity2 && (
              <>
                <span className="mx-1">↔</span>
                <span className="font-medium">{conflict.entity2.name}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1 ml-3">
          {onResolve && (
            <button
              onClick={onResolve}
              className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                conflict.severity === 'error'
                  ? 'text-red-700 hover:bg-red-100'
                  : 'text-yellow-700 hover:bg-yellow-100'
              }`}
            >
              แก้ไข
            </button>
          )}
          {showSuggestions && conflict.suggestions && conflict.suggestions.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-1 rounded transition-colors ${
                conflict.severity === 'error'
                  ? 'text-red-600 hover:bg-red-100'
                  : 'text-yellow-600 hover:bg-yellow-100'
              }`}
            >
              {isExpanded ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Suggestions */}
      {isExpanded && showSuggestions && conflict.suggestions && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-1 mb-2">
            <LightBulbIcon className="w-3 h-3 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">คำแนะนำ</span>
          </div>
          <ul className="space-y-1">
            {conflict.suggestions.map((suggestion, index) => (
              <li key={index} className="text-xs text-gray-600 flex items-start">
                <span className="text-gray-400 mr-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const MessageGroupHeader: React.FC<{
  group: MessageGroup;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ group, isExpanded, onToggle }) => {
  const Icon = group.icon;
  
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${group.color} hover:opacity-80`}
    >
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5" />
        <div className="text-left">
          <div className="font-medium">{group.title}</div>
          <div className="text-sm opacity-75">
            {group.conflicts.length} รายการ
          </div>
        </div>
      </div>
      {isExpanded ? (
        <ChevronUpIcon className="w-5 h-5" />
      ) : (
        <ChevronDownIcon className="w-5 h-5" />
      )}
    </button>
  );
};

export const ValidationMessagePanel: React.FC<ValidationMessagePanelProps> = ({
  validationResult,
  className = '',
  showSuggestions = true,
  collapsible = true,
  onResolveConflict,
  onResolveAll
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['error']));

  const messageGroups = useMemo((): MessageGroup[] => {
    if (!validationResult) return [];

    const groups: MessageGroup[] = [];

    if (validationResult.errors.length > 0) {
      groups.push({
        type: 'error',
        title: 'ข้อผิดพลาดที่ต้องแก้ไข',
        conflicts: validationResult.errors,
        icon: XCircleIcon,
        color: 'border-red-300 bg-red-50 text-red-800'
      });
    }

    if (validationResult.warnings.length > 0) {
      groups.push({
        type: 'warning',
        title: 'คำเตือน',
        conflicts: validationResult.warnings,
        icon: ExclamationTriangleIcon,
        color: 'border-yellow-300 bg-yellow-50 text-yellow-800'
      });
    }

    return groups;
  }, [validationResult]);

  const toggleGroup = (groupType: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupType)) {
      newExpanded.delete(groupType);
    } else {
      newExpanded.add(groupType);
    }
    setExpandedGroups(newExpanded);
  };

  // Show success state when no conflicts
  if (!validationResult || validationResult.conflicts.length === 0) {
    return (
      <div className={`p-4 bg-green-50 border-2 border-green-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-3">
          <CheckCircleIcon className="w-6 h-6 text-green-600" />
          <div>
            <div className="font-medium text-green-800">ปฏิทินการศึกษาถูกต้อง</div>
            <div className="text-sm text-green-600">ไม่พบข้อขัดแย้งหรือข้อผิดพลาด</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">สถานะการตรวจสอบ</h3>
          {onResolveAll && validationResult.conflicts.length > 0 && (
            <button
              onClick={onResolveAll}
              className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              แก้ไขทั้งหมด
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {validationResult.conflicts.length}
            </div>
            <div className="text-sm text-gray-500">ทั้งหมด</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {validationResult.errors.length}
            </div>
            <div className="text-sm text-gray-500">ข้อผิดพลาด</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {validationResult.warnings.length}
            </div>
            <div className="text-sm text-gray-500">คำเตือน</div>
          </div>
        </div>

        {/* Validation Status */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {validationResult.isValid ? (
              <>
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-700 font-medium">
                  สามารถบันทึกได้ (มีเฉพาะคำเตือน)
                </span>
              </>
            ) : (
              <>
                <XCircleIcon className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700 font-medium">
                  ต้องแก้ไขข้อผิดพลาดก่อนบันทึก
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Message Groups */}
      {messageGroups.map((group) => (
        <div key={group.type} className="space-y-2">
          {collapsible ? (
            <MessageGroupHeader
              group={group}
              isExpanded={expandedGroups.has(group.type)}
              onToggle={() => toggleGroup(group.type)}
            />
          ) : (
            <div className={`p-3 rounded-lg border-2 ${group.color}`}>
              <div className="flex items-center space-x-3">
                <group.icon className="w-5 h-5" />
                <div>
                  <div className="font-medium">{group.title}</div>
                  <div className="text-sm opacity-75">
                    {group.conflicts.length} รายการ
                  </div>
                </div>
              </div>
            </div>
          )}

          {(!collapsible || expandedGroups.has(group.type)) && (
            <div className="space-y-2 ml-4">
              {group.conflicts.map((conflict, index) => (
                <ValidationMessage
                  key={index}
                  conflict={conflict}
                  showSuggestions={showSuggestions}
                  onResolve={() => onResolveConflict?.(conflict)}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Last Updated */}
      <div className="text-xs text-gray-500 flex items-center space-x-1">
        <ClockIcon className="w-3 h-3" />
        <span>อัปเดตล่าสุด: {dayjs().format('DD/MM/YYYY HH:mm')}</span>
      </div>
    </div>
  );
};

export default ValidationMessagePanel;