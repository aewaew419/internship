'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock data types
interface TrainingSession {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
  maxParticipants: number;
  currentParticipants: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  isRegistered: boolean;
  registrationDeadline?: string;
}

export default function AttendTrainingPage() {
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'registered' | 'completed'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockSessions: TrainingSession[] = [
          {
            id: 1,
            title: 'การเตรียมความพร้อมก่อนฝึกงาน',
            description: 'อบรมเพื่อเตรียมความพร้อมของนักศึกษาก่อนออกฝึกงาน ครอบคลุมเรื่องมารยาท การแต่งกาย และการปฏิบัติตัวในสถานประกอบการ',
            date: '2024-02-15',
            time: '09:00 - 12:00',
            location: 'ห้องประชุม A301',
            instructor: 'อาจารย์สมชาย ใจดี',
            maxParticipants: 50,
            currentParticipants: 35,
            status: 'upcoming',
            isRegistered: true,
            registrationDeadline: '2024-02-10'
          },
          {
            id: 2,
            title: 'การเขียนรายงานฝึกงาน',
            description: 'แนวทางการเขียนรายงานฝึกงานที่ถูกต้อง รูปแบบการนำเสนอ และเทคนิคการเขียนที่มีประสิทธิภาพ',
            date: '2024-03-01',
            time: '13:00 - 16:00',
            location: 'ห้องประชุม B205',
            instructor: 'อาจารย์สมหญิง รักงาน',
            maxParticipants: 40,
            currentParticipants: 28,
            status: 'upcoming',
            isRegistered: false,
            registrationDeadline: '2024-02-25'
          },
          {
            id: 3,
            title: 'การประเมินผลการฝึกงาน',
            description: 'หลักเกณฑ์และวิธีการประเมินผลการฝึกงาน การให้คะแนน และการให้ข้อเสนะแนะแก่นักศึกษา',
            date: '2024-01-20',
            time: '09:00 - 15:00',
            location: 'ห้องประชุมใหญ่',
            instructor: 'อาจารย์สมศักดิ์ ขยันสอน',
            maxParticipants: 60,
            currentParticipants: 45,
            status: 'completed',
            isRegistered: true
          },
          {
            id: 4,
            title: 'เทคโนโลยีใหม่ในการศึกษา',
            description: 'การใช้เทคโนโลジีสมัยใหม่ในการจัดการเรียนการสอนและการติดตามนักศึกษาฝึกงาน',
            date: '2024-03-15',
            time: '10:00 - 14:00',
            location: 'ห้องคอมพิวเตอร์ 1',
            instructor: 'อาจารย์สมปอง เทคโนโลยี',
            maxParticipants: 30,
            currentParticipants: 15,
            status: 'upcoming',
            isRegistered: false,
            registrationDeadline: '2024-03-10'
          }
        ];
        
        setTrainingSessions(mockSessions);
      } catch (error) {
        console.error('Error fetching training sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredSessions = trainingSessions.filter(session => {
    switch (filter) {
      case 'upcoming':
        return session.status === 'upcoming';
      case 'registered':
        return session.isRegistered;
      case 'completed':
        return session.status === 'completed';
      default:
        return true;
    }
  });

  const handleRegister = async (sessionId: number) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTrainingSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { 
              ...session, 
              isRegistered: true,
              currentParticipants: session.currentParticipants + 1
            }
          : session
      ));
    } catch (error) {
      console.error('Error registering for training:', error);
    }
  };

  const handleUnregister = async (sessionId: number) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTrainingSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { 
              ...session, 
              isRegistered: false,
              currentParticipants: Math.max(0, session.currentParticipants - 1)
            }
          : session
      ));
    } catch (error) {
      console.error('Error unregistering from training:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'เสร็จสิ้น';
      case 'ongoing':
        return 'กำลังดำเนินการ';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return 'กำลังจะมาถึง';
    }
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
          อบรมสำหรับอาจารย์
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          เข้าร่วมอบรมเพื่อพัฒนาทักษะการดูแลและประเมินนักศึกษาฝึกงาน
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
          ทั้งหมด ({trainingSessions.length})
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'upcoming'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          กำลังจะมาถึง ({trainingSessions.filter(s => s.status === 'upcoming').length})
        </button>
        <button
          onClick={() => setFilter('registered')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'registered'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ลงทะเบียนแล้ว ({trainingSessions.filter(s => s.isRegistered).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          เสร็จสิ้น ({trainingSessions.filter(s => s.status === 'completed').length})
        </button>
      </div>

      {/* Training Sessions */}
      <div className="space-y-6">
        {filteredSessions.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่มีการอบรม
            </h3>
            <p className="text-gray-500 text-sm">
              ไม่มีการอบรมที่ตรงกับเงื่อนไขที่เลือก
            </p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Main Content */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                        {session.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        {getStatusText(session.status)}
                      </span>
                    </div>
                    
                    {session.isRegistered && (
                      <div className="flex items-center gap-2 text-green-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium">ลงทะเบียนแล้ว</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {session.description}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-600">
                        {new Date(session.date).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600">{session.time}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-gray-600">{session.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-gray-600">{session.instructor}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        ผู้เข้าร่วม: {session.currentParticipants}/{session.maxParticipants}
                      </span>
                      {session.registrationDeadline && session.status === 'upcoming' && (
                        <span className="text-orange-600">
                          ปิดรับสมัคร: {new Date(session.registrationDeadline).toLocaleDateString('th-TH')}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Link
                        href={`/instructor/attend-training/${session.id}`}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        รายละเอียด
                      </Link>
                      
                      {session.status === 'upcoming' && (
                        session.isRegistered ? (
                          <button
                            onClick={() => handleUnregister(session.id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            ยกเลิกการลงทะเบียน
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRegister(session.id)}
                            disabled={session.currentParticipants >= session.maxParticipants}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {session.currentParticipants >= session.maxParticipants ? 'เต็มแล้ว' : 'ลงทะเบียน'}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}