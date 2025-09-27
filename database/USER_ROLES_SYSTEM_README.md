# ระบบจัดการ User Roles สหกิจศึกษา (User Roles Management System)

## ภาพรวมระบบ

ระบบ User Roles ใหม่ถูกออกแบบมาเพื่อรองรับความต้องการที่ซับซ้อนของระบบสหกิจศึกษา โดยเฉพาะการที่บุคคลหนึ่งสามารถมีหลาย roles พร้อมกัน (ไม่เกิน 3 roles)

## 🎯 **User Roles ที่รองรับ**

### 1. **Admin** (ผู้ดูแลระบบ)
- สิทธิ์เต็มในการจัดการระบบทั้งหมด
- จัดการผู้ใช้, เอกสาร, รายงาน
- มอบหมาย roles ให้ผู้อื่น

### 2. **Staff** (เจ้าหน้าที่สหกิจศึกษา)
- จัดการข้อมูลนักศึกษาและบริษัท
- อนุมัติเอกสาร
- สร้างรายงาน

### 3. **Course Instructor** (อาจารย์ประจำวิชา)
- ดูข้อมูลนักศึกษา
- อนุมัติเอกสารการเรียน
- จัดการการประเมิน
- สอนวิชาสหกิจศึกษา

### 4. **Supervisor** (อาจารย์นิเทศ)
- นิเทศนักศึกษา
- อนุมัติเอกสารการฝึกงาน
- จัดการการประเมิน
- เยี่ยมสถานประกอบการ

### 5. **Committee** (กรรมการ)
- ประเมินผลการฝึกงาน
- อนุมัติเอกสารสำคัญ
- ตรวจสอบมาตรฐาน

### 6. **Student** (นักศึกษา)
- จัดการข้อมูลส่วนตัว
- อัพโหลดเอกสาร
- ส่งรายงาน

## 🏗️ **โครงสร้างฐานข้อมูล**

### ตารางหลัก

#### `roles` - ข้อมูล roles
```sql
- id: รหัส role
- name: ชื่อ role (ภาษาอังกฤษ)
- name_th: ชื่อ role (ภาษาไทย)
- description: คำอธิบาย
- permissions: สิทธิ์การเข้าถึง (JSON)
- is_active: สถานะใช้งาน
```

#### `user_roles` - การกำหนด roles ให้ users
```sql
- user_id: รหัสผู้ใช้
- role_id: รหัส role
- is_primary: role หลัก (true/false)
- assigned_by: ผู้มอบหมาย
- expires_at: วันหมดอายุ (ถ้ามี)
- is_active: สถานะใช้งาน
```

### ตารางเสริม

#### `student_supervisors` - การมอบหมายอาจารย์นิเทศ
```sql
- student_id: รหัสนักศึกษา
- supervisor_id: รหัสอาจารย์นิเทศ
- assignment_type: ประเภท (primary/secondary/backup)
```

#### `course_assignments` - การมอบหมายอาจารย์ประจำวิชา
```sql
- course_code: รหัสวิชา
- course_name: ชื่อวิชา
- instructor_id: รหัสอาจารย์
- semester: ภาคเรียน
- academic_year: ปีการศึกษา
```

#### `committee_assignments` - การมอบหมายกรรมการ
```sql
- committee_id: รหัสกรรมการ
- committee_type: ประเภท (evaluation/approval/review)
- scope: ขอบเขต (department/faculty/university)
```

## 🚀 **การติดตั้งและใช้งาน**

### ขั้นตอนที่ 1: อัพเดทระบบ roles
```sql
\i database/update-user-roles-system.sql
```

### ขั้นตอนที่ 2: เพิ่มข้อมูลตัวอย่าง
```sql
\i database/insert-user-roles-sample-data.sql
```

## 📋 **การใช้งาน Functions**

### 1. ดู roles ของผู้ใช้
```sql
SELECT * FROM get_user_roles(user_id);
```

### 2. ตรวจสอบสิทธิ์
```sql
SELECT check_user_permission(user_id, 'documents', 'approve');
```

### 3. มอบหมาย role ให้ผู้ใช้
```sql
SELECT assign_role_to_user(
    user_id, 
    'supervisor', 
    assigned_by_user_id, 
    is_primary, 
    expires_at
);
```

## 📊 **การใช้งาน Views**

### 1. ดูข้อมูลผู้ใช้พร้อม roles
```sql
SELECT * FROM user_with_roles;
```

### 2. ดูผู้ใช้ที่มีหลาย roles
```sql
SELECT * FROM multi_role_users;
```

### 3. ดูการมอบหมายอาจารย์นิเทศ
```sql
SELECT * FROM student_supervisor_assignments;
```

### 4. ดูการมอบหมายอาจารย์ประจำวิชา
```sql
SELECT * FROM course_instructor_assignments;
```

### 5. สรุปจำนวน roles
```sql
SELECT * FROM role_summary;
```

## 🔐 **ระบบ Permissions**

### โครงสร้าง JSON Permissions
```json
{
  "resource_name": ["action1", "action2", "action3"],
  "students": ["read", "write"],
  "documents": ["read", "write", "approve"],
  "evaluations": ["read", "write"],
  "reports": ["read", "write", "delete"]
}
```

### Resources และ Actions ที่รองรับ
- **system**: read, write, delete
- **users**: read, write, delete
- **students**: read, write
- **companies**: read, write
- **documents**: read, write, approve, delete
- **evaluations**: read, write
- **visits**: read, write
- **reports**: read, write, delete

## 🎭 **ตัวอย่างการใช้งาน Multiple Roles**

### อาจารย์ที่ทำหน้าที่หลายบทบาท

#### อาจารย์ A: Course Instructor + Supervisor
```sql
-- Primary role: อาจารย์ประจำวิชา
-- Secondary role: อาจารย์นิเทศ
SELECT assign_role_to_user(user_id, 'course_instructor', admin_id, true);
SELECT assign_role_to_user(user_id, 'supervisor', admin_id, false);
```

#### อาจารย์ B: Supervisor + Committee
```sql
-- Primary role: อาจารย์นิเทศ
-- Secondary role: กรรมการ
SELECT assign_role_to_user(user_id, 'supervisor', admin_id, true);
SELECT assign_role_to_user(user_id, 'committee', admin_id, false);
```

#### อาจารย์ C: Course Instructor + Committee
```sql
-- Primary role: อาจารย์ประจำวิชา
-- Secondary role: กรรมการ
SELECT assign_role_to_user(user_id, 'course_instructor', admin_id, true);
SELECT assign_role_to_user(user_id, 'committee', admin_id, false);
```

## 📈 **การติดตามและรายงาน**

### 1. ดูสถิติ roles
```sql
SELECT 
    r.name_th,
    COUNT(ur.user_id) as total_users,
    COUNT(CASE WHEN ur.is_primary THEN 1 END) as primary_users
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.is_active = true
GROUP BY r.id, r.name_th;
```

### 2. ดูผู้ใช้ที่มี role หมดอายุ
```sql
SELECT 
    u.first_name, u.last_name, u.email,
    r.name_th as role_name,
    ur.expires_at
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE ur.expires_at < CURRENT_TIMESTAMP + INTERVAL '30 days'
    AND ur.is_active = true;
```

### 3. ดูการมอบหมายงานที่ยังไม่มีผู้รับผิดชอบ
```sql
-- นักศึกษาที่ยังไม่มีอาจารย์นิเทศ
SELECT s.student_id, u.first_name, u.last_name
FROM students s
JOIN users u ON s.user_id = u.id
LEFT JOIN student_supervisors ss ON s.id = ss.student_id AND ss.is_active = true
WHERE ss.id IS NULL;
```

## 🔧 **การบำรุงรักษา**

### 1. ทำความสะอาด roles ที่หมดอายุ
```sql
UPDATE user_roles 
SET is_active = false 
WHERE expires_at < CURRENT_TIMESTAMP AND is_active = true;
```

### 2. อัพเดท permissions
```sql
UPDATE roles 
SET permissions = '{"new": "permissions"}'
WHERE name = 'role_name';
```

### 3. ตรวจสอบความถูกต้องของข้อมูล
```sql
-- ตรวจสอบว่าทุกคนมี primary role
SELECT u.email, COUNT(ur.id) as role_count
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id 
    AND ur.is_primary = true AND ur.is_active = true
GROUP BY u.id, u.email
HAVING COUNT(ur.id) = 0;
```

## ⚠️ **ข้อจำกัดและกฎเกณฑ์**

1. **จำนวน Roles สูงสุด**: ผู้ใช้หนึ่งคนมีได้ไม่เกิน 3 roles
2. **Primary Role**: ผู้ใช้ต้องมี primary role เพียง 1 role
3. **Role Expiration**: Role อาจมีวันหมดอายุได้
4. **Permission Inheritance**: สิทธิ์จะรวมกันจากทุก roles ที่มี

## 🔍 **การแก้ไขปัญหา**

### ปัญหา: ผู้ใช้ไม่มี primary role
```sql
-- แก้ไขโดยกำหนด role แรกเป็น primary
UPDATE user_roles 
SET is_primary = true 
WHERE user_id = ? AND id = (
    SELECT MIN(id) FROM user_roles WHERE user_id = ? AND is_active = true
);
```

### ปัญหา: มี primary role มากกว่า 1
```sql
-- แก้ไขโดยเก็บเฉพาะ role ล่าสุด
UPDATE user_roles 
SET is_primary = false 
WHERE user_id = ? AND is_primary = true AND id != (
    SELECT MAX(id) FROM user_roles WHERE user_id = ? AND is_primary = true
);
```

## 📚 **ตัวอย่างการใช้งานจริง**

### Scenario 1: อาจารย์ใหม่เข้าทำงาน
```sql
-- 1. สร้าง user
INSERT INTO users (email, first_name, last_name, department, position) 
VALUES ('new.teacher@university.ac.th', 'ใหม่', 'อาจารย์', 'วิทยาการคอมพิวเตอร์', 'อาจารย์');

-- 2. กำหนด role
SELECT assign_role_to_user(
    (SELECT id FROM users WHERE email = 'new.teacher@university.ac.th'),
    'course_instructor',
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    true
);
```

### Scenario 2: มอบหมายอาจารย์นิเทศให้นักศึกษา
```sql
INSERT INTO student_supervisors (student_id, supervisor_id, assignment_type, assigned_by)
VALUES (
    (SELECT id FROM students WHERE student_id = '6501001'),
    (SELECT id FROM users WHERE email = 'supervisor@university.ac.th'),
    'primary',
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);
```

ระบบ User Roles ใหม่นี้ให้ความยืดหยุ่นและครอบคลุมความต้องการของระบบสหกิจศึกษาอย่างสมบูรณ์!