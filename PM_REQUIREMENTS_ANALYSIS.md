# 📋 การวิเคราะห์ Requirements เพิ่มเติมจาก PM

## 🔍 ตารางความต้องการจาก PM

| ลำดับ | หัวข้อ | รายละเอียด | จำนวน | หมายเหตุ |
|-------|--------|------------|--------|----------|
| 1 | Role | super admin | เจ้าหน้าที่ธุรการ อาจารย์ประจำวิชา กรรมการ อาจารย์นิเทศ | 4 คน | กรรมการ สามารถเป็นอาจารย์นิเทศได้ |
| 2 | วิชา | สหกิจ ฝึกงาน | มีหัวข้อ โปรเจค ไม่มีหัวข้อ โปรเจค | | |
| 3 | login | user password | รหัสนักศึกษา | | |
| 4 | เอกสารทางราชการ | ภาษาไทย เลขไทย ภาษาอังกฤษ เลขอารบิก | | |

## 🎯 การวิเคราะห์และแปลงเป็น Technical Requirements

### 1. **Role Management System** 🔐

#### ปัจจุบันในระบบ:
```typescript
// Current roles in backend
roles: ["admin", "staff", "instructor", "student"]
```

#### Requirements ใหม่:
```typescript
// Enhanced role system needed
interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  hierarchy: number;
}

const requiredRoles = [
  {
    id: "super_admin",
    name: "Super Admin",
    permissions: ["*"], // All permissions
    hierarchy: 1
  },
  {
    id: "staff_admin", 
    name: "เจ้าหน้าที่ธุรการ",
    permissions: ["manage_students", "manage_documents", "view_reports"],
    hierarchy: 2
  },
  {
    id: "course_instructor",
    name: "อาจารย์ประจำวิชา", 
    permissions: ["manage_course", "evaluate_students", "approve_internships"],
    hierarchy: 3
  },
  {
    id: "committee_member",
    name: "กรรมการ",
    permissions: ["review_evaluations", "approve_final_grades"],
    hierarchy: 3
  },
  {
    id: "supervisor_instructor", 
    name: "อาจารย์นิเทศ",
    permissions: ["supervise_internships", "conduct_visits", "evaluate_companies"],
    hierarchy: 4
  }
];
```

#### การปรับปรุงที่ต้องทำ:
- [ ] เพิ่ม role hierarchy system
- [ ] สร้าง permission-based access control
- [ ] อนุญาตให้ user มีหลาย roles (กรรมการ + อาจารย์นิเทศ)
- [ ] สร้าง role assignment interface

### 2. **Course Type Management** 📚

#### Requirements:
```typescript
interface CourseType {
  id: string;
  name: string;
  code: string;
  hasProject: boolean;
  projectRequired: boolean;
  duration: number; // weeks
  evaluationCriteria: string[];
}

const courseTypes = [
  {
    id: "coop_education",
    name: "สหกิจศึกษา",
    code: "COOP",
    hasProject: true,
    projectRequired: true,
    duration: 16,
    evaluationCriteria: ["company_evaluation", "project_presentation", "report_submission"]
  },
  {
    id: "internship",
    name: "ฝึกงาน", 
    code: "INTERN",
    hasProject: false,
    projectRequired: false,
    duration: 8,
    evaluationCriteria: ["company_evaluation", "report_submission"]
  }
];
```

#### การปรับปรุงที่ต้องทำ:
- [ ] เพิ่ม course type classification
- [ ] สร้าง project management system สำหรับสหกิจ
- [ ] แยก evaluation criteria ตาม course type
- [ ] สร้าง project topic selection system

### 3. **Authentication Enhancement** 🔑

#### ปัจจุบัน:
```typescript
// Current login system
interface LoginCredentials {
  email: string;
  password: string;
}
```

#### Requirements ใหม่:
```typescript
interface StudentLoginCredentials {
  studentId: string; // รหัสนักศึกษา
  password: string;
}

interface StaffLoginCredentials {
  email: string;
  password: string;
}

// Multi-authentication system
interface AuthenticationMethod {
  userType: "student" | "staff" | "instructor";
  loginField: "studentId" | "email";
  validation: RegExp;
}
```

#### การปรับปรุงที่ต้องทำ:
- [ ] เพิ่ม student ID authentication
- [ ] สร้าง dual login system (email/studentId)
- [ ] ปรับปรุง login form ให้รองรับทั้งสองแบบ
- [ ] เพิ่ม validation สำหรับรหัสนักศึกษา

### 4. **Document Localization System** 📄

#### Requirements:
```typescript
interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  language: "th" | "en";
  numberFormat: "thai" | "arabic";
  template: string;
  fields: DocumentField[];
}

interface DocumentField {
  name: string;
  type: "text" | "number" | "date" | "signature";
  required: boolean;
  validation?: RegExp;
  localization: {
    th: string;
    en: string;
  };
}

const documentTypes = [
  {
    id: "internship_application_th",
    name: "ใบสมัครฝึกงาน",
    language: "th",
    numberFormat: "thai",
    fields: [
      {
        name: "student_name",
        type: "text",
        required: true,
        localization: {
          th: "ชื่อ-นามสกุล",
          en: "Full Name"
        }
      },
      {
        name: "student_id", 
        type: "text",
        required: true,
        validation: /^[0-9]{8}$/,
        localization: {
          th: "รหัสนักศึกษา",
          en: "Student ID"
        }
      }
    ]
  },
  {
    id: "internship_application_en",
    name: "Internship Application Form",
    language: "en", 
    numberFormat: "arabic",
    fields: [
      // Same fields but English interface
    ]
  }
];
```

#### การปรับปรุงที่ต้องทำ:
- [ ] สร้าง document template system
- [ ] เพิ่ม Thai/English language toggle
- [ ] สร้าง Thai number conversion system
- [ ] เพิ่ม localized date formatting
- [ ] สร้าง bilingual PDF generation

## 🚀 Implementation Plan

### Phase 1: Role System Enhancement (2 ชั่วโมง)
```bash
# Backend changes needed
1. Update User model with multiple roles
2. Create Role and Permission models  
3. Implement role-based middleware
4. Update authentication endpoints
```

### Phase 2: Course Type System (1.5 ชั่วโมง)
```bash
# Backend + Frontend changes
1. Create CourseType model
2. Update Course model with type relationship
3. Add project management features
4. Create course type selection UI
```

### Phase 3: Authentication Enhancement (1 ชั่วโมง)
```bash
# Frontend + Backend changes
1. Update login forms for dual authentication
2. Add student ID validation
3. Update authentication middleware
4. Test both login methods
```

### Phase 4: Document Localization (2 ชั่วโมง)
```bash
# Complex feature requiring
1. Document template engine
2. Thai/English language system
3. Number format conversion
4. Localized PDF generation
```

## 📊 Current System Compatibility

### ✅ **Already Compatible:**
- User management system (can be extended)
- Authentication framework (supports enhancement)
- Document management (can add templates)
- Role-based access (basic implementation exists)

### ⚠️ **Needs Enhancement:**
- Multiple role assignment per user
- Course type classification
- Student ID authentication
- Thai language support
- Number format localization

### ❌ **Missing Features:**
- Project management for สหกิจ
- Bilingual document templates
- Thai number conversion
- Advanced permission system

## 🎯 Priority Recommendations

### **High Priority** (ต้องทำก่อน)
1. **Role System Enhancement** - ระบบ permission ที่ซับซ้อน
2. **Student ID Authentication** - การ login ด้วยรหัสนักศึกษา
3. **Course Type Classification** - แยกสหกิจ/ฝึกงาน

### **Medium Priority** (ทำตาม)
4. **Project Management** - สำหรับสหกิจที่มีโปรเจค
5. **Basic Thai Language Support** - UI ภาษาไทย

### **Low Priority** (ทำทีหลัง)
6. **Advanced Document Localization** - เอกสารทางราชการแบบสมบูรณ์
7. **Thai Number Conversion** - เลขไทยในเอกสาร

## 🔧 Technical Implementation Notes

### Database Schema Changes Needed:
```sql
-- New tables required
CREATE TABLE roles (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  hierarchy INT NOT NULL,
  permissions JSON
);

CREATE TABLE user_roles (
  user_id INT,
  role_id VARCHAR(50),
  assigned_at TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE course_types (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  has_project BOOLEAN DEFAULT FALSE,
  duration_weeks INT DEFAULT 8
);

-- Modify existing tables
ALTER TABLE courses ADD COLUMN course_type_id VARCHAR(50);
ALTER TABLE users ADD COLUMN student_id VARCHAR(20) UNIQUE;
```

### API Endpoints to Add:
```typescript
// Role management
GET    /api/v1/roles
POST   /api/v1/users/:id/roles
DELETE /api/v1/users/:id/roles/:roleId

// Course types
GET    /api/v1/course-types
POST   /api/v1/course-types

// Enhanced authentication
POST   /api/v1/auth/student-login
POST   /api/v1/auth/staff-login

// Document templates
GET    /api/v1/document-templates
POST   /api/v1/documents/generate/:templateId
```

## 📋 Integration Test Updates Needed

ตาม requirements ใหม่ เราต้องปรับปรุง integration tests:

1. **Role-based access testing**
2. **Student ID authentication testing** 
3. **Course type functionality testing**
4. **Document generation testing**

---

**สรุป**: Requirements เหล่านี้เป็นการขยายระบบที่มีอยู่ให้ครอบคลุมมากขึ้น โดยเฉพาะระบบ role ที่ซับซ้อนและการรองรับภาษาไทย ซึ่งจะต้องใช้เวลาในการพัฒนาเพิ่มเติมประมาณ 6-7 ชั่วโมง