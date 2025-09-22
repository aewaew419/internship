'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  ArrowUpTrayIcon, 
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    data: any;
  }>;
}

interface ImportPreview {
  headers: string[];
  data: any[][];
  totalRows: number;
}

export default function BulkImportUsersPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!validTypes.includes(selectedFile.type)) {
      alert('กรุณาเลือกไฟล์ Excel (.xlsx, .xls) หรือ CSV (.csv) เท่านั้น');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    setFile(selectedFile);
    generatePreview(selectedFile);
  };

  const generatePreview = async (file: File) => {
    try {
      // Mock preview generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockPreview: ImportPreview = {
        headers: ['username', 'email', 'firstName', 'lastName', 'role', 'department', 'studentId'],
        data: [
          ['student001', 'somchai@student.university.ac.th', 'สมชาย', 'ใจดี', 'student', 'วิทยาการคอมพิวเตอร์', '65010001'],
          ['student002', 'malee@student.university.ac.th', 'มาลี', 'ขยัน', 'student', 'วิศวกรรมซอฟต์แวร์', '65010002'],
          ['instructor001', 'dr.somying@university.ac.th', 'ดร.สมหญิง', 'รักการสอน', 'instructor', 'วิทยาการคอมพิวเตอร์', ''],
          ['student003', 'preecha@student.university.ac.th', 'ปรีชา', 'มานะ', 'student', 'เทคโนโลยีสารสนเทศ', '65010003']
        ],
        totalRows: 4
      };
      
      setPreview(mockPreview);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์');
    }
  };

  const handleImport = async () => {
    if (!file || !preview) return;

    try {
      setImporting(true);
      
      // Mock import process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockResult: ImportResult = {
        success: 3,
        failed: 1,
        errors: [
          {
            row: 2,
            field: 'email',
            message: 'อีเมลซ้ำกับที่มีอยู่ในระบบ',
            data: { email: 'malee@student.university.ac.th' }
          }
        ]
      };
      
      setResult(mockResult);
    } catch (error) {
      console.error('Error importing users:', error);
      alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const downloadTemplate = () => {
    // Mock template download
    const csvContent = `username,email,firstName,lastName,role,department,studentId
student001,somchai@student.university.ac.th,สมชาย,ใจดี,student,วิทยาการคอมพิวเตอร์,65010001
instructor001,dr.somying@university.ac.th,ดร.สมหญิง,รักการสอน,instructor,วิทยาการคอมพิวเตอร์,`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'user-import-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetImport = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/users"
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">นำเข้าผู้ใช้จาก Excel</h1>
          <p className="text-gray-600">นำเข้าข้อมูลผู้ใช้หลายคนพร้อมกันจากไฟล์ Excel หรือ CSV</p>
        </div>
      </div>

      {!result ? (
        <div className="space-y-6">
          
          {/* Instructions */}
          <div className="admin-dashboard-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">วิธีการนำเข้าข้อมูล</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">ดาวน์โหลดไฟล์ตัวอย่าง</h3>
                  <p className="text-sm text-gray-600">ดาวน์โหลดไฟล์ตัวอย่างเพื่อดูรูปแบบข้อมูลที่ถูกต้อง</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">เตรียมข้อมูล</h3>
                  <p className="text-sm text-gray-600">กรอกข้อมูลผู้ใช้ในไฟล์ Excel หรือ CSV ตามรูปแบบที่กำหนด</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">อัปโหลดและนำเข้า</h3>
                  <p className="text-sm text-gray-600">อัปโหลดไฟล์และตรวจสอบข้อมูลก่อนนำเข้าสู่ระบบ</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={downloadTemplate}
                className="admin-action-button bg-green-600 hover:bg-green-700"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                ดาวน์โหลดไฟล์ตัวอย่าง
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div className="admin-dashboard-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">อัปโหลดไฟล์</h2>
            
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                รองรับไฟล์ Excel (.xlsx, .xls) และ CSV (.csv) ขนาดไม่เกิน 5MB
              </p>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="admin-action-button"
              >
                เลือกไฟล์
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </div>

            {file && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <DocumentArrowDownIcon className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">{file.name}</p>
                    <p className="text-sm text-blue-700">
                      ขนาด: {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={resetImport}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    เปลี่ยนไฟล์
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="admin-dashboard-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  ตัวอย่างข้อมูล ({preview.totalRows} แถว)
                </h2>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="admin-action-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      กำลังนำเข้า...
                    </>
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="w-4 h-4" />
                      นำเข้าข้อมูล
                    </>
                  )}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-medium text-gray-900">#</th>
                      {preview.headers.map((header, index) => (
                        <th key={index} className="text-left py-2 px-3 font-medium text-gray-900">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.data.slice(0, 5).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-gray-500">{rowIndex + 1}</td>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="py-2 px-3 text-gray-900">
                            {cell || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {preview.totalRows > 5 && (
                <p className="text-sm text-gray-500 mt-3">
                  แสดง 5 แถวแรก จากทั้งหมด {preview.totalRows} แถว
                </p>
              )}
            </div>
          )}

          {/* Requirements */}
          <div className="admin-dashboard-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อกำหนดข้อมูล</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>username:</strong> ชื่อผู้ใช้ (ห้ามซ้ำ, อย่างน้อย 3 ตัวอักษร)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>email:</strong> อีเมล (รูปแบบถูกต้อง, ห้ามซ้ำ)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>firstName, lastName:</strong> ชื่อและนามสกุล (จำเป็น)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>role:</strong> บทบาท (student, instructor, admin, committee, visitor)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>department:</strong> ภาควิชา (ไม่บังคับ)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>studentId:</strong> รหัสนักศึกษา (จำเป็นสำหรับ role = student)</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Import Results */
        <div className="space-y-6">
          
          {/* Summary */}
          <div className="admin-dashboard-card">
            <div className="text-center py-8">
              {result.failed === 0 ? (
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              ) : (
                <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              )}
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                การนำเข้าข้อมูลเสร็จสิ้น
              </h2>
              
              <div className="flex justify-center gap-8 mt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{result.success}</div>
                  <div className="text-sm text-gray-600">สำเร็จ</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{result.failed}</div>
                  <div className="text-sm text-gray-600">ล้มเหลว</div>
                </div>
              </div>
            </div>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="admin-dashboard-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ข้อผิดพลาด ({result.errors.length} รายการ)
              </h3>
              
              <div className="space-y-3">
                {result.errors.map((error, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-900">
                        แถวที่ {error.row}: {error.message}
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        ฟิลด์: {error.field}
                      </p>
                      {error.data && (
                        <p className="text-xs text-red-600 mt-1 font-mono">
                          ข้อมูล: {JSON.stringify(error.data)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <button
              onClick={resetImport}
              className="admin-action-button bg-gray-600 hover:bg-gray-700"
            >
              นำเข้าไฟล์ใหม่
            </button>
            
            <Link
              href="/admin/users"
              className="admin-action-button"
            >
              ไปยังรายการผู้ใช้
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}