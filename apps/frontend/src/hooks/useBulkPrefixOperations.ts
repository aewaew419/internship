'use client';

import { useState, useCallback } from 'react';

export interface BulkPrefixOperationResult {
  success: boolean;
  message: string;
  processedCount: number;
  failedCount: number;
  errors?: string[];
  data?: any;
}

export interface BulkPrefixAssignmentData {
  prefixIds: number[];
  roleIds: number[];
  action: 'assign' | 'unassign' | 'set_default';
}

export interface BulkPrefixModificationData {
  prefixIds: number[];
  changes: {
    category?: string;
    gender?: string;
    isActive?: boolean;
    sortOrder?: number;
  };
}

export interface BulkPrefixImportData {
  file: File;
  skipDuplicates: boolean;
  validateGender: boolean;
  autoAssignRoles: boolean;
}

export interface BulkPrefixExportData {
  prefixIds: number[];
  format: 'json' | 'excel' | 'csv';
  includeAssignments: boolean;
  includeMetadata: boolean;
}

export interface BulkPrefixDeletionData {
  prefixIds: number[];
  confirmDelete: boolean;
  removeAssignments: boolean;
}

export interface BulkPrefixDefaultsData {
  prefixIds: number[];
  defaultAction: 'set' | 'unset';
  scope: 'category' | 'gender' | 'global';
}

export const useBulkPrefixOperations = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);

  // Simulate API delay for demonstration
  const simulateApiCall = (duration: number = 1000) => {
    return new Promise(resolve => setTimeout(resolve, duration));
  };

  // Bulk prefix assignment to roles
  const assignPrefixesToRoles = useCallback(async (data: BulkPrefixAssignmentData): Promise<BulkPrefixOperationResult> => {
    setIsProcessing(true);
    setCurrentOperation('assign_to_roles');
    setProgress(0);

    try {
      const totalOperations = data.prefixIds.length * data.roleIds.length;
      let processedCount = 0;
      const errors: string[] = [];

      // Simulate processing with progress updates
      for (const prefixId of data.prefixIds) {
        for (const roleId of data.roleIds) {
          setProgress(Math.round((processedCount / totalOperations) * 100));
          await simulateApiCall(100);

          try {
            // In a real implementation, this would be an API call
            // await fetch('/api/admin/prefixes/bulk/assign', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({
            //     prefixId,
            //     roleId,
            //     action: data.action
            //   })
            // });

            // Mock some failures for demonstration
            if (Math.random() > 0.95) { // 5% failure rate
              errors.push(`ไม่สามารถ${data.action === 'assign' ? 'กำหนด' : 'ยกเลิก'}คำนำหน้าชื่อ ID ${prefixId} ให้บทบาท ID ${roleId} ได้`);
            } else {
              processedCount++;
            }
          } catch (error) {
            errors.push(`ข้อผิดพลาดในการประมวลผล: ${error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ'}`);
          }
        }
      }

      setProgress(100);
      await simulateApiCall(200);

      return {
        success: processedCount > 0,
        message: `${data.action === 'assign' ? 'กำหนด' : data.action === 'unassign' ? 'ยกเลิกการกำหนด' : 'ตั้งเป็นค่าเริ่มต้น'}สำเร็จ ${processedCount} รายการ`,
        processedCount,
        failedCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        data: {
          action: data.action,
          prefixCount: data.prefixIds.length,
          roleCount: data.roleIds.length
        }
      };
    } catch (error) {
      console.error('Bulk prefix assignment failed:', error);
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการกำหนดคำนำหน้าชื่อ',
        processedCount: 0,
        failedCount: data.prefixIds.length,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    } finally {
      setIsProcessing(false);
      setCurrentOperation(null);
      setProgress(0);
    }
  }, []);

  // Bulk prefix modification
  const modifyPrefixes = useCallback(async (data: BulkPrefixModificationData): Promise<BulkPrefixOperationResult> => {
    setIsProcessing(true);
    setCurrentOperation('modify_prefixes');
    setProgress(0);

    try {
      const prefixCount = data.prefixIds.length;
      let processedCount = 0;
      const errors: string[] = [];

      for (const prefixId of data.prefixIds) {
        setProgress(Math.round((processedCount / prefixCount) * 100));
        await simulateApiCall(200);

        try {
          // In a real implementation, this would be an API call
          // await fetch(`/api/admin/prefixes/${prefixId}`, {
          //   method: 'PATCH',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify(data.changes)
          // });

          // Mock validation - some changes might fail
          if (data.changes.gender && Math.random() > 0.9) {
            errors.push(`ไม่สามารถเปลี่ยนเพศของคำนำหน้าชื่อ ID ${prefixId} ได้: ขัดแย้งกับการใช้งานปัจจุบัน`);
          } else {
            processedCount++;
          }
        } catch (error) {
          errors.push(`ไม่สามารถแก้ไขคำนำหน้าชื่อ ID ${prefixId} ได้: ${error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ'}`);
        }
      }

      setProgress(100);
      await simulateApiCall(200);

      return {
        success: processedCount > 0,
        message: `แก้ไขคำนำหน้าชื่อ ${processedCount} รายการเรียบร้อย`,
        processedCount,
        failedCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        data: { changes: data.changes }
      };
    } catch (error) {
      console.error('Bulk prefix modification failed:', error);
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการแก้ไขคำนำหน้าชื่อ',
        processedCount: 0,
        failedCount: data.prefixIds.length,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    } finally {
      setIsProcessing(false);
      setCurrentOperation(null);
      setProgress(0);
    }
  }, []);

  // Import prefixes from file
  const importPrefixes = useCallback(async (data: BulkPrefixImportData): Promise<BulkPrefixOperationResult> => {
    setIsProcessing(true);
    setCurrentOperation('import_prefixes');
    setProgress(0);

    try {
      // Read file content
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(data.file);
      });

      setProgress(25);
      await simulateApiCall(500);

      // Parse file content based on format
      let parsedData: any[];
      const fileExtension = data.file.name.split('.').pop()?.toLowerCase();

      switch (fileExtension) {
        case 'json':
          const jsonData = JSON.parse(fileContent);
          parsedData = Array.isArray(jsonData) ? jsonData : jsonData.prefixes || [jsonData];
          break;
        case 'csv':
          const lines = fileContent.split('\n');
          const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
          parsedData = lines.slice(1).filter(line => line.trim()).map(line => {
            const values = line.split(',').map(v => v.replace(/"/g, ''));
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header.toLowerCase().replace(' ', '_')] = values[index];
            });
            return obj;
          });
          break;
        default:
          throw new Error('รูปแบบไฟล์ไม่รองรับ');
      }

      setProgress(50);
      await simulateApiCall(500);

      // Validate and process data
      const validPrefixes = [];
      const errors = [];

      for (const prefixData of parsedData) {
        try {
          // Basic validation
          if (!prefixData.thai || !prefixData.english) {
            errors.push(`คำนำหน้าชื่อ ${prefixData.thai || 'ไม่ระบุ'}: ข้อมูลไม่ครบถ้วน`);
            continue;
          }

          // Gender validation if enabled
          if (data.validateGender && prefixData.gender) {
            const validGenders = ['male', 'female', 'neutral'];
            if (!validGenders.includes(prefixData.gender)) {
              errors.push(`คำนำหน้าชื่อ ${prefixData.thai}: เพศไม่ถูกต้อง - ${prefixData.gender}`);
              continue;
            }
          }

          // Category validation
          if (prefixData.category) {
            const validCategories = ['academic', 'professional', 'honorary', 'religious'];
            if (!validCategories.includes(prefixData.category)) {
              errors.push(`คำนำหน้าชื่อ ${prefixData.thai}: หมวดหมู่ไม่ถูกต้อง - ${prefixData.category}`);
              continue;
            }
          }

          // Check for duplicates if skipDuplicates is enabled
          if (data.skipDuplicates) {
            // In a real implementation, this would check against existing data
            // const exists = await checkPrefixExists(prefixData.thai, prefixData.english);
            // if (exists) continue;
          }

          validPrefixes.push({
            ...prefixData,
            category: prefixData.category || 'professional',
            gender: prefixData.gender || 'neutral',
            isDefault: false,
            isActive: true,
            sortOrder: validPrefixes.length
          });
        } catch (error) {
          errors.push(`คำนำหน้าชื่อ ${prefixData.thai || 'ไม่ระบุ'}: ${error instanceof Error ? error.message : 'ข้อผิดพลาดไม่ทราบสาเหตุ'}`);
        }
      }

      setProgress(75);
      await simulateApiCall(500);

      // Auto-assign roles if enabled
      if (data.autoAssignRoles) {
        // Mock role assignment based on category
        const roleAssignments = {
          academic: [1, 2], // Academic roles
          professional: [3, 4], // Professional roles
          honorary: [5], // Honorary roles
          religious: [6] // Religious roles
        };

        for (const prefix of validPrefixes) {
          const assignedRoles = roleAssignments[prefix.category as keyof typeof roleAssignments] || [];
          prefix.assignedRoles = assignedRoles;
        }
      }

      // In a real implementation, this would be API calls to save prefixes
      // for (const prefix of validPrefixes) {
      //   await fetch('/api/admin/prefixes', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(prefix)
      //   });
      // }

      setProgress(100);
      await simulateApiCall(300);

      return {
        success: true,
        message: `นำเข้าคำนำหน้าชื่อ ${validPrefixes.length} รายการเรียบร้อย`,
        processedCount: validPrefixes.length,
        failedCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        data: { importedPrefixes: validPrefixes }
      };
    } catch (error) {
      console.error('Bulk prefix import failed:', error);
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการนำเข้าคำนำหน้าชื่อ',
        processedCount: 0,
        failedCount: 1,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    } finally {
      setIsProcessing(false);
      setCurrentOperation(null);
      setProgress(0);
    }
  }, []);

  // Export prefixes
  const exportPrefixes = useCallback(async (data: BulkPrefixExportData): Promise<BulkPrefixOperationResult> => {
    setIsProcessing(true);
    setCurrentOperation('export_prefixes');
    setProgress(0);

    try {
      // Simulate data collection
      setProgress(25);
      await simulateApiCall(500);

      // Mock prefix data
      const mockPrefixData = data.prefixIds.map(id => ({
        id,
        thai: `คำนำหน้า ${id}`,
        english: `Title ${id}`,
        abbreviation: `T${id}`,
        category: ['academic', 'professional', 'honorary', 'religious'][id % 4],
        gender: ['male', 'female', 'neutral'][id % 3],
        isDefault: id <= 3,
        isActive: true,
        sortOrder: id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(data.includeAssignments && {
          assignments: [
            { roleId: 1, roleName: 'นักศึกษา', isDefault: true },
            { roleId: 2, roleName: 'อาจารย์', isDefault: false }
          ]
        })
      }));

      setProgress(50);
      await simulateApiCall(500);

      // Generate file content based on format
      const filename = `prefixes_export_${new Date().toISOString().split('T')[0]}.${data.format}`;
      let content: string;
      let mimeType: string;

      switch (data.format) {
        case 'json':
          content = JSON.stringify({
            exportedAt: new Date().toISOString(),
            includeAssignments: data.includeAssignments,
            includeMetadata: data.includeMetadata,
            prefixes: mockPrefixData
          }, null, 2);
          mimeType = 'application/json';
          break;

        case 'csv':
          const headers = ['ID', 'Thai', 'English', 'Abbreviation', 'Category', 'Gender', 'Is Default', 'Is Active'];
          if (data.includeAssignments) {
            headers.push('Assigned Roles');
          }
          if (data.includeMetadata) {
            headers.push('Created At', 'Updated At');
          }

          const csvRows = [
            headers.join(','),
            ...mockPrefixData.map(prefix => {
              const row = [
                prefix.id,
                `"${prefix.thai}"`,
                `"${prefix.english}"`,
                `"${prefix.abbreviation}"`,
                prefix.category,
                prefix.gender,
                prefix.isDefault,
                prefix.isActive
              ];

              if (data.includeAssignments && prefix.assignments) {
                row.push(`"${prefix.assignments.map((a: any) => a.roleName).join(';')}"`);
              }

              if (data.includeMetadata) {
                row.push(prefix.createdAt, prefix.updatedAt);
              }

              return row.join(',');
            })
          ];
          content = csvRows.join('\n');
          mimeType = 'text/csv';
          break;

        case 'excel':
          // For Excel, we'd typically use a library like xlsx
          content = JSON.stringify(mockPrefixData, null, 2);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;

        default:
          throw new Error('รูปแบบการส่งออกไม่รองรับ');
      }

      setProgress(75);
      await simulateApiCall(500);

      // Create download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setProgress(100);
      await simulateApiCall(200);

      return {
        success: true,
        message: `ส่งออกคำนำหน้าชื่อ ${data.prefixIds.length} รายการเรียบร้อย`,
        processedCount: data.prefixIds.length,
        failedCount: 0,
        data: { filename, format: data.format }
      };
    } catch (error) {
      console.error('Prefix export failed:', error);
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการส่งออกคำนำหน้าชื่อ',
        processedCount: 0,
        failedCount: data.prefixIds.length,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    } finally {
      setIsProcessing(false);
      setCurrentOperation(null);
      setProgress(0);
    }
  }, []);

  // Delete prefixes
  const deletePrefixes = useCallback(async (data: BulkPrefixDeletionData): Promise<BulkPrefixOperationResult> => {
    setIsProcessing(true);
    setCurrentOperation('delete_prefixes');
    setProgress(0);

    try {
      const prefixCount = data.prefixIds.length;
      let processedCount = 0;
      const errors: string[] = [];

      for (const prefixId of data.prefixIds) {
        setProgress(Math.round((processedCount / prefixCount) * 100));
        await simulateApiCall(200);

        try {
          // In a real implementation, this would be API calls
          // if (data.removeAssignments) {
          //   await fetch(`/api/admin/prefixes/${prefixId}/assignments`, {
          //     method: 'DELETE'
          //   });
          // }
          // await fetch(`/api/admin/prefixes/${prefixId}`, {
          //   method: 'DELETE'
          // });

          // Mock validation - default prefixes might not be deletable
          if (prefixId <= 3) { // Mock default prefixes
            errors.push(`ไม่สามารถลบคำนำหน้าชื่อ ID ${prefixId} ได้: เป็นค่าเริ่มต้นของระบบ`);
          } else {
            processedCount++;
          }
        } catch (error) {
          errors.push(`ไม่สามารถลบคำนำหน้าชื่อ ID ${prefixId} ได้: ${error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ'}`);
        }
      }

      setProgress(100);
      await simulateApiCall(300);

      return {
        success: processedCount > 0,
        message: `ลบคำนำหน้าชื่อ ${processedCount} รายการเรียบร้อย`,
        processedCount,
        failedCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        data: { deletedPrefixIds: data.prefixIds.slice(3) } // Mock successful deletions
      };
    } catch (error) {
      console.error('Bulk prefix deletion failed:', error);
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบคำนำหน้าชื่อ',
        processedCount: 0,
        failedCount: data.prefixIds.length,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    } finally {
      setIsProcessing(false);
      setCurrentOperation(null);
      setProgress(0);
    }
  }, []);

  // Set prefix defaults
  const setPrefixDefaults = useCallback(async (data: BulkPrefixDefaultsData): Promise<BulkPrefixOperationResult> => {
    setIsProcessing(true);
    setCurrentOperation('set_defaults');
    setProgress(0);

    try {
      const prefixCount = data.prefixIds.length;
      let processedCount = 0;

      for (const prefixId of data.prefixIds) {
        setProgress(Math.round((processedCount / prefixCount) * 100));
        await simulateApiCall(150);

        // In a real implementation, this would be an API call
        // await fetch(`/api/admin/prefixes/${prefixId}/default`, {
        //   method: 'PATCH',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     isDefault: data.defaultAction === 'set',
        //     scope: data.scope
        //   })
        // });

        processedCount++;
      }

      setProgress(100);
      await simulateApiCall(200);

      return {
        success: true,
        message: `${data.defaultAction === 'set' ? 'ตั้ง' : 'ยกเลิก'}ค่าเริ่มต้น ${processedCount} รายการเรียบร้อย`,
        processedCount,
        failedCount: 0,
        data: { 
          action: data.defaultAction, 
          scope: data.scope,
          affectedPrefixes: data.prefixIds
        }
      };
    } catch (error) {
      console.error('Prefix defaults operation failed:', error);
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการตั้งค่าเริ่มต้น',
        processedCount: 0,
        failedCount: data.prefixIds.length,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    } finally {
      setIsProcessing(false);
      setCurrentOperation(null);
      setProgress(0);
    }
  }, []);

  // Main bulk operation handler
  const executeBulkOperation = useCallback(async (operation: string, data: any): Promise<BulkPrefixOperationResult> => {
    switch (operation) {
      case 'assign_to_roles':
        return assignPrefixesToRoles(data);
      case 'modify_prefixes':
        return modifyPrefixes(data);
      case 'import_prefixes':
        return importPrefixes(data);
      case 'export_prefixes':
        return exportPrefixes(data);
      case 'delete_prefixes':
        return deletePrefixes(data);
      case 'set_defaults':
        return setPrefixDefaults(data);
      default:
        return {
          success: false,
          message: 'การดำเนินการไม่รองรับ',
          processedCount: 0,
          failedCount: 1,
          errors: [`Unknown operation: ${operation}`]
        };
    }
  }, [assignPrefixesToRoles, modifyPrefixes, importPrefixes, exportPrefixes, deletePrefixes, setPrefixDefaults]);

  return {
    isProcessing,
    progress,
    currentOperation,
    executeBulkOperation,
    assignPrefixesToRoles,
    modifyPrefixes,
    importPrefixes,
    exportPrefixes,
    deletePrefixes,
    setPrefixDefaults
  };
};

export default useBulkPrefixOperations;