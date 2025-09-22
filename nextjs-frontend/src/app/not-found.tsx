import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-100 px-4">
      <div className="text-center p-8 max-w-md mx-auto">
        <div className="mb-6">
          <div className="text-6xl font-bold text-text-400 mb-4">404</div>
          <h1 className="text-2xl font-semibold text-text-900 mb-2">
            ไม่พบหน้าที่คุณต้องการ
          </h1>
          <p className="text-text-600 mb-8">
            หน้าที่คุณกำลังมองหาอาจถูกย้าย ลบ หรือไม่เคยมีอยู่
          </p>
          <Link
            href="/"
            className="primary-button btn-touch inline-flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}