'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Mock data types
interface Student {
  id: number;
  name: string;
  studentId: string;
}

interface StudentEnroll {
  id: number;
  student: Student;
}

interface InternRequest {
  id: number;
  student_enroll: StudentEnroll;
  status: 'pending' | 'approve' | 'denied';
  submittedAt?: string;
}

export default function InstructorInternRequestPage() {
  const [requests, setRequests] = useState<InternRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockData: InternRequest[] = [
          {
            id: 1,
            student_enroll: {
              id: 1,
              student: {
                id: 1,
                name: 'นายสมชาย ใจดี',
                studentId: '6400001'
              }
            },
            status: 'pending',
            submittedAt: '2024-01-15'
          },
          {
            id: 2,
            student_enroll: {
              id: 2,
              student: {
                id: 2,
                name: 'นางสาวสมหญิง รักเรียน',
                studentId: '6400002'
              }
            },
            status: 'approve',
            submittedAt: '2024-01-14'
          },
          {
            id: 3,
            student_enroll: {
              id: 3,
              student: {
                id: 3,
                name: 'นายสมศักดิ์ ขยันเรียน',
                studentId: '6400003'
              }
            },
            status: 'pending',
            submittedAt: '2024-01-13'
          }
        ];
        
        setRequests(mockData);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const selectedCount = selected.size;
  const allSelected = requests.length > 0 && selected.size === requests.length;
  const someSelected = selected.size > 0 && selected.size < requests.length;

  // Update indeterminate state
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const toggleRow = (id: number) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(requests.map(r => r.id)));
    }
  };

  const clearSelection = () => {
    setSelected(new Set());
  };

  const bulkApprove = async () => {
    if (selectedCount === 0) return;
    
    setBulkActionLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update status for selected items
      setRequests(prev => prev.map(request => 
        selected.has(request.id) 
          ? { ...request, status: 'approve' as const }
          : request
      ));
      
      clearSelection();
    } catch (error) {
      console.error('Error approving requests:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approve':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approve':
        return 'อนุมัติ';
      case 'denied':
        return 'ปฏิเสธ';
      default:
        return 'รอพิจารณา';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          รายการขอฝึกงาน / สหกิจศึกษา
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          จัดการคำร้องขอฝึกงานและสหกิจศึกษาของนักศึกษา
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="text-sm text-gray-500">
          เลือกไว้ {selectedCount} รายการ
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={bulkApprove}
            disabled={selectedCount === 0 || bulkActionLoading}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {bulkActionLoading ? 'กำลังอนุมัติ...' : 'อนุมัติที่เลือก'}
          </button>
          
          <button
            type="button"
            onClick={clearSelection}
            disabled={selectedCount === 0}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            ล้างการเลือก
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 w-12">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                  />
                </th>
                <th className="p-4 text-left font-medium text-gray-900">ชื่อ-สกุล</th>
                <th className="p-4 text-left font-medium text-gray-900">รหัสนักศึกษา</th>
                <th className="p-4 text-left font-medium text-gray-900">สถานะ</th>
                <th className="p-4 text-right font-medium text-gray-900">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selected.has(request.id)}
                      onChange={() => toggleRow(request.id)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </td>
                  <td className="p-4 font-medium text-gray-900">
                    {request.student_enroll.student.name}
                  </td>
                  <td className="p-4 text-gray-600">
                    {request.student_enroll.student.studentId}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/instructor/intern-request/${request.id}?enroll_id=${request.student_enroll.id}`}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                    >
                      รายละเอียด
                    </Link>
                  </td>
                </tr>
              ))}
              
              {requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    ไม่มีข้อมูลคำร้องขอฝึกงาน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {requests.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่มีข้อมูลคำร้องขอฝึกงาน
            </h3>
            <p className="text-gray-500 text-sm">
              ยังไม่มีนักศึกษายื่นคำร้องขอฝึกงานหรือสหกิจศึกษา
            </p>
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className="bg-white p-4 rounded-2xl shadow-sm border"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(request.id)}
                  onChange={() => toggleRow(request.id)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded mt-1"
                />
                
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">
                      {request.student_enroll.student.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      รหัสนักศึกษา: {request.student_enroll.student.studentId}
                    </p>
                    {request.submittedAt && (
                      <p className="text-xs text-gray-500">
                        ยื่นเมื่อ: {new Date(request.submittedAt).toLocaleDateString('th-TH')}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                    
                    <Link
                      href={`/instructor/intern-request/${request.id}?enroll_id=${request.student_enroll.id}`}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                    >
                      รายละเอียด
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}