'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, UserIcon, CheckIcon } from '@heroicons/react/24/outline';
import { User, adminMockAPI } from '@/lib/mock-data/admin';
import Link from 'next/link';

interface EditUserForm {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin' | 'committee' | 'visitor';
  status: 'active' | 'inactive' | 'suspended';
  department: string;
  studentId: string;
  phone: string;
}

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = parseInt(params.id as string);
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<EditUserForm>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'student',
    status: 'active',
    department: '',
    studentId: '',
    phone: ''
  });

  const [errors, setErrors] = useState<Partial<EditUserForm>>({});

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await adminMockAPI.getUserById(userId);
      
      if (!userData) {
        setError('ไม่พบผู้ใช้ที่ระบุ');
        return;
      }
      
      setUser(userData);
      setFormData({
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        status: userData.status,
        department: userData.department || '',
        studentId: userData.studentId || '',
        phone: userData.phone || ''
      });
    } catch (error) {
      console.error('Error loading user:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<EditUserForm> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'กรุณากรอกชื่อผู้ใช้';
    } else if (formData.username.length < 3) {
      newErrors.username = 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'กรุณากรอกอีเมล';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'กรุณากรอกชื่อ';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'กรุณากรอกนามสกุล';
    }

    if (formData.role === 'student' && !formData.studentId.trim()) {
      newErrors.studentId = 'กรุณากรอกรหัสนักศึกษา';
    }

    if (formData.phone && !/^[0-9-+\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'รูปแบบเบอร์โทรไม่ถูกต้อง';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;

    try {
      setSaving(true);
      
      const updateData: Partial<User> = {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        status: formData.status,
        department: formData.department || undefined,
        studentId: formData.role === 'student' ? formData.studentId : undefined,
        phone: formData.phone || undefined
      };

      await adminMockAPI.updateUser(user.id, updateData);
      
      alert('อัปเดตข้อมูลผู้ใช้สำเร็จ');
      router.push(`/admin/users/${user.id}`);
      
    } catch (error) {
      console.error('Error updating user:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof EditUserForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      student: 'นักศึกษา',
      instructor: 'อาจารย์',
      admin: 'ผู้ดูแลระบบ',
      committee: 'คณะกรรมการ',
      visitor: 'อาจารย์นิเทศ'
    };
    return labels[role as keyof typeof labels] || role;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="admin-dashboard-card">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/admin/users"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">แก้ไขผู้ใช้</h1>
        </div>

        <div className="admin-dashboard-card text-center py-12">
          <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || 'ไม่พบผู้ใช้'}
          </h3>
          <p className="text-gray-500 mb-4">
            ผู้ใช้ที่คุณต้องการแก้ไขอาจถูกลบหรือไม่มีอยู่ในระบบ
          </p>
          <Link
            href="/admin/users"
            className="admin-action-button"
          >
            กลับไปรายการผู้ใช้
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/admin/users/${user.id}`}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">แก้ไขผู้ใช้</h1>
          <p className="text-gray-600">แก้ไขข้อมูล {user.firstName} {user.lastName}</p>
        </div>
      </div>

      {/* Current User Info */}
      <div className="admin-dashboard-card mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <span className="text-gray-600 font-medium text-lg">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-xs text-gray-500">
              สร้างเมื่อ: {new Date(user.createdAt).toLocaleDateString('th-TH')}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Information */}
        <div className="admin-dashboard-card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลพื้นฐาน</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อผู้ใช้ *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.username ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="username123"
              />
              {errors.username && (
                <p className="text-red-600 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อีเมล *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="user@university.ac.th"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อ *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.firstName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="สมชาย"
              />
              {errors.firstName && (
                <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                นามสกุล *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.lastName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="ใจดี"
              />
              {errors.lastName && (
                <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>

            {/* Phone */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="08-1234-5678"
              />
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Role & Status */}
        <div className="admin-dashboard-card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">บทบาทและสถานะ</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                บทบาท *
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="student">นักศึกษา</option>
                <option value="instructor">อาจารย์</option>
                <option value="admin">ผู้ดูแลระบบ</option>
                <option value="committee">คณะกรรมการ</option>
                <option value="visitor">อาจารย์นิเทศ</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานะ *
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">ใช้งาน</option>
                <option value="inactive">ไม่ใช้งาน</option>
                <option value="suspended">ระงับ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="admin-dashboard-card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลเพิ่มเติม</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ภาควิชา
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">เลือกภาควิชา</option>
                <option value="วิทยาการคอมพิวเตอร์">วิทยาการคอมพิวเตอร์</option>
                <option value="วิศวกรรมซอฟต์แวร์">วิศวกรรมซอฟต์แวร์</option>
                <option value="เทคโนโลยีสารสนเทศ">เทคโนโลยีสารสนเทศ</option>
              </select>
            </div>

            {/* Student ID (only for students) */}
            {formData.role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสนักศึกษา *
                </label>
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => handleInputChange('studentId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.studentId ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="65010001"
                />
                {errors.studentId && (
                  <p className="text-red-600 text-sm mt-1">{errors.studentId}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6">
          <Link
            href={`/admin/users/${user.id}`}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </Link>
          
          <button
            type="submit"
            disabled={saving}
            className="admin-action-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                กำลังบันทึก...
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                บันทึกการเปลี่ยนแปลง
              </>
            )}
          </button>
        </div>
      </form>

      {/* Warning */}
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">⚠️ คำเตือน:</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• การเปลี่ยนบทบาทอาจส่งผลต่อสิทธิ์การเข้าถึงระบบ</li>
          <li>• การระงับบัญชีจะทำให้ผู้ใช้ไม่สามารถเข้าสู่ระบบได้</li>
          <li>• การเปลี่ยนอีเมลจะส่งการแจ้งเตือนไปยังอีเมลใหม่</li>
        </ul>
      </div>
    </div>
  );
}