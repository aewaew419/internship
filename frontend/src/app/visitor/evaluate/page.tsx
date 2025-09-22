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

interface StudentEvaluation {
  id: number;
  student: Student;
  company: Company;
  evaluationDate?: string;
  overallScore?: number;
  workQuality?: number;
  punctuality?: number;
  teamwork?: number;
  initiative?: number;
  communication?: number;
  technicalSkills?: number;
  comments?: string;
  recommendations?: string;
  status: 'pending' | 'completed' | 'draft';
  visitDate: string;
  createdAt: string;
  updatedAt?: string;
}

interface CompanyEvaluation {
  id: number;
  company: Company;
  student: Student;
  evaluationDate?: string;
  workEnvironment?: number;
  supervision?: number;
  learningOpportunities?: number;
  facilities?: number;
  overallSatisfaction?: number;
  comments?: string;
  recommendations?: string;
  status: 'pending' | 'completed' | 'draft';
  visitDate: string;
  createdAt: string;
  updatedAt?: string;
}

export default function VisitorEvaluatePage() {
  const [studentEvaluations, setStudentEvaluations] = useState<StudentEvaluation[]>([]);
  const [companyEvaluations, setCompanyEvaluations] = useState<CompanyEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'companies'>('students');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockStudentEvaluations: StudentEvaluation[] = [
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
            evaluationDate: '2024-02-10',
            overallScore: 4.2,
            workQuality: 4,
            punctuality: 5,
            teamwork: 4,
            initiative: 4,
            communication: 4,
            technicalSkills: 4,
            comments: 'นักศึกษาแสดงความสามารถในการทำงานได้ดี มีความกระตือรือร้น',
            recommendations: 'ควรพัฒนาทักษะการนำเสนอเพิ่มเติม',
            status: 'completed',
            visitDate: '2024-02-10',
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
            status: 'pending',
            visitDate: '2024-02-15',
            createdAt: '2024-02-08'
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
            overallScore: 3.8,
            workQuality: 4,
            punctuality: 4,
            teamwork: 3,
            initiative: 4,
            communication: 4,
            technicalSkills: 3,
            status: 'draft',
            visitDate: '2024-02-12',
            createdAt: '2024-02-12'
          }
        ];

        const mockCompanyEvaluations: CompanyEvaluation[] = [
          {
            id: 1,
            company: {
              id: 1,
              companyNameTh: 'บริษัท เทคโนโลยี จำกัด'
            },
            student: {
              id: 1,
              name: 'นายสมชาย ใจดี',
              studentId: '6400001'
            },
            evaluationDate: '2024-02-10',
            workEnvironment: 4,
            supervision: 5,
            learningOpportunities: 4,
            facilities: 4,
            overallSatisfaction: 4,
            comments: 'บริษัทให้การดูแลนักศึกษาเป็นอย่างดี มีสภาพแวดล้อมที่เอื้อต่อการเรียนรู้',
            recommendations: 'ควรเพิ่มโอกาสให้นักศึกษาได้เรียนรู้เทคโนโลยีใหม่ๆ',
            status: 'completed',
            visitDate: '2024-02-10',
            createdAt: '2024-02-10',
            updatedAt: '2024-02-10'
          },
          {
            id: 2,
            company: {
              id: 2,
              companyNameTh: 'บริษัท ซอฟต์แวร์ จำกัด'
            },
            student: {
              id: 2,
              name: 'นางสาวสมหญิง รักเรียน',
              studentId: '6400002'
            },
            status: 'pending',
            visitDate: '2024-02-15',
            createdAt: '2024-02-08'
          }
        ];
        
        setStudentEvaluations(mockStudentEvaluations);
        setCompanyEvaluations(mockCompanyEvaluations);
      } catch (error) {
        console.error('Error fetching evaluations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredStudentEvaluations = studentEvaluations.filter(evaluation => {
    switch (filter) {
      case 'pending':
        return evaluation.status === 'pending';
      case 'completed':
        return evaluation.status === 'completed';
      default:
        return true;
    }
  });

  const filteredCompanyEvaluations = companyEvaluations.filter(evaluation => {
    switch (filter) {
      case 'pending':
        return evaluation.status === 'pending';
      case 'completed':
        return evaluation.status === 'completed';
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'เสร็จสิ้น';
      case 'draft':
        return 'แบบร่าง';
      default:
        return 'รอประเมิน';
    }
  };

  const renderScoreBar = (score: number) => {
    const percentage = (score / 5) * 100;
    const color = score >= 4 ? 'bg-green-500' : score >= 3 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${color}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-sm font-medium text-gray-700 min-w-[2rem]">
          {score.toFixed(1)}
        </span>
      </div>
    );
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
          ประเมินผลการฝึkงาน
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          ประเมินผลการปฏิบัติงานของนักศึกษาและสถานประกอบการ
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'students'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          ประเมินนักศึกษา ({studentEvaluations.length})
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'companies'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          ประเมินบริษัท ({companyEvaluations.length})
        </button>
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
          ทั้งหมด
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          รอประเมิน
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          เสร็จสิ้น
        </button>
      </div>

      {/* Student Evaluations */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {filteredStudentEvaluations.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ไม่มีการประเมินนักศึกษา
              </h3>
              <p className="text-gray-500 text-sm">
                ไม่มีการประเมินนักศึกษาที่ตรงกับเงื่อนไขที่เลือก
              </p>
            </div>
          ) : (
            filteredStudentEvaluations.map((evaluation) => (
              <div
                key={evaluation.id}
                className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  
                  {/* Main Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {evaluation.student.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          รหัสนักศึกษา: {evaluation.student.studentId}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          บริษัท: {evaluation.company.companyNameTh}
                        </p>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(evaluation.status)}`}>
                          {getStatusText(evaluation.status)}
                        </span>
                      </div>
                      
                      {evaluation.overallScore && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {evaluation.overallScore.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-500">คะแนนรวม</div>
                        </div>
                      )}
                    </div>
                    
                    {evaluation.overallScore && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>คุณภาพงาน</span>
                            <span>{evaluation.workQuality}/5</span>
                          </div>
                          {evaluation.workQuality && renderScoreBar(evaluation.workQuality)}
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>ความตรงต่อเวลา</span>
                            <span>{evaluation.punctuality}/5</span>
                          </div>
                          {evaluation.punctuality && renderScoreBar(evaluation.punctuality)}
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>การทำงานเป็นทีม</span>
                            <span>{evaluation.teamwork}/5</span>
                          </div>
                          {evaluation.teamwork && renderScoreBar(evaluation.teamwork)}
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>ความคิดริเริ่ม</span>
                            <span>{evaluation.initiative}/5</span>
                          </div>
                          {evaluation.initiative && renderScoreBar(evaluation.initiative)}
                        </div>
                      </div>
                    )}
                    
                    {evaluation.comments && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">ความคิดเห็น</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                          {evaluation.comments}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-48">
                    <Link
                      href={`/visitor/evaluate/student/${evaluation.id}`}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-center"
                    >
                      {evaluation.status === 'completed' ? 'ดูรายละเอียด' : 'รายละเอียด'}
                    </Link>
                    
                    {evaluation.status !== 'completed' && (
                      <Link
                        href={`/visitor/evaluate/student/${evaluation.id}/edit`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium text-center"
                      >
                        {evaluation.status === 'draft' ? 'แก้ไข' : 'ประเมิน'}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Company Evaluations */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          {filteredCompanyEvaluations.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h4m6 0h4M7 15h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ไม่มีการประเมินบริษัท
              </h3>
              <p className="text-gray-500 text-sm">
                ไม่มีการประเมินบริษัทที่ตรงกับเงื่อนไขที่เลือก
              </p>
            </div>
          ) : (
            filteredCompanyEvaluations.map((evaluation) => (
              <div
                key={evaluation.id}
                className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  
                  {/* Main Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {evaluation.company.companyNameTh}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          นักศึกษา: {evaluation.student.name} ({evaluation.student.studentId})
                        </p>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(evaluation.status)}`}>
                          {getStatusText(evaluation.status)}
                        </span>
                      </div>
                      
                      {evaluation.overallSatisfaction && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {evaluation.overallSatisfaction.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-500">ความพึงพอใจ</div>
                        </div>
                      )}
                    </div>
                    
                    {evaluation.overallSatisfaction && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>สภาพแวดล้อม</span>
                            <span>{evaluation.workEnvironment}/5</span>
                          </div>
                          {evaluation.workEnvironment && renderScoreBar(evaluation.workEnvironment)}
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>การดูแล</span>
                            <span>{evaluation.supervision}/5</span>
                          </div>
                          {evaluation.supervision && renderScoreBar(evaluation.supervision)}
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>โอกาสเรียนรู้</span>
                            <span>{evaluation.learningOpportunities}/5</span>
                          </div>
                          {evaluation.learningOpportunities && renderScoreBar(evaluation.learningOpportunities)}
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>สิ่งอำนวยความสะดวก</span>
                            <span>{evaluation.facilities}/5</span>
                          </div>
                          {evaluation.facilities && renderScoreBar(evaluation.facilities)}
                        </div>
                      </div>
                    )}
                    
                    {evaluation.comments && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">ความคิดเห็น</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                          {evaluation.comments}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-48">
                    <Link
                      href={`/visitor/evaluate/company/${evaluation.id}`}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-center"
                    >
                      {evaluation.status === 'completed' ? 'ดูรายละเอียด' : 'รายละเอียด'}
                    </Link>
                    
                    {evaluation.status !== 'completed' && (
                      <Link
                        href={`/visitor/evaluate/company/${evaluation.id}/edit`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium text-center"
                      >
                        {evaluation.status === 'draft' ? 'แก้ไข' : 'ประเมิน'}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-600">
            {studentEvaluations.length}
          </div>
          <div className="text-sm text-gray-600">ประเมินนักศึกษา</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600">
            {companyEvaluations.length}
          </div>
          <div className="text-sm text-gray-600">ประเมินบริษัท</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {[...studentEvaluations, ...companyEvaluations].filter(e => e.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">รอประเมิน</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
          <div className="text-2xl font-bold text-purple-600">
            {[...studentEvaluations, ...companyEvaluations].filter(e => e.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">เสร็จสิ้น</div>
        </div>
      </div>
    </div>
  );
}