'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  LightBulbIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { AdminModal } from './AdminModal';

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

interface ResolutionAction {
  id: string;
  type: 'assign' | 'unassign' | 'set_default' | 'unset_default' | 'modify_assignment' | 'ignore';
  description: string;
  prefixId?: number;
  roleId?: number;
  parameters?: Record<string, any>;
  impact: 'low' | 'medium' | 'high';
  automatic: boolean;
}

interface ConflictResolutionInterfaceProps {
  conflicts: AssignmentConflict[];
  prefixes: TitlePrefix[];
  roles: Role[];
  assignments: PrefixRoleAssignment[];
  onResolveConflict: (conflict: AssignmentConflict, action: ResolutionAction) => Promise<void>;
  onResolveMultiple: (resolutions: Array<{ conflict: AssignmentConflict; action: ResolutionAction }>) => Promise<void>;
  onIgnoreConflict: (conflictId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const generateResolutionActions = (
  conflict: AssignmentConflict,
  prefixes: TitlePrefix[],
  roles: Role[],
  assignments: PrefixRoleAssignment[]
): ResolutionAction[] => {
  const actions: ResolutionAction[] = [];
  const prefix = prefixes.find(p => p.id === conflict.prefixId);
  const role = roles.find(r => r.id === conflict.roleId);
  
  if (!prefix || !role) return actions;

  switch (conflict.type) {
    case 'duplicate_default':
      // Keep first default, unset others
      if (conflict.affectedAssignments && conflict.affectedAssignments.length > 1) {
        conflict.affectedAssignments.slice(1).forEach((assignment, index) => {
          const affectedPrefix = prefixes.find(p => p.id === assignment.prefixId);
          if (affectedPrefix) {
            actions.push({
              id: `unset-default-${assignment.prefixId}-${assignment.roleId}`,
              type: 'unset_default',
              description: `ยกเลิกการเป็นค่าเริ่มต้นของ "${affectedPrefix.thai}"`,
              prefixId: assignment.prefixId,
              roleId: assignment.roleId,
              impact: 'low',
              automatic: true
            });
          }
        });
      }
      
      // Alternative: Choose a different default
      const roleAssignments = assignments.filter(a => a.roleId === conflict.roleId);
      roleAssignments.forEach(assignment => {
        const assignmentPrefix = prefixes.find(p => p.id === assignment.prefixId);
        if (assignmentPrefix && !assignment.isDefault) {
          actions.push({
            id: `set-default-${assignment.prefixId}-${assignment.roleId}`,
            type: 'set_default',
            description: `กำหนด "${assignmentPrefix.thai}" เป็นค่าเริ่มต้นแทน`,
            prefixId: assignment.prefixId,
            roleId: assignment.roleId,
            impact: 'medium',
            automatic: false
          });
        }
      });
      break;

    case 'missing_default':
      // Set the most appropriate prefix as default
      const appropriateDefaults = getAppropriateDefaults(role, prefixes, assignments);
      appropriateDefaults.forEach(prefixId => {
        const defaultPrefix = prefixes.find(p => p.id === prefixId);
        if (defaultPrefix) {
          actions.push({
            id: `set-default-${prefixId}-${role.id}`,
            type: 'set_default',
            description: `กำหนด "${defaultPrefix.thai}" เป็นค่าเริ่มต้น`,
            prefixId,
            roleId: role.id,
            impact: 'low',
            automatic: true
          });
        }
      });
      break;

    case 'inappropriate_assignment':
      // Remove inappropriate assignment
      actions.push({
        id: `unassign-${conflict.prefixId}-${conflict.roleId}`,
        type: 'unassign',
        description: `ลบการกำหนด "${prefix.thai}" ออกจาก "${role.displayName}"`,
        prefixId: conflict.prefixId,
        roleId: conflict.roleId,
        impact: 'medium',
        automatic: false
      });

      // Suggest appropriate alternatives
      const alternatives = getAppropriateAlternatives(role, prefix, prefixes);
      alternatives.forEach(altPrefixId => {
        const altPrefix = prefixes.find(p => p.id === altPrefixId);
        if (altPrefix) {
          actions.push({
            id: `assign-alt-${altPrefixId}-${role.id}`,
            type: 'assign',
            description: `เพิ่ม "${altPrefix.thai}" แทน "${prefix.thai}"`,
            prefixId: altPrefixId,
            roleId: role.id,
            impact: 'low',
            automatic: false
          });
        }
      });
      break;

    case 'category_conflict':
      // Modify assignment to be non-default
      actions.push({
        id: `modify-${conflict.prefixId}-${conflict.roleId}`,
        type: 'modify_assignment',
        description: `เก็บ "${prefix.thai}" ไว้แต่ไม่ให้เป็นค่าเริ่มต้น`,
        prefixId: conflict.prefixId,
        roleId: conflict.roleId,
        parameters: { isDefault: false },
        impact: 'low',
        automatic: false
      });

      // Remove assignment
      actions.push({
        id: `unassign-category-${conflict.prefixId}-${conflict.roleId}`,
        type: 'unassign',
        description: `ลบการกำหนด "${prefix.thai}" ออกจาก "${role.displayName}"`,
        prefixId: conflict.prefixId,
        roleId: conflict.roleId,
        impact: 'medium',
        automatic: false
      });
      break;

    case 'system_role_conflict':
      // For system roles, options are limited
      actions.push({
        id: `ignore-system-${conflict.id}`,
        type: 'ignore',
        description: `ยอมรับข้อจำกัดของบทบาทระบบ`,
        impact: 'low',
        automatic: false
      });
      break;
  }

  // Always add ignore option
  actions.push({
    id: `ignore-${conflict.id}`,
    type: 'ignore',
    description: `ละเว้นข้อขัดแย้งนี้`,
    impact: 'low',
    automatic: false
  });

  return actions;
};

const getAppropriateDefaults = (role: Role, prefixes: TitlePrefix[], assignments: PrefixRoleAssignment[]): number[] => {
  const roleAssignments = assignments.filter(a => a.roleId === role.id);
  const assignedPrefixIds = roleAssignments.map(a => a.prefixId);
  const assignedPrefixes = prefixes.filter(p => assignedPrefixIds.includes(p.id));

  switch (role.category) {
    case 'student':
      return assignedPrefixes
        .filter(p => ['นาย', 'นาง', 'นางสาว'].includes(p.thai))
        .map(p => p.id);
    case 'faculty':
      return assignedPrefixes
        .filter(p => ['อาจารย์', 'ดร.'].includes(p.thai))
        .map(p => p.id);
    case 'staff':
      return assignedPrefixes
        .filter(p => ['นาย', 'นาง', 'นางสาว', 'คุณ'].includes(p.thai))
        .map(p => p.id);
    default:
      return assignedPrefixes
        .filter(p => p.category === 'professional')
        .map(p => p.id);
  }
};

const getAppropriateAlternatives = (role: Role, currentPrefix: TitlePrefix, prefixes: TitlePrefix[]): number[] => {
  switch (role.category) {
    case 'student':
      return prefixes
        .filter(p => p.category === 'professional' && ['นาย', 'นาง', 'นางสาว'].includes(p.thai))
        .map(p => p.id);
    case 'faculty':
      return prefixes
        .filter(p => p.category === 'academic' || (p.category === 'professional' && ['ดร.'].includes(p.thai)))
        .map(p => p.id);
    case 'staff':
      return prefixes
        .filter(p => p.category === 'professional' && ['นาย', 'นาง', 'นางสาว', 'คุณ', 'ดร.'].includes(p.thai))
        .map(p => p.id);
    default:
      return prefixes
        .filter(p => p.category === 'professional')
        .map(p => p.id);
  }
};

const ResolutionActionCard: React.FC<{
  action: ResolutionAction;
  isSelected: boolean;
  onSelect: () => void;
  prefix?: TitlePrefix;
  role?: Role;
}> = ({ action, isSelected, onSelect, prefix, role }) => {
  const getActionIcon = () => {
    switch (action.type) {
      case 'assign': return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'unassign': return <XMarkIcon className="w-4 h-4 text-red-600" />;
      case 'set_default': return <CheckCircleIcon className="w-4 h-4 text-blue-600" />;
      case 'unset_default': return <XMarkIcon className="w-4 h-4 text-orange-600" />;
      case 'modify_assignment': return <WrenchScrewdriverIcon className="w-4 h-4 text-purple-600" />;
      case 'ignore': return <InformationCircleIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getImpactColor = () => {
    switch (action.impact) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
    }
  };

  const getImpactLabel = () => {
    switch (action.impact) {
      case 'low': return 'ผลกระทบต่ำ';
      case 'medium': return 'ผลกระทบปานกลาง';
      case 'high': return 'ผลกระทบสูง';
    }
  };

  return (
    <div
      className={`border rounded-lg p-3 cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 rounded-full border-2 ${
            isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
          }`}>
            {isSelected && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </div>
          {getActionIcon()}
          <span className="font-medium text-gray-900 text-sm">{action.description}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          {action.automatic && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
              อัตโนมัติ
            </span>
          )}
          <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor()}`}>
            {getImpactLabel()}
          </span>
        </div>
      </div>
    </div>
  );
};

const ConflictResolutionCard: React.FC<{
  conflict: AssignmentConflict;
  prefix: TitlePrefix;
  role: Role;
  actions: ResolutionAction[];
  selectedAction: ResolutionAction | null;
  onActionSelect: (action: ResolutionAction) => void;
}> = ({ conflict, prefix, role, actions, selectedAction, onActionSelect }) => {
  const severityColors = {
    error: 'border-red-200 bg-red-50',
    warning: 'border-yellow-200 bg-yellow-50',
    info: 'border-blue-200 bg-blue-50',
  };

  const severityIcons = {
    error: XMarkIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
  };

  const SeverityIcon = severityIcons[conflict.severity];

  return (
    <div className={`border rounded-lg p-4 ${severityColors[conflict.severity]}`}>
      <div className="flex items-start space-x-3 mb-4">
        <SeverityIcon className="w-5 h-5 text-gray-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1">{conflict.message}</h4>
          <p className="text-sm text-gray-600 mb-2">{conflict.description}</p>
          <div className="flex items-center space-x-4 text-sm">
            <span className="font-medium">{prefix.thai}</span>
            <span className="text-gray-400">→</span>
            <span className="font-medium">{role.displayName}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h5 className="text-sm font-medium text-gray-700 flex items-center">
          <LightBulbIcon className="w-4 h-4 mr-1" />
          วิธีการแก้ไข
        </h5>
        {actions.map((action) => (
          <ResolutionActionCard
            key={action.id}
            action={action}
            isSelected={selectedAction?.id === action.id}
            onSelect={() => onActionSelect(action)}
            prefix={prefix}
            role={role}
          />
        ))}
      </div>
    </div>
  );
};

export const ConflictResolutionInterface: React.FC<ConflictResolutionInterfaceProps> = ({
  conflicts,
  prefixes,
  roles,
  assignments,
  onResolveConflict,
  onResolveMultiple,
  onIgnoreConflict,
  isOpen,
  onClose
}) => {
  const [selectedActions, setSelectedActions] = useState<Map<string, ResolutionAction>>(new Map());
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedConflicts, setResolvedConflicts] = useState<Set<string>>(new Set());

  const prefixMap = useMemo(() => new Map(prefixes.map(p => [p.id, p])), [prefixes]);
  const roleMap = useMemo(() => new Map(roles.map(r => [r.id, r])), [roles]);

  // Generate resolution actions for each conflict
  const conflictActions = useMemo(() => {
    const actionsMap = new Map<string, ResolutionAction[]>();
    
    conflicts.forEach(conflict => {
      const actions = generateResolutionActions(conflict, prefixes, roles, assignments);
      actionsMap.set(conflict.id, actions);
    });
    
    return actionsMap;
  }, [conflicts, prefixes, roles, assignments]);

  const handleActionSelect = useCallback((conflictId: string, action: ResolutionAction) => {
    setSelectedActions(prev => {
      const newMap = new Map(prev);
      newMap.set(conflictId, action);
      return newMap;
    });
  }, []);

  const handleResolveAll = useCallback(async () => {
    setIsResolving(true);
    
    try {
      const resolutions = conflicts
        .filter(conflict => !resolvedConflicts.has(conflict.id))
        .map(conflict => ({
          conflict,
          action: selectedActions.get(conflict.id) || conflictActions.get(conflict.id)?.[0]!
        }))
        .filter(resolution => resolution.action);

      await onResolveMultiple(resolutions);
      
      // Mark conflicts as resolved
      const newResolvedConflicts = new Set(resolvedConflicts);
      resolutions.forEach(({ conflict }) => {
        newResolvedConflicts.add(conflict.id);
      });
      setResolvedConflicts(newResolvedConflicts);
      
    } catch (error) {
      console.error('Error resolving conflicts:', error);
    } finally {
      setIsResolving(false);
    }
  }, [conflicts, selectedActions, conflictActions, resolvedConflicts, onResolveMultiple]);

  const handleResolveSingle = useCallback(async (conflict: AssignmentConflict) => {
    const action = selectedActions.get(conflict.id) || conflictActions.get(conflict.id)?.[0];
    if (!action) return;

    setIsResolving(true);
    
    try {
      await onResolveConflict(conflict, action);
      setResolvedConflicts(prev => new Set(prev).add(conflict.id));
    } catch (error) {
      console.error('Error resolving conflict:', error);
    } finally {
      setIsResolving(false);
    }
  }, [selectedActions, conflictActions, onResolveConflict]);

  const handleAutoResolve = useCallback(async () => {
    setIsResolving(true);
    
    try {
      const autoResolutions = conflicts
        .filter(conflict => !resolvedConflicts.has(conflict.id))
        .map(conflict => {
          const actions = conflictActions.get(conflict.id) || [];
          const autoAction = actions.find(a => a.automatic);
          return autoAction ? { conflict, action: autoAction } : null;
        })
        .filter(Boolean) as Array<{ conflict: AssignmentConflict; action: ResolutionAction }>;

      if (autoResolutions.length > 0) {
        await onResolveMultiple(autoResolutions);
        
        const newResolvedConflicts = new Set(resolvedConflicts);
        autoResolutions.forEach(({ conflict }) => {
          newResolvedConflicts.add(conflict.id);
        });
        setResolvedConflicts(newResolvedConflicts);
      }
    } catch (error) {
      console.error('Error auto-resolving conflicts:', error);
    } finally {
      setIsResolving(false);
    }
  }, [conflicts, conflictActions, resolvedConflicts, onResolveMultiple]);

  const unresolvedConflicts = conflicts.filter(c => !resolvedConflicts.has(c.id));
  const canResolveAll = unresolvedConflicts.every(conflict => 
    selectedActions.has(conflict.id) || conflictActions.get(conflict.id)?.length > 0
  );

  const autoResolvableCount = unresolvedConflicts.filter(conflict => 
    conflictActions.get(conflict.id)?.some(a => a.automatic)
  ).length;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="แก้ไขข้อขัดแย้งการกำหนดคำนำหน้าชื่อ"
      size="xl"
      type="form"
    >
      <div className="space-y-6">
        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">สรุปข้อขัดแย้ง</h3>
            <div className="flex items-center space-x-2">
              {autoResolvableCount > 0 && (
                <button
                  onClick={handleAutoResolve}
                  disabled={isResolving}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-1 inline" />
                  แก้ไขอัตโนมัติ ({autoResolvableCount})
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{conflicts.length}</div>
              <div className="text-sm text-gray-500">ทั้งหมด</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{resolvedConflicts.size}</div>
              <div className="text-sm text-gray-500">แก้ไขแล้ว</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{unresolvedConflicts.length}</div>
              <div className="text-sm text-gray-500">ยังไม่แก้ไข</div>
            </div>
          </div>
        </div>

        {/* Conflicts */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {unresolvedConflicts.map((conflict) => {
            const prefix = prefixMap.get(conflict.prefixId)!;
            const role = roleMap.get(conflict.roleId)!;
            const actions = conflictActions.get(conflict.id) || [];
            const selectedAction = selectedActions.get(conflict.id);
            
            return (
              <ConflictResolutionCard
                key={conflict.id}
                conflict={conflict}
                prefix={prefix}
                role={role}
                actions={actions}
                selectedAction={selectedAction || null}
                onActionSelect={(action) => handleActionSelect(conflict.id, action)}
              />
            );
          })}
          
          {unresolvedConflicts.length === 0 && (
            <div className="text-center py-8">
              <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                แก้ไขข้อขัดแย้งเสร็จสิ้น
              </h3>
              <p className="text-gray-600">
                ข้อขัดแย้งทั้งหมดได้รับการแก้ไขแล้ว
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {unresolvedConflicts.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              เลือกวิธีการแก้ไขสำหรับข้อขัดแย้งแต่ละรายการ
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={isResolving}
                className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                ปิด
              </button>
              <button
                onClick={handleResolveAll}
                disabled={!canResolveAll || isResolving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResolving ? (
                  <>
                    <ClockIcon className="w-4 h-4 mr-2 inline animate-spin" />
                    กำลังแก้ไข...
                  </>
                ) : (
                  'แก้ไขทั้งหมด'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminModal>
  );
};

export default ConflictResolutionInterface;