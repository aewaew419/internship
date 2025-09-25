'use client';

import React, { useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.locale('th');

interface CalendarEvent {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  type: 'semester' | 'holiday' | 'registration' | 'exam';
  color: string;
}

interface CalendarGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventDrop?: (eventId: number, newDate: Date) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  events = [],
  onDateClick,
  onEventClick,
  onEventDrop,
}) => {
  // Generate calendar days
  const calendarDays = useMemo(() => {
    const current = dayjs(currentDate);
    const monthStart = current.startOf('month');
    const monthEnd = current.endOf('month');
    const calendarStart = monthStart.startOf('week'); // Sunday
    const calendarEnd = monthEnd.endOf('week');

    const days = [];
    let day = calendarStart;
    while (day.isSameOrBefore(calendarEnd)) {
      days.push(day.toDate());
      day = day.add(1, 'day');
    }
    return days;
  }, [currentDate]);

  // Get events for a specific date
  const getEventsForDate = useCallback((date: Date) => {
    const currentDay = dayjs(date);
    return events.filter(event => {
      const eventStart = dayjs(event.startDate);
      const eventEnd = dayjs(event.endDate);
      return currentDay.isSameOrAfter(eventStart, 'day') && currentDay.isSameOrBefore(eventEnd, 'day');
    });
  }, [events]);

  // Handle drag and drop
  const handleDragStart = useCallback((e: React.DragEvent, event: CalendarEvent) => {
    e.dataTransfer.setData('text/plain', event.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const eventId = parseInt(e.dataTransfer.getData('text/plain'));
    if (eventId && onEventDrop) {
      onEventDrop(eventId, date);
    }
  }, [onEventDrop]);

  // Get event type styles
  const getEventTypeStyles = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'semester':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'holiday':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'registration':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'exam':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const weekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header with day names */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="p-3 text-center text-sm font-medium text-gray-700 border-r last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const dayObj = dayjs(day);
          const currentMonth = dayjs(currentDate);
          const isCurrentMonth = dayObj.isSame(currentMonth, 'month');
          const isCurrentDay = dayObj.isSame(dayjs(), 'day');
          
          return (
            <div
              key={index}
              className={`min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors hover:bg-gray-50 ${
                !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
              }`}
              onClick={() => onDateClick?.(day)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
            >
              {/* Date number */}
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`text-sm font-medium ${
                    isCurrentDay
                      ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                      : isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  {dayjs(day).format('D')}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs px-2 py-1 rounded border cursor-pointer transition-all hover:shadow-sm ${getEventTypeStyles(event.type)}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, event)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    title={event.title}
                  >
                    <div className="truncate font-medium">
                      {event.title}
                    </div>
                  </div>
                ))}
                
                {/* Show more indicator */}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 px-2 py-1">
                    +{dayEvents.length - 3} เพิ่มเติม
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;