'use client';

import React, { useState, useCallback } from 'react';
import {
  UserIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  TrashIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { AdminModal } from './AdminModal';
import { AdminDataTable } from './AdminDataTable';

export interface TitlePrefix {
  id: number;
  thai: string;
  english: string;
  abbreviation: string;
  category: 'academic' | 'professional' | 'honorary' | 'religious';
  gender: 'male' | 'female' | 'neutral';
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
  assignedRoles: number;
}

export interface Role {
  id: number;
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  userCount: number;
}

export interface PrefixRoleAssignment {
  prefixId: number;
  roleId: number;
  isDefault: boolean;
  canModify: boolean;
}

export interface BulkPrefixOperation {
  type: 'assign_to_roles' | 'modify_prefixes' | 'import_prefixes' | 'export_prefixes' | 'delete_prefixes' | 'set_defaults';
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresConfirmation: boolean;
  destructive?: boolean;
}

export interface BulkPrefixOperationsProps {
  prefixes: TitlePrefix[];
  roles: Role[];
  assignments: PrefixRoleAssignment[];
  selectedPrefixes: TitlePrefix[];
  onSelectionChange: (prefixes: TitlePrefix[]) => void;
  onBulkOperation: (operation: string, data: any) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export interface BulkPrefixAssignmentData {
  prefixIds: number[];
  roleIds: number[];
  action: 'assign' | 'unassign' | 'set_default';
}

export interface BulkPrefixModificationData {
  prefixIds: number[];
  changes: {
    category?: string;
    gender?: string;
    isActive?: boolean;
    sortOrder?: number;
  };
}

export interface BulkPrefixImportData {
  file: File;
  skipDuplicates: boolean;
  validateGender: boolean;
  autoAssignRoles: boolean;
}

export interface BulkPrefixExportData {
  prefixIds: number[];
  format: 'json' | 'excel' | 'csv';
  includeAssignments: boolean;
  includeMetadata: boolean;
}

const BulkPrefixModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  operation: BulkPrefixOperation | null;
  selectedPrefixes: TitlePrefix[];
  roles: Role[];
  onConfirm: (data: any) => Promise<void>;
}> = ({ isOpen, onClose, operation, selectedPrefixes, roles, onConfirm }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(formData);
      onClose();
    } catch (error) {
      console.error('Bulk prefix operation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!operation) return null;

  const renderOperationContent = () => {
    switch (operation.type) {
      case 'assign_to_roles':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                การดำเนินการ
              </label>
              <select
                value={formData.action || 'assign'}
                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="assign">กำหนดให้บทบาท</option>
                <option value="unassign">ยกเลิกการกำหนด</option>
                <option value="set_default">ตั้งเป็นค่าเริ่มต้น</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือกบทบาท
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                {roles.map(role => (
                  <label key={role.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={formData.roleIds?.includes(role.id) || false}
                      onChange={(e) => {
                        const roleIds = formData.roleIds || [];
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            roleIds: [...roleIds, role.id]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            roleIds: roleIds.filter((id: number) => id !== role.id)
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <div>
                      <span className="text-sm font-medium">{role.displayName}</span>
                      <span className="text-xs text-gray-500 ml-2">({role.userCount} คน)</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {formData.action === 'assign' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  จะกำหนดคำนำหน้าชื่อ {selectedPrefixes.length} รายการ 
                  ให้กับบทบาท {formData.roleIds?.length || 0} รายการ
                </p>
              </div>
            )}
          </div>
        );

      case 'modify_prefixes':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมวดหมู่
              </label>
              <select
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">ไม่เปลี่ยนแปลง</option>
                <option value="academic">วิชาการ</option>
                <option value="professional">อาชีพ</option>
                <option value="honorary">กิตติมศักดิ์</option>
                <option value="religious">ศาสนา</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เพศ
              </label>
              <select
                value={formData.gender || ''}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">ไม่เปลี่ยนแปลง</option>
                <option value="male">ชาย</option>
                <option value="female">หญิง</option>
                <option value="neutral">ทั่วไป</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานะ
              </label>
              <select
                value={formData.isActive !== undefined ? formData.isActive.toString() : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ 
                    ...formData, 
                    isActive: value === '' ? undefined : value === 'true'
                  });
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">ไม่เปลี่ยนแปลง</option>
                <option value="true">ใช้งาน</option>
                <option value="false">ไม่ใช้งาน</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ลำดับการแสดง
              </label>
              <input
                type="number"
                min="0"
                value={formData.sortOrder || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  sortOrder: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="ไม่เปลี่ยนแปลง"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        );

      case 'import_prefixes':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อัปโหลดไฟล์คำนำหน้าชื่อ
              </label>
              <input
                type="file"
                accept=".json,.xlsx,.csv"
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                รองรับไฟล์ JSON, Excel (.xlsx), หรือ CSV
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ตัวเลือกการนำเข้า
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.skipDuplicates || false}
                    onChange={(e) => setFormData({ ...formData, skipDuplicates: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">ข้ามคำนำหน้าชื่อที่ซ้ำกัน</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.validateGender || false}
                    onChange={(e) => setFormData({ ...formData, validateGender: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">ตรวจสอบความถูกต้องของเพศ</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.autoAssignRoles || false}
                    onChange={(e) => setFormData({ ...formData, autoAssignRoles: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">กำหนดบทบาทอัตโนมัติตามหมวดหมู่</span>
                </label>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>รูปแบบไฟล์ที่ต้องการ:</strong><br/>
                CSV: thai,english,abbreviation,category,gender<br/>
                JSON: {`{"thai": "นาย", "english": "Mr.", "abbreviation": "Mr.", "category": "professional", "gender": "male"}`}
              </p>
            </div>
          </div>
        );

      case 'export_prefixes':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รูปแบบการส่งออก
              </label>
              <select
                value={formData.format || 'json'}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="json">JSON</option>
                <option value="excel">Excel (.xlsx)</option>
                <option value="csv">CSV</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ข้อมูลที่ต้องการส่งออก
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.includeAssignments || false}
                    onChange={(e) => setFormData({ ...formData, includeAssignments: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">การกำหนดบทบาท</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.includeMetadata || false}
                    onChange={(e) => setFormData({ ...formData, includeMetadata: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">ข้อมูลเมตา (วันที่สร้าง, แก้ไข)</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'delete_prefixes':
        return (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">
                  คำเตือน: การลบคำนำหน้าชื่อไม่สามารถย้อนกลับได้
                </span>
              </div>
              <p className="text-sm text-red-700">
                คุณกำลังจะลบคำนำหน้าชื่อ {selectedPrefixes.length} รายการ
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">คำนำหน้าชื่อที่จะลบ:</h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedPrefixes.map((prefix) => (
                  <div key={prefix.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{prefix.thai}</span>
                      <span className="text-gray-500 ml-2">({prefix.english})</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {prefix.assignedRoles > 0 && (
                        <span className="text-red-600">กำหนดให้ {prefix.assignedRoles} บทบาท</span>
                      )}
                      {prefix.isDefault && (
                        <span className="text-yellow-600 ml-2">ค่าเริ่มต้น</span>
                      )}
                    </div>
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
                  ฉันเข้าใจและยืนยันการลบคำนำหน้าชื่อเหล่านี้
                </span>
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.removeAssignments || false}
                  onChange={(e) => setFormData({ ...formData, removeAssignments: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">
                  ลบการกำหนดบทบาทที่เกี่ยวข้องด้วย
                </span>
              </label>
            </div>
          </div>
        );

      case 'set_defaults':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                การดำเนินการ
              </label>
              <select
                value={formData.defaultAction || 'set'}
                onChange={(e) => setFormData({ ...formData, defaultAction: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="set">ตั้งเป็นค่าเริ่มต้น</option>
                <option value="unset">ยกเลิกค่าเริ่มต้น</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ขอบเขตการใช้งาน
              </label>
              <select
                value={formData.scope || 'category'}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="category">ตามหมวดหมู่</option>
                <option value="gender">ตามเพศ</option>
                <option value="global">ทั่วไป</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                การตั้งค่าเริ่มต้นจะส่งผลต่อการแสดงผลและการเลือกคำนำหน้าชื่อในระบบ
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
      case 'assign_to_roles':
        return formData.roleIds && formData.roleIds.length > 0;
      case 'modify_prefixes':
        return Object.keys(formData).some(key => 
          ['category', 'gender', 'isActive', 'sortOrder'].includes(key) && 
          formData[key] !== undefined && formData[key] !== ''
        );
      case 'import_prefixes':
        return formData.file;
      case 'export_prefixes':
        return formData.format;
      case 'delete_prefixes':
        return formData.confirmDelete;
      case 'set_defaults':
        return formData.defaultAction && formData.scope;
      default:
        return true;
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${operation.label} (${selectedPrefixes.length} รายการ)`}
      size="lg"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">{operation.description}</p>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">คำนำหน้าชื่อที่เลือก:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedPrefixes.map(prefix => (
              <span
                key={prefix.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
              >
                {prefix.thai} ({prefix.english})
              </span>
            ))}
          </div>
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

export const BulkPrefixOperations: React.FC<BulkPrefixOperationsProps> = ({
  prefixes,
  roles,
  assignments,
  selectedPrefixes,
  onSelectionChange,
  onBulkOperation,
  isLoading = false,
  className = ''
}) => {
  const [activeOperation, setActiveOperation] = useState<BulkPrefixOperation | null>(null);
  const [showOperationModal, setShowOperationModal] = useState(false);

  const bulkOperations: BulkPrefixOperation[] = [
    {
      type: 'assign_to_roles',
      label: 'กำหนดบทบาท',
      description: 'กำหนดคำนำหน้าชื่อที่เลือกให้กับบทบาทต่างๆ',
      icon: UserGroupIcon,
      requiresConfirmation: true
    },
    {
      type: 'modify_prefixes',
      label: 'แก้ไขข้อมูล',
      description: 'แก้ไขหมวดหมู่ เพศ หรือสถานะของคำนำหน้าชื่อ',
      icon: Cog6ToothIcon,
      requiresConfirmation: true
    },
    {
      type: 'set_defaults',
      label: 'ตั้งค่าเริ่มต้น',
      description: 'ตั้งหรือยกเลิกค่าเริ่มต้นสำหรับคำนำหน้าชื่อ',
      icon: CheckIcon,
      requiresConfirmation: true
    },
    {
      type: 'export_prefixes',
      label: 'ส่งออกข้อมูล',
      description: 'ส่งออกข้อมูลคำนำหน้าชื่อในรูปแบบต่างๆ',
      icon: DocumentArrowDownIcon,
      requiresConfirmation: false
    },
    {
      type: 'import_prefixes',
      label: 'นำเข้าข้อมูล',
      description: 'นำเข้าคำนำหน้าชื่อจากไฟล์ภายนอก',
      icon: DocumentArrowUpIcon,
      requiresConfirmation: true
    },
    {
      type: 'delete_prefixes',
      label: 'ลบคำนำหน้าชื่อ',
      description: 'ลบคำนำหน้าชื่อที่เลือกออกจากระบบ',
      icon: TrashIcon,
      requiresConfirmation: true,
      destructive: true
    }
  ];

  const handleOperationClick = (operation: BulkPrefixOperation) => {
    if (operation.type === 'import_prefixes' || selectedPrefixes.length > 0) {
      setActiveOperation(operation);
      setShowOperationModal(true);
    }
  };

  const handleOperationConfirm = async (data: any) => {
    if (!activeOperation) return;

    const operationData = {
      operation: activeOperation.type,
      prefixIds: selectedPrefixes.map(prefix => prefix.id),
      ...data
    };

    await onBulkOperation(activeOperation.type, operationData);
    setShowOperationModal(false);
    setActiveOperation(null);
  };

  const tableColumns = [
    {
      key: 'thai' as keyof TitlePrefix,
      title: 'คำนำหน้าชื่อ',
      sortable: true,
      render: (value: string, prefix: TitlePrefix) => (
        <div>
          <div className="font-medium">{prefix.thai}</div>
          <div className="text-sm text-gray-500">{prefix.english} ({prefix.abbreviation})</div>
        </div>
      )
    },
    {
      key: 'category' as keyof TitlePrefix,
      title: 'หมวดหมู่',
      render: (category: string) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
          category === 'academic' ? 'bg-blue-100 text-blue-800' :
          category === 'professional' ? 'bg-green-100 text-green-800' :
          category === 'honorary' ? 'bg-purple-100 text-purple-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {category === 'academic' && 'วิชาการ'}
          {category === 'professional' && 'อาชีพ'}
          {category === 'honorary' && 'กิตติมศักดิ์'}
          {category === 'religious' && 'ศาสนา'}
        </span>
      )
    },
    {
      key: 'gender' as keyof TitlePrefix,
      title: 'เพศ',
      render: (gender: string) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
          gender === 'male' ? 'bg-blue-100 text-blue-800' :
          gender === 'female' ? 'bg-pink-100 text-pink-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {gender === 'male' && 'ชาย'}
          {gender === 'female' && 'หญิง'}
          {gender === 'neutral' && 'ทั่วไป'}
        </span>
      )
    },
    {
      key: 'assignedRoles' as keyof TitlePrefix,
      title: 'บทบาทที่กำหนด',
      sortable: true,
      render: (count: number) => (
        <span className="text-sm text-gray-600">{count} บทบาท</span>
      )
    },
    {
      key: 'isDefault' as keyof TitlePrefix,
      title: 'ค่าเริ่มต้น',
      render: (isDefault: boolean) => (
        isDefault ? (
          <CheckIcon className="w-4 h-4 text-green-600" />
        ) : (
          <XMarkIcon className="w-4 h-4 text-gray-300" />
        )
      )
    },
    {
      key: 'isActive' as keyof TitlePrefix,
      title: 'สถานะ',
      render: (isActive: boolean) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
        </span>
      )
    }
  ];

  const selectedPrefixIds = selectedPrefixes.map(prefix => prefix.id);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Bulk Operations Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">การดำเนินการคำนำหน้าชื่อแบบกลุ่ม</h3>
            <p className="text-sm text-gray-600">
              จัดการคำนำหน้าชื่อและการกำหนดบทบาทแบบกลุ่ม
            </p>
          </div>
          <div className="text-sm text-gray-500">
            เลือกแล้ว: {selectedPrefixes.length} / {prefixes.length} รายการ
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {bulkOperations.map(operation => {
            const Icon = operation.icon;
            const isDisabled = operation.type !== 'import_prefixes' && selectedPrefixes.length === 0;
            
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

      {/* Prefix Selection Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">เลือกคำนำหน้าชื่อสำหรับการดำเนินการ</h4>
        </div>
        
        <AdminDataTable
          data={prefixes}
          columns={tableColumns}
          loading={isLoading}
          selection={{
            enabled: true,
            selectedIds: selectedPrefixIds,
            onSelectionChange: (ids) => {
              const selected = prefixes.filter(prefix => ids.includes(prefix.id));
              onSelectionChange(selected);
            }
          }}
          pagination={{
            enabled: true,
            pageSize: 10
          }}
          sorting={{
            enabled: true,
            defaultSort: { key: 'thai', direction: 'asc' }
          }}
          filtering={{
            enabled: true,
            searchableColumns: ['thai', 'english', 'category', 'gender']
          }}
        />
      </div>

      {/* Operation Modal */}
      <BulkPrefixModal
        isOpen={showOperationModal}
        onClose={() => {
          setShowOperationModal(false);
          setActiveOperation(null);
        }}
        operation={activeOperation}
        selectedPrefixes={selectedPrefixes}
        roles={roles}
        onConfirm={handleOperationConfirm}
      />
    </div>
  );
};

export default BulkPrefixOperations;