'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ClockIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { User, adminMockAPI } from '@/lib/mock-data/admin';
import Link from 'next/link';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = parseInt(params.id as string);
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (error) {
      console.error('Error loading user:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ "${user.firstName} ${user.lastName}"?`)) {
      return;
    }

    try {
      await adminMockAPI.deleteUser(user.id);
      alert('ลบผู้ใช้สำเร็จ');
      router.push('/admin/users');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('เกิดข้อผิดพลาดในการลบผู้ใช้');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'ใช้งาน',
      inactive: 'ไม่ใช้งาน',
      suspended: 'ระงับ'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="admin-dashboard-card">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-64"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/admin/users"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">รายละเอียดผู้ใช้</h1>
        </div>

        <div className="admin-dashboard-card text-center py-12">
          <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || 'ไม่พบผู้ใช้'}
          </h3>
          <p className="text-gray-500 mb-4">
            ผู้ใช้ที่คุณต้องการดูอาจถูกลบหรือไม่มีอยู่ในระบบ
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
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">รายละเอียดผู้ใช้</h1>
            <p className="text-gray-600">ข้อมูลผู้ใช้ในระบบ</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/admin/users/${user.id}/edit`}
            className="admin-action-button bg-green-600 hover:bg-green-700"
          >
            <PencilIcon className="w-4 h-4" />
            แก้ไข
          </Link>
          
          <button
            onClick={handleDeleteUser}
            className="admin-action-button bg-red-600 hover:bg-red-700"
          >
            <TrashIcon className="w-4 h-4" />
            ลบ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Profile Card */}
          <div className="admin-dashboard-card">
            <div className="flex items-center gap-4 mb-6">
              
              {/* Avatar */}
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 font-medium text-2xl">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </span>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-600 mb-2">@{user.username}</p>
                
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.status)}`}>
                    {getStatusLabel(user.status)}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {getRoleLabel(user.role)}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">อีเมล</p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">เบอร์โทรศัพท์</p>
                    <p className="font-medium text-gray-900">{user.phone}</p>
                  </div>
                </div>
              )}

              {user.department && (
                <div className="flex items-center gap-3">
                  <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">ภาควิชา</p>
                    <p className="font-medium text-gray-900">{user.department}</p>
                  </div>
                </div>
              )}

              {user.studentId && (
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">รหัสนักศึกษา</p>
                    <p className="font-medium text-gray-900">{user.studentId}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div className="admin-dashboard-card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">กิจกรรมล่าสุด</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">เข้าสู่ระบบ</p>
                  <p className="text-xs text-gray-500">
                    {user.lastLogin ? formatDate(user.lastLogin) : 'ไม่เคยเข้าสู่ระบบ'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">สร้างบัญชี</p>
                  <p className="text-xs text-gray-500">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Quick Stats */}
          <div className="admin-dashboard-card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">สถิติด่วน</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">สถานะบัญชี</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                  {getStatusLabel(user.status)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">บทบาท</span>
                <span className="text-sm font-medium text-gray-900">
                  {getRoleLabel(user.role)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">เข้าร่วมเมื่อ</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="admin-dashboard-card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">การดำเนินการ</h3>
            
            <div className="space-y-3">
              <Link
                href={`/admin/users/${user.id}/edit`}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
                แก้ไขข้อมูล
              </Link>

              {user.status === 'active' ? (
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-700 hover:bg-orange-50 rounded-lg transition-colors">
                  <ClockIcon className="w-4 h-4" />
                  ระงับบัญชี
                </button>
              ) : (
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50 rounded-lg transition-colors">
                  <CalendarIcon className="w-4 h-4" />
                  เปิดใช้งานบัญชี
                </button>
              )}

              <button
                onClick={handleDeleteUser}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                ลบบัญชี
              </button>
            </div>
          </div>

          {/* System Info */}
          <div className="admin-dashboard-card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลระบบ</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">User ID:</span>
                <span className="ml-2 font-mono text-gray-900">#{user.id}</span>
              </div>
              
              <div>
                <span className="text-gray-500">สร้างเมื่อ:</span>
                <span className="ml-2 text-gray-900">{formatDate(user.createdAt)}</span>
              </div>
              
              {user.lastLogin && (
                <div>
                  <span className="text-gray-500">เข้าสู่ระบบล่าสุด:</span>
                  <span className="ml-2 text-gray-900">{formatDate(user.lastLogin)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}