"use client";

import { AdminRoute } from "@/components/auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import { SystemHealthMonitor } from "@/components/admin/SystemHealthMonitor";
import { SystemHealthNotifications, useSystemHealthNotifications } from "@/components/admin/SystemHealthNotifications";
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Use the custom dashboard hook for data management
  const {
    stats,
    recentActivities,
    systemIssues,
    isLoading,
    error,
    lastRefresh,
    systemHealth,
    refreshDashboard,
    isHealthy,
    hasWarnings,
    hasCriticalIssues
  } = useAdminDashboard({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    maxActivities: 10
  });

  // Use system health monitoring
  const {
    issues: healthIssues,
    metrics: healthMetrics,
    isLoading: healthLoading,
    error: healthError,
    healthStats,
    refreshSystemHealth,
    resolveIssue,
    applyQuickFix,
    hasCriticalIssues: hasHealthCriticalIssues
  } = useSystemHealth({
    autoRefresh: true,
    refreshInterval: 30000,
    enableNotifications: true
  });

  const [showHealthMonitor, setShowHealthMonitor] = useState(false);

  // System health notifications
  const {
    notifications,
    dismissNotification,
    createNotificationFromIssue,
    notifyIssueResolved
  } = useSystemHealthNotifications();

  // Monitor for new critical issues and create notifications
  useEffect(() => {
    const criticalIssues = healthIssues.filter(
      issue => issue.severity === 'critical' && !issue.resolved
    );
    
    criticalIssues.forEach(issue => {
      // Check if we already have a notification for this issue
      const existingNotification = notifications.find(
        n => n.title === issue.title
      );
      
      if (!existingNotification) {
        createNotificationFromIssue(issue);
      }
    });
  }, [healthIssues, notifications, createNotificationFromIssue]);

  // Handle quick actions with navigation
  const handleQuickAction = useCallback((actionId: string) => {
    switch (actionId) {
      case 'manage_roles':
        router.push('/admin/roles');
        break;
      case 'manage_calendar':
        router.push('/admin/calendar');
        break;
      case 'manage_prefixes':
        router.push('/admin/prefixes');
        break;
      case 'system_settings':
        router.push('/admin/settings');
        break;
      default:
        console.log('Unknown action:', actionId);
    }
  }, [router]);

  // Show error state if data loading failed
  if (error) {
    return (
      <AdminRoute>
        <AdminLayout>
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-red-900 mb-2">
                ไม่สามารถโหลดข้อมูลแดชบอร์ดได้
              </h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={refreshDashboard}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                ลองใหม่
              </button>
            </div>
          </div>
        </AdminLayout>
      </AdminRoute>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <AdminRoute>
        <AdminLayout>
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-lg shadow">
                    <div className="h-8 bg-gray-200 rounded w-8 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
                  <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                            <div className="h-3 bg-gray-200 rounded w-8"></div>
                          </div>
                          <div className="flex justify-between">
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                            <div className="h-3 bg-gray-200 rounded w-6"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AdminLayout>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="p-6">
          {/* System Health Alert */}
          {(hasCriticalIssues || hasHealthCriticalIssues) && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-red-800 font-medium">
                    ระบบต้องการความสนใจด่วน - พบปัญหาที่ต้องแก้ไข ({healthStats.criticalIssues} ปัญหาวิกฤต)
                  </span>
                </div>
                <button
                  onClick={() => setShowHealthMonitor(!showHealthMonitor)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  {showHealthMonitor ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
                </button>
              </div>
            </div>
          )}

          {/* System Health Monitor */}
          {showHealthMonitor && (
            <div className="mb-6">
              <SystemHealthMonitor
                issues={healthIssues}
                metrics={healthMetrics}
                onRefresh={refreshSystemHealth}
                onResolveIssue={resolveIssue}
                onQuickFix={applyQuickFix}
                autoRefresh={true}
                refreshInterval={30000}
              />
            </div>
          )}

          {/* Refresh Status */}
          {lastRefresh && (
            <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
              <span>อัปเดตล่าสุด: {lastRefresh.toLocaleString('th-TH')}</span>
              <button
                onClick={refreshDashboard}
                className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>รีเฟรช</span>
              </button>
            </div>
          )}

          {/* System Health Summary */}
          {!showHealthMonitor && (healthStats.totalIssues > 0 || healthStats.quickFixAvailable > 0) && (
            <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">สรุปสถานะระบบ</h3>
                <button
                  onClick={() => setShowHealthMonitor(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ดูรายละเอียดทั้งหมด
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{healthStats.criticalIssues}</div>
                  <div className="text-xs text-gray-600">ปัญหาวิกฤต</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{healthStats.highIssues + healthStats.mediumIssues}</div>
                  <div className="text-xs text-gray-600">ปัญหาสำคัญ</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{healthStats.quickFixAvailable}</div>
                  <div className="text-xs text-gray-600">แก้ไขได้ทันที</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{healthMetrics.responseTime}ms</div>
                  <div className="text-xs text-gray-600">เวลาตอบสนอง</div>
                </div>
              </div>
            </div>
          )}

          <AdminDashboard
            stats={stats}
            recentActivities={recentActivities}
            onQuickAction={handleQuickAction}
          />

          {/* System Health Notifications */}
          <SystemHealthNotifications
            notifications={notifications}
            onDismiss={dismissNotification}
            position="top-right"
            maxNotifications={3}
          />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}