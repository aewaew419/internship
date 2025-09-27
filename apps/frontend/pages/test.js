import { useState } from 'react'

export default function Test() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/student/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: '6401001',
          password: 'password123'
        })
      })
      
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult('Error: ' + error.message)
    }
    setLoading(false)
  }

  const testHealth = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8080/health')
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult('Error: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <div className="space-x-4 mb-4">
        <button 
          onClick={testHealth}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Health
        </button>
        
        <button 
          onClick={testAPI}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Login
        </button>
      </div>
      
      {loading && <p>Loading...</p>}
      
      <pre className="bg-gray-100 p-4 rounded mt-4 overflow-auto">
        {result || 'Click a button to test API'}
      </pre>
    </div>
  )
}