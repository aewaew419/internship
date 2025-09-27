import { useState } from 'react'

const LoginForm = ({ onLogin, error, loading }) => {
  const [formData, setFormData] = useState({
    login_id: '', // Can be student_id or email
    password: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Determine login type and format request
    const loginId = formData.login_id.trim()
    let requestData
    
    if (loginId.includes('@')) {
      // Email login (admin/staff)
      requestData = {
        email: loginId,
        password: formData.password
      }
    } else {
      // Student ID login
      requestData = {
        student_id: loginId,
        password: formData.password
      }
    }
    
    onLogin(requestData)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <div className="w-96 bg-white rounded-2xl px-8 py-10 text-black shadow-xl border border-gray-300">
        <div className="my-3">
          <div className="w-fit mb-5 mx-auto">
            <img src="/logo.png" alt="Logo" className="h-20" />
          </div>
          <h1 className="text-xl mb-2 text-center font-semibold text-text-900">
            เข้าสู่ระบบ
          </h1>
          <p className="text-center text-text-800">
            ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน
          </p>
        </div>
        
        <div className="grid gap-3 my-4 mx-auto">
          {error && (
            <p className="-mb-3 text-end text-xs text-red-600">
              {error}
            </p>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="text"
                name="login_id"
                placeholder="รหัสนักศึกษา หรือ อีเมล"
                value={formData.login_id}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-text-300 rounded-lg text-text-900 placeholder-text-500 focus:outline-none focus:border-secondary-600 focus:ring-2 focus:ring-secondary-200 transition-all duration-200"
                required
              />
            </div>

            <div className="mb-6">
              <input
                type="password"
                name="password"
                placeholder="รหัสผ่าน"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-text-300 rounded-lg text-text-900 placeholder-text-500 focus:outline-none focus:border-secondary-600 focus:ring-2 focus:ring-secondary-200 transition-all duration-200"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-gradient text-white font-medium px-16 py-2 rounded w-full hover:opacity-90 transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>


        </div>
      </div>
    </div>
  )
}

export default LoginForm