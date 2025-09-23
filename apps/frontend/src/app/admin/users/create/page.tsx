'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { User, adminMockAPI } from '@/lib/mock-data/admin';
import Link from 'next/link';

interface CreateUserForm {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin' | 'committee' | 'visitor';
  status: 'active' | 'inactive';
  department: string;
  studentId: string;
  phone: string;
}

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateUserForm>({
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

  const [errors, setErrors] = useState<Partial<CreateUserForm>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateUserForm> = {};

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
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const userData: Omit<User, 'id' | 'createdAt'> = {
        ...formData,
        department: formData.department || undefined,
        studentId: formData.role === 'student' ? formData.studentId : undefined,
        phone: formData.phone || undefined
      };

      await adminMockAPI.createUser(userData);
      
      // Show success message
      alert('สร้างผู้ใช้ใหม่สำเร็จ');
      
      // Redirect to users list
      router.push('/admin/users');
      
    } catch (error) {
      console.error('Error creating user:', error);
      alert('เกิดข้อผิดพลาดในการสร้างผู้ใช้');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserForm, value: string) => {
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/users"
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">เพิ่มผู้ใช้ใหม่</h1>
          <p className="text-gray-600">สร้างบัญชีผู้ใช้ใหม่ในระบบ</p>
        </div>
      </div>

      {/* Form */}
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
            href="/admin/users"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </Link>
          
          <button
            type="submit"
            disabled={loading}
            className="admin-action-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                กำลังสร้าง...
              </>
            ) : (
              <>
                <UserPlusIcon className="w-4 h-4" />
                สร้างผู้ใช้
              </>
            )}
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">คำแนะนำ:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• ชื่อผู้ใช้ต้องไม่ซ้ำกับที่มีอยู่ในระบบ</li>
          <li>• อีเมลต้องเป็นรูปแบบที่ถูกต้องและไม่ซ้ำ</li>
          <li>• รหัสนักศึกษาจำเป็นสำหรับบทบาทนักศึกษาเท่านั้น</li>
          <li>• ผู้ใช้จะได้รับอีเมลแจ้งข้อมูลการเข้าสู่ระบบ</li>
        </ul>
      </div>
    </div>
  );
}