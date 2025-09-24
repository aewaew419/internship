# 🚀 Implementation Plan สำหรับ PM Requirements

## 📊 สถานะปัจจุบัน
- **Backend Integration**: ✅ 100% (พร้อมใช้งาน)
- **Frontend Integration**: ✅ 91.7% (ไฟล์ถูกแก้ไขแล้ว)
- **Database**: ⚠️ ต้องตั้งค่าสำหรับ full functionality

## 🎯 PM Requirements Implementation

### 1. **Role System Enhancement** (Priority: HIGH)

#### 1.1 Backend Implementation
```go
// apps/backend/internal/models/enhanced_role.go
type Role struct {
    ID          string    `json:"id" gorm:"primaryKey"`
    Name        string    `json:"name" gorm:"not null"`
    NameTH      string    `json:"name_th"`
    Hierarchy   int       `json:"hierarchy"`
    Permissions []string  `json:"permissions" gorm:"type:json"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}

type UserRole struct {
    UserID     uint      `json:"user_id"`
    RoleID     string    `json:"role_id"`
    AssignedAt time.Time `json:"assigned_at"`
    AssignedBy uint      `json:"assigned_by"`
}

// Required roles from PM
var RequiredRoles = []Role{
    {
        ID: "super_admin",
        Name: "Super Admin", 
        NameTH: "ผู้ดูแลระบบสูงสุด",
        Hierarchy: 1,
        Permissions: []string{"*"},
    },
    {
        ID: "staff_admin",
        Name: "Administrative Staff",
        NameTH: "เจ้าหน้าที่ธุรการ", 
        Hierarchy: 2,
        Permissions: []string{
            "manage_students", "manage_documents", 
            "view_reports", "manage_courses",
        },
    },
    {
        ID: "course_instructor", 
        Name: "Course Instructor",
        NameTH: "อาจารย์ประจำวิชา",
        Hierarchy: 3,
        Permissions: []string{
            "manage_course", "evaluate_students", 
            "approve_internships", "view_student_progress",
        },
    },
    {
        ID: "committee_member",
        Name: "Committee Member", 
        NameTH: "กรรมการ",
        Hierarchy: 3,
        Permissions: []string{
            "review_evaluations", "approve_final_grades",
            "view_reports", "committee_decisions",
        },
    },
    {
        ID: "supervisor_instructor",
        Name: "Supervisor Instructor",
        NameTH: "อาจารย์นิเทศ", 
        Hierarchy: 4,
        Permissions: []string{
            "supervise_internships", "conduct_visits",
            "evaluate_companies", "mentor_students",
        },
    },
}
```

#### 1.2 API Endpoints
```go
// apps/backend/internal/handlers/role.go
func (h *RoleHandler) GetRoles(c *fiber.Ctx) error
func (h *RoleHandler) AssignRole(c *fiber.Ctx) error  
func (h *RoleHandler) RemoveRole(c *fiber.Ctx) error
func (h *RoleHandler) GetUserRoles(c *fiber.Ctx) error

// apps/backend/internal/routes/role_routes.go
func SetupRoleRoutes(api fiber.Router, db *gorm.DB) {
    roleHandler := handlers.NewRoleHandler(db)
    
    roles := api.Group("/roles")
    roles.Get("/", roleHandler.GetRoles)
    roles.Post("/assign", roleHandler.AssignRole)
    roles.Delete("/remove", roleHandler.RemoveRole)
    
    users := api.Group("/users")
    users.Get("/:id/roles", roleHandler.GetUserRoles)
}
```

#### 1.3 Frontend Implementation
```typescript
// apps/frontend/src/types/roles.ts
export interface Role {
  id: string;
  name: string;
  nameTH: string;
  hierarchy: number;
  permissions: string[];
}

export interface UserRole {
  userId: number;
  roleId: string;
  assignedAt: string;
  role: Role;
}

// apps/frontend/src/services/role.service.ts
export class RoleService {
  async getRoles(): Promise<Role[]> {
    const response = await apiClient.get('/roles');
    return response.data;
  }
  
  async assignRole(userId: number, roleId: string): Promise<void> {
    await apiClient.post('/roles/assign', { userId, roleId });
  }
  
  async getUserRoles(userId: number): Promise<UserRole[]> {
    const response = await apiClient.get(`/users/${userId}/roles`);
    return response.data;
  }
}
```

### 2. **Course Type System** (Priority: HIGH)

#### 2.1 Backend Models
```go
// apps/backend/internal/models/course_type.go
type CourseType struct {
    ID              string `json:"id" gorm:"primaryKey"`
    Name            string `json:"name" gorm:"not null"`
    NameTH          string `json:"name_th"`
    Code            string `json:"code" gorm:"unique"`
    HasProject      bool   `json:"has_project" gorm:"default:false"`
    ProjectRequired bool   `json:"project_required" gorm:"default:false"`
    DurationWeeks   int    `json:"duration_weeks" gorm:"default:8"`
    Description     string `json:"description"`
    CreatedAt       time.Time `json:"created_at"`
    UpdatedAt       time.Time `json:"updated_at"`
}

// Update existing Course model
type Course struct {
    // ... existing fields
    CourseTypeID string     `json:"course_type_id"`
    CourseType   CourseType `json:"course_type" gorm:"foreignKey:CourseTypeID"`
}

// Required course types from PM
var RequiredCourseTypes = []CourseType{
    {
        ID: "coop_education",
        Name: "Cooperative Education",
        NameTH: "สหกิจศึกษา",
        Code: "COOP",
        HasProject: true,
        ProjectRequired: true,
        DurationWeeks: 16,
        Description: "สหกิจศึกษาที่มีโปรเจคเป็นส่วนหนึ่งของการประเมิน",
    },
    {
        ID: "internship",
        Name: "Internship",
        NameTH: "ฝึกงาน", 
        Code: "INTERN",
        HasProject: false,
        ProjectRequired: false,
        DurationWeeks: 8,
        Description: "การฝึกงานทั่วไปไม่มีโปรเจคเฉพาะ",
    },
}
```

#### 2.2 Project Management (สำหรับสหกิจ)
```go
// apps/backend/internal/models/project.go
type Project struct {
    ID          uint   `json:"id" gorm:"primaryKey"`
    Title       string `json:"title" gorm:"not null"`
    TitleTH     string `json:"title_th"`
    Description string `json:"description"`
    StudentID   uint   `json:"student_id"`
    Student     Student `json:"student" gorm:"foreignKey:StudentID"`
    CompanyID   uint   `json:"company_id"`
    Company     Company `json:"company" gorm:"foreignKey:CompanyID"`
    Status      string `json:"status" gorm:"default:draft"` // draft, approved, in_progress, completed
    StartDate   time.Time `json:"start_date"`
    EndDate     time.Time `json:"end_date"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}
```

### 3. **Enhanced Authentication** (Priority: HIGH)

#### 3.1 Student ID Authentication
```go
// apps/backend/internal/services/enhanced_auth.go
type AuthService struct {
    db *gorm.DB
}

func (s *AuthService) StudentLogin(studentID, password string) (*User, error) {
    var user User
    err := s.db.Where("student_id = ?", studentID).First(&user).Error
    if err != nil {
        return nil, errors.New("รหัสนักศึกษาไม่ถูกต้อง")
    }
    
    if !s.verifyPassword(password, user.Password) {
        return nil, errors.New("รหัสผ่านไม่ถูกต้อง")
    }
    
    return &user, nil
}

func (s *AuthService) StaffLogin(email, password string) (*User, error) {
    var user User
    err := s.db.Where("email = ? AND role IN (?)", email, 
        []string{"staff", "instructor", "admin"}).First(&user).Error
    if err != nil {
        return nil, errors.New("อีเมลไม่ถูกต้อง")
    }
    
    if !s.verifyPassword(password, user.Password) {
        return nil, errors.New("รหัสผ่านไม่ถูกต้อง")
    }
    
    return &user, nil
}
```

#### 3.2 Frontend Login Enhancement
```typescript
// apps/frontend/src/components/auth/EnhancedLoginForm.tsx
export const EnhancedLoginForm: React.FC = () => {
  const [loginType, setLoginType] = useState<'student' | 'staff'>('student');
  const [credentials, setCredentials] = useState({
    studentId: '',
    email: '',
    password: ''
  });

  const handleLogin = async () => {
    if (loginType === 'student') {
      await authService.studentLogin(credentials.studentId, credentials.password);
    } else {
      await authService.staffLogin(credentials.email, credentials.password);
    }
  };

  return (
    <div className="space-y-6">
      {/* Login Type Toggle */}
      <div className="flex rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setLoginType('student')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            loginType === 'student' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          นักศึกษา
        </button>
        <button
          onClick={() => setLoginType('staff')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            loginType === 'staff' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          เจ้าหน้าที่/อาจารย์
        </button>
      </div>

      {/* Login Fields */}
      {loginType === 'student' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            รหัสนักศึกษา
          </label>
          <input
            type="text"
            value={credentials.studentId}
            onChange={(e) => setCredentials({...credentials, studentId: e.target.value})}
            placeholder="เช่น 12345678"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            อีเมล
          </label>
          <input
            type="email"
            value={credentials.email}
            onChange={(e) => setCredentials({...credentials, email: e.target.value})}
            placeholder="example@university.ac.th"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          รหัสผ่าน
        </label>
        <input
          type="password"
          value={credentials.password}
          onChange={(e) => setCredentials({...credentials, password: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        onClick={handleLogin}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
      >
        เข้าสู่ระบบ
      </button>
    </div>
  );
};
```

### 4. **Document Localization** (Priority: MEDIUM)

#### 4.1 Thai Language Support
```typescript
// apps/frontend/src/utils/thai-localization.ts
export class ThaiLocalization {
  static convertToThaiNumbers(text: string): string {
    const thaiNumbers = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
    return text.replace(/[0-9]/g, (digit) => thaiNumbers[parseInt(digit)]);
  }
  
  static formatThaiDate(date: Date): string {
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // Buddhist Era
    
    return `${day} ${month} ${year}`;
  }
  
  static formatThaiCurrency(amount: number): string {
    const formatter = new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    });
    return formatter.format(amount);
  }
}
```

#### 4.2 Document Template System
```go
// apps/backend/internal/models/document_template.go
type DocumentTemplate struct {
    ID          string `json:"id" gorm:"primaryKey"`
    Name        string `json:"name" gorm:"not null"`
    NameTH      string `json:"name_th"`
    Category    string `json:"category"`
    Language    string `json:"language" gorm:"default:th"` // th, en
    NumberFormat string `json:"number_format" gorm:"default:thai"` // thai, arabic
    Template    string `json:"template" gorm:"type:text"`
    Fields      []DocumentField `json:"fields" gorm:"type:json"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}

type DocumentField struct {
    Name         string            `json:"name"`
    Type         string            `json:"type"` // text, number, date, signature
    Required     bool              `json:"required"`
    Validation   string            `json:"validation,omitempty"`
    Localization map[string]string `json:"localization"`
}
```

## 📅 Implementation Timeline

### **Week 1: Core System Enhancement**
- [ ] **Day 1-2**: Role system implementation (Backend + Frontend)
- [ ] **Day 3-4**: Enhanced authentication (Student ID login)
- [ ] **Day 5**: Course type classification system

### **Week 2: Advanced Features**
- [ ] **Day 1-2**: Project management for สหกิจ
- [ ] **Day 3-4**: Basic Thai language support
- [ ] **Day 5**: Document template foundation

### **Week 3: Integration & Testing**
- [ ] **Day 1-2**: Integration testing for all new features
- [ ] **Day 3-4**: UI/UX refinement
- [ ] **Day 5**: Performance optimization

## 🧪 Updated Integration Tests

```javascript
// integration-test-pm-requirements.js
class PMRequirementsIntegrationTester {
  async testRoleSystem() {
    // Test multiple role assignment
    // Test permission-based access
    // Test role hierarchy
  }
  
  async testCourseTypes() {
    // Test สหกิจ vs ฝึกงาน classification
    // Test project requirement logic
    // Test duration differences
  }
  
  async testEnhancedAuth() {
    // Test student ID login
    // Test staff email login
    // Test dual authentication system
  }
  
  async testThaiLocalization() {
    // Test Thai number conversion
    // Test Thai date formatting
    // Test document generation
  }
}
```

## 🎯 Success Criteria

### **Role System** ✅
- [ ] Users can have multiple roles (กรรมการ + อาจารย์นิเทศ)
- [ ] Permission-based access control working
- [ ] Role hierarchy respected
- [ ] All 4 required roles implemented

### **Course Classification** ✅
- [ ] สหกิจ courses require projects
- [ ] ฝึกงาน courses don't require projects  
- [ ] Different evaluation criteria per type
- [ ] Duration differences handled

### **Authentication** ✅
- [ ] Students login with รหัสนักศึกษา
- [ ] Staff login with email
- [ ] Both systems work seamlessly
- [ ] Proper validation for both

### **Localization** ✅
- [ ] Thai language UI elements
- [ ] Thai number conversion in documents
- [ ] Proper Thai date formatting
- [ ] Bilingual document templates

---

**สรุป**: การ implement requirements เหล่านี้จะทำให้ระบบสมบูรณ์ตาม PM requirements และพร้อมใช้งานจริงในสถาบันการศึกษา โดยเฉพาะระบบ role ที่ซับซ้อนและการรองรับภาษาไทยอย่างเต็มรูปแบบ