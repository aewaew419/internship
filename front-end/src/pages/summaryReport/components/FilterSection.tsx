import React from 'react';
import type { ReportsFilters } from '../../../service/api/reports/type';

interface FilterSectionProps {
  filters: ReportsFilters;
  onFilterChange: (filters: Partial<ReportsFilters>) => void;
  loading: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({ 
  filters, 
  onFilterChange, 
  loading 
}) => {
  const currentYear = new Date().getFullYear() + 543; // Thai year
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">ตัวกรองข้อมูล</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ปีการศึกษา
          </label>
          <select
            value={filters.year || ''}
            onChange={(e) => onFilterChange({ year: e.target.value ? Number(e.target.value) : undefined })}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">ทั้งหมด</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ภาคการศึกษา
          </label>
          <select
            value={filters.semester || ''}
            onChange={(e) => onFilterChange({ semester: e.target.value ? Number(e.target.value) : undefined })}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">ทั้งหมด</option>
            <option value="1">ภาคต้น</option>
            <option value="2">ภาคปลาย</option>
            <option value="3">ภาคฤดูร้อน</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            รหัสวิชา
          </label>
          <input
            type="number"
            value={filters.course_id || ''}
            onChange={(e) => onFilterChange({ course_id: e.target.value ? Number(e.target.value) : undefined })}
            disabled={loading}
            placeholder="ระบุรหัสวิชา"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterSection;