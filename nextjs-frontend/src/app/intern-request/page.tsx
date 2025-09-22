'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EditRounded, AddRounded } from '@mui/icons-material';

// Mock data types - replace with actual types from your API
interface StudentEnrollment {
  id: number;
  course_section: {
    course: {
      courseNameTh: string;
    };
    year: number;
    semester: number;
  };
  status?: string;
}

export default function InternRequestPage() {
  const [studentEnrollments, setStudentEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API call
    const fetchData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockData: StudentEnrollment[] = [
          {
            id: 1,
            course_section: {
              course: {
                courseNameTh: "สหกิจศึกษา"
              },
              year: 2567,
              semester: 1
            },
            status: "รอการพิจารณา"
          },
          {
            id: 2,
            course_section: {
              course: {
                courseNameTh: "ฝึกงาน"
              },
              year: 2567,
              semester: 2
            },
            status: "อนุมัติแล้ว"
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
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
        
        {/* Personal Information Section */}
        <div className="border-b pb-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h1 className="font-bold text-lg sm:text-xl text-gray-900">
              ลงทะเบียนข้อมูลนักศึกษา
            </h1>
            <Link
              href="/intern-request/register-personal-info"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors w-fit"
            >
              <EditRounded fontSize="small" />
              <span className="text-sm sm:text-base">ลงทะเบียนข้อมูล</span>
            </Link>
          </div>
        </div>

        {/* Internship Information Section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="font-bold text-lg sm:text-xl text-gray-900">
              กรอกข้อมูลสหกิจศึกษาหรือฝึกงาน
            </h2>
            <Link
              href="/intern-request/register-coop-info?id=0"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors w-fit"
            >
              <AddRounded fontSize="small" />
              <span className="text-sm sm:text-base">เพิ่มข้อมูล</span>
            </Link>
          </div>

          {/* Enrollment Cards */}
          <div className="space-y-4">
            {studentEnrollments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>ยังไม่มีข้อมูลการลงทะเบียน</p>
                <p className="text-sm mt-2">กรุณาเพิ่มข้อมูลสหกิจศึกษาหรือฝึกงาน</p>
              </div>
            ) : (
              studentEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    
                    {/* Content */}
                    <div className="flex-1 space-y-3">
                      <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                        {enrollment.course_section.course.courseNameTh}
                      </h3>
                      
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-gray-600">
                        <span>ปีการศึกษา: {enrollment.course_section.year + 543}</span>
                        <span>เทอม: {enrollment.course_section.semester}</span>
                      </div>
                      
                      {/* Status */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">สถานะ:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          enrollment.status === 'อนุมัติแล้ว' 
                            ? 'bg-green-100 text-green-800'
                            : enrollment.status === 'รอการพิจารณา'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {enrollment.status || 'ไม่ระบุ'}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center justify-end sm:justify-center">
                      <Link
                        href={`/intern-request/register-coop-info?id=${enrollment.id}`}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors text-sm"
                      >
                        <EditRounded fontSize="small" />
                        <span>แก้ไขข้อมูล</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}