'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  CalendarDaysIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { AdminModal } from './AdminModal';
import { AdminForm, AdminFormField, AdminFormActions } from './AdminForm';
import { useFormDateValidation } from '@/hooks/useDateValidation';
import { Semester } from '@/lib/validation/dateValidation';
import dayjs from 'dayjs';

interface SemesterManagerProps {
  semesters: Semester[];
  academicYear: string;
  onSemesterCreate: (semester: Omit<Semester, 'id'>) => Promise<void>;
  onSemesterUpdate: (id: number, semester: Partial<Semester>) => Promise<void>;
  onSemesterDelete: (id: number) => Promise<void>;
  onSemesterActivate: (id: number) => Promise<void>;
}

interface SemesterFormData {
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  examStartDate: string;
  examEndDate: string;
  isActive: boolean;
}

const defaultFormData: SemesterFormData = {
  name: '',
  academicYear: '',
  startDate: '',
  endDate: '',
  registrationStartDate: '',
  registrationEndDate: '',
  examStartDate: '',
  examEndDate: '',
  isActive: false,
};

const SemesterForm: React.FC<{
  formData: SemesterFormData;
  onChange: (data: SemesterFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
  existingSemesters: Semester[];
}> = ({ 
  formData, 
  onChange, 
  onSubmit, 
  onCancel, 
  isSubmitting, 
  isEditing,
  existingSemesters 
}) => {
  // Form validation using the date validation hook
  const validation = useFormDateValidation(
    formData as Partial<Semester>,
    'semester',
    { semesters: existingSemesters }
  );

  const handleFieldChange = (field: keyof SemesterFormData, value: string | boolean) => {
    onChange({
      ...formData,
      [field]: value,
    });
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.academicYear.trim() !== '' &&
      formData.startDate !== '' &&
      formData.endDate !== '' &&
      formData.registrationStartDate !== '' &&
      formData.registrationEndDate !== '' &&
      formData.examStartDate !== '' &&
      formData.examEndDate !== '' &&
      !validation.hasErrors
    );
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-4">
        <AdminFormField
          label="ชื่อภาคการศึกษา"
          required
          error={!formData.name.trim() ? 'กรุณาระบุชื่อภาคการศึกษา' : undefined}
        >
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="เช่น ภาคการศึกษาที่ 1/2567"
          />
        </AdminFormField>

        <AdminFormField
          label="ปีการศึกษา"
          required
          error={!formData.academicYear.trim() ? 'กรุณาระบุปีการศึกษา' : undefined}
        >
          <input
            type="text"
            value={formData.academicYear}
            onChange={(e) => handleFieldChange('academicYear', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="เช่น 2567"
          />
        </AdminFormField>
      </div>

      {/* Semester Period */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">ระยะเวลาภาคการศึกษา</h4>
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

      {/* Registration Period */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">ระยะเวลาลงทะเบียน</h4>
        <div className="grid grid-cols-2 gap-4">
          <AdminFormField
            label="วันที่เริ่มลงทะเบียน"
            required
            error={!formData.registrationStartDate ? 'กรุณาระบุวันที่เริ่มลงทะเบียน' : undefined}
          >
            <input
              type="date"
              value={formData.registrationStartDate}
              onChange={(e) => handleFieldChange('registrationStartDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </AdminFormField>

          <AdminFormField
            label="วันที่สิ้นสุดการลงทะเบียน"
            required
            error={!formData.registrationEndDate ? 'กรุณาระบุวันที่สิ้นสุดการลงทะเบียน' : undefined}
          >
            <input
              type="date"
              value={formData.registrationEndDate}
              onChange={(e) => handleFieldChange('registrationEndDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </AdminFormField>
        </div>
      </div>

      {/* Exam Period */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">ระยะเวลาสอบ</h4>
        <div className="grid grid-cols-2 gap-4">
          <AdminFormField
            label="วันที่เริ่มสอบ"
            required
            error={!formData.examStartDate ? 'กรุณาระบุวันที่เริ่มสอบ' : undefined}
          >
            <input
              type="date"
              value={formData.examStartDate}
              onChange={(e) => handleFieldChange('examStartDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </AdminFormField>

          <AdminFormField
            label="วันที่สิ้นสุดการสอบ"
            required
            error={!formData.examEndDate ? 'กรุณาระบุวันที่สิ้นสุดการสอบ' : undefined}
          >
            <input
              type="date"
              value={formData.examEndDate}
              onChange={(e) => handleFieldChange('examEndDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </AdminFormField>
        </div>
      </div>

      {/* Active Status */}
      <div>
        <AdminFormField label="สถานะ">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleFieldChange('isActive', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">เปิดใช้งานภาคการศึกษานี้</span>
          </label>
        </AdminFormField>
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

const SemesterCard: React.FC<{
  semester: Semester;
  onEdit: () => void;
  onDelete: () => void;
  onActivate: () => void;
}> = ({ semester, onEdit, onDelete, onActivate }) => {
  const isActive = semester.isActive;
  const isPast = dayjs(semester.endDate).isBefore(dayjs(), 'day');
  const isCurrent = dayjs().isBetween(dayjs(semester.startDate), dayjs(semester.endDate), 'day', '[]');

  return (
    <div className={`border rounded-lg p-4 transition-all ${
      isActive 
        ? 'border-blue-300 bg-blue-50' 
        : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900">{semester.name}</h3>
            {isActive && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                เปิดใช้งาน
              </span>
            )}
            {isCurrent && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                กำลังดำเนินการ
              </span>
            )}
            {isPast && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                สิ้นสุดแล้ว
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">ปีการศึกษา {semester.academicYear}</p>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="แก้ไข"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          {!isActive && (
            <button
              onClick={onActivate}
              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
              title="เปิดใช้งาน"
            >
              <CheckCircleIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="ลบ"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Semester Timeline */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">ภาคการศึกษา:</span>
          <span className="font-medium">
            {dayjs(semester.startDate).format('DD/MM/YYYY')} - {dayjs(semester.endDate).format('DD/MM/YYYY')}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">ลงทะเบียน:</span>
          <span className="text-green-700">
            {dayjs(semester.registrationStartDate).format('DD/MM/YYYY')} - {dayjs(semester.registrationEndDate).format('DD/MM/YYYY')}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">สอบ:</span>
          <span className="text-purple-700">
            {dayjs(semester.examStartDate).format('DD/MM/YYYY')} - {dayjs(semester.examEndDate).format('DD/MM/YYYY')}
          </span>
        </div>
      </div>

      {/* Progress Bar for Current Semester */}
      {isCurrent && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>ความคืบหน้า</span>
            <span>
              {Math.round(
                (dayjs().diff(dayjs(semester.startDate), 'day') / 
                 dayjs(semester.endDate).diff(dayjs(semester.startDate), 'day')) * 100
              )}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, 
                  (dayjs().diff(dayjs(semester.startDate), 'day') / 
                   dayjs(semester.endDate).diff(dayjs(semester.startDate), 'day')) * 100
                ))}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const SemesterManager: React.FC<SemesterManagerProps> = ({
  semesters,
  academicYear,
  onSemesterCreate,
  onSemesterUpdate,
  onSemesterDelete,
  onSemesterActivate
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [formData, setFormData] = useState<SemesterFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Semester | null>(null);

  // Filter semesters for current academic year
  const currentSemesters = semesters.filter(s => s.academicYear === academicYear);

  const handleCreate = useCallback(() => {
    setEditingSemester(null);
    setFormData({
      ...defaultFormData,
      academicYear,
    });
    setShowModal(true);
  }, [academicYear]);

  const handleEdit = useCallback((semester: Semester) => {
    setEditingSemester(semester);
    setFormData({
      name: semester.name,
      academicYear: semester.academicYear,
      startDate: semester.startDate,
      endDate: semester.endDate,
      registrationStartDate: semester.registrationStartDate,
      registrationEndDate: semester.registrationEndDate,
      examStartDate: semester.examStartDate,
      examEndDate: semester.examEndDate,
      isActive: semester.isActive,
    });
    setShowModal(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      if (editingSemester) {
        await onSemesterUpdate(editingSemester.id!, formData);
      } else {
        await onSemesterCreate(formData);
      }
      setShowModal(false);
      setEditingSemester(null);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Error saving semester:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingSemester, formData, onSemesterCreate, onSemesterUpdate]);

  const handleCancel = useCallback(() => {
    setShowModal(false);
    setEditingSemester(null);
    setFormData(defaultFormData);
  }, []);

  const handleDelete = useCallback(async (semester: Semester) => {
    if (deleteConfirm?.id === semester.id) {
      try {
        await onSemesterDelete(semester.id!);
        setDeleteConfirm(null);
      } catch (error) {
        console.error('Error deleting semester:', error);
      }
    } else {
      setDeleteConfirm(semester);
    }
  }, [deleteConfirm, onSemesterDelete]);

  const handleActivate = useCallback(async (semester: Semester) => {
    try {
      await onSemesterActivate(semester.id!);
    } catch (error) {
      console.error('Error activating semester:', error);
    }
  }, [onSemesterActivate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">จัดการภาคการศึกษา</h2>
          <p className="text-sm text-gray-600">ปีการศึกษา {academicYear}</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          เพิ่มภาคการศึกษา
        </button>
      </div>

      {/* Semesters Grid */}
      {currentSemesters.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {currentSemesters.map((semester) => (
            <SemesterCard
              key={semester.id}
              semester={semester}
              onEdit={() => handleEdit(semester)}
              onDelete={() => handleDelete(semester)}
              onActivate={() => handleActivate(semester)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CalendarDaysIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ยังไม่มีภาคการศึกษา
          </h3>
          <p className="text-gray-600 mb-4">
            เริ่มต้นด้วยการสร้างภาคการศึกษาแรกสำหรับปีการศึกษา {academicYear}
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            เพิ่มภาคการศึกษา
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AdminModal
        isOpen={showModal}
        onClose={handleCancel}
        title={editingSemester ? 'แก้ไขภาคการศึกษา' : 'เพิ่มภาคการศึกษาใหม่'}
        size="lg"
        type="form"
      >
        <SemesterForm
          formData={formData}
          onChange={setFormData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          isEditing={!!editingSemester}
          existingSemesters={semesters}
        />
      </AdminModal>

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
                  คุณต้องการลบภาคการศึกษา "{deleteConfirm.name}" หรือไม่?
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

export default SemesterManager;