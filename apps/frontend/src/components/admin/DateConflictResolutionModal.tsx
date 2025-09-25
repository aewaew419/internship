'use client';

import React, { useState, useMemo } from 'react';
import { 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  InformationCircleIcon,
  LightBulbIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { AdminModal } from './AdminModal';
import { DateConflict, CalendarEntity } from '@/lib/validation/dateValidation';
import dayjs from 'dayjs';

interface DateConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: DateConflict[];
  onResolveConflict: (conflict: DateConflict, resolution: ResolutionAction) => Promise<void>;
  onResolveAll: (resolutions: Array<{ conflict: DateConflict; resolution: ResolutionAction }>) => Promise<void>;
}

interface ResolutionAction {
  type: 'adjust_dates' | 'change_type' | 'merge_entities' | 'ignore' | 'custom';
  description: string;
  parameters?: Record<string, any>;
}

interface ConflictResolutionSuggestion {
  action: ResolutionAction;
  impact: 'low' | 'medium' | 'high';
  automatic: boolean;
  description: string;
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
      return <ClockIcon className={iconClass} />;
    case 'future_limit':
      return <InformationCircleIcon className={iconClass} />;
    default:
      return <ExclamationTriangleIcon className={iconClass} />;
  }
};

const EntityCard: React.FC<{ entity: CalendarEntity; isSecondary?: boolean }> = ({ 
  entity, 
  isSecondary = false 
}) => {
  const typeColors = {
    semester: 'bg-blue-50 border-blue-200 text-blue-800',
    holiday: 'bg-red-50 border-red-200 text-red-800',
    registration: 'bg-green-50 border-green-200 text-green-800',
    exam: 'bg-purple-50 border-purple-200 text-purple-800',
  };

  const typeLabels = {
    semester: 'ภาคการศึกษา',
    holiday: 'วันหยุด',
    registration: 'ลงทะเบียน',
    exam: 'สอบ',
  };

  return (
    <div className={`p-3 rounded-lg border ${typeColors[entity.type]} ${isSecondary ? 'opacity-75' : ''}`}>
      <div className="flex items-center space-x-2 mb-2">
        <CalendarDaysIcon className="w-4 h-4" />
        <span className="font-medium">{entity.name}</span>
        <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
          {typeLabels[entity.type]}
        </span>
      </div>
      <div className="text-sm">
        {dayjs(entity.startDate).format('DD/MM/YYYY')} - {dayjs(entity.endDate).format('DD/MM/YYYY')}
      </div>
    </div>
  );
};

const ResolutionSuggestion: React.FC<{
  suggestion: ConflictResolutionSuggestion;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ suggestion, isSelected, onSelect }) => {
  const impactColors = {
    low: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    high: 'text-red-600 bg-red-50',
  };

  const impactLabels = {
    low: 'ผลกระทบต่ำ',
    medium: 'ผลกระทบปานกลาง',
    high: 'ผลกระทบสูง',
  };

  return (
    <div 
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 rounded-full border-2 ${
            isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
          }`}>
            {isSelected && <CheckCircleIcon className="w-4 h-4 text-white" />}
          </div>
          <span className="font-medium text-gray-900">{suggestion.action.description}</span>
          {suggestion.automatic && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
              อัตโนมัติ
            </span>
          )}
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${impactColors[suggestion.impact]}`}>
          {impactLabels[suggestion.impact]}
        </span>
      </div>
      <p className="text-sm text-gray-600">{suggestion.description}</p>
    </div>
  );
};

const ConflictResolutionCard: React.FC<{
  conflict: DateConflict;
  selectedResolution: ResolutionAction | null;
  onResolutionSelect: (resolution: ResolutionAction) => void;
}> = ({ conflict, selectedResolution, onResolutionSelect }) => {
  const suggestions = useMemo((): ConflictResolutionSuggestion[] => {
    const baseSuggestions: ConflictResolutionSuggestion[] = [];

    switch (conflict.type) {
      case 'overlap':
        baseSuggestions.push(
          {
            action: {
              type: 'adjust_dates',
              description: 'ปรับวันที่ให้ไม่ซ้อนทับ',
              parameters: { adjustType: 'separate' }
            },
            impact: 'medium',
            automatic: true,
            description: 'ปรับวันที่ของกิจกรรมหนึ่งให้ไม่ซ้อนทับกัน'
          },
          {
            action: {
              type: 'merge_entities',
              description: 'รวมกิจกรรมเป็นช่วงเดียวกัน',
              parameters: { mergeType: 'combine' }
            },
            impact: 'low',
            automatic: false,
            description: 'รวมกิจกรรมที่ซ้อนทับเป็นช่วงเวลาเดียวกัน'
          }
        );
        break;

      case 'gap':
        baseSuggestions.push(
          {
            action: {
              type: 'adjust_dates',
              description: 'ปรับช่วงห่างให้เหมาะสม',
              parameters: { adjustType: 'close_gap' }
            },
            impact: 'low',
            automatic: true,
            description: 'ปรับวันที่ให้มีช่วงห่างที่เหมาะสม'
          }
        );
        break;

      case 'invalid_sequence':
        baseSuggestions.push(
          {
            action: {
              type: 'adjust_dates',
              description: 'แก้ไขลำดับวันที่',
              parameters: { adjustType: 'fix_sequence' }
            },
            impact: 'medium',
            automatic: true,
            description: 'ปรับวันที่ให้มีลำดับที่ถูกต้อง'
          }
        );
        break;

      case 'past_date':
        baseSuggestions.push(
          {
            action: {
              type: 'adjust_dates',
              description: 'เลื่อนวันที่ไปอนาคต',
              parameters: { adjustType: 'move_future' }
            },
            impact: 'high',
            automatic: false,
            description: 'เลื่อนวันที่ทั้งหมดไปในอนาคต'
          },
          {
            action: {
              type: 'ignore',
              description: 'อนุญาตให้แก้ไขข้อมูลในอดีต',
              parameters: { allowPast: true }
            },
            impact: 'low',
            automatic: false,
            description: 'อนุญาตให้มีข้อมูลในอดีตได้'
          }
        );
        break;

      case 'future_limit':
        baseSuggestions.push(
          {
            action: {
              type: 'adjust_dates',
              description: 'ปรับวันที่ให้อยู่ในขอบเขต',
              parameters: { adjustType: 'limit_future' }
            },
            impact: 'medium',
            automatic: true,
            description: 'ปรับวันที่ให้อยู่ในขอบเขตที่กำหนด'
          }
        );
        break;
    }

    // Always add ignore option for warnings
    if (conflict.severity === 'warning') {
      baseSuggestions.push({
        action: {
          type: 'ignore',
          description: 'ละเว้นคำเตือนนี้',
          parameters: { ignoreWarning: true }
        },
        impact: 'low',
        automatic: false,
        description: 'ดำเนินการต่อโดยไม่แก้ไขคำเตือนนี้'
      });
    }

    return baseSuggestions;
  }, [conflict]);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {/* Conflict Header */}
      <div className="flex items-start space-x-3 mb-4">
        <ConflictTypeIcon type={conflict.type} severity={conflict.severity} />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              conflict.severity === 'error' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {conflict.severity === 'error' ? 'ข้อผิดพลาด' : 'คำเตือน'}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-900 mb-2">{conflict.message}</p>
          
          {/* Conflict Date Range */}
          <div className="text-xs text-gray-500 mb-3">
            ช่วงวันที่ที่ขัดแย้ง: {dayjs(conflict.conflictDates.startDate).format('DD/MM/YYYY')} - {dayjs(conflict.conflictDates.endDate).format('DD/MM/YYYY')}
          </div>
        </div>
      </div>

      {/* Entities Involved */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">กิจกรรมที่เกี่ยวข้อง</h5>
        <div className="space-y-2">
          <EntityCard entity={conflict.entity1} />
          {conflict.entity2 && (
            <>
              <div className="text-center text-xs text-gray-400">ขัดแย้งกับ</div>
              <EntityCard entity={conflict.entity2} isSecondary />
            </>
          )}
        </div>
      </div>

      {/* Resolution Options */}
      <div>
        <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <LightBulbIcon className="w-4 h-4 mr-1" />
          วิธีการแก้ไข
        </h5>
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <ResolutionSuggestion
              key={index}
              suggestion={suggestion}
              isSelected={selectedResolution?.type === suggestion.action.type && 
                          selectedResolution?.description === suggestion.action.description}
              onSelect={() => onResolutionSelect(suggestion.action)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const DateConflictResolutionModal: React.FC<DateConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  onResolveConflict,
  onResolveAll
}) => {
  const [selectedResolutions, setSelectedResolutions] = useState<Map<number, ResolutionAction>>(new Map());
  const [isResolving, setIsResolving] = useState(false);

  const { errors, warnings } = useMemo(() => {
    return {
      errors: conflicts.filter(c => c.severity === 'error'),
      warnings: conflicts.filter(c => c.severity === 'warning')
    };
  }, [conflicts]);

  const handleResolutionSelect = (conflictIndex: number, resolution: ResolutionAction) => {
    const newResolutions = new Map(selectedResolutions);
    newResolutions.set(conflictIndex, resolution);
    setSelectedResolutions(newResolutions);
  };

  const handleResolveAll = async () => {
    setIsResolving(true);
    try {
      const resolutions = conflicts.map((conflict, index) => ({
        conflict,
        resolution: selectedResolutions.get(index) || {
          type: 'ignore' as const,
          description: 'ละเว้นข้อขัดแย้งนี้'
        }
      }));

      await onResolveAll(resolutions);
      onClose();
    } catch (error) {
      console.error('Error resolving conflicts:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const handleResolveSingle = async (conflict: DateConflict, conflictIndex: number) => {
    const resolution = selectedResolutions.get(conflictIndex);
    if (!resolution) return;

    setIsResolving(true);
    try {
      await onResolveConflict(conflict, resolution);
    } catch (error) {
      console.error('Error resolving conflict:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const canResolveAll = conflicts.every((_, index) => selectedResolutions.has(index));

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="แก้ไขข้อขัดแย้งในปฏิทิน"
      size="xl"
      type={errors.length > 0 ? "error" : "warning"}
    >
      <div className="space-y-6">
        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">สรุปข้อขัดแย้ง</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{conflicts.length}</div>
              <div className="text-sm text-gray-500">ทั้งหมด</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{errors.length}</div>
              <div className="text-sm text-gray-500">ข้อผิดพลาด</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{warnings.length}</div>
              <div className="text-sm text-gray-500">คำเตือน</div>
            </div>
          </div>
        </div>

        {/* Conflicts */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {conflicts.map((conflict, index) => (
            <ConflictResolutionCard
              key={index}
              conflict={conflict}
              selectedResolution={selectedResolutions.get(index) || null}
              onResolutionSelect={(resolution) => handleResolutionSelect(index, resolution)}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {selectedResolutions.size} จาก {conflicts.length} ข้อขัดแย้งได้เลือกวิธีการแก้ไขแล้ว
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isResolving}
              className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleResolveAll}
              disabled={!canResolveAll || isResolving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResolving ? 'กำลังแก้ไข...' : 'แก้ไขทั้งหมด'}
            </button>
          </div>
        </div>
      </div>
    </AdminModal>
  );
};

export default DateConflictResolutionModal;