"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user_account");
    const token = localStorage.getItem("access_token");

    if (!userData || !token) {
      router.push("/");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/");
      return;
    }

    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user_account");
    localStorage.removeItem("access_token");
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          ระบบจัดการฝึกงาน - Dashboard
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          ออกจากระบบ
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-600 mb-4">
          ยินดีต้อนรับ {user?.user?.first_name} {user?.user?.last_name} ({user?.user?.student_id})
        </p>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">เอกสารผ่านแล้ว</h3>
            <p className="text-2xl font-bold text-blue-600">25</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900">รอการพิจารณา</h3>
            <p className="text-2xl font-bold text-yellow-600">12</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">กำลังเลือกบริษัท</h3>
            <p className="text-2xl font-bold text-green-600">8</p>
          </div>
        </div>
      </div>
    </div>
  );
}