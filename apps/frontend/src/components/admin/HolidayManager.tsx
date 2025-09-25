'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  CalendarDaysIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { AdminModal } from './AdminModal';
import { AdminForm, AdminFormField, AdminFormActions } from './AdminForm';
import { useFormDateValidation } from '@/hooks/useDateValidation';
import { Holiday, Semester } from '@/lib/validation/dateValidation';
import dayjs from 'dayjs';

interface HolidayManagerProps {
  holidays: Holiday[];
  semesters: Semester[];
  academicYear: string;
  onHolidayCreate: (holiday: Omit<Holiday, 'id'>) => Promise<void>;
  onHolidayUpdate: (id: number, holiday: Partial<Holiday>) => Promise<void>;
  onHolidayDelete: (id: number) => Promise<void>;
  onBulkImport: (holidays: Omit<Holiday, 'id'>[]) => Promise<void>;
}

interface HolidayFormData {
  name: string;
  startDate: string;
  endDate: string;
  type: 'national' | 'university' | 'semester_break';
  description: string;
  isRecurring: boolean;
  semesterId?: number;
}

const defaultFormData: HolidayFormData = {
  name: '',
  startDate: '',
  endDate: '',
  type: 'national',
  description: '',
  isRecurring: false,
  semesterId: undefined,
};

const HOLIDAY_TYPES = {
  national: {
    label: 'วันหยุดราชการ',
    icon: GlobeAltIcon,
    color: 'bg-red-50 border-red-200 text-red-800',
    badgeColor: 'bg-red-100 text-red-800',
  },
  university: {
    label: 'วันหยุดมหาวิทยาลัย',
    icon: AcademicCapIcon,
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    badgeColor: 'bg-blue-100 text-blue-800',
  },
  semester_break: {
    label: 'วันหยุดพักภาคการศึกษา',
    icon: PauseIcon,
    color: 'bg-green-50 border-green-200 text-green-800',
    badgeColor: 'bg-green-100 text-green-800',
  },
};

// Thai national holidays template
const THAI_NATIONAL_HOLIDAYS = [
  { name: 'วันขึ้นปีใหม่', date: '01-01', isRecurring: true },
  { name: 'วันมาฆบูชา', date: '02-24', isRecurring: true }, // Approximate
  { name: 'วันจักรี', date: '04-06', isRecurring: true },
  { name: 'วันสงกรานต์', date: '04-13', isRecurring: true },
  { name: 'วันแรงงานแห่งชาติ', date: '05-01', isRecurring: true },
  { name: 'วันฉัตรมงคล', date: '05-04', isRecurring: true },
  { name: 'วันวิสาขบูชา', date: '05-22', isRecurring: true }, // Approximate
  { name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระราชินี', date: '06-03', isRecurring: true },
  { name: 'วันอาสาฬหบูชา', date: '07-20', isRecurring: true }, // Approximate
  { name: 'วันเข้าพรรษา', date: '07-21', isRecurring: true }, // Approximate
  { name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว', date: '07-28', isRecurring: true },
  { name: 'วันแม่แห่งชาติ', date: '08-12', isRecurring: true },
  { name: 'วันปิยมหาราช', date: '10-23', isRecurring: true },
  { name: 'วันพ่อแห่งชาติ', date: '12-05', isRecurring: true },
  { name: 'วันรัฐธรรมนูญ', date: '12-10', isRecurring: true },
  { name: 'วันสิ้นปี', date: '12-31', isRecurring: true },
];

const HolidayForm: React.FC<{
  formData: HolidayFormData;
  onChange: (data: HolidayFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
  semesters: Semester[];
  existingHolidays: Holiday[];
}> = ({ 
  formData, 
  onChange, 
  onSubmit, 
  onCancel, 
  isSubmitting, 
  isEditing,
  semesters,
  existingHolidays
}) => {
  // Form validation using the date validation hook
  const validation = useFormDateValidation(
    formData as Partial<Holiday>,
    'holiday',
    { semesters, holidays: existingHolidays }
  );

  const handleFieldChange = (field: keyof HolidayFormData, value: string | boolean | number | undefined) => {
    onChange({
      ...formData,
      [field]: value,
    });
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.startDate !== '' &&
      formData.endDate !== '' &&
      !validation.hasErrors
    );
  };

  // Auto-fill end date if not set and start date changes
  React.useEffect(() => {
    if (formData.startDate && !formData.endDate) {
      handleFieldChange('endDate', formData.startDate);
    }
  }, [formData.startDate]);

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 gap-4">
        <AdminFormField
          label="ชื่อวันหยุด"
          required
          error={!formData.name.trim() ? 'กรุณาระบุชื่อวันหยุด' : undefined}
        >
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="เช่น วันขึ้นปีใหม่"
          />
        </AdminFormField>

        <AdminFormField
          label="ประเภทวันหยุด"
          required
        >
          <select
            value={formData.type}
            onChange={(e) => handleFieldChange('type', e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(HOLIDAY_TYPES).map(([key, type]) => (
              <option key={key} value={key}>
                {type.label}
              </option>
            ))}
          </select>
        </AdminFormField>

        <AdminFormField label="คำอธิบาย">
          <textarea
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="คำอธิบายเพิ่มเติมเกี่ยวกับวันหยุด"
          />
        </AdminFormField>
      </div>

      {/* Date Range */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">ช่วงวันที่</h4>
        <div className="grid grid-cols-2 gap-4">
          <AdminFormField
            label="วันที่เริ่มต้น"
            required
            error={!formData.startDate ? 'กรุณาระบุวันที่เริ่มต้น' : undefined}
          >
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleFieldChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </AdminFormField>

          <AdminFormField
            label="วันที่สิ้นสุด"
            required
            error={!formData.endDate ? 'กรุณาระบุวันที่สิ้นสุด' : undefined}
          >
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleFieldChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </AdminFormField>
        </div>
      </div>

      {/* Additional Options */}
      <div className="space-y-4">
        <AdminFormField label="ตัวเลือกเพิ่มเติม">
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => handleFieldChange('isRecurring', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">วันหยุดประจำปี (ซ้ำทุกปี)</span>
            </label>
          </div>
        </AdminFormField>

        {/* Semester Association */}
        {formData.type === 'semester_break' && semesters.length > 0 && (
          <AdminFormField label="เชื่อมโยงกับภาคการศึกษา">
            <select
              value={formData.semesterId || ''}
              onChange={(e) => handleFieldChange('semesterId', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ไม่เชื่อมโยงกับภาคการศึกษาใด</option>
              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name}
                </option>
              ))}
            </select>
          </AdminFormField>
        )}
      </div>

      {/* Validation Messages */}
      {validation.conflicts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">ข้อควรระวัง</span>
          </div>
          <ul className="space-y-1">
            {validation.conflicts.map((conflict, index) => (
              <li key={index} className="text-sm text-yellow-700">
                • {conflict.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Form Actions */}
      <AdminFormActions>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isFormValid() || isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'กำลังบันทึก...' : isEditing ? 'อัปเดต' : 'สร้าง'}
        </button>
      </AdminFormActions>
    </div>
  );
};

const HolidayCard: React.FC<{
  holiday: Holiday;
  onEdit: () => void;
  onDelete: () => void;
  conflictCount?: number;
}> = ({ holiday, onEdit, onDelete, conflictCount = 0 }) => {
  const typeConfig = HOLIDAY_TYPES[holiday.type];
  const Icon = typeConfig.icon;
  
  const isMultiDay = holiday.startDate !== holiday.endDate;
  const isPast = dayjs(holiday.endDate).isBefore(dayjs(), 'day');
  const isCurrent = dayjs().isBetween(dayjs(holiday.startDate), dayjs(holiday.endDate), 'day', '[]');
  const isUpcoming = dayjs(holiday.startDate).isAfter(dayjs(), 'day');

  return (
    <div className={`border rounded-lg p-4 transition-all ${typeConfig.color}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <Icon className="w-5 h-5 mt-0.5" />
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900">{holiday.name}</h3>
              {holiday.isRecurring && (
                <ArrowPathIcon className="w-4 h-4 text-gray-500" title="วันหยุดประจำปี" />
              )}
              {conflictCount > 0 && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  {conflictCount} ข้อขัดแย้ง
                </span>
              )}
            </div>
            <span className={`inline-block px-2 py-1 text-xs rounded-full ${typeConfig.badgeColor}`}>
              {typeConfig.label}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="แก้ไข"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="ลบ"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date Information */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">วันที่:</span>
          <span className="font-medium">
            {isMultiDay ? (
              <>
                {dayjs(holiday.startDate).format('DD/MM/YYYY')} - {dayjs(holiday.endDate).format('DD/MM/YYYY')}
              </>
            ) : (
              dayjs(holiday.startDate).format('DD/MM/YYYY')
            )}
          </span>
        </div>

        {isMultiDay && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">ระยะเวลา:</span>
            <span className="font-medium">
              {dayjs(holiday.endDate).diff(dayjs(holiday.startDate), 'day') + 1} วัน
            </span>
          </div>
        )}

        {/* Status */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">สถานะ:</span>
          <span className={`font-medium ${
            isCurrent ? 'text-green-600' : 
            isPast ? 'text-gray-500' : 
            'text-blue-600'
          }`}>
            {isCurrent ? 'กำลังหยุด' : isPast ? 'ผ่านไปแล้ว' : 'จะมาถึง'}
          </span>
        </div>
      </div>

      {/* Description */}
      {holiday.description && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">{holiday.description}</p>
        </div>
      )}
    </div>
  );
};

const BulkImportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onImport: (holidays: Omit<Holiday, 'id'>[]) => void;
  academicYear: string;
}> = ({ isOpen, onClose, onImport, academicYear }) => {
  const [selectedHolidays, setSelectedHolidays] = useState<string[]>([]);

  const handleToggleHoliday = (holidayName: string) => {
    setSelectedHolidays(prev => 
      prev.includes(holidayName) 
        ? prev.filter(name => name !== holidayName)
        : [...prev, holidayName]
    );
  };

  const handleImport = () => {
    const currentYear = parseInt(academicYear) + 543; // Convert to Buddhist year
    const holidaysToImport = THAI_NATIONAL_HOLIDAYS
      .filter(holiday => selectedHolidays.includes(holiday.name))
      .map(holiday => ({
        name: holiday.name,
        startDate: `${currentYear}-${holiday.date}`,
        endDate: `${currentYear}-${holiday.date}`,
        type: 'national' as const,
        description: `วันหยุดราชการประจำปี ${currentYear}`,
        isRecurring: holiday.isRecurring,
      }));

    onImport(holidaysToImport);
    setSelectedHolidays([]);
    onClose();
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="นำเข้าวันหยุดราชการ"
      size="lg"
      type="form"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          เลือกวันหยุดราชการที่ต้องการนำเข้าสำหรับปี {parseInt(academicYear) + 543}
        </p>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {THAI_NATIONAL_HOLIDAYS.map((holiday) => (
            <label key={holiday.name} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
              <input
                type="checkbox"
                checked={selectedHolidays.includes(holiday.name)}
                onChange={() => handleToggleHoliday(holiday.name)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="font-medium">{holiday.name}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({dayjs(`2024-${holiday.date}`).format('DD/MM')})
                </span>
              </div>
            </label>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-600">
            เลือกแล้ว {selectedHolidays.length} วันหยุด
          </span>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleImport}
              disabled={selectedHolidays.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              นำเข้า {selectedHolidays.length} วันหยุด
            </button>
          </div>
        </div>
      </div>
    </AdminModal>
  );
};

export const HolidayManager: React.FC<HolidayManagerProps> = ({
  holidays,
  semesters,
  academicYear,
  onHolidayCreate,
  onHolidayUpdate,
  onHolidayDelete,
  onBulkImport
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState<HolidayFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Holiday | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  // Group holidays by type and filter
  const groupedHolidays = useMemo(() => {
    const filtered = filterType === 'all' 
      ? holidays 
      : holidays.filter(h => h.type === filterType);

    const groups = {
      national: [] as Holiday[],
      university: [] as Holiday[],
      semester_break: [] as Holiday[],
    };

    filtered.forEach(holiday => {
      groups[holiday.type].push(holiday);
    });

    // Sort by date within each group
    Object.keys(groups).forEach(key => {
      groups[key as keyof typeof groups].sort((a, b) => 
        dayjs(a.startDate).diff(dayjs(b.startDate))
      );
    });

    return groups;
  }, [holidays, filterType]);

  const handleCreate = useCallback(() => {
    setEditingHoliday(null);
    setFormData(defaultFormData);
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      startDate: holiday.startDate,
      endDate: holiday.endDate,
      type: holiday.type,
      description: holiday.description || '',
      isRecurring: holiday.isRecurring,
      semesterId: holiday.semesterId,
    });
    setShowModal(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      if (editingHoliday) {
        await onHolidayUpdate(editingHoliday.id!, formData);
      } else {
        await onHolidayCreate(formData);
      }
      setShowModal(false);
      setEditingHoliday(null);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Error saving holiday:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingHoliday, formData, onHolidayCreate, onHolidayUpdate]);

  const handleCancel = useCallback(() => {
    setShowModal(false);
    setEditingHoliday(null);
    setFormData(defaultFormData);
  }, []);

  const handleDelete = useCallback(async (holiday: Holiday) => {
    if (deleteConfirm?.id === holiday.id) {
      try {
        await onHolidayDelete(holiday.id!);
        setDeleteConfirm(null);
      } catch (error) {
        console.error('Error deleting holiday:', error);
      }
    } else {
      setDeleteConfirm(holiday);
    }
  }, [deleteConfirm, onHolidayDelete]);

  const handleBulkImport = useCallback(async (importedHolidays: Omit<Holiday, 'id'>[]) => {
    try {
      await onBulkImport(importedHolidays);
    } catch (error) {
      console.error('Error importing holidays:', error);
    }
  }, [onBulkImport]);

  const totalHolidays = holidays.length;
  const upcomingHolidays = holidays.filter(h => dayjs(h.startDate).isAfter(dayjs())).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">จัดการวันหยุด</h2>
          <p className="text-sm text-gray-600">
            ปีการศึกษา {academicYear} • {totalHolidays} วันหยุด • {upcomingHolidays} วันที่จะมาถึง
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <GlobeAltIcon className="w-4 h-4 mr-2" />
            นำเข้าวันหยุดราชการ
          </button>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            เพิ่มวันหยุด
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">กรองตามประเภท:</span>
        <div className="flex items-center space-x-2">
          {[
            { key: 'all', label: 'ทั้งหมด' },
            { key: 'national', label: 'วันหยุดราชการ' },
            { key: 'university', label: 'วันหยุดมหาวิทยาลัย' },
            { key: 'semester_break', label: 'วันหยุดพักภาค' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filterType === key
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Holiday Groups */}
      {totalHolidays > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedHolidays).map(([type, typeHolidays]) => {
            if (typeHolidays.length === 0) return null;
            
            const typeConfig = HOLIDAY_TYPES[type as keyof typeof HOLIDAY_TYPES];
            const Icon = typeConfig.icon;

            return (
              <div key={type}>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Icon className="w-5 h-5 mr-2" />
                  {typeConfig.label} ({typeHolidays.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {typeHolidays.map((holiday) => (
                    <HolidayCard
                      key={holiday.id}
                      holiday={holiday}
                      onEdit={() => handleEdit(holiday)}
                      onDelete={() => handleDelete(holiday)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CalendarDaysIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ยังไม่มีวันหยุด
          </h3>
          <p className="text-gray-600 mb-4">
            เริ่มต้นด้วยการเพิ่มวันหยุดหรือนำเข้าวันหยุดราชการ
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <GlobeAltIcon className="w-4 h-4 mr-2" />
              นำเข้าวันหยุดราชการ
            </button>
            <button
              onClick={handleCreate}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              เพิ่มวันหยุด
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AdminModal
        isOpen={showModal}
        onClose={handleCancel}
        title={editingHoliday ? 'แก้ไขวันหยุด' : 'เพิ่มวันหยุดใหม่'}
        size="lg"
        type="form"
      >
        <HolidayForm
          formData={formData}
          onChange={setFormData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          isEditing={!!editingHoliday}
          semesters={semesters}
          existingHolidays={holidays}
        />
      </AdminModal>

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleBulkImport}
        academicYear={academicYear}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <AdminModal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="ยืนยันการลบ"
          size="md"
          type="warning"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              <div>
                <p className="font-medium text-gray-900">
                  คุณต้องการลบวันหยุด "{deleteConfirm.name}" หรือไม่?
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  การดำเนินการนี้ไม่สามารถยกเลิกได้
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                ลบ
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
};

export default HolidayManager;