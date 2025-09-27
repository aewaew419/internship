import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import { useRouter } from 'next/router'

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in (simple check)
    const checkAuth = () => {
      // In a real app, you'd check for a token or session
      // For now, we'll redirect to home if no user data
      const userData = sessionStorage.getItem('user')
      if (!userData) {
        router.push('/')
        return
      }
      setUser(JSON.parse(userData))
    }

    const loadStudents = async () => {
      try {
        const response = await fetch('/api/students')
        const data = await response.json()
        if (data.success) {
          setStudents(data.data || [])
        }
      } catch (error) {
        console.error('Error loading students:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
    loadStudents()
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
        <title>รายชื่อนักศึกษา - ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน</title>
        <meta name="description" content="รายชื่อนักศึกษาในระบบ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen" style={{ backgroundColor: '#f3f3f3' }}>
        <Layout user={user} onLogout={handleLogout}>
          <div className="p-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold gradient-text mb-2">รายชื่อนักศึกษา</h1>
                <p className="text-text-700">จำนวนนักศึกษาทั้งหมด: {students.length} คน</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-text-200">
                      <th className="text-left py-4 px-4 text-text-800 font-semibold">รหัสนักศึกษา</th>
                      <th className="text-left py-4 px-4 text-text-800 font-semibold">ชื่อ-นามสกุล</th>
                      <th className="text-left py-4 px-4 text-text-800 font-semibold">สาขาวิชา</th>
                      <th className="text-left py-4 px-4 text-text-800 font-semibold">ชั้นปี</th>
                      <th className="text-left py-4 px-4 text-text-800 font-semibold">เกรดเฉลี่ย</th>
                      <th className="text-left py-4 px-4 text-text-800 font-semibold">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {students.map((student, index) => (
                      <tr key={student.id} className={`border-b border-text-200 ${index % 2 === 0 ? 'bg-bg-100' : 'bg-white'} hover:bg-secondary-50 transition-colors duration-200`}>
                        <td className="py-4 px-4 text-text-700 font-medium">{student.student_id}</td>
                        <td className="py-4 px-4 text-text-700">
                          {student.user?.first_name} {student.user?.last_name}
                        </td>
                        <td className="py-4 px-4 text-text-700">{student.major}</td>
                        <td className="py-4 px-4 text-text-700">{student.year}</td>
                        <td className="py-4 px-4 text-text-700">
                          <span className={`font-semibold ${student.gpa >= 3.5 ? 'text-success' : student.gpa >= 3.0 ? 'text-secondary-600' : 'text-error'}`}>
                            {student.gpa}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            student.status === 'active' 
                              ? 'bg-success text-white' 
                              : 'bg-text-300 text-text-700'
                          }`}>
                            {student.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {students.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-text-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-text-600">ไม่พบข้อมูลนักศึกษา</p>
                </div>
              )}
            </div>
          </div>
        </Layout>
      </div>
    </>
  )
}