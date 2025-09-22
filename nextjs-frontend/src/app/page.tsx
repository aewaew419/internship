export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          ระบบจัดการฝึกงาน
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          ยินดีต้อนรับสู่ระบบจัดการฝึกงานสำหรับนักศึกษา อาจารย์ และผู้ดูแลระบบ
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              สำหรับนักศึกษา
            </h2>
            <p className="text-gray-600 mb-4">
              ยื่นคำร้องขอฝึกงาน ติดตามสถานะ และประเมินบริษัท
            </p>
            <div className="text-blue-600 font-medium">
              เข้าสู่ระบบเพื่อเริ่มต้น →
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              สำหรับอาจารย์
            </h2>
            <p className="text-gray-600 mb-4">
              อนุมัติคำร้อง มอบหมายผู้เยี่ยม และให้คะแนน
            </p>
            <div className="text-blue-600 font-medium">
              เข้าสู่ระบบเพื่อจัดการ →
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              สำหรับผู้ดูแลระบบ
            </h2>
            <p className="text-gray-600 mb-4">
              จัดการข้อมูลระบบ รายงาน และการตั้งค่า
            </p>
            <div className="text-blue-600 font-medium">
              เข้าสู่ระบบเพื่อดูแล →
            </div>
          </div>
        </div>
        
        <div className="mt-12">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Next.js Migration Complete
            </h3>
            <p className="text-blue-700">
              ระบบได้ถูกย้ายไปใช้ Next.js 15+ พร้อม App Router และ Tailwind CSS v4 เรียบร้อยแล้ว
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
