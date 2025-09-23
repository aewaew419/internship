'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckIcon, XMarkIcon, ChatBubbleLeftIcon, DocumentTextIcon, UserIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Student {
  id: number;
  name: string;
  studentId: string;
  email: string;
  phone?: string;
  year: number;
  gpa: number;
}

interface Company {
  id: number;
  name: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
}

interface InternRequest {
  id: number;
  student: Student;
  company: Company;
  position: string;
  duration: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  documents: {
    name: string;
    url: string;
    uploadedAt: string;
  }[];
  notes?: string;
  advisorNotes?: string;
}

export default function InstructorRequestDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const requestId = params.id as string;
  const enrollId = searchParams.get('enroll_id');
  
  const [request, setRequest] = useState<InternRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        // Mock API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockRequest: InternRequest = {
          id: parseInt(requestId),
          student: {
            id: 1,
            name: 'นายสมชาย ใจดี',
            studentId: '6400001',
            email: 'somchai@student.university.ac.th',
            phone: '081-234-5678',
            year: 3,
            gpa: 3.25
          },
          company: {
            id: 1,
            name: 'บริษัท เทคโนโลยี จำกัด',
            address: '123 ถนนเทคโนโลยี แขวงนวัตกรรม เขตดิจิทัล กรุงเทพฯ 10110',
            contactPerson: 'คุณสมหญิง ผู้จัดการ',
            contactEmail: 'manager@technology.co.th',
            contactPhone: '02-123-4567'
          },
          position: 'นักพัฒนาซอฟต์แวร์',
          duration: '4 เดือน',
          startDate: '2024-06-01',
          endDate: '2024-09-30',
          status: 'pending',
          submittedAt: '2024-01-15',
          documents: [
            {
              name: 'ใบสมัครฝึกงาน.pdf',
              url: '/documents/application.pdf',
              uploadedAt: '2024-01-15'
            },
            {
              name: 'หนังสือรับรองจากบริษัท.pdf',
              url: '/documents/company-letter.pdf',
              uploadedAt: '2024-01-15'
            },
            {
              name: 'ประวัติส่วนตัว.pdf',
              url: '/documents/resume.pdf',
              uploadedAt: '2024-01-15'
            }
          ],
          notes: 'นักศึกษามีความสนใจในการพัฒนาซอฟต์แวร์และมีพื้นฐานการเขียนโปรแกรมที่ดี',
          advisorNotes: ''
        };
        
        setRequest(mockRequest);
        setNotes(mockRequest.advisorNotes || '');
      } catch (error) {
        console.error('Error fetching request:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  const handleApprove = async () => {
    if (!request) return;
    
    setActionLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRequest(prev => prev ? { ...prev, status: 'approved' } : null);
      alert('อนุมัติคำร้องเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('เกิดข้อผิดพลาดในการอนุมัติคำร้อง');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!request) return;
    
    if (!notes.trim()) {
      alert('กรุณาระบุเหตุผลในการปฏิเสธคำร้อง');
      setShowNotesModal(true);
      return;
    }
    
    setActionLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRequest(prev => prev ? { ...prev, status: 'rejected', advisorNotes: notes } : null);
      alert('ปฏิเสธคำร้องเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('เกิดข้อผิดพลาดในการปฏิเสธคำร้อง');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!request) return;
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setRequest(prev => prev ? { ...prev, advisorNotes: notes } : null);
      setShowNotesModal(false);
      alert('บันทึกหมายเหตุเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกหมายเหตุ');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'อนุมัติ';
      case 'rejected':
        return 'ปฏิเสธ';
      default:
        return 'รอพิจารณา';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-gray-500">ไม่พบข้อมูลคำร้อง</p>
          <Link
            href="/instructor/intern-request"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            กลับไปหน้ารายการ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              รายละเอียดคำร้องขอฝึกงาน
            </h1>
            <p className="text-gray-600 text-sm">
              ยื่นเมื่อ: {new Date(request.submittedAt).toLocaleDateString('th-TH')}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
              {getStatusText(request.status)}
            </span>
            
            <Link
              href="/instructor/intern-request"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm"
            >
              กลับ
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        {request.status === 'pending' && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckIcon className="w-4 h-4" />
              {actionLoading ? 'กำลังดำเนินการ...' : 'อนุมัติคำร้อง'}
            </button>
            
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XMarkIcon className="w-4 h-4" />
              {actionLoading ? 'กำลังดำเนินการ...' : 'ปฏิเสธคำร้อง'}
            </button>
            
            <button
              onClick={() => setShowNotesModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <ChatBubbleLeftIcon className="w-4 h-4" />
              เพิ่มหมายเหตุ
            </button>
          </div>
        )}
      </div>

      {/* Student Information */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <UserIcon className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">ข้อมูลนักศึกษา</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">ชื่อ-สกุล:</span>
            <p className="font-medium text-gray-900">{request.student.name}</p>
          </div>
          <div>
            <span className="text-gray-500">รหัสนักศึกษา:</span>
            <p className="font-medium text-gray-900">{request.student.studentId}</p>
          </div>
          <div>
            <span className="text-gray-500">อีเมล:</span>
            <p className="font-medium text-blue-600">
              <a href={`mailto:${request.student.email}`}>{request.student.email}</a>
            </p>
          </div>
          <div>
            <span className="text-gray-500">โทรศัพท์:</span>
            <p className="font-medium text-gray-900">{request.student.phone || 'ไม่ระบุ'}</p>
          </div>
          <div>
            <span className="text-gray-500">ชั้นปี:</span>
            <p className="font-medium text-gray-900">ปี {request.student.year}</p>
          </div>
          <div>
            <span className="text-gray-500">เกรดเฉลี่ย:</span>
            <p className="font-medium text-gray-900">{request.student.gpa.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Company Information */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลสถานประกอบการ</h2>
        
        <div className="space-y-4 text-sm">
          <div>
            <span className="text-gray-500">ชื่อบริษัท:</span>
            <p className="font-medium text-gray-900">{request.company.name}</p>
          </div>
          <div>
            <span className="text-gray-500">ที่อยู่:</span>
            <p className="font-medium text-gray-900">{request.company.address}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500">ผู้ติดต่อ:</span>
              <p className="font-medium text-gray-900">{request.company.contactPerson}</p>
            </div>
            <div>
              <span className="text-gray-500">อีเมลผู้ติดต่อ:</span>
              <p className="font-medium text-blue-600">
                <a href={`mailto:${request.company.contactEmail}`}>{request.company.contactEmail}</a>
              </p>
            </div>
          </div>
          <div>
            <span className="text-gray-500">โทรศัพท์:</span>
            <p className="font-medium text-gray-900">{request.company.contactPhone}</p>
          </div>
        </div>
      </div>

      {/* Internship Details */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">รายละเอียดการฝึกงาน</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">ตำแหน่ง:</span>
            <p className="font-medium text-gray-900">{request.position}</p>
          </div>
          <div>
            <span className="text-gray-500">ระยะเวลา:</span>
            <p className="font-medium text-gray-900">{request.duration}</p>
          </div>
          <div>
            <span className="text-gray-500">วันที่เริ่ม:</span>
            <p className="font-medium text-gray-900">
              {new Date(request.startDate).toLocaleDateString('th-TH')}
            </p>
          </div>
          <div>
            <span className="text-gray-500">วันที่สิ้นสุด:</span>
            <p className="font-medium text-gray-900">
              {new Date(request.endDate).toLocaleDateString('th-TH')}
            </p>
          </div>
        </div>

        {request.notes && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm text-gray-500">หมายเหตุจากนักศึกษา:</span>
            <p className="text-sm text-gray-900 mt-1">{request.notes}</p>
          </div>
        )}

        {request.advisorNotes && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <span className="text-sm text-gray-500">หมายเหตุจากอาจารย์ที่ปรึกษา:</span>
            <p className="text-sm text-gray-900 mt-1">{request.advisorNotes}</p>
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <DocumentTextIcon className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-gray-900">เอกสารประกอบ</h2>
        </div>
        
        <div className="space-y-3">
          {request.documents.map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{doc.name}</p>
                <p className="text-xs text-gray-500">
                  อัปโหลดเมื่อ: {new Date(doc.uploadedAt).toLocaleDateString('th-TH')}
                </p>
              </div>
              
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                ดูเอกสาร
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">เพิ่มหมายเหตุ</h3>
            
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ระบุหมายเหตุหรือเหตุผล..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSaveNotes}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                บันทึก
              </button>
              <button
                onClick={() => setShowNotesModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}