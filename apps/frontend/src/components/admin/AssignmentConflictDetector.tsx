'use client';

import React, { useMemo } from 'react';
import { 
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  UserIcon,
  ShieldExclamationIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface TitlePrefix {
  id: number;
  thai: string;
  english: string;
  abbreviation: string;
  category: 'academic' | 'professional' | 'honorary' | 'religious';
  gender: 'male' | 'female' | 'neutral';
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
}

interface Role {
  id: number;
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  category: 'student' | 'faculty' | 'staff' | 'admin' | 'external';
  level: number;
  isActive: boolean;
}

interface PrefixRoleAssignment {
  prefixId: number;
  roleId: number;
  isDefault: boolean;
  canModify: boolean;
  assignedBy: number;
  assignedAt: string;
}

interface AssignmentConflict {
  id: string;
  type: 'gender_mismatch' | 'category_conflict' | 'duplicate_default' | 'missing_default' | 'inappropriate_assignment' | 'system_role_conflict';
  severity: 'error' | 'warning' | 'info';
  prefixId: number;
  roleId: number;
  message: string;
  description: string;
  suggestions: string[];
  affectedAssignments?: PrefixRoleAssignment[];
}

interface AssignmentConflictDetectorProps {
  prefixes: TitlePrefix[];
  roles: Role[];
  assignments: PrefixRoleAssignment[];
  onResolveConflict?: (conflict: AssignmentConflict, resolution: string) => void;
  showResolutions?: boolean;
}

const detectAssignmentConflicts = (
  prefixes: TitlePrefix[],
  roles: Role[],
  assignments: PrefixRoleAssignment[]
): AssignmentConflict[] => {
  const conflicts: AssignmentConflict[] = [];
  const prefixMap = new Map(prefixes.map(p => [p.id, p]));
  const roleMap = new Map(roles.map(r => [r.id, r]));

  // Group assignments by role for easier analysis
  const assignmentsByRole = assignments.reduce((acc, assignment) => {
    if (!acc[assignment.roleId]) acc[assignment.roleId] = [];
    acc[assignment.roleId].push(assignment);
    return acc;
  }, {} as Record<number, PrefixRoleAssignment[]>);

  // Check each role for conflicts
  roles.forEach(role => {
    const roleAssignments = assignmentsByRole[role.id] || [];
    
    // Check for duplicate defaults
    const defaultAssignments = roleAssignments.filter(a => a.isDefault);
    if (defaultAssignments.length > 1) {
      conflicts.push({
        id: `duplicate-default-${role.id}`,
        type: 'duplicate_default',
        severity: 'error',
        prefixId: defaultAssignments[0].prefixId,
        roleId: role.id,
        message: `บทบาท "${role.displayName}" มีคำนำหน้าชื่อเริ่มต้นมากกว่า 1 รายการ`,
        description: `พบคำนำหน้าชื่อเริ่มต้น ${defaultAssignments.length} รายการ ซึ่งควรมีเพียง 1 รายการเท่านั้น`,
        suggestions: [
          'เลือกคำนำหน้าชื่อเริ่มต้นเพียง 1 รายการ',
          'ยกเลิกการเป็นเริ่มต้นของรายการอื่น',
          'ตรวจสอบนโยบายการกำหนดค่าเริ่มต้น'
        ],
        affectedAssignments: defaultAssignments
      });
    }

    // Check for missing defaults (if role has assignments but no default)
    if (roleAssignments.length > 0 && defaultAssignments.length === 0) {
      conflicts.push({
        id: `missing-default-${role.id}`,
        type: 'missing_default',
        severity: 'warning',
        prefixId: roleAssignments[0].prefixId,
        roleId: role.id,
        message: `บทบาท "${role.displayName}" ไม่มีคำนำหน้าชื่อเริ่มต้น`,
        description: `บทบาทนี้มีคำนำหน้าชื่อ ${roleAssignments.length} รายการ แต่ไม่มีการกำหนดค่าเริ่มต้น`,
        suggestions: [
          'กำหนดคำนำหน้าชื่อเริ่มต้นสำหรับบทบาทนี้',
          'เลือกคำนำหน้าชื่อที่เหมาะสมที่สุด',
          'พิจารณาใช้คำนำหน้าชื่อทั่วไปเป็นเริ่มต้น'
        ],
        affectedAssignments: roleAssignments
      });
    }
  });

  // Check individual assignments for conflicts
  assignments.forEach(assignment => {
    const prefix = prefixMap.get(assignment.prefixId);
    const role = roleMap.get(assignment.roleId);
    
    if (!prefix || !role) return;

    // Gender mismatch conflicts
    if (prefix.gender !== 'neutral') {
      // Check if prefix gender is appropriate for role context
      if (role.category === 'student' && prefix.category === 'academic') {
        conflicts.push({
          id: `gender-academic-${prefix.id}-${role.id}`,
          type: 'category_conflict',
          severity: 'warning',
          prefixId: prefix.id,
          roleId: role.id,
          message: `คำนำหน้าชื่อวิชาการ "${prefix.thai}" อาจไม่เหมาะสมสำหรับนักศึกษา`,
          description: `คำนำหน้าชื่อประเภทวิชาการมักใช้สำหรับอาจารย์และบุคลากรทางวิชาการ`,
          suggestions: [
            'ใช้คำนำหน้าชื่อทั่วไป เช่น นาย นาง นางสาว',
            'ตรวจสอบนโยบายการใช้คำนำหน้าชื่อของสถาบัน',
            'พิจารณาเปลี่ยนประเภทบทบาทหากเหมาะสม'
          ]
        });
      }
    }

    // Category conflicts
    if (prefix.category === 'religious' && !['external', 'admin'].includes(role.category)) {
      conflicts.push({
        id: `religious-${prefix.id}-${role.id}`,
        type: 'inappropriate_assignment',
        severity: 'info',
        prefixId: prefix.id,
        roleId: role.id,
        message: `คำนำหน้าชื่อทางศาสนา "${prefix.thai}" ในบทบาท "${role.displayName}"`,
        description: `คำนำหน้าชื่อทางศาสนาอาจไม่เหมาะสมสำหรับบทบาทภายในสถาบัน`,
        suggestions: [
          'ตรวจสอบความเหมาะสมของการใช้คำนำหน้าชื่อนี้',
          'พิจารณาใช้เฉพาะกับบุคคลภายนอกหรือผู้ดูแลระบบ',
          'ปรึกษานโยบายของสถาบัน'
        ]
      });
    }

    // Honorary titles for inappropriate roles
    if (prefix.category === 'honorary' && role.category === 'student') {
      conflicts.push({
        id: `honorary-student-${prefix.id}-${role.id}`,
        type: 'inappropriate_assignment',
        severity: 'warning',
        prefixId: prefix.id,
        roleId: role.id,
        message: `คำนำหน้าชื่อกิตติมศักดิ์ "${prefix.thai}" สำหรับนักศึกษา`,
        description: `คำนำหน้าชื่อกิตติมศักดิ์มักใช้สำหรับบุคคลที่ได้รับการยกย่องเป็นพิเศษ`,
        suggestions: [
          'ใช้คำนำหน้าชื่อทั่วไปสำหรับนักศึกษา',
          'สงวนคำนำหน้าชื่อกิตติมศักดิ์สำหรับกรณีพิเศษ',
          'ตรวจสอบเกณฑ์การใช้คำนำหน้าชื่อกิตติมศักดิ์'
        ]
      });
    }

    // System role conflicts
    if (role.isSystem && !assignment.canModify) {
      conflicts.push({
        id: `system-role-${prefix.id}-${role.id}`,
        type: 'system_role_conflict',
        severity: 'info',
        prefixId: prefix.id,
        roleId: role.id,
        message: `บทบาทระบบ "${role.displayName}" มีข้อจำกัดในการแก้ไข`,
        description: `บทบาทระบบอาจมีข้อจำกัดในการเปลี่ยนแปลงคำนำหน้าชื่อ`,
        suggestions: [
          'ตรวจสอบสิทธิ์ในการแก้ไขบทบาทระบบ',
          'ปรึกษาผู้ดูแลระบบหากต้องการเปลี่ยนแปลง',
          'พิจารณาสร้างบทบาทใหม่แทนการแก้ไขบทบาทระบบ'
        ]
      });
    }
  });

  return conflicts.sort((a, b) => {
    // Sort by severity (error > warning > info) then by type
    const severityOrder = { error: 0, warning: 1, info: 2 };
    if (a.severity !== b.severity) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return a.type.localeCompare(b.type);
  });
};

const ConflictIcon: React.FC<{ 
  type: AssignmentConflict['type']; 
  severity: AssignmentConflict['severity'] 
}> = ({ type, severity }) => {
  const iconClass = `w-5 h-5 ${
    severity === 'error' 
      ? 'text-red-500' 
      : severity === 'warning' 
        ? 'text-yellow-500' 
        : 'text-blue-500'
  }`;

  switch (type) {
    case 'duplicate_default':
    case 'missing_default':
      return <ExclamationTriangleIcon className={iconClass} />;
    case 'gender_mismatch':
      return <UserIcon className={iconClass} />;
    case 'category_conflict':
    case 'inappropriate_assignment':
      return <ShieldExclamationIcon className={iconClass} />;
    case 'system_role_conflict':
      return <ClockIcon className={iconClass} />;
    default:
      return <XCircleIcon className={iconClass} />;
  }
};

const ConflictCard: React.FC<{
  conflict: AssignmentConflict;
  prefix: TitlePrefix;
  role: Role;
  onResolve?: (resolution: string) => void;
  showResolutions?: boolean;
}> = ({ conflict, prefix, role, onResolve, showResolutions = true }) => {
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
    gender_mismatch: 'ความไม่สอดคล้องของเพศ',
    category_conflict: 'ความขัดแย้งของหมวดหมู่',
    duplicate_default: 'ค่าเริ่มต้นซ้ำ',
    missing_default: 'ขาดค่าเริ่มต้น',
    inappropriate_assignment: 'การกำหนดที่ไม่เหมาะสม',
    system_role_conflict: 'ข้อจำกัดของบทบาทระบบ',
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
          <p className={`text-sm ${severityTextColors[conflict.severity]} opacity-80 mb-3`}>
            {conflict.description}
          </p>
        </div>
      </div>

      {/* Affected Entities */}
      <div className="mb-3 p-3 bg-white rounded border">
        <div className="text-xs text-gray-500 mb-2">เกี่ยวข้องกับ</div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">{prefix.thai}</span>
            <span className="text-gray-500">({prefix.english})</span>
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
              {prefix.category === 'academic' ? 'วิชาการ' :
               prefix.category === 'professional' ? 'อาชีพ' :
               prefix.category === 'honorary' ? 'กิตติมศักดิ์' : 'ศาสนา'}
            </span>
          </div>
          <span className="text-gray-400">→</span>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">{role.displayName}</span>
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
              {role.category === 'student' ? 'นักศึกษา' :
               role.category === 'faculty' ? 'อาจารย์' :
               role.category === 'staff' ? 'เจ้าหน้าที่' :
               role.category === 'admin' ? 'ผู้ดูแลระบบ' : 'บุคคลภายนอก'}
            </span>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {showResolutions && conflict.suggestions.length > 0 && (
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

      {/* Affected Assignments */}
      {conflict.affectedAssignments && conflict.affectedAssignments.length > 1 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-2">
            การกำหนดที่ได้รับผลกระทบ ({conflict.affectedAssignments.length} รายการ)
          </div>
          <div className="text-xs text-gray-600">
            มีการกำหนดคำนำหน้าชื่อหลายรายการที่เกี่ยวข้องกับข้อขัดแย้งนี้
          </div>
        </div>
      )}
    </div>
  );
};

export const AssignmentConflictDetector: React.FC<AssignmentConflictDetectorProps> = ({
  prefixes,
  roles,
  assignments,
  onResolveConflict,
  showResolutions = true
}) => {
  const conflicts = useMemo(() => {
    return detectAssignmentConflicts(prefixes, roles, assignments);
  }, [prefixes, roles, assignments]);

  const { errors, warnings, infos, summary } = useMemo(() => {
    const errors = conflicts.filter(c => c.severity === 'error');
    const warnings = conflicts.filter(c => c.severity === 'warning');
    const infos = conflicts.filter(c => c.severity === 'info');
    
    return {
      errors,
      warnings,
      infos,
      summary: {
        total: conflicts.length,
        errors: errors.length,
        warnings: warnings.length,
        infos: infos.length,
      }
    };
  }, [conflicts]);

  const prefixMap = useMemo(() => new Map(prefixes.map(p => [p.id, p])), [prefixes]);
  const roleMap = useMemo(() => new Map(roles.map(r => [r.id, r])), [roles]);

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
            ไม่พบข้อขัดแย้งในการกำหนดคำนำหน้าชื่อ
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">สรุปข้อขัดแย้งการกำหนดคำนำหน้าชื่อ</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
            <div className="text-sm text-gray-500">ทั้งหมด</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summary.errors}</div>
            <div className="text-sm text-gray-500">ข้อผิดพลาด</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.warnings}</div>
            <div className="text-sm text-gray-500">คำเตือน</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.infos}</div>
            <div className="text-sm text-gray-500">ข้อมูล</div>
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-red-800 mb-3 flex items-center">
            <XCircleIcon className="w-5 h-5 mr-2" />
            ข้อผิดพลาดที่ต้องแก้ไข ({errors.length})
          </h4>
          <div className="space-y-3">
            {errors.map((conflict) => {
              const prefix = prefixMap.get(conflict.prefixId)!;
              const role = roleMap.get(conflict.roleId)!;
              
              return (
                <ConflictCard
                  key={conflict.id}
                  conflict={conflict}
                  prefix={prefix}
                  role={role}
                  onResolve={(resolution) => onResolveConflict?.(conflict, resolution)}
                  showResolutions={showResolutions}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-yellow-800 mb-3 flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            คำเตือน ({warnings.length})
          </h4>
          <div className="space-y-3">
            {warnings.map((conflict) => {
              const prefix = prefixMap.get(conflict.prefixId)!;
              const role = roleMap.get(conflict.roleId)!;
              
              return (
                <ConflictCard
                  key={conflict.id}
                  conflict={conflict}
                  prefix={prefix}
                  role={role}
                  onResolve={(resolution) => onResolveConflict?.(conflict, resolution)}
                  showResolutions={showResolutions}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Info */}
      {infos.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-blue-800 mb-3 flex items-center">
            <InformationCircleIcon className="w-5 h-5 mr-2" />
            ข้อมูลเพิ่มเติม ({infos.length})
          </h4>
          <div className="space-y-3">
            {infos.map((conflict) => {
              const prefix = prefixMap.get(conflict.prefixId)!;
              const role = roleMap.get(conflict.roleId)!;
              
              return (
                <ConflictCard
                  key={conflict.id}
                  conflict={conflict}
                  prefix={prefix}
                  role={role}
                  onResolve={(resolution) => onResolveConflict?.(conflict, resolution)}
                  showResolutions={showResolutions}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentConflictDetector;