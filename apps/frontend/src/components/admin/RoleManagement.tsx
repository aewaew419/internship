"use client";

import { useState, useEffect } from "react";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { AdminDataTable } from "./AdminDataTable";
import { RoleEditor } from "./RoleEditor";
import { AdminModal } from "./AdminModal";
import { Role, CreateRoleDTO, UpdateRoleDTO } from "@/types/admin";

interface RoleManagementProps {
  roles: Role[];
  onRoleCreate: (role: CreateRoleDTO) => Promise<void>;
  onRoleUpdate: (id: number, role: UpdateRoleDTO) => Promise<void>;
  onRoleDelete: (id: number) => Promise<void>;
  loading?: boolean;
}

export const RoleManagement = ({
  roles,
  onRoleCreate,
  onRoleUpdate,
  onRoleDelete,
  loading = false,
}: RoleManagementProps) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | undefined>();
  const [roleToDelete, setRoleToDelete] = useState<Role | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Handle create role
  const handleCreateRole = () => {
    setSelectedRole(undefined);
    setValidationErrors({});
    setIsEditorOpen(true);
  };

  // Handle edit role
  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setValidationErrors({});
    setIsEditorOpen(true);
  };

  // Handle delete role
  const handleDeleteRole = (role: Role) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  // Handle role save
  const handleRoleSave = async (roleData: CreateRoleDTO | UpdateRoleDTO) => {
    setIsSubmitting(true);
    setValidationErrors({});

    try {
      // Validate role name uniqueness
      const existingRole = roles.find(r => 
        r.name.toLowerCase() === roleData.name.toLowerCase() && 
        r.id !== (selectedRole?.id)
      );

      if (existingRole) {
        setValidationErrors({ name: "A role with this name already exists" });
        return;
      }

      if (selectedRole) {
        // Update existing role
        await onRoleUpdate(selectedRole.id, roleData as UpdateRoleDTO);
      } else {
        // Create new role
        await onRoleCreate(roleData as CreateRoleDTO);
      }

      setIsEditorOpen(false);
      setSelectedRole(undefined);
    } catch (error: any) {
      // Handle validation errors from server
      if (error.validationErrors) {
        setValidationErrors(error.validationErrors);
      } else {
        setValidationErrors({ 
          general: error.message || "An error occurred while saving the role" 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle role deletion confirmation
  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;

    setIsSubmitting(true);
    try {
      await onRoleDelete(roleToDelete.id);
      setIsDeleteModalOpen(false);
      setRoleToDelete(undefined);
    } catch (error: any) {
      // Handle deletion errors
      console.error("Error deleting role:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Table columns configuration
  const columns = [
    {
      key: "displayName" as keyof Role,
      title: "Display Name",
      sortable: true,
      render: (value: string, role: Role) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{role.name}</div>
        </div>
      ),
    },
    {
      key: "description" as keyof Role,
      title: "Description",
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      ),
    },
    {
      key: "isSystem" as keyof Role,
      title: "Type",
      render: (value: boolean) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value 
            ? "bg-blue-100 text-blue-800" 
            : "bg-green-100 text-green-800"
        }`}>
          {value ? "System" : "Custom"}
        </span>
      ),
    },
    {
      key: "permissions" as keyof Role,
      title: "Permissions",
      render: (permissions: Role["permissions"]) => (
        <span className="text-sm text-gray-600">
          {permissions?.length || 0} permissions
        </span>
      ),
    },
    {
      key: "updatedAt" as keyof Role,
      title: "Last Updated",
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
  ];

  // Table actions
  const actions = [
    {
      label: "Edit",
      icon: PencilIcon,
      onClick: handleEditRole,
      variant: "primary" as const,
    },
    {
      label: "Delete",
      icon: TrashIcon,
      onClick: handleDeleteRole,
      variant: "danger" as const,
      disabled: (role: Role) => role.isSystem,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
          <p className="mt-1 text-sm text-gray-600">
            Create and manage user roles and their permissions
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateRole}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Role
        </button>
      </div>

      {/* Roles Table */}
      <AdminDataTable
        data={roles}
        columns={columns}
        actions={actions}
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
        }}
        sorting={{
          defaultSort: { key: "displayName", direction: "asc" },
        }}
        filtering={{
          searchPlaceholder: "Search roles...",
          searchFields: ["name", "displayName", "description"],
        }}
      />

      {/* Role Editor Modal */}
      <RoleEditor
        role={selectedRole}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedRole(undefined);
          setValidationErrors({});
        }}
        onSave={handleRoleSave}
        isSubmitting={isSubmitting}
        validationErrors={validationErrors}
      />

      {/* Delete Confirmation Modal */}
      <AdminModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setRoleToDelete(undefined);
        }}
        title="Delete Role"
        type="warning"
        size="md"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setRoleToDelete(undefined);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                "Delete Role"
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete the role "{roleToDelete?.displayName}"? 
            This action cannot be undone.
          </p>
          
          {roleToDelete && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Role Details:</h4>
              <dl className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <dt>Name:</dt>
                  <dd className="font-medium">{roleToDelete.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Display Name:</dt>
                  <dd className="font-medium">{roleToDelete.displayName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Permissions:</dt>
                  <dd className="font-medium">{roleToDelete.permissions?.length || 0}</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Warning
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Deleting this role will remove all associated permissions and may affect users assigned to this role.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminModal>
    </div>
  );
};