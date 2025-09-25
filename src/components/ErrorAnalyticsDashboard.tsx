import React, { useState, useEffect } from 'react';
import { useErrorReporting } from '../hooks/useErrorReporting';
import { ErrorAnalytics } from '../services/errorReporting';

interface ErrorAnalyticsDashboardProps {
  className?: string;
}

export const ErrorAnalyticsDashboard: React.FC<ErrorAnalyticsDashboardProps> = ({
  className = ''
}) => {
  const [analytics, setAnalytics] = useState<ErrorAnalytics | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);

  const { getAnalytics } = useErrorReporting();

  useEffect(() => {
    const loadAnalytics = () => {
      setLoading(true);
      try {
        const data = getAnalytics(timeRange);
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [timeRange, getAnalytics]);

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getErrorTypeColor = (type: string) => {
    const colors = {
      validation: 'bg-yellow-100 text-yellow-800',
      authentication: 'bg-red-100 text-red-800',
      network: 'bg-blue-100 text-blue-800',
      system: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (count: number, total: number) => {
    const percentage = (count / total) * 100;
    if (percentage > 50) return 'text-red-600';
    if (percentage > 25) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-gray-500">ไม่สามารถโหลดข้อมูลการวิเคราะห์ได้</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            การวิเคราะห์ข้อผิดพลาด
          </h2>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">24 ชั่วโมงที่ผ่านมา</option>
            <option value="week">7 วันที่ผ่านมา</option>
            <option value="month">30 วันที่ผ่านมา</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-800">ข้อผิดพลาดทั้งหมด</p>
                <p className="text-2xl font-bold text-red-900">{analytics.totalErrors}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-800">ผู้ใช้ที่ได้รับผลกระทบ</p>
                <p className="text-2xl font-bold text-yellow-900">{analytics.userImpact.affectedUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-800">อัตราความล้มเหลว</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatPercentage(analytics.userImpact.failureRate)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Types */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">ประเภทข้อผิดพลาด</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(analytics.errorsByType).map(([type, count]) => (
              <div key={type} className="text-center">
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getErrorTypeColor(type)}`}>
                  {type}
                </span>
                <p className={`text-lg font-bold mt-1 ${getSeverityColor(count, analytics.totalErrors)}`}>
                  {count}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Errors */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">ข้อผิดพลาดที่พบบ่อย</h3>
          <div className="space-y-2">
            {analytics.topErrors.slice(0, 5).map((error, index) => (
              <div key={error.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">
                      #{index + 1}
                    </span>
                    <code className="text-sm bg-gray-200 px-2 py-1 rounded">
                      {error.code}
                    </code>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{error.message}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{error.count}</p>
                  <p className="text-xs text-gray-500">ครั้ง</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Trends */}
        {analytics.errorTrends.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">แนวโน้มข้อผิดพลาด</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-end space-x-2 h-32">
                {analytics.errorTrends.map((trend, index) => {
                  const maxCount = Math.max(...analytics.errorTrends.map(t => t.count));
                  const height = maxCount > 0 ? (trend.count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={trend.date} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${height}%`, minHeight: trend.count > 0 ? '4px' : '0' }}
                        title={`${trend.date}: ${trend.count} errors`}
                      ></div>
                      <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                        {new Date(trend.date).toLocaleDateString('th-TH', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};