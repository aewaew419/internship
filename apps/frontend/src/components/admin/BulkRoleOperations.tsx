'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  UserGroupIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { AdminModal } from './AdminModal';
import { AdminDataTable } from './AdminDataTable';

export interface Role {
  id: number;
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  userCount: number;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BulkOperation {
  type: 'assign_permissions' | 'remove_permissions' | 'delete_roles' | 'export_roles' | 'import_roles' | 'modify_roles';
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresConfirmation: boolean;
  destructive?: boolean;
}

export interface BulkRoleOperationsProps {
  roles: Role[];
  selectedRoles: Role[];
  onSelectionChange: (roles: Role[]) => void;
  onBulkOperation: (operation: string, data: any) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export interface BulkPermissionAssignmentData {
  roleIds: number[];
  permissions: string[];
  action: 'add' | 'remove' | 'replace';
}

export interface BulkRoleModificationData {
  roleIds: number[];
  changes: {
    displayName?: string;
    description?: string;
    isActive?: boolean;
  };
}

export interface RoleDependency {
  roleId: number;
  roleName: string;
  dependentUsers: number;
  dependentPermissions: string[];
  canDelete: boolean;
  warnings: string[];
}

const BulkOperationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  operation: BulkOperation | null;
  selectedRoles: Role[];
  onConfirm: (data: any) => Promise<void>;
}> = ({ isOpen, onClose, operation, selectedRoles, onConfirm }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [dependencies, setDependencies] = useState<RoleDependency[]>([]);
  const [showDependencies, setShowDependencies] = useState(false);

  const availablePermissions = [
    'read_users', 'write_users', 'delete_users',
    'read_roles', 'write_roles', 'delete_roles',
    'read_calendar', 'write_calendar', 'delete_calendar',
    'read_prefixes', 'write_prefixes', 'delete_prefixes',
    'admin_dashboard', 'system_settings', 'audit_logs'
  ];

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(formData);
      onClose();
    } catch (error) {
      console.error('Bulk operation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const checkDependencies = useCallback(async () => {
    if (operation?.type === 'delete_roles') {
      // Mock dependency checking
      const mockDependencies: RoleDependency[] = selectedRoles.map(role => ({
        roleId: role.id,
        roleName: role.displayName,
        dependentUsers: role.userCount,
        dependentPermissions: role.permissions,
        canDelete: !role.isSystem && role.userCount === 0,
        warnings: [
          ...(role.isSystem ? ['บทบาทระบบไม่สามารถลบได้'] : []),
          ...(role.userCount > 0 ? [`มีผู้ใช้ ${role.userCount} คนที่ใช้บทบาทนี้`] : [])
        ]
      }));
      
      setDependencies(mockDependencies);
      setShowDependencies(true);
    }
  }, [operation, selectedRoles]);

  React.useEffect(() => {
    if (isOpen && operation) {
      checkDependencies();
    }
  }, [isOpen, operation, checkDependencies]);

  if (!operation) return null;

  const renderOperationContent = () => {
    switch (operation.type) {
      case 'assign_permissions':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                การดำเนินการ
              </label>
              <select
                value={formData.action || 'add'}
                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="add">เพิ่มสิทธิ์</option>
                <option value="remove">ลบสิทธิ์</option>
                <option value="replace">แทนที่สิทธิ์ทั้งหมด</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือกสิทธิ์
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                {availablePermissions.map(permission => (
                  <label key={permission} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={formData.permissions?.includes(permission) || false}
                      onChange={(e) => {
                        const permissions = formData.permissions || [];
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            permissions: [...permissions, permission]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            permissions: permissions.filter((p: string) => p !== permission)
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{permission}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'delete_roles':
        return (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">
                  คำเตือน: การลบบทบาทไม่สามารถย้อนกลับได้
                </span>
              </div>
              <p className="text-sm text-red-700">
                คุณกำลังจะลบบทบาท {selectedRoles.length} รายการ
              </p>
            </div>

            {showDependencies && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">ตรวจสอบการพึ่งพา:</h4>
                {dependencies.map(dep => (
                  <div
                    key={dep.roleId}
                    className={`border rounded-lg p-3 ${
                      dep.canDelete ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{dep.roleName}</span>
                      {dep.canDelete ? (
                        <CheckIcon className="w-4 h-4 text-green-600" />
                      ) : (
                        <XMarkIcon className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    {dep.warnings.length > 0 && (
                      <ul className="text-sm space-y-1">
                        {dep.warnings.map((warning, index) => (
                          <li key={index} className="text-red-700">• {warning}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'export_roles':
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
                {['basic_info', 'permissions', 'user_assignments', 'metadata'].map(option => (
                  <label key={option} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.includeData?.[option] || false}
                      onChange={(e) => {
                        const includeData = formData.includeData || {};
                        setFormData({
                          ...formData,
                          includeData: {
                            ...includeData,
                            [option]: e.target.checked
                          }
                        });
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">
                      {option === 'basic_info' && 'ข้อมูลพื้นฐาน'}
                      {option === 'permissions' && 'สิทธิ์การเข้าถึง'}
                      {option === 'user_assignments' && 'การกำหนดผู้ใช้'}
                      {option === 'metadata' && 'ข้อมูลเมตา'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'import_roles':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อัปโหลดไฟล์
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
                  <span className="text-sm">ข้ามบทบาทที่ซ้ำกัน</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.validatePermissions || false}
                    onChange={(e) => setFormData({ ...formData, validatePermissions: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">ตรวจสอบสิทธิ์ก่อนนำเข้า</span>
                </label>
              </div>
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
      case 'assign_permissions':
        return formData.permissions && formData.permissions.length > 0;
      case 'delete_roles':
        return dependencies.some(dep => dep.canDelete);
      case 'export_roles':
        return formData.format;
      case 'import_roles':
        return formData.file;
      default:
        return true;
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${operation.label} (${selectedRoles.length} รายการ)`}
      size="lg"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">{operation.description}</p>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">บทบาทที่เลือก:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedRoles.map(role => (
              <span
                key={role.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
              >
                {role.displayName}
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

export const BulkRoleOperations: React.FC<BulkRoleOperationsProps> = ({
  roles,
  selectedRoles,
  onSelectionChange,
  onBulkOperation,
  isLoading = false,
  className = ''
}) => {
  const [activeOperation, setActiveOperation] = useState<BulkOperation | null>(null);
  const [showOperationModal, setShowOperationModal] = useState(false);

  const bulkOperations: BulkOperation[] = [
    {
      type: 'assign_permissions',
      label: 'จัดการสิทธิ์',
      description: 'เพิ่ม ลบ หรือแทนที่สิทธิ์การเข้าถึงสำหรับบทบาทที่เลือก',
      icon: Cog6ToothIcon,
      requiresConfirmation: true
    },
    {
      type: 'export_roles',
      label: 'ส่งออกข้อมูล',
      description: 'ส่งออกข้อมูลบทบาทในรูปแบบ JSON, Excel หรือ CSV',
      icon: DocumentArrowDownIcon,
      requiresConfirmation: false
    },
    {
      type: 'import_roles',
      label: 'นำเข้าข้อมูล',
      description: 'นำเข้าข้อมูลบทบาทจากไฟล์ภายนอก',
      icon: DocumentArrowUpIcon,
      requiresConfirmation: true
    },
    {
      type: 'delete_roles',
      label: 'ลบบทบาท',
      description: 'ลบบทบาทที่เลือกออกจากระบบ (ไม่สามารถย้อนกลับได้)',
      icon: TrashIcon,
      requiresConfirmation: true,
      destructive: true
    }
  ];

  const handleOperationClick = (operation: BulkOperation) => {
    if (operation.type === 'import_roles' || selectedRoles.length > 0) {
      setActiveOperation(operation);
      setShowOperationModal(true);
    }
  };

  const handleOperationConfirm = async (data: any) => {
    if (!activeOperation) return;

    const operationData = {
      operation: activeOperation.type,
      roleIds: selectedRoles.map(role => role.id),
      ...data
    };

    await onBulkOperation(activeOperation.type, operationData);
    setShowOperationModal(false);
    setActiveOperation(null);
  };

  const tableColumns = [
    {
      key: 'displayName' as keyof Role,
      title: 'ชื่อบทบาท',
      sortable: true,
      render: (value: any, role: Role) => (
        <div>
          <div className="font-medium">{role.displayName}</div>
          <div className="text-sm text-gray-500">{role.name}</div>
        </div>
      )
    },
    {
      key: 'description' as keyof Role,
      title: 'คำอธิบาย',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value}</span>
      )
    },
    {
      key: 'userCount' as keyof Role,
      title: 'จำนวนผู้ใช้',
      sortable: true,
      render: (value: number) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
          {value} คน
        </span>
      )
    },
    {
      key: 'permissions' as keyof Role,
      title: 'สิทธิ์',
      render: (permissions: string[]) => (
        <span className="text-sm text-gray-600">
          {permissions.length} สิทธิ์
        </span>
      )
    },
    {
      key: 'isSystem' as keyof Role,
      title: 'ประเภท',
      render: (isSystem: boolean) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
          isSystem ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {isSystem ? 'ระบบ' : 'ทั่วไป'}
        </span>
      )
    }
  ];

  const selectedRoleIds = selectedRoles.map(role => role.id);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Bulk Operations Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">การดำเนินการแบบกลุ่ม</h3>
            <p className="text-sm text-gray-600">
              เลือกบทบาทและดำเนินการกับหลายรายการพร้อมกัน
            </p>
          </div>
          <div className="text-sm text-gray-500">
            เลือกแล้ว: {selectedRoles.length} / {roles.length} รายการ
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {bulkOperations.map(operation => {
            const Icon = operation.icon;
            const isDisabled = operation.type !== 'import_roles' && selectedRoles.length === 0;
            
            return (
              <button
                key={operation.type}
                onClick={() => handleOperationClick(operation)}
                disabled={isDisabled || isLoading}
                className={`
                  flex items-center space-x-2 p-3 rounded-lg border transition-colors text-left
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

      {/* Role Selection Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">เลือกบทบาทสำหรับการดำเนินการ</h4>
        </div>
        
        <AdminDataTable
          data={roles}
          columns={tableColumns}
          loading={isLoading}
          selection={{
            enabled: true,
            selectedIds: selectedRoleIds,
            onSelectionChange: (ids) => {
              const selected = roles.filter(role => ids.includes(role.id));
              onSelectionChange(selected);
            }
          }}
          pagination={{
            enabled: true,
            pageSize: 10
          }}
          sorting={{
            enabled: true,
            defaultSort: { key: 'displayName', direction: 'asc' }
          }}
        />
      </div>

      {/* Operation Modal */}
      <BulkOperationModal
        isOpen={showOperationModal}
        onClose={() => {
          setShowOperationModal(false);
          setActiveOperation(null);
        }}
        operation={activeOperation}
        selectedRoles={selectedRoles}
        onConfirm={handleOperationConfirm}
      />
    </div>
  );
};

export default BulkRoleOperations;