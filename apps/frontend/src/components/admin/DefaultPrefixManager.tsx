'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  StarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { AdminModal } from './AdminModal';

interface TitlePrefix {
  id: number;
  thai: string;
  english: string;
  abbreviation: string;
  category: 'academic' | 'professional' | 'honorary' | 'religious';
  gender: 'male' | 'female' | 'neutral';
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
}

interface Role {
  id: number;
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  category: 'student' | 'faculty' | 'staff' | 'admin' | 'external';
  level: number;
  isActive: boolean;
}

interface PrefixRoleAssignment {
  prefixId: number;
  roleId: number;
  isDefault: boolean;
  canModify: boolean;
  assignedBy: number;
  assignedAt: string;
}

interface DefaultPrefixManagerProps {
  prefixes: TitlePrefix[];
  roles: Role[];
  assignments: PrefixRoleAssignment[];
  onLoadDefaults: () => Promise<void>;
  onApplyRecommendations: (recommendations: DefaultRecommendation[]) => Promise<void>;
  onAssignmentChange: (prefixId: number, roleId: number, assigned: boolean, isDefault?: boolean) => Promise<void>;
}

interface DefaultRecommendation {
  roleId: number;
  prefixId: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  action: 'assign' | 'unassign' | 'set_default';
}

const ROLE_CATEGORIES = {
  student: { label: 'นักศึกษา', color: 'bg-blue-50 text-blue-800' },
  faculty: { label: 'อาจารย์', color: 'bg-green-50 text-green-800' },
  staff: { label: 'เจ้าหน้าที่', color: 'bg-yellow-50 text-yellow-800' },
  admin: { label: 'ผู้ดูแลระบบ', color: 'bg-purple-50 text-purple-800' },
  external: { label: 'บุคคลภายนอก', color: 'bg-gray-50 text-gray-800' },
};

const PREFIX_CATEGORIES = {
  academic: { label: 'วิชาการ', color: 'bg-blue-100 text-blue-800' },
  professional: { label: 'อาชีพ', color: 'bg-green-100 text-green-800' },
  honorary: { label: 'กิตติมศักดิ์', color: 'bg-purple-100 text-purple-800' },
  religious: { label: 'ศาสนา', color: 'bg-yellow-100 text-yellow-800' },
};

// Default assignment rules based on Thai academic conventions
const generateDefaultRecommendations = (
  prefixes: TitlePrefix[], 
  roles: Role[], 
  assignments: PrefixRoleAssignment[]
): DefaultRecommendation[] => {
  const recommendations: DefaultRecommendation[] = [];
  const assignmentMap = new Map<string, PrefixRoleAssignment>();
  
  assignments.forEach(assignment => {
    assignmentMap.set(`${assignment.prefixId}-${assignment.roleId}`, assignment);
  });

  roles.forEach(role => {
    const roleAssignments = assignments.filter(a => a.roleId === role.id);
    const hasDefault = roleAssignments.some(a => a.isDefault);

    switch (role.category) {
      case 'student':
        // Students should have basic professional prefixes
        const studentPrefixes = prefixes.filter(p => 
          p.category === 'professional' && 
          ['นาย', 'นาง', 'นางสาว'].includes(p.thai)
        );
        
        studentPrefixes.forEach(prefix => {
          const key = `${prefix.id}-${role.id}`;
          if (!assignmentMap.has(key)) {
            recommendations.push({
              roleId: role.id,
              prefixId: prefix.id,
              reason: `นักศึกษาควรมีคำนำหน้าชื่อ "${prefix.thai}" สำหรับใช้ทั่วไป`,
              confidence: 'high',
              action: 'assign'
            });
          }
        });

        // Set default for students (นาย for general use)
        if (!hasDefault) {
          const defaultPrefix = prefixes.find(p => p.thai === 'นาย');
          if (defaultPrefix) {
            recommendations.push({
              roleId: role.id,
              prefixId: defaultPrefix.id,
              reason: 'กำหนด "นาย" เป็นคำนำหน้าชื่อเริ่มต้นสำหรับนักศึกษา',
              confidence: 'high',
              action: 'set_default'
            });
          }
        }
        break;

      case 'faculty':
        // Faculty should have academic prefixes
        const facultyPrefixes = prefixes.filter(p => 
          p.category === 'academic' || 
          (p.category === 'professional' && ['ดร.', 'นาย', 'นาง', 'นางสาว'].includes(p.thai))
        );
        
        facultyPrefixes.forEach(prefix => {
          const key = `${prefix.id}-${role.id}`;
          if (!assignmentMap.has(key)) {
            recommendations.push({
              roleId: role.id,
              prefixId: prefix.id,
              reason: `อาจารย์ควรมีคำนำหน้าชื่อ "${prefix.thai}" สำหรับใช้ในงานวิชาการ`,
              confidence: prefix.category === 'academic' ? 'high' : 'medium',
              action: 'assign'
            });
          }
        });

        // Set default for faculty (อาจารย์)
        if (!hasDefault) {
          const defaultPrefix = prefixes.find(p => p.thai === 'อาจารย์');
          if (defaultPrefix) {
            recommendations.push({
              roleId: role.id,
              prefixId: defaultPrefix.id,
              reason: 'กำหนด "อาจารย์" เป็นคำนำหน้าชื่อเริ่มต้นสำหรับอาจารย์',
              confidence: 'high',
              action: 'set_default'
            });
          }
        }
        break;

      case 'staff':
        // Staff should have professional prefixes
        const staffPrefixes = prefixes.filter(p => 
          p.category === 'professional' && 
          ['นาย', 'นาง', 'นางสาว', 'ดร.'].includes(p.thai)
        );
        
        staffPrefixes.forEach(prefix => {
          const key = `${prefix.id}-${role.id}`;
          if (!assignmentMap.has(key)) {
            recommendations.push({
              roleId: role.id,
              prefixId: prefix.id,
              reason: `เจ้าหน้าที่ควรมีคำนำหน้าชื่อ "${prefix.thai}" สำหรับใช้ในการทำงาน`,
              confidence: 'medium',
              action: 'assign'
            });
          }
        });

        // Set default for staff
        if (!hasDefault) {
          const defaultPrefix = prefixes.find(p => p.thai === 'นาย');
          if (defaultPrefix) {
            recommendations.push({
              roleId: role.id,
              prefixId: defaultPrefix.id,
              reason: 'กำหนด "นาย" เป็นคำนำหน้าชื่อเริ่มต้นสำหรับเจ้าหน้าที่',
              confidence: 'medium',
              action: 'set_default'
            });
          }
        }
        break;

      case 'admin':
        // Admin should have all prefixes available
        const adminPrefixes = prefixes.filter(p => p.isActive);
        
        adminPrefixes.forEach(prefix => {
          const key = `${prefix.id}-${role.id}`;
          if (!assignmentMap.has(key)) {
            recommendations.push({
              roleId: role.id,
              prefixId: prefix.id,
              reason: `ผู้ดูแลระบบควรมีสิทธิ์ใช้คำนำหน้าชื่อ "${prefix.thai}" ทุกประเภท`,
              confidence: 'low',
              action: 'assign'
            });
          }
        });
        break;

      case 'external':
        // External users should have basic professional prefixes
        const externalPrefixes = prefixes.filter(p => 
          p.category === 'professional' && 
          ['นาย', 'นาง', 'นางสาว', 'ดร.'].includes(p.thai)
        );
        
        externalPrefixes.forEach(prefix => {
          const key = `${prefix.id}-${role.id}`;
          if (!assignmentMap.has(key)) {
            recommendations.push({
              roleId: role.id,
              prefixId: prefix.id,
              reason: `บุคคลภายนอกควรมีคำนำหน้าชื่อ "${prefix.thai}" สำหรับใช้ทั่วไป`,
              confidence: 'medium',
              action: 'assign'
            });
          }
        });
        break;
    }
  });

  return recommendations;
};

const RecommendationCard: React.FC<{
  recommendation: DefaultRecommendation;
  prefix: TitlePrefix;
  role: Role;
  onApply: () => void;
  onDismiss: () => void;
}> = ({ recommendation, prefix, role, onApply, onDismiss }) => {
  const getConfidenceColor = () => {
    switch (recommendation.confidence) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-gray-600 bg-gray-50';
    }
  };

  const getActionIcon = () => {
    switch (recommendation.action) {
      case 'assign': return <CheckCircleIcon className="w-4 h-4" />;
      case 'set_default': return <StarIcon className="w-4 h-4" />;
      case 'unassign': return <ExclamationTriangleIcon className="w-4 h-4" />;
    }
  };

  const getActionLabel = () => {
    switch (recommendation.action) {
      case 'assign': return 'กำหนด';
      case 'set_default': return 'ตั้งเป็นเริ่มต้น';
      case 'unassign': return 'ยกเลิก';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getActionIcon()}
          <span className="font-medium text-gray-900">{getActionLabel()}</span>
          <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor()}`}>
            {recommendation.confidence === 'high' ? 'แนะนำสูง' : 
             recommendation.confidence === 'medium' ? 'แนะนำปานกลาง' : 'แนะนำต่ำ'}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onApply}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            ใช้
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200"
          >
            ข้าม
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">คำนำหน้าชื่อ:</span>
          <span className="font-medium">{prefix.thai}</span>
          <span className="text-sm text-gray-500">({prefix.english})</span>
          <span className={`px-2 py-1 text-xs rounded ${PREFIX_CATEGORIES[prefix.category].color}`}>
            {PREFIX_CATEGORIES[prefix.category].label}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">บทบาท:</span>
          <span className="font-medium">{role.displayName}</span>
          <span className={`px-2 py-1 text-xs rounded ${ROLE_CATEGORIES[role.category].color}`}>
            {ROLE_CATEGORIES[role.category].label}
          </span>
        </div>

        <div className="text-sm text-gray-600">
          <span className="font-medium">เหตุผล:</span> {recommendation.reason}
        </div>
      </div>
    </div>
  );
};

export const DefaultPrefixManager: React.FC<DefaultPrefixManagerProps> = ({
  prefixes,
  roles,
  assignments,
  onLoadDefaults,
  onApplyRecommendations,
  onAssignmentChange
}) => {
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecommendations, setSelectedRecommendations] = useState<DefaultRecommendation[]>([]);

  // Generate recommendations
  const recommendations = useMemo(() => {
    return generateDefaultRecommendations(prefixes, roles, assignments);
  }, [prefixes, roles, assignments]);

  // Group recommendations by confidence
  const groupedRecommendations = useMemo(() => {
    return {
      high: recommendations.filter(r => r.confidence === 'high'),
      medium: recommendations.filter(r => r.confidence === 'medium'),
      low: recommendations.filter(r => r.confidence === 'low'),
    };
  }, [recommendations]);

  // Statistics
  const stats = useMemo(() => {
    const totalAssignments = assignments.length;
    const defaultAssignments = assignments.filter(a => a.isDefault).length;
    const rolesWithDefaults = new Set(assignments.filter(a => a.isDefault).map(a => a.roleId)).size;
    const rolesWithoutDefaults = roles.length - rolesWithDefaults;

    return {
      totalAssignments,
      defaultAssignments,
      rolesWithDefaults,
      rolesWithoutDefaults,
      recommendationCount: recommendations.length,
    };
  }, [assignments, roles, recommendations]);

  const handleLoadDefaults = useCallback(async () => {
    setIsLoading(true);
    try {
      await onLoadDefaults();
    } catch (error) {
      console.error('Error loading defaults:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onLoadDefaults]);

  const handleApplyRecommendation = useCallback(async (recommendation: DefaultRecommendation) => {
    try {
      if (recommendation.action === 'assign') {
        await onAssignmentChange(recommendation.prefixId, recommendation.roleId, true, false);
      } else if (recommendation.action === 'set_default') {
        await onAssignmentChange(recommendation.prefixId, recommendation.roleId, true, true);
      } else if (recommendation.action === 'unassign') {
        await onAssignmentChange(recommendation.prefixId, recommendation.roleId, false);
      }
    } catch (error) {
      console.error('Error applying recommendation:', error);
    }
  }, [onAssignmentChange]);

  const handleApplyAllRecommendations = useCallback(async () => {
    if (selectedRecommendations.length === 0) return;

    setIsLoading(true);
    try {
      await onApplyRecommendations(selectedRecommendations);
      setSelectedRecommendations([]);
    } catch (error) {
      console.error('Error applying recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRecommendations, onApplyRecommendations]);

  const handleToggleRecommendation = (recommendation: DefaultRecommendation) => {
    setSelectedRecommendations(prev => {
      const exists = prev.some(r => 
        r.prefixId === recommendation.prefixId && 
        r.roleId === recommendation.roleId &&
        r.action === recommendation.action
      );
      
      if (exists) {
        return prev.filter(r => 
          !(r.prefixId === recommendation.prefixId && 
            r.roleId === recommendation.roleId &&
            r.action === recommendation.action)
        );
      } else {
        return [...prev, recommendation];
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">จัดการค่าเริ่มต้น</h2>
          <p className="text-sm text-gray-600">
            กำหนดคำนำหน้าชื่อเริ่มต้นสำหรับแต่ละบทบาท
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowRecommendations(!showRecommendations)}
            className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <InformationCircleIcon className="w-4 h-4 mr-2" />
            คำแนะนำ ({recommendations.length})
          </button>
          <button
            onClick={handleLoadDefaults}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            โหลดค่าเริ่มต้น
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.totalAssignments}</div>
          <div className="text-sm text-blue-800">การกำหนดทั้งหมด</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{stats.defaultAssignments}</div>
          <div className="text-sm text-green-800">ค่าเริ่มต้น</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.rolesWithDefaults}</div>
          <div className="text-sm text-purple-800">บทบาทที่มีค่าเริ่มต้น</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{stats.rolesWithoutDefaults}</div>
          <div className="text-sm text-red-800">บทบาทที่ไม่มีค่าเริ่มต้น</div>
        </div>
      </div>

      {/* Recommendations */}
      {showRecommendations && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">คำแนะนำการกำหนดค่าเริ่มต้น</h3>
            {selectedRecommendations.length > 0 && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  เลือกแล้ว {selectedRecommendations.length} รายการ
                </span>
                <button
                  onClick={handleApplyAllRecommendations}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  ใช้ทั้งหมด
                </button>
                <button
                  onClick={() => setSelectedRecommendations([])}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                >
                  ยกเลิก
                </button>
              </div>
            )}
          </div>

          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                การกำหนดค่าเริ่มต้นสมบูรณ์แล้ว
              </h4>
              <p className="text-gray-600">
                ไม่มีคำแนะนำเพิ่มเติมสำหรับการกำหนดคำนำหน้าชื่อ
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* High Confidence Recommendations */}
              {groupedRecommendations.high.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-800 mb-3 flex items-center">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    แนะนำสูง ({groupedRecommendations.high.length})
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {groupedRecommendations.high.map((recommendation, index) => {
                      const prefix = prefixes.find(p => p.id === recommendation.prefixId)!;
                      const role = roles.find(r => r.id === recommendation.roleId)!;
                      
                      return (
                        <div key={index} className="relative">
                          <input
                            type="checkbox"
                            checked={selectedRecommendations.some(r => 
                              r.prefixId === recommendation.prefixId && 
                              r.roleId === recommendation.roleId &&
                              r.action === recommendation.action
                            )}
                            onChange={() => handleToggleRecommendation(recommendation)}
                            className="absolute top-2 left-2 z-10"
                          />
                          <RecommendationCard
                            recommendation={recommendation}
                            prefix={prefix}
                            role={role}
                            onApply={() => handleApplyRecommendation(recommendation)}
                            onDismiss={() => {}}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Medium Confidence Recommendations */}
              {groupedRecommendations.medium.length > 0 && (
                <div>
                  <h4 className="font-medium text-yellow-800 mb-3 flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                    แนะนำปานกลาง ({groupedRecommendations.medium.length})
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {groupedRecommendations.medium.map((recommendation, index) => {
                      const prefix = prefixes.find(p => p.id === recommendation.prefixId)!;
                      const role = roles.find(r => r.id === recommendation.roleId)!;
                      
                      return (
                        <div key={index} className="relative">
                          <input
                            type="checkbox"
                            checked={selectedRecommendations.some(r => 
                              r.prefixId === recommendation.prefixId && 
                              r.roleId === recommendation.roleId &&
                              r.action === recommendation.action
                            )}
                            onChange={() => handleToggleRecommendation(recommendation)}
                            className="absolute top-2 left-2 z-10"
                          />
                          <RecommendationCard
                            recommendation={recommendation}
                            prefix={prefix}
                            role={role}
                            onApply={() => handleApplyRecommendation(recommendation)}
                            onDismiss={() => {}}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Low Confidence Recommendations */}
              {groupedRecommendations.low.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                    <InformationCircleIcon className="w-5 h-5 mr-2" />
                    แนะนำต่ำ ({groupedRecommendations.low.length})
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {groupedRecommendations.low.slice(0, 6).map((recommendation, index) => {
                      const prefix = prefixes.find(p => p.id === recommendation.prefixId)!;
                      const role = roles.find(r => r.id === recommendation.roleId)!;
                      
                      return (
                        <div key={index} className="relative">
                          <input
                            type="checkbox"
                            checked={selectedRecommendations.some(r => 
                              r.prefixId === recommendation.prefixId && 
                              r.roleId === recommendation.roleId &&
                              r.action === recommendation.action
                            )}
                            onChange={() => handleToggleRecommendation(recommendation)}
                            className="absolute top-2 left-2 z-10"
                          />
                          <RecommendationCard
                            recommendation={recommendation}
                            prefix={prefix}
                            role={role}
                            onApply={() => handleApplyRecommendation(recommendation)}
                            onDismiss={() => {}}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {groupedRecommendations.low.length > 6 && (
                    <div className="text-center mt-4">
                      <span className="text-sm text-gray-500">
                        และอีก {groupedRecommendations.low.length - 6} รายการ...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Current Default Assignments */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">คำนำหน้าชื่อเริ่มต้นปัจจุบัน</h3>
        
        {stats.defaultAssignments === 0 ? (
          <div className="text-center py-8">
            <Cog6ToothIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              ยังไม่มีการกำหนดค่าเริ่มต้น
            </h4>
            <p className="text-gray-600 mb-4">
              เริ่มต้นด้วยการโหลดค่าเริ่มต้นหรือใช้คำแนะนำ
            </p>
            <button
              onClick={handleLoadDefaults}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              โหลดค่าเริ่มต้น
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {roles.map(role => {
              const roleDefaults = assignments.filter(a => a.roleId === role.id && a.isDefault);
              
              if (roleDefaults.length === 0) return null;

              return (
                <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{role.displayName}</span>
                      <span className={`px-2 py-1 text-xs rounded ${ROLE_CATEGORIES[role.category].color}`}>
                        {ROLE_CATEGORIES[role.category].label}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {roleDefaults.length} ค่าเริ่มต้น
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {roleDefaults.map(assignment => {
                      const prefix = prefixes.find(p => p.id === assignment.prefixId);
                      if (!prefix) return null;
                      
                      return (
                        <div
                          key={assignment.prefixId}
                          className="flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <StarIcon className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-800">{prefix.thai}</span>
                          <span className="text-sm text-green-600">({prefix.english})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DefaultPrefixManager;