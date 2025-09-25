'use client';

import React, { useState, useMemo } from 'react';
import { 
  PlayIcon,
  PauseIcon,
  DocumentDuplicateIcon,
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Semester } from '@/lib/validation/dateValidation';
import dayjs from 'dayjs';

interface SemesterQuickActionsProps {
  semesters: Semester[];
  onActivateSemester: (id: number) => Promise<void>;
  onDeactivateSemester: (id: number) => Promise<void>;
  onDuplicateSemester: (semester: Semester) => Promise<void>;
  onBulkUpdate: (semesterIds: number[], updates: Partial<Semester>) => Promise<void>;
}

interface SemesterStatus {
  id: number;
  name: string;
  status: 'upcoming' | 'active' | 'ended';
  daysUntilStart: number;
  daysUntilEnd: number;
  registrationStatus: 'not_started' | 'open' | 'closed';
  examStatus: 'not_started' | 'ongoing' | 'completed';
}

const SemesterStatusCard: React.FC<{
  semester: Semester;
  status: SemesterStatus;
  onActivate: () => void;
  onDeactivate: () => void;
  onDuplicate: () => void;
}> = ({ semester, status, onActivate, onDeactivate, onDuplicate }) => {
  const getStatusColor = () => {
    switch (status.status) {
      case 'upcoming':
        return 'border-blue-200 bg-blue-50';
      case 'active':
        return 'border-green-200 bg-green-50';
      case 'ended':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'upcoming':
        return <ClockIcon className="w-5 h-5 text-blue-600" />;
      case 'active':
        return <PlayIcon className="w-5 h-5 text-green-600" />;
      case 'ended':
        return <CheckCircleIcon className="w-5 h-5 text-gray-600" />;
      default:
        return <CalendarDaysIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'upcoming':
        return `เริ่มในอีก ${status.daysUntilStart} วัน`;
      case 'active':
        return `เหลืออีก ${status.daysUntilEnd} วัน`;
      case 'ended':
        return 'สิ้นสุดแล้ว';
      default:
        return '';
    }
  };

  const getRegistrationStatusText = () => {
    switch (status.registrationStatus) {
      case 'not_started':
        return 'ยังไม่เปิดลงทะเบียน';
      case 'open':
        return 'เปิดลงทะเบียน';
      case 'closed':
        return 'ปิดลงทะเบียนแล้ว';
      default:
        return '';
    }
  };

  const getRegistrationStatusColor = () => {
    switch (status.registrationStatus) {
      case 'not_started':
        return 'text-gray-600';
      case 'open':
        return 'text-green-600';
      case 'closed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-medium text-gray-900">{semester.name}</h3>
            <p className="text-sm text-gray-600">{getStatusText()}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {semester.isActive ? (
            <button
              onClick={onDeactivate}
              className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors"
              title="ปิดใช้งาน"
            >
              <PauseIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onActivate}
              className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
              title="เปิดใช้งาน"
            >
              <PlayIcon className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={onDuplicate}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
            title="ทำสำเนา"
          >
            <DocumentDuplicateIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">การลงทะเบียน:</span>
          <span className={`font-medium ${getRegistrationStatusColor()}`}>
            {getRegistrationStatusText()}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">การสอบ:</span>
          <span className="font-medium text-gray-900">
            {status.examStatus === 'not_started' && 'ยังไม่เริ่ม'}
            {status.examStatus === 'ongoing' && 'กำลังสอบ'}
            {status.examStatus === 'completed' && 'สอบเสร็จแล้ว'}
          </span>
        </div>

        {semester.isActive && (
          <div className="flex items-center space-x-1 pt-2 border-t border-gray-200">
            <CheckCircleIcon className="w-4 h-4 text-green-600" />
            <span className="text-green-700 font-medium">ใช้งานอยู่</span>
          </div>
        )}
      </div>
    </div>
  );
};

const BulkActionsPanel: React.FC<{
  selectedSemesters: number[];
  semesters: Semester[];
  onBulkActivate: () => void;
  onBulkDeactivate: () => void;
  onClearSelection: () => void;
}> = ({ selectedSemesters, semesters, onBulkActivate, onBulkDeactivate, onClearSelection }) => {
  if (selectedSemesters.length === 0) return null;

  const selectedSemesterNames = semesters
    .filter(s => selectedSemesters.includes(s.id!))
    .map(s => s.name)
    .join(', ');

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-blue-900">
            เลือกแล้ว {selectedSemesters.length} ภาคการศึกษา
          </h4>
          <p className="text-sm text-blue-700 mt-1">{selectedSemesterNames}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onBulkActivate}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
          >
            เปิดใช้งานทั้งหมด
          </button>
          <button
            onClick={onBulkDeactivate}
            className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
          >
            ปิดใช้งานทั้งหมด
          </button>
          <button
            onClick={onClearSelection}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};

export const SemesterQuickActions: React.FC<SemesterQuickActionsProps> = ({
  semesters,
  onActivateSemester,
  onDeactivateSemester,
  onDuplicateSemester,
  onBulkUpdate
}) => {
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([]);

  // Calculate semester statuses
  const semesterStatuses = useMemo((): SemesterStatus[] => {
    const now = dayjs();
    
    return semesters.map(semester => {
      const startDate = dayjs(semester.startDate);
      const endDate = dayjs(semester.endDate);
      const regStartDate = dayjs(semester.registrationStartDate);
      const regEndDate = dayjs(semester.registrationEndDate);
      const examStartDate = dayjs(semester.examStartDate);
      const examEndDate = dayjs(semester.examEndDate);

      let status: 'upcoming' | 'active' | 'ended';
      if (now.isBefore(startDate)) {
        status = 'upcoming';
      } else if (now.isAfter(endDate)) {
        status = 'ended';
      } else {
        status = 'active';
      }

      let registrationStatus: 'not_started' | 'open' | 'closed';
      if (now.isBefore(regStartDate)) {
        registrationStatus = 'not_started';
      } else if (now.isAfter(regEndDate)) {
        registrationStatus = 'closed';
      } else {
        registrationStatus = 'open';
      }

      let examStatus: 'not_started' | 'ongoing' | 'completed';
      if (now.isBefore(examStartDate)) {
        examStatus = 'not_started';
      } else if (now.isAfter(examEndDate)) {
        examStatus = 'completed';
      } else {
        examStatus = 'ongoing';
      }

      return {
        id: semester.id!,
        name: semester.name,
        status,
        daysUntilStart: startDate.diff(now, 'day'),
        daysUntilEnd: endDate.diff(now, 'day'),
        registrationStatus,
        examStatus,
      };
    });
  }, [semesters]);

  const handleSemesterSelect = (semesterId: number, selected: boolean) => {
    if (selected) {
      setSelectedSemesters(prev => [...prev, semesterId]);
    } else {
      setSelectedSemesters(prev => prev.filter(id => id !== semesterId));
    }
  };

  const handleBulkActivate = async () => {
    try {
      await onBulkUpdate(selectedSemesters, { isActive: true });
      setSelectedSemesters([]);
    } catch (error) {
      console.error('Error bulk activating semesters:', error);
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      await onBulkUpdate(selectedSemesters, { isActive: false });
      setSelectedSemesters([]);
    } catch (error) {
      console.error('Error bulk deactivating semesters:', error);
    }
  };

  const handleClearSelection = () => {
    setSelectedSemesters([]);
  };

  // Group semesters by status
  const groupedSemesters = useMemo(() => {
    const groups = {
      active: [] as { semester: Semester; status: SemesterStatus }[],
      upcoming: [] as { semester: Semester; status: SemesterStatus }[],
      ended: [] as { semester: Semester; status: SemesterStatus }[],
    };

    semesters.forEach(semester => {
      const status = semesterStatuses.find(s => s.id === semester.id!);
      if (status) {
        groups[status.status].push({ semester, status });
      }
    });

    return groups;
  }, [semesters, semesterStatuses]);

  if (semesters.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <CalendarDaysIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-600">ยังไม่มีภาคการศึกษาให้จัดการ</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bulk Actions Panel */}
      <BulkActionsPanel
        selectedSemesters={selectedSemesters}
        semesters={semesters}
        onBulkActivate={handleBulkActivate}
        onBulkDeactivate={handleBulkDeactivate}
        onClearSelection={handleClearSelection}
      />

      {/* Active Semesters */}
      {groupedSemesters.active.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <PlayIcon className="w-5 h-5 text-green-600 mr-2" />
            ภาคการศึกษาที่กำลังดำเนินการ ({groupedSemesters.active.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedSemesters.active.map(({ semester, status }) => (
              <div key={semester.id} className="relative">
                <input
                  type="checkbox"
                  checked={selectedSemesters.includes(semester.id!)}
                  onChange={(e) => handleSemesterSelect(semester.id!, e.target.checked)}
                  className="absolute top-2 left-2 z-10"
                />
                <SemesterStatusCard
                  semester={semester}
                  status={status}
                  onActivate={() => onActivateSemester(semester.id!)}
                  onDeactivate={() => onDeactivateSemester(semester.id!)}
                  onDuplicate={() => onDuplicateSemester(semester)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Semesters */}
      {groupedSemesters.upcoming.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <ClockIcon className="w-5 h-5 text-blue-600 mr-2" />
            ภาคการศึกษาที่จะมาถึง ({groupedSemesters.upcoming.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedSemesters.upcoming.map(({ semester, status }) => (
              <div key={semester.id} className="relative">
                <input
                  type="checkbox"
                  checked={selectedSemesters.includes(semester.id!)}
                  onChange={(e) => handleSemesterSelect(semester.id!, e.target.checked)}
                  className="absolute top-2 left-2 z-10"
                />
                <SemesterStatusCard
                  semester={semester}
                  status={status}
                  onActivate={() => onActivateSemester(semester.id!)}
                  onDeactivate={() => onDeactivateSemester(semester.id!)}
                  onDuplicate={() => onDuplicateSemester(semester)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ended Semesters */}
      {groupedSemesters.ended.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-gray-600 mr-2" />
            ภาคการศึกษาที่สิ้นสุดแล้ว ({groupedSemesters.ended.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedSemesters.ended.map(({ semester, status }) => (
              <div key={semester.id} className="relative">
                <input
                  type="checkbox"
                  checked={selectedSemesters.includes(semester.id!)}
                  onChange={(e) => handleSemesterSelect(semester.id!, e.target.checked)}
                  className="absolute top-2 left-2 z-10"
                />
                <SemesterStatusCard
                  semester={semester}
                  status={status}
                  onActivate={() => onActivateSemester(semester.id!)}
                  onDeactivate={() => onDeactivateSemester(semester.id!)}
                  onDuplicate={() => onDuplicateSemester(semester)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SemesterQuickActions;