"use client";

import { AdminRoute } from "@/components/auth";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function TitlePrefixesPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Title Prefixes</h1>
            <p className="mt-1 text-sm text-gray-600">
              จัดการคำนำหน้าชื่อและการกำหนดสิทธิ์ตามบทบาท
            </p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Title Prefix Management
              </h3>
              <p className="text-gray-600">
                This page will contain the title prefix management system with role assignments.
              </p>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}