'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EditRounded } from '@mui/icons-material';

// Mock data types
interface StudentTraining {
  id: number;
  company: {
    companyNameTh: string;
    companyNameEn?: string;
  };
  status?: string;
  evaluationCompleted?: boolean;
}

interface StudentEnrollment {
  id: number;
  student_training?: StudentTraining;
}

export default function CompanyEvaluationPage() {
  const [studentEnrollments, setStudentEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockData: StudentEnrollment[] = [
          {
            id: 1,
            student_training: {
              id: 1,
              company: {
                companyNameTh: 'บริษัท เทคโนโลยี จำกัด',
                companyNameEn: 'Technology Company Ltd.'
              },
              status: 'กำลังฝึกงาน',
              evaluationCompleted: false
            }
          },
          {
            id: 2,
            student_training: {
              id: 2,
              company: {
                companyNameTh: 'บริษัท ซอฟต์แวร์ จำกัด',
                companyNameEn: 'Software Company Ltd.'
              },
              status: 'เสร็จสิ้น',
              evaluationCompleted: true
            }
          },
          {
            id: 3,
            // No student_training - should not show
          }
        ];
        
        setStudentEnrollments(mockData);
      } catch (error) {
        console.error('Error fetching student enrollments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Filter enrollments that have student_training
  const enrollmentsWithTraining = studentEnrollments.filter(
    enrollment => enrollment.student_training
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          แบบประเมิน
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          ประเมินสถานประกอบการที่คุณได้ฝึกงาน
        </p>
      </div>

      <div className="space-y-4">
        {enrollmentsWithTraining.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ยังไม่มีข้อมูลการฝึกงาน
            </h3>
            <p className="text-gray-500 text-sm">
              คุณยังไม่มีข้อมูลการฝึkงานที่สามารถประเมินได้
            </p>
          </div>
        ) : (
          enrollmentsWithTraining.map((enrollment) => {
            const training = enrollment.student_training!;
            return (
              <div
                key={enrollment.id}
                className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  
                  {/* Company Information */}
                  <div className="flex-1 space-y-2">
                    <h2 className="font-bold text-lg sm:text-xl text-gray-900">
                      สถานประกอบการ: {training.company.companyNameTh}
                    </h2>
                    
                    {training.company.companyNameEn && (
                      <p className="text-gray-600 text-sm">
                        {training.company.companyNameEn}
                      </p>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                      {training.status && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">สถานะ:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            training.status === 'เสร็จสิ้น'
                              ? 'bg-green-100 text-green-800'
                              : training.status === 'กำลังฝึกงาน'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {training.status}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">การประเมิน:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          training.evaluationCompleted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {training.evaluationCompleted ? 'เสร็จสิ้น' : 'ยังไม่ประเมิน'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-end sm:justify-center">
                    <Link
                      href={`/evaluate/company/${training.id}`}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium"
                    >
                      <EditRounded fontSize="small" />
                      <span>
                        {training.evaluationCompleted ? 'ดูการประเมิน' : 'ประเมิน'}
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Help Text */}
      {enrollmentsWithTraining.length > 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">คำแนะนำการประเมิน</p>
              <ul className="space-y-1 text-blue-700">
                <li>• กรุณาประเมินสถานประกอบการอย่างตรงไปตรงมา</li>
                <li>• การประเมินจะช่วยปรับปรุงคุณภาพการฝึกงานในอนาคต</li>
                <li>• คุณสามารถแก้ไขการประเมินได้หลังจากบันทึกแล้ว</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}