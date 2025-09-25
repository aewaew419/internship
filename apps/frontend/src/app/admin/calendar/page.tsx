"use client";

import { useState, useCallback } from "react";
import { AdminRoute } from "@/components/auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AcademicCalendarView } from "@/components/admin";
import { BulkCalendarOperations } from "@/components/admin/BulkCalendarOperations";
import { useBulkCalendarOperations } from "@/hooks/useBulkCalendarOperations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AcademicCalendarPage() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  // Mock data for demonstration
  const [semesters] = useState([
    {
      id: 1,
      name: 'ภาคเรียนที่ 1/2567',
      academicYear: '2567',
      startDate: '2024-06-01',
      endDate: '2024-10-31',
      registrationStartDate: '2024-05-15',
      registrationEndDate: '2024-05-30',
      examStartDate: '2024-10-20',
      examEndDate: '2024-10-30',
      isActive: true,
      holidayCount: 5
    },
    {
      id: 2,
      name: 'ภาคเรียนที่ 2/2567',
      academicYear: '2567',
      startDate: '2024-11-01',
      endDate: '2025-03-31',
      registrationStartDate: '2024-10-15',
      registrationEndDate: '2024-10-30',
      examStartDate: '2025-03-20',
      examEndDate: '2025-03-30',
      isActive: false,
      holidayCount: 8
    },
    {
      id: 3,
      name: 'ภาคฤดูร้อน/2567',
      academicYear: '2567',
      startDate: '2025-04-01',
      endDate: '2025-05-31',
      registrationStartDate: '2025-03-15',
      registrationEndDate: '2025-03-30',
      examStartDate: '2025-05-25',
      examEndDate: '2025-05-30',
      isActive: false,
      holidayCount: 3
    }
  ]);

  const [holidays] = useState([
    {
      id: 1,
      name: 'วันขึ้นปีใหม่',
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      type: 'national' as const,
      description: 'วันหยุดราชการ',
      isRecurring: true
    },
    {
      id: 2,
      name: 'วันสงกรานต์',
      startDate: '2024-04-13',
      endDate: '2024-04-15',
      type: 'national' as const,
      description: 'วันหยุดเทศกาลสงกรานต์',
      isRecurring: true
    },
    {
      id: 3,
      name: 'วันก่อตั้งมหาวิทยาลัย',
      startDate: '2024-03-15',
      endDate: '2024-03-15',
      type: 'university' as const,
      description: 'วันครบรอบการก่อตั้งมหาวิทยาลัย',
      isRecurring: true
    },
    {
      id: 4,
      name: 'วันหยุดระหว่างภาค',
      startDate: '2024-10-31',
      endDate: '2024-11-01',
      type: 'semester_break' as const,
      description: 'วันหยุดระหว่างภาคเรียน',
      isRecurring: false,
      semesterId: 1
    }
  ]);

  // Bulk operations hook
  const {
    isProcessing,
    progress,
    currentOperation,
    executeBulkOperation
  } = useBulkCalendarOperations();

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
        setSelectedItems([]);
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
            <h1 className="text-2xl font-bold text-gray-900">จัดการปฏิทินการศึกษา</h1>
            <p className="mt-1 text-sm text-gray-600">
              จัดการปฏิทินการศึกษา ภาคเรียน และวันหยุด รวมถึงการดำเนินการแบบกลุ่ม
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
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="space-y-6">
              <AcademicCalendarView />
            </TabsContent>
            
            <TabsContent value="bulk" className="space-y-6">
              <BulkCalendarOperations
                semesters={semesters}
                holidays={holidays}
                selectedItems={selectedItems}
                onSelectionChange={setSelectedItems}
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