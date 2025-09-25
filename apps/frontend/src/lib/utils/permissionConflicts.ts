// Permission conflict detection utilities
import { Role, SystemModule, Permission, PermissionConflict, RolePermission } from '@/types/admin';

export class PermissionConflictDetector {
  private roles: Role[];
  private modules: SystemModule[];
  private permissions: Permission[];

  constructor(roles: Role[], modules: SystemModule[], permissions: Permission[]) {
    this.roles = roles;
    this.modules = modules;
    this.permissions = permissions;
  }

  /**
   * Detect all conflicts in the current permission matrix
   */
  detectAllConflicts(): PermissionConflict[] {
    const conflicts: PermissionConflict[] = [];

    this.roles.forEach(role => {
      role.permissions.forEach(rolePermission => {
        if (rolePermission.granted) {
          const permissionConflicts = this.detectPermissionConflicts(role, rolePermission);
          conflicts.push(...permissionConflicts);
        }
      });
    });

    return this.deduplicateConflicts(conflicts);
  }

  /**
   * Detect conflicts for a specific permission change
   */
  detectConflictsForChange(
    roleId: number, 
    moduleId: number, 
    permission: string, 
    enabled: boolean
  ): PermissionConflict[] {
    if (!enabled) {
      // If disabling permission, check for dependency violations
      return this.detectDependencyViolations(roleId, moduleId, permission);
    } else {
      // If enabling permission, check for various conflicts
      const role = this.roles.find(r => r.id === roleId);
      if (!role) return [];

      const rolePermission: RolePermission = {
        roleId,
        moduleId,
        permission,
        granted: true
      };

      return this.detectPermissionConflicts(role, rolePermission);
    }
  }

  /**
   * Detect conflicts for a specific role permission
   */
  private detectPermissionConflicts(role: Role, rolePermission: RolePermission): PermissionConflict[] {
    const conflicts: PermissionConflict[] = [];

    // Check dependency conflicts
    conflicts.push(...this.checkDependencyConflicts(role, rolePermission));

    // Check exclusion conflicts
    conflicts.push(...this.checkExclusionConflicts(role, rolePermission));

    // Check hierarchy conflicts
    conflicts.push(...this.checkHierarchyConflicts(role, rolePermission));

    // Check module dependency conflicts
    conflicts.push(...this.checkModuleDependencyConflicts(role, rolePermission));

    return conflicts;
  }

  /**
   * Check if permission dependencies are satisfied
   */
  private checkDependencyConflicts(role: Role, rolePermission: RolePermission): PermissionConflict[] {
    const conflicts: PermissionConflict[] = [];
    const permission = this.permissions.find(p => p.name === rolePermission.permission);
    
    if (!permission || !permission.dependencies.length) return conflicts;

    permission.dependencies.forEach(dependencyName => {
      const hasDependency = role.permissions.some(rp => 
        rp.moduleId === rolePermission.moduleId && 
        rp.permission === dependencyName && 
        rp.granted
      );

      if (!hasDependency) {
        conflicts.push({
          type: 'dependency',
          roleId: role.id,
          moduleId: rolePermission.moduleId,
          permission: rolePermission.permission,
          conflictsWith: {
            roleId: role.id,
            moduleId: rolePermission.moduleId,
            permission: dependencyName
          },
          severity: 'error',
          message: `Permission '${permission.displayName}' requires '${this.getPermissionDisplayName(dependencyName)}' to be granted first`
        });
      }
    });

    return conflicts;
  }

  /**
   * Check if permission exclusions are violated
   */
  private checkExclusionConflicts(role: Role, rolePermission: RolePermission): PermissionConflict[] {
    const conflicts: PermissionConflict[] = [];
    const permission = this.permissions.find(p => p.name === rolePermission.permission);
    
    if (!permission || !permission.exclusions.length) return conflicts;

    permission.exclusions.forEach(exclusionName => {
      const hasExclusion = role.permissions.some(rp => 
        rp.moduleId === rolePermission.moduleId && 
        rp.permission === exclusionName && 
        rp.granted
      );

      if (hasExclusion) {
        conflicts.push({
          type: 'exclusion',
          roleId: role.id,
          moduleId: rolePermission.moduleId,
          permission: rolePermission.permission,
          conflictsWith: {
            roleId: role.id,
            moduleId: rolePermission.moduleId,
            permission: exclusionName
          },
          severity: 'error',
          message: `Permission '${permission.displayName}' cannot be granted together with '${this.getPermissionDisplayName(exclusionName)}'`
        });
      }
    });

    return conflicts;
  }

  /**
   * Check hierarchy conflicts (e.g., admin level permissions)
   */
  private checkHierarchyConflicts(role: Role, rolePermission: RolePermission): PermissionConflict[] {
    const conflicts: PermissionConflict[] = [];
    const permission = this.permissions.find(p => p.name === rolePermission.permission);
    
    if (!permission) return conflicts;

    // Check if role should have admin-level permissions
    if (permission.level === 'admin' && !role.isSystem) {
      conflicts.push({
        type: 'hierarchy',
        roleId: role.id,
        moduleId: rolePermission.moduleId,
        permission: rolePermission.permission,
        conflictsWith: {
          roleId: role.id,
          moduleId: rolePermission.moduleId,
          permission: rolePermission.permission
        },
        severity: 'warning',
        message: `Admin-level permission '${permission.displayName}' is typically reserved for system roles`
      });
    }

    // Check for delete permissions without proper role level
    if (permission.level === 'delete' && role.name === 'student') {
      conflicts.push({
        type: 'hierarchy',
        roleId: role.id,
        moduleId: rolePermission.moduleId,
        permission: rolePermission.permission,
        conflictsWith: {
          roleId: role.id,
          moduleId: rolePermission.moduleId,
          permission: rolePermission.permission
        },
        severity: 'warning',
        message: `Delete permission '${permission.displayName}' may not be appropriate for student roles`
      });
    }

    return conflicts;
  }

  /**
   * Check module dependency conflicts
   */
  private checkModuleDependencyConflicts(role: Role, rolePermission: RolePermission): PermissionConflict[] {
    const conflicts: PermissionConflict[] = [];
    const module = this.modules.find(m => m.id === rolePermission.moduleId);
    
    if (!module || !module.dependencies.length) return conflicts;

    module.dependencies.forEach(dependencyModuleId => {
      const hasDependencyAccess = role.permissions.some(rp => 
        rp.moduleId === dependencyModuleId && 
        rp.permission === 'read' && 
        rp.granted
      );

      if (!hasDependencyAccess) {
        const dependencyModule = this.modules.find(m => m.id === dependencyModuleId);
        conflicts.push({
          type: 'dependency',
          roleId: role.id,
          moduleId: rolePermission.moduleId,
          permission: rolePermission.permission,
          conflictsWith: {
            roleId: role.id,
            moduleId: dependencyModuleId,
            permission: 'read'
          },
          severity: 'warning',
          message: `Access to '${module.displayName}' typically requires read access to '${dependencyModule?.displayName || 'dependency module'}'`
        });
      }
    });

    return conflicts;
  }

  /**
   * Detect dependency violations when disabling a permission
   */
  private detectDependencyViolations(
    roleId: number, 
    moduleId: number, 
    permission: string
  ): PermissionConflict[] {
    const conflicts: PermissionConflict[] = [];
    const role = this.roles.find(r => r.id === roleId);
    
    if (!role) return conflicts;

    // Find permissions that depend on this one
    const dependentPermissions = this.permissions.filter(p => 
      p.dependencies.includes(permission)
    );

    dependentPermissions.forEach(dependentPermission => {
      const hasDependent = role.permissions.some(rp => 
        rp.moduleId === moduleId && 
        rp.permission === dependentPermission.name && 
        rp.granted
      );

      if (hasDependent) {
        conflicts.push({
          type: 'dependency',
          roleId,
          moduleId,
          permission,
          conflictsWith: {
            roleId,
            moduleId,
            permission: dependentPermission.name
          },
          severity: 'error',
          message: `Cannot remove '${this.getPermissionDisplayName(permission)}' because '${dependentPermission.displayName}' depends on it`
        });
      }
    });

    return conflicts;
  }

  /**
   * Remove duplicate conflicts
   */
  private deduplicateConflicts(conflicts: PermissionConflict[]): PermissionConflict[] {
    const seen = new Set<string>();
    return conflicts.filter(conflict => {
      const key = `${conflict.roleId}-${conflict.moduleId}-${conflict.permission}-${conflict.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Get display name for a permission
   */
  private getPermissionDisplayName(permissionName: string): string {
    const permission = this.permissions.find(p => p.name === permissionName);
    return permission?.displayName || permissionName;
  }

  /**
   * Get conflict resolution suggestions
   */
  getConflictResolutions(conflict: PermissionConflict): string[] {
    const suggestions: string[] = [];

    switch (conflict.type) {
      case 'dependency':
        if (conflict.conflictsWith.permission) {
          suggestions.push(`Grant '${this.getPermissionDisplayName(conflict.conflictsWith.permission)}' permission first`);
          suggestions.push(`Remove '${this.getPermissionDisplayName(conflict.permission)}' permission`);
        }
        break;

      case 'exclusion':
        suggestions.push(`Remove '${this.getPermissionDisplayName(conflict.conflictsWith.permission)}' permission`);
        suggestions.push(`Remove '${this.getPermissionDisplayName(conflict.permission)}' permission`);
        break;

      case 'hierarchy':
        suggestions.push('Consider using a different role with appropriate permissions');
        suggestions.push('Review if this permission level is necessary for this role');
        break;
    }

    return suggestions;
  }
}