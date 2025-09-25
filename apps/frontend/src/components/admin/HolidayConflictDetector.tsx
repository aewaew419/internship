'use client';

import React, { useMemo } from 'react';
import { 
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Holiday, Semester, DateConflict } from '@/lib/validation/dateValidation';
import dayjs from 'dayjs';

interface HolidayConflictDetectorProps {
  holidays: Holiday[];
  semesters: Semester[];
  onResolveConflict?: (conflict: HolidayConflict, resolution: string) => void;
}

interface HolidayConflict {
  id: string;
  type: 'overlap' | 'semester_conflict' | 'duration_warning' | 'recurring_issue';
  severity: 'error' | 'warning' | 'info';
  holiday1: Holiday;
  holiday2?: Holiday;
  semester?: Semester;
  message: string;
  suggestions: string[];
  conflictDates: {
    startDate: string;
    endDate: string;
  };
}

const ConflictIcon: React.FC<{ type: HolidayConflict['type']; severity: HolidayConflict['severity'] }> = ({ 
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
    case 'semester_conflict':
      return <ExclamationTriangleIcon className={iconClass} />;
    case 'duration_warning':
      return <ClockIcon className={iconClass} />;
    case 'recurring_issue':
      return <InformationCircleIcon className={iconClass} />;
    default:
      return <ExclamationTriangleIcon className={iconClass} />;
  }
};

const ConflictCard: React.FC<{
  conflict: HolidayConflict;
  onResolve?: (resolution: string) => void;
}> = ({ conflict, onResolve }) => {
  const severityColors = {
    error: 'border-red-200 bg-red-50',
    warning: 'border-yellow-200 bg-yellow-50',
    info: 'border-blue-200 bg-blue-50',
  };

  const severityTextColors = {
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
  };

  const typeLabels = {
    overlap: 'วันหยุดซ้อนทับ',
    semester_conflict: 'ขัดแย้งกับภาคการศึกษา',
    duration_warning: 'ระยะเวลาผิดปกติ',
    recurring_issue: 'ปัญหาวันหยุดประจำปี',
  };

  return (
    <div className={`border rounded-lg p-4 ${severityColors[conflict.severity]}`}>
      <div className="flex items-start space-x-3 mb-3">
        <ConflictIcon type={conflict.type} severity={conflict.severity} />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`text-sm font-medium ${severityTextColors[conflict.severity]}`}>
              {typeLabels[conflict.type]}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              conflict.severity === 'error' 
                ? 'bg-red-100 text-red-800' 
                : conflict.severity === 'warning'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800'
            }`}>
              {conflict.severity === 'error' ? 'ข้อผิดพลาด' : 
               conflict.severity === 'warning' ? 'คำเตือน' : 'ข้อมูล'}
            </span>
          </div>
          <p className={`text-sm font-medium ${severityTextColors[conflict.severity]} mb-2`}>
            {conflict.message}
          </p>
        </div>
      </div>

      {/* Involved Entities */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center space-x-2 text-sm">
          <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
          <span className="font-medium">{conflict.holiday1.name}</span>
          <span className="text-gray-500">
            ({dayjs(conflict.holiday1.startDate).format('DD/MM/YYYY')} - {dayjs(conflict.holiday1.endDate).format('DD/MM/YYYY')})
          </span>
        </div>
        
        {conflict.holiday2 && (
          <div className="flex items-center space-x-2 text-sm">
            <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
            <span className="font-medium">{conflict.holiday2.name}</span>
            <span className="text-gray-500">
              ({dayjs(conflict.holiday2.startDate).format('DD/MM/YYYY')} - {dayjs(conflict.holiday2.endDate).format('DD/MM/YYYY')})
            </span>
          </div>
        )}

        {conflict.semester && (
          <div className="flex items-center space-x-2 text-sm">
            <CalendarDaysIcon className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-blue-700">{conflict.semester.name}</span>
            <span className="text-gray-500">
              ({dayjs(conflict.semester.startDate).format('DD/MM/YYYY')} - {dayjs(conflict.semester.endDate).format('DD/MM/YYYY')})
            </span>
          </div>
        )}
      </div>

      {/* Conflict Date Range */}
      <div className="mb-3 p-2 bg-white rounded border">
        <div className="text-xs text-gray-500 mb-1">ช่วงวันที่ที่ขัดแย้ง</div>
        <div className="text-sm font-medium text-gray-900">
          {dayjs(conflict.conflictDates.startDate).format('DD/MM/YYYY')} - {dayjs(conflict.conflictDates.endDate).format('DD/MM/YYYY')}
        </div>
      </div>

      {/* Suggestions */}
      {conflict.suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">คำแนะนำการแก้ไข:</div>
          <ul className="space-y-1">
            {conflict.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-xs text-gray-400 mt-1">•</span>
                <span className="text-xs text-gray-600 flex-1">{suggestion}</span>
                {onResolve && (
                  <button
                    onClick={() => onResolve(suggestion)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    ใช้
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const HolidayConflictDetector: React.FC<HolidayConflictDetectorProps> = ({
  holidays,
  semesters,
  onResolveConflict
}) => {
  const conflicts = useMemo((): HolidayConflict[] => {
    const detectedConflicts: HolidayConflict[] = [];

    // Check for holiday overlaps
    for (let i = 0; i < holidays.length; i++) {
      for (let j = i + 1; j < holidays.length; j++) {
        const holiday1 = holidays[i];
        const holiday2 = holidays[j];
        
        const start1 = dayjs(holiday1.startDate);
        const end1 = dayjs(holiday1.endDate);
        const start2 = dayjs(holiday2.startDate);
        const end2 = dayjs(holiday2.endDate);

        // Check for overlap
        const overlapStart = start1.isAfter(start2) ? start1 : start2;
        const overlapEnd = end1.isBefore(end2) ? end1 : end2;

        if (overlapStart.isSameOrBefore(overlapEnd)) {
          const severity = holiday1.type === holiday2.type ? 'error' : 'warning';
          
          detectedConflicts.push({
            id: `overlap-${holiday1.id}-${holiday2.id}`,
            type: 'overlap',
            severity,
            holiday1,
            holiday2,
            message: `วันหยุด "${holiday1.name}" และ "${holiday2.name}" มีวันที่ซ้อนทับกัน`,
            suggestions: [
              'ปรับวันที่ของวันหยุดหนึ่งให้ไม่ซ้อนทับ',
              'รวมวันหยุดเป็นช่วงเดียวกันหากเป็นวันหยุดประเภทเดียวกัน',
              'ตรวจสอบความถูกต้องของวันที่'
            ],
            conflictDates: {
              startDate: overlapStart.format('YYYY-MM-DD'),
              endDate: overlapEnd.format('YYYY-MM-DD'),
            }
          });
        }
      }
    }

    // Check for conflicts with semesters
    holidays.forEach(holiday => {
      semesters.forEach(semester => {
        const holidayStart = dayjs(holiday.startDate);
        const holidayEnd = dayjs(holiday.endDate);
        const semesterStart = dayjs(semester.startDate);
        const semesterEnd = dayjs(semester.endDate);

        // Check if university holiday falls within semester period
        if (holiday.type === 'university' && 
            holidayStart.isBetween(semesterStart, semesterEnd, 'day', '[]')) {
          
          detectedConflicts.push({
            id: `semester-conflict-${holiday.id}-${semester.id}`,
            type: 'semester_conflict',
            severity: 'warning',
            holiday1: holiday,
            semester,
            message: `วันหยุดมหาวิทยาลัย "${holiday.name}" อยู่ในช่วงภาคการศึกษา "${semester.name}"`,
            suggestions: [
              'พิจารณาเปลี่ยนประเภทเป็น "วันหยุดพักภาคการศึกษา"',
              'ตรวจสอบว่าวันหยุดนี้เหมาะสมหรือไม่',
              'ปรับวันที่ให้อยู่นอกช่วงภาคการศึกษา'
            ],
            conflictDates: {
              startDate: holiday.startDate,
              endDate: holiday.endDate,
            }
          });
        }

        // Check if semester break is properly positioned
        if (holiday.type === 'semester_break' && holiday.semesterId === semester.id) {
          const isWithinSemester = holidayStart.isBetween(semesterStart, semesterEnd, 'day', '[]');
          
          if (isWithinSemester) {
            detectedConflicts.push({
              id: `break-position-${holiday.id}-${semester.id}`,
              type: 'semester_conflict',
              severity: 'info',
              holiday1: holiday,
              semester,
              message: `วันหยุดพักภาค "${holiday.name}" อยู่ในช่วงภาคการศึกษา "${semester.name}"`,
              suggestions: [
                'ตรวจสอบว่าเป็นวันหยุดกลางภาคหรือไม่',
                'พิจารณาเปลี่ยนประเภทเป็น "วันหยุดมหาวิทยาลัย"'
              ],
              conflictDates: {
                startDate: holiday.startDate,
                endDate: holiday.endDate,
              }
            });
          }
        }
      });
    });

    // Check for unusual duration
    holidays.forEach(holiday => {
      const duration = dayjs(holiday.endDate).diff(dayjs(holiday.startDate), 'day') + 1;
      
      if (duration > 7) {
        detectedConflicts.push({
          id: `duration-${holiday.id}`,
          type: 'duration_warning',
          severity: 'info',
          holiday1: holiday,
          message: `วันหยุด "${holiday.name}" มีระยะเวลานาน ${duration} วัน`,
          suggestions: [
            'ตรวจสอบความถูกต้องของวันที่',
            'พิจารณาแบ่งเป็นหลายวันหยุด',
            'ตรวจสอบว่าเป็นวันหยุดพิเศษหรือไม่'
          ],
          conflictDates: {
            startDate: holiday.startDate,
            endDate: holiday.endDate,
          }
        });
      }
    });

    // Check for recurring holiday issues
    const recurringHolidays = holidays.filter(h => h.isRecurring);
    const currentYear = new Date().getFullYear();
    
    recurringHolidays.forEach(holiday => {
      const holidayYear = dayjs(holiday.startDate).year();
      
      if (Math.abs(holidayYear - currentYear) > 1) {
        detectedConflicts.push({
          id: `recurring-year-${holiday.id}`,
          type: 'recurring_issue',
          severity: 'warning',
          holiday1: holiday,
          message: `วันหยุดประจำปี "${holiday.name}" อยู่ในปี ${holidayYear} ซึ่งห่างจากปีปัจจุบัน`,
          suggestions: [
            'อัปเดตปีของวันหยุดให้เป็นปีปัจจุบัน',
            'ตรวจสอบการตั้งค่าวันหยุดประจำปี',
            'สร้างวันหยุดใหม่สำหรับปีปัจจุบัน'
          ],
          conflictDates: {
            startDate: holiday.startDate,
            endDate: holiday.endDate,
          }
        });
      }
    });

    return detectedConflicts;
  }, [holidays, semesters]);

  const { errors, warnings, infos } = useMemo(() => {
    return {
      errors: conflicts.filter(c => c.severity === 'error'),
      warnings: conflicts.filter(c => c.severity === 'warning'),
      infos: conflicts.filter(c => c.severity === 'info'),
    };
  }, [conflicts]);

  if (conflicts.length === 0) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm font-medium text-green-800">
            ไม่พบข้อขัดแย้งในวันหยุด
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">สรุปข้อขัดแย้งวันหยุด</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
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
          <div>
            <div className="text-2xl font-bold text-blue-600">{infos.length}</div>
            <div className="text-sm text-gray-500">ข้อมูล</div>
          </div>
        </div>
      </div>

      {/* Conflicts by Severity */}
      {errors.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-red-800 mb-3 flex items-center">
            <XCircleIcon className="w-5 h-5 mr-2" />
            ข้อผิดพลาดที่ต้องแก้ไข ({errors.length})
          </h4>
          <div className="space-y-3">
            {errors.map((conflict) => (
              <ConflictCard
                key={conflict.id}
                conflict={conflict}
                onResolve={(resolution) => onResolveConflict?.(conflict, resolution)}
              />
            ))}
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-yellow-800 mb-3 flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            คำเตือน ({warnings.length})
          </h4>
          <div className="space-y-3">
            {warnings.map((conflict) => (
              <ConflictCard
                key={conflict.id}
                conflict={conflict}
                onResolve={(resolution) => onResolveConflict?.(conflict, resolution)}
              />
            ))}
          </div>
        </div>
      )}

      {infos.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-blue-800 mb-3 flex items-center">
            <InformationCircleIcon className="w-5 h-5 mr-2" />
            ข้อมูลเพิ่มเติม ({infos.length})
          </h4>
          <div className="space-y-3">
            {infos.map((conflict) => (
              <ConflictCard
                key={conflict.id}
                conflict={conflict}
                onResolve={(resolution) => onResolveConflict?.(conflict, resolution)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayConflictDetector;