# ระบบการตั้งค่าและ User Role Management สำหรับ Super Admin

## ภาพรวมระบบ

ระบบการตั้งค่าและ User Role Management ถูกออกแบบมาเพื่อให้ Super Admin สามารถจัดการสิทธิ์การเข้าถึงแบบ **Matrix (Role x Module x Action)** ได้อย่างละเอียดและยืดหยุ่น

## 🎯 **ฟีเจอร์หลัก**

### 🔧 **ระบบการตั้งค่า (System Settings)**
- การตั้งค่าระบบแบบหมวดหมู่
- รองรับประเภทข้อมูลต่างๆ (string, number, boolean, json)
- การตรวจสอบความถูกต้องของข้อมูล
- การตั้งค่าที่ต้องรีสตาร์ทระบบ

### 🛡️ **ระบบจัดการสิทธิ์แบบ Matrix**
- **Roles** (บทบาท): Admin, Staff, Course Instructor, Supervisor, Committee, Student
- **Modules** (โมดูล): Dashboard, Users, Students, Companies, Documents, Reports
- **Actions** (การดำเนินการ): View, Create, Edit, Delete, Approve, Export
- **Permission Matrix**: Role x Module x Action = Allow/Deny

### 🎨 **ระบบจัดการธีม**
- ธีมที่กำหนดไว้ล่วงหน้า (Default, Dark, Blue, Green)
- การปรับแต่งสี ฟอนต์ และ Layout
- CSS เพิ่มเติมสำหรับการปรับแต่ง

### 👤 **การตั้งค่าผู้ใช้**
- การตั้งค่าส่วนบุคคล (ธีม, ภาษา, เขตเวลา)
- การตั้งค่าการแจ้งเตือน
- การตั้งค่าการแสดงผล

## 🏗️ **โครงสร้างฐานข้อมูล**

### ตารางหลัก

#### `system_settings` - การตั้งค่าระบบ
```sql
- category: หมวดหมู่ (general, security, notification, appearance)
- setting_key: คีย์การตั้งค่า (unique)
- setting_name/setting_name_th: ชื่อการตั้งค่า
- setting_value: ค่าปัจจุบัน
- default_value: ค่าเริ่มต้น
- data_type: ประเภทข้อมูล (string, number, boolean, json)
- input_type: ประเภท input (text, select, boolean, textarea)
- validation_rules: กฎการตรวจสอบ (JSON)
- allowed_values: ค่าที่อนุญาต (JSON Array)
```

#### `system_modules` - โมดูลระบบ
```sql
- module_code: รหัสโมดูล (unique)
- module_name/module_name_th: ชื่อโมดูล
- parent_module_id: โมดูลแม่ (สำหรับโมดูลย่อย)
- category: หมวดหมู่ (core, academic, document, report)
- icon: ไอคอน
- route_path: เส้นทาง URL
- level: ระดับความลึก (0=หลัก, 1=ย่อย)
```

#### `module_actions` - การดำเนินการ
```sql
- module_id: รหัสโมดูล
- action_code: รหัสการดำเนินการ
- action_name/action_name_th: ชื่อการดำเนินการ
- icon: ไอคอน
- button_class: CSS class สำหรับปุ่ม
```

#### `role_module_permissions` - สิทธิ์แบบ Matrix
```sql
- role_id: รหัสบทบาท
- module_id: รหัสโมดูล
- action_id: รหัสการดำเนินการ
- is_allowed: อนุญาตหรือไม่ (boolean)
- conditions: เงื่อนไขพิเศษ (JSON)
- restrictions: ข้อจำกัด (JSON)
```

### ตารางเสริม

#### `permission_history` - ประวัติการเปลี่ยนแปลงสิทธิ์
#### `theme_settings` - การตั้งค่าธีม
#### `user_preferences` - การตั้งค่าผู้ใช้

## 🚀 **การติดตั้งและใช้งาน**

### ขั้นตอนที่ 1: สร้างระบบการตั้งค่า
```sql
\i database/add-admin-settings-system.sql
```

### ขั้นตอนที่ 2: เพิ่มข้อมูลตัวอย่าง
```sql
\i database/insert-admin-settings-sample-data.sql
```

## 📋 **โมดูลและการดำเนินการ**

### 🔧 **โมดูลหลัก (Core)**
- **Dashboard** - แดชบอร์ดหลัก
  - Actions: View
- **Users** - จัดการผู้ใช้
  - Actions: View, Create, Edit, Delete, Export
- **Roles** - จัดการบทบาท
  - Actions: View, Create, Edit, Delete, Manage Permissions
- **Settings** - การตั้งค่าระบบ
  - Actions: View, Edit

### 🎓 **โมดูลวิชาการ (Academic)**
- **Students** - จัดการนักศึกษา
  - Actions: View, Create, Edit, Delete, Export
- **Companies** - จัดการบริษัท
  - Actions: View, Create, Edit, Delete
- **Internships** - จัดการการฝึกงาน
  - Actions: View, Create, Edit, Delete
- **Projects** - จัดการโปรเจค
  - Actions: View, Create, Edit, Delete
- **Evaluations** - จัดการการประเมิน
  - Actions: View, Create, Edit, Approve

### 📄 **โมดูลเอกสาร (Document)**
- **Documents** - จัดการเอกสาร
  - Actions: View, Create, Edit, Delete, Approve, Download
- **Official Documents** - เอกสารทางราชการ
  - Actions: View, Create, Edit, Delete, Approve
- **Templates** - เทมเพลตเอกสาร
  - Actions: View, Create, Edit, Delete

### 📊 **โมดูลรายงาน (Report)**
- **Reports** - รายงาน
  - Actions: View, Generate, Export
- **Analytics** - การวิเคราะห์
  - Actions: View, Export

## 🔐 **การจัดการสิทธิ์แบบ Matrix**

### ตัวอย่าง Permission Matrix

| Role | Module | Action | Allowed |
|------|--------|--------|---------|
| Admin | Users | View | ✅ |
| Admin | Users | Create | ✅ |
| Admin | Users | Edit | ✅ |
| Admin | Users | Delete | ✅ |
| Staff | Users | View | ✅ |
| Staff | Users | Create | ✅ |
| Staff | Users | Edit | ✅ |
| Staff | Users | Delete | ❌ |
| Student | Users | View | ❌ |
| Student | Documents | View | ✅ |
| Student | Documents | Create | ✅ |
| Student | Documents | Delete | ❌ |

### การกำหนดสิทธิ์เริ่มต้น

#### **Admin** - สิทธิ์เต็ม
- ทุกโมดูล: ทุกการดำเนินการ ✅

#### **Staff** - เจ้าหน้าที่
- Dashboard, Students, Companies, Internships, Documents: View, Create, Edit, Export ✅
- Documents: Approve ✅
- Users, Settings: ❌

#### **Course Instructor** - อาจารย์ประจำวิชา
- Dashboard, Students, Evaluations, Documents, Reports: View, Export ✅
- Evaluations: Create, Edit ✅
- Documents: Approve ✅

#### **Supervisor** - อาจารย์นิเทศ
- Dashboard, Students, Companies, Internships, Evaluations, Documents, Reports: View, Export ✅
- Evaluations, Documents: Create, Edit, Approve ✅

#### **Committee** - กรรมการ
- Dashboard, Students, Evaluations, Documents, Reports: View, Export ✅
- Evaluations, Documents: Approve ✅

#### **Student** - นักศึกษา
- Dashboard: View ✅
- Documents: View, Create, Download ✅
- Projects: View, Create, Edit ✅

## 🛠️ **Functions สำหรับการจัดการ**

### ตรวจสอบสิทธิ์ผู้ใช้
```sql
SELECT check_user_module_permission(user_id, 'users', 'create');
-- ผลลัพธ์: true/false
```

### ดึงสิทธิ์ทั้งหมดของผู้ใช้
```sql
SELECT * FROM get_user_permissions(user_id);
-- ผลลัพธ์: รายการสิทธิ์ทั้งหมด
```

### กำหนดสิทธิ์ให้ Role
```sql
SELECT set_role_permission(role_id, 'users', 'create', true, admin_user_id);
-- ผลลัพธ์: true/false
```

### ดึงการตั้งค่าระบบ
```sql
SELECT get_system_setting('app_name');
-- ผลลัพธ์: ค่าการตั้งค่า
```

### อัพเดทการตั้งค่าระบบ
```sql
SELECT update_system_setting('app_name', 'ชื่อใหม่', admin_user_id);
-- ผลลัพธ์: true/false
```

## 📊 **Views สำหรับการใช้งาน**

### 1. Permission Matrix
```sql
SELECT * FROM permission_matrix 
WHERE role_name = 'admin' 
ORDER BY module_sort, action_sort;
```

### 2. User Permissions Summary
```sql
SELECT * FROM user_permissions_summary;
```

### 3. Module Access Summary
```sql
SELECT * FROM module_access_summary;
```

## 🎨 **การจัดการธีม**

### ธีมที่มีให้เลือก
- **Default** - ธีมเริ่มต้น (สีน้ำเงิน)
- **Dark** - ธีมมืด
- **Blue** - ธีมสีน้ำเงิน
- **Green** - ธีมสีเขียว

### การปรับแต่งธีม
```sql
-- เพิ่มธีมใหม่
INSERT INTO theme_settings (
    theme_name, theme_display_name, theme_display_name_th,
    primary_color, secondary_color, accent_color
) VALUES (
    'custom', 'Custom Theme', 'ธีมกำหนดเอง',
    '#ff6b6b', '#4ecdc4', '#45b7d1'
);

-- อัพเดทธีมของผู้ใช้
UPDATE user_preferences 
SET theme_id = (SELECT id FROM theme_settings WHERE theme_name = 'dark')
WHERE user_id = 1;
```

## ⚙️ **การตั้งค่าระบบ**

### หมวดหมู่การตั้งค่า

#### **General** - ทั่วไป
- `app_name` - ชื่อแอปพลิเคชัน
- `app_version` - เวอร์ชัน
- `university_name_th/en` - ชื่อมหาวิทยาลัย
- `faculty_name_th/en` - ชื่อคณะ

#### **Security** - ความปลอดภัย
- `session_timeout` - หมดเวลาเซสชัน (นาที)
- `max_login_attempts` - จำนวนครั้งล็อกอินสูงสุด
- `password_min_length` - ความยาวรหัสผ่านขั้นต่ำ
- `require_password_complexity` - ต้องการรหัสผ่านซับซ้อน

#### **Notification** - การแจ้งเตือน
- `email_enabled` - เปิดใช้อีเมล
- `sms_enabled` - เปิดใช้ SMS
- `default_language` - ภาษาเริ่มต้น

#### **Appearance** - การแสดงผล
- `items_per_page` - จำนวนรายการต่อหน้า
- `date_format` - รูปแบบวันที่
- `time_format` - รูปแบบเวลา

## 🔍 **ตัวอย่างการใช้งาน**

### ดู Permission Matrix สำหรับ Role เฉพาะ
```sql
SELECT 
    module_name_th,
    action_name_th,
    is_allowed
FROM permission_matrix 
WHERE role_name = 'staff'
    AND module_category = 'academic'
ORDER BY module_sort, action_sort;
```

### ดูผู้ใช้ที่มีสิทธิ์ในโมดูลเฉพาะ
```sql
SELECT DISTINCT
    u.email,
    CONCAT(u.first_name, ' ', u.last_name) as full_name,
    r.name_th as role_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
JOIN roles r ON ur.role_id = r.id
JOIN role_module_permissions rmp ON r.id = rmp.role_id
JOIN system_modules sm ON rmp.module_id = sm.id
JOIN module_actions ma ON rmp.action_id = ma.id
WHERE sm.module_code = 'users'
    AND ma.action_code = 'delete'
    AND rmp.is_allowed = true;
```

### ดูประวัติการเปลี่ยนแปลงสิทธิ์
```sql
SELECT 
    r.name_th as role_name,
    sm.module_name_th,
    ma.action_name_th,
    ph.change_type,
    CONCAT(u.first_name, ' ', u.last_name) as changed_by,
    ph.created_at
FROM permission_history ph
JOIN roles r ON ph.role_id = r.id
JOIN system_modules sm ON ph.module_id = sm.id
JOIN module_actions ma ON ph.action_id = ma.id
JOIN users u ON ph.changed_by = u.id
ORDER BY ph.created_at DESC
LIMIT 20;
```

## 🔧 **การบำรุงรักษา**

### ทำความสะอาดประวัติเก่า
```sql
-- ลบประวัติการเปลี่ยนแปลงสิทธิ์เก่ากว่า 1 ปี
DELETE FROM permission_history 
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year';
```

### อัพเดทสิทธิ์แบบกลุ่ม
```sql
-- ให้สิทธิ์ view ทุกโมดูลสำหรับ role เฉพาะ
UPDATE role_module_permissions 
SET is_allowed = true 
WHERE role_id = (SELECT id FROM roles WHERE name = 'staff')
    AND action_id IN (
        SELECT id FROM module_actions WHERE action_code = 'view'
    );
```

## 🎯 **การใช้งานใน UI**

### หน้า Role Management
- แสดง Permission Matrix แบบตาราง
- Checkbox สำหรับแต่ละ Role x Module x Action
- การค้นหาและกรองข้อมูล
- การบันทึกการเปลี่ยนแปลงแบบ batch

### หน้า System Settings
- จัดกลุ่มตามหมวดหมู่
- Input ตามประเภทข้อมูล
- การตรวจสอบความถูกต้อง
- การแสดงค่าเริ่มต้น

### หน้า Theme Management
- ตัวอย่างธีม (Preview)
- Color Picker สำหรับปรับสี
- การอัพโหลด CSS เพิ่มเติม
- การตั้งค่าเป็นธีมเริ่มต้น

ระบบการตั้งค่าและ User Role Management นี้ให้ความยืดหยุ่นสูงในการจัดการสิทธิ์และการตั้งค่าระบบ เหมาะสำหรับ Super Admin ในการควบคุมระบบอย่างละเอียด!