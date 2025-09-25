'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { AdminDataTable } from './AdminDataTable';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import';
  entityType: 'role' | 'permission' | 'calendar' | 'semester' | 'holiday' | 'prefix' | 'user' | 'system';
  entityId: string;
  entityName: string;
  oldValue?: any;
  newValue?: any;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  status: 'success' | 'failed' | 'warning';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface AuditFilter {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  users?: string[];
  actions?: string[];
  entityTypes?: string[];
  status?: string[];
  ipAddresses?: string[];
}

export interface AuditLoggingProps {
  logs: AuditLogEntry[];
  onFilter: (filter: AuditFilter) => void;
  onExport: (format: 'json' | 'csv' | 'excel', filter?: AuditFilter) => void;
  isLoading?: boolean;
  className?: string;
}

const actionIcons = {
  create: PlusIcon,
  read: EyeIcon,
  update: PencilIcon,
  delete: TrashIcon,
  login: UserIcon,
  logout: UserIcon,
  export: DocumentArrowDownIcon,
  import: DocumentArrowDownIcon
};

const actionLabels = {
  create: 'สร้าง',
  read: 'อ่าน',
  update: 'แก้ไข',
  delete: 'ลบ',
  login: 'เข้าสู่ระบบ',
  logout: 'ออกจากระบบ',
  export: 'ส่งออก',
  import: 'นำเข้า'
};

const entityTypeLabels = {
  role: 'บทบาท',
  permission: 'สิทธิ์',
  calendar: 'ปฏิทิน',
  semester: 'ภาคการศึกษา',
  holiday: 'วันหยุด',
  prefix: 'คำนำหน้าชื่อ',
  user: 'ผู้ใช้',
  system: 'ระบบ'
};

const statusColors = {
  success: 'text-green-600 bg-green-50',
  failed: 'text-red-600 bg-red-50',
  warning: 'text-yellow-600 bg-yellow-50'
};

const statusIcons = {
  success: CheckCircleIcon,
  failed: XCircleIcon,
  warning: ExclamationTriangleIcon
};

const AuditLogDetails: React.FC<{
  log: AuditLogEntry;
  isOpen: boolean;
  onClose: () => void;
}> = ({ log, isOpen, onClose }) => {
  if (!isOpen) return null;

  const ActionIcon = actionIcons[log.action];
  const StatusIcon = statusIcons[log.status];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <ActionIcon className="w-6 h-6 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">
                รายละเอียด Audit Log
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <XCircleIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">การดำเนินการ</label>
                <div className="flex items-center space-x-2">
                  <ActionIcon className="w-4 h-4 text-gray-500" />
                  <span>{actionLabels[log.action]}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                <div className="flex items-center space-x-2">
                  <StatusIcon className={`w-4 h-4 ${statusColors[log.status].split(' ')[0]}`} />
                  <span className={`px-2 py-1 rounded-full text-xs ${statusColors[log.status]}`}>
                    {log.status === 'success' ? 'สำเร็จ' : log.status === 'failed' ? 'ล้มเหลว' : 'เตือน'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่และเวลา</label>
                <span>{log.timestamp.toLocaleString('th-TH')}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ผู้ใช้</label>
                <div>
                  <div className="font-medium">{log.userName}</div>
                  <div className="text-sm text-gray-500">{log.userRole}</div>
                </div>
              </div>
            </div>

            {/* Entity Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ข้อมูลที่เกี่ยวข้อง</label>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">ประเภท:</span>
                    <span className="ml-2 font-medium">{entityTypeLabels[log.entityType]}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">ชื่อ:</span>
                    <span className="ml-2 font-medium">{log.entityName}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">ID:</span>
                    <span className="ml-2 font-mono text-sm">{log.entityId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Changes */}
            {log.changes && log.changes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">การเปลี่ยนแปลง</label>
                <div className="space-y-3">
                  {log.changes.map((change, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="font-medium text-sm mb-2">{change.field}</div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">ค่าเดิม:</span>
                          <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded">
                            <code className="text-red-800">
                              {typeof change.oldValue === 'object' 
                                ? JSON.stringify(change.oldValue, null, 2)
                                : String(change.oldValue || 'ไม่มี')
                              }
                            </code>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">ค่าใหม่:</span>
                          <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded">
                            <code className="text-green-800">
                              {typeof change.newValue === 'object'
                                ? JSON.stringify(change.newValue, null, 2)
                                : String(change.newValue || 'ไม่มี')
                              }
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ข้อมูลทางเทคนิค</label>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">IP Address:</span>
                  <span className="font-mono">{log.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Session ID:</span>
                  <span className="font-mono">{log.sessionId}</span>
                </div>
                <div>
                  <span className="text-gray-600">User Agent:</span>
                  <div className="mt-1 text-xs break-all">{log.userAgent}</div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {log.errorMessage && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ข้อผิดพลาด</label>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <code className="text-red-800 text-sm">{log.errorMessage}</code>
                </div>
              </div>
            )}

            {/* Metadata */}
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ข้อมูลเพิ่มเติม</label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuditFilterPanel: React.FC<{
  filter: AuditFilter;
  onFilterChange: (filter: AuditFilter) => void;
  availableUsers: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ filter, onFilterChange, availableUsers, isOpen, onToggle }) => {
  const updateFilter = (updates: Partial<AuditFilter>) => {
    onFilterChange({ ...filter, ...updates });
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <FunnelIcon className="w-4 h-4" />
        <span>ตัวกรอง</span>
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">ตัวกรอง Audit Log</h3>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700"
        >
          <XCircleIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Date Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">ช่วงวันที่</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={filter.dateRange?.startDate || ''}
            onChange={(e) => updateFilter({
              dateRange: { ...filter.dateRange, startDate: e.target.value, endDate: filter.dateRange?.endDate || '' }
            })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          <input
            type="date"
            value={filter.dateRange?.endDate || ''}
            onChange={(e) => updateFilter({
              dateRange: { ...filter.dateRange, startDate: filter.dateRange?.startDate || '', endDate: e.target.value }
            })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {/* Users */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">ผู้ใช้</label>
        <select
          multiple
          value={filter.users || []}
          onChange={(e) => {
            const values = Array.from(e.target.selectedOptions, option => option.value);
            updateFilter({ users: values });
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
        >
          {availableUsers.map(user => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">การดำเนินการ</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(actionLabels).map(([action, label]) => (
            <label key={action} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filter.actions?.includes(action) || false}
                onChange={(e) => {
                  const actions = filter.actions || [];
                  if (e.target.checked) {
                    updateFilter({ actions: [...actions, action] });
                  } else {
                    updateFilter({ actions: actions.filter(a => a !== action) });
                  }
                }}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Entity Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทข้อมูล</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(entityTypeLabels).map(([type, label]) => (
            <label key={type} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filter.entityTypes?.includes(type) || false}
                onChange={(e) => {
                  const types = filter.entityTypes || [];
                  if (e.target.checked) {
                    updateFilter({ entityTypes: [...types, type] });
                  } else {
                    updateFilter({ entityTypes: types.filter(t => t !== type) });
                  }
                }}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
        <div className="flex space-x-4">
          {['success', 'failed', 'warning'].map(status => (
            <label key={status} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filter.status?.includes(status) || false}
                onChange={(e) => {
                  const statuses = filter.status || [];
                  if (e.target.checked) {
                    updateFilter({ status: [...statuses, status] });
                  } else {
                    updateFilter({ status: statuses.filter(s => s !== status) });
                  }
                }}
                className="rounded border-gray-300"
              />
              <span className="text-sm">
                {status === 'success' ? 'สำเร็จ' : status === 'failed' ? 'ล้มเหลว' : 'เตือน'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <button
          onClick={() => updateFilter({})}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
        >
          ล้างตัวกรอง
        </button>
        <button
          onClick={onToggle}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          ใช้ตัวกรอง
        </button>
      </div>
    </div>
  );
};

export const AuditLogging: React.FC<AuditLoggingProps> = ({
  logs,
  onFilter,
  onExport,
  isLoading = false,
  className = ''
}) => {
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<AuditFilter>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique users for filter
  const availableUsers = useMemo(() => {
    const userMap = new Map();
    logs.forEach(log => {
      if (!userMap.has(log.userId)) {
        userMap.set(log.userId, { id: log.userId, name: log.userName });
      }
    });
    return Array.from(userMap.values());
  }, [logs]);

  // Filter logs based on search query
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    
    const query = searchQuery.toLowerCase();
    return logs.filter(log =>
      log.userName.toLowerCase().includes(query) ||
      log.entityName.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      entityTypeLabels[log.entityType].toLowerCase().includes(query) ||
      (log.errorMessage && log.errorMessage.toLowerCase().includes(query))
    );
  }, [logs, searchQuery]);

  // Handle filter application
  const handleFilterChange = useCallback((filter: AuditFilter) => {
    setCurrentFilter(filter);
    onFilter(filter);
  }, [onFilter]);

  // Handle export
  const handleExport = useCallback((format: 'json' | 'csv' | 'excel') => {
    onExport(format, currentFilter);
  }, [onExport, currentFilter]);

  // Table columns
  const columns = [
    {
      key: 'timestamp' as keyof AuditLogEntry,
      title: 'วันที่และเวลา',
      sortable: true,
      render: (timestamp: Date) => (
        <div className="text-sm">
          <div>{timestamp.toLocaleDateString('th-TH')}</div>
          <div className="text-gray-500">{timestamp.toLocaleTimeString('th-TH')}</div>
        </div>
      )
    },
    {
      key: 'userName' as keyof AuditLogEntry,
      title: 'ผู้ใช้',
      sortable: true,
      render: (userName: string, log: AuditLogEntry) => (
        <div>
          <div className="font-medium">{userName}</div>
          <div className="text-sm text-gray-500">{log.userRole}</div>
        </div>
      )
    },
    {
      key: 'action' as keyof AuditLogEntry,
      title: 'การดำเนินการ',
      render: (action: string) => {
        const Icon = actionIcons[action as keyof typeof actionIcons];
        return (
          <div className="flex items-center space-x-2">
            <Icon className="w-4 h-4 text-gray-500" />
            <span>{actionLabels[action as keyof typeof actionLabels]}</span>
          </div>
        );
      }
    },
    {
      key: 'entityType' as keyof AuditLogEntry,
      title: 'ประเภทข้อมูล',
      render: (entityType: string, log: AuditLogEntry) => (
        <div>
          <div className="font-medium">{entityTypeLabels[entityType as keyof typeof entityTypeLabels]}</div>
          <div className="text-sm text-gray-500">{log.entityName}</div>
        </div>
      )
    },
    {
      key: 'status' as keyof AuditLogEntry,
      title: 'สถานะ',
      render: (status: string) => {
        const Icon = statusIcons[status as keyof typeof statusIcons];
        return (
          <div className="flex items-center space-x-2">
            <Icon className={`w-4 h-4 ${statusColors[status as keyof typeof statusColors].split(' ')[0]}`} />
            <span className={`px-2 py-1 rounded-full text-xs ${statusColors[status as keyof typeof statusColors]}`}>
              {status === 'success' ? 'สำเร็จ' : status === 'failed' ? 'ล้มเหลว' : 'เตือน'}
            </span>
          </div>
        );
      }
    },
    {
      key: 'ipAddress' as keyof AuditLogEntry,
      title: 'IP Address',
      render: (ipAddress: string) => (
        <span className="font-mono text-sm">{ipAddress}</span>
      )
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Audit Log</h2>
          <p className="text-sm text-gray-600 mt-1">
            บันทึกการดำเนินการทั้งหมดในระบบ
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport('json')}
            className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            ส่งออก JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            ส่งออก CSV
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาในบันทึก..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <AuditFilterPanel
          filter={currentFilter}
          onFilterChange={handleFilterChange}
          availableUsers={availableUsers}
          isOpen={showFilter}
          onToggle={() => setShowFilter(!showFilter)}
        />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <ClockIcon className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">รายการทั้งหมด</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{filteredLogs.length}</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-900">สำเร็จ</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {filteredLogs.filter(log => log.status === 'success').length}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <XCircleIcon className="w-5 h-5 text-red-600" />
            <span className="font-medium text-gray-900">ล้มเหลว</span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {filteredLogs.filter(log => log.status === 'failed').length}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <UserIcon className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-gray-900">ผู้ใช้ที่ใช้งาน</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {new Set(filteredLogs.map(log => log.userId)).size}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <AdminDataTable
          data={filteredLogs}
          columns={columns}
          loading={isLoading}
          pagination={{
            enabled: true,
            pageSize: 20
          }}
          sorting={{
            enabled: true,
            defaultSort: { key: 'timestamp', direction: 'desc' }
          }}
          onRowClick={(log) => setSelectedLog(log)}
        />
      </div>

      {/* Log Details Modal */}
      <AuditLogDetails
        log={selectedLog!}
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};

export default AuditLogging;