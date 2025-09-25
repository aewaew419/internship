// Admin system type definitions for role management, calendar, and prefix management

export interface Role {
  id: number;
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  permissions: RolePermission[];
  createdAt: string;
  updatedAt: string;
}

export interface SystemModule {
  id: number;
  name: string;
  displayName: string;
  description: string;
  category: 'core' | 'academic' | 'administrative' | 'reporting';
  availablePermissions: string[];
  dependencies: number[];
}

export interface Permission {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  dependencies: string[];
  exclusions: string[];
  level: 'read' | 'write' | 'delete' | 'admin';
}

export interface RolePermission {
  roleId: number;
  moduleId: number;
  permission: string;
  granted: boolean;
  inheritedFrom?: number;
  conflicts?: PermissionConflict[];
}

export interface PermissionConflict {
  type: 'dependency' | 'exclusion' | 'hierarchy';
  roleId: number;
  moduleId: number;
  permission: string;
  conflictsWith: {
    roleId: number;
    moduleId: number;
    permission: string;
  };
  severity: 'warning' | 'error';
  message: string;
}

// Matrix state management
export interface MatrixState {
  permissions: Map<string, boolean>; // key: `${roleId}-${moduleId}-${permission}`
  conflicts: PermissionConflict[];
  pendingChanges: PendingChange[];
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
}

export interface PendingChange {
  roleId: number;
  moduleId: number;
  permission: string;
  oldValue: boolean;
  newValue: boolean;
  timestamp: Date;
}

// Role Editor interfaces
export interface RoleEditorProps {
  role?: Role;
  isOpen: boolean;
  onClose: () => void;
  onSave: (role: CreateRoleDTO | UpdateRoleDTO) => Promise<void>;
  isSubmitting?: boolean;
  validationErrors?: Record<string, string>;
}

export interface CreateRoleDTO {
  name: string;
  displayName: string;
  description: string;
  parentRoleId?: number;
}

export interface UpdateRoleDTO extends CreateRoleDTO {
  id: number;
}

export interface RoleHierarchy {
  id: number;
  name: string;
  displayName: string;
  children: RoleHierarchy[];
  level: number;
  parentId?: number;
}

export interface RoleFormState {
  name: string;
  displayName: string;
  description: string;
  parentRoleId?: number;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
}

// Component props interfaces
export interface RoleManagementMatrixProps {
  roles: Role[];
  modules: SystemModule[];
  permissions: Permission[];
  onPermissionChange: (roleId: number, moduleId: number, permission: string, enabled: boolean) => Promise<void>;
  onSaveChanges: () => Promise<void>;
  autoSave?: boolean;
}