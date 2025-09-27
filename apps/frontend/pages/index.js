import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import LoginForm from '../components/LoginForm'
import Dashboard from '../components/Dashboard'

export default function Home() {
  const [user, setUser] = useState(null)
  const [students, setStudents] = useState([])
  const [companies, setCompanies] = useState([])
  const [internships, setInternships] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const API_BASE = '/api'

  const handleLogin = async (loginData) => {
    setLoading(true)
    setError('')
    
    console.log('🔐 Attempting login with:', loginData)
    console.log('🌐 API URL:', `${API_BASE}/login`)

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      })

      console.log('📡 Response status:', response.status)
      const result = await response.json()
      console.log('📋 Response data:', result)

      if (result.success) {
        setUser(result.data.user)
        setIsLoggedIn(true)
        // Store user data in sessionStorage for other pages
        sessionStorage.setItem('user', JSON.stringify(result.data.user))
        
        // Redirect based on user role
        if (result.data.user.role === 'admin') {
          window.location.href = '/admin/dashboard'
          return
        }
        
        loadData()
        console.log('✅ Login successful')
      } else {
        setError(result.message)
        console.log('❌ Login failed:', result.message)
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + error.message)
      console.error('🚨 Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    try {
      const [studentsRes, companiesRes, internshipsRes] = await Promise.all([
        fetch(`${API_BASE}/students`),
        fetch(`${API_BASE}/companies`),
        fetch(`${API_BASE}/internships`)
      ])

      const [studentsData, companiesData, internshipsData] = await Promise.all([
        studentsRes.json(),
        companiesRes.json(),
        internshipsRes.json()
      ])

      if (studentsData.success) setStudents(studentsData.data || [])
      if (companiesData.success) setCompanies(companiesData.data || [])
      if (internshipsData.success) setInternships(internshipsData.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleLogout = () => {
    setUser(null)
    setIsLoggedIn(false)
    setStudents([])
    setCompanies([])
    setInternships([])
    // Clear user data from sessionStorage
    sessionStorage.removeItem('user')
  }

  useEffect(() => {
    // Test API connection
    fetch(`${API_BASE}/../health`)
      .then(response => response.json())
      .then(data => {
        console.log('API Health Check:', data)
      })
      .catch(error => {
        console.error('API connection failed:', error)
      })
  }, [])

  return (
    <>
      <Head>
        <title>ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน</title>
        <meta name="description" content="ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen" style={{ backgroundColor: '#f3f3f3' }}>
        {!isLoggedIn ? (
          <LoginForm 
            onLogin={handleLogin}
            error={error}
            loading={loading}
          />
        ) : (
          <Layout user={user} onLogout={handleLogout}>
            <Dashboard 
              user={user}
              students={students}
              companies={companies}
              internships={internships}
            />
          </Layout>
        )}
      </div>
    </>
  )
}