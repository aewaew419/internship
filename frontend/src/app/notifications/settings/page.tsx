'use client';

import { useState, useEffect } from 'react';
import { BellIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  assignmentChanges: boolean;
  gradeUpdates: boolean;
  scheduleReminders: boolean;
  systemAnnouncements: boolean;
  documentUpdates: boolean;
  deadlineReminders: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  frequency: 'immediate' | 'daily' | 'weekly';
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: true,
    assignmentChanges: true,
    gradeUpdates: true,
    scheduleReminders: true,
    systemAnnouncements: false,
    documentUpdates: true,
    deadlineReminders: true,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    },
    frequency: 'immediate'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    setPushSupported('Notification' in window && 'serviceWorker' in navigator);
    
    // Load settings
    const loadSettings = async () => {
      try {
        // Mock API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // In real app, load from API
        const savedSettings = localStorage.getItem('notificationSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateQuietHours = (key: keyof NotificationSettings['quietHours'], value: any) => {
    setSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [key]: value
      }
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real app, save to API
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      
      // Request permission for push notifications if enabled
      if (settings.pushNotifications && pushSupported) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          updateSetting('pushNotifications', false);
          alert('การแจ้งเตือนถูกปฏิเสธ กรุณาเปิดใช้งานในการตั้งค่าเบราว์เซอร์');
        }
      }
      
      alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    } finally {
      setSaving(false);
    }
  };

  const testNotification = async () => {
    if (!pushSupported) {
      alert('เบราว์เซอร์ของคุณไม่รองรับการแจ้งเตือน');
      return;
    }

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('กรุณาอนุญาตการแจ้งเตือนในเบราว์เซอร์');
        return;
      }
    }

    new Notification('ทดสอบการแจ้งเตือน', {
      body: 'นี่คือการแจ้งเตือนทดสอบจากระบบจัดการฝึกงาน',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/notifications"
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            การตั้งค่าการแจ้งเตือน
          </h1>
          <p className="text-sm text-gray-600">
            จัดการการแจ้งเตือนและความถี่ที่คุณต้องการรับ
          </p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Delivery Methods */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">วิธีการแจ้งเตือน</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DevicePhoneMobileIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">การแจ้งเตือนผ่านเบราว์เซอร์</p>
                  <p className="text-sm text-gray-500">รับการแจ้งเตือนแบบ push notification</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={testNotification}
                  disabled={!settings.pushNotifications || !pushSupported}
                  className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                >
                  ทดสอบ
                </button>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) => updateSetting('pushNotifications', e.target.checked)}
                    disabled={!pushSupported}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">การแจ้งเตือนทางอีเมล</p>
                  <p className="text-sm text-gray-500">รับการแจ้งเตือนผ่านอีเมล</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ประเภทการแจ้งเตือน</h2>
          
          <div className="space-y-4">
            {[
              { key: 'assignmentChanges', label: 'การเปลี่ยนแปลงการมอบหมาย', desc: 'เมื่อมีการเปลี่ยนแปลงอาจารย์ที่ปรึกษาหรืออาจารย์นิเทศ' },
              { key: 'gradeUpdates', label: 'การอัปเดตเกรด', desc: 'เมื่อมีการบันทึกหรือแก้ไขเกรด' },
              { key: 'scheduleReminders', label: 'การแจ้งเตือนกำหนดการ', desc: 'เตือนกำหนดการสำคัญและการนัดหมาย' },
              { key: 'documentUpdates', label: 'การอัปเดตเอกสาร', desc: 'เมื่อมีการอนุมัติหรือปฏิเสธเอกสาร' },
              { key: 'deadlineReminders', label: 'การแจ้งเตือนกำหนดส่ง', desc: 'เตือนก่อนถึงกำหนดส่งเอกสารหรืองาน' },
              { key: 'systemAnnouncements', label: 'ประกาศระบบ', desc: 'ข่าวสารและประกาศจากระบบ' }
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={settings[item.key as keyof NotificationSettings] as boolean}
                    onChange={(e) => updateSetting(item.key as keyof NotificationSettings, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ความถี่การแจ้งเตือน</h2>
          
          <div className="space-y-3">
            {[
              { value: 'immediate', label: 'ทันที', desc: 'รับการแจ้งเตือนทันทีเมื่อมีกิจกรรม' },
              { value: 'daily', label: 'รายวัน', desc: 'รับสรุปการแจ้งเตือนวันละครั้ง' },
              { value: 'weekly', label: 'รายสัปดาห์', desc: 'รับสรุปการแจ้งเตือนสัปดาห์ละครั้ง' }
            ].map(option => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  value={option.value}
                  checked={settings.frequency === option.value}
                  onChange={(e) => updateSetting('frequency', e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="font-medium text-gray-900">{option.label}</p>
                  <p className="text-sm text-gray-500">{option.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">ช่วงเวลาเงียบ</h2>
              <p className="text-sm text-gray-500">ไม่รับการแจ้งเตือนในช่วงเวลาที่กำหนด</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.quietHours.enabled}
                onChange={(e) => updateQuietHours('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">เริ่มเวลา</label>
                <input
                  type="time"
                  value={settings.quietHours.startTime}
                  onChange={(e) => updateQuietHours('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สิ้นสุดเวลา</label>
                <input
                  type="time"
                  value={settings.quietHours.endTime}
                  onChange={(e) => updateQuietHours('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
        </div>
      </div>
    </div>
  );
}