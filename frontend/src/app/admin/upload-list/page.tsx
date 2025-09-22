'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock data types
interface Student {
  id: number;
  name: string;
  studentId: string;
  email: string;
  phoneNumber: string;
}

interface Faculty {
  id: number;
  facultyNameTh: string;
}

interface Program {
  id: number;
  programNameTh: string;
}

interface StudentRecord {
  id: number;
  student: Student;
  faculty: Faculty;
  program: Program;
  gpax: number;
  status: 'active' | 'inactive' | 'graduated';
  enrollmentYear: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUploadListPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'graduated'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const faculties = [
    { id: 1, name: 'คณะวิศวกรรมศาสตร์' },
    { id: 2, name: 'คณะบริหารธุรกิจ' },
    { id: 3, name: 'คณะเทคโนโลยีสารสนเทศ' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockStudents: StudentRecord[] = [
          {
            id: 1,
            student: {
              id: 1,
              name: 'นายสมชาย ใจดี',
              studentId: '6400001',
              email: 'somchai@email.com',
              phoneNumber: '081-234-5678'
            },
            faculty: {
              id: 1,
              facultyNameTh: 'คณะวิศวกรรมศาสตร์'
            },
            program: {
              id: 1,
              programNameTh: 'วิศวกรรมคอมพิวเตอร์'
            },
            gpax: 3.45,
            status: 'active',
            enrollmentYear: 2021,
            createdAt: '2024-01-15',
            updatedAt: '2024-02-01'
          },
          {
            id: 2,
            student: {
              id: 2,
              name: 'นางสาวสมหญิง รักเรียน',
              studentId: '6400002',
              email: 'somying@email.com',
              phoneNumber: '082-345-6789'
            },
            faculty: {
              id: 2,
              facultyNameTh: 'คณะบริหารธุรกิจ'
            },
            program: {
              id: 2,
              programNameTh: 'การจัดการธุรกิจ'
            },
            gpax: 3.78,
            status: 'active',
            enrollmentYear: 2021,
            createdAt: '2024-01-16',
            updatedAt: '2024-02-02'
          },
          {
            id: 3,
            student: {
              id: 3,
              name: 'นายสมศักดิ์ ขยันเรียน',
              studentId: '6300001',
              email: 'somsak@email.com',
              phoneNumber: '083-456-7890'
            },
            faculty: {
              id: 3,
              facultyNameTh: 'คณะเทคโนโลยีสารสนเทศ'
            },
            program: {
              id: 3,
              programNameTh: 'เทคโนโลยีสารสนเทศ'
            },
            gpax: 3.92,
            status: 'graduated',
            enrollmentYear: 2020,
            createdAt: '2024-01-10',
            updatedAt: '2024-01-25'
          }
        ];
        
        setStudents(mockStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredStudents = students.filter(student => {
    const matchesFilter = filter === 'all' || student.status === filter;
    const matchesSearch = searchTerm === '' || 
      student.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student.studentId.includes(searchTerm);
    const matchesFaculty = selectedFaculty === '' || student.faculty.id.toString() === selectedFaculty;
    
    return matchesFilter && matchesSearch && matchesFaculty;
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Mock file upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock adding new students from uploaded file
      const newStudents: StudentRecord[] = [
        {
          id: students.length + 1,
          student: {
            id: students.length + 1,
            name: 'นายใหม่ จากไฟล์',
            studentId: '6400999',
            email: 'new@email.com',
            phoneNumber: '084-567-8901'
          },
          faculty: {
            id: 1,
            facultyNameTh: 'คณะวิศวกรรมศาสตร์'
          },
          program: {
            id: 1,
            programNameTh: 'วิศวกรรมคอมพิวเตอร์'
          },
          gpax: 3.25,
          status: 'active',
          enrollmentYear: 2024,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      setStudents(prev => [...prev, ...newStudents]);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleExport = () => {
    // Mock export functionality
    console.log('Exporting student data...');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'graduated':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'กำลังศึกษา';
      case 'graduated':
        return 'จบการศึกษา';
      default:
        return 'ไม่ใช้งาน';
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
          จัดการรายชื่อนักศึกษา
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          อัปโหลดและจัดการข้อมูลนักศึกษาในระบบ
        </p>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* Upload Section */}
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-3">อัปโหลดไฟล์นักศึกษา</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
              </div>
              <button
                onClick={handleExport}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                ส่งออกข้อมูล
              </button>
            </div>
            {uploading && (
              <div className="mt-2 text-sm text-blue-600">
                กำลังอัปโหลดไฟล์...
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              รองรับไฟล์ Excel (.xlsx, .xls) และ CSV เท่านั้น
            </p>
          </div>

          {/* Quick Stats */}
          <div className="lg:w-64">
            <h3 className="font-medium text-gray-900 mb-3">สถิติรวม</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-blue-50 p-2 rounded">
                <div className="text-lg font-bold text-blue-600">
                  {students.filter(s => s.status === 'active').length}
                </div>
                <div className="text-xs text-blue-700">กำลังศึกษา</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <div className="text-lg font-bold text-green-600">
                  {students.filter(s => s.status === 'graduated').length}
                </div>
                <div className="text-xs text-green-700">จบการศึกษา</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-lg font-bold text-gray-600">
                  {students.length}
                </div>
                <div className="text-xs text-gray-700">ทั้งหมด</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ค้นหา
            </label>
            <input
              type="text"
              placeholder="ค้นหาชื่อหรือรหัสนักศึกษา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Faculty Filter */}
          <div className="lg:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              คณะ
            </label>
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">ทุกคณะ</option>
              {faculties.map(faculty => (
                <option key={faculty.id} value={faculty.id.toString()}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะ
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">ทั้งหมด</option>
              <option value="active">กำลังศึกษา</option>
              <option value="graduated">จบการศึกษา</option>
              <option value="inactive">ไม่ใช้งาน</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        แสดง {filteredStudents.length} จาก {students.length} รายการ
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left font-medium text-gray-900">รหัสนักศึกษา</th>
                <th className="p-4 text-left font-medium text-gray-900">ชื่อ-สกุล</th>
                <th className="p-4 text-left font-medium text-gray-900">คณะ/สาขา</th>
                <th className="p-4 text-left font-medium text-gray-900">เกรดเฉลี่ย</th>
                <th className="p-4 text-left font-medium text-gray-900">ปีที่เข้าศึกษา</th>
                <th className="p-4 text-left font-medium text-gray-900">สถานะ</th>
                <th className="p-4 text-right font-medium text-gray-900">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">
                    {record.student.studentId}
                  </td>
                  <td className="p-4 text-gray-600">
                    {record.student.name}
                  </td>
                  <td className="p-4 text-gray-600">
                    <div>
                      <div className="font-medium">{record.faculty.facultyNameTh}</div>
                      <div className="text-xs text-gray-500">{record.program.programNameTh}</div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">
                    <span className={`font-medium ${
                      record.gpax >= 3.5 ? 'text-green-600' : 
                      record.gpax >= 3.0 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {record.gpax.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {record.enrollmentYear + 543}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {getStatusText(record.status)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/admin/upload-list/${record.id}`}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                    >
                      รายละเอียด
                    </Link>
                  </td>
                </tr>
              ))}
              
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    ไม่พบข้อมูลนักศึกษา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {filteredStudents.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่พบข้อมูลนักศึกษา
            </h3>
            <p className="text-gray-500 text-sm">
              ไม่มีนักศึกษาที่ตรงกับเงื่อนไขที่เลือก
            </p>
          </div>
        ) : (
          filteredStudents.map((record) => (
            <div
              key={record.id}
              className="bg-white p-4 rounded-2xl shadow-sm border"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">
                      {record.student.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      รหัสนักศึกษา: {record.student.studentId}
                    </p>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                    {getStatusText(record.status)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">คณะ:</p>
                    <p className="text-gray-600">{record.faculty.facultyNameTh}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">สาขา:</p>
                    <p className="text-gray-600">{record.program.programNameTh}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">เกรดเฉลี่ย:</p>
                    <p className={`font-medium ${
                      record.gpax >= 3.5 ? 'text-green-600' : 
                      record.gpax >= 3.0 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {record.gpax.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">ปีที่เข้าศึกษา:</p>
                    <p className="text-gray-600">{record.enrollmentYear + 543}</p>
                  </div>
                </div>
                
                <div className="flex justify-end pt-2 border-t">
                  <Link
                    href={`/admin/upload-list/${record.id}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    รายละเอียด
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