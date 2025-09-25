'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  CloudArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { AdminModal } from './AdminModal';

interface TitlePrefix {
  id?: number;
  thai: string;
  english: string;
  abbreviation: string;
  category: 'academic' | 'professional' | 'honorary' | 'religious';
  gender: 'male' | 'female' | 'neutral';
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
}

interface DefaultPrefixLoaderProps {
  existingPrefixes: TitlePrefix[];
  onLoadDefaults: (prefixes: Omit<TitlePrefix, 'id'>[]) => Promise<void>;
  onPreviewDefaults?: (prefixes: Omit<TitlePrefix, 'id'>[]) => void;
}

interface PrefixTemplate {
  id: string;
  name: string;
  description: string;
  category: 'academic' | 'government' | 'corporate' | 'comprehensive';
  prefixes: Omit<TitlePrefix, 'id'>[];
  icon: React.ComponentType<{ className?: string }>;
}

// Comprehensive Thai prefix templates
const PREFIX_TEMPLATES: PrefixTemplate[] = [
  {
    id: 'academic',
    name: 'สถาบันการศึกษา',
    description: 'คำนำหน้าชื่อสำหรับสถาบันการศึกษา มหาวิทยาลัย และโรงเรียน',
    category: 'academic',
    icon: AcademicCapIcon,
    prefixes: [
      // Academic Titles
      { thai: 'ศาสตราจารย์', english: 'Professor', abbreviation: 'ศ.', category: 'academic', gender: 'neutral', isDefault: true, sortOrder: 1, isActive: true },
      { thai: 'ศาสตราจารย์เกียรติคุณ', english: 'Professor Emeritus', abbreviation: 'ศ.เกียรติคุณ', category: 'honorary', gender: 'neutral', isDefault: true, sortOrder: 2, isActive: true },
      { thai: 'ศาสตราจารย์กิตติคุณ', english: 'Honorary Professor', abbreviation: 'ศ.กิตติคุณ', category: 'honorary', gender: 'neutral', isDefault: true, sortOrder: 3, isActive: true },
      { thai: 'รองศาสตราจารย์', english: 'Associate Professor', abbreviation: 'รศ.', category: 'academic', gender: 'neutral', isDefault: true, sortOrder: 4, isActive: true },
      { thai: 'ผู้ช่วยศาสตราจารย์', english: 'Assistant Professor', abbreviation: 'ผศ.', category: 'academic', gender: 'neutral', isDefault: true, sortOrder: 5, isActive: true },
      { thai: 'อาจารย์', english: 'Lecturer', abbreviation: 'อ.', category: 'academic', gender: 'neutral', isDefault: true, sortOrder: 6, isActive: true },
      { thai: 'อาจารย์พิเศษ', english: 'Adjunct Lecturer', abbreviation: 'อ.พิเศษ', category: 'academic', gender: 'neutral', isDefault: true, sortOrder: 7, isActive: true },
      
      // Professional Titles
      { thai: 'ดร.', english: 'Dr.', abbreviation: 'ดร.', category: 'professional', gender: 'neutral', isDefault: true, sortOrder: 10, isActive: true },
      { thai: 'นาย', english: 'Mr.', abbreviation: 'นาย', category: 'professional', gender: 'male', isDefault: true, sortOrder: 11, isActive: true },
      { thai: 'นาง', english: 'Mrs.', abbreviation: 'นาง', category: 'professional', gender: 'female', isDefault: true, sortOrder: 12, isActive: true },
      { thai: 'นางสาว', english: 'Miss', abbreviation: 'น.ส.', category: 'professional', gender: 'female', isDefault: true, sortOrder: 13, isActive: true },
      
      // Student Titles
      { thai: 'นักศึกษา', english: 'Student', abbreviation: 'นศ.', category: 'professional', gender: 'neutral', isDefault: false, sortOrder: 20, isActive: true },
      { thai: 'นักศึกษาชาย', english: 'Male Student', abbreviation: 'นศ.ชาย', category: 'professional', gender: 'male', isDefault: false, sortOrder: 21, isActive: true },
      { thai: 'นักศึกษาหญิง', english: 'Female Student', abbreviation: 'นศ.หญิง', category: 'professional', gender: 'female', isDefault: false, sortOrder: 22, isActive: true },
    ]
  },
  {
    id: 'government',
    name: 'หน่วยงานราชการ',
    description: 'คำนำหน้าชื่อสำหรับหน่วยงานราชการ กระทรวง กรม และองค์กรของรัฐ',
    category: 'government',
    icon: BuildingOfficeIcon,
    prefixes: [
      // Government Officials
      { thai: 'นาย', english: 'Mr.', abbreviation: 'นาย', category: 'professional', gender: 'male', isDefault: true, sortOrder: 1, isActive: true },
      { thai: 'นาง', english: 'Mrs.', abbreviation: 'นาง', category: 'professional', gender: 'female', isDefault: true, sortOrder: 2, isActive: true },
      { thai: 'นางสาว', english: 'Miss', abbreviation: 'น.ส.', category: 'professional', gender: 'female', isDefault: true, sortOrder: 3, isActive: true },
      { thai: 'ดร.', english: 'Dr.', abbreviation: 'ดร.', category: 'professional', gender: 'neutral', isDefault: true, sortOrder: 4, isActive: true },
      
      // Military Ranks (Basic)
      { thai: 'พลเอก', english: 'General', abbreviation: 'พล.อ.', category: 'professional', gender: 'male', isDefault: false, sortOrder: 10, isActive: true },
      { thai: 'พลโท', english: 'Lieutenant General', abbreviation: 'พล.ท.', category: 'professional', gender: 'male', isDefault: false, sortOrder: 11, isActive: true },
      { thai: 'พลตรี', english: 'Major General', abbreviation: 'พล.ต.', category: 'professional', gender: 'male', isDefault: false, sortOrder: 12, isActive: true },
      { thai: 'พันเอก', english: 'Colonel', abbreviation: 'พ.อ.', category: 'professional', gender: 'male', isDefault: false, sortOrder: 13, isActive: true },
      
      // Police Ranks (Basic)
      { thai: 'พลตำรวจเอก', english: 'Police General', abbreviation: 'พล.ต.อ.', category: 'professional', gender: 'male', isDefault: false, sortOrder: 20, isActive: true },
      { thai: 'พลตำรวจโท', english: 'Police Lieutenant General', abbreviation: 'พล.ต.ท.', category: 'professional', gender: 'male', isDefault: false, sortOrder: 21, isActive: true },
      { thai: 'พลตำรวจตรี', english: 'Police Major General', abbreviation: 'พล.ต.ต.', category: 'professional', gender: 'male', isDefault: false, sortOrder: 22, isActive: true },
      
      // Religious
      { thai: 'พระ', english: 'Phra', abbreviation: 'พระ', category: 'religious', gender: 'male', isDefault: true, sortOrder: 30, isActive: true },
      { thai: 'แม่ชี', english: 'Mae Chi', abbreviation: 'แม่ชี', category: 'religious', gender: 'female', isDefault: true, sortOrder: 31, isActive: true },
    ]
  },
  {
    id: 'corporate',
    name: 'องค์กรเอกชน',
    description: 'คำนำหน้าชื่อสำหรับบริษัท องค์กรเอกชน และธุรกิจ',
    category: 'corporate',
    icon: BuildingOfficeIcon,
    prefixes: [
      // Basic Professional
      { thai: 'นาย', english: 'Mr.', abbreviation: 'นาย', category: 'professional', gender: 'male', isDefault: true, sortOrder: 1, isActive: true },
      { thai: 'นาง', english: 'Mrs.', abbreviation: 'นาง', category: 'professional', gender: 'female', isDefault: true, sortOrder: 2, isActive: true },
      { thai: 'นางสาว', english: 'Miss', abbreviation: 'น.ส.', category: 'professional', gender: 'female', isDefault: true, sortOrder: 3, isActive: true },
      { thai: 'ดร.', english: 'Dr.', abbreviation: 'ดร.', category: 'professional', gender: 'neutral', isDefault: true, sortOrder: 4, isActive: true },
      
      // Professional Titles
      { thai: 'คุณ', english: 'Khun', abbreviation: 'คุณ', category: 'professional', gender: 'neutral', isDefault: true, sortOrder: 5, isActive: true },
      { thai: 'ผู้จัดการ', english: 'Manager', abbreviation: 'ผจก.', category: 'professional', gender: 'neutral', isDefault: false, sortOrder: 10, isActive: true },
      { thai: 'ผู้อำนวยการ', english: 'Director', abbreviation: 'ผอ.', category: 'professional', gender: 'neutral', isDefault: false, sortOrder: 11, isActive: true },
      { thai: 'ประธาน', english: 'Chairman', abbreviation: 'ปธ.', category: 'professional', gender: 'neutral', isDefault: false, sortOrder: 12, isActive: true },
      
      // Engineering
      { thai: 'วิศวกร', english: 'Engineer', abbreviation: 'วศ.', category: 'professional', gender: 'neutral', isDefault: false, sortOrder: 20, isActive: true },
      { thai: 'สถาปนิก', english: 'Architect', abbreviation: 'สถ.', category: 'professional', gender: 'neutral', isDefault: false, sortOrder: 21, isActive: true },
      
      // Medical
      { thai: 'แพทย์', english: 'Doctor', abbreviation: 'พ.', category: 'professional', gender: 'neutral', isDefault: false, sortOrder: 30, isActive: true },
      { thai: 'ทันตแพทย์', english: 'Dentist', abbreviation: 'ทพ.', category: 'professional', gender: 'neutral', isDefault: false, sortOrder: 31, isActive: true },
      { thai: 'เภสัชกร', english: 'Pharmacist', abbreviation: 'ภก.', category: 'professional', gender: 'neutral', isDefault: false, sortOrder: 32, isActive: true },
    ]
  },
  {
    id: 'comprehensive',
    name: 'ครบถ้วนสมบูรณ์',
    description: 'คำนำหน้าชื่อครบถ้วนสำหรับทุกประเภทองค์กร',
    category: 'comprehensive',
    icon: DocumentTextIcon,
    prefixes: [
      // Academic - Complete
      { thai: 'ศาสตราจารย์', english: 'Professor', abbreviation: 'ศ.', category: 'academic', gender: 'neutral', isDefault: true, sortOrder: 1, isActive: true },
      { thai: 'ศาสตราจารย์เกียรติคุณ', english: 'Professor Emeritus', abbreviation: 'ศ.เกียรติคุณ', category: 'honorary', gender: 'neutral', isDefault: true, sortOrder: 2, isActive: true },
      { thai: 'ศาสตราจารย์กิตติคุณ', english: 'Honorary Professor', abbreviation: 'ศ.กิตติคุณ', category: 'honorary', gender: 'neutral', isDefault: true, sortOrder: 3, isActive: true },
      { thai: 'รองศาสตราจารย์', english: 'Associate Professor', abbreviation: 'รศ.', category: 'academic', gender: 'neutral', isDefault: true, sortOrder: 4, isActive: true },
      { thai: 'รองศาสตราจารย์เกียรติคุณ', english: 'Associate Professor Emeritus', abbreviation: 'รศ.เกียรติคุณ', category: 'honorary', gender: 'neutral', isDefault: true, sortOrder: 5, isActive: true },
      { thai: 'ผู้ช่วยศาสตราจารย์', english: 'Assistant Professor', abbreviation: 'ผศ.', category: 'academic', gender: 'neutral', isDefault: true, sortOrder: 6, isActive: true },
      { thai: 'อาจารย์', english: 'Lecturer', abbreviation: 'อ.', category: 'academic', gender: 'neutral', isDefault: true, sortOrder: 7, isActive: true },
      { thai: 'อาจารย์พิเศษ', english: 'Adjunct Lecturer', abbreviation: 'อ.พิเศษ', category: 'academic', gender: 'neutral', isDefault: true, sortOrder: 8, isActive: true },
      { thai: 'อาจารย์ประจำ', english: 'Full-time Lecturer', abbreviation: 'อ.ประจำ', category: 'academic', gender: 'neutral', isDefault: false, sortOrder: 9, isActive: true },
      
      // Professional - Complete
      { thai: 'ดร.', english: 'Dr.', abbreviation: 'ดร.', category: 'professional', gender: 'neutral', isDefault: true, sortOrder: 10, isActive: true },
      { thai: 'นาย', english: 'Mr.', abbreviation: 'นาย', category: 'professional', gender: 'male', isDefault: true, sortOrder: 11, isActive: true },
      { thai: 'นาง', english: 'Mrs.', abbreviation: 'นาง', category: 'professional', gender: 'female', isDefault: true, sortOrder: 12, isActive: true },
      { thai: 'นางสาว', english: 'Miss', abbreviation: 'น.ส.', category: 'professional', gender: 'female', isDefault: true, sortOrder: 13, isActive: true },
      { thai: 'คุณ', english: 'Khun', abbreviation: 'คุณ', category: 'professional', gender: 'neutral', isDefault: true, sortOrder: 14, isActive: true },
      
      // Medical Professionals
      { thai: 'แพทย์', english: 'Doctor', abbreviation: 'พ.', category: 'professional', gender: 'neutral', isDefault: false, sortOrder: 20, isActive: true },
      { thai: 'ทันตแพทย์', english: 'Dentist', abbreviation: 'ทพ.', category: 'professional', gender: 'neutral', isDefault: false, sortOrder: 21, isActive: true },
      { thai: 'เภสัชกร', english: 'Pharmacist', abbreviation: 'ภก.', category: 'professional', gender: 'neutral', isDefault: false, sortOrder: 22, isActive: true },
      { thai: 'พยาบาล', english: 'Nurse', abbreviation: 'พย.', category: 'professional', gender: 'neutral', isDefault: false, sortOrder: 23, isActive: true },
      { thai: 'สัตวแพทย์', english: 'Veterinarian', abbreviation: 'สพ.', category: 'professional', gender: 'neutral', isDefault: false, sortOrder: 24, isActive: true },
      
      // Engineering & Technical
      { thai: 'วิศวกร', english: 'Engineer', abbreviation: 'วศ.', category: 'professional', gender: 'neutral', isDefault: false, sortOrder: 30, isActive: true },
      { thai: 'สถาปนิก', english: 'Architect', abbreviation: 'สถ.', category: 'professional', gender: 'neutral', isDefault: false, sortOrder: 31, isActive: true },
      { thai: 'ผู้ประกอบการ', english: 'Entrepreneur', abbreviation: 'ผป.', category: 'professional', gender: 'neutral', isDefault: false, sortOrder: 32, isActive: true },
      
      // Legal & Finance
      { thai: 'ทนายความ', english: 'Lawyer', abbreviation: 'ทน.', category: 'professional', gender: 'neutral', isDefault: false, sortOrder: 40, isActive: true },
      { thai: 'นักบัญชี', english: 'Accountant', abbreviation: 'นบ.', category: 'professional', gender: 'neutral', isDefault: false, sortOrder: 41, isActive: true },
      
      // Religious
      { thai: 'พระ', english: 'Phra', abbreviation: 'พระ', category: 'religious', gender: 'male', isDefault: true, sortOrder: 50, isActive: true },
      { thai: 'แม่ชี', english: 'Mae Chi', abbreviation: 'แม่ชี', category: 'religious', gender: 'female', isDefault: true, sortOrder: 51, isActive: true },
      { thai: 'พระอาจารย์', english: 'Phra Ajarn', abbreviation: 'พระอาจารย์', category: 'religious', gender: 'male', isDefault: false, sortOrder: 52, isActive: true },
      
      // Honorary
      { thai: 'ศาสตราจารย์กิตติมศักดิ์', english: 'Honorary Professor', abbreviation: 'ศ.กิตติมศักดิ์', category: 'honorary', gender: 'neutral', isDefault: false, sortOrder: 60, isActive: true },
      { thai: 'ดุษฎีบัณฑิตกิตติมศักดิ์', english: 'Honorary Doctorate', abbreviation: 'ดร.กิตติมศักดิ์', category: 'honorary', gender: 'neutral', isDefault: false, sortOrder: 61, isActive: true },
    ]
  }
];

const TemplateCard: React.FC<{
  template: PrefixTemplate;
  isSelected: boolean;
  onSelect: () => void;
  existingCount: number;
  newCount: number;
  duplicateCount: number;
}> = ({ template, isSelected, onSelect, existingCount, newCount, duplicateCount }) => {
  const Icon = template.icon;

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-lg ${
          isSelected ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
          <Icon className={`w-6 h-6 ${
            isSelected ? 'text-blue-600' : 'text-gray-600'
          }`} />
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
          <p className="text-sm text-gray-600 mb-3">{template.description}</p>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-bold text-blue-600">{template.prefixes.length}</div>
              <div className="text-gray-500">ทั้งหมด</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-green-600">{newCount}</div>
              <div className="text-gray-500">ใหม่</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-yellow-600">{duplicateCount}</div>
              <div className="text-gray-500">ซ้ำ</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PrefixPreview: React.FC<{
  prefixes: Omit<TitlePrefix, 'id'>[];
  existingPrefixes: TitlePrefix[];
}> = ({ prefixes, existingPrefixes }) => {
  const analysis = useMemo(() => {
    const existing = new Set(existingPrefixes.map(p => `${p.thai}-${p.english}`));
    const newPrefixes = prefixes.filter(p => !existing.has(`${p.thai}-${p.english}`));
    const duplicates = prefixes.filter(p => existing.has(`${p.thai}-${p.english}`));
    
    const byCategory = prefixes.reduce((acc, prefix) => {
      acc[prefix.category] = (acc[prefix.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: prefixes.length,
      new: newPrefixes.length,
      duplicates: duplicates.length,
      byCategory,
      newPrefixes,
      duplicates
    };
  }, [prefixes, existingPrefixes]);

  const categoryLabels = {
    academic: 'วิชาการ',
    professional: 'อาชีพ',
    honorary: 'กิตติมศักดิ์',
    religious: 'ศาสนา',
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{analysis.total}</div>
          <div className="text-sm text-blue-800">ทั้งหมด</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{analysis.new}</div>
          <div className="text-sm text-green-800">ใหม่</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{analysis.duplicates}</div>
          <div className="text-sm text-yellow-800">ซ้ำ</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{Object.keys(analysis.byCategory).length}</div>
          <div className="text-sm text-purple-800">หมวดหมู่</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">แยกตามหมวดหมู่</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(analysis.byCategory).map(([category, count]) => (
            <div key={category} className="p-3 border border-gray-200 rounded-lg">
              <div className="font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600">{categoryLabels[category as keyof typeof categoryLabels]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Duplicates Warning */}
      {analysis.duplicates > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">พบคำนำหน้าชื่อที่ซ้ำ</span>
          </div>
          <p className="text-sm text-yellow-700 mb-3">
            มีคำนำหน้าชื่อ {analysis.duplicates} รายการที่มีอยู่ในระบบแล้ว รายการเหล่านี้จะถูกข้าม
          </p>
          <div className="max-h-32 overflow-y-auto">
            <div className="space-y-1">
              {analysis.duplicates.slice(0, 5).map((prefix, index) => (
                <div key={index} className="text-sm text-yellow-700">
                  • {prefix.thai} ({prefix.english})
                </div>
              ))}
              {analysis.duplicates.length > 5 && (
                <div className="text-sm text-yellow-600">
                  และอีก {analysis.duplicates.length - 5} รายการ...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Prefixes Preview */}
      {analysis.new > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">คำนำหน้าชื่อใหม่ที่จะเพิ่ม</span>
          </div>
          <p className="text-sm text-green-700 mb-3">
            จะเพิ่มคำนำหน้าชื่อใหม่ {analysis.new} รายการ
          </p>
          <div className="max-h-32 overflow-y-auto">
            <div className="space-y-1">
              {analysis.newPrefixes.slice(0, 10).map((prefix, index) => (
                <div key={index} className="text-sm text-green-700">
                  • {prefix.thai} ({prefix.english}) - {categoryLabels[prefix.category]}
                </div>
              ))}
              {analysis.newPrefixes.length > 10 && (
                <div className="text-sm text-green-600">
                  และอีก {analysis.newPrefixes.length - 10} รายการ...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const DefaultPrefixLoader: React.FC<DefaultPrefixLoaderProps> = ({
  existingPrefixes,
  onLoadDefaults,
  onPreviewDefaults
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PrefixTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'preview' | 'confirm'>('select');

  // Calculate template statistics
  const templateStats = useMemo(() => {
    const existing = new Set(existingPrefixes.map(p => `${p.thai}-${p.english}`));
    
    return PREFIX_TEMPLATES.map(template => {
      const newCount = template.prefixes.filter(p => !existing.has(`${p.thai}-${p.english}`)).length;
      const duplicateCount = template.prefixes.filter(p => existing.has(`${p.thai}-${p.english}`)).length;
      
      return {
        ...template,
        newCount,
        duplicateCount,
        existingCount: existingPrefixes.length
      };
    });
  }, [existingPrefixes]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setStep('select');
    setSelectedTemplate(null);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setStep('select');
    setSelectedTemplate(null);
  }, []);

  const handleTemplateSelect = useCallback((template: PrefixTemplate) => {
    setSelectedTemplate(template);
    setStep('preview');
    onPreviewDefaults?.(template.prefixes);
  }, [onPreviewDefaults]);

  const handleConfirm = useCallback(async () => {
    if (!selectedTemplate) return;

    setIsLoading(true);
    setStep('confirm');
    
    try {
      // Filter out duplicates
      const existing = new Set(existingPrefixes.map(p => `${p.thai}-${p.english}`));
      const newPrefixes = selectedTemplate.prefixes.filter(p => !existing.has(`${p.thai}-${p.english}`));
      
      await onLoadDefaults(newPrefixes);
      handleClose();
    } catch (error) {
      console.error('Error loading defaults:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTemplate, existingPrefixes, onLoadDefaults, handleClose]);

  const handleBack = useCallback(() => {
    if (step === 'preview') {
      setStep('select');
      setSelectedTemplate(null);
    }
  }, [step]);

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <CloudArrowDownIcon className="w-4 h-4 mr-2" />
        โหลดค่าเริ่มต้น
      </button>

      <AdminModal
        isOpen={isOpen}
        onClose={handleClose}
        title="โหลดคำนำหน้าชื่อเริ่มต้น"
        size="xl"
        type="form"
      >
        <div className="space-y-6">
          {step === 'select' && (
            <>
              <div className="text-sm text-gray-600">
                เลือกเทมเพลตคำนำหน้าชื่อที่เหมาะสมกับองค์กรของคุณ
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {templateStats.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplate?.id === template.id}
                    onSelect={() => handleTemplateSelect(template)}
                    existingCount={template.existingCount}
                    newCount={template.newCount}
                    duplicateCount={template.duplicateCount}
                  />
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <InformationCircleIcon className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">ข้อมูลเพิ่มเติม</span>
                </div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• คำนำหน้าชื่อที่มีอยู่แล้วจะไม่ถูกเพิ่มซ้ำ</li>
                  <li>• คุณสามารถแก้ไขคำนำหน้าชื่อได้หลังจากโหลดเสร็จ</li>
                  <li>• การโหลดจะไม่ลบคำนำหน้าชื่อที่มีอยู่</li>
                </ul>
              </div>
            </>
          )}

          {step === 'preview' && selectedTemplate && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    ตัวอย่าง: {selectedTemplate.name}
                  </h3>
                  <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                </div>
                <button
                  onClick={handleBack}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800"
                >
                  ← กลับ
                </button>
              </div>

              <PrefixPreview
                prefixes={selectedTemplate.prefixes}
                existingPrefixes={existingPrefixes}
              />
            </>
          )}

          {step === 'confirm' && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">กำลังโหลดคำนำหน้าชื่อ</h3>
              <p className="text-gray-600">กรุณารอสักครู่...</p>
            </div>
          )}

          {/* Actions */}
          {step !== 'confirm' && (
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              
              {step === 'preview' && (
                <button
                  onClick={handleConfirm}
                  disabled={isLoading || !selectedTemplate}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      กำลังโหลด...
                    </>
                  ) : (
                    <>
                      <CloudArrowDownIcon className="w-4 h-4 mr-2" />
                      โหลดคำนำหน้าชื่อ
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </AdminModal>
    </>
  );
};

export default DefaultPrefixLoader;