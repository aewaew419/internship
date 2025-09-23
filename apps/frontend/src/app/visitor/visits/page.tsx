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

interface VisitReport {
  id: number;
  student: Student;
  company: Company;
  visitDate: string;
  visitTime: string;
  duration: string;
  attendees: string[];
  summary: string;
  studentPerformance: string;
  companyFeedback: string;
  recommendations: string;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function VisitorVisitsPage() {
  const [visits, setVisits] = useState<VisitReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'recent' | 'this_month'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockVisits: VisitReport[] = [
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
            visitDate: '2024-02-10',
            visitTime: '09:00 - 11:00',
            duration: '2 ชั่วโมง',
            attendees: ['นายสมชาย ใจดี (นักศึกษา)', 'นางสาวจันทร์ ใจดี (พี่เลี้ยง)', 'นายสมศักดิ์ ขยันสอน (อาจารย์นิเทศ)'],
            summary: 'เยี่ยมนักศึกษาในช่วงสัปดาห์ที่ 6 ของการฝึกงาน นักศึกษาได้รับมอบหมายงานพัฒนาเว็บไซต์ขององค์กร',
            studentPerformance: 'นักศึกษามีความกระตือรือร้นในการทำงาน สามารถปรับตัวเข้ากับสภาพแวดล้อมการทำงานได้ดี มีการเรียนรู้และพัฒนาทักษะอย่างต่อเนื่อง',
            companyFeedback: 'บริษัทพอใจกับผลงานของนักศึกษา เห็นว่ามีศักยภาพในการพัฒนาต่อไป และเสนอให้ขยายขอบเขตงานเพิ่มเติม',
            recommendations: 'แนะนำให้นักศึกษาศึกษาเทคโนโลยีใหม่ๆ เพิ่มเติม และฝึกฝนทักษะการนำเสนอผลงาน',
            photos: ['photo1.jpg', 'photo2.jpg'],
            createdAt: '2024-02-10',
            updatedAt: '2024-02-10'
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
            visitDate: '2024-02-08',
            visitTime: '14:00 - 16:00',
            duration: '2 ชั่วโมง',
            attendees: ['นางสาวสมหญิง รักเรียน (นักศึกษา)', 'นายวิชาญ เก่งงาน (หัวหน้าแผนก)', 'อาจารย์สมหญิง รักงาน (อาจารย์นิเทศ)'],
            summary: 'เยี่ยมนักศึกษาในช่วงกลางของการฝึกงาน ติดตามความก้าวหน้าในการทำงานและการปรับตัว',
            studentPerformance: 'นักศึกษาแสดงความสามารถในการทำงานเป็นทีมได้ดี มีความรับผิดชอบสูง และสามารถแก้ไขปัญหาเฉพาะหน้าได้',
            companyFeedback: 'บริษัทประทับใจในตัวนักศึกษา เห็นว่ามีความตั้งใจและความพยายามในการเรียนรู้สูง',
            recommendations: 'ควรเพิ่มการฝึกฝนด้านการวิเคราะห์ข้อมูล และการใช้เครื่องมือใหม่ๆ ในการทำงาน',
            createdAt: '2024-02-08',
            updatedAt: '2024-02-08'
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
            visitDate: '2024-01-25',
            visitTime: '10:00 - 12:00',
            duration: '2 ชั่วโมง',
            attendees: ['นายสมศักดิ์ ขยันเรียน (นักศึกษา)', 'นางสาวนวัตกรรม สร้างสรรค์ (พี่เลี้ยง)', 'อาจารย์สมศักดิ์ ขยันสอน (อาจารย์นิเทศ)'],
            summary: 'การเยี่ยมครั้งแรกเพื่อติดตามการปรับตัวของนักศึกษาในสัปดาห์แรกของการฝึกงาน',
            studentPerformance: 'นักศึกษายังอยู่ในช่วงปรับตัว แต่แสดงความกระตือรือร้นในการเรียนรู้งานใหม่ๆ',
            companyFeedback: 'บริษัทให้การต้อนรับที่ดี และมีแผนการฝึกอบรมที่ชัดเจนสำหรับนักศึกษา',
            recommendations: 'แนะนำให้นักศึกษาศึกษาข้อมูลเพิ่มเติมเกี่ยวกับธุรกิจของบริษัท และตั้งเป้าหมายการเรียนรู้ที่ชัดเจน',
            createdAt: '2024-01-25',
            updatedAt: '2024-01-25'
          }
        ];
        
        setVisits(mockVisits);
      } catch (error) {
        console.error('Error fetching visits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const filteredVisits = visits.filter(visit => {
    const visitDate = new Date(visit.visitDate);
    
    switch (filter) {
      case 'recent':
        return visitDate >= oneWeekAgo;
      case 'this_month':
        return visitDate.getMonth() === thisMonth && visitDate.getFullYear() === thisYear;
      default:
        return true;
    }
  });

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
          รายงานการเยี่ยมนักศึกษา
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          ดูและจัดการรายงานการเยี่ยมนักศึกษาในสถานประกอบการ
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
          ทั้งหมด ({visits.length})
        </button>
        <button
          onClick={() => setFilter('recent')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'recent'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          7 วันที่ผ่านมา ({visits.filter(v => new Date(v.visitDate) >= oneWeekAgo).length})
        </button>
        <button
          onClick={() => setFilter('this_month')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'this_month'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          เดือนนี้ ({visits.filter(v => {
            const d = new Date(v.visitDate);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
          }).length})
        </button>
      </div>

      {/* Add New Visit Button */}
      <div className="mb-6">
        <Link
          href="/visitor/visits/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          เพิ่มรายงานการเยี่ยม
        </Link>
      </div>

      {/* Visit Reports */}
      <div className="space-y-6">
        {filteredVisits.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่มีรายงานการเยี่ยม
            </h3>
            <p className="text-gray-500 text-sm">
              ไม่มีรายงานการเยี่ยมที่ตรงกับเงื่อนไขที่เลือก
            </p>
          </div>
        ) : (
          filteredVisits.map((visit) => (
            <div
              key={visit.id}
              className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      การเยี่ยม: {visit.student.name}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>รหัสนักศึกษา: {visit.student.studentId}</p>
                      <p>บริษัท: {visit.company.companyNameTh}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="text-sm text-gray-600">
                      {new Date(visit.visitDate).toLocaleDateString('th-TH')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {visit.visitTime}
                    </div>
                  </div>
                </div>

                {/* Visit Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">สรุปการเยี่ยม</h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg leading-relaxed">
                        {visit.summary}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">ผู้เข้าร่วม</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {visit.attendees.map((attendee, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            {attendee}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {visit.photos && visit.photos.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">รูปภาพ</h4>
                        <div className="flex gap-2">
                          {visit.photos.map((photo, index) => (
                            <div
                              key={index}
                              className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center"
                            >
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">ผลการปฏิบัติงานของนักศึกษา</h4>
                      <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg leading-relaxed">
                        {visit.studentPerformance}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">ความคิดเห็นจากบริษัท</h4>
                      <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg leading-relaxed">
                        {visit.companyFeedback}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">ข้อเสนะแนะ</h4>
                      <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg leading-relaxed">
                        {visit.recommendations}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Link
                    href={`/visitor/visits/${visit.id}`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-center"
                  >
                    ดูรายละเอียดเต็ม
                  </Link>
                  
                  <Link
                    href={`/visitor/visits/${visit.id}/edit`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium text-center"
                  >
                    แก้ไขรายงาน
                  </Link>
                  
                  <button
                    onClick={() => {
                      // Mock export functionality
                      console.log('Exporting report:', visit.id);
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    ส่งออก PDF
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {visits.length > 0 && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600">
              {visits.length}
            </div>
            <div className="text-sm text-gray-600">รายงานทั้งหมด</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">
              {visits.filter(v => new Date(v.visitDate) >= oneWeekAgo).length}
            </div>
            <div className="text-sm text-gray-600">7 วันที่ผ่านมา</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(visits.map(v => v.student.id)).size}
            </div>
            <div className="text-sm text-gray-600">นักศึกษาที่เยี่ยม</div>
          </div>
        </div>
      )}
    </div>
  );
}