'use client';

import { useState, useEffect } from 'react';
import { 
  BuildingOfficeIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  UserGroupIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { Department, adminMockAPI } from '@/lib/mock-data/admin';

export default function DepartmentsSettingsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    faculty: '',
    head: '',
    status: 'active' as 'active' | 'inactive'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await adminMockAPI.getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'กรุณากรอกชื่อภาควิชา';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'กรุณากรอกรหัสภาควิชา';
    } else if (formData.code.length > 10) {
      newErrors.code = 'รหัสภาควิชาต้องไม่เกิน 10 ตัวอักษร';
    }

    if (!formData.faculty.trim()) {
      newErrors.faculty = 'กรุณากรอกชื่อคณะ';
    }

    if (!formData.head.trim()) {
      newErrors.head = 'กรุณากรอกชื่อหัวหน้าภาควิชา';
    }

    // Check for duplicate code
    const existingDept = departments.find(dept => 
      dept.code.toLowerCase() === formData.code.toLowerCase() && 
      dept.id !== editingDepartment?.id
    );
    if (existingDept) {
      newErrors.code = 'รหัสภาควิชานี้มีอยู่แล้ว';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (editingDepartment) {
        // Update existing
        const updatedDept = { 
          ...editingDepartment, 
          ...formData,
          code: formData.code.toUpperCase()
        };
        setDepartments(prev => 
          prev.map(dept => dept.id === editingDepartment.id ? updatedDept : dept)
        );
        setEditingDepartment(null);
      } else {
        // Create new
        const newDept: Department = {
          id: Math.max(...departments.map(d => d.id)) + 1,
          ...formData,
          code: formData.code.toUpperCase(),
          studentCount: 0,
          instructorCount: 0
        };
        setDepartments(prev => [...prev, newDept]);
        setShowCreateForm(false);
      }

      // Reset form
      setFormData({
        name: '',
        code: '',
        faculty: '',
        head: '',
        status: 'active'
      });

      alert(editingDepartment ? 'อัปเดตภาควิชาสำเร็จ' : 'เพิ่มภาควิชาสำเร็จ');
    } catch (error) {
      console.error('Error saving department:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      faculty: department.faculty,
      head: department.head,
      status: department.status
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: number) => {
    const department = departments.find(d => d.id === id);
    if (!department) return;

    if (department.studentCount > 0 || department.instructorCount > 0) {
      alert('ไม่สามารถลบภาควิชาที่มีนักศึกษาหรืออาจารย์อยู่ได้');
      return;
    }

    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบภาควิชานี้?')) return;

    try {
      setDepartments(prev => prev.filter(dept => dept.id !== id));
      alert('ลบภาควิชาสำเร็จ');
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'ใช้งาน',
      inactive: 'ไม่ใช้งาน'
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
          <h1 className="text-2xl font-bold text-gray-900">จัดการภาควิชา</h1>
          <p className="text-gray-600 mt-1">
            จัดการข้อมูลภาควิชาและคณะต่างๆ ในมหาวิทยาลัย
          </p>
        </div>
        
        <button
          onClick={() => {
            setShowCreateForm(true);
            setEditingDepartment(null);
            setFormData({
              name: '',
              code: '',
              faculty: '',
              head: '',
              status: 'active'
            });
          }}
          className="admin-action-button"
        >
          <PlusIcon className="w-4 h-4" />
          เพิ่มภาควิชา
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="admin-dashboard-card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingDepartment ? 'แก้ไขภาควิชา' : 'เพิ่มภาควิชาใหม่'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Department Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อภาควิชา *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="วิทยาการคอมพิวเตอร์"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Department Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสภาควิชา *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.code ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="CS"
                  maxLength={10}
                />
                {errors.code && (
                  <p className="text-red-600 text-sm mt-1">{errors.code}</p>
                )}
              </div>

              {/* Faculty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คณะ *
                </label>
                <input
                  type="text"
                  value={formData.faculty}
                  onChange={(e) => setFormData(prev => ({ ...prev, faculty: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.faculty ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="คณะวิทยาศาสตร์"
                />
                {errors.faculty && (
                  <p className="text-red-600 text-sm mt-1">{errors.faculty}</p>
                )}
              </div>

              {/* Department Head */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หัวหน้าภาควิชา *
                </label>
                <input
                  type="text"
                  value={formData.head}
                  onChange={(e) => setFormData(prev => ({ ...prev, head: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.head ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="ศ.ดร.วิทยา คอมพิวเตอร์"
                />
                {errors.head && (
                  <p className="text-red-600 text-sm mt-1">{errors.head}</p>
                )}
              </div>

              {/* Status */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานะ *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">ใช้งาน</option>
                  <option value="inactive">ไม่ใช้งาน</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingDepartment(null);
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
                {editingDepartment ? 'อัปเดต' : 'เพิ่ม'}ภาควิชา
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Departments List */}
      <div className="space-y-4">
        {departments.length === 0 ? (
          <div className="admin-dashboard-card text-center py-12">
            <BuildingOfficeIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่มีภาควิชา
            </h3>
            <p className="text-gray-500 mb-4">
              เริ่มต้นด้วยการเพิ่มภาควิชาแรก
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="admin-action-button"
            >
              <PlusIcon className="w-4 h-4" />
              เพิ่มภาควิชาแรก
            </button>
          </div>
        ) : (
          departments.map((department) => (
            <div key={department.id} className="admin-dashboard-card">
              <div className="flex items-center justify-between">
                
                {/* Department Info */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BuildingOfficeIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {department.name}
                      </h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-mono">
                        {department.code}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(department.status)}`}>
                        {getStatusLabel(department.status)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>คณะ:</strong> {department.faculty}
                      </p>
                      <p>
                        <strong>หัวหน้าภาควิชา:</strong> {department.head}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <UserGroupIcon className="w-4 h-4 text-blue-500" />
                          <span>{department.studentCount} นักศึกษา</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AcademicCapIcon className="w-4 h-4 text-green-500" />
                          <span>{department.instructorCount} อาจารย์</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(department)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    title="แก้ไข"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(department.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="ลบ"
                    disabled={department.studentCount > 0 || department.instructorCount > 0}
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
      {departments.length > 0 && (
        <div className="admin-stats-grid mt-8">
          <div className="admin-stat-card">
            <div className="text-2xl font-bold text-purple-600">
              {departments.filter(d => d.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">ภาควิชาที่ใช้งาน</div>
          </div>
          
          <div className="admin-stat-card">
            <div className="text-2xl font-bold text-blue-600">
              {departments.reduce((sum, dept) => sum + dept.studentCount, 0)}
            </div>
            <div className="text-sm text-gray-600">นักศึกษาทั้งหมด</div>
          </div>
          
          <div className="admin-stat-card">
            <div className="text-2xl font-bold text-green-600">
              {departments.reduce((sum, dept) => sum + dept.instructorCount, 0)}
            </div>
            <div className="text-sm text-gray-600">อาจารย์ทั้งหมด</div>
          </div>
          
          <div className="admin-stat-card">
            <div className="text-2xl font-bold text-orange-600">
              {new Set(departments.map(d => d.faculty)).size}
            </div>
            <div className="text-sm text-gray-600">คณะทั้งหมด</div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 คำแนะนำ:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• รหัสภาควิชาควรเป็นตัวอักษรภาษาอังกฤษสั้นๆ เช่น CS, SE, IT</li>
          <li>• ไม่สามารถลบภาควิชาที่มีนักศึกษาหรืออาจารย์อยู่ได้</li>
          <li>• การเปลี่ยนสถานะเป็น "ไม่ใช้งาน" จะซ่อนภาควิชาจากการเลือก</li>
          <li>• ข้อมูลจำนวนนักศึกษาและอาจารย์จะอัปเดตอัตโนมัติ</li>
        </ul>
      </div>
    </div>
  );
}