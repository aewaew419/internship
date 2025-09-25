'use client';

import React, { useMemo } from 'react';
import { 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  InformationCircleIcon,
  LightBulbIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { 
  DateConflict, 
  ValidationResult,
  CalendarEntity 
} from '@/lib/validation/dateValidation';
import dayjs from 'dayjs';

interface DateConflictIndicatorProps {
  conflicts: DateConflict[];
  className?: string;
  showSuggestions?: boolean;
  onResolveConflict?: (conflict: DateConflict, resolution: string) => void;
}

interface ConflictIndicatorProps {
  conflict: DateConflict;
  showSuggestions?: boolean;
  onResolveConflict?: (conflict: DateConflict, resolution: string) => void;
}

const ConflictTypeIcon: React.FC<{ type: DateConflict['type']; severity: DateConflict['severity'] }> = ({ 
  type, 
  severity 
}) => {
  const iconClass = `w-5 h-5 ${
    severity === 'error' 
      ? 'text-red-500' 
      : severity === 'warning' 
        ? 'text-yellow-500' 
        : 'text-blue-500'
  }`;

  switch (type) {
    case 'overlap':
      return <XCircleIcon className={iconClass} />;
    case 'gap':
      return <ExclamationTriangleIcon className={iconClass} />;
    case 'invalid_sequence':
      return <XCircleIcon className={iconClass} />;
    case 'past_date':
      return <InformationCircleIcon className={iconClass} />;
    case 'future_limit':
      return <InformationCircleIcon className={iconClass} />;
    default:
      return <ExclamationTriangleIcon className={iconClass} />;
  }
};

const ConflictBadge: React.FC<{ severity: DateConflict['severity']; type: DateConflict['type'] }> = ({ 
  severity, 
  type 
}) => {
  const badgeClass = `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
    severity === 'error'
      ? 'bg-red-100 text-red-800'
      : severity === 'warning'
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-blue-100 text-blue-800'
  }`;

  const typeLabels = {
    overlap: 'ซ้อนทับ',
    gap: 'ช่วงห่าง',
    invalid_sequence: 'ลำดับไม่ถูกต้อง',
    past_date: 'วันที่ในอดีต',
    future_limit: 'วันที่ไกลเกินไป',
  };

  return (
    <span className={badgeClass}>
      {typeLabels[type]}
    </span>
  );
};

const EntityDisplay: React.FC<{ entity: CalendarEntity }> = ({ entity }) => {
  const typeColors = {
    semester: 'text-blue-600',
    holiday: 'text-red-600',
    registration: 'text-green-600',
    exam: 'text-purple-600',
  };

  const typeLabels = {
    semester: 'ภาคการศึกษา',
    holiday: 'วันหยุด',
    registration: 'ลงทะเบียน',
    exam: 'สอบ',
  };

  return (
    <div className="flex items-center space-x-2">
      <CalendarDaysIcon className={`w-4 h-4 ${typeColors[entity.type]}`} />
      <div>
        <span className={`font-medium ${typeColors[entity.type]}`}>
          {entity.name}
        </span>
        <div className="text-xs text-gray-500">
          {typeLabels[entity.type]} • {dayjs(entity.startDate).format('DD/MM/YYYY')} - {dayjs(entity.endDate).format('DD/MM/YYYY')}
        </div>
      </div>
    </div>
  );
};

const ConflictSuggestions: React.FC<{ 
  suggestions: string[]; 
  onResolveConflict?: (resolution: string) => void;
}> = ({ suggestions, onResolveConflict }) => {
  if (!suggestions.length) return null;

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-2 mb-2">
        <LightBulbIcon className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-medium text-gray-700">คำแนะนำการแก้ไข</span>
      </div>
      <ul className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <li key={index} className="flex items-start space-x-2">
            <span className="text-xs text-gray-400 mt-1">•</span>
            <span className="text-sm text-gray-600 flex-1">{suggestion}</span>
            {onResolveConflict && (
              <button
                onClick={() => onResolveConflict(suggestion)}
                className="px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded font-medium transition-colors"
              >
                ใช้
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const SingleConflictIndicator: React.FC<ConflictIndicatorProps> = ({ 
  conflict, 
  showSuggestions = true,
  onResolveConflict 
}) => {
  const handleResolveConflict = (resolution: string) => {
    onResolveConflict?.(conflict, resolution);
  };

  return (
    <div className={`border rounded-lg p-4 ${
      conflict.severity === 'error' 
        ? 'border-red-200 bg-red-50' 
        : conflict.severity === 'warning'
          ? 'border-yellow-200 bg-yellow-50'
          : 'border-blue-200 bg-blue-50'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <ConflictTypeIcon type={conflict.type} severity={conflict.severity} />
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <ConflictBadge severity={conflict.severity} type={conflict.type} />
              {conflict.severity === 'error' && (
                <span className="text-xs text-red-600 font-medium">ต้องแก้ไข</span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-900">{conflict.message}</p>
          </div>
        </div>
      </div>

      {/* Entities involved */}
      <div className="space-y-2 mb-3">
        <EntityDisplay entity={conflict.entity1} />
        {conflict.entity2 && (
          <>
            <div className="flex justify-center">
              <div className="text-xs text-gray-400">ขัดแย้งกับ</div>
            </div>
            <EntityDisplay entity={conflict.entity2} />
          </>
        )}
      </div>

      {/* Conflict date range */}
      <div className="mb-3 p-2 bg-white rounded border">
        <div className="text-xs text-gray-500 mb-1">ช่วงวันที่ที่ขัดแย้ง</div>
        <div className="text-sm font-medium text-gray-900">
          {dayjs(conflict.conflictDates.startDate).format('DD/MM/YYYY')} - {dayjs(conflict.conflictDates.endDate).format('DD/MM/YYYY')}
        </div>
      </div>

      {/* Suggestions */}
      {showSuggestions && conflict.suggestions && (
        <ConflictSuggestions 
          suggestions={conflict.suggestions} 
          onResolveConflict={handleResolveConflict}
        />
      )}
    </div>
  );
};

export const DateConflictIndicator: React.FC<DateConflictIndicatorProps> = ({ 
  conflicts, 
  className = '',
  showSuggestions = true,
  onResolveConflict 
}) => {
  const { errors, warnings, summary } = useMemo(() => {
    const errors = conflicts.filter(c => c.severity === 'error');
    const warnings = conflicts.filter(c => c.severity === 'warning');
    
    return {
      errors,
      warnings,
      summary: {
        total: conflicts.length,
        errors: errors.length,
        warnings: warnings.length,
      }
    };
  }, [conflicts]);

  if (conflicts.length === 0) {
    return (
      <div className={`p-4 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm font-medium text-green-800">
            ไม่พบข้อขัดแย้งในปฏิทินการศึกษา
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">สรุปข้อขัดแย้ง</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
            <div className="text-sm text-gray-500">ทั้งหมด</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summary.errors}</div>
            <div className="text-sm text-gray-500">ข้อผิดพลาด</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.warnings}</div>
            <div className="text-sm text-gray-500">คำเตือน</div>
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-red-800 mb-3 flex items-center">
            <XCircleIcon className="w-5 h-5 mr-2" />
            ข้อผิดพลาดที่ต้องแก้ไข ({errors.length})
          </h4>
          <div className="space-y-3">
            {errors.map((conflict, index) => (
              <SingleConflictIndicator
                key={`error-${index}`}
                conflict={conflict}
                showSuggestions={showSuggestions}
                onResolveConflict={onResolveConflict}
              />
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-yellow-800 mb-3 flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            คำเตือน ({warnings.length})
          </h4>
          <div className="space-y-3">
            {warnings.map((conflict, index) => (
              <SingleConflictIndicator
                key={`warning-${index}`}
                conflict={conflict}
                showSuggestions={showSuggestions}
                onResolveConflict={onResolveConflict}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateConflictIndicator;