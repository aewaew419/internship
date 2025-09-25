"use client";

import { AdminRoute } from "@/components/auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import {
  UserGroupIcon,
  CalendarIcon,
  TagIcon,
  CogIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const quickStats = [
    {
      name: "Active Roles",
      value: "12",
      icon: UserGroupIcon,
      color: "bg-blue-500",
    },
    {
      name: "Calendar Events",
      value: "8",
      icon: CalendarIcon,
      color: "bg-green-500",
    },
    {
      name: "Title Prefixes",
      value: "24",
      icon: TagIcon,
      color: "bg-purple-500",
    },
    {
      name: "System Alerts",
      value: "3",
      icon: ExclamationTriangleIcon,
      color: "bg-red-500",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      action: "Role permissions updated",
      user: "Admin User",
      time: "2 minutes ago",
      type: "role",
    },
    {
      id: 2,
      action: "New semester added",
      user: "Calendar Manager",
      time: "1 hour ago",
      type: "calendar",
    },
    {
      id: 3,
      action: "Title prefix modified",
      user: "System Admin",
      time: "3 hours ago",
      type: "prefix",
    },
  ];

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="p-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              ยินดีต้อนรับ {user?.user?.fullName || user?.user?.email} - ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {quickStats.map((stat) => (
              <div
                key={stat.name}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 ${stat.color} rounded-md flex items-center justify-center`}>
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.name}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stat.value}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Recent Activities
                </h3>
                <div className="flow-root">
                  <ul className="-mb-8">
                    {recentActivities.map((activity, activityIdx) => (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {activityIdx !== recentActivities.length - 1 ? (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                                <ChartBarIcon className="w-4 h-4 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">
                                  {activity.action}{" "}
                                  <span className="font-medium text-gray-900">
                                    by {activity.user}
                                  </span>
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {activity.time}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <button className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    <UserGroupIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900">
                      Manage Roles & Permissions
                    </span>
                  </button>
                  <button className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    <CalendarIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900">
                      Update Academic Calendar
                    </span>
                  </button>
                  <button className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    <TagIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900">
                      Configure Title Prefixes
                    </span>
                  </button>
                  <button className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    <CogIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900">
                      System Settings
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}