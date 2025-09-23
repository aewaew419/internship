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

interface Document {
  id: number;
  name: string;
  type: 'pdf' | 'doc' | 'docx' | 'jpg' | 'png';
  size: number;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface InternDocument {
  id: number;
  student: Student;
  company: Company;
  documentType: 'request_letter' | 'acceptance_letter' | 'evaluation_form' | 'report' | 'certificate';
  documents: Document[];
  submissionDate: string;
  reviewDate?: string;
  reviewedBy?: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision_required';
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminInternDocPage() {
  const [internDocs, setInternDocs] = useState<InternDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const documentTypes = [
    { value: 'request_letter', label: 'หนังสือขอฝึกงาน' },
    { value: 'acceptance_letter', label: 'หนังสือตอบรับ' },
    { value: 'evaluation_form', label: 'แบบประเมิน' },
    { value: 'report', label: 'รายงานฝึกงาน' },
    { value: 'certificate', label: 'ใบรับรอง' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockInternDocs: InternDocument[] = [
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
            documentType: 'request_letter',
            documents: [
              {
                id: 1,
                name: 'หนังสือขอฝึกงาน_6400001.pdf',
                type: 'pdf',
                size: 1024000,
                uploadDate: '2024-02-10',
                status: 'approved'
              }
            ],
            submissionDate: '2024-02-10',
            reviewDate: '2024-02-12',
            reviewedBy: 'อาจารย์สมศักดิ์ ใจดี',
            status: 'approved',
            comments: 'เอกสารครบถ้วนและถูกต้อง',
            createdAt: '2024-02-10',
            updatedAt: '2024-02-12'
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
            documentType: 'report',
            documents: [
              {
                id: 2,
                name: 'รายงานฝึกงาน_6400002.pdf',
                type: 'pdf',
                size: 2048000,
                uploadDate: '2024-02-15',
                status: 'pending'
              },
              {
                id: 3,
                name: 'ภาคผนวก_6400002.docx',
                type: 'docx',
                size: 512000,
                uploadDate: '2024-02-15',
                status: 'pending'
              }
            ],
            submissionDate: '2024-02-15',
            status: 'pending',
            createdAt: '2024-02-15',
            updatedAt: '2024-02-15'
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
            documentType: 'evaluation_form',
            documents: [
              {
                id: 4,
                name: 'แบบประเมิน_6400003.pdf',
                type: 'pdf',
                size: 768000,
                uploadDate: '2024-02-08',
                status: 'rejected'
              }
            ],
            submissionDate: '2024-02-08',
            reviewDate: '2024-02-09',
            reviewedBy: 'อาจารย์สมหญิง รักงาน',
            status: 'rejected',
            comments: 'เอกสารไม่ชัดเจน กรุณาอัปโหลดใหม่',
            createdAt: '2024-02-08',
            updatedAt: '2024-02-09'
          }
        ];
        
        setInternDocs(mockInternDocs);
      } catch (error) {
        console.error('Error fetching intern documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredDocs = internDocs.filter(doc => {
    const matchesFilter = filter === 'all' || doc.status === filter;
    const matchesDocType = documentTypeFilter === '' || doc.documentType === documentTypeFilter;
    const matchesSearch = searchTerm === '' || 
      doc.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.student.studentId.includes(searchTerm) ||
      doc.company.companyNameTh.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesDocType && matchesSearch;
  });

  const handleApprove = async (docId: number) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setInternDocs(prev => prev.map(doc => 
        doc.id === docId 
          ? { 
              ...doc, 
              status: 'approved' as const,
              reviewDate: new Date().toISOString().split('T')[0],
              reviewedBy: 'ผู้ดูแลระบบ',
              updatedAt: new Date().toISOString()
            }
          : doc
      ));
    } catch (error) {
      console.error('Error approving document:', error);
    }
  };

  const handleReject = async (docId: number, comments: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setInternDocs(prev => prev.map(doc => 
        doc.id === docId 
          ? { 
              ...doc, 
              status: 'rejected' as const,
              reviewDate: new Date().toISOString().split('T')[0],
              reviewedBy: 'ผู้ดูแลระบบ',
              comments,
              updatedAt: new Date().toISOString()
            }
          : doc
      ));
    } catch (error) {
      console.error('Error rejecting document:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'revision_required':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'อนุมัติ';
      case 'rejected':
        return 'ปฏิเสธ';
      case 'revision_required':
        return 'ต้องแก้ไข';
      default:
        return 'รอพิจารณา';
    }
  };

  const getDocumentTypeText = (type: string) => {
    const docType = documentTypes.find(dt => dt.value === type);
    return docType ? docType.label : type;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          จัดการเอกสารฝึกงาน
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          ตรวจสอบและอนุมัติเอกสารฝึกงานของนักศึกษา
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ค้นหา
            </label>
            <input
              type="text"
              placeholder="ชื่อ, รหัสนักศึกษา, หรือบริษัท..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะ
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">ทั้งหมด</option>
              <option value="pending">รอพิจารณา</option>
              <option value="approved">อนุมัติ</option>
              <option value="rejected">ปฏิเสธ</option>
            </select>
          </div>

          {/* Document Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ประเภทเอกสาร
            </label>
            <select
              value={documentTypeFilter}
              onChange={(e) => setDocumentTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">ทุกประเภท</option>
              {documentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stats */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถิติ
            </label>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="bg-yellow-50 p-2 rounded text-center">
                <div className="font-bold text-yellow-600">
                  {internDocs.filter(d => d.status === 'pending').length}
                </div>
                <div className="text-yellow-700">รอพิจารณา</div>
              </div>
              <div className="bg-green-50 p-2 rounded text-center">
                <div className="font-bold text-green-600">
                  {internDocs.filter(d => d.status === 'approved').length}
                </div>
                <div className="text-green-700">อนุมัติ</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        แสดง {filteredDocs.length} จาก {internDocs.length} รายการ
      </div>

      {/* Document Cards */}
      <div className="space-y-6">
        {filteredDocs.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่พบเอกสาร
            </h3>
            <p className="text-gray-500 text-sm">
              ไม่มีเอกสารที่ตรงกับเงื่อนไขที่เลือก
            </p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="space-y-4">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {getDocumentTypeText(doc.documentType)}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>นักศึกษา: {doc.student.name} ({doc.student.studentId})</p>
                      <p>บริษัท: {doc.company.companyNameTh}</p>
                      <p>วันที่ส่ง: {new Date(doc.submissionDate).toLocaleDateString('th-TH')}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                      {getStatusText(doc.status)}
                    </span>
                    {doc.reviewDate && (
                      <div className="text-xs text-gray-500 text-right">
                        <p>ตรวจสอบเมื่อ: {new Date(doc.reviewDate).toLocaleDateString('th-TH')}</p>
                        {doc.reviewedBy && <p>โดย: {doc.reviewedBy}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents List */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">ไฟล์เอกสาร</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {doc.documents.map((document) => (
                      <div
                        key={document.id}
                        className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {document.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(document.size)} • {document.type.toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(document.uploadDate).toLocaleDateString('th-TH')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                {doc.comments && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">ความคิดเห็น</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {doc.comments}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Link
                    href={`/admin/intern-doc/${doc.id}`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-center"
                  >
                    ดูรายละเอียด
                  </Link>
                  
                  {doc.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(doc.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        อนุมัติ
                      </button>
                      
                      <button
                        onClick={() => {
                          const comments = prompt('กรุณาระบุเหตุผลในการปฏิเสธ:');
                          if (comments) {
                            handleReject(doc.id, comments);
                          }
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        ปฏิเสธ
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => {
                      // Mock download functionality
                      console.log('Downloading documents for:', doc.id);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    ดาวน์โหลด
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}