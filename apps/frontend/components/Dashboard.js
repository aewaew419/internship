const Dashboard = ({ user, students, companies, internships }) => {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* User Info Card */}
        {user && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="bg-secondary-50 p-4 rounded-xl">
              <h3 className="font-bold text-secondary-800 mb-2">ข้อมูลผู้ใช้</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-text-800">
                <p><strong>ชื่อ:</strong> {user.first_name} {user.last_name}</p>
                <p><strong>รหัสนักศึกษา:</strong> {user.student_id}</p>
                <p><strong>อีเมล:</strong> {user.email}</p>
                <p><strong>บทบาท:</strong> {user.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-text-900 mb-2">นักศึกษา</h3>
            <p className="text-3xl font-bold gradient-text">{students?.length || 0}</p>
            <p className="text-text-600">คนทั้งหมด</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-text-900 mb-2">บริษัท</h3>
            <p className="text-3xl font-bold gradient-text">{companies?.length || 0}</p>
            <p className="text-text-600">บริษัทพาร์ทเนอร์</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-text-900 mb-2">การฝึกงาน</h3>
            <p className="text-3xl font-bold gradient-text">{internships?.length || 0}</p>
            <p className="text-text-600">โครงการทั้งหมด</p>
          </div>
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students Table */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-text-900 mb-4">รายชื่อนักศึกษา</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-text-200">
                    <th className="text-left py-3 text-text-800">รหัส</th>
                    <th className="text-left py-3 text-text-800">ชื่อ</th>
                    <th className="text-left py-3 text-text-800">สาขา</th>
                    <th className="text-left py-3 text-text-800">GPA</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {students?.map((student) => (
                    <tr key={student.id} className="border-b border-text-200">
                      <td className="py-3 text-text-700">{student.student_id}</td>
                      <td className="py-3 text-text-700">
                        {student.user?.first_name} {student.user?.last_name}
                      </td>
                      <td className="py-3 text-text-700">{student.major}</td>
                      <td className="py-3 text-text-700">{student.gpa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Internships List */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-text-900 mb-4">การฝึกงานล่าสุด</h3>
            <div className="space-y-4">
              {internships?.slice(0, 5).map((internship) => (
                <div key={internship.id} className="border-l-4 border-secondary-500 pl-4 py-2">
                  <h4 className="font-semibold text-text-900">{internship.position}</h4>
                  <p className="text-sm text-text-700">
                    {internship.company?.name} - <span className="text-secondary-600">{internship.status}</span>
                  </p>
                  <p className="text-xs text-text-600">
                    {internship.start_date} ถึง {internship.end_date}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Companies List */}
        <div className="mt-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-text-900 mb-4">บริษัทพาร์ทเนอร์</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies?.map((company) => (
                <div key={company.id} className="border border-text-200 rounded-xl p-4">
                  <h4 className="font-semibold text-text-900 mb-2">{company.name}</h4>
                  <p className="text-sm text-text-700 mb-1">{company.name_th}</p>
                  <p className="text-xs text-text-600">{company.industry}</p>
                  <p className="text-xs text-secondary-600 mt-2">{company.address}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard