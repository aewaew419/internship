'use client';

import { useState, useEffect } from 'react';
import { 
  UserPlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { User, adminMockAPI } from '@/lib/mock-data/admin';
import Link from 'next/link';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userData = await adminMockAPI.getUsers();
      setUsers(userData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?')) return;

    try {
      await adminMockAPI.deleteUser(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('เกิดข้อผิดพลาดในการลบผู้ใช้');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.studentId && user.studentId.includes(searchQuery));

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้</h1>
          <p className="text-gray-600 mt-1">
            จัดการบัญชีผู้ใช้ทั้งหมดในระบบ ({filteredUsers.length} คน)
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users/bulk-import"
            className="admin-action-button bg-gray-600 hover:bg-gray-700"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            นำเข้าจาก Excel
          </Link>
          
          <Link
            href="/admin/users/create"
            className="admin-action-button"
          >
            <UserPlusIcon className="w-4 h-4" />
            เพิ่มผู้ใช้ใหม่
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-dashboard-card mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, อีเมล, รหัสนักศึกษา..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="w-full lg:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">บทบาททั้งหมด</option>
              <option value="student">นักศึกษา</option>
              <option value="instructor">อาจารย์</option>
              <option value="admin">ผู้ดูแลระบบ</option>
              <option value="committee">คณะกรรมการ</option>
              <option value="visitor">อาจารย์นิเทศ</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="active">ใช้งาน</option>
              <option value="inactive">ไม่ใช้งาน</option>
              <option value="suspended">ระงับ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="admin-dashboard-card text-center py-12">
            <UserPlusIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่พบผู้ใช้
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'ไม่พบผู้ใช้ที่ตรงกับเงื่อนไขที่เลือก'
                : 'ยังไม่มีผู้ใช้ในระบบ'
              }
            </p>
            <Link
              href="/admin/users/create"
              className="admin-action-button"
            >
              <UserPlusIcon className="w-4 h-4" />
              เพิ่มผู้ใช้แรก
            </Link>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="admin-dashboard-card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                
                {/* Avatar */}
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

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>@{user.username}</span>
                        {user.studentId && (
                          <span>รหัส: {user.studentId}</span>
                        )}
                        {user.department && (
                          <span>{user.department}</span>
                        )}
                      </div>
                    </div>

                    {/* Status & Role */}
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {getStatusLabel(user.status)}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </div>

                  {/* Last Login */}
                  {user.lastLogin && (
                    <p className="text-xs text-gray-400 mt-2">
                      เข้าสู่ระบบล่าสุด: {new Date(user.lastLogin).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    title="ดูรายละเอียด"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Link>
                  
                  <Link
                    href={`/admin/users/${user.id}/edit`}
                    className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                    title="แก้ไข"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Link>
                  
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="ลบ"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="admin-stats-grid mt-8">
        <div className="admin-stat-card">
          <div className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">ผู้ใช้ที่ใช้งาน</div>
        </div>
        
        <div className="admin-stat-card">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.role === 'student').length}
          </div>
          <div className="text-sm text-gray-600">นักศึกษา</div>
        </div>
        
        <div className="admin-stat-card">
          <div className="text-2xl font-bold text-purple-600">
            {users.filter(u => u.role === 'instructor').length}
          </div>
          <div className="text-sm text-gray-600">อาจารย์</div>
        </div>
        
        <div className="admin-stat-card">
          <div className="text-2xl font-bold text-orange-600">
            {users.filter(u => u.status === 'suspended').length}
          </div>
          <div className="text-sm text-gray-600">ผู้ใช้ที่ระงับ</div>
        </div>
      </div>
    </div>
  );
}