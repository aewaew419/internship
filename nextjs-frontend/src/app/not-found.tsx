import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          ไม่พบหน้าที่คุณต้องการ
        </h2>
        <p className="text-gray-600 mb-6">
          หน้าที่คุณกำลังมองหาอาจถูกย้าย ลบ หรือไม่มีอยู่จริง
        </p>
        <Link
          href="/"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
        >
          กลับสู่หน้าหลัก
        </Link>
      </div>
    </div>
  );
}