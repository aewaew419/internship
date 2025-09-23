'use client';

import { useState, useRef, useCallback } from 'react';
import { CloudArrowUpIcon, DocumentTextIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface UploadFile {
  id: string;
  file: File;
  category: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

const DOCUMENT_CATEGORIES = {
  application: 'เอกสารสมัคร',
  personal: 'เอกสารส่วนตัว',
  company: 'เอกสารจากบริษัท',
  other: 'เอกสารอื่นๆ'
};

const ACCEPTED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function DocumentUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const replaceId = searchParams.get('replace');
  
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = (file: File): string | null => {
    if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
      return 'ประเภทไฟล์ไม่รองรับ กรุณาเลือกไฟล์ PDF, JPG, PNG, DOC หรือ DOCX';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'ขนาดไฟล์เกิน 10MB กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่า';
    }
    
    return null;
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    const newFiles: UploadFile[] = [];
    
    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        alert(`${file.name}: ${error}`);
        return;
      }
      
      newFiles.push({
        id: generateId(),
        file,
        category: 'application',
        progress: 0,
        status: 'uploading'
      });
    });
    
    setUploadFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFileCategory = (id: string, category: string) => {
    setUploadFiles(prev => 
      prev.map(f => f.id === id ? { ...f, category } : f)
    );
  };

  const simulateUpload = async (file: UploadFile): Promise<void> => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        
        setUploadFiles(prev => 
          prev.map(f => 
            f.id === file.id 
              ? { ...f, progress: Math.min(progress, 100) }
              : f
          )
        );
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // Simulate random success/failure
          const success = Math.random() > 0.1; // 90% success rate
          
          setUploadFiles(prev => 
            prev.map(f => 
              f.id === file.id 
                ? { 
                    ...f, 
                    progress: 100,
                    status: success ? 'completed' : 'error',
                    error: success ? undefined : 'เกิดข้อผิดพลาดในการอัปโหลด'
                  }
                : f
            )
          );
          
          if (success) {
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
        }
      }, 200);
    });
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // Upload files concurrently
      await Promise.allSettled(
        uploadFiles
          .filter(f => f.status === 'uploading')
          .map(file => simulateUpload(file))
      );
      
      // Check if all uploads completed successfully
      const hasErrors = uploadFiles.some(f => f.status === 'error');
      
      if (!hasErrors) {
        setTimeout(() => {
          router.push('/documents');
        }, 1500);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const completedCount = uploadFiles.filter(f => f.status === 'completed').length;
  const errorCount = uploadFiles.filter(f => f.status === 'error').length;
  const allCompleted = uploadFiles.length > 0 && uploadFiles.every(f => f.status === 'completed');

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/documents"
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {replaceId ? 'อัปโหลดเอกสารใหม่' : 'อัปโหลดเอกสาร'}
          </h1>
          <p className="text-sm text-gray-600">
            เลือกไฟล์เอกสารที่ต้องการอัปโหลด (PDF, JPG, PNG, DOC, DOCX)
          </p>
        </div>
      </div>

      {replaceId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-yellow-800">
              คุณกำลังอัปโหลดเอกสารใหม่เพื่อแทนที่เอกสารที่ถูกปฏิเสธ
            </p>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          รองรับไฟล์ PDF, JPG, PNG, DOC, DOCX ขนาดไม่เกิน 10MB
        </p>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          เลือกไฟล์
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={Object.values(ACCEPTED_FILE_TYPES).join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File List */}
      {uploadFiles.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              ไฟล์ที่เลือก ({uploadFiles.length})
            </h2>
            
            {uploadFiles.some(f => f.status === 'uploading') && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {isUploading ? 'กำลังอัปโหลด...' : 'เริ่มอัปโหลด'}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {uploadFiles.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="bg-white p-4 rounded-2xl shadow-sm border"
              >
                <div className="flex gap-4">
                  
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {uploadFile.status === 'completed' ? (
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                      ) : (
                        <DocumentTextIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {uploadFile.file.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(uploadFile.file.size)}
                        </p>
                      </div>
                      
                      {uploadFile.status === 'uploading' && (
                        <button
                          onClick={() => removeFile(uploadFile.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Category Selection */}
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        หมวดหมู่เอกสาร
                      </label>
                      <select
                        value={uploadFile.category}
                        onChange={(e) => updateFileCategory(uploadFile.id, e.target.value)}
                        disabled={uploadFile.status !== 'uploading'}
                        className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        {Object.entries(DOCUMENT_CATEGORIES).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Progress Bar */}
                    {uploadFile.status === 'uploading' && uploadFile.progress > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>กำลังอัปโหลด...</span>
                          <span>{Math.round(uploadFile.progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadFile.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Status Messages */}
                    {uploadFile.status === 'completed' && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>อัปโหลดสำเร็จ</span>
                      </div>
                    )}

                    {uploadFile.status === 'error' && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-800">
                          {uploadFile.error || 'เกิดข้อผิดพลาดในการอัปโหลด'}
                        </p>
                        <button
                          onClick={() => {
                            setUploadFiles(prev => 
                              prev.map(f => 
                                f.id === uploadFile.id 
                                  ? { ...f, status: 'uploading', progress: 0, error: undefined }
                                  : f
                              )
                            );
                          }}
                          className="text-sm text-red-600 hover:text-red-700 font-medium mt-1"
                        >
                          ลองใหม่
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {(completedCount > 0 || errorCount > 0) && (
            <div className="mt-6 bg-white p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  {completedCount > 0 && (
                    <span className="text-green-600">
                      สำเร็จ: {completedCount} ไฟล์
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-red-600">
                      ผิดพลาด: {errorCount} ไฟล์
                    </span>
                  )}
                </div>
                
                {allCompleted && (
                  <Link
                    href="/documents"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    ไปยังหน้าเอกสาร
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guidelines */}
      <div className="mt-8 bg-blue-50 p-6 rounded-2xl">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          คำแนะนำการอัปโหลดเอกสาร
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
            <span>ตรวจสอบให้แน่ใจว่าเอกสารชัดเจนและอ่านได้</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
            <span>เลือกหมวดหมู่เอกสารให้ถูกต้องเพื่อความสะดวกในการจัดการ</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
            <span>ไฟล์ขนาดใหญ่อาจใช้เวลาในการอัปโหลดนานกว่าปกติ</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
            <span>หากเอกสารถูกปฏิเสธ สามารถอัปโหลดใหม่ได้ทันที</span>
          </li>
        </ul>
      </div>
    </div>
  );
}