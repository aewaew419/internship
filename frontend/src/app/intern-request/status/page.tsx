'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon, ClockIcon, XCircleIcon, DocumentTextIcon, UserIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

interface StatusStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  date?: string;
  note?: string;
}

interface InternshipStatus {
  id: number;
  studentName: string;
  studentId: string;
  courseName: string;
  companyName: string;
  currentStatus: string;
  submittedAt: string;
  advisor?: {
    name: string;
    email: string;
    phone?: string;
  };
  supervisor?: {
    name: string;
    email: string;
    phone?: string;
  };
  steps: StatusStep[];
  documents: {
    name: string;
    status: 'approved' | 'pending' | 'rejected';
    uploadedAt: string;
  }[];
}

export default function InternRequestStatusPage() {
  const [status, setStatus] = useState<InternshipStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // Mock API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockStatus: InternshipStatus = {
          id: 1,
          studentName: 'นายสมชาย ใจดี',
          studentId: '6400001',
          courseName: 'สหกิจศึกษา',
          companyName: 'บริษัท เทคโนโลยี จำกัด',
          currentStatus: 'รอการอนุมัติจากอาจารย์ที่ปรึกษา',
          submittedAt: '2024-01-15',
          advisor: {
            name: 'ผศ.ดร.สมหญิง รักการสอน',
            email: 'somying@university.ac.th',
            phone: '02-123-4567'
          },
          supervisor: {
            name: 'อ.สมศักดิ์ ใจดี',
            email: 'somsak@university.ac.th'
          },
          steps: [
            {
              id: 'submit',
              title: 'ยื่นคำร้องขอฝึกงาน',
              description: 'ส่งคำร้องและเอกสารประกอบการขอฝึกงาน',
              status: 'completed',
              date: '2024-01-15',
              note: 'ยื่นคำร้องเรียบร้อยแล้ว'
            },
            {
              id: 'document_review',
              title: 'ตรวจสอบเอกสาร',
              description: 'เจ้าหน้าที่ตรวจสอบความถูกต้องของเอกสาร',
              status: 'completed',
              date: '2024-01-16',
              note: 'เอกสารครบถ้วนและถูกต้อง'
            },
            {
              id: 'advisor_review',
              title: 'อาจารย์ที่ปรึกษาพิจารณา',
              description: 'อาจารย์ที่ปรึกษาพิจารณาอนุมัติคำร้อง',
              status: 'current',
              note: 'กำลังรอการพิจารณาจากอาจารย์ที่ปรึกษา'
            },
            {
              id: 'committee_review',
              title: 'คณะกรรมการพิจารณา',
              description: 'คณะกรรมการสหกิจศึกษาพิจารณาอนุมัติ',
              status: 'pending'
            },
            {
              id: 'supervisor_assign',
              title: 'มอบหมายอาจารย์นิเทศ',
              description: 'มอบหมายอาจารย์นิเทศและแจ้งผลการอนุมัติ',
              status: 'pending'
            },
            {
              id: 'internship_start',
              title: 'เริ่มฝึกงาน',
              description: 'เริ่มการฝึกงานตามกำหนดการ',
              status: 'pending'
            }
          ],
          documents: [
            {
              name: 'ใบสมัครฝึกงาน',
              status: 'approved',
              uploadedAt: '2024-01-15'
            },
            {
              name: 'หนังสือรับรองจากบริษัท',
              status: 'approved',
              uploadedAt: '2024-01-15'
            },
            {
              name: 'ประวัติส่วนตัว (Resume)',
              status: 'pending',
              uploadedAt: '2024-01-15'
            }
          ]
        };
        
        setStatus(mockStatus);
      } catch (error) {
        console.error('Error fetching status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const getStepIcon = (step: StatusStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircleIconSolid className="w-6 h-6 text-green-500" />;
      case 'current':
        return <ClockIcon className="w-6 h-6 text-blue-500" />;
      case 'rejected':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      default:
        return <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white" />;
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getDocumentStatusText = (status: string) => {
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

  if (!status) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-gray-500">ไม่พบข้อมูลสถานะการฝึกงาน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              สถานะการฝึกงาน
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              ติดตามความคืบหน้าของการยื่นคำร้องฝึกงาน
            </p>
          </div>
          
          <div className="text-right">
            <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              status.currentStatus.includes('อนุมัติ') 
                ? 'bg-green-100 text-green-800'
                : status.currentStatus.includes('ปฏิเสธ')
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {status.currentStatus}
            </div>
          </div>
        </div>
      </div>

      {/* Student Info */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลการฝึกงาน</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">ชื่อ-สกุล:</span>
            <p className="font-medium text-gray-900">{status.studentName}</p>
          </div>
          <div>
            <span className="text-gray-500">รหัสนักศึกษา:</span>
            <p className="font-medium text-gray-900">{status.studentId}</p>
          </div>
          <div>
            <span className="text-gray-500">รายวิชา:</span>
            <p className="font-medium text-gray-900">{status.courseName}</p>
          </div>
          <div>
            <span className="text-gray-500">สถานประกอบการ:</span>
            <p className="font-medium text-gray-900">{status.companyName}</p>
          </div>
          <div>
            <span className="text-gray-500">วันที่ยื่นคำร้อง:</span>
            <p className="font-medium text-gray-900">
              {new Date(status.submittedAt).toLocaleDateString('th-TH')}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">ความคืบหน้า</h2>
        
        <div className="space-y-6">
          {status.steps.map((step, index) => (
            <div key={step.id} className="flex gap-4">
              
              {/* Icon */}
              <div className="flex flex-col items-center">
                {getStepIcon(step)}
                {index < status.steps.length - 1 && (
                  <div className={`w-0.5 h-12 mt-2 ${
                    step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className={`font-medium ${
                    step.status === 'completed' ? 'text-green-900' :
                    step.status === 'current' ? 'text-blue-900' :
                    step.status === 'rejected' ? 'text-red-900' :
                    'text-gray-500'
                  }`}>
                    {step.title}
                  </h3>
                  
                  {step.date && (
                    <span className="text-xs text-gray-500">
                      {new Date(step.date).toLocaleDateString('th-TH')}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mt-1">
                  {step.description}
                </p>
                
                {step.note && (
                  <div className={`mt-2 p-3 rounded-lg text-sm ${
                    step.status === 'completed' ? 'bg-green-50 text-green-800' :
                    step.status === 'current' ? 'bg-blue-50 text-blue-800' :
                    step.status === 'rejected' ? 'bg-red-50 text-red-800' :
                    'bg-gray-50 text-gray-800'
                  }`}>
                    {step.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Advisor */}
        {status.advisor && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <UserIcon className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">อาจารย์ที่ปรึกษา</h2>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">ชื่อ:</span>
                <p className="font-medium text-gray-900">{status.advisor.name}</p>
              </div>
              <div>
                <span className="text-gray-500">อีเมล:</span>
                <p className="font-medium text-blue-600">
                  <a href={`mailto:${status.advisor.email}`}>{status.advisor.email}</a>
                </p>
              </div>
              {status.advisor.phone && (
                <div>
                  <span className="text-gray-500">โทรศัพท์:</span>
                  <p className="font-medium text-gray-900">{status.advisor.phone}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Supervisor */}
        {status.supervisor && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <UserIcon className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">อาจารย์นิเทศ</h2>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">ชื่อ:</span>
                <p className="font-medium text-gray-900">{status.supervisor.name}</p>
              </div>
              <div>
                <span className="text-gray-500">อีเมล:</span>
                <p className="font-medium text-blue-600">
                  <a href={`mailto:${status.supervisor.email}`}>{status.supervisor.email}</a>
                </p>
              </div>
              {status.supervisor.phone && (
                <div>
                  <span className="text-gray-500">โทรศัพท์:</span>
                  <p className="font-medium text-gray-900">{status.supervisor.phone}</p>
                </div>
              )}
            </div>
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
          {status.documents.map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{doc.name}</p>
                <p className="text-xs text-gray-500">
                  อัปโหลดเมื่อ: {new Date(doc.uploadedAt).toLocaleDateString('th-TH')}
                </p>
              </div>
              
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDocumentStatusColor(doc.status)}`}>
                {getDocumentStatusText(doc.status)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}