"use client";

import { useState, useCallback } from "react";
import { AdminRoute } from "@/components/auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RoleManagementMatrix } from "@/components/admin";
import { mockRoles, mockModules, mockPermissions } from "@/lib/mockData/adminData";

export default function RoleManagementPage() {
  const [roles, setRoles] = useState(mockRoles);
  const [modules] = useState(mockModules);
  const [permissions] = useState(mockPermissions);

  // Handle permission changes
  const handlePermissionChange = useCallback(async (
    roleId: number, 
    moduleId: number, 
    permission: string, 
    enabled: boolean
  ) => {
    console.log('Permission change:', { roleId, moduleId, permission, enabled });
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Update the role permissions in state
    setRoles(prevRoles => 
      prevRoles.map(role => {
        if (role.id === roleId) {
          const existingPermissionIndex = role.permissions.findIndex(
            p => p.moduleId === moduleId && p.permission === permission
          );
          
          if (existingPermissionIndex >= 0) {
            // Update existing permission
            const updatedPermissions = [...role.permissions];
            updatedPermissions[existingPermissionIndex] = {
              ...updatedPermissions[existingPermissionIndex],
              granted: enabled
            };
            return { ...role, permissions: updatedPermissions };
          } else {
            // Add new permission
            return {
              ...role,
              permissions: [
                ...role.permissions,
                { roleId, moduleId, permission, granted: enabled }
              ]
            };
          }
        }
        return role;
      })
    );
  }, []);

  // Handle save changes
  const handleSaveChanges = useCallback(async () => {
    console.log('Saving changes...');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('Changes saved successfully');
  }, []);

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              จัดการบทบาทและสิทธิ์ของผู้ใช้ในระบบ
            </p>
          </div>
          
          <RoleManagementMatrix
            roles={roles}
            modules={modules}
            permissions={permissions}
            onPermissionChange={handlePermissionChange}
            onSaveChanges={handleSaveChanges}
            autoSave={true}
          />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}