# Demo Data และ API Testing Guide

## 📋 Overview

ไฟล์นี้มีข้อมูลสำหรับการทดสอบระบบจัดการฝึกงานนักศึกษา รวมถึง demo data, API endpoints, และ test scenarios

## 🗄️ Demo Data Structure

### Users (30 คน)
- **Admin (3 คน)**: admin001@university.ac.th, admin002@university.ac.th, admin003@university.ac.th
- **Staff (2 คน)**: staff001@university.ac.th, staff002@university.ac.th  
- **Instructors (5 คน)**: instructor001@university.ac.th - instructor005@university.ac.th
- **Students (20 คน)**: u6800001@student.university.ac.th - u6800020@student.university.ac.th

### Academic Structure
- **2 Campus**: วิทยาเขตหลัก, วิทยาเขตสาขา
- **3 Faculties**: วิศวกรรมศาสตร์, วิทยาศาสตร์, บริหารธุรกิจ
- **5 Majors**: วิศวกรรมคอมพิวเตอร์, วิศวกรรมไฟฟ้า, วิทยาการคอมพิวเตอร์, เทคโนโลยีสารสนเทศ, การจัดการธุรกิจ

### Training Data
- **7 Training Records**: 5 approved, 2 pending
- **5 Companies**: บริษัท เทคโนโลยี จำกัด, บริษัท ดิจิทัล โซลูชั่น จำกัด, etc.
- **5 Visitors**: Company supervisors และ evaluators
- **10 Evaluations**: 5 visitor→student, 5 student→company

## 🚀 Quick Start

### 1. Setup Database และ Seed Data

```bash
# ใช้ Go seed script (แนะนำ)
cd apps/backend
make seed

# หรือใช้ SQL script โดยตรง
make seed-sql

# หรือ setup demo data ครบชุด
make demo-data
```

### 2. Test Login Credentials

```bash
# Admin
Email: admin001@university.ac.th
Password: password123

# Instructor  
Email: instructor001@university.ac.th
Password: password123

# Student
Email: u6800001@student.university.ac.th
Password: password123
```

### 3. Import Postman Collection

1. เปิด Postman
2. Import file: `Internship_Management_API.postman_collection.json`
3. Set environment variable:
   - `base_url`: http://localhost:8080
   - `token`: (จะได้จาก login response)

## 📊 API Testing Scenarios

### Authentication Flow
1. **Login** → Get JWT token
2. **Set token** ใน Authorization header
3. **Test protected endpoints**

### Student Management Flow
1. **List students** → ดูรายชื่อนักศึกษา
2. **Get student details** → ดูข้อมูลนักศึกษาเฉพาะ
3. **Create student** → เพิ่มนักศึกษาใหม่
4. **Search students** → ค้นหานักศึกษา

### Training Workflow
1. **Submit application** → นักศึกษาส่งใบสมัครฝึกงาน
2. **Review application** → อาจารย์ตรวจสอบ
3. **Approve/Reject** → อนุมัติหรือปฏิเสธ
4. **Track progress** → ติดตามความคืบหน้า

### Evaluation Process
1. **Visitor evaluates student** → พี่เลี้ยงประเมินนักศึกษา
2. **Student evaluates company** → นักศึกษาประเมินบริษัท
3. **View evaluation results** → ดูผลการประเมิน

## 🔍 Sample API Calls

### Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin001@university.ac.th",
    "password": "password123"
  }'
```

### Get Student Dashboard
```bash
curl -X GET http://localhost:8080/api/v1/dashboard/student/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Training Application
```bash
curl -X POST http://localhost:8080/api/v1/trainings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "student_id": 11,
    "company_name": "บริษัท ใหม่ จำกัด",
    "position": "Developer Intern",
    "start_date": "2024-11-01T00:00:00Z",
    "end_date": "2025-03-31T00:00:00Z",
    "supervisor": "คุณใหม่ ทดสอบ",
    "description": "ฝึกงานพัฒนาซอฟต์แวร์"
  }'
```

## 📈 Dashboard Data Examples

### Student Dashboard Response
```json
{
  "student_info": {
    "id": 1,
    "student_id": "u6800001",
    "name": "สมศรี001 ดีเด่น001",
    "major": "วิศวกรรมคอมพิวเตอร์",
    "year": 4,
    "semester": 1,
    "gpa": 3.75
  },
  "current_training": {
    "company_name": "บริษัท เทคโนโลยี จำกัด",
    "position": "Software Developer Intern",
    "status": "approved",
    "supervisor": "คุณสมชาย ใจดี"
  },
  "recent_activities": [...],
  "notifications": [...]
}
```

### Admin Dashboard Response
```json
{
  "overview_stats": {
    "total_students": 20,
    "active_trainings": 7,
    "total_companies": 5,
    "pending_approvals": 2
  },
  "chart_data": {
    "training_by_major": [...],
    "training_by_status": [...],
    "monthly_applications": [...]
  }
}
```

## 🧪 Test Scenarios

### Positive Test Cases
- ✅ Valid login with correct credentials
- ✅ Create student with valid data
- ✅ Submit training application successfully
- ✅ Approve training application
- ✅ Submit evaluations

### Negative Test Cases
- ❌ Login with invalid credentials
- ❌ Create student with duplicate student_id
- ❌ Access protected endpoint without token
- ❌ Submit invalid evaluation data

## 📁 File Structure

```
apps/backend/examples/
├── README.md                                    # This file
├── demo_data.json                              # Complete demo data reference
├── Internship_Management_API.postman_collection.json  # Postman collection
└── sample_responses/                           # Sample API responses
```

## 🛠️ Database Commands

```bash
# Reset database และ seed ใหม่
make db-reset
make seed

# ดู database schema
sqlite3 internship.db ".schema"

# ดูข้อมูลในตาราง
sqlite3 internship.db "SELECT * FROM users LIMIT 5;"
sqlite3 internship.db "SELECT * FROM students LIMIT 5;"
sqlite3 internship.db "SELECT * FROM student_trainings;"
```

## 🔧 Troubleshooting

### Database Issues
```bash
# ถ้า seed ไม่สำเร็จ
rm internship.db
make seed

# ถ้า foreign key constraint error
make db-reset
make seed
```

### API Issues
```bash
# ตรวจสอบ server running
curl http://localhost:8080/health

# ตรวจสอบ token validity
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/v1/profile
```

## 📞 Support

หากมีปัญหาในการใช้งาน demo data หรือ API testing:

1. ตรวจสอบ server logs
2. ตรวจสอบ database connection
3. ตรวจสอบ JWT token expiration
4. ตรวจสอบ API endpoint URLs

## 🎯 Next Steps

1. **Import Postman collection** และทดสอบ basic endpoints
2. **Login** ด้วย demo accounts
3. **Test dashboard APIs** สำหรับแต่ละ role
4. **Test CRUD operations** สำหรับ students และ trainings
5. **Test evaluation workflow** end-to-end
6. **Generate reports** และ analytics

Happy Testing! 🚀