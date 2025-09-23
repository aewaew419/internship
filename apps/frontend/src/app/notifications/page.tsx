'use client';

import { useState, useEffect } from 'react';
import { BellIcon, CheckIcon, XMarkIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionText?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Mock API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockNotifications: Notification[] = [
          {
            id: 1,
            title: 'คำร้องได้รับการอนุมัติ',
            message: 'คำร้องขอฝึกงานของคุณได้รับการอนุมัติจากอาจารย์ที่ปรึกษาแล้ว',
            type: 'success',
            read: false,
            createdAt: '2024-01-15T10:30:00Z',
            actionUrl: '/intern-request/status',
            actionText: 'ดูรายละเอียด'
          },
          {
            id: 2,
            title: 'เอกสารต้องการแก้ไข',
            message: 'เอกสารประวัติส่วนตัวของคุณต้องการการแก้ไข กรุณาตรวจสอบและอัปโหลดใหม่',
            type: 'warning',
            read: false,
            createdAt: '2024-01-14T15:45:00Z',
            actionUrl: '/documents',
            actionText: 'แก้ไขเอกสาร'
          },
          {
            id: 3,
            title: 'กำหนดส่งเอกสารใกล้หมดแล้ว',
            message: 'กำหนดส่งเอกสารการฝึกงานจะหมดในอีก 3 วัน กรุณาเตรียมเอกสารให้พร้อม',
            type: 'warning',
            read: true,
            createdAt: '2024-01-13T09:15:00Z',
            actionUrl: '/documents',
            actionText: 'ดูเอกสาร'
          },
          {
            id: 4,
            title: 'มีการมอบหมายอาจารย์นิเทศ',
            message: 'อาจารย์นิเทศได้รับการมอบหมายแล้ว: ผศ.ดร.สมหญิง รักการสอน',
            type: 'info',
            read: true,
            createdAt: '2024-01-12T14:20:00Z',
            actionUrl: '/intern-request/status',
            actionText: 'ดูข้อมูลอาจารย์'
          },
          {
            id: 5,
            title: 'ระบบจะปิดปรับปรุง',
            message: 'ระบบจะปิดปรับปรุงในวันเสาร์ที่ 20 มกราคม 2567 เวลา 02:00-06:00 น.',
            type: 'info',
            read: true,
            createdAt: '2024-01-11T16:00:00Z'
          }
        ];
        
        setNotifications(mockNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'read':
        return notification.read;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = async () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = async (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <CheckIcon className="w-4 h-4 text-green-600" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <XMarkIcon className="w-4 h-4 text-red-600" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <BellIconSolid className="w-4 h-4 text-blue-600" />
          </div>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'เมื่อสักครู่';
    } else if (diffInHours < 24) {
      return `${diffInHours} ชั่วโมงที่แล้ว`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} วันที่แล้ว`;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          <BellIcon className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              การแจ้งเตือน
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600">
                คุณมีการแจ้งเตือนใหม่ {unreadCount} รายการ
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link
            href="/notifications/settings"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'all', label: 'ทั้งหมด', count: notifications.length },
          { key: 'unread', label: 'ยังไม่อ่าน', count: unreadCount },
          { key: 'read', label: 'อ่านแล้ว', count: notifications.length - unreadCount }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Actions */}
      {unreadCount > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'unread' ? 'ไม่มีการแจ้งเตือนใหม่' : 
               filter === 'read' ? 'ไม่มีการแจ้งเตือนที่อ่านแล้ว' : 
               'ไม่มีการแจ้งเตือน'}
            </h3>
            <p className="text-gray-500">
              {filter === 'unread' ? 'การแจ้งเตือนใหม่จะปรากฏที่นี่' : 
               filter === 'read' ? 'การแจ้งเตือนที่อ่านแล้วจะปรากฏที่นี่' : 
               'การแจ้งเตือนจะปรากฏที่นี่เมื่อมีกิจกรรมใหม่'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white p-4 rounded-2xl shadow-sm border transition-all hover:shadow-md ${
                !notification.read ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
              }`}
            >
              <div className="flex gap-3">
                
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className={`font-medium text-gray-900 ${
                        !notification.read ? 'font-semibold' : ''
                      }`}>
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    
                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-3">
                    {notification.actionUrl && (
                      <Link
                        href={notification.actionUrl}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        onClick={() => markAsRead(notification.id)}
                      >
                        {notification.actionText || 'ดูรายละเอียด'}
                      </Link>
                    )}
                    
                    <div className="flex items-center gap-2 ml-auto">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          ทำเครื่องหมายว่าอ่านแล้ว
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        ลบ
                      </button>
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