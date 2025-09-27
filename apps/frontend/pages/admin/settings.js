import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { useRouter } from 'next/router'

export default function AdminSettings() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    systemName: 'ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน',
    allowRegistration: true,
    requireEmailVerification: false,
    maxFileSize: 10,
    allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png'],
    emailNotifications: true,
    smsNotifications: false,
    maintenanceMode: false
  })
  const [courses, setCourses] = useState([
    { id: 1, code: 'CS499', name: 'สหกิจศึกษา', credits: 6 },
    { id: 2, code: 'CS498', name: 'ฝึกงาน', credits: 3 }
  ])
  const [semesters, setSemesters] = useState([
    { id: 1, year: 2567, semester: 1, startDate: '2024-06-01', endDate: '2024-10-31' },
    { id: 2, year: 2567, semester: 2, startDate: '2024-11-01', endDate: '2025-03-31' }
  ])
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
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleLogout = () => {
    sessionStorage.removeItem('user')
    router.push('/')
  }

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveSettings = () => {
    // In real app, save to API
    alert('บันทึกการตั้งค่าเรียบร้อยแล้ว')
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

  const tabs = [
    { id: 'general', name: 'ทั่วไป', icon: '⚙️' },
    { id: 'courses', name: 'รายวิชา', icon: '📚' },
    { id: 'semesters', name: 'ภาคการศึกษา', icon: '📅' },
    { id: 'notifications', name: 'การแจ้งเตือน', icon: '🔔' },
    { id: 'security', name: 'ความปลอดภัย', icon: '🔒' }
  ]

  return (
    <>
      <Head>
        <title>ตั้งค่าระบบ - ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน</title>
        <meta name="description" content="ตั้งค่าระบบสำหรับผู้ดูแล" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen" style={{ backgroundColor: '#f3f3f3' }}>
        <Layout user={user} onLogout={handleLogout}>
          <div className="p-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h1 className="text-2xl font-bold gradient-text mb-6">ตั้งค่าระบบ</h1>

              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mb-6 border-b border-text-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-t-lg font-medium transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-secondary-100 text-secondary-800 border-b-2 border-secondary-600'
                        : 'text-text-600 hover:text-text-800 hover:bg-text-100'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="mt-6">
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-text-900">การตั้งค่าทั่วไป</h2>
                    
                    <div>
                      <label className="block text-sm font-medium text-text-700 mb-2">ชื่อระบบ</label>
                      <input
                        type="text"
                        value={settings.systemName}
                        onChange={(e) => handleSettingChange('systemName', e.target.value)}
                        className="w-full px-4 py-2 border border-text-300 rounded-lg focus:outline-none focus:border-secondary-600"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="allowRegistration"
                        checked={settings.allowRegistration}
                        onChange={(e) => handleSettingChange('allowRegistration', e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="allowRegistration" className="text-sm text-text-700">
                        อนุญาตให้ผู้ใช้สมัครสมาชิกเอง
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="requireEmailVerification"
                        checked={settings.requireEmailVerification}
                        onChange={(e) => handleSettingChange('requireEmailVerification', e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="requireEmailVerification" className="text-sm text-text-700">
                        ต้องยืนยันอีเมลก่อนใช้งาน
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-700 mb-2">
                        ขนาดไฟล์สูงสุด (MB)
                      </label>
                      <input
                        type="number"
                        value={settings.maxFileSize}
                        onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                        className="w-32 px-4 py-2 border border-text-300 rounded-lg focus:outline-none focus:border-secondary-600"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="maintenanceMode"
                        checked={settings.maintenanceMode}
                        onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="maintenanceMode" className="text-sm text-text-700">
                        โหมดปรับปรุงระบบ (ผู้ใช้ทั่วไปไม่สามารถเข้าใช้งานได้)
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === 'courses' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-text-900">จัดการรายวิชา</h2>
                      <button className="bg-gradient text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors duration-200">
                        + เพิ่มรายวิชา
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-text-200">
                            <th className="text-left py-3 px-4 text-text-800 font-semibold">รหัสวิชา</th>
                            <th className="text-left py-3 px-4 text-text-800 font-semibold">ชื่อวิชา</th>
                            <th className="text-left py-3 px-4 text-text-800 font-semibold">หน่วยกิต</th>
                            <th className="text-left py-3 px-4 text-text-800 font-semibold">การดำเนินการ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courses.map((course, index) => (
                            <tr key={course.id} className={`border-b border-text-200 ${index % 2 === 0 ? 'bg-bg-100' : 'bg-white'}`}>
                              <td className="py-3 px-4 text-text-700">{course.code}</td>
                              <td className="py-3 px-4 text-text-700">{course.name}</td>
                              <td className="py-3 px-4 text-text-700">{course.credits}</td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <button className="px-3 py-1 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors duration-200 text-sm">
                                    แก้ไข
                                  </button>
                                  <button className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm">
                                    ลบ
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'semesters' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-text-900">จัดการภาคการศึกษา</h2>
                      <button className="bg-gradient text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors duration-200">
                        + เพิ่มภาคการศึกษา
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-text-200">
                            <th className="text-left py-3 px-4 text-text-800 font-semibold">ปีการศึกษา</th>
                            <th className="text-left py-3 px-4 text-text-800 font-semibold">ภาคเรียน</th>
                            <th className="text-left py-3 px-4 text-text-800 font-semibold">วันที่เริ่ม</th>
                            <th className="text-left py-3 px-4 text-text-800 font-semibold">วันที่สิ้นสุด</th>
                            <th className="text-left py-3 px-4 text-text-800 font-semibold">การดำเนินการ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {semesters.map((semester, index) => (
                            <tr key={semester.id} className={`border-b border-text-200 ${index % 2 === 0 ? 'bg-bg-100' : 'bg-white'}`}>
                              <td className="py-3 px-4 text-text-700">{semester.year}</td>
                              <td className="py-3 px-4 text-text-700">{semester.semester}</td>
                              <td className="py-3 px-4 text-text-700">{new Date(semester.startDate).toLocaleDateString('th-TH')}</td>
                              <td className="py-3 px-4 text-text-700">{new Date(semester.endDate).toLocaleDateString('th-TH')}</td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <button className="px-3 py-1 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors duration-200 text-sm">
                                    แก้ไข
                                  </button>
                                  <button className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm">
                                    ลบ
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-text-900">การตั้งค่าการแจ้งเตือน</h2>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="emailNotifications"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="emailNotifications" className="text-sm text-text-700">
                        เปิดใช้งานการแจ้งเตือนทางอีเมล
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="smsNotifications"
                        checked={settings.smsNotifications}
                        onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="smsNotifications" className="text-sm text-text-700">
                        เปิดใช้งานการแจ้งเตือนทาง SMS
                      </label>
                    </div>

                    <div className="bg-secondary-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-secondary-800 mb-2">การแจ้งเตือนอัตโนมัติ</h3>
                      <ul className="text-sm text-text-700 space-y-1">
                        <li>• แจ้งเตือนเมื่อมีการยื่นขอฝึกงานใหม่</li>
                        <li>• แจ้งเตือนเมื่อมีการอนุมัติ/ปฏิเสธการฝึกงาน</li>
                        <li>• แจ้งเตือนก่อนครบกำหนดส่งเอกสาร</li>
                        <li>• แจ้งเตือนการเปลี่ยนแปลงสถานะการฝึกงาน</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-text-900">การตั้งค่าความปลอดภัย</h2>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h3 className="font-semibold text-yellow-800 mb-2">⚠️ การตั้งค่าความปลอดภัย</h3>
                      <p className="text-sm text-yellow-700">
                        การเปลี่ยนแปลงการตั้งค่าเหล่านี้อาจส่งผลต่อความปลอดภัยของระบบ กรุณาพิจารณาอย่างรอบคอบ
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-700 mb-2">
                        ความยาวรหัสผ่านขั้นต่ำ
                      </label>
                      <input
                        type="number"
                        defaultValue={8}
                        min={6}
                        max={20}
                        className="w-32 px-4 py-2 border border-text-300 rounded-lg focus:outline-none focus:border-secondary-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-700 mb-2">
                        จำนวนครั้งที่พยายาม Login ผิดก่อนล็อคบัญชี
                      </label>
                      <input
                        type="number"
                        defaultValue={5}
                        min={3}
                        max={10}
                        className="w-32 px-4 py-2 border border-text-300 rounded-lg focus:outline-none focus:border-secondary-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-700 mb-2">
                        ระยะเวลาล็อคบัญชี (นาที)
                      </label>
                      <input
                        type="number"
                        defaultValue={30}
                        min={5}
                        max={1440}
                        className="w-32 px-4 py-2 border border-text-300 rounded-lg focus:outline-none focus:border-secondary-600"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="requireStrongPassword"
                        defaultChecked={true}
                        className="rounded"
                      />
                      <label htmlFor="requireStrongPassword" className="text-sm text-text-700">
                        บังคับใช้รหัสผ่านที่แข็งแกร่ง (ต้องมีตัวพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ)
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="enableTwoFactor"
                        defaultChecked={false}
                        className="rounded"
                      />
                      <label htmlFor="enableTwoFactor" className="text-sm text-text-700">
                        เปิดใช้งานการยืนยันตัวตนแบบ 2 ขั้นตอน (2FA)
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-end mt-8 pt-6 border-t border-text-200">
                <button
                  onClick={handleSaveSettings}
                  className="bg-gradient text-white px-6 py-3 rounded-xl hover:opacity-90 transition-colors duration-200 font-medium"
                >
                  บันทึกการตั้งค่า
                </button>
              </div>
            </div>
          </div>
        </Layout>
      </div>
    </>
  )
}