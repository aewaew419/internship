import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { useRouter } from 'next/router'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalInternships: 0,
    pendingApprovals: 0,
    approvedInternships: 0,
    inProgressInternships: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const userData = sessionStorage.getItem('user')
      if (!userData) {
        router.push('/')
        return
      }
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== 'admin') {
        router.push('/')
        return
      }
      setUser(parsedUser)
    }

    const loadDashboardData = async () => {
      try {
        const [studentsRes, internshipsRes] = await Promise.all([
          fetch('/api/students'),
          fetch('/api/internships')
        ])

        const [studentsData, internshipsData] = await Promise.all([
          studentsRes.json(),
          internshipsRes.json()
        ])

        if (studentsData.success && internshipsData.success) {
          const students = studentsData.data || []
          const internships = internshipsData.data || []

          setStats({
            totalUsers: 35, // From demo users
            totalStudents: students.length,
            totalInternships: internships.length,
            pendingApprovals: internships.filter(i => i.status === 'pending').length,
            approvedInternships: internships.filter(i => i.status === 'approved').length,
            inProgressInternships: internships.filter(i => i.status === 'in_progress').length
          })

          // Mock recent activities
          setRecentActivities([
            { id: 1, action: 'นักศึกษา test001 ยื่นขอฝึกงาน', time: '2 ชั่วโมงที่แล้ว', type: 'request' },
            { id: 2, action: 'อนุมัติการฝึกงานของ u6800001', time: '5 ชั่วโมงที่แล้ว', type: 'approval' },
            { id: 3, action: 'เพิ่มบริษัทใหม่: Tech Innovation Ltd.', time: '1 วันที่แล้ว', type: 'company' },
            { id: 4, action: 'นักศึกษา u6800003 เสร็จสิ้นการฝึกงาน', time: '2 วันที่แล้ว', type: 'completion' }
          ])
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
    loadDashboardData()
  }, [router])

  const handleLogout = () => {
    sessionStorage.removeItem('user')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f3f3f3' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600 mx-auto mb-4"></div>
          <p className="text-text-700">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>แดชบอร์ดผู้ดูแลระบบ - ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน</title>
        <meta name="description" content="แดชบอร์ดสำหรับผู้ดูแลระบบ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen" style={{ backgroundColor: '#f3f3f3' }}>
        <Layout user={user} onLogout={handleLogout}>
          <div className="p-6">
            {/* Welcome Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h1 className="text-2xl font-bold gradient-text mb-2">แดชบอร์ดผู้ดูแลระบบ</h1>
              <p className="text-text-700">ยินดีต้อนรับ, {user?.first_name} {user?.last_name}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-600 mb-1">ผู้ใช้งานทั้งหมด</p>
                    <p className="text-3xl font-bold gradient-text">{stats.totalUsers}</p>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-600 mb-1">นักศึกษา</p>
                    <p className="text-3xl font-bold gradient-text">{stats.totalStudents}</p>
                  </div>
                  <div className="text-4xl">🎓</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-600 mb-1">การฝึกงานทั้งหมด</p>
                    <p className="text-3xl font-bold gradient-text">{stats.totalInternships}</p>
                  </div>
                  <div className="text-4xl">📋</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-600 mb-1">รอการอนุมัติ</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pendingApprovals}</p>
                  </div>
                  <div className="text-4xl">⏳</div>
                </div>
              </div>
            </div>

            {/* Charts and Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Internship Status Chart */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-text-900 mb-4">สถานะการฝึกงาน</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-success rounded-full"></div>
                      <span className="text-text-700">อนุมัติแล้ว</span>
                    </div>
                    <span className="font-semibold text-text-900">{stats.approvedInternships}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-secondary-600 rounded-full"></div>
                      <span className="text-text-700">กำลังฝึกงาน</span>
                    </div>
                    <span className="font-semibold text-text-900">{stats.inProgressInternships}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <span className="text-text-700">รอการอนุมัติ</span>
                    </div>
                    <span className="font-semibold text-text-900">{stats.pendingApprovals}</span>
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-text-900 mb-4">กิจกรรมล่าสุด</h3>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-bg-100 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'request' ? 'bg-blue-500' :
                        activity.type === 'approval' ? 'bg-success' :
                        activity.type === 'company' ? 'bg-secondary-600' :
                        'bg-purple-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-text-800">{activity.action}</p>
                        <p className="text-xs text-text-600">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-text-900 mb-4">การดำเนินการด่วน</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => router.push('/admin/users')}
                  className="p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors duration-200 text-left"
                >
                  <div className="text-2xl mb-2">👤</div>
                  <h4 className="font-semibold text-text-900">จัดการผู้ใช้</h4>
                  <p className="text-sm text-text-600">เพิ่ม แก้ไข ลบผู้ใช้งาน</p>
                </button>

                <button 
                  onClick={() => router.push('/admin/settings')}
                  className="p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors duration-200 text-left"
                >
                  <div className="text-2xl mb-2">⚙️</div>
                  <h4 className="font-semibold text-text-900">ตั้งค่าระบบ</h4>
                  <p className="text-sm text-text-600">กำหนดค่าต่างๆ ของระบบ</p>
                </button>

                <button 
                  onClick={() => router.push('/internships')}
                  className="p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors duration-200 text-left"
                >
                  <div className="text-2xl mb-2">📋</div>
                  <h4 className="font-semibold text-text-900">อนุมัติการฝึกงาน</h4>
                  <p className="text-sm text-text-600">ตรวจสอบและอนุมัติ</p>
                </button>

                <button 
                  onClick={() => router.push('/companies')}
                  className="p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors duration-200 text-left"
                >
                  <div className="text-2xl mb-2">🏢</div>
                  <h4 className="font-semibold text-text-900">จัดการบริษัท</h4>
                  <p className="text-sm text-text-600">เพิ่มและจัดการบริษัท</p>
                </button>
              </div>
            </div>
          </div>
        </Layout>
      </div>
    </>
  )
}