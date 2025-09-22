export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        ระบบจัดการฝึกงาน - Dashboard
      </h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-600">
          ยินดีต้อนรับสู่ระบบจัดการฝึกงาน
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
