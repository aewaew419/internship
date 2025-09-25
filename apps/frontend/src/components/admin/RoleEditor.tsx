"use client";

import { useState, useEffect } from "react";
import { AdminFormModal } from "./AdminModal";
import { AdminFormField } from "./AdminForm";
import { 
  Role, 
  RoleEditorProps, 
  CreateRoleDTO, 
  UpdateRoleDTO, 
  RoleFormState,
  RoleHierarchy 
} from "@/types/admin";

export const RoleEditor = ({
  role,
  isOpen,
  onClose,
  onSave,
  isSubmitting = false,
  validationErrors = {},
}: RoleEditorProps) => {
  const [formState, setFormState] = useState<RoleFormState>({
    name: "",
    displayName: "",
    description: "",
    parentRoleId: undefined,
    errors: {},
    touched: {},
    isValid: false,
  });

  const [availableParentRoles, setAvailableParentRoles] = useState<Role[]>([]);

  // Initialize form state when role changes
  useEffect(() => {
    if (role) {
      setFormState({
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        parentRoleId: undefined, // Will be set when hierarchy is implemented
        errors: {},
        touched: {},
        isValid: true,
      });
    } else {
      setFormState({
        name: "",
        displayName: "",
        description: "",
        parentRoleId: undefined,
        errors: {},
        touched: {},
        isValid: false,
      });
    }
  }, [role]);

  // Load available parent roles (exclude current role and its descendants to prevent circular references)
  useEffect(() => {
    // For now, we'll show all roles except the current one
    // In a full implementation, we would exclude descendants to prevent circular references
    const fetchAvailableParentRoles = async () => {
      try {
        // This would typically be an API call
        // For now, we'll simulate with mock data
        const mockParentRoles: Role[] = [
          {
            id: 1,
            name: "admin",
            displayName: "Administrator",
            description: "System administrator with full access",
            isSystem: true,
            permissions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 2,
            name: "manager",
            displayName: "Manager",
            description: "Department manager with elevated permissions",
            isSystem: false,
            permissions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 3,
            name: "teacher",
            displayName: "Teacher",
            description: "Teaching staff with academic permissions",
            isSystem: false,
            permissions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ].filter(r => r.id !== role?.id); // Exclude current role

        setAvailableParentRoles(mockParentRoles);
      } catch (error) {
        console.error("Error loading parent roles:", error);
      }
    };

    fetchAvailableParentRoles();
  }, [role]);

  // Validation function
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Role name is required";
        if (value.length < 2) return "Role name must be at least 2 characters";
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) return "Role name can only contain letters, numbers, hyphens, and underscores";
        return "";
      
      case "displayName":
        if (!value.trim()) return "Display name is required";
        if (value.length < 2) return "Display name must be at least 2 characters";
        return "";
      
      case "description":
        if (!value.trim()) return "Description is required";
        if (value.length < 10) return "Description must be at least 10 characters";
        return "";
      
      default:
        return "";
    }
  };

  // Handle field changes
  const handleFieldChange = (name: string, value: string) => {
    const error = validateField(name, value);
    
    setFormState(prev => {
      const newState = {
        ...prev,
        [name]: value,
        errors: {
          ...prev.errors,
          [name]: error,
        },
        touched: {
          ...prev.touched,
          [name]: true,
        },
      };

      // Check if form is valid
      const hasErrors = Object.values(newState.errors).some(err => err !== "");
      const requiredFields = ["name", "displayName", "description"];
      const allFieldsFilled = requiredFields.every(field => newState[field as keyof RoleFormState]?.toString().trim());
      
      newState.isValid = !hasErrors && allFieldsFilled;
      
      return newState;
    });
  };

  // Handle form submission
  const handleSubmit = async (data: any) => {
    const roleData: CreateRoleDTO | UpdateRoleDTO = {
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      parentRoleId: data.parentRoleId ? parseInt(data.parentRoleId) : undefined,
      ...(role && { id: role.id }),
    };

    await onSave(roleData);
  };

  // Handle cancel
  const handleCancel = () => {
    setFormState({
      name: "",
      displayName: "",
      description: "",
      parentRoleId: undefined,
      errors: {},
      touched: {},
      isValid: false,
    });
    onClose();
  };

  return (
    <AdminFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      title={role ? "Edit Role" : "Create New Role"}
      size="lg"
      submitText={role ? "Update Role" : "Create Role"}
      isSubmitting={isSubmitting}
      validationErrors={validationErrors}
    >
      <div className="space-y-6">
        {/* Role Name */}
        <AdminFormField
          label="Role Name"
          name="name"
          type="text"
          placeholder="e.g., student, teacher, admin"
          required
          error={formState.touched.name ? formState.errors.name : undefined}
          helpText="Unique identifier for the role. Use lowercase letters, numbers, hyphens, and underscores only."
          disabled={role?.isSystem}
        >
          <input
            type="text"
            name="name"
            id="name"
            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm ${
              formState.touched.name && formState.errors.name ? "border-red-300" : ""
            } ${role?.isSystem ? "bg-gray-50 text-gray-500" : ""}`}
            placeholder="e.g., student, teacher, admin"
            value={formState.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            disabled={role?.isSystem}
            required
          />
        </AdminFormField>

        {/* Display Name */}
        <AdminFormField
          label="Display Name"
          name="displayName"
          type="text"
          placeholder="e.g., Student, Teacher, Administrator"
          required
          error={formState.touched.displayName ? formState.errors.displayName : undefined}
          helpText="Human-readable name that will be shown in the interface."
        >
          <input
            type="text"
            name="displayName"
            id="displayName"
            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm ${
              formState.touched.displayName && formState.errors.displayName ? "border-red-300" : ""
            }`}
            placeholder="e.g., Student, Teacher, Administrator"
            value={formState.displayName}
            onChange={(e) => handleFieldChange("displayName", e.target.value)}
            required
          />
        </AdminFormField>

        {/* Description */}
        <AdminFormField
          label="Description"
          name="description"
          type="textarea"
          placeholder="Describe the role's purpose and responsibilities..."
          required
          rows={4}
          error={formState.touched.description ? formState.errors.description : undefined}
          helpText="Detailed description of the role's purpose and responsibilities."
        >
          <textarea
            name="description"
            id="description"
            rows={4}
            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm ${
              formState.touched.description && formState.errors.description ? "border-red-300" : ""
            }`}
            placeholder="Describe the role's purpose and responsibilities..."
            value={formState.description}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            required
          />
        </AdminFormField>

        {/* Parent Role (for hierarchy - will be implemented in subtask 3.2) */}
        <AdminFormField
          label="Parent Role"
          name="parentRoleId"
          type="select"
          helpText="Optional: Select a parent role to inherit permissions from."
          options={availableParentRoles.map(role => ({
            value: role.id.toString(),
            label: role.displayName,
          }))}
        >
          <select
            name="parentRoleId"
            id="parentRoleId"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
            value={formState.parentRoleId?.toString() || ""}
            onChange={(e) => handleFieldChange("parentRoleId", e.target.value)}
          >
            <option value="">No parent role</option>
            {availableParentRoles.map((parentRole) => (
              <option key={parentRole.id} value={parentRole.id.toString()}>
                {parentRole.displayName}
              </option>
            ))}
          </select>
        </AdminFormField>

        {/* System Role Warning */}
        {role?.isSystem && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  System Role
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    This is a system role. The role name cannot be modified, but you can update the display name and description.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Validation Summary */}
        {Object.keys(formState.errors).length > 0 && Object.values(formState.touched).some(Boolean) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Please fix the following errors:
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {Object.entries(formState.errors)
                      .filter(([field]) => formState.touched[field as keyof typeof formState.touched])
                      .map(([field, error]) => (
                        <li key={field}>{error}</li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminFormModal>
  );
};