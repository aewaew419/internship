import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import { useRouter } from 'next/router'

export default function Internships() {
  const [internships, setInternships] = useState([])
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
      setUser(JSON.parse(userData))
    }

    const loadInternships = async () => {
      try {
        const response = await fetch('/api/internships')
        const data = await response.json()
        if (data.success) {
          setInternships(data.data || [])
        }
      } catch (error) {
        console.error('Error loading internships:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
    loadInternships()
  }, [router])

  const handleLogout = () => {
    sessionStorage.removeItem('user')
    router.push('/')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-success text-white'
      case 'in_progress':
        return 'bg-secondary-600 text-white'
      case 'pending':
        return 'bg-yellow-500 text-white'
      case 'completed':
        return 'bg-blue-600 text-white'
      default:
        return 'bg-text-300 text-text-700'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'อนุมัติแล้ว'
      case 'in_progress':
        return 'กำลังฝึกงาน'
      case 'pending':
        return 'รอการอนุมัติ'
      case 'completed':
        return 'เสร็จสิ้น'
      default:
        return status
    }
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
        <title>การฝึกงาน - ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน</title>
        <meta name="description" content="รายการการฝึกงานทั้งหมด" />
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
                <h1 className="text-2xl font-bold gradient-text mb-2">การฝึกงาน</h1>
                <p className="text-text-700">จำนวนการฝึกงานทั้งหมด: {internships.length} โครงการ</p>
              </div>

              <div className="space-y-4">
                {internships.map((internship) => (
                  <div key={internship.id} className="bg-white border border-text-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-text-900 mb-1">{internship.position}</h3>
                            <p className="text-secondary-600 font-medium">{internship.company?.name}</p>
                            <p className="text-sm text-text-700">{internship.company?.name_th}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(internship.status)}`}>
                            {getStatusText(internship.status)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-text-600 mb-1">นักศึกษา</p>
                            <p className="text-text-800 font-medium">
                              {internship.student?.user?.first_name} {internship.student?.user?.last_name}
                            </p>
                            <p className="text-xs text-text-600">รหัส: {internship.student?.student_id}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-text-600 mb-1">ระยะเวลา</p>
                            <p className="text-text-800">
                              {new Date(internship.start_date).toLocaleDateString('th-TH')} - {new Date(internship.end_date).toLocaleDateString('th-TH')}
                            </p>
                          </div>
                        </div>

                        {internship.description && (
                          <div className="mb-4">
                            <p className="text-sm text-text-600 mb-1">รายละเอียด</p>
                            <p className="text-text-700 text-sm">{internship.description}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-text-500">
                          <span>สาขา: {internship.student?.major}</span>
                          <span>ชั้นปี: {internship.student?.year}</span>
                          <span>เกรดเฉลี่ย: {internship.student?.gpa}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {internships.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-text-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-text-600">ไม่พบข้อมูลการฝึกงาน</p>
                </div>
              )}
            </div>
          </div>
        </Layout>
      </div>
    </>
  )
}