"use client";

import { AdminRoute } from "@/components/auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { GlobalSearch } from "@/components/admin/GlobalSearch";

export default function AdminSearchPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">ค้นหาข้อมูลทั่วระบบ</h1>
            <p className="mt-1 text-sm text-gray-600">
              ค้นหาข้อมูลจากทุกส่วนของระบบ รวมถึงบทบาท ปฏิทิน คำนำหน้าชื่อ และอื่นๆ
            </p>
          </div>
          
          <GlobalSearch />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}