'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  UserIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { AdminModal } from './AdminModal';
import { AdminForm, AdminFormField, AdminFormActions } from './AdminForm';
import { AdminDataTable, TableColumn } from './AdminDataTable';
import { DefaultPrefixLoader } from './DefaultPrefixLoader';

interface TitlePrefix {
  id?: number;
  thai: string;
  english: string;
  abbreviation: string;
  category: 'academic' | 'professional' | 'honorary' | 'religious';
  gender: 'male' | 'female' | 'neutral';
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
}

interface TitlePrefixManagerProps {
  prefixes: TitlePrefix[];
  onPrefixCreate: (prefix: Omit<TitlePrefix, 'id'>) => Promise<void>;
  onPrefixUpdate: (id: number, prefix: Partial<TitlePrefix>) => Promise<void>;
  onPrefixDelete: (id: number) => Promise<void>;
  onLoadDefaults: () => Promise<void>;
  onBulkUpdate: (prefixIds: number[], updates: Partial<TitlePrefix>) => Promise<void>;
}

interface PrefixFormData {
  thai: string;
  english: string;
  abbreviation: string;
  category: 'academic' | 'professional' | 'honorary' | 'religious';
  gender: 'male' | 'female' | 'neutral';
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
}

const defaultFormData: PrefixFormData = {
  thai: '',
  english: '',
  abbreviation: '',
  category: 'professional',
  gender: 'neutral',
  isDefault: false,
  sortOrder: 0,
  isActive: true,
};

const CATEGORIES = {
  academic: {
    label: 'วิชาการ',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    badgeColor: 'bg-blue-100 text-blue-800',
  },
  professional: {
    label: 'อาชีพ',
    color: 'bg-green-50 border-green-200 text-green-800',
    badgeColor: 'bg-green-100 text-green-800',
  },
  honorary: {
    label: 'กิตติมศักดิ์',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
    badgeColor: 'bg-purple-100 text-purple-800',
  },
  religious: {
    label: 'ศาสนา',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    badgeColor: 'bg-yellow-100 text-yellow-800',
  },
};

const GENDERS = {
  male: { label: 'ชาย', color: 'text-blue-600' },
  female: { label: 'หญิง', color: 'text-pink-600' },
  neutral: { label: 'ทั่วไป', color: 'text-gray-600' },
};

// Thai default prefixes
const DEFAULT_PREFIXES: Omit<TitlePrefix, 'id'>[] = [
  // Academic
  { thai: 'ศาสตราจารย์', english: 'Professor', abbreviation: 'ศ.', category: 'academic', gender: 'neutral', isDefault: true, sortOrder: 1, isActive: true },
  { thai: 'รองศาสตราจารย์', english: 'Associate Professor', abbreviation: 'รศ.', category: 'academic', gender: 'neutral', isDefault: true, sortOrder: 2, isActive: true },
  { thai: 'ผู้ช่วยศาสตราจารย์', english: 'Assistant Professor', abbreviation: 'ผศ.', category: 'academic', gender: 'neutral', isDefault: true, sortOrder: 3, isActive: true },
  { thai: 'อาจารย์', english: 'Lecturer', abbreviation: 'อ.', category: 'academic', gender: 'neutral', isDefault: true, sortOrder: 4, isActive: true },
  
  // Professional - Male
  { thai: 'นาย', english: 'Mr.', abbreviation: 'นาย', category: 'professional', gender: 'male', isDefault: true, sortOrder: 10, isActive: true },
  { thai: 'ดร.', english: 'Dr.', abbreviation: 'ดร.', category: 'professional', gender: 'male', isDefault: true, sortOrder: 11, isActive: true },
  
  // Professional - Female
  { thai: 'นาง', english: 'Mrs.', abbreviation: 'นาง', category: 'professional', gender: 'female', isDefault: true, sortOrder: 20, isActive: true },
  { thai: 'นางสาว', english: 'Miss', abbreviation: 'น.ส.', category: 'professional', gender: 'female', isDefault: true, sortOrder: 21, isActive: true },
  { thai: 'ดร.', english: 'Dr.', abbreviation: 'ดร.', category: 'professional', gender: 'female', isDefault: true, sortOrder: 22, isActive: true },
  
  // Honorary
  { thai: 'ศาสตราจารย์เกียรติคุณ', english: 'Professor Emeritus', abbreviation: 'ศ.เกียรติคุณ', category: 'honorary', gender: 'neutral', isDefault: true, sortOrder: 30, isActive: true },
  { thai: 'ศาสตราจารย์กิตติคุณ', english: 'Honorary Professor', abbreviation: 'ศ.กิตติคุณ', category: 'honorary', gender: 'neutral', isDefault: true, sortOrder: 31, isActive: true },
  
  // Religious
  { thai: 'พระ', english: 'Phra', abbreviation: 'พระ', category: 'religious', gender: 'male', isDefault: true, sortOrder: 40, isActive: true },
  { thai: 'แม่ชี', english: 'Mae Chi', abbreviation: 'แม่ชี', category: 'religious', gender: 'female', isDefault: true, sortOrder: 41, isActive: true },
];

const PrefixForm: React.FC<{
  formData: PrefixFormData;
  onChange: (data: PrefixFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
  existingPrefixes: TitlePrefix[];
}> = ({ 
  formData, 
  onChange, 
  onSubmit, 
  onCancel, 
  isSubmitting, 
  isEditing,
  existingPrefixes
}) => {
  const handleFieldChange = (field: keyof PrefixFormData, value: string | boolean | number) => {
    onChange({
      ...formData,
      [field]: value,
    });
  };

  const isFormValid = () => {
    return (
      formData.thai.trim() !== '' &&
      formData.english.trim() !== '' &&
      formData.abbreviation.trim() !== ''
    );
  };

  // Check for duplicates
  const hasDuplicate = useMemo(() => {
    return existingPrefixes.some(prefix => 
      (prefix.thai === formData.thai || 
       prefix.english === formData.english || 
       prefix.abbreviation === formData.abbreviation) &&
      (!isEditing || prefix.id !== (formData as any).id)
    );
  }, [formData, existingPrefixes, isEditing]);

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 gap-4">
        <AdminFormField
          label="คำนำหน้าชื่อ (ไทย)"
          required
          error={!formData.thai.trim() ? 'กรุณาระบุคำนำหน้าชื่อภาษาไทย' : 
                 hasDuplicate ? 'คำนำหน้าชื่อนี้มีอยู่แล้ว' : undefined}
        >
          <input
            type="text"
            value={formData.thai}
            onChange={(e) => handleFieldChange('thai', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="เช่น นาย, นาง, ดร."
          />
        </AdminFormField>

        <AdminFormField
          label="คำนำหน้าชื่อ (อังกฤษ)"
          required
          error={!formData.english.trim() ? 'กรุณาระบุคำนำหน้าชื่อภาษาอังกฤษ' : undefined}
        >
          <input
            type="text"
            value={formData.english}
            onChange={(e) => handleFieldChange('english', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="เช่น Mr., Mrs., Dr."
          />
        </AdminFormField>

        <AdminFormField
          label="ตัวย่อ"
          required
          error={!formData.abbreviation.trim() ? 'กรุณาระบุตัวย่อ' : undefined}
        >
          <input
            type="text"
            value={formData.abbreviation}
            onChange={(e) => handleFieldChange('abbreviation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="เช่น นาย, น.ส., ดร."
          />
        </AdminFormField>
      </div>

      {/* Category and Gender */}
      <div className="grid grid-cols-2 gap-4">
        <AdminFormField label="หมวดหมู่" required>
          <select
            value={formData.category}
            onChange={(e) => handleFieldChange('category', e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(CATEGORIES).map(([key, category]) => (
              <option key={key} value={key}>
                {category.label}
              </option>
            ))}
          </select>
        </AdminFormField>

        <AdminFormField label="เพศ" required>
          <select
            value={formData.gender}
            onChange={(e) => handleFieldChange('gender', e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(GENDERS).map(([key, gender]) => (
              <option key={key} value={key}>
                {gender.label}
              </option>
            ))}
          </select>
        </AdminFormField>
      </div>

      {/* Sort Order */}
      <AdminFormField label="ลำดับการแสดง">
        <input
          type="number"
          value={formData.sortOrder}
          onChange={(e) => handleFieldChange('sortOrder', parseInt(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
        />
      </AdminFormField>

      {/* Options */}
      <div className="space-y-3">
        <AdminFormField label="ตัวเลือก">
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => handleFieldChange('isDefault', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">คำนำหน้าชื่อเริ่มต้น</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">เปิดใช้งาน</span>
            </label>
          </div>
        </AdminFormField>
      </div>

      {/* Validation Messages */}
      {hasDuplicate && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-800">ข้อผิดพลาด</span>
          </div>
          <p className="text-sm text-red-700">
            คำนำหน้าชื่อนี้มีอยู่ในระบบแล้ว กรุณาตรวจสอบข้อมูลให้ถูกต้อง
          </p>
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
          disabled={!isFormValid() || hasDuplicate || isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'กำลังบันทึก...' : isEditing ? 'อัปเดต' : 'สร้าง'}
        </button>
      </AdminFormActions>
    </div>
  );
};

const PrefixCard: React.FC<{
  prefix: TitlePrefix;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}> = ({ prefix, onEdit, onDelete, onToggleActive }) => {
  const categoryConfig = CATEGORIES[prefix.category];
  const genderConfig = GENDERS[prefix.gender];

  return (
    <div className={`border rounded-lg p-4 transition-all ${
      prefix.isActive ? 'bg-white' : 'bg-gray-50 opacity-75'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-semibold text-gray-900">{prefix.thai}</h3>
            {prefix.isDefault && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                เริ่มต้น
              </span>
            )}
            {!prefix.isActive && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                ปิดใช้งาน
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-1">{prefix.english}</p>
          <p className="text-xs text-gray-500">ตัวย่อ: {prefix.abbreviation}</p>
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
            onClick={onToggleActive}
            className={`p-1 transition-colors ${
              prefix.isActive 
                ? 'text-gray-400 hover:text-orange-600' 
                : 'text-gray-400 hover:text-green-600'
            }`}
            title={prefix.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
          >
            <CheckCircleIcon className="w-4 h-4" />
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

      {/* Category and Gender */}
      <div className="flex items-center justify-between text-sm">
        <span className={`inline-block px-2 py-1 text-xs rounded-full ${categoryConfig.badgeColor}`}>
          {categoryConfig.label}
        </span>
        <span className={`font-medium ${genderConfig.color}`}>
          {genderConfig.label}
        </span>
      </div>

      {/* Sort Order */}
      <div className="mt-2 text-xs text-gray-500">
        ลำดับ: {prefix.sortOrder}
      </div>
    </div>
  );
};

export const TitlePrefixManager: React.FC<TitlePrefixManagerProps> = ({
  prefixes,
  onPrefixCreate,
  onPrefixUpdate,
  onPrefixDelete,
  onLoadDefaults,
  onBulkUpdate
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingPrefix, setEditingPrefix] = useState<TitlePrefix | null>(null);
  const [formData, setFormData] = useState<PrefixFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<TitlePrefix | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'order'>('order');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedPrefixes, setSelectedPrefixes] = useState<number[]>([]);

  // Filter and sort prefixes
  const filteredAndSortedPrefixes = useMemo(() => {
    let filtered = prefixes.filter(prefix => {
      const matchesSearch = 
        prefix.thai.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prefix.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prefix.abbreviation.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || prefix.category === filterCategory;
      const matchesGender = filterGender === 'all' || prefix.gender === filterGender;
      
      return matchesSearch && matchesCategory && matchesGender;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.thai.localeCompare(b.thai, 'th');
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'order':
          comparison = a.sortOrder - b.sortOrder;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [prefixes, searchTerm, filterCategory, filterGender, sortBy, sortDirection]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: prefixes.length,
      active: prefixes.filter(p => p.isActive).length,
      defaults: prefixes.filter(p => p.isDefault).length,
      byCategory: Object.keys(CATEGORIES).reduce((acc, category) => {
        acc[category] = prefixes.filter(p => p.category === category).length;
        return acc;
      }, {} as Record<string, number>),
    };
  }, [prefixes]);

  const handleCreate = useCallback(() => {
    setEditingPrefix(null);
    setFormData({
      ...defaultFormData,
      sortOrder: Math.max(...prefixes.map(p => p.sortOrder), 0) + 1,
    });
    setShowModal(true);
  }, [prefixes]);

  const handleEdit = useCallback((prefix: TitlePrefix) => {
    setEditingPrefix(prefix);
    setFormData({
      thai: prefix.thai,
      english: prefix.english,
      abbreviation: prefix.abbreviation,
      category: prefix.category,
      gender: prefix.gender,
      isDefault: prefix.isDefault,
      sortOrder: prefix.sortOrder,
      isActive: prefix.isActive,
    });
    setShowModal(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      if (editingPrefix) {
        await onPrefixUpdate(editingPrefix.id!, formData);
      } else {
        await onPrefixCreate(formData);
      }
      setShowModal(false);
      setEditingPrefix(null);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Error saving prefix:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingPrefix, formData, onPrefixCreate, onPrefixUpdate]);

  const handleCancel = useCallback(() => {
    setShowModal(false);
    setEditingPrefix(null);
    setFormData(defaultFormData);
  }, []);

  const handleDelete = useCallback(async (prefix: TitlePrefix) => {
    if (deleteConfirm?.id === prefix.id) {
      try {
        await onPrefixDelete(prefix.id!);
        setDeleteConfirm(null);
      } catch (error) {
        console.error('Error deleting prefix:', error);
      }
    } else {
      setDeleteConfirm(prefix);
    }
  }, [deleteConfirm, onPrefixDelete]);

  const handleToggleActive = useCallback(async (prefix: TitlePrefix) => {
    try {
      await onPrefixUpdate(prefix.id!, { isActive: !prefix.isActive });
    } catch (error) {
      console.error('Error toggling prefix active status:', error);
    }
  }, [onPrefixUpdate]);

  const handleLoadDefaults = useCallback(async () => {
    try {
      await onLoadDefaults();
    } catch (error) {
      console.error('Error loading default prefixes:', error);
    }
  }, [onLoadDefaults]);

  const handleBulkActivate = useCallback(async () => {
    try {
      await onBulkUpdate(selectedPrefixes, { isActive: true });
      setSelectedPrefixes([]);
    } catch (error) {
      console.error('Error bulk activating prefixes:', error);
    }
  }, [selectedPrefixes, onBulkUpdate]);

  const handleBulkDeactivate = useCallback(async () => {
    try {
      await onBulkUpdate(selectedPrefixes, { isActive: false });
      setSelectedPrefixes([]);
    } catch (error) {
      console.error('Error bulk deactivating prefixes:', error);
    }
  }, [selectedPrefixes, onBulkUpdate]);

  const handleSort = (field: 'name' | 'category' | 'order') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">จัดการคำนำหน้าชื่อ</h2>
          <p className="text-sm text-gray-600">
            {stats.total} คำนำหน้าชื่อ • {stats.active} ใช้งาน • {stats.defaults} เริ่มต้น
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <DefaultPrefixLoader
            existingPrefixes={prefixes}
            onLoadDefaults={async (newPrefixes) => {
              for (const prefix of newPrefixes) {
                await onPrefixCreate(prefix);
              }
            }}
          />
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            เพิ่มคำนำหน้าชื่อ
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(CATEGORIES).map(([key, category]) => (
          <div key={key} className={`p-4 rounded-lg border ${category.color}`}>
            <div className="text-2xl font-bold">{stats.byCategory[key] || 0}</div>
            <div className="text-sm">{category.label}</div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาคำนำหน้าชื่อ..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <FunnelIcon className="w-4 h-4 text-gray-500" />
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {Object.entries(CATEGORIES).map(([key, category]) => (
              <option key={key} value={key}>{category.label}</option>
            ))}
          </select>

          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ทุกเพศ</option>
            {Object.entries(GENDERS).map(([key, gender]) => (
              <option key={key} value={key}>{gender.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">เรียงตาม:</span>
        {[
          { key: 'order', label: 'ลำดับ' },
          { key: 'name', label: 'ชื่อ' },
          { key: 'category', label: 'หมวดหมู่' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleSort(key as any)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
              sortBy === key
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{label}</span>
            {sortBy === key && (
              sortDirection === 'asc' ? 
                <ArrowUpIcon className="w-3 h-3" /> : 
                <ArrowDownIcon className="w-3 h-3" />
            )}
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedPrefixes.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800">
              เลือกแล้ว {selectedPrefixes.length} รายการ
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkActivate}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                เปิดใช้งาน
              </button>
              <button
                onClick={handleBulkDeactivate}
                className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
              >
                ปิดใช้งาน
              </button>
              <button
                onClick={() => setSelectedPrefixes([])}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prefixes Grid */}
      {filteredAndSortedPrefixes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedPrefixes.map((prefix) => (
            <div key={prefix.id} className="relative">
              <input
                type="checkbox"
                checked={selectedPrefixes.includes(prefix.id!)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedPrefixes(prev => [...prev, prefix.id!]);
                  } else {
                    setSelectedPrefixes(prev => prev.filter(id => id !== prefix.id));
                  }
                }}
                className="absolute top-2 left-2 z-10"
              />
              <PrefixCard
                prefix={prefix}
                onEdit={() => handleEdit(prefix)}
                onDelete={() => handleDelete(prefix)}
                onToggleActive={() => handleToggleActive(prefix)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <UserIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {prefixes.length === 0 ? 'ยังไม่มีคำนำหน้าชื่อ' : 'ไม่พบคำนำหน้าชื่อที่ตรงกับการค้นหา'}
          </h3>
          <p className="text-gray-600 mb-4">
            {prefixes.length === 0 
              ? 'เริ่มต้นด้วยการโหลดค่าเริ่มต้นหรือเพิ่มคำนำหน้าชื่อใหม่'
              : 'ลองปรับเปลี่ยนคำค้นหาหรือตัวกรอง'
            }
          </p>
          {prefixes.length === 0 && (
            <div className="flex justify-center space-x-3">
              <DefaultPrefixLoader
                existingPrefixes={prefixes}
                onLoadDefaults={async (newPrefixes) => {
                  for (const prefix of newPrefixes) {
                    await onPrefixCreate(prefix);
                  }
                }}
              />
              <button
                onClick={handleCreate}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                เพิ่มคำนำหน้าชื่อ
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AdminModal
        isOpen={showModal}
        onClose={handleCancel}
        title={editingPrefix ? 'แก้ไขคำนำหน้าชื่อ' : 'เพิ่มคำนำหน้าชื่อใหม่'}
        size="lg"
        type="form"
      >
        <PrefixForm
          formData={formData}
          onChange={setFormData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          isEditing={!!editingPrefix}
          existingPrefixes={prefixes}
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
                  คุณต้องการลบคำนำหน้าชื่อ "{deleteConfirm.thai}" หรือไม่?
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

export default TitlePrefixManager;