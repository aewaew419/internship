'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Mock data types
interface Student {
  id: number;
  name: string;
}

interface Visitor {
  id: number;
  name: string;
}

interface VisitorTraining {
  visitor: Visitor;
}

interface StudentEnroll {
  id: number;
  studentId: string;
  student: Student;
  visitor_training?: VisitorTraining[];
}

export default function AssignVisitorPage() {
  const [students, setStudents] = useState<StudentEnroll[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectedVisitorId, setSelectedVisitorId] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockStudents: StudentEnroll[] = [
          {
            id: 1,
            studentId: '6400001',
            student: {
              id: 1,
              name: 'นายสมชาย ใจดี'
            },
            visitor_training: []
          },
          {
            id: 2,
            studentId: '6400002',
            student: {
              id: 2,
              name: 'นางสาวสมหญิง รักเรียน'
            },
            visitor_training: [
              {
                visitor: {
                  id: 1,
                  name: 'อาจารย์สมศักดิ์ ใจดี'
                }
              }
            ]
          },
          {
            id: 3,
            studentId: '6400003',
            student: {
              id: 3,
              name: 'นายสมศักดิ์ ขยันเรียน'
            },
            visitor_training: []
          }
        ];

        const mockVisitors: Visitor[] = [
          { id: 1, name: 'อาจารย์สมศักดิ์ ใจดี' },
          { id: 2, name: 'อาจารย์สมหญิง รักงาน' },
          { id: 3, name: 'อาจารย์สมชาย ขยันสอน' }
        ];
        
        setStudents(mockStudents);
        setVisitors(mockVisitors);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const selectedCount = selected.size;
  const allSelected = students.length > 0 && selected.size === students.length;
  const someSelected = selected.size > 0 && selected.size < students.length;

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
      setSelected(new Set(students.map(s => s.id)));
    }
  };

  const clearSelection = () => {
    setSelected(new Set());
  };

  const assignSelected = async () => {
    if (selectedCount === 0 || !selectedVisitorId) return;
    
    setAssigning(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const selectedVisitor = visitors.find(v => v.id === selectedVisitorId);
      if (!selectedVisitor) return;

      // Update assignments for selected students
      setStudents(prev => prev.map(student => 
        selected.has(student.id) 
          ? { 
              ...student, 
              visitor_training: [{ visitor: selectedVisitor }]
            }
          : student
      ));
      
      clearSelection();
      setSelectedVisitorId(null);
    } catch (error) {
      console.error('Error assigning visitor:', error);
    } finally {
      setAssigning(false);
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
          มอบหมายอาจารย์นิเทศ
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          มอบหมายอาจารย์นิเทศให้กับนักศึกษาที่ได้รับอนุมัติฝึกงาน
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="text-sm text-gray-500">
          เลือกไว้ {selectedCount} รายการ
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedVisitorId ?? ""}
            onChange={(e) =>
              setSelectedVisitorId(
                e.target.value ? Number(e.target.value) : null
              )
            }
          >
            <option value="">เลือกอาจารย์นิเทศ…</option>
            {visitors.map((visitor) => (
              <option key={visitor.id} value={visitor.id}>
                {visitor.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={assignSelected}
              disabled={
                loading ||
                assigning ||
                selectedCount === 0 ||
                selectedVisitorId == null
              }
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {assigning ? 'กำลังมอบหมาย...' : 'มอบหมายให้ที่เลือก'}
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
                <th className="p-4 text-left font-medium text-gray-900">รหัสนักศึกษา</th>
                <th className="p-4 text-left font-medium text-gray-900">ชื่อ-สกุล</th>
                <th className="p-4 text-left font-medium text-gray-900">อาจารย์นิเทศ</th>
                <th className="p-4 text-left font-medium text-gray-900">ข้อมูลเพิ่มเติม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selected.has(student.id)}
                      onChange={() => toggleRow(student.id)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </td>
                  <td className="p-4 font-medium text-gray-900">
                    {student.studentId}
                  </td>
                  <td className="p-4 text-gray-600">
                    {student.student.name}
                  </td>
                  <td className="p-4">
                    {student.visitor_training?.[0]?.visitor.name ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        {student.visitor_training[0].visitor.name}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        ยังไม่มอบหมาย
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/instructor/assign-visitor/${student.id}?enroll_id=${student.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      ดูข้อมูล
                    </Link>
                  </td>
                </tr>
              ))}
              
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    ไม่มีข้อมูลนักศึกษา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {students.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่มีข้อมูลนักศึกษา
            </h3>
            <p className="text-gray-500 text-sm">
              ยังไม่มีนักศึกษาที่ต้องมอบหมายอาจารย์นิเทศ
            </p>
          </div>
        ) : (
          students.map((student) => (
            <div
              key={student.id}
              className="bg-white p-4 rounded-2xl shadow-sm border"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(student.id)}
                  onChange={() => toggleRow(student.id)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded mt-1"
                />
                
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">
                      {student.student.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      รหัสนักศึกษา: {student.studentId}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">อาจารย์นิเทศ:</p>
                    {student.visitor_training?.[0]?.visitor.name ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        {student.visitor_training[0].visitor.name}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        ยังไม่มอบหมาย
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Link
                      href={`/instructor/assign-visitor/${student.id}?enroll_id=${student.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      ดูข้อมูล
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