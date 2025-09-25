"use client";

import { AdminRoute } from "@/components/auth";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AcademicCalendarPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Academic Calendar</h1>
            <p className="mt-1 text-sm text-gray-600">
              จัดการปฏิทินการศึกษา ภาคเรียน และวันหยุด
            </p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Academic Calendar Management
              </h3>
              <p className="text-gray-600">
                This page will contain the academic calendar interface with semester and holiday management.
              </p>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}