'use client';

import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

dayjs.locale('th');

interface YearEvent {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  type: 'semester' | 'holiday' | 'registration' | 'exam';
  color: string;
}

interface YearOverviewProps {
  year: number;
  events: YearEvent[];
  onMonthClick?: (month: Date) => void;
  onEventClick?: (event: YearEvent) => void;
}

export const YearOverview: React.FC<YearOverviewProps> = ({
  year,
  events = [],
  onMonthClick,
  onEventClick,
}) => {
  // Generate months for the year
  const months = useMemo(() => {
    const yearStart = dayjs().year(year).startOf('year');
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push(yearStart.month(i).toDate());
    }
    return months;
  }, [year]);

  // Get events for a specific month
  const getEventsForMonth = (month: Date) => {
    const monthObj = dayjs(month);
    const monthStart = monthObj.startOf('month');
    const monthEnd = monthObj.endOf('month');
    
    return events.filter(event => {
      const eventStart = dayjs(event.startDate);
      const eventEnd = dayjs(event.endDate);
      
      return eventStart.isSameOrBefore(monthEnd) && eventEnd.isSameOrAfter(monthStart);
    });
  };

  // Get event type styles
  const getEventTypeStyles = (type: YearEvent['type']) => {
    switch (type) {
      case 'semester':
        return 'bg-blue-100 text-blue-800 border-l-4 border-blue-500';
      case 'holiday':
        return 'bg-red-100 text-red-800 border-l-4 border-red-500';
      case 'registration':
        return 'bg-green-100 text-green-800 border-l-4 border-green-500';
      case 'exam':
        return 'bg-purple-100 text-purple-800 border-l-4 border-purple-500';
      default:
        return 'bg-gray-100 text-gray-800 border-l-4 border-gray-500';
    }
  };

  // Get semester statistics
  const semesterStats = useMemo(() => {
    const semesters = events.filter(e => e.type === 'semester');
    const holidays = events.filter(e => e.type === 'holiday');
    const registrations = events.filter(e => e.type === 'registration');
    const exams = events.filter(e => e.type === 'exam');

    return {
      semesters: semesters.length,
      holidays: holidays.length,
      registrations: registrations.length,
      exams: exams.length,
    };
  }, [events]);

  return (
    <div className="space-y-6">
      {/* Year Statistics */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          สรุปปีการศึกษา {year}
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{semesterStats.semesters}</div>
            <div className="text-sm text-blue-700">ภาคการศึกษา</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{semesterStats.holidays}</div>
            <div className="text-sm text-red-700">วันหยุด</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{semesterStats.registrations}</div>
            <div className="text-sm text-green-700">ช่วงลงทะเบียน</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{semesterStats.exams}</div>
            <div className="text-sm text-purple-700">ช่วงสอบ</div>
          </div>
        </div>
      </div>

      {/* Monthly Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ภาพรวมรายเดือน
        </h3>
        <div className="grid grid-cols-3 gap-6">
          {months.map((month, index) => {
            const monthEvents = getEventsForMonth(month);
            
            return (
              <div
                key={index}
                className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
                onClick={() => onMonthClick?.(month)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-semibold text-gray-900">
                    {dayjs(month).format('MMMM')}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {monthEvents.length} กิจกรรม
                  </span>
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {monthEvents.slice(0, 4).map(event => (
                    <div
                      key={event.id}
                      className={`text-xs px-3 py-2 rounded-md cursor-pointer transition-all hover:shadow-sm ${getEventTypeStyles(event.type)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      title={`${event.title} (${dayjs(event.startDate).format('DD/MM')} - ${dayjs(event.endDate).format('DD/MM')})`}
                    >
                      <div className="font-medium truncate">
                        {event.title}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {dayjs(event.startDate).format('DD/MM')} - {dayjs(event.endDate).format('DD/MM')}
                      </div>
                    </div>
                  ))}
                  
                  {monthEvents.length > 4 && (
                    <div className="text-xs text-gray-500 px-3 py-2 text-center">
                      +{monthEvents.length - 4} กิจกรรมเพิ่มเติม
                    </div>
                  )}
                  
                  {monthEvents.length === 0 && (
                    <div className="text-xs text-gray-400 px-3 py-2 text-center italic">
                      ไม่มีกิจกรรม
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline View */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ไทม์ไลน์ปีการศึกษา
        </h3>
        
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          <div className="space-y-4">
            {events
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
              .map((event, index) => (
                <div key={event.id} className="relative flex items-start">
                  {/* Timeline dot */}
                  <div className={`relative z-10 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                    event.type === 'semester' ? 'bg-blue-500' :
                    event.type === 'holiday' ? 'bg-red-500' :
                    event.type === 'registration' ? 'bg-green-500' :
                    event.type === 'exam' ? 'bg-purple-500' : 'bg-gray-500'
                  }`}></div>
                  
                  {/* Event content */}
                  <div className="ml-4 flex-1">
                    <div className={`p-3 rounded-lg cursor-pointer transition-all hover:shadow-sm ${getEventTypeStyles(event.type)}`}
                         onClick={() => onEventClick?.(event)}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{event.title}</h4>
                        <span className="text-xs opacity-75">
                          {dayjs(event.startDate).format('DD MMM')} - 
                          {dayjs(event.endDate).format('DD MMM')}
                        </span>
                      </div>
                      
                      {/* Duration indicator */}
                      <div className="mt-2">
                        <div className="text-xs opacity-75">
                          ระยะเวลา: {Math.ceil((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60 * 24))} วัน
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YearOverview;