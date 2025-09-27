import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { useRouter } from 'next/router'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState(new Set())
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

    const loadUsers = async () => {
      try {
        // Mock data - in real app, fetch from API
        const mockUsers = [
          { id: 1, student_id: 'admin2', email: 'admin2@smart-solutions.com', first_name: 'System', last_name: 'Administrator', role: 'admin', is_active: true },
          { id: 2, student_id: 'demo001', email: 'demo001@smart-solutions.com', first_name: 'Demo Admin', last_name: '001', role: 'admin', is_active: true },
          { id: 3, student_id: 'test001', email: 'test@test.com', first_name: 'Test', last_name: 'User', role: 'student', is_active: true },
          { id: 4, student_id: 'u6800001', email: 'u6800001@smart-solutions.com', first_name: 'Student', last_name: '001', role: 'student', is_active: true },
          { id: 5, student_id: 't6800001', email: 't6800001@smart-solutions.com', first_name: 'Instructor', last_name: '001', role: 'instructor', is_active: true },
        ]
        setUsers(mockUsers)
        setFilteredUsers(mockUsers)
      } catch (error) {
        console.error('Error loading users:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
    loadUsers()
  }, [router])

  useEffect(() => {
    let filtered = users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.student_id.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = roleFilter === '' || user.role === roleFilter
      
      return matchesSearch && matchesRole
    })
    setFilteredUsers(filtered)
  }, [searchTerm, roleFilter, users])

  const handleLogout = () => {
    sessionStorage.removeItem('user')
    router.push('/')
  }

  const toggleUserSelection = (userId) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const toggleAllUsers = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)))
    }
  }

  const getRoleText = (role) => {
    switch (role) {
      case 'admin': return 'ผู้ดูแลระบบ'
      case 'instructor': return 'อาจารย์'
      case 'student': return 'นักศึกษา'
      case 'staff': return 'เจ้าหน้าที่'
      case 'committee': return 'คณะกรรมการ'
      default: return role
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'instructor': return 'bg-blue-100 text-blue-800'
      case 'student': return 'bg-green-100 text-green-800'
      case 'staff': return 'bg-yellow-100 text-yellow-800'
      case 'committee': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
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
        <title>จัดการผู้ใช้งาน - ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน</title>
        <meta name="description" content="จัดการผู้ใช้งานในระบบ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen" style={{ backgroundColor: '#f3f3f3' }}>
        <Layout user={user} onLogout={handleLogout}>
          <div className="p-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold gradient-text mb-2">จัดการผู้ใช้งาน</h1>
                  <p className="text-text-700">จำนวนผู้ใช้งานทั้งหมด: {users.length} คน</p>
                </div>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="bg-gradient text-white font-medium px-6 py-3 rounded-xl hover:opacity-90 transition-colors duration-200"
                >
                  + เพิ่มผู้ใช้งาน
                </button>
              </div>

              {/* Search and Filter */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ, อีเมล, รหัส..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-text-300 rounded-lg focus:outline-none focus:border-secondary-600"
                  />
                </div>
                <div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-text-300 rounded-lg focus:outline-none focus:border-secondary-600"
                  >
                    <option value="">ทุกตำแหน่ง</option>
                    <option value="admin">ผู้ดูแลระบบ</option>
                    <option value="instructor">อาจารย์</option>
                    <option value="student">นักศึกษา</option>
                    <option value="staff">เจ้าหน้าที่</option>
                    <option value="committee">คณะกรรมการ</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setRoleFilter('')
                    }}
                    className="px-4 py-2 border border-text-300 rounded-lg hover:bg-text-100 transition-colors duration-200"
                  >
                    ล้างตัวกรอง
                  </button>
                  {selectedUsers.size > 0 && (
                    <button
                      onClick={() => {
                        if (confirm(`คุณต้องการลบผู้ใช้งาน ${selectedUsers.size} คนหรือไม่?`)) {
                          // Handle delete selected users
                          console.log('Delete users:', Array.from(selectedUsers))
                        }
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                    >
                      ลบ ({selectedUsers.size})
                    </button>
                  )}
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-text-200">
                      <th className="text-left py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                          onChange={toggleAllUsers}
                          className="rounded"
                        />
                      </th>
                      <th className="text-left py-4 px-4 text-text-800 font-semibold">รหัส</th>
                      <th className="text-left py-4 px-4 text-text-800 font-semibold">ชื่อ-นามสกุล</th>
                      <th className="text-left py-4 px-4 text-text-800 font-semibold">อีเมล</th>
                      <th className="text-left py-4 px-4 text-text-800 font-semibold">ตำแหน่ง</th>
                      <th className="text-left py-4 px-4 text-text-800 font-semibold">สถานะ</th>
                      <th className="text-left py-4 px-4 text-text-800 font-semibold">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr key={user.id} className={`border-b border-text-200 ${index % 2 === 0 ? 'bg-bg-100' : 'bg-white'} hover:bg-secondary-50 transition-colors duration-200`}>
                        <td className="py-4 px-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="py-4 px-4 text-text-700 font-medium">{user.student_id}</td>
                        <td className="py-4 px-4 text-text-700">{user.first_name} {user.last_name}</td>
                        <td className="py-4 px-4 text-text-700">{user.email}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            {getRoleText(user.role)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.is_active 
                              ? 'bg-success text-white' 
                              : 'bg-text-300 text-text-700'
                          }`}>
                            {user.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                // Handle edit user
                                console.log('Edit user:', user.id)
                              }}
                              className="px-3 py-1 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors duration-200 text-sm"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`คุณต้องการลบผู้ใช้งาน ${user.first_name} ${user.last_name} หรือไม่?`)) {
                                  // Handle delete user
                                  console.log('Delete user:', user.id)
                                }
                              }}
                              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm"
                            >
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-text-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-text-600">ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไขการค้นหา</p>
                </div>
              )}
            </div>
          </div>
        </Layout>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold gradient-text">เพิ่มผู้ใช้งานใหม่</h2>
              <button
                onClick={() => setShowAddUser(false)}
                className="text-text-600 hover:text-text-900"
              >
                ✕
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-700 mb-1">รหัสประจำตัว</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-text-300 rounded-lg focus:outline-none focus:border-secondary-600"
                  placeholder="เช่น u6800021"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-700 mb-1">ชื่อ</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-text-300 rounded-lg focus:outline-none focus:border-secondary-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-700 mb-1">นามสกุล</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-text-300 rounded-lg focus:outline-none focus:border-secondary-600"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-700 mb-1">อีเมล</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-text-300 rounded-lg focus:outline-none focus:border-secondary-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-700 mb-1">ตำแหน่ง</label>
                <select className="w-full px-3 py-2 border border-text-300 rounded-lg focus:outline-none focus:border-secondary-600">
                  <option value="">เลือกตำแหน่ง</option>
                  <option value="admin">ผู้ดูแลระบบ</option>
                  <option value="instructor">อาจารย์</option>
                  <option value="student">นักศึกษา</option>
                  <option value="staff">เจ้าหน้าที่</option>
                  <option value="committee">คณะกรรมการ</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-700 mb-1">รหัสผ่าน</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-text-300 rounded-lg focus:outline-none focus:border-secondary-600"
                  placeholder="รหัสผ่านเริ่มต้น"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 px-4 py-2 border border-text-300 rounded-lg hover:bg-text-100 transition-colors duration-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors duration-200"
                >
                  เพิ่มผู้ใช้งาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}