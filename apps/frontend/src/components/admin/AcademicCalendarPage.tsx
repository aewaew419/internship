'use client';

import React, { useState, useCallback } from 'react';
import { AcademicCalendarView } from './AcademicCalendarView';

// Mock data for demonstration
const mockSemesters = [
  {
    id: 1,
    name: 'ภาคการศึกษาที่ 1/2567',
    academicYear: '2567',
    startDate: '2024-08-15',
    endDate: '2024-12-20',
    registrationStartDate: '2024-07-01',
    registrationEndDate: '2024-08-10',
    examStartDate: '2024-12-10',
    examEndDate: '2024-12-20',
    isActive: true,
    holidays: [
      {
        id: 1,
        name: 'วันแม่แห่งชาติ',
        startDate: '2024-08-12',
        endDate: '2024-08-12',
        type: 'national' as const,
        description: 'วันหยุดราชการ',
        isRecurring: true,
        semesterId: 1,
      },
      {
        id: 2,
        name: 'วันปิยมหาราช',
        startDate: '2024-10-23',
        endDate: '2024-10-23',
        type: 'national' as const,
        description: 'วันหยุดราชการ',
        isRecurring: true,
        semesterId: 1,
      },
    ],
  },
  {
    id: 2,
    name: 'ภาคการศึกษาที่ 2/2567',
    academicYear: '2567',
    startDate: '2025-01-15',
    endDate: '2025-05-20',
    registrationStartDate: '2024-12-01',
    registrationEndDate: '2025-01-10',
    examStartDate: '2025-05-10',
    examEndDate: '2025-05-20',
    isActive: false,
    holidays: [
      {
        id: 3,
        name: 'วันสงกรานต์',
        startDate: '2025-04-13',
        endDate: '2025-04-15',
        type: 'national' as const,
        description: 'วันหยุดยาว',
        isRecurring: true,
        semesterId: 2,
      },
    ],
  },
];

const mockHolidays = [
  {
    id: 4,
    name: 'วันขึ้นปีใหม่',
    startDate: '2025-01-01',
    endDate: '2025-01-01',
    type: 'national' as const,
    description: 'วันหยุดราชการ',
    isRecurring: true,
  },
  {
    id: 5,
    name: 'วันจักรี',
    startDate: '2025-04-06',
    endDate: '2025-04-06',
    type: 'national' as const,
    description: 'วันหยุดราชการ',
    isRecurring: true,
  },
];

export const AcademicCalendarPage: React.FC = () => {
  const [semesters, setSemesters] = useState(mockSemesters);
  const [holidays, setHolidays] = useState(mockHolidays);
  const [academicYear] = useState('2567');

  // Semester handlers
  const handleSemesterCreate = useCallback(async (semester: Omit<typeof mockSemesters[0], 'id'>) => {
    console.log('Creating semester:', semester);
    const newSemester = {
      ...semester,
      id: Math.max(...semesters.map(s => s.id)) + 1,
    };
    setSemesters(prev => [...prev, newSemester]);
  }, [semesters]);

  const handleSemesterUpdate = useCallback(async (id: number, updates: Partial<typeof mockSemesters[0]>) => {
    console.log('Updating semester:', id, updates);
    setSemesters(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const handleSemesterDelete = useCallback(async (id: number) => {
    console.log('Deleting semester:', id);
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบภาคการศึกษานี้?')) {
      setSemesters(prev => prev.filter(s => s.id !== id));
    }
  }, []);

  // Holiday handlers
  const handleHolidayCreate = useCallback(async (holiday: Omit<typeof mockHolidays[0], 'id'>) => {
    console.log('Creating holiday:', holiday);
    const newHoliday = {
      ...holiday,
      id: Math.max(...holidays.map(h => h.id)) + 1,
    };
    setHolidays(prev => [...prev, newHoliday]);
  }, [holidays]);

  const handleHolidayUpdate = useCallback(async (id: number, updates: Partial<typeof mockHolidays[0]>) => {
    console.log('Updating holiday:', id, updates);
    setHolidays(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  }, []);

  const handleHolidayDelete = useCallback(async (id: number) => {
    console.log('Deleting holiday:', id);
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบวันหยุดนี้?')) {
      setHolidays(prev => prev.filter(h => h.id !== id));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AcademicCalendarView
          academicYear={academicYear}
          semesters={semesters}
          holidays={holidays}
          onSemesterCreate={handleSemesterCreate}
          onSemesterUpdate={handleSemesterUpdate}
          onSemesterDelete={handleSemesterDelete}
          onHolidayCreate={handleHolidayCreate}
          onHolidayUpdate={handleHolidayUpdate}
          onHolidayDelete={handleHolidayDelete}
        />
      </div>
    </div>
  );
};

export default AcademicCalendarPage;