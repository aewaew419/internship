'use client';

import { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { AcademicYear, adminMockAPI } from '@/lib/mock-data/admin';
import Link from 'next/link';

export default function AcademicYearSettingsPage() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);

  const [formData, setFormData] = useState({
    year: '',
    semester: 1,
    startDate: '',
    endDate: '',
    registrationStart: '',
    registrationEnd: '',
    status: 'upcoming' as 'active' | 'upcoming' | 'completed'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadAcademicYears();
  }, []);

  const loadAcademicYears = async () => {
    try {
      setLoading(true);
      const data = await adminMockAPI.getAcademicYears();
      setAcademicYears(data);
    } catch (error) {
      console.error('Error loading academic years:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.year.trim()) {
      newErrors.year = 'กรุณากรอกปีการศึกษา';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'กรุณาเลือกวันที่เริ่มต้น';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'กรุณาเลือกวันที่สิ้นสุด';
    }

    if (!formData.registrationStart) {
      newErrors.registrationStart = 'กรุณาเลือกวันที่เริ่มลงทะเบียน';
    }

    if (!formData.registrationEnd) {
      newErrors.registrationEnd = 'กรุณาเลือกวันที่สิ้นสุดลงทะเบียน';
    }

    // Validate date ranges
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = 'วันที่สิ้นสุดต้องหลังจากวันที่เริ่มต้น';
      }
    }

    if (formData.registrationStart && formData.registrationEnd) {
      if (new Date(formData.registrationStart) >= new Date(formData.registrationEnd)) {
        newErrors.registrationEnd = 'วันที่สิ้นสุดลงทะเบียนต้องหลังจากวันที่เริ่มลงทะเบียน';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (editingYear) {
        // Update existing
        const updatedYear = { ...editingYear, ...formData };
        setAcademicYears(prev => 
          prev.map(year => year.id === editingYear.id ? updatedYear : year)
        );
        setEditingYear(null);
      } else {
        // Create new
        const newYear: AcademicYear = {
          id: Math.max(...academicYears.map(y => y.id)) + 1,
          ...formData,
          studentCount: 0
        };
        setAcademicYears(prev => [...prev, newYear]);
        setShowCreateForm(false);
      }

      // Reset form
      setFormData({
        year: '',
        semester: 1,
        startDate: '',
        endDate: '',
        registrationStart: '',
        registrationEnd: '',
        status: 'upcoming'
      });

      alert(editingYear ? 'อัปเดตปีการศึกษาสำเร็จ' : 'เพิ่มปีการศึกษาสำเร็จ');
    } catch (error) {
      console.error('Error saving academic year:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleEdit = (year: AcademicYear) => {
    setEditingYear(year);
    setFormData({
      year: year.year,
      semester: year.semester,
      startDate: year.startDate,
      endDate: year.endDate,
      registrationStart: year.registrationStart,
      registrationEnd: year.registrationEnd,
      status: year.status
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบปีการศึกษานี้?')) return;

    try {
      setAcademicYears(prev => prev.filter(year => year.id !== id));
      alert('ลบปีการศึกษาสำเร็จ');
    } catch (error) {
      console.error('Error deleting academic year:', error);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const handleSetActive = async (id: number) => {
    try {
      setAcademicYears(prev => 
        prev.map(year => ({
          ...year,
          status: year.id === id ? 'active' : 
                  year.status === 'active' ? 'completed' : year.status
        }))
      );
      alert('ตั้งค่าปีการศึกษาปัจจุบันสำเร็จ');
    } catch (error) {
      console.error('Error setting active year:', error);
      alert('เกิดข้อผิดพลาดในการตั้งค่า');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'upcoming':
        return <ClockIcon className="w-4 h-4" />;
      case 'completed':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'ปัจจุบัน',
      upcoming: 'กำลังจะมาถึง',
      completed: 'เสร็จสิ้นแล้ว'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">จัดการปีการศึกษา</h1>
          <p className="text-gray-600 mt-1">
            ตั้งค่าปีการศึกษาและภาคเรียนสำหรับระบบฝึกงาน
          </p>
        </div>
        
        <button
          onClick={() => {
            setShowCreateForm(true);
            setEditingYear(null);
            setFormData({
              year: '',
              semester: 1,
              startDate: '',
              endDate: '',
              registrationStart: '',
              registrationEnd: '',
              status: 'upcoming'
            });
          }}
          className="admin-action-button"
        >
          <PlusIcon className="w-4 h-4" />
          เพิ่มปีการศึกษา
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="admin-dashboard-card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingYear ? 'แก้ไขปีการศึกษา' : 'เพิ่มปีการศึกษาใหม่'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ปีการศึกษา *
                </label>
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.year ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="2567"
                />
                {errors.year && (
                  <p className="text-red-600 text-sm mt-1">{errors.year}</p>
                )}
              </div>

              {/* Semester */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ภาคเรียน *
                </label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData(prev => ({ ...prev, semester: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>ภาคเรียนที่ 1</option>
                  <option value={2}>ภาคเรียนที่ 2</option>
                  <option value={3}>ภาคเรียนพิเศษ</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานะ *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="upcoming">กำลังจะมาถึง</option>
                  <option value="active">ปัจจุบัน</option>
                  <option value="completed">เสร็จสิ้นแล้ว</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่เริ่มต้น *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.startDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && (
                  <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่สิ้นสุด *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.endDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && (
                  <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>
                )}
              </div>

              {/* Registration Start */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เริ่มลงทะเบียน *
                </label>
                <input
                  type="date"
                  value={formData.registrationStart}
                  onChange={(e) => setFormData(prev => ({ ...prev, registrationStart: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.registrationStart ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.registrationStart && (
                  <p className="text-red-600 text-sm mt-1">{errors.registrationStart}</p>
                )}
              </div>

              {/* Registration End */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สิ้นสุดลงทะเบียน *
                </label>
                <input
                  type="date"
                  value={formData.registrationEnd}
                  onChange={(e) => setFormData(prev => ({ ...prev, registrationEnd: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.registrationEnd ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.registrationEnd && (
                  <p className="text-red-600 text-sm mt-1">{errors.registrationEnd}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingYear(null);
                  setErrors({});
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              
              <button
                type="submit"
                className="admin-action-button"
              >
                {editingYear ? 'อัปเดต' : 'เพิ่ม'}ปีการศึกษา
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Academic Years List */}
      <div className="space-y-4">
        {academicYears.length === 0 ? (
          <div className="admin-dashboard-card text-center py-12">
            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่มีปีการศึกษา
            </h3>
            <p className="text-gray-500 mb-4">
              เริ่มต้นด้วยการเพิ่มปีการศึกษาแรก
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="admin-action-button"
            >
              <PlusIcon className="w-4 h-4" />
              เพิ่มปีการศึกษาแรก
            </button>
          </div>
        ) : (
          academicYears.map((year) => (
            <div key={year.id} className="admin-dashboard-card">
              <div className="flex items-center justify-between">
                
                {/* Year Info */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        ปีการศึกษา {year.year} ภาคเรียนที่ {year.semester}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(year.status)}`}>
                        {getStatusIcon(year.status)}
                        {getStatusLabel(year.status)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>ระยะเวลา:</strong> {formatDate(year.startDate)} - {formatDate(year.endDate)}
                      </p>
                      <p>
                        <strong>ลงทะเบียน:</strong> {formatDate(year.registrationStart)} - {formatDate(year.registrationEnd)}
                      </p>
                      <p>
                        <strong>นักศึกษา:</strong> {year.studentCount} คน
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {year.status !== 'active' && (
                    <button
                      onClick={() => handleSetActive(year.id)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                    >
                      ตั้งเป็นปัจจุบัน
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleEdit(year)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    title="แก้ไข"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(year.id)}
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
      {academicYears.length > 0 && (
        <div className="admin-stats-grid mt-8">
          <div className="admin-stat-card">
            <div className="text-2xl font-bold text-green-600">
              {academicYears.filter(y => y.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">ปีการศึกษาปัจจุบัน</div>
          </div>
          
          <div className="admin-stat-card">
            <div className="text-2xl font-bold text-blue-600">
              {academicYears.filter(y => y.status === 'upcoming').length}
            </div>
            <div className="text-sm text-gray-600">กำลังจะมาถึง</div>
          </div>
          
          <div className="admin-stat-card">
            <div className="text-2xl font-bold text-gray-600">
              {academicYears.filter(y => y.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">เสร็จสิ้นแล้ว</div>
          </div>
          
          <div className="admin-stat-card">
            <div className="text-2xl font-bold text-purple-600">
              {academicYears.reduce((sum, year) => sum + year.studentCount, 0)}
            </div>
            <div className="text-sm text-gray-600">นักศึกษาทั้งหมด</div>
          </div>
        </div>
      )}
    </div>
  );
}