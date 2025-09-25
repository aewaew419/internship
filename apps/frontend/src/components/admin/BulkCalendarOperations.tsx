'use client';

import React, { useState, useCallback } from 'react';
import {
  CalendarDaysIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  TrashIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { AdminModal } from './AdminModal';
import { AdminDataTable } from './AdminDataTable';

export interface Semester {
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
  holidayCount: number;
}

export interface Holiday {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  type: 'national' | 'university' | 'semester_break';
  description?: string;
  isRecurring: boolean;
  semesterId?: number;
}

export interface CalendarEvent {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  type: 'semester' | 'holiday' | 'exam' | 'registration';
  description?: string;
  semesterId?: number;
}

export interface BulkCalendarOperation {
  type: 'create_semesters' | 'import_holidays' | 'export_calendar' | 'delete_events' | 'modify_dates';
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresConfirmation: boolean;
  destructive?: boolean;
}

export interface BulkCalendarOperationsProps {
  semesters: Semester[];
  holidays: Holiday[];
  selectedItems: (Semester | Holiday)[];
  onSelectionChange: (items: (Semester | Holiday)[]) => void;
  onBulkOperation: (operation: string, data: any) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export interface BulkSemesterCreationData {
  academicYears: string[];
  semesterTemplate: {
    semesters: Array<{
      name: string;
      startMonth: number;
      endMonth: number;
      registrationWeeksBefore: number;
      examWeeksAfter: number;
    }>;
  };
}

export interface BulkHolidayImportData {
  source: 'government' | 'university' | 'file';
  file?: File;
  year: number;
  includeTypes: string[];
}

export interface BulkCalendarExportData {
  format: 'ics' | 'json' | 'excel' | 'csv';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  includeTypes: string[];
}

const BulkCalendarModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  operation: BulkCalendarOperation | null;
  selectedItems: (Semester | Holiday)[];
  onConfirm: (data: any) => Promise<void>;
}> = ({ isOpen, onClose, operation, selectedItems, onConfirm }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(formData);
      onClose();
    } catch (error) {
      console.error('Bulk calendar operation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!operation) return null;

  const renderOperationContent = () => {
    switch (operation.type) {
      case 'create_semesters':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ปีการศึกษาที่ต้องการสร้าง
              </label>
              <div className="space-y-2">
                {[2567, 2568, 2569, 2570].map(year => (
                  <label key={year} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.academicYears?.includes(year.toString()) || false}
                      onChange={(e) => {
                        const years = formData.academicYears || [];
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            academicYears: [...years, year.toString()]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            academicYears: years.filter((y: string) => y !== year.toString())
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">ปีการศึกษา {year}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รูปแบบภาคการศึกษา
              </label>
              <select
                value={formData.semesterPattern || 'standard'}
                onChange={(e) => setFormData({ ...formData, semesterPattern: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="standard">มาตรฐาน (2 ภาคเรียน + ภาคฤดูร้อน)</option>
                <option value="trimester">ไตรมาส (3 ภาคเรียน)</option>
                <option value="semester">เซมสเตอร์ (2 ภาคเรียนเท่านั้น)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ระยะเวลาลงทะเบียน (สัปดาห์ก่อนเปิดภาค)
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={formData.registrationWeeks || 2}
                  onChange={(e) => setFormData({ ...formData, registrationWeeks: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ระยะเวลาสอบ (สัปดาห์หลังสิ้นสุดการเรียน)
                </label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={formData.examWeeks || 2}
                  onChange={(e) => setFormData({ ...formData, examWeeks: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>
        );

      case 'import_holidays':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                แหล่งข้อมูลวันหยุด
              </label>
              <select
                value={formData.source || 'government'}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="government">วันหยุดราชการ</option>
                <option value="university">วันหยุดมหาวิทยาลัย</option>
                <option value="file">อัปโหลดไฟล์</option>
              </select>
            </div>

            {formData.source === 'file' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อัปโหลดไฟล์วันหยุด
                </label>
                <input
                  type="file"
                  accept=".ics,.csv,.json"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  รองรับไฟล์ ICS, CSV, หรือ JSON
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ปีที่ต้องการนำเข้า
              </label>
              <select
                value={formData.year || new Date().getFullYear() + 543}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {[2567, 2568, 2569, 2570].map(year => (
                  <option key={year} value={year}>พ.ศ. {year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทวันหยุดที่ต้องการ
              </label>
              <div className="space-y-2">
                {['national', 'religious', 'university', 'semester_break'].map(type => (
                  <label key={type} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.includeTypes?.includes(type) || false}
                      onChange={(e) => {
                        const types = formData.includeTypes || [];
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            includeTypes: [...types, type]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            includeTypes: types.filter((t: string) => t !== type)
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">
                      {type === 'national' && 'วันหยุดราชการ'}
                      {type === 'religious' && 'วันสำคัญทางศาสนา'}
                      {type === 'university' && 'วันหยุดมหาวิทยาลัย'}
                      {type === 'semester_break' && 'วันหยุดระหว่างภาค'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'export_calendar':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รูปแบบการส่งออก
              </label>
              <select
                value={formData.format || 'ics'}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="ics">iCalendar (.ics)</option>
                <option value="json">JSON</option>
                <option value="excel">Excel (.xlsx)</option>
                <option value="csv">CSV</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่เริ่มต้น
                </label>
                <input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่สิ้นสุด
                </label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทข้อมูลที่ต้องการส่งออก
              </label>
              <div className="space-y-2">
                {['semesters', 'holidays', 'exams', 'registration'].map(type => (
                  <label key={type} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.includeTypes?.includes(type) || false}
                      onChange={(e) => {
                        const types = formData.includeTypes || [];
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            includeTypes: [...types, type]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            includeTypes: types.filter((t: string) => t !== type)
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">
                      {type === 'semesters' && 'ภาคการศึกษา'}
                      {type === 'holidays' && 'วันหยุด'}
                      {type === 'exams' && 'ช่วงสอบ'}
                      {type === 'registration' && 'ช่วงลงทะเบียน'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'delete_events':
        return (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">
                  คำเตือน: การลบข้อมูลปฏิทินไม่สามารถย้อนกลับได้
                </span>
              </div>
              <p className="text-sm text-red-700">
                คุณกำลังจะลบรายการ {selectedItems.length} รายการ
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">รายการที่จะลบ:</h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">
                      {'name' in item ? item.name : item.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {'academicYear' in item ? `ปีการศึกษา ${item.academicYear}` : item.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.confirmDelete || false}
                  onChange={(e) => setFormData({ ...formData, confirmDelete: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-red-700">
                  ฉันเข้าใจและยืนยันการลบข้อมูลเหล่านี้
                </span>
              </label>
            </div>
          </div>
        );

      case 'modify_dates':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทการแก้ไข
              </label>
              <select
                value={formData.modificationType || 'shift'}
                onChange={(e) => setFormData({ ...formData, modificationType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="shift">เลื่อนวันที่</option>
                <option value="extend">ขยายระยะเวลา</option>
                <option value="shorten">ลดระยะเวลา</option>
              </select>
            </div>

            {formData.modificationType === 'shift' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนวันที่ต้องการเลื่อน
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={formData.shiftDays || 0}
                    onChange={(e) => setFormData({ ...formData, shiftDays: parseInt(e.target.value) })}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                  />
                  <select
                    value={formData.shiftDirection || 'forward'}
                    onChange={(e) => setFormData({ ...formData, shiftDirection: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="forward">เลื่อนไปข้างหน้า</option>
                    <option value="backward">เลื่อนไปข้างหลัง</option>
                  </select>
                </div>
              </div>
            )}

            {(formData.modificationType === 'extend' || formData.modificationType === 'shorten') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนวันที่ต้องการ{formData.modificationType === 'extend' ? 'ขยาย' : 'ลด'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.adjustDays || 1}
                  onChange={(e) => setFormData({ ...formData, adjustDays: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                การแก้ไขจะส่งผลต่อรายการ {selectedItems.length} รายการ
                และระบบจะตรวจสอบความขัดแย้งอัตโนมัติ
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">ไม่พบการกำหนดค่าสำหรับการดำเนินการนี้</p>
          </div>
        );
    }
  };

  const canProceed = () => {
    switch (operation.type) {
      case 'create_semesters':
        return formData.academicYears && formData.academicYears.length > 0;
      case 'import_holidays':
        return formData.source && (formData.source !== 'file' || formData.file);
      case 'export_calendar':
        return formData.format && formData.startDate && formData.endDate;
      case 'delete_events':
        return formData.confirmDelete;
      case 'modify_dates':
        return formData.modificationType;
      default:
        return true;
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${operation.label}${selectedItems.length > 0 ? ` (${selectedItems.length} รายการ)` : ''}`}
      size="lg"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">{operation.description}</p>
        </div>

        {renderOperationContent()}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing || !canProceed()}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
              operation.destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span>กำลังดำเนินการ...</span>
              </div>
            ) : (
              operation.label
            )}
          </button>
        </div>
      </div>
    </AdminModal>
  );
};

export const BulkCalendarOperations: React.FC<BulkCalendarOperationsProps> = ({
  semesters,
  holidays,
  selectedItems,
  onSelectionChange,
  onBulkOperation,
  isLoading = false,
  className = ''
}) => {
  const [activeOperation, setActiveOperation] = useState<BulkCalendarOperation | null>(null);
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [viewMode, setViewMode] = useState<'semesters' | 'holidays'>('semesters');

  const bulkOperations: BulkCalendarOperation[] = [
    {
      type: 'create_semesters',
      label: 'สร้างภาคการศึกษา',
      description: 'สร้างภาคการศึกษาสำหรับหลายปีการศึกษาพร้อมกัน',
      icon: PlusIcon,
      requiresConfirmation: true
    },
    {
      type: 'import_holidays',
      label: 'นำเข้าวันหยุด',
      description: 'นำเข้าวันหยุดจากแหล่งข้อมูลภายนอกหรือไฟล์',
      icon: DocumentArrowUpIcon,
      requiresConfirmation: true
    },
    {
      type: 'export_calendar',
      label: 'ส่งออกปฏิทิน',
      description: 'ส่งออกข้อมูลปฏิทินในรูปแบบต่างๆ',
      icon: DocumentArrowDownIcon,
      requiresConfirmation: false
    },
    {
      type: 'modify_dates',
      label: 'แก้ไขวันที่',
      description: 'เลื่อน ขยาย หรือลดระยะเวลาของรายการที่เลือก',
      icon: ClockIcon,
      requiresConfirmation: true
    },
    {
      type: 'delete_events',
      label: 'ลบรายการ',
      description: 'ลบภาคการศึกษาหรือวันหยุดที่เลือกออกจากระบบ',
      icon: TrashIcon,
      requiresConfirmation: true,
      destructive: true
    }
  ];

  const handleOperationClick = (operation: BulkCalendarOperation) => {
    if (['create_semesters', 'import_holidays', 'export_calendar'].includes(operation.type) || selectedItems.length > 0) {
      setActiveOperation(operation);
      setShowOperationModal(true);
    }
  };

  const handleOperationConfirm = async (data: any) => {
    if (!activeOperation) return;

    const operationData = {
      operation: activeOperation.type,
      selectedItems: selectedItems,
      ...data
    };

    await onBulkOperation(activeOperation.type, operationData);
    setShowOperationModal(false);
    setActiveOperation(null);
  };

  const currentData = viewMode === 'semesters' ? semesters : holidays;
  const selectedIds = selectedItems.map(item => item.id);

  const semesterColumns = [
    {
      key: 'name' as keyof Semester,
      title: 'ชื่อภาคการศึกษา',
      sortable: true,
      render: (value: any, semester: Semester) => (
        <div>
          <div className="font-medium">{semester.name}</div>
          <div className="text-sm text-gray-500">ปีการศึกษา {semester.academicYear}</div>
        </div>
      )
    },
    {
      key: 'startDate' as keyof Semester,
      title: 'ระยะเวลา',
      render: (value: string, semester: Semester) => (
        <div className="text-sm">
          <div>{new Date(semester.startDate).toLocaleDateString('th-TH')} - {new Date(semester.endDate).toLocaleDateString('th-TH')}</div>
        </div>
      )
    },
    {
      key: 'isActive' as keyof Semester,
      title: 'สถานะ',
      render: (isActive: boolean) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
        </span>
      )
    },
    {
      key: 'holidayCount' as keyof Semester,
      title: 'วันหยุด',
      render: (count: number) => (
        <span className="text-sm text-gray-600">{count} วัน</span>
      )
    }
  ];

  const holidayColumns = [
    {
      key: 'name' as keyof Holiday,
      title: 'ชื่อวันหยุด',
      sortable: true
    },
    {
      key: 'startDate' as keyof Holiday,
      title: 'วันที่',
      render: (value: string, holiday: Holiday) => (
        <div className="text-sm">
          {holiday.startDate === holiday.endDate 
            ? new Date(holiday.startDate).toLocaleDateString('th-TH')
            : `${new Date(holiday.startDate).toLocaleDateString('th-TH')} - ${new Date(holiday.endDate).toLocaleDateString('th-TH')}`
          }
        </div>
      )
    },
    {
      key: 'type' as keyof Holiday,
      title: 'ประเภท',
      render: (type: string) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
          type === 'national' ? 'bg-red-100 text-red-800' :
          type === 'university' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {type === 'national' && 'วันหยุดราชการ'}
          {type === 'university' && 'วันหยุดมหาวิทยาลัย'}
          {type === 'semester_break' && 'วันหยุดระหว่างภาค'}
        </span>
      )
    },
    {
      key: 'isRecurring' as keyof Holiday,
      title: 'ประจำปี',
      render: (isRecurring: boolean) => (
        <span className="text-sm text-gray-600">
          {isRecurring ? 'ใช่' : 'ไม่'}
        </span>
      )
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Bulk Operations Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">การดำเนินการปฏิทินแบบกลุ่ม</h3>
            <p className="text-sm text-gray-600">
              จัดการภาคการศึกษาและวันหยุดแบบกลุ่ม
            </p>
          </div>
          <div className="text-sm text-gray-500">
            เลือกแล้ว: {selectedItems.length} รายการ
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {bulkOperations.map(operation => {
            const Icon = operation.icon;
            const isDisabled = !['create_semesters', 'import_holidays', 'export_calendar'].includes(operation.type) && selectedItems.length === 0;
            
            return (
              <button
                key={operation.type}
                onClick={() => handleOperationClick(operation)}
                disabled={isDisabled || isLoading}
                className={`
                  flex flex-col items-center space-y-2 p-3 rounded-lg border transition-colors text-center
                  ${isDisabled 
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : operation.destructive
                      ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                      : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">{operation.label}</div>
                  <div className="text-xs opacity-75 line-clamp-2">
                    {operation.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">เลือกรายการสำหรับการดำเนินการ</h4>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('semesters')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'semesters'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                ภาคการศึกษา ({semesters.length})
              </button>
              <button
                onClick={() => setViewMode('holidays')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'holidays'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                วันหยุด ({holidays.length})
              </button>
            </div>
          </div>
        </div>
        
        <AdminDataTable
          data={currentData}
          columns={viewMode === 'semesters' ? semesterColumns : holidayColumns}
          loading={isLoading}
          selection={{
            enabled: true,
            selectedIds: selectedIds,
            onSelectionChange: (ids) => {
              const selected = currentData.filter(item => ids.includes(item.id));
              onSelectionChange(selected);
            }
          }}
          pagination={{
            enabled: true,
            pageSize: 10
          }}
          sorting={{
            enabled: true,
            defaultSort: { key: 'name', direction: 'asc' }
          }}
        />
      </div>

      {/* Operation Modal */}
      <BulkCalendarModal
        isOpen={showOperationModal}
        onClose={() => {
          setShowOperationModal(false);
          setActiveOperation(null);
        }}
        operation={activeOperation}
        selectedItems={selectedItems}
        onConfirm={handleOperationConfirm}
      />
    </div>
  );
};

export default BulkCalendarOperations;