"use client";

import { useState, useCallback } from "react";
import { AdminRoute } from "@/components/auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { TitlePrefixManager } from "@/components/admin";
import { BulkPrefixOperations } from "@/components/admin/BulkPrefixOperations";
import { useBulkPrefixOperations } from "@/hooks/useBulkPrefixOperations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TitlePrefixesPage() {
  const [activeTab, setActiveTab] = useState("management");
  const [selectedPrefixes, setSelectedPrefixes] = useState<any[]>([]);

  // Mock data for demonstration
  const [prefixes] = useState([
    {
      id: 1,
      thai: 'นาย',
      english: 'Mr.',
      abbreviation: 'Mr.',
      category: 'professional',
      gender: 'male',
      isDefault: true,
      sortOrder: 1,
      isActive: true,
      assignedRoles: 3
    },
    {
      id: 2,
      thai: 'นาง',
      english: 'Mrs.',
      abbreviation: 'Mrs.',
      category: 'professional',
      gender: 'female',
      isDefault: true,
      sortOrder: 2,
      isActive: true,
      assignedRoles: 3
    },
    {
      id: 3,
      thai: 'นางสาว',
      english: 'Miss',
      abbreviation: 'Ms.',
      category: 'professional',
      gender: 'female',
      isDefault: true,
      sortOrder: 3,
      isActive: true,
      assignedRoles: 2
    },
    {
      id: 4,
      thai: 'ดร.',
      english: 'Dr.',
      abbreviation: 'Dr.',
      category: 'academic',
      gender: 'neutral',
      isDefault: false,
      sortOrder: 4,
      isActive: true,
      assignedRoles: 2
    },
    {
      id: 5,
      thai: 'ศาสตราจารย์',
      english: 'Professor',
      abbreviation: 'Prof.',
      category: 'academic',
      gender: 'neutral',
      isDefault: false,
      sortOrder: 5,
      isActive: true,
      assignedRoles: 1
    },
    {
      id: 6,
      thai: 'รองศาสตราจารย์',
      english: 'Associate Professor',
      abbreviation: 'Assoc. Prof.',
      category: 'academic',
      gender: 'neutral',
      isDefault: false,
      sortOrder: 6,
      isActive: true,
      assignedRoles: 1
    },
    {
      id: 7,
      thai: 'ผู้ช่วยศาสตราจารย์',
      english: 'Assistant Professor',
      abbreviation: 'Asst. Prof.',
      category: 'academic',
      gender: 'neutral',
      isDefault: false,
      sortOrder: 7,
      isActive: true,
      assignedRoles: 1
    },
    {
      id: 8,
      thai: 'พระ',
      english: 'Phra',
      abbreviation: 'Phra',
      category: 'religious',
      gender: 'male',
      isDefault: false,
      sortOrder: 8,
      isActive: true,
      assignedRoles: 0
    }
  ]);

  const [roles] = useState([
    {
      id: 1,
      name: 'student',
      displayName: 'นักศึกษา',
      description: 'นักศึกษาในระบบ',
      isSystem: false,
      userCount: 150
    },
    {
      id: 2,
      name: 'instructor',
      displayName: 'อาจารย์นิเทศ',
      description: 'อาจารย์ที่ทำหน้าที่นิเทศนักศึกษา',
      isSystem: false,
      userCount: 25
    },
    {
      id: 3,
      name: 'coordinator',
      displayName: 'ผู้ประสานงาน',
      description: 'ผู้ประสานงานสหกิจศึกษา',
      isSystem: false,
      userCount: 8
    },
    {
      id: 4,
      name: 'admin',
      displayName: 'ผู้ดูแลระบบ',
      description: 'ผู้ดูแลระบบทั้งหมด',
      isSystem: true,
      userCount: 3
    }
  ]);

  const [assignments] = useState([
    { prefixId: 1, roleId: 1, isDefault: true, canModify: true },
    { prefixId: 1, roleId: 2, isDefault: false, canModify: true },
    { prefixId: 1, roleId: 3, isDefault: false, canModify: true },
    { prefixId: 2, roleId: 1, isDefault: true, canModify: true },
    { prefixId: 2, roleId: 2, isDefault: false, canModify: true },
    { prefixId: 2, roleId: 3, isDefault: false, canModify: true },
    { prefixId: 3, roleId: 1, isDefault: true, canModify: true },
    { prefixId: 3, roleId: 2, isDefault: false, canModify: true },
    { prefixId: 4, roleId: 2, isDefault: true, canModify: true },
    { prefixId: 4, roleId: 3, isDefault: false, canModify: true },
    { prefixId: 5, roleId: 2, isDefault: true, canModify: true },
    { prefixId: 6, roleId: 2, isDefault: true, canModify: true },
    { prefixId: 7, roleId: 2, isDefault: true, canModify: true }
  ]);

  // Bulk operations hook
  const {
    isProcessing,
    progress,
    currentOperation,
    executeBulkOperation
  } = useBulkPrefixOperations();

  // Handle bulk operations
  const handleBulkOperation = useCallback(async (operation: string, data: any) => {
    try {
      const result = await executeBulkOperation(operation, data);
      
      if (result.success) {
        // Show success message
        alert(`✅ ${result.message}`);
        
        if (result.errors && result.errors.length > 0) {
          console.warn('Operation completed with warnings:', result.errors);
        }

        // Reset selection after successful operation
        setSelectedPrefixes([]);
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
  }, [executeBulkOperation]);

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">จัดการคำนำหน้าชื่อ</h1>
            <p className="mt-1 text-sm text-gray-600">
              จัดการคำนำหน้าชื่อและการกำหนดบทบาท รวมถึงการดำเนินการแบบกลุ่ม
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
              <TabsTrigger value="management">Prefix Management</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="management" className="space-y-6">
              <TitlePrefixManager />
            </TabsContent>
            
            <TabsContent value="bulk" className="space-y-6">
              <BulkPrefixOperations
                prefixes={prefixes}
                roles={roles}
                assignments={assignments}
                selectedPrefixes={selectedPrefixes}
                onSelectionChange={setSelectedPrefixes}
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