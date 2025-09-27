import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import { useRouter } from 'next/router'

export default function Companies() {
  const [companies, setCompanies] = useState([])
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

    const loadCompanies = async () => {
      try {
        const response = await fetch('/api/companies')
        const data = await response.json()
        if (data.success) {
          setCompanies(data.data || [])
        }
      } catch (error) {
        console.error('Error loading companies:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
    loadCompanies()
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
        <title>บริษัทพาร์ทเนอร์ - ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน</title>
        <meta name="description" content="รายชื่อบริษัทพาร์ทเนอร์" />
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
                <h1 className="text-2xl font-bold gradient-text mb-2">บริษัทพาร์ทเนอร์</h1>
                <p className="text-text-700">จำนวนบริษัทพาร์ทเนอร์: {companies.length} แห่ง</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map((company) => (
                  <div key={company.id} className="bg-white border border-text-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-text-900 mb-1">{company.name}</h3>
                      <p className="text-sm text-text-700 mb-2">{company.name_th}</p>
                      <span className="inline-block px-3 py-1 bg-secondary-100 text-secondary-800 rounded-full text-xs font-medium">
                        {company.industry}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      {company.address && (
                        <div className="flex items-start gap-2">
                          <span className="text-text-500 mt-0.5">📍</span>
                          <p className="text-text-700">{company.address}</p>
                        </div>
                      )}
                      
                      {company.phone && (
                        <div className="flex items-center gap-2">
                          <span className="text-text-500">📞</span>
                          <p className="text-text-700">{company.phone}</p>
                        </div>
                      )}
                      
                      {company.email && (
                        <div className="flex items-center gap-2">
                          <span className="text-text-500">✉️</span>
                          <p className="text-text-700">{company.email}</p>
                        </div>
                      )}
                      
                      {company.website && (
                        <div className="flex items-center gap-2">
                          <span className="text-text-500">🌐</span>
                          <a 
                            href={company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-secondary-600 hover:text-secondary-800 underline"
                          >
                            {company.website}
                          </a>
                        </div>
                      )}
                    </div>

                    {company.description && (
                      <div className="mt-4 pt-4 border-t border-text-200">
                        <p className="text-sm text-text-600">{company.description}</p>
                      </div>
                    )}

                    <div className="mt-4 flex justify-between items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        company.is_active 
                          ? 'bg-success text-white' 
                          : 'bg-text-300 text-text-700'
                      }`}>
                        {company.is_active ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {companies.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-text-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-text-600">ไม่พบข้อมูลบริษัท</p>
                </div>
              )}
            </div>
          </div>
        </Layout>
      </div>
    </>
  )
}