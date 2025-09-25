"use client";

import { useState, useEffect } from "react";
import { 
  ViewColumnsIcon, 
  RectangleGroupIcon,
  Squares2X2Icon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { RoleManagement } from "./RoleManagement";
import { RoleHierarchy } from "./RoleHierarchy";
import { PermissionInheritance } from "./PermissionInheritance";
import { RoleEditor } from "./RoleEditor";
import { Role, CreateRoleDTO, UpdateRoleDTO, Permission } from "@/types/admin";

type ViewMode = 'table' | 'hierarchy' | 'inheritance';

interface RoleManagementPageProps {
  initialRoles?: Role[];
  initialPermissions?: Permission[];
  onRoleCreate?: (role: CreateRoleDTO) => Promise<void>;
  onRoleUpdate?: (id: number, role: UpdateRoleDTO) => Promise<void>;
  onRoleDelete?: (id: number) => Promise<void>;
}

export const RoleManagementPage = ({
  initialRoles = [],
  initialPermissions = [],
  onRoleCreate,
  onRoleUpdate,
  onRoleDelete,
}: RoleManagementPageProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions);
  const [selectedRole, setSelectedRole] = useState<Role | undefined>();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    if (initialRoles.length === 0) {
      const mockRoles: Role[] = [
        {
          id: 1,
          name: "super_admin",
          displayName: "Super Administrator",
          description: "System super administrator with full access to all features and settings",
          isSystem: true,
          permissions: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          name: "admin",
          displayName: "Administrator",
          description: "System administrator with elevated permissions for managing users and content",
          isSystem: true,
          permissions: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: 3,
          name: "manager",
          displayName: "Manager",
          description: "Department manager with permissions to oversee team activities and reports",
          isSystem: false,
          permissions: [],
          createdAt: "2024-01-02T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
        {
          id: 4,
          name: "teacher",
          displayName: "Teacher",
          description: "Teaching staff with access to academic features and student management",
          isSystem: false,
          permissions: [],
          createdAt: "2024-01-03T00:00:00Z",
          updatedAt: "2024-01-03T00:00:00Z",
        },
        {
          id: 5,
          name: "student",
          displayName: "Student",
          description: "Student role with access to learning materials and course information",
          isSystem: false,
          permissions: [],
          createdAt: "2024-01-04T00:00:00Z",
          updatedAt: "2024-01-04T00:00:00Z",
        },
      ];
      setRoles(mockRoles);
    }

    if (initialPermissions.length === 0) {
      const mockPermissions: Permission[] = [
        {
          id: "users.read",
          name: "users.read",
          displayName: "View Users",
          description: "Permission to view user information",
          category: "user_management",
          dependencies: [],
          exclusions: [],
          level: "read",
        },
        {
          id: "users.write",
          name: "users.write",
          displayName: "Manage Users",
          description: "Permission to create and edit users",
          category: "user_management",
          dependencies: ["users.read"],
          exclusions: [],
          level: "write",
        },
        {
          id: "users.delete",
          name: "users.delete",
          displayName: "Delete Users",
          description: "Permission to delete users",
          category: "user_management",
          dependencies: ["users.read", "users.write"],
          exclusions: [],
          level: "delete",
        },
        {
          id: "roles.admin",
          name: "roles.admin",
          displayName: "Administer Roles",
          description: "Permission to manage roles and permissions",
          category: "role_management",
          dependencies: ["users.read"],
          exclusions: [],
          level: "admin",
        },
      ];
      setPermissions(mockPermissions);
    }
  }, [initialRoles, initialPermissions]);

  // Handle role creation
  const handleRoleCreate = async (roleData: CreateRoleDTO) => {
    setLoading(true);
    try {
      if (onRoleCreate) {
        await onRoleCreate(roleData);
      } else {
        // Mock implementation
        const newRole: Role = {
          id: Math.max(...roles.map(r => r.id)) + 1,
          ...roleData,
          isSystem: false,
          permissions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setRoles(prev => [...prev, newRole]);
      }
      setIsEditorOpen(false);
    } catch (error) {
      console.error("Error creating role:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle role update
  const handleRoleUpdate = async (id: number, roleData: UpdateRoleDTO) => {
    setLoading(true);
    try {
      if (onRoleUpdate) {
        await onRoleUpdate(id, roleData);
      } else {
        // Mock implementation
        setRoles(prev => prev.map(role => 
          role.id === id 
            ? { ...role, ...roleData, updatedAt: new Date().toISOString() }
            : role
        ));
      }
      setIsEditorOpen(false);
      setSelectedRole(undefined);
    } catch (error) {
      console.error("Error updating role:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle role deletion
  const handleRoleDelete = async (id: number) => {
    setLoading(true);
    try {
      if (onRoleDelete) {
        await onRoleDelete(id);
      } else {
        // Mock implementation
        setRoles(prev => prev.filter(role => role.id !== id));
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle role selection
  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    if (viewMode !== 'inheritance') {
      setViewMode('inheritance');
    }
  };

  // Handle role editing
  const handleRoleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsEditorOpen(true);
  };

  // Handle create new role
  const handleCreateRole = (parentRole?: Role) => {
    setSelectedRole(undefined);
    setIsEditorOpen(true);
  };

  // Get parent roles for selected role (mock implementation)
  const getParentRoles = (role: Role): Role[] => {
    // In a real implementation, this would traverse the hierarchy
    // For now, return empty array as hierarchy is not fully implemented
    return [];
  };

  const viewModeButtons = [
    {
      mode: 'table' as ViewMode,
      icon: ViewColumnsIcon,
      label: 'Table View',
      description: 'View roles in a detailed table format',
    },
    {
      mode: 'hierarchy' as ViewMode,
      icon: RectangleGroupIcon,
      label: 'Hierarchy View',
      description: 'View roles in a hierarchical tree structure',
    },
    {
      mode: 'inheritance' as ViewMode,
      icon: Squares2X2Icon,
      label: 'Permission Inheritance',
      description: 'View permission inheritance for selected role',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <p className="mt-2 text-gray-600">
            Manage user roles, permissions, and hierarchy relationships
          </p>
        </div>
        
        <button
          onClick={() => handleCreateRole()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Role
        </button>
      </div>

      {/* View Mode Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-1">
          {viewModeButtons.map((button) => {
            const Icon = button.icon;
            const isActive = viewMode === button.mode;
            const isDisabled = button.mode === 'inheritance' && !selectedRole;
            
            return (
              <button
                key={button.mode}
                onClick={() => !isDisabled && setViewMode(button.mode)}
                disabled={isDisabled}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : isDisabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={isDisabled ? 'Select a role to view inheritance' : button.description}
              >
                <Icon className="h-4 w-4 mr-2" />
                {button.label}
              </button>
            );
          })}
        </div>
        
        {viewMode === 'inheritance' && selectedRole && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              Viewing permission inheritance for: <span className="font-medium">{selectedRole.displayName}</span>
            </p>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg border border-gray-200">
        {viewMode === 'table' && (
          <RoleManagement
            roles={roles}
            onRoleCreate={handleRoleCreate}
            onRoleUpdate={handleRoleUpdate}
            onRoleDelete={handleRoleDelete}
            loading={loading}
          />
        )}

        {viewMode === 'hierarchy' && (
          <div className="p-6">
            <RoleHierarchy
              roles={roles}
              onRoleSelect={handleRoleSelect}
              onRoleEdit={handleRoleEdit}
              onRoleDelete={handleRoleDelete}
              onRoleCreate={handleCreateRole}
              selectedRoleId={selectedRole?.id}
              showActions={true}
            />
          </div>
        )}

        {viewMode === 'inheritance' && selectedRole && (
          <div className="p-6">
            <PermissionInheritance
              role={selectedRole}
              parentRoles={getParentRoles(selectedRole)}
              permissions={permissions}
              onPermissionOverride={(permission, enabled) => {
                console.log(`Override permission ${permission} to ${enabled} for role ${selectedRole.id}`);
                // This would typically update the role's permissions
              }}
            />
          </div>
        )}

        {viewMode === 'inheritance' && !selectedRole && (
          <div className="p-12 text-center text-gray-500">
            <Squares2X2Icon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No Role Selected</h3>
            <p className="text-sm">
              Select a role from the hierarchy view to see its permission inheritance
            </p>
            <button
              onClick={() => setViewMode('hierarchy')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100"
            >
              <RectangleGroupIcon className="h-4 w-4 mr-2" />
              Go to Hierarchy View
            </button>
          </div>
        )}
      </div>

      {/* Role Editor Modal */}
      <RoleEditor
        role={selectedRole}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedRole(undefined);
        }}
        onSave={selectedRole ? 
          (roleData) => handleRoleUpdate(selectedRole.id, roleData as UpdateRoleDTO) :
          (roleData) => handleRoleCreate(roleData as CreateRoleDTO)
        }
        isSubmitting={loading}
      />
    </div>
  );
};