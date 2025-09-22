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
  address: string;
}

interface VisitSchedule {
  id: number;
  student: Student;
  company: Company;
  visitDate: string;
  visitTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  createdAt: string;
}

export default function VisitorSchedulePage() {
  const [schedules, setSchedules] = useState<VisitSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'today'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockSchedules: VisitSchedule[] = [
          {
            id: 1,
            student: {
              id: 1,
              name: 'นายสมชาย ใจดี',
              studentId: '6400001'
            },
            company: {
              id: 1,
              companyNameTh: 'บริษัท เทคโนโลยี จำกัด',
              address: '123 ถนนเทคโนโลยี แขวงนวัตกรรม เขตดิจิทัล กรุงเทพฯ 10110'
            },
            visitDate: '2024-02-15',
            visitTime: '09:00 - 11:00',
            status: 'scheduled',
            createdAt: '2024-01-20'
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
              companyNameTh: 'บริษัท ซอฟต์แวร์ จำกัด',
              address: '456 ถนนซอฟต์แวร์ แขวงโปรแกรม เขตพัฒนา กรุงเทพฯ 10120'
            },
            visitDate: '2024-02-10',
            visitTime: '14:00 - 16:00',
            status: 'completed',
            notes: 'นักศึกษาปฏิบัติงานได้ดี มีความกระตือรือร้น',
            createdAt: '2024-01-15'
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
              companyNameTh: 'บริษัท นวัตกรรม จำกัด',
              address: '789 ถนนนวัตกรรม แขวงสร้างสรรค์ เขตอนาคต กรุงเทพฯ 10130'
            },
            visitDate: '2024-02-20',
            visitTime: '10:00 - 12:00',
            status: 'scheduled',
            createdAt: '2024-01-25'
          }
        ];
        
        setSchedules(mockSchedules);
      } catch (error) {
        console.error('Error fetching schedules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  
  const filteredSchedules = schedules.filter(schedule => {
    switch (filter) {
      case 'upcoming':
        return schedule.status === 'scheduled' && schedule.visitDate >= today;
      case 'completed':
        return schedule.status === 'completed';
      case 'today':
        return schedule.visitDate === today;
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'เสร็จสิ้น';
      case 'cancelled':
        return 'ยกเลิก';
      case 'rescheduled':
        return 'เลื่อนกำหนด';
      default:
        return 'กำหนดการ';
    }
  };

  const isToday = (date: string) => {
    return date === today;
  };

  const isPast = (date: string) => {
    return date < today;
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
          กำหนดการเยี่ยมนักศึกษา
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          จัดการและติดตามกำหนดการเยี่ยมนักศึกษาในสถานประกอบการ
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
          ทั้งหมด ({schedules.length})
        </button>
        <button
          onClick={() => setFilter('today')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'today'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          วันนี้ ({schedules.filter(s => s.visitDate === today).length})
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'upcoming'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          กำลังจะมาถึง ({schedules.filter(s => s.status === 'scheduled' && s.visitDate >= today).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          เสร็จสิ้น ({schedules.filter(s => s.status === 'completed').length})
        </button>
      </div>

      {/* Add New Schedule Button */}
      <div className="mb-6">
        <Link
          href="/visitor/schedule/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          เพิ่มกำหนดการใหม่
        </Link>
      </div>

      {/* Schedule Cards */}
      <div className="space-y-4">
        {filteredSchedules.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่มีกำหนดการ
            </h3>
            <p className="text-gray-500 text-sm">
              ไม่มีกำหนดการเยี่ยมที่ตรงกับเงื่อนไขที่เลือก
            </p>
          </div>
        ) : (
          filteredSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className={`bg-white p-4 sm:p-6 rounded-2xl shadow-sm border hover:shadow-md transition-shadow ${
                isToday(schedule.visitDate) ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
              }`}
            >
              <div className="flex flex-col lg:flex-row gap-4">
                
                {/* Main Content */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {schedule.student.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        รหัสนักศึกษา: {schedule.student.studentId}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                          {getStatusText(schedule.status)}
                        </span>
                        {isToday(schedule.visitDate) && (
                          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                            วันนี้
                          </span>
                        )}
                        {isPast(schedule.visitDate) && schedule.status === 'scheduled' && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            เลยกำหนด
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">สถานประกอบการ</h4>
                      <p className="text-gray-700">{schedule.company.companyNameTh}</p>
                      <p className="text-sm text-gray-600">{schedule.company.address}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-600">
                          {new Date(schedule.visitDate).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-600">{schedule.visitTime}</span>
                      </div>
                    </div>
                    
                    {schedule.notes && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">หมายเหตุ</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {schedule.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-48">
                  <Link
                    href={`/visitor/schedule/${schedule.id}`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-center"
                  >
                    รายละเอียด
                  </Link>
                  
                  {schedule.status === 'scheduled' && (
                    <>
                      <Link
                        href={`/visitor/schedule/${schedule.id}/edit`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium text-center"
                      >
                        แก้ไข
                      </Link>
                      
                      <Link
                        href={`/visitor/visits/new?schedule_id=${schedule.id}`}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium text-center"
                      >
                        บันทึกการเยี่ยม
                      </Link>
                    </>
                  )}
                  
                  {schedule.status === 'completed' && (
                    <Link
                      href={`/visitor/visits?student_id=${schedule.student.id}`}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium text-center"
                    >
                      ดูรายงาน
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {schedules.length > 0 && (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600">
              {schedules.filter(s => s.visitDate === today).length}
            </div>
            <div className="text-sm text-gray-600">วันนี้</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {schedules.filter(s => s.status === 'scheduled' && s.visitDate >= today).length}
            </div>
            <div className="text-sm text-gray-600">กำลังจะมาถึง</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">
              {schedules.filter(s => s.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">เสร็จสิ้น</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-red-600">
              {schedules.filter(s => s.status === 'scheduled' && s.visitDate < today).length}
            </div>
            <div className="text-sm text-gray-600">เลยกำหนด</div>
          </div>
        </div>
      )}
    </div>
  );
}