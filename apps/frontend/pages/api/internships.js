export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const response = await fetch('http://backend:8080/api/v1/internships')
    const data = await response.json()
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