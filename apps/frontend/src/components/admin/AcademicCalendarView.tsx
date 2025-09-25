'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  CalendarIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';
import { AdminModal } from './AdminModal';
import { CalendarGrid } from './CalendarGrid';
import { YearOverview } from './YearOverview';
import { DateConflictIndicator } from './DateConflictIndicator';
import { CalendarConflictOverlay } from './CalendarConflictOverlay';
import { DateConflictResolutionModal } from './DateConflictResolutionModal';
import { ValidationMessagePanel } from './ValidationMessagePanel';
import { SemesterManager } from './SemesterManager';
import { HolidayManager } from './HolidayManager';
import { useDateValidation } from '@/hooks/useDateValidation';
import { DateConflict } from '@/lib/validation/dateValidation';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

dayjs.locale('th');

// Types based on the design document
interface Semester {
  id: number;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  examStartDate: string;
  examEndDate: string;
  isActive: boolean;
  holidays: Holiday[];
}

interface Holiday {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  type: 'national' | 'university' | 'semester_break';
  description?: string;
  isRecurring: boolean;
  semesterId?: number;
}

interface AcademicCalendarViewProps {
  academicYear: string;
  semesters: Semester[];
  holidays: Holiday[];
  onSemesterCreate?: (semester: Omit<Semester, 'id'>) => Promise<void>;
  onSemesterUpdate?: (id: number, semester: Partial<Semester>) => Promise<void>;
  onSemesterDelete?: (id: number) => Promise<void>;
  onHolidayCreate?: (holiday: Omit<Holiday, 'id'>) => Promise<void>;
  onHolidayUpdate?: (id: number, holiday: Partial<Holiday>) => Promise<void>;
  onHolidayDelete?: (id: number) => Promise<void>;
}

type ViewMode = 'month' | 'semester' | 'year';

export const AcademicCalendarView: React.FC<AcademicCalendarViewProps> = ({
  academicYear,
  semesters = [],
  holidays = [],
  onSemesterCreate,
  onSemesterUpdate,
  onSemesterDelete,
  onHolidayCreate,
  onHolidayUpdate,
  onHolidayDelete,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('semester');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<DateConflict | null>(null);

  // Date validation integration
  const dateValidation = useDateValidation({
    autoValidate: true,
    debounceMs: 300,
  });

  // Get current academic year semesters
  const currentSemesters = useMemo(() => {
    return semesters.filter(semester => semester.academicYear === academicYear);
  }, [semesters, academicYear]);

  // Get holidays for current academic year
  const currentHolidays = useMemo(() => {
    const semesterIds = currentSemesters.map(s => s.id);
    return holidays.filter(holiday => 
      !holiday.semesterId || semesterIds.includes(holiday.semesterId)
    );
  }, [holidays, currentSemesters]);

  // Validate academic calendar whenever data changes
  React.useEffect(() => {
    if (currentSemesters.length > 0 || currentHolidays.length > 0) {
      dateValidation.validateAcademicCalendar(currentSemesters, currentHolidays);
    }
  }, [currentSemesters, currentHolidays, dateValidation]);

  // Convert semesters and holidays to calendar events
  const calendarEvents = useMemo(() => {
    const events: Array<{
      id: number;
      title: string;
      startDate: string;
      endDate: string;
      type: 'semester' | 'holiday' | 'registration' | 'exam';
      color: string;
    }> = [];

    // Add semester events
    currentSemesters.forEach(semester => {
      events.push({
        id: semester.id,
        title: semester.name,
        startDate: semester.startDate,
        endDate: semester.endDate,
        type: 'semester',
        color: '#3B82F6'
      });

      // Add registration periods
      events.push({
        id: semester.id + 1000,
        title: `ลงทะเบียน ${semester.name}`,
        startDate: semester.registrationStartDate,
        endDate: semester.registrationEndDate,
        type: 'registration',
        color: '#10B981'
      });

      // Add exam periods
      events.push({
        id: semester.id + 2000,
        title: `สอบ ${semester.name}`,
        startDate: semester.examStartDate,
        endDate: semester.examEndDate,
        type: 'exam',
        color: '#8B5CF6'
      });
    });

    // Add holiday events
    currentHolidays.forEach(holiday => {
      events.push({
        id: holiday.id + 3000,
        title: holiday.name,
        startDate: holiday.startDate,
        endDate: holiday.endDate,
        type: 'holiday',
        color: '#EF4444'
      });
    });

    return events;
  }, [currentSemesters, currentHolidays]);

  // Navigation handlers
  const navigatePrevious = useCallback(() => {
    let newDate = dayjs(currentDate);
    switch (viewMode) {
      case 'month':
        newDate = newDate.subtract(1, 'month');
        break;
      case 'semester':
        newDate = newDate.subtract(6, 'month');
        break;
      case 'year':
        newDate = newDate.subtract(1, 'year');
        break;
    }
    setCurrentDate(newDate.toDate());
  }, [currentDate, viewMode]);

  const navigateNext = useCallback(() => {
    let newDate = dayjs(currentDate);
    switch (viewMode) {
      case 'month':
        newDate = newDate.add(1, 'month');
        break;
      case 'semester':
        newDate = newDate.add(6, 'month');
        break;
      case 'year':
        newDate = newDate.add(1, 'year');
        break;
    }
    setCurrentDate(newDate.toDate());
  }, [currentDate, viewMode]);

  // Modal handlers
  const handleCreateSemester = useCallback(() => {
    setSelectedSemester(null);
    setIsEditing(false);
    setShowSemesterModal(true);
  }, []);

  const handleEditSemester = useCallback((semester: Semester) => {
    setSelectedSemester(semester);
    setIsEditing(true);
    setShowSemesterModal(true);
  }, []);

  const handleCreateHoliday = useCallback(() => {
    setSelectedHoliday(null);
    setIsEditing(false);
    setShowHolidayModal(true);
  }, []);

  const handleEditHoliday = useCallback((holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setIsEditing(true);
    setShowHolidayModal(true);
  }, []);

  // Get display title based on view mode
  const getDisplayTitle = useCallback(() => {
    const current = dayjs(currentDate);
    switch (viewMode) {
      case 'month':
        return current.format('MMMM YYYY');
      case 'semester':
        return `ปีการศึกษา ${academicYear}`;
      case 'year':
        return current.format('YYYY');
    }
  }, [currentDate, viewMode, academicYear]);

  // Handle calendar interactions
  const handleDateClick = useCallback((date: Date) => {
    console.log('Date clicked:', date);
    // Could open a modal to create events on this date
  }, []);

  const handleEventClick = useCallback((event: any) => {
    console.log('Event clicked:', event);
    // Could open event details or edit modal
  }, []);

  const handleEventDrop = useCallback((eventId: number, newDate: Date) => {
    console.log('Event dropped:', eventId, newDate);
    // Could update event date
  }, []);

  // Handle conflict resolution
  const handleConflictClick = useCallback((conflict: DateConflict) => {
    setSelectedConflict(conflict);
    setShowResolutionModal(true);
  }, []);

  const handleResolveConflict = useCallback(async (conflict: DateConflict, resolution: any) => {
    console.log('Resolving conflict:', conflict, 'with resolution:', resolution);
    // Implement actual conflict resolution logic here
    // This would typically involve updating the calendar data
    
    // For now, just close the modal
    setShowResolutionModal(false);
    setSelectedConflict(null);
  }, []);

  const handleResolveAllConflicts = useCallback(async (resolutions: any[]) => {
    console.log('Resolving all conflicts:', resolutions);
    // Implement batch conflict resolution logic here
    
    // For now, just close the modal
    setShowResolutionModal(false);
  }, []);

  const handleShowAllConflicts = useCallback(() => {
    if (dateValidation.conflicts.length > 0) {
      setShowResolutionModal(true);
    }
  }, [dateValidation.conflicts]);

  // Render month view with calendar grid
  const renderMonthView = () => {
    if (viewMode !== 'month') return null;

    return (
      <CalendarGrid
        currentDate={currentDate}
        events={calendarEvents}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
        onEventDrop={handleEventDrop}
      />
    );
  };

  // Handle year view interactions
  const handleMonthClick = useCallback((month: Date) => {
    setCurrentDate(month);
    setViewMode('month');
  }, []);

  // Render year view
  const renderYearView = () => {
    if (viewMode !== 'year') return null;

    return (
      <YearOverview
        year={currentDate.getFullYear()}
        events={calendarEvents}
        onMonthClick={handleMonthClick}
        onEventClick={handleEventClick}
      />
    );
  };

  // Render timeline view for semester mode
  const renderTimelineView = () => {
    if (viewMode !== 'semester') return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="space-y-6">
          {currentSemesters.map((semester) => (
            <div key={semester.id} className="relative">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {semester.name}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditSemester(semester)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="แก้ไขภาคการศึกษา"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onSemesterDelete?.(semester.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="ลบภาคการศึกษา"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Semester timeline */}
              <div className="relative bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>{dayjs(semester.startDate).format('DD/MM/YYYY')}</span>
                  <span>{dayjs(semester.endDate).format('DD/MM/YYYY')}</span>
                </div>
                
                {/* Timeline bar */}
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                      semester.isActive ? 'bg-blue-500' : 'bg-gray-400'
                    }`}
                    style={{ width: '100%' }}
                  />
                </div>
                
                {/* Important dates */}
                <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">ลงทะเบียน:</span>
                    <div className="text-gray-700">
                      {dayjs(semester.registrationStartDate).format('DD/MM/YYYY')} - 
                      {dayjs(semester.registrationEndDate).format('DD/MM/YYYY')}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">สอบ:</span>
                    <div className="text-gray-700">
                      {dayjs(semester.examStartDate).format('DD/MM/YYYY')} - 
                      {dayjs(semester.examEndDate).format('DD/MM/YYYY')}
                    </div>
                  </div>
                </div>
                
                {/* Holidays in this semester */}
                {semester.holidays.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs text-gray-500">วันหยุด:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {semester.holidays.map((holiday) => (
                        <span
                          key={holiday.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800"
                        >
                          {holiday.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {currentSemesters.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>ยังไม่มีภาคการศึกษาสำหรับปีการศึกษา {academicYear}</p>
              <button
                onClick={handleCreateSemester}
                className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                เพิ่มภาคการศึกษาใหม่
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">ปฏิทินการศึกษา</h1>
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {(['month', 'semester', 'year'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-105 ${
                  viewMode === mode
                    ? 'bg-white text-gray-900 shadow-sm scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {mode === 'month' ? 'เดือน' : mode === 'semester' ? 'ภาคการศึกษา' : 'ปี'}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Enhanced conflict indicator button */}
          {dateValidation.conflicts.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowConflicts(!showConflicts)}
                className={`inline-flex items-center px-3 py-2 rounded-lg border transition-colors ${
                  dateValidation.hasErrors
                    ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                    : 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {dateValidation.conflicts.length} ข้อขัดแย้ง
              </button>
              
              {dateValidation.hasErrors && (
                <button
                  onClick={handleShowAllConflicts}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  แก้ไขทั้งหมด
                </button>
              )}
            </div>
          )}
          
          <button
            onClick={handleCreateSemester}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            เพิ่มภาคการศึกษา
          </button>
          <button
            onClick={handleCreateHoliday}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            เพิ่มวันหยุด
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border p-4">
        <button
          onClick={navigatePrevious}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900">
          {getDisplayTitle()}
        </h2>
        
        <button
          onClick={navigateNext}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Enhanced validation message panel */}
      {showConflicts && dateValidation.validationResult && (
        <ValidationMessagePanel
          validationResult={dateValidation.validationResult}
          showSuggestions={true}
          collapsible={true}
          onResolveConflict={handleConflictClick}
          onResolveAll={handleShowAllConflicts}
        />
      )}

      {/* Calendar Content with smooth transitions */}
      <div className="relative transition-all duration-300 ease-in-out">
        {/* Conflict overlay */}
        <CalendarConflictOverlay
          conflicts={dateValidation.conflicts}
          currentDate={currentDate}
          viewMode={viewMode}
          onConflictClick={handleConflictClick}
        />
        
        {renderMonthView()}
        {renderTimelineView()}
        {renderYearView()}
      </div>

      {/* Semester Management Modal */}
      {showSemesterModal && (
        <AdminModal
          isOpen={showSemesterModal}
          onClose={() => setShowSemesterModal(false)}
          title="จัดการภาคการศึกษา"
          size="xl"
          type="form"
        >
          <SemesterManager
            semesters={semesters}
            academicYear={academicYear}
            onSemesterCreate={async (semesterData) => {
              await onSemesterCreate?.(semesterData);
              setShowSemesterModal(false);
            }}
            onSemesterUpdate={async (id, semesterData) => {
              await onSemesterUpdate?.(id, semesterData);
            }}
            onSemesterDelete={async (id) => {
              await onSemesterDelete?.(id);
            }}
            onSemesterActivate={async (id) => {
              // Implement semester activation logic
              console.log('Activating semester:', id);
            }}
          />
        </AdminModal>
      )}

      {showHolidayModal && (
        <AdminModal
          isOpen={showHolidayModal}
          onClose={() => setShowHolidayModal(false)}
          title="จัดการวันหยุด"
          size="xl"
          type="form"
        >
          <HolidayManager
            holidays={holidays}
            semesters={semesters}
            academicYear={academicYear}
            onHolidayCreate={async (holidayData) => {
              await onHolidayCreate?.(holidayData);
              setShowHolidayModal(false);
            }}
            onHolidayUpdate={async (id, holidayData) => {
              await onHolidayUpdate?.(id, holidayData);
            }}
            onHolidayDelete={async (id) => {
              await onHolidayDelete?.(id);
            }}
            onBulkImport={async (holidays) => {
              // Implement bulk import logic
              for (const holiday of holidays) {
                await onHolidayCreate?.(holiday);
              }
            }}
          />
        </AdminModal>
      )}

      {/* Enhanced conflict resolution modal */}
      {showResolutionModal && (
        <DateConflictResolutionModal
          isOpen={showResolutionModal}
          onClose={() => {
            setShowResolutionModal(false);
            setSelectedConflict(null);
          }}
          conflicts={selectedConflict ? [selectedConflict] : dateValidation.conflicts}
          onResolveConflict={handleResolveConflict}
          onResolveAll={handleResolveAllConflicts}
        />
      )}
    </div>
  );
};

export default AcademicCalendarView;