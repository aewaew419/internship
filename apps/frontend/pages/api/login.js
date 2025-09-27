// Next.js API route to proxy login requests
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Check if this is a student login (has student_id field) or admin/staff login (has email field)
    const isStudentLogin = req.body.student_id !== undefined
    const isEmailLogin = req.body.email !== undefined
    
    let endpoint
    let requestBody = req.body

    if (isStudentLogin) {
      // Student login endpoint
      endpoint = 'http://backend:8080/api/v1/auth/student/login'
    } else if (isEmailLogin) {
      // Admin/Staff login endpoint
      endpoint = 'http://backend:8080/api/v1/login'
    } else {
      // Try to determine login type based on input format
      const loginField = req.body.username || req.body.login_id || ''
      
      // If it looks like an email, use admin/staff endpoint
      if (loginField.includes('@')) {
        endpoint = 'http://backend:8080/api/v1/login'
        requestBody = {
          email: loginField,
          password: req.body.password
        }
      } else {
        // Otherwise, assume it's a student ID
        endpoint = 'http://backend:8080/api/v1/auth/student/login'
        requestBody = {
          student_id: loginField,
          password: req.body.password
        }
      }
    }
    
    console.log('Login attempt:', { endpoint, body: { ...requestBody, password: '[HIDDEN]' } })
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()
    
    // Log response for debugging (without sensitive data)
    console.log('Login response:', { 
      status: response.status, 
      success: data.success, 
      message: data.message 
    })
    
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
      error: error.message 
    })
  }
}