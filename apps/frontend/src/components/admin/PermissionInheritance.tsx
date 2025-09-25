"use client";

import { useState, useEffect } from "react";
import { 
  ArrowDownIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Role, Permission, RolePermission, PermissionConflict } from "@/types/admin";

interface PermissionInheritanceProps {
  role: Role;
  parentRoles: Role[];
  permissions: Permission[];
  onPermissionOverride?: (permission: string, enabled: boolean) => void;
  className?: string;
}

interface InheritedPermission {
  permission: Permission;
  granted: boolean;
  source: 'direct' | 'inherited';
  inheritedFrom?: Role;
  canOverride: boolean;
  hasConflict: boolean;
  conflicts: PermissionConflict[];
}

export const PermissionInheritance = ({
  role,
  parentRoles,
  permissions,
  onPermissionOverride,
  className = "",
}: PermissionInheritanceProps) => {
  const [inheritedPermissions, setInheritedPermissions] = useState<InheritedPermission[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Calculate inherited permissions
  useEffect(() => {
    const calculateInheritance = (): InheritedPermission[] => {
      const result: InheritedPermission[] = [];
      
      permissions.forEach(permission => {
        // Check direct permission
        const directPermission = role.permissions?.find(
          rp => rp.permission === permission.id
        );

        // Check inherited permissions from parent roles
        let inheritedFrom: Role | undefined;
        let inheritedGranted = false;

        for (const parentRole of parentRoles) {
          const parentPermission = parentRole.permissions?.find(
            rp => rp.permission === permission.id && rp.granted
          );
          if (parentPermission) {
            inheritedFrom = parentRole;
            inheritedGranted = true;
            break;
          }
        }

        // Determine final state
        const isDirectlyGranted = directPermission?.granted || false;
        const isInherited = !directPermission && inheritedGranted;
        const finalGranted = isDirectlyGranted || isInherited;

        // Check for conflicts
        const conflicts: PermissionConflict[] = [];
        
        // Check dependency conflicts
        if (finalGranted) {
          permission.dependencies.forEach(depId => {
            const depPermission = permissions.find(p => p.id === depId);
            if (depPermission) {
              const depInherited = result.find(ip => ip.permission.id === depId);
              if (depInherited && !depInherited.granted) {
                conflicts.push({
                  type: 'dependency',
                  roleId: role.id,
                  moduleId: 0, // Will be set properly when modules are implemented
                  permission: permission.id,
                  conflictsWith: {
                    roleId: role.id,
                    moduleId: 0,
                    permission: depId,
                  },
                  severity: 'error',
                  message: `Permission "${permission.displayName}" requires "${depPermission.displayName}"`,
                });
              }
            }
          });
        }

        // Check exclusion conflicts
        if (finalGranted) {
          permission.exclusions.forEach(exclId => {
            const exclPermission = permissions.find(p => p.id === exclId);
            if (exclPermission) {
              const exclInherited = result.find(ip => ip.permission.id === exclId);
              if (exclInherited && exclInherited.granted) {
                conflicts.push({
                  type: 'exclusion',
                  roleId: role.id,
                  moduleId: 0,
                  permission: permission.id,
                  conflictsWith: {
                    roleId: role.id,
                    moduleId: 0,
                    permission: exclId,
                  },
                  severity: 'warning',
                  message: `Permission "${permission.displayName}" conflicts with "${exclPermission.displayName}"`,
                });
              }
            }
          });
        }

        result.push({
          permission,
          granted: finalGranted,
          source: directPermission ? 'direct' : 'inherited',
          inheritedFrom,
          canOverride: isInherited || isDirectlyGranted,
          hasConflict: conflicts.length > 0,
          conflicts,
        });
      });

      return result;
    };

    setInheritedPermissions(calculateInheritance());
  }, [role, parentRoles, permissions]);

  // Get unique categories
  const categories = ['all', ...new Set(permissions.map(p => p.category))];

  // Filter permissions by category
  const filteredPermissions = selectedCategory === 'all' 
    ? inheritedPermissions 
    : inheritedPermissions.filter(ip => ip.permission.category === selectedCategory);

  const handlePermissionToggle = (permission: string, enabled: boolean) => {
    if (onPermissionOverride) {
      onPermissionOverride(permission, enabled);
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Permission Inheritance</h3>
            <p className="mt-1 text-sm text-gray-600">
              Role: <span className="font-medium">{role.displayName}</span>
            </p>
          </div>
          
          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
              Category:
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border-gray-300 text-sm focus:border-red-500 focus:ring-red-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Parent Roles Info */}
      {parentRoles.length > 0 && (
        <div className="px-6 py-3 bg-blue-50 border-b border-gray-200">
          <div className="flex items-center">
            <InformationCircleIcon className="w-5 h-5 text-blue-500 mr-2" />
            <span className="text-sm text-blue-800">
              Inheriting from: {parentRoles.map(pr => pr.displayName).join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Permissions List */}
      <div className="divide-y divide-gray-200">
        {filteredPermissions.map((inheritedPermission) => (
          <div key={inheritedPermission.permission.id} className="px-6 py-4">
            <div className="flex items-start justify-between">
              {/* Permission Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <h4 className="text-sm font-medium text-gray-900">
                    {inheritedPermission.permission.displayName}
                  </h4>
                  
                  {/* Status Badge */}
                  <span className={`ml-2 inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                    inheritedPermission.granted
                      ? inheritedPermission.source === 'direct'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {inheritedPermission.granted
                      ? inheritedPermission.source === 'direct' ? 'Direct' : 'Inherited'
                      : 'Not Granted'
                    }
                  </span>

                  {/* Level Badge */}
                  <span className={`ml-2 inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                    inheritedPermission.permission.level === 'admin' ? 'bg-red-100 text-red-800' :
                    inheritedPermission.permission.level === 'write' ? 'bg-yellow-100 text-yellow-800' :
                    inheritedPermission.permission.level === 'read' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {inheritedPermission.permission.level}
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-600">
                  {inheritedPermission.permission.description}
                </p>

                {/* Inheritance Info */}
                {inheritedPermission.source === 'inherited' && inheritedPermission.inheritedFrom && (
                  <div className="mt-2 flex items-center text-sm text-blue-600">
                    <ArrowDownIcon className="w-4 h-4 mr-1" />
                    <span>Inherited from {inheritedPermission.inheritedFrom.displayName}</span>
                  </div>
                )}

                {/* Dependencies */}
                {inheritedPermission.permission.dependencies.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">
                      Requires: {inheritedPermission.permission.dependencies.map(depId => {
                        const dep = permissions.find(p => p.id === depId);
                        return dep?.displayName || depId;
                      }).join(', ')}
                    </span>
                  </div>
                )}

                {/* Conflicts */}
                {inheritedPermission.hasConflict && (
                  <div className="mt-2 space-y-1">
                    {inheritedPermission.conflicts.map((conflict, index) => (
                      <div key={index} className={`flex items-center text-sm ${
                        conflict.severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {conflict.severity === 'error' ? (
                          <XCircleIcon className="w-4 h-4 mr-1" />
                        ) : (
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        )}
                        <span>{conflict.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Permission Toggle */}
              <div className="flex-shrink-0 ml-4">
                {inheritedPermission.canOverride && onPermissionOverride ? (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={inheritedPermission.granted}
                      onChange={(e) => handlePermissionToggle(
                        inheritedPermission.permission.id, 
                        e.target.checked
                      )}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {inheritedPermission.source === 'inherited' ? 'Override' : 'Grant'}
                    </span>
                  </label>
                ) : (
                  <div className="flex items-center">
                    {inheritedPermission.granted ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>
              {filteredPermissions.filter(ip => ip.granted).length} of {filteredPermissions.length} permissions granted
            </span>
            <span>
              {filteredPermissions.filter(ip => ip.source === 'inherited').length} inherited
            </span>
            <span>
              {filteredPermissions.filter(ip => ip.hasConflict).length} conflicts
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-2"></div>
              <span>Direct</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-2"></div>
              <span>Inherited</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};