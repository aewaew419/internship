// Mock data for admin components testing
import { Role, SystemModule, Permission } from '@/types/admin';

export const mockRoles: Role[] = [
  {
    id: 1,
    name: 'super_admin',
    displayName: 'Super Administrator',
    description: 'Full system access with all permissions',
    isSystem: true,
    permissions: [
      { roleId: 1, moduleId: 1, permission: 'read', granted: true },
      { roleId: 1, moduleId: 1, permission: 'write', granted: true },
      { roleId: 1, moduleId: 1, permission: 'delete', granted: true },
      { roleId: 1, moduleId: 2, permission: 'read', granted: true },
      { roleId: 1, moduleId: 2, permission: 'write', granted: true },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'admin',
    displayName: 'Administrator',
    description: 'Administrative access with limited permissions',
    isSystem: false,
    permissions: [
      { roleId: 2, moduleId: 1, permission: 'read', granted: true },
      { roleId: 2, moduleId: 1, permission: 'write', granted: true },
      { roleId: 2, moduleId: 2, permission: 'read', granted: true },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    name: 'instructor',
    displayName: 'Instructor',
    description: 'Teaching staff with academic module access',
    isSystem: false,
    permissions: [
      { roleId: 3, moduleId: 2, permission: 'read', granted: true },
      { roleId: 3, moduleId: 2, permission: 'write', granted: true },
      { roleId: 3, moduleId: 3, permission: 'read', granted: true },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 4,
    name: 'student',
    displayName: 'Student',
    description: 'Student access with read-only permissions',
    isSystem: false,
    permissions: [
      { roleId: 4, moduleId: 2, permission: 'read', granted: true },
      { roleId: 4, moduleId: 3, permission: 'read', granted: true },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

export const mockModules: SystemModule[] = [
  {
    id: 1,
    name: 'user_management',
    displayName: 'User Management',
    description: 'Manage users, roles, and permissions',
    category: 'core',
    availablePermissions: ['read', 'write', 'delete', 'admin'],
    dependencies: []
  },
  {
    id: 2,
    name: 'academic_management',
    displayName: 'Academic Management',
    description: 'Manage courses, semesters, and academic data',
    category: 'academic',
    availablePermissions: ['read', 'write', 'delete'],
    dependencies: []
  },
  {
    id: 3,
    name: 'document_management',
    displayName: 'Document Management',
    description: 'Manage documents and file uploads',
    category: 'administrative',
    availablePermissions: ['read', 'write', 'delete'],
    dependencies: []
  },
  {
    id: 4,
    name: 'reporting',
    displayName: 'Reporting System',
    description: 'Generate and view system reports',
    category: 'reporting',
    availablePermissions: ['read', 'write'],
    dependencies: [1, 2]
  }
];

export const mockPermissions: Permission[] = [
  {
    id: 'read',
    name: 'read',
    displayName: 'Read Access',
    description: 'View and read data',
    category: 'basic',
    dependencies: [],
    exclusions: [],
    level: 'read'
  },
  {
    id: 'write',
    name: 'write',
    displayName: 'Write Access',
    description: 'Create and modify data',
    category: 'basic',
    dependencies: ['read'],
    exclusions: [],
    level: 'write'
  },
  {
    id: 'delete',
    name: 'delete',
    displayName: 'Delete Access',
    description: 'Remove data from system',
    category: 'advanced',
    dependencies: ['read', 'write'],
    exclusions: ['guest'],
    level: 'delete'
  },
  {
    id: 'admin',
    name: 'admin',
    displayName: 'Admin Access',
    description: 'Full administrative control',
    category: 'advanced',
    dependencies: ['read', 'write', 'delete'],
    exclusions: ['guest', 'readonly'],
    level: 'admin'
  },
  {
    id: 'guest',
    name: 'guest',
    displayName: 'Guest Access',
    description: 'Limited guest access',
    category: 'basic',
    dependencies: [],
    exclusions: ['delete', 'admin'],
    level: 'read'
  },
  {
    id: 'readonly',
    name: 'readonly',
    displayName: 'Read Only Access',
    description: 'Read-only access with no modifications',
    category: 'basic',
    dependencies: ['read'],
    exclusions: ['admin'],
    level: 'read'
  }
];