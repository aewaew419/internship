'use client';

import React, { useState, useMemo } from 'react';
import { StatisticsGrid, StatisticsCard } from '../StatisticsCard';
import { ResponsiveDataFilter, FilterState, FilterConfig } from '../DataFilter';
import { ResponsiveDataTable, TableColumn } from '../../tables/ResponsiveDataTable';

// Example data types
interface StudentData {
  id: string;
  name: string;
  studentId: string;
  major: string;
  status: string;
  company: string;
  position: string;
  advisor: string;
}

// Mock data
const mockStudents: StudentData[] = [
  {
    id: '1',
    name: 'นายสมชาย ใจดี',
    studentId: 'S123456',
    major: 'วิศวกรรมคอมพิวเตอร์',
    status: 'อนุมัติแล้ว',
    company: 'บริษัท เทคโนโลยี จำกัด',
    position: 'นักพัฒนาซอฟต์แวร์',
    advisor: 'อ.ดร.สมหญิง'
  },
  {
    id: '2',
    name: 'นางสาวสมหญิง รักเรียน',
    studentId: 'S123457',
    major: 'วิศวกรรมคอมพิวเตอร์',
    status: 'รอการพิจารณา',
    company: 'บริษัท ดิจิทัล จำกัด',
    position: 'นักวิเคราะห์ระบบ',
    advisor: 'อ.ดร.สมชาย'
  },
  {
    id: '3',
    name: 'นายสมศักดิ์ ขยันเรียน',
    studentId: 'S123458',
    major: 'วิศวกรรมไฟฟ้า',
    status: 'กำลังเลือกบริษัท',
    company: '-',
    position: '-',
    advisor: 'อ.ดร.สมพร'
  }
];

export const DataDisplayExample: React.FC = () => {
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    major: '',
    status: '',
    advisor: ''
  });

  // Filter configurations
  const filterConfigs: FilterConfig[] = [
    {
      key: 'major',
      label: 'สาขาวิชา',
      placeholder: 'เลือกสาขาวิชา',
      searchable: true,
      options: [
        { value: 'วิศวกรรมคอมพิวเตอร์', label: 'วิศวกรรมคอมพิวเตอร์', count: 2 },
        { value: 'วิศวกรรมไฟฟ้า', label: 'วิศวกรรมไฟฟ้า', count: 1 },
        { value: 'วิศวกรรมเครื่องกล', label: 'วิศวกรรมเครื่องกล', count: 0 }
      ]
    },
    {
      key: 'status',
      label: 'สถานะ',
      placeholder: 'เลือกสถานะ',
      options: [
        { value: 'อนุมัติแล้ว', label: 'อนุมัติแล้ว', count: 1 },
        { value: 'รอการพิจารณา', label: 'รอการพิจารณา', count: 1 },
        { value: 'กำลังเลือกบริษัท', label: 'กำลังเลือกบริษัท', count: 1 }
      ]
    },
    {
      key: 'advisor',
      label: 'อาจารย์ที่ปรึกษา',
      placeholder: 'เลือกอาจารย์',
      searchable: true,
      mobileHidden: true, // Hide on mobile for space
      options: [
        { value: 'อ.ดร.สมหญิง', label: 'อ.ดร.สมหญิง' },
        { value: 'อ.ดร.สมชาย', label: 'อ.ดร.สมชาย' },
        { value: 'อ.ดร.สมพร', label: 'อ.ดร.สมพร' }
      ]
    }
  ];

  // Table columns
  const columns: TableColumn<StudentData>[] = [
    {
      key: 'studentId',
      label: 'รหัสนักศึกษา',
      width: '120px'
    },
    {
      key: 'name',
      label: 'ชื่อ-นามสกุล',
      render: (value) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      key: 'major',
      label: 'สาขาวิชา',
      mobileHidden: true
    },
    {
      key: 'status',
      label: 'สถานะ',
      render: (value) => {
        const statusColors = {
          'อนุมัติแล้ว': 'bg-green-100 text-green-800',
          'รอการพิจารณา': 'bg-yellow-100 text-yellow-800',
          'กำลังเลือกบริษัท': 'bg-blue-100 text-blue-800'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
            {value}
          </span>
        );
      }
    },
    {
      key: 'company',
      label: 'บริษัท',
      mobileHidden: true,
      render: (value) => value || '-'
    },
    {
      key: 'advisor',
      label: 'อาจารย์ที่ปรึกษา',
      mobileHidden: true
    }
  ];

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return mockStudents.filter(student => {
      const matchesSearch = !filters.search || 
        student.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        student.studentId.toLowerCase().includes(filters.search.toLowerCase()) ||
        student.company.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesMajor = !filters.major || student.major === filters.major;
      const matchesStatus = !filters.status || student.status === filters.status;
      const matchesAdvisor = !filters.advisor || student.advisor === filters.advisor;

      return matchesSearch && matchesMajor && matchesStatus && matchesAdvisor;
    });
  }, [filters]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = mockStudents.length;
    const approved = mockStudents.filter(s => s.status === 'อนุมัติแล้ว').length;
    const pending = mockStudents.filter(s => s.status === 'รอการพิจารณา').length;
    const selecting = mockStudents.filter(s => s.status === 'กำลังเลือกบริษัท').length;

    return [
      {
        title: 'นักศึกษาทั้งหมด',
        value: total,
        subtitle: 'คน',
        color: 'primary' as const,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        )
      },
      {
        title: 'อนุมัติแล้ว',
        value: approved,
        subtitle: `${total > 0 ? Math.round((approved / total) * 100) : 0}% ของทั้งหมด`,
        color: 'success' as const,
        trend: {
          value: 15,
          isPositive: true,
          label: 'จากเดือนที่แล้ว'
        },
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      {
        title: 'รอการพิจารณา',
        value: pending,
        subtitle: `${total > 0 ? Math.round((pending / total) * 100) : 0}% ของทั้งหมด`,
        color: 'warning' as const,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      {
        title: 'กำลังเลือกบริษัท',
        value: selecting,
        subtitle: `${total > 0 ? Math.round((selecting / total) * 100) : 0}% ของทั้งหมด`,
        color: 'secondary' as const,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )
      }
    ];
  }, []);

  const handleFiltersChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSearch = (searchTerm: string) => {
    console.log('Searching for:', searchTerm);
    // In a real app, this might trigger an API call
  };

  const handleRowClick = (student: StudentData) => {
    console.log('Clicked student:', student);
    // In a real app, this might navigate to student detail page
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ระบบจัดการข้อมูลนักศึกษาฝึกงาน
        </h1>
        <p className="text-gray-600">
          ตัวอย่างการใช้งานคอมโพเนนต์แสดงข้อมูลแบบ Responsive
        </p>
      </div>

      {/* Statistics Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">สถิติภาพรวม</h2>
        <StatisticsGrid 
          cards={statistics}
          columns={4}
          gap="md"
        />
      </div>

      {/* Data Filter and Table */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">รายชื่อนักศึกษา</h2>
        
        {/* Responsive Filter */}
        <div className="mb-6">
          <ResponsiveDataFilter
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onSearch={handleSearch}
            filterConfigs={filterConfigs}
            searchPlaceholder="ค้นหาชื่อ, รหัสนักศึกษา, หรือบริษัท..."
          />
        </div>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600">
          แสดงผลลัพธ์ {filteredData.length} รายการ จากทั้งหมด {mockStudents.length} รายการ
        </div>

        {/* Responsive Data Table */}
        <ResponsiveDataTable
          data={filteredData}
          columns={columns}
          onRowClick={handleRowClick}
          emptyMessage="ไม่พบข้อมูลนักศึกษาที่ตรงกับเงื่อนไขการค้นหา"
          sortable={true}
        />
      </div>
    </div>
  );
};

export default DataDisplayExample;