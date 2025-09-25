'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Role, 
  SystemModule, 
  Permission, 
  RoleManagementMatrixProps, 
  MatrixState, 
  PendingChange,
  PermissionConflict 
} from '@/types/admin';
import { PermissionConflictDetector } from '@/lib/utils/permissionConflicts';
import { useAutoSave } from '@/hooks/useAutoSave';

const RoleManagementMatrix: React.FC<RoleManagementMatrixProps> = ({
  roles,
  modules,
  permissions,
  onPermissionChange,
  onSaveChanges,
  autoSave = true
}) => {
  const [matrixState, setMatrixState] = useState<MatrixState>({
    permissions: new Map(),
    conflicts: [],
    pendingChanges: [],
    isLoading: false,
    isSaving: false,
    lastSaved: null
  });

  // Initialize conflict detector
  const conflictDetector = useMemo(() => 
    new PermissionConflictDetector(roles, modules, permissions), 
    [roles, modules, permissions]
  );

  // Auto-save functionality
  const autoSaveState = useAutoSave({
    enabled: autoSave,
    debounceMs: 1000, // 1 second debounce
    onSave: onSaveChanges,
    onError: (error) => {
      console.error('Auto-save failed:', error);
    }
  });

  // Initialize permission map from role permissions and detect conflicts
  useEffect(() => {
    const permissionMap = new Map<string, boolean>();
    
    roles.forEach(role => {
      role.permissions.forEach(rolePermission => {
        const key = `${rolePermission.roleId}-${rolePermission.moduleId}-${rolePermission.permission}`;
        permissionMap.set(key, rolePermission.granted);
      });
    });

    // Detect all conflicts
    const conflicts = conflictDetector.detectAllConflicts();

    setMatrixState(prev => ({
      ...prev,
      permissions: permissionMap,
      conflicts,
      isLoading: false,
      isSaving: autoSaveState.isSaving,
      lastSaved: autoSaveState.lastSaved
    }));
  }, [roles, conflictDetector, autoSaveState.isSaving, autoSaveState.lastSaved]);

  // Get permission state for a specific role, module, and permission
  const getPermissionState = useCallback((roleId: number, moduleId: number, permission: string): boolean => {
    const key = `${roleId}-${moduleId}-${permission}`;
    return matrixState.permissions.get(key) || false;
  }, [matrixState.permissions]);

  // Check if there are conflicts for a specific permission
  const hasConflict = useCallback((roleId: number, moduleId: number, permission: string): PermissionConflict | null => {
    return matrixState.conflicts.find(conflict => 
      conflict.roleId === roleId && 
      conflict.moduleId === moduleId && 
      conflict.permission === permission
    ) || null;
  }, [matrixState.conflicts]);

  // Handle permission toggle
  const handlePermissionToggle = useCallback(async (
    roleId: number, 
    moduleId: number, 
    permission: string, 
    currentValue: boolean
  ) => {
    const newValue = !currentValue;
    const key = `${roleId}-${moduleId}-${permission}`;

    // Check for conflicts before making the change
    const changeConflicts = conflictDetector.detectConflictsForChange(
      roleId, moduleId, permission, newValue
    );

    // If there are error-level conflicts, show warning and potentially block
    const errorConflicts = changeConflicts.filter(c => c.severity === 'error');
    if (errorConflicts.length > 0) {
      console.warn('Permission change blocked due to conflicts:', errorConflicts);
      // You could show a modal here asking for confirmation
    }

    // Update local state immediately for responsive UI
    setMatrixState(prev => {
      const newPermissions = new Map(prev.permissions);
      newPermissions.set(key, newValue);

      const pendingChange: PendingChange = {
        roleId,
        moduleId,
        permission,
        oldValue: currentValue,
        newValue,
        timestamp: new Date()
      };

      // Recalculate conflicts with the new permission state
      const updatedRoles = roles.map(role => {
        if (role.id === roleId) {
          const existingPermissionIndex = role.permissions.findIndex(
            p => p.moduleId === moduleId && p.permission === permission
          );
          
          let updatedPermissions = [...role.permissions];
          if (existingPermissionIndex >= 0) {
            updatedPermissions[existingPermissionIndex] = {
              ...updatedPermissions[existingPermissionIndex],
              granted: newValue
            };
          } else {
            updatedPermissions.push({ roleId, moduleId, permission, granted: newValue });
          }
          
          return { ...role, permissions: updatedPermissions };
        }
        return role;
      });

      const updatedDetector = new PermissionConflictDetector(updatedRoles, modules, permissions);
      const newConflicts = updatedDetector.detectAllConflicts();

      return {
        ...prev,
        permissions: newPermissions,
        pendingChanges: [...prev.pendingChanges, pendingChange],
        conflicts: newConflicts
      };
    });

    try {
      // Call the parent handler
      await onPermissionChange(roleId, moduleId, permission, newValue);
      
      // Trigger auto-save if enabled
      if (autoSave) {
        autoSaveState.triggerSave();
      }
    } catch (error) {
      // Revert on error
      setMatrixState(prev => {
        const revertedPermissions = new Map(prev.permissions);
        revertedPermissions.set(key, currentValue);
        
        // Recalculate conflicts after revert
        const revertedConflicts = conflictDetector.detectAllConflicts();
        
        return {
          ...prev,
          permissions: revertedPermissions,
          pendingChanges: prev.pendingChanges.filter(change => 
            !(change.roleId === roleId && change.moduleId === moduleId && change.permission === permission)
          ),
          conflicts: revertedConflicts
        };
      });
      
      console.error('Failed to update permission:', error);
    }
  }, [onPermissionChange, autoSave, conflictDetector, roles, modules, permissions]);

  // Handle manual save
  const handleSave = useCallback(async () => {
    if (matrixState.pendingChanges.length === 0 && !autoSaveState.hasUnsavedChanges) return;

    try {
      await autoSaveState.saveNow();
      setMatrixState(prev => ({
        ...prev,
        pendingChanges: []
      }));
    } catch (error) {
      console.error('Failed to save changes:', error);
    }
  }, [matrixState.pendingChanges, autoSaveState]);

  // Handle revert changes
  const handleRevertChanges = useCallback(() => {
    // Revert all pending changes
    const revertedPermissions = new Map(matrixState.permissions);
    
    matrixState.pendingChanges.forEach(change => {
      const key = `${change.roleId}-${change.moduleId}-${change.permission}`;
      revertedPermissions.set(key, change.oldValue);
    });

    // Recalculate conflicts after revert
    const revertedConflicts = conflictDetector.detectAllConflicts();

    setMatrixState(prev => ({
      ...prev,
      permissions: revertedPermissions,
      pendingChanges: [],
      conflicts: revertedConflicts
    }));

    // Clear auto-save state
    autoSaveState.markAsSaved();
  }, [matrixState.permissions, matrixState.pendingChanges, conflictDetector, autoSaveState]);

  // Get available permissions for a module
  const getModulePermissions = useCallback((moduleId: number): string[] => {
    const module = modules.find(m => m.id === moduleId);
    return module?.availablePermissions || [];
  }, [modules]);

  // Render permission cell
  const renderPermissionCell = useCallback((
    role: Role, 
    module: SystemModule, 
    permission: string
  ) => {
    const isGranted = getPermissionState(role.id, module.id, permission);
    const conflict = hasConflict(role.id, module.id, permission);
    const isSystemRole = role.isSystem;
    
    return (
      <td 
        key={`${role.id}-${module.id}-${permission}`}
        className="p-2 text-center border border-gray-200"
      >
        <div className="relative">
          <input
            type="checkbox"
            checked={isGranted}
            disabled={isSystemRole}
            onChange={() => handlePermissionToggle(role.id, module.id, permission, isGranted)}
            className={`
              w-4 h-4 rounded border-2 cursor-pointer
              ${isSystemRole ? 'cursor-not-allowed opacity-50' : ''}
              ${conflict?.severity === 'error' ? 'border-red-500 bg-red-100' : ''}
              ${conflict?.severity === 'warning' ? 'border-yellow-500 bg-yellow-100' : ''}
              ${!conflict ? 'border-gray-300' : ''}
              ${isGranted && !conflict ? 'bg-green-500 border-green-500' : ''}
            `}
          />
          
          {/* Conflict indicator */}
          {conflict && (
            <div 
              className={`
                absolute -top-1 -right-1 w-3 h-3 rounded-full text-xs flex items-center justify-center text-white
                ${conflict.severity === 'error' ? 'bg-red-500' : 'bg-yellow-500'}
              `}
              title={conflict.message}
            >
              !
            </div>
          )}
          
          {/* Inheritance indicator */}
          {isGranted && role.permissions.find(p => 
            p.roleId === role.id && 
            p.moduleId === module.id && 
            p.permission === permission && 
            p.inheritedFrom
          ) && (
            <div 
              className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-400 rounded-full"
              title="Inherited permission"
            />
          )}
        </div>
      </td>
    );
  }, [getPermissionState, hasConflict, handlePermissionToggle]);

  // Group permissions by category for better organization
  const permissionsByCategory = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};
    permissions.forEach(permission => {
      if (!grouped[permission.category]) {
        grouped[permission.category] = [];
      }
      grouped[permission.category].push(permission);
    });
    return grouped;
  }, [permissions]);  re
turn (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Permission Matrix</h2>
          <p className="text-gray-600 mt-1">
            Manage role permissions across system modules
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Auto-save status indicator */}
          {autoSave && (
            <div className="flex items-center space-x-2">
              {autoSaveState.isSaving && (
                <div className="flex items-center text-sm text-blue-600">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </div>
              )}
              
              {autoSaveState.hasUnsavedChanges && !autoSaveState.isSaving && (
                <div className="flex items-center text-sm text-yellow-600">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  Unsaved changes
                </div>
              )}
              
              {!autoSaveState.hasUnsavedChanges && !autoSaveState.isSaving && autoSaveState.lastSaved && (
                <div className="flex items-center text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  All changes saved
                </div>
              )}
            </div>
          )}
          
          {/* Manual save status */}
          {!autoSave && (
            <>
              {matrixState.pendingChanges.length > 0 && (
                <span className="text-sm text-yellow-600">
                  {matrixState.pendingChanges.length} unsaved changes
                </span>
              )}
            </>
          )}
          
          {/* Last saved timestamp */}
          {(autoSaveState.lastSaved || matrixState.lastSaved) && (
            <span className="text-sm text-gray-500">
              Last saved: {(autoSaveState.lastSaved || matrixState.lastSaved)?.toLocaleTimeString()}
            </span>
          )}
          
          {/* Save error indicator */}
          {autoSaveState.saveError && (
            <div className="flex items-center text-sm text-red-600">
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs">!</span>
              </div>
              Save failed
              <button
                onClick={autoSaveState.clearError}
                className="ml-2 text-xs underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          )}
          
          {/* Manual save button */}
          {!autoSave && (
            <button
              onClick={handleSave}
              disabled={autoSaveState.isSaving || (matrixState.pendingChanges.length === 0 && !autoSaveState.hasUnsavedChanges)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {autoSaveState.isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
          
          {/* Force save button for auto-save mode */}
          {autoSave && (autoSaveState.hasUnsavedChanges || autoSaveState.saveError) && (
            <button
              onClick={handleSave}
              disabled={autoSaveState.isSaving}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {autoSaveState.isSaving ? 'Saving...' : 'Save Now'}
            </button>
          )}
          
          {/* Revert changes button */}
          {(matrixState.pendingChanges.length > 0 || autoSaveState.hasUnsavedChanges) && (
            <button
              onClick={handleRevertChanges}
              disabled={autoSaveState.isSaving}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 border border-red-300 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Revert Changes
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <h4 className="font-medium text-gray-900 mb-2">Legend:</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span>Granted</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-gray-300 rounded mr-2"></div>
            <span>Not Granted</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded mr-2"></div>
            <span>Error Conflict</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-500 rounded mr-2"></div>
            <span>Warning Conflict</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
            <span>Inherited</span>
          </div>
        </div>
      </div>     
 {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-left border border-gray-300 font-medium">
                Module / Permission
              </th>
              {roles.map(role => (
                <th 
                  key={role.id} 
                  className="p-3 text-center border border-gray-300 font-medium min-w-[120px]"
                >
                  <div>
                    <div className="font-semibold">{role.displayName}</div>
                    <div className="text-xs text-gray-500 mt-1">{role.name}</div>
                    {role.isSystem && (
                      <div className="text-xs text-blue-600 mt-1">System Role</div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map(module => {
              const modulePermissions = getModulePermissions(module.id);
              
              return (
                <React.Fragment key={module.id}>
                  {/* Module header row */}
                  <tr className="bg-blue-50">
                    <td 
                      colSpan={roles.length + 1} 
                      className="p-3 font-semibold text-blue-900 border border-gray-300"
                    >
                      {module.displayName} ({module.category})
                      <span className="text-sm font-normal text-blue-700 ml-2">
                        {module.description}
                      </span>
                    </td>
                  </tr>
                  
                  {/* Permission rows for this module */}
                  {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => {
                    const modulePermissionsInCategory = categoryPermissions.filter(p => 
                      modulePermissions.includes(p.name)
                    );
                    
                    if (modulePermissionsInCategory.length === 0) return null;
                    
                    return modulePermissionsInCategory.map(permission => (
                      <tr key={`${module.id}-${permission.id}`} className="hover:bg-gray-50">
                        <td className="p-3 border border-gray-300">
                          <div>
                            <div className="font-medium">{permission.displayName}</div>
                            <div className="text-sm text-gray-600">{permission.description}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Level: {permission.level} | Category: {permission.category}
                            </div>
                          </div>
                        </td>
                        {roles.map(role => renderPermissionCell(role, module, permission.name))}
                      </tr>
                    ));
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>   
   {/* Conflicts Summary */}
      {matrixState.conflicts.length > 0 && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 className="font-medium text-red-900 mb-2">
            Permission Conflicts ({matrixState.conflicts.length})
          </h4>
          <div className="space-y-2">
            {matrixState.conflicts.slice(0, 5).map((conflict, index) => (
              <div key={index} className="text-sm text-red-800">
                <span className="font-medium">
                  {roles.find(r => r.id === conflict.roleId)?.displayName} - 
                  {modules.find(m => m.id === conflict.moduleId)?.displayName}:
                </span>
                <span className="ml-2">{conflict.message}</span>
              </div>
            ))}
            {matrixState.conflicts.length > 5 && (
              <div className="text-sm text-red-600">
                ... and {matrixState.conflicts.length - 5} more conflicts
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagementMatrix;