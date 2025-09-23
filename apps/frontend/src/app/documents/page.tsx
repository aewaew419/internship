'use client';

import { useState, useEffect } from 'react';
import { DocumentTextIcon, CloudArrowUpIcon, EyeIcon, TrashIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Document {
  id: number;
  name: string;
  type: string;
  size: number;
  status: 'approved' | 'pending' | 'rejected';
  category: 'application' | 'personal' | 'company' | 'other';
  uploadedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  url: string;
  thumbnailUrl?: string;
}

const DOCUMENT_CATEGORIES = {
  application: 'เอกสารสมัคร',
  personal: 'เอกสารส่วนตัว',
  company: 'เอกสารจากบริษัท',
  other: 'เอกสารอื่นๆ'
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        // Mock API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockDocuments: Document[] = [
          {
            id: 1,
            name: 'ใบสมัครฝึกงาน.pdf',
            type: 'application/pdf',
            size: 245760, // 240KB
            status: 'approved',
            category: 'application',
            uploadedAt: '2024-01-15T10:30:00Z',
            approvedAt: '2024-01-16T09:15:00Z',
            url: '/documents/application.pdf'
          },
          {
            id: 2,
            name: 'ประวัติส่วนตัว.pdf',
            type: 'application/pdf',
            size: 512000, // 500KB
            status: 'rejected',
            category: 'personal',
            uploadedAt: '2024-01-15T11:00:00Z',
            rejectedAt: '2024-01-16T14:30:00Z',
            rejectionReason: 'ข้อมูลไม่ครบถ้วน กรุณาเพิ่มข้อมูลการศึกษาและประสบการณ์',
            url: '/documents/resume.pdf'
          },
          {
            id: 3,
            name: 'หนังสือรับรองจากบริษัท.pdf',
            type: 'application/pdf',
            size: 1024000, // 1MB
            status: 'pending',
            category: 'company',
            uploadedAt: '2024-01-15T14:20:00Z',
            url: '/documents/company-letter.pdf'
          },
          {
            id: 4,
            name: 'ใบรับรองแพทย์.jpg',
            type: 'image/jpeg',
            size: 2048000, // 2MB
            status: 'approved',
            category: 'personal',
            uploadedAt: '2024-01-14T16:45:00Z',
            approvedAt: '2024-01-15T08:20:00Z',
            url: '/documents/medical-cert.jpg',
            thumbnailUrl: '/documents/thumbnails/medical-cert.jpg'
          }
        ];
        
        setDocuments(mockDocuments);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const filteredDocuments = documents.filter(doc => {
    const statusMatch = filter === 'all' || doc.status === filter;
    const categoryMatch = categoryFilter === 'all' || doc.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
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

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const deleteDocument = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบเอกสารนี้?')) return;
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('เกิดข้อผิดพลาดในการลบเอกสาร');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <DocumentTextIcon className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              จัดการเอกสาร
            </h1>
            <p className="text-sm text-gray-600">
              อัปโหลดและจัดการเอกสารประกอบการฝึกงาน
            </p>
          </div>
        </div>
        
        <Link
          href="/documents/upload"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors w-fit"
        >
          <CloudArrowUpIcon className="w-4 h-4" />
          <span>อัปโหลดเอกสาร</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          
          {/* Status Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">ทั้งหมด</option>
              <option value="pending">รอพิจารณา</option>
              <option value="approved">อนุมัติ</option>
              <option value="rejected">ปฏิเสธ</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">ทั้งหมด</option>
              {Object.entries(DOCUMENT_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {filteredDocuments.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
            <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่มีเอกสาร
            </h3>
            <p className="text-gray-500 mb-4">
              {filter !== 'all' || categoryFilter !== 'all' 
                ? 'ไม่พบเอกสารที่ตรงกับเงื่อนไขที่เลือก'
                : 'ยังไม่มีเอกสารที่อัปโหลด'
              }
            </p>
            <Link
              href="/documents/upload"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <CloudArrowUpIcon className="w-4 h-4" />
              อัปโหลดเอกสารแรก
            </Link>
          </div>
        ) : (
          filteredDocuments.map((document) => (
            <div
              key={document.id}
              className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                
                {/* Document Icon/Thumbnail */}
                <div className="flex-shrink-0">
                  {document.thumbnailUrl ? (
                    <img
                      src={document.thumbnailUrl}
                      alt={document.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <DocumentTextIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {document.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{DOCUMENT_CATEGORIES[document.category]}</span>
                        <span>{formatFileSize(document.size)}</span>
                        <span>{formatDate(document.uploadedAt)}</span>
                      </div>
                    </div>
                    
                    {/* Status */}
                    <div className="flex items-center gap-2">
                      {getStatusIcon(document.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                        {getStatusText(document.status)}
                      </span>
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {document.status === 'rejected' && document.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>เหตุผลที่ปฏิเสธ:</strong> {document.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-4">
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <EyeIcon className="w-4 h-4" />
                      ดูเอกสาร
                    </a>
                    
                    <a
                      href={document.url}
                      download={document.name}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      ดาวน์โหลด
                    </a>
                    
                    {document.status === 'rejected' && (
                      <Link
                        href={`/documents/upload?replace=${document.id}`}
                        className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        <CloudArrowUpIcon className="w-4 h-4" />
                        อัปโหลดใหม่
                      </Link>
                    )}
                    
                    <button
                      onClick={() => deleteDocument(document.id)}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium ml-auto"
                    >
                      <TrashIcon className="w-4 h-4" />
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">สรุปเอกสาร</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {documents.length}
            </div>
            <div className="text-sm text-gray-500">ทั้งหมด</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {documents.filter(d => d.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-500">อนุมัติ</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {documents.filter(d => d.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-500">รอพิจารณา</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {documents.filter(d => d.status === 'rejected').length}
            </div>
            <div className="text-sm text-gray-500">ปฏิเสธ</div>
          </div>
        </div>
      </div>
    </div>
  );
}