"use client";

import { useState, useEffect } from 'react';
import { AuthErrorReporter, type ErrorAnalytics } from '@/lib/auth/error-reporter';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export interface AuthErrorDashboardProps {
  className?: string;
  showExportButton?: boolean;
  showClearButton?: boolean;
  onExport?: (data: any) => void;
  onClear?: () => void;
}

/**
 * Authentication error analytics dashboard
 * Displays error statistics, trends, and recovery rates
 */
export const AuthErrorDashboard = ({
  className = '',
  showExportButton = true,
  showClearButton = false,
  onExport,
  onClear,
}: AuthErrorDashboardProps) => {
  const [analytics, setAnalytics] = useState<ErrorAnalytics | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'trends' | 'recovery'>('overview');

  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    setIsLoading(true);
    try {
      const analyticsData = AuthErrorReporter.getAnalytics();
      const summaryData = AuthErrorReporter.getErrorSummary();
      
      setAnalytics(analyticsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load error analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const exportData = AuthErrorReporter.exportErrorData();
      onExport?.(exportData);
      
      // Default export as JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auth-error-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export analytics:', error);
    }
  };

  const handleClear = () => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบข้อมูลการวิเคราะห์ข้อผิดพลาดทั้งหมด?')) {
      AuthErrorReporter.clearStoredData();
      onClear?.();
      loadAnalytics();
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analytics || !summary) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 text-center ${className}`}>
        <div className="text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-medium">ไม่มีข้อมูลการวิเคราะห์</p>
          <p className="text-sm">ข้อมูลจะแสดงเมื่อมีข้อผิดพลาดเกิดขึ้น</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className={`font-semibold text-gray-900 ${isMobile ? 'text-lg' : 'text-xl'}`}>
            การวิเคราะห์ข้อผิดพลาดการเข้าสู่ระบบ
          </h2>
          <div className="flex gap-2">
            {showExportButton && (
              <button
                onClick={handleExport}
                className={`
                  inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium
                  text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors
                  ${isMobile ? 'px-2 py-1 text-xs' : ''}
                `}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isMobile ? 'ส่งออก' : 'ส่งออกข้อมูล'}
              </button>
            )}
            {showClearButton && (
              <button
                onClick={handleClear}
                className={`
                  inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium
                  text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors
                  ${isMobile ? 'px-2 py-1 text-xs' : ''}
                `}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {isMobile ? 'ลบ' : 'ลบข้อมูล'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6">
        <div className={`grid gap-4 mb-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium text-blue-600 ${isMobile ? 'text-xs' : ''}`}>
                  ข้อผิดพลาดทั้งหมด
                </p>
                <p className={`text-2xl font-bold text-blue-900 ${isMobile ? 'text-xl' : ''}`}>
                  {summary.totalErrors}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium text-yellow-600 ${isMobile ? 'text-xs' : ''}`}>
                  24 ชั่วโมงที่ผ่านมา
                </p>
                <p className={`text-2xl font-bold text-yellow-900 ${isMobile ? 'text-xl' : ''}`}>
                  {summary.recentErrors}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium text-red-600 ${isMobile ? 'text-xs' : ''}`}>
                  ข้อผิดพลาดร้ายแรง
                </p>
                <p className={`text-2xl font-bold text-red-900 ${isMobile ? 'text-xl' : ''}`}>
                  {summary.criticalErrors}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium text-green-600 ${isMobile ? 'text-xs' : ''}`}>
                  อัตราการแก้ไข
                </p>
                <p className={`text-2xl font-bold text-green-900 ${isMobile ? 'text-xl' : ''}`}>
                  {Math.round(summary.averageRecoveryRate * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'ภาพรวม' },
              { id: 'trends', label: 'แนวโน้ม' },
              { id: 'recovery', label: 'การแก้ไข' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm transition-colors
                  ${selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  ${isMobile ? 'text-xs px-2' : ''}
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Error by Category */}
            <div>
              <h3 className={`font-medium text-gray-900 mb-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
                ข้อผิดพลาดตามประเภท
              </h3>
              <div className="space-y-2">
                {Object.entries(analytics.errorsByCategory).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className={`text-gray-600 capitalize ${isMobile ? 'text-sm' : ''}`}>
                      {getCategoryLabel(category)}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(count / Math.max(...Object.values(analytics.errorsByCategory))) * 100}%`
                          }}
                        />
                      </div>
                      <span className={`font-medium text-gray-900 w-8 text-right ${isMobile ? 'text-sm' : ''}`}>
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Errors */}
            <div>
              <h3 className={`font-medium text-gray-900 mb-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
                ข้อผิดพลาดที่พบบ่อย
              </h3>
              <div className="space-y-2">
                {analytics.topErrors.slice(0, 5).map((error, index) => (
                  <div key={error.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`
                        flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 
                        flex items-center justify-center font-medium
                        ${isMobile ? 'w-5 h-5 text-xs' : 'text-sm'}
                      `}>
                        {index + 1}
                      </span>
                      <div>
                        <p className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>
                          {getErrorCodeLabel(error.code)}
                        </p>
                        <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {error.code}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-gray-900 ${isMobile ? 'text-sm' : ''}`}>
                        {error.count}
                      </p>
                      <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        ครั้ง
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'trends' && (
          <div>
            <h3 className={`font-medium text-gray-900 mb-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
              แนวโน้มข้อผิดพลาด (30 วันที่ผ่านมา)
            </h3>
            {analytics.errorTrends.length > 0 ? (
              <div className="space-y-4">
                {/* Simple trend visualization */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {analytics.errorTrends.slice(-7).map((trend, index) => (
                    <div key={trend.date} className="space-y-1">
                      <div className={`text-xs text-gray-500 ${isMobile ? 'text-xs' : ''}`}>
                        {new Date(trend.date).toLocaleDateString('th-TH', { weekday: 'short' })}
                      </div>
                      <div
                        className="bg-blue-200 rounded mx-auto"
                        style={{
                          height: `${Math.max(4, (trend.count / Math.max(...analytics.errorTrends.map(t => t.count))) * 40)}px`,
                          width: '20px',
                        }}
                      />
                      <div className={`text-xs font-medium ${isMobile ? 'text-xs' : ''}`}>
                        {trend.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">ไม่มีข้อมูลแนวโน้ม</p>
            )}
          </div>
        )}

        {selectedTab === 'recovery' && (
          <div>
            <h3 className={`font-medium text-gray-900 mb-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
              อัตราการแก้ไขข้อผิดพลาด
            </h3>
            <div className="space-y-3">
              {Object.entries(analytics.recoverySuccess).map(([errorCode, recovery]) => (
                <div key={errorCode} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>
                      {getErrorCodeLabel(errorCode)}
                    </span>
                    <span className={`text-sm text-gray-500 ${isMobile ? 'text-xs' : ''}`}>
                      {Math.round(recovery.successRate * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${recovery.successRate * 100}%` }}
                    />
                  </div>
                  <div className={`flex justify-between text-sm text-gray-600 ${isMobile ? 'text-xs' : ''}`}>
                    <span>สำเร็จ: {recovery.successful}</span>
                    <span>ทั้งหมด: {recovery.attempted}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    validation: 'การตรวจสอบข้อมูล',
    authentication: 'การเข้าสู่ระบบ',
    authorization: 'การอนุญาต',
    network: 'เครือข่าย',
    server: 'เซิร์ฟเวอร์',
    security: 'ความปลอดภัย',
  };
  return labels[category] || category;
}

function getErrorCodeLabel(code: string): string {
  const labels: Record<string, string> = {
    AUTH_INVALID_CREDENTIALS: 'ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง',
    AUTH_ACCOUNT_LOCKED: 'บัญชีถูกล็อค',
    AUTH_TOO_MANY_ATTEMPTS: 'พยายามเข้าสู่ระบบบ่อยเกินไป',
    NETWORK_ERROR: 'ปัญหาการเชื่อมต่อ',
    SERVER_ERROR: 'ข้อผิดพลาดของระบบ',
    VALIDATION_INVALID_STUDENT_ID: 'รหัสนักศึกษาไม่ถูกต้อง',
    VALIDATION_INVALID_EMAIL: 'อีเมลไม่ถูกต้อง',
  };
  return labels[code] || code;
}