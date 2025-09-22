'use client';

import { useState, useEffect } from 'react';

// Mock data types
interface SystemSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  academicYear: string;
  semester: string;
  registrationOpen: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  emailNotifications: boolean;
  smsNotifications: boolean;
  maintenanceMode: boolean;
  backupFrequency: string;
  sessionTimeout: number;
}

interface UserRole {
  id: number;
  name: string;
  displayName: string;
  permissions: string[];
  userCount: number;
}

export default function AdminSettingPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'academic' | 'notifications' | 'security' | 'roles'>('general');

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockSettings: SystemSettings = {
          siteName: 'ระบบจัดการฝึกงาน',
          siteDescription: 'ระบบจัดการฝึกงานและสหกิจศึกษาสำหรับนักศึกษา',
          contactEmail: 'admin@university.ac.th',
          contactPhone: '02-123-4567',
          academicYear: '2567',
          semester: '1',
          registrationOpen: true,
          maxFileSize: 10485760, // 10MB
          allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png'],
          emailNotifications: true,
          smsNotifications: false,
          maintenanceMode: false,
          backupFrequency: 'daily',
          sessionTimeout: 30
        };

        const mockRoles: UserRole[] = [
          {
            id: 1,
            name: 'admin',
            displayName: 'ผู้ดูแลระบบ',
            permissions: ['manage_users', 'manage_settings', 'view_reports', 'manage_documents'],
            userCount: 2
          },
          {
            id: 2,
            name: 'instructor',
            displayName: 'อาจารย์',
            permissions: ['view_students', 'approve_requests', 'assign_visitors', 'grade_students'],
            userCount: 15
          },
          {
            id: 3,
            name: 'student',
            displayName: 'นักศึกษา',
            permissions: ['submit_requests', 'view_own_data', 'evaluate_companies'],
            userCount: 250
          },
          {
            id: 4,
            name: 'visitor',
            displayName: 'อาจารย์นิเทศ',
            permissions: ['visit_students', 'evaluate_students', 'evaluate_companies'],
            userCount: 8
          }
        ];
        
        setSettings(mockSettings);
        setRoles(mockRoles);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    if (!settings) return;
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading || !settings) {
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
          ตั้งค่าระบบ
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          จัดการการตั้งค่าและการกำหนดสิทธิ์ของระบบ
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'general'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          ทั่วไป
        </button>
        <button
          onClick={() => setActiveTab('academic')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'academic'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          การศึกษา
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'notifications'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          การแจ้งเตือน
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          ความปลอดภัย
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'roles'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          สิทธิ์ผู้ใช้
        </button>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">การตั้งค่าทั่วไป</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อเว็บไซต์
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => updateSetting('siteName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมลติดต่อ
                </label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => updateSetting('contactEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำอธิบายเว็บไซต์
              </label>
              <textarea
                rows={3}
                value={settings.siteDescription}
                onChange={(e) => updateSetting('siteDescription', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เบอร์โทรติดต่อ
              </label>
              <input
                type="tel"
                value={settings.contactPhone}
                onChange={(e) => updateSetting('contactPhone', e.target.value)}
                className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Academic Settings */}
      {activeTab === 'academic' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">การตั้งค่าการศึกษา</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ปีการศึกษาปัจจุบัน
                </label>
                <select
                  value={settings.academicYear}
                  onChange={(e) => updateSetting('academicYear', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="2566">2566</option>
                  <option value="2567">2567</option>
                  <option value="2568">2568</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ภาคการศึกษาปัจจุบัน
                </label>
                <select
                  value={settings.semester}
                  onChange={(e) => updateSetting('semester', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="registrationOpen"
                checked={settings.registrationOpen}
                onChange={(e) => updateSetting('registrationOpen', e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="registrationOpen" className="text-sm font-medium text-gray-700">
                เปิดรับสมัครฝึกงาน
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ขนาดไฟล์สูงสุด
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1048576"
                  max="52428800"
                  step="1048576"
                  value={settings.maxFileSize}
                  onChange={(e) => updateSetting('maxFileSize', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 min-w-[4rem]">
                  {formatFileSize(settings.maxFileSize)}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทไฟล์ที่อนุญาต
              </label>
              <div className="flex flex-wrap gap-2">
                {['pdf', 'doc', 'docx', 'jpg', 'png', 'gif', 'xlsx', 'pptx'].map(type => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.allowedFileTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateSetting('allowedFileTypes', [...settings.allowedFileTypes, type]);
                        } else {
                          updateSetting('allowedFileTypes', settings.allowedFileTypes.filter(t => t !== type));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 uppercase">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">การตั้งค่าการแจ้งเตือน</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">การแจ้งเตือนทางอีเมล</h3>
                <p className="text-sm text-gray-600">ส่งการแจ้งเตือนไปยังอีเมลของผู้ใช้</p>
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
            
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">การแจ้งเตือนทาง SMS</h3>
                <p className="text-sm text-gray-600">ส่งการแจ้งเตือนไปยังโทรศัพท์มือถือ</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.smsNotifications}
                  onChange={(e) => updateSetting('smsNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">การตั้งค่าความปลอดภัย</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">โหมดบำรุงรักษา</h3>
                <p className="text-sm text-gray-600">ปิดระบบชั่วคราวเพื่อบำรุงรักษา</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => updateSetting('maintenanceMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ระยะเวลา Session Timeout (นาที)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={settings.sessionTimeout}
                onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                className="w-full sm:w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ความถี่ในการสำรองข้อมูล
              </label>
              <select
                value={settings.backupFrequency}
                onChange={(e) => updateSetting('backupFrequency', e.target.value)}
                className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="hourly">ทุกชั่วโมง</option>
                <option value="daily">ทุกวัน</option>
                <option value="weekly">ทุกสัปดาห์</option>
                <option value="monthly">ทุกเดือน</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* User Roles */}
      {activeTab === 'roles' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">การจัดการสิทธิ์ผู้ใช้</h2>
          
          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{role.displayName}</h3>
                    <p className="text-sm text-gray-600">ผู้ใช้: {role.userCount} คน</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {role.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                      แก้ไข
                    </button>
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                      จัดการสิทธิ์
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end mt-8">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>
    </div>
  );
}