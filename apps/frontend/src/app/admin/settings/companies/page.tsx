'use client';

import { useState, useEffect } from 'react';
import { 
  BuildingOffice2Icon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { Company, adminMockAPI } from '@/lib/mock-data/admin';

export default function CompaniesSettingsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    type: 'private' as 'government' | 'private' | 'startup' | 'ngo',
    industry: '',
    address: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    internshipSlots: 5,
    status: 'active' as 'active' | 'inactive' | 'blacklisted'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await adminMockAPI.getCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'กรุณากรอกชื่อบริษัท';
    }

    if (!formData.industry.trim()) {
      newErrors.industry = 'กรุณากรอกประเภทธุรกิจ';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'กรุณากรอกที่อยู่';
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'กรุณากรอกชื่อผู้ติดต่อ';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'กรุณากรอกอีเมล';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    }

    if (formData.internshipSlots < 1) {
      newErrors.internshipSlots = 'จำนวนตำแหน่งต้องมากกว่า 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (editingCompany) {
        // Update existing
        const updatedCompany = { 
          ...editingCompany, 
          ...formData,
          website: formData.website || undefined
        };
        setCompanies(prev => 
          prev.map(company => company.id === editingCompany.id ? updatedCompany : company)
        );
        setEditingCompany(null);
      } else {
        // Create new
        const newCompany: Company = {
          id: Math.max(...companies.map(c => c.id)) + 1,
          ...formData,
          website: formData.website || undefined,
          currentInterns: 0,
          rating: 0,
          createdAt: new Date().toISOString()
        };
        setCompanies(prev => [...prev, newCompany]);
        setShowCreateForm(false);
      }

      // Reset form
      setFormData({
        name: '',
        type: 'private',
        industry: '',
        address: '',
        contactPerson: '',
        email: '',
        phone: '',
        website: '',
        internshipSlots: 5,
        status: 'active'
      });

      alert(editingCompany ? 'อัปเดตบริษัทสำเร็จ' : 'เพิ่มบริษัทสำเร็จ');
    } catch (error) {
      console.error('Error saving company:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      type: company.type,
      industry: company.industry,
      address: company.address,
      contactPerson: company.contactPerson,
      email: company.email,
      phone: company.phone,
      website: company.website || '',
      internshipSlots: company.internshipSlots,
      status: company.status
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: number) => {
    const company = companies.find(c => c.id === id);
    if (!company) return;

    if (company.currentInterns > 0) {
      alert('ไม่สามารถลบบริษัทที่มีนักศึกษาฝึกงานอยู่ได้');
      return;
    }

    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบบริษัทนี้?')) return;

    try {
      setCompanies(prev => prev.filter(company => company.id !== id));
      alert('ลบบริษัทสำเร็จ');
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = 
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || company.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const getTypeLabel = (type: string) => {
    const labels = {
      government: 'หน่วยงานราชการ',
      private: 'บริษัทเอกชน',
      startup: 'สตาร์ทอัพ',
      ngo: 'องค์กรไม่แสวงหาผลกำไร'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'government':
        return 'bg-blue-100 text-blue-800';
      case 'private':
        return 'bg-green-100 text-green-800';
      case 'startup':
        return 'bg-purple-100 text-purple-800';
      case 'ngo':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'blacklisted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'ใช้งาน',
      inactive: 'ไม่ใช้งาน',
      blacklisted: 'ระงับ'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <StarIcon
        key={index}
        className={`w-4 h-4 ${
          index < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">จัดการบริษัท</h1>
          <p className="text-gray-600 mt-1">
            จัดการข้อมูลบริษัทและหน่วยงานที่รับนักศึกษาฝึกงาน
          </p>
        </div>
        
        <button
          onClick={() => {
            setShowCreateForm(true);
            setEditingCompany(null);
            setFormData({
              name: '',
              type: 'private',
              industry: '',
              address: '',
              contactPerson: '',
              email: '',
              phone: '',
              website: '',
              internshipSlots: 5,
              status: 'active'
            });
          }}
          className="admin-action-button"
        >
          <PlusIcon className="w-4 h-4" />
          เพิ่มบริษัท
        </button>
      </div>

      {/* Filters */}
      <div className="admin-dashboard-card mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="ค้นหาชื่อบริษัท, ประเภทธุรกิจ, ผู้ติดต่อ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <div className="w-full lg:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">ประเภททั้งหมด</option>
              <option value="government">หน่วยงานราชการ</option>
              <option value="private">บริษัทเอกชน</option>
              <option value="startup">สตาร์ทอัพ</option>
              <option value="ngo">องค์กรไม่แสวงหาผลกำไร</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}