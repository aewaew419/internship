import { useState } from 'react'
import { useRouter } from 'next/router'

const Layout = ({ children, user, onLogout }) => {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const getNavigation = () => {
    const baseNavigation = [
      { name: 'หน้าแรก', href: '/', icon: '🏠' },
      { name: 'นักศึกษา', href: '/students', icon: '👨‍🎓' },
      { name: 'บริษัท', href: '/companies', icon: '🏢' },
      { name: 'การฝึกงาน', href: '/internships', icon: '📋' },
    ]

    if (user?.role === 'admin') {
      return [
        { name: 'หน้าแรก', href: '/', icon: '🏠' },
        { name: 'แดชบอร์ดผู้ดูแล', href: '/admin/dashboard', icon: '📊' },
        { name: 'จัดการผู้ใช้', href: '/admin/users', icon: '👥' },
        { name: 'นักศึกษา', href: '/students', icon: '👨‍🎓' },
        { name: 'บริษัท', href: '/companies', icon: '🏢' },
        { name: 'การฝึกงาน', href: '/internships', icon: '📋' },
        { name: 'ตั้งค่าระบบ', href: '/admin/settings', icon: '⚙️' },
      ]
    }

    if (user?.role === 'instructor') {
      return [
        ...baseNavigation,
        { name: 'อนุมัติการฝึกงาน', href: '/instructor/approvals', icon: '✅' },
        { name: 'นิเทศการฝึกงาน', href: '/instructor/supervise', icon: '👨‍🏫' },
      ]
    }

    return baseNavigation
  }

  const navigation = getNavigation()

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f3f3f3' }}>
      {/* Sidebar */}
      <nav className="bg-white fixed h-screen overflow-y-auto shadow-lg" style={{ width: '16rem' }}>
        <div className="container">
          {/* Logo */}
          <div className="py-5 mx-5 border-b-2 border-text-200">
            <img src="/logo.png" alt="Logo" className="h-16" />
          </div>
          
          {/* Navigation */}
          <div className="space-x-4">
            <ul className="mx-5">
              {navigation.map((item) => (
                <li
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`${
                    router.pathname === item.href
                      ? "text-white bg-gradient"
                      : "hover:bg-gray-100"
                  } flex gap-2 font-bold my-5 py-3 px-5 rounded-lg cursor-pointer transition-colors duration-300`}
                >
                  <span>{item.icon}</span>
                  <p className="ml-2 my-auto w-32 text-sm">{item.name}</p>
                </li>
              ))}
            </ul>
            
            {/* Logout Button */}
            <div className="mt-auto mx-5">
              <button
                onClick={onLogout}
                className="w-full hover:bg-gray-100 text-error flex gap-2 font-bold my-5 pb-2 pt-3 px-5 rounded-lg cursor-pointer transition-colors duration-300"
              >
                <span>🚪</span>
                <p>ออกจากระบบ</p>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container p-4" style={{ marginLeft: '16rem' }}>
        <div className="border-b-2 border-text-200 mt-4">
          <p className="gradient-text text-xl font-extrabold my-4 w-fit">
            ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน
          </p>
        </div>
        {children}
      </main>
    </div>
  )
}

export default Layout