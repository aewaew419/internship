'use client';

import React, { useMemo, useState } from 'react';
import { DateConflict } from '@/lib/validation/dateValidation';
import { 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import dayjs from 'dayjs';

interface CalendarConflictOverlayProps {
  conflicts: DateConflict[];
  currentDate: Date;
  viewMode: 'month' | 'semester' | 'year';
  onConflictClick?: (conflict: DateConflict) => void;
}

const ConflictDot: React.FC<{
  severity: 'error' | 'warning';
  count: number;
  onClick?: () => void;
}> = ({ severity, count, onClick }) => {
  const colorClass = severity === 'error' 
    ? 'bg-red-500 border-red-600' 
    : 'bg-yellow-500 border-yellow-600';

  const Icon = severity === 'error' ? XCircleIcon : ExclamationTriangleIcon;

  return (
    <button
      onClick={onClick}
      className={`
        absolute top-1 right-1 w-5 h-5 rounded-full border-2 ${colorClass}
        flex items-center justify-center text-white text-xs font-bold
        hover:scale-110 transition-all duration-200
        shadow-sm hover:shadow-md z-10 group
      `}
      title={`${count} ${severity === 'error' ? 'ข้อผิดพลาด' : 'คำเตือน'}`}
    >
      <Icon className="w-3 h-3" />
      {count > 1 && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-gray-800 text-white text-xs rounded-full flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
};

const ConflictTooltip: React.FC<{
  conflicts: DateConflict[];
  position: { x: number; y: number };
  onClose: () => void;
  onResolveConflict?: (conflict: DateConflict) => void;
}> = ({ conflicts, position, onClose, onResolveConflict }) => {
  return (
    <div 
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm"
      style={{ 
        left: position.x, 
        top: position.y,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">ข้อขัดแย้งในวันนี้</h4>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <XCircleIcon className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {conflicts.map((conflict, index) => (
          <div 
            key={index}
            className={`p-2 rounded border ${
              conflict.severity === 'error' 
                ? 'bg-red-50 border-red-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-start space-x-2">
              {conflict.severity === 'error' ? (
                <XCircleIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              ) : (
                <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {conflict.entity1.name}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {conflict.message}
                </p>
                {onResolveConflict && conflict.suggestions && conflict.suggestions.length > 0 && (
                  <button
                    onClick={() => onResolveConflict(conflict)}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                  >
                    ดูคำแนะนำ
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ConflictHighlight: React.FC<{
  conflict: DateConflict;
  isVisible: boolean;
  onClick?: () => void;
}> = ({ conflict, isVisible, onClick }) => {
  if (!isVisible) return null;

  const highlightClass = conflict.severity === 'error'
    ? 'bg-red-100 border-red-300 shadow-red-200'
    : 'bg-yellow-100 border-yellow-300 shadow-yellow-200';

  const pulseClass = conflict.severity === 'error'
    ? 'animate-pulse'
    : '';

  return (
    <div 
      className={`
        absolute inset-0 ${highlightClass} border-2 border-dashed
        opacity-40 rounded ${pulseClass} shadow-sm
        hover:opacity-60 transition-opacity duration-200
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    />
  );
};

export const CalendarConflictOverlay: React.FC<CalendarConflictOverlayProps> = ({
  conflicts,
  currentDate,
  viewMode,
  onConflictClick
}) => {
  const [tooltipData, setTooltipData] = useState<{
    conflicts: DateConflict[];
    position: { x: number; y: number };
  } | null>(null);

  // Group conflicts by date for markers
  const conflictMarkers = useMemo(() => {
    const markers: Record<string, { conflicts: DateConflict[]; severity: 'error' | 'warning' }> = {};
    
    conflicts.forEach(conflict => {
      const startDate = dayjs(conflict.conflictDates.startDate);
      const endDate = dayjs(conflict.conflictDates.endDate);
      
      // Create markers for each day in the conflict range
      let currentDay = startDate;
      while (currentDay.isSameOrBefore(endDate)) {
        const dateKey = currentDay.format('YYYY-MM-DD');
        
        if (!markers[dateKey]) {
          markers[dateKey] = {
            conflicts: [],
            severity: conflict.severity,
          };
        }
        
        markers[dateKey].conflicts.push(conflict);
        
        // Upgrade severity if we have an error
        if (conflict.severity === 'error') {
          markers[dateKey].severity = 'error';
        }
        
        currentDay = currentDay.add(1, 'day');
      }
    });
    
    return markers;
  }, [conflicts]);

  // Get visible conflicts for current view
  const visibleConflicts = useMemo(() => {
    return conflicts.filter(conflict => {
      const startDate = dayjs(conflict.conflictDates.startDate);
      const endDate = dayjs(conflict.conflictDates.endDate);
      const current = dayjs(currentDate);

      switch (viewMode) {
        case 'month':
          return startDate.isSame(current, 'month') || endDate.isSame(current, 'month') ||
                 (startDate.isBefore(current, 'month') && endDate.isAfter(current, 'month'));
        case 'semester':
          return startDate.isBefore(current.add(6, 'month')) && endDate.isAfter(current.subtract(6, 'month'));
        case 'year':
          return startDate.isSame(current, 'year') || endDate.isSame(current, 'year') ||
                 (startDate.isBefore(current, 'year') && endDate.isAfter(current, 'year'));
        default:
          return true;
      }
    });
  }, [conflicts, currentDate, viewMode]);

  const handleConflictClick = (conflict: DateConflict, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (onConflictClick) {
      onConflictClick(conflict);
    } else {
      // Show tooltip with conflict details
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setTooltipData({
        conflicts: [conflict],
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top
        }
      });
    }
  };

  const handleMarkerClick = (dateConflicts: DateConflict[], event: React.MouseEvent) => {
    event.stopPropagation();
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setTooltipData({
      conflicts: dateConflicts,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top
      }
    });
  };

  const closeTooltip = () => {
    setTooltipData(null);
  };

  // Close tooltip when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setTooltipData(null);
    };

    if (tooltipData) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [tooltipData]);

  return (
    <>
      <div className="absolute inset-0 pointer-events-none">
        {/* Conflict highlights */}
        {visibleConflicts.map((conflict, index) => (
          <ConflictHighlight
            key={index}
            conflict={conflict}
            isVisible={true}
            onClick={(event) => handleConflictClick(conflict, event)}
          />
        ))}

        {/* Conflict markers for specific dates */}
        {Object.entries(conflictMarkers).map(([dateKey, marker]) => {
          const date = dayjs(dateKey);
          const current = dayjs(currentDate);
          
          // Check if this date marker should be visible in current view
          let shouldShow = false;
          switch (viewMode) {
            case 'month':
              shouldShow = date.isSame(current, 'month');
              break;
            case 'semester':
              shouldShow = date.isBetween(current.subtract(3, 'month'), current.add(3, 'month'), 'day', '[]');
              break;
            case 'year':
              shouldShow = date.isSame(current, 'year');
              break;
          }

          if (!shouldShow) return null;

          return (
            <div
              key={dateKey}
              className="absolute pointer-events-auto"
              style={{
                // Position would be calculated based on calendar layout
                // This is a simplified positioning
                top: '10px',
                right: '10px',
              }}
            >
              <ConflictDot
                severity={marker.severity}
                count={marker.conflicts.length}
                onClick={(event) => handleMarkerClick(marker.conflicts, event)}
              />
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltipData && (
        <ConflictTooltip
          conflicts={tooltipData.conflicts}
          position={tooltipData.position}
          onClose={closeTooltip}
          onResolveConflict={(conflict) => {
            onConflictClick?.(conflict);
            closeTooltip();
          }}
        />
      )}
    </>
  );
};

export default CalendarConflictOverlay;