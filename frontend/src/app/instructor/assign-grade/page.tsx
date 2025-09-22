'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock data types
interface Student {
  id: number;
  name: string;
  studentId: string;
}

interface Company {
  id: number;
  companyNameTh: string;
}

interface StudentTraining {
  id: number;
  student: Student;
  company: Company;
  grade?: string;
  gradePoints?: number;
  status: 'in_progress' | 'completed' | 'graded';
  startDate?: string;
  endDate?: string;
}

export default function AssignGradePage() {
  const [trainings, setTrainings] = useState<StudentTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockTrainings: StudentTraining[] = [
          {
            id: 1,
            student: {
              id: 1,
              name: 'นายสมชาย ใจดี',
              studentId: '6400001'
            },
            company: {
              id: 1,
              companyNameTh: 'บริษัท เทคโนโลยี จำกัด'
            },
            status: 'completed',
            startDate: '2024-01-15',
            endDate: '2024-04-15'
          },
          {
            id: 2,
            student: {
              id: 2,
              name: 'นางสาวสมหญิง รักเรียน',
              studentId: '6400002'
            },
            company: {
              id: 2,
              companyNameTh: 'บริษัท ซอฟต์แวร์ จำกัด'
            },
            status: 'graded',
            grade: 'A',
            gradePoints: 4.0,
            startDate: '2024-01-10',
            endDate: '2024-04-10'
          },
          {
            id: 3,
            student: {
              id: 3,
              name: 'นายสมศักดิ์ ขยันเรียน',
              studentId: '6400003'
            },
            company: {
              id: 3,
              companyNameTh: 'บริษัท นวัตกรรม จำกัด'
            },
            status: 'in_progress',
            startDate: '2024-02-01',
            endDate: '2024-05-01'
          }
        ];
        
        setTrainings(mockTrainings);
      } catch (error) {
        console.error('Error fetching trainings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredTrainings = trainings.filter(training => {
    switch (filter) {
      case 'pending':
        return training.status === 'completed';
      case 'graded':
        return training.status === 'graded';
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'graded':
        return 'ให้คะแนนแล้ว';
      case 'completed':
        return 'รอให้คะแนน';
      default:
        return 'กำลังฝึกงาน';
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
          ให้คะแนนนักศึกษา
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          ให้คะแนนและประเมินผลการฝึกงานของนักศึกษา
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ทั้งหมด ({trainings.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          รอให้คะแนน ({trainings.filter(t => t.status === 'completed').length})
        </button>
        <button
          onClick={() => setFilter('graded')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'graded'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ให้คะแนนแล้ว ({trainings.filter(t => t.status === 'graded').length})
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left font-medium text-gray-900">รหัสนักศึกษา</th>
                <th className="p-4 text-left font-medium text-gray-900">ชื่อ-สกุล</th>
                <th className="p-4 text-left font-medium text-gray-900">บริษัท</th>
                <th className="p-4 text-left font-medium text-gray-900">ระยะเวลา</th>
                <th className="p-4 text-left font-medium text-gray-900">เกรด</th>
                <th className="p-4 text-left font-medium text-gray-900">สถานะ</th>
                <th className="p-4 text-right font-medium text-gray-900">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTrainings.map((training) => (
                <tr key={training.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">
                    {training.student.studentId}
                  </td>
                  <td className="p-4 text-gray-600">
                    {training.student.name}
                  </td>
                  <td className="p-4 text-gray-600">
                    {training.company.companyNameTh}
                  </td>
                  <td className="p-4 text-gray-600 text-xs">
                    {training.startDate && training.endDate && (
                      <>
                        {new Date(training.startDate).toLocaleDateString('th-TH', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: '2-digit' 
                        })}
                        {' - '}
                        {new Date(training.endDate).toLocaleDateString('th-TH', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: '2-digit' 
                        })}
                      </>
                    )}
                  </td>
                  <td className="p-4">
                    {training.grade ? (
                      <div className="text-center">
                        <span className="font-bold text-lg text-green-600">
                          {training.grade}
                        </span>
                        <div className="text-xs text-gray-500">
                          ({training.gradePoints?.toFixed(1)})
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(training.status)}`}>
                      {getStatusText(training.status)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/instructor/assign-grade/${training.id}`}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        training.status === 'graded'
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : training.status === 'completed'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {training.status === 'graded' ? 'ดูคะแนน' : 
                       training.status === 'completed' ? 'ให้คะแนน' : 'รอเสร็จสิ้น'}
                    </Link>
                  </td>
                </tr>
              ))}
              
              {filteredTrainings.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    ไม่มีข้อมูลการฝึกงาน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {filteredTrainings.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่มีข้อมูลการฝึกงาน
            </h3>
            <p className="text-gray-500 text-sm">
              ไม่มีนักศึกษาที่ตรงกับเงื่อนไขที่เลือก
            </p>
          </div>
        ) : (
          filteredTrainings.map((training) => (
            <div
              key={training.id}
              className="bg-white p-4 rounded-2xl shadow-sm border"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">
                      {training.student.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      รหัสนักศึกษา: {training.student.studentId}
                    </p>
                  </div>
                  
                  {training.grade && (
                    <div className="text-center">
                      <span className="font-bold text-xl text-green-600">
                        {training.grade}
                      </span>
                      <div className="text-xs text-gray-500">
                        ({training.gradePoints?.toFixed(1)})
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">บริษัท:</p>
                  <p className="text-sm text-gray-600">{training.company.companyNameTh}</p>
                </div>
                
                {training.startDate && training.endDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">ระยะเวลา:</p>
                    <p className="text-xs text-gray-600">
                      {new Date(training.startDate).toLocaleDateString('th-TH')}
                      {' - '}
                      {new Date(training.endDate).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(training.status)}`}>
                    {getStatusText(training.status)}
                  </span>
                  
                  <Link
                    href={`/instructor/assign-grade/${training.id}`}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      training.status === 'graded'
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : training.status === 'completed'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {training.status === 'graded' ? 'ดูคะแนน' : 
                     training.status === 'completed' ? 'ให้คะแนน' : 'รอเสร็จสิ้น'}
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}