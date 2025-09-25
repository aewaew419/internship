"use client";

import { useState, useCallback } from "react";
import { AdminRoute } from "@/components/auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RoleManagementMatrix } from "@/components/admin";
import { BulkRoleOperations } from "@/components/admin/BulkRoleOperations";
import { useBulkRoleOperations } from "@/hooks/useBulkRoleOperations";
import { mockRoles, mockModules, mockPermissions } from "@/lib/mockData/adminData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RoleManagementPage() {
  const [roles, setRoles] = useState(mockRoles);
  const [modules] = useState(mockModules);
  const [permissions] = useState(mockPermissions);
  const [selectedRoles, setSelectedRoles] = useState<typeof mockRoles>([]);
  const [activeTab, setActiveTab] = useState("matrix");

  // Bulk operations hook
  const {
    isProcessing,
    progress,
    currentOperation,
    executeBulkOperation
  } = useBulkRoleOperations();

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

  // Handle bulk operations
  const handleBulkOperation = useCallback(async (operation: string, data: any) => {
    try {
      const result = await executeBulkOperation(operation, data);
      
      if (result.success) {
        // Update roles state based on operation
        switch (operation) {
          case 'delete_roles':
            if (result.data?.deletedRoleIds) {
              setRoles(prevRoles => 
                prevRoles.filter(role => !result.data.deletedRoleIds.includes(role.id))
              );
              setSelectedRoles([]);
            }
            break;
          case 'assign_permissions':
            // Refresh roles data or update permissions in state
            console.log('Permissions updated for roles:', result.data?.affectedRoles);
            break;
          case 'import_roles':
            if (result.data?.importedRoles) {
              // Add imported roles to state
              const newRoles = result.data.importedRoles.map((roleData: any, index: number) => ({
                id: Math.max(...roles.map(r => r.id)) + index + 1,
                name: roleData.name,
                displayName: roleData.displayName || roleData.name,
                description: roleData.description || '',
                isSystem: false,
                userCount: 0,
                permissions: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }));
              setRoles(prevRoles => [...prevRoles, ...newRoles]);
            }
            break;
        }

        // Show success message
        alert(`✅ ${result.message}`);
        
        if (result.errors && result.errors.length > 0) {
          console.warn('Operation completed with warnings:', result.errors);
        }
      } else {
        // Show error message
        alert(`❌ ${result.message}`);
        if (result.errors) {
          console.error('Operation errors:', result.errors);
        }
      }
    } catch (error) {
      console.error('Bulk operation failed:', error);
      alert('❌ เกิดข้อผิดพลาดในการดำเนินการ');
    }
  }, [executeBulkOperation, roles]);

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">จัดการบทบาทและสิทธิ์</h1>
            <p className="mt-1 text-sm text-gray-600">
              จัดการบทบาทและสิทธิ์ของผู้ใช้ในระบบ รวมถึงการดำเนินการแบบกลุ่ม
            </p>
          </div>

          {/* Progress Indicator for Bulk Operations */}
          {isProcessing && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">
                  กำลังดำเนินการ: {currentOperation}
                </span>
                <span className="text-sm text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="matrix" className="space-y-6">
              <RoleManagementMatrix
                roles={roles}
                modules={modules}
                permissions={permissions}
                onPermissionChange={handlePermissionChange}
                onSaveChanges={handleSaveChanges}
                autoSave={true}
              />
            </TabsContent>
            
            <TabsContent value="bulk" className="space-y-6">
              <BulkRoleOperations
                roles={roles}
                selectedRoles={selectedRoles}
                onSelectionChange={setSelectedRoles}
                onBulkOperation={handleBulkOperation}
                isLoading={isProcessing}
              />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}