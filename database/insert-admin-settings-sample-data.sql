-- ข้อมูลตัวอย่างสำหรับระบบการตั้งค่าและ User Role Management
-- รันไฟล์นี้หลังจาก add-admin-settings-system.sql แล้ว

-- เพิ่มการตั้งค่าระบบ
INSERT INTO system_settings (category, setting_key, setting_name, setting_name_th, description, description_th, setting_value, default_value, data_type, input_type, group_name, sort_order) VALUES

-- การตั้งค่าทั่วไป
('general', 'app_name', 'Application Name', 'ชื่อแอปพลิเคชัน', 'Name of the application', 'ชื่อของแอปพลิเคชัน', 'ระบบสหกิจศึกษา', 'ระบบสหกิจศึกษา', 'string', 'text', 'ข้อมูลพื้นฐาน', 1),
('general', 'app_version', 'Application Version', 'เวอร์ชันแอปพลิเคชัน', 'Current version of the application', 'เวอร์ชันปัจจุบันของแอปพลิเคชัน', '1.0.0', '1.0.0', 'string', 'text', 'ข้อมูลพื้นฐาน', 2),
('general', 'university_name_th', 'University Name (Thai)', 'ชื่อมหาวิทยาลัย (ไทย)', 'Thai name of the university', 'ชื่อมหาวิทยาลัยภาษาไทย', 'มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี', 'มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี', 'string', 'text', 'ข้อมูลพื้นฐาน', 3),
('general', 'university_name_en', 'University Name (English)', 'ชื่อมหาวิทยาลัย (อังกฤษ)', 'English name of the university', 'ชื่อมหาวิทยาลัยภาษาอังกฤษ', 'King Mongkut''s University of Technology Thonburi', 'King Mongkut''s University of Technology Thonburi', 'string', 'text', 'ข้อมูลพื้นฐาน', 4),
('general', 'faculty_name_th', 'Faculty Name (Thai)', 'ชื่อคณะ (ไทย)', 'Thai name of the faculty', 'ชื่อคณะภาษาไทย', 'คณะเทคโนโลยีสารสนเทศ', 'คณะเทคโนโลยีสารสนเทศ', 'string', 'text', 'ข้อมูลพื้นฐาน', 5),
('general', 'faculty_name_en', 'Faculty Name (English)', 'ชื่อคณะ (อังกฤษ)', 'English name of the faculty', 'ชื่อคณะภาษาอังกฤษ', 'Faculty of Information Technology', 'Faculty of Information Technology', 'string', 'text', 'ข้อมูลพื้นฐาน', 6),

-- การตั้งค่าความปลอดภัย
('security', 'session_timeout', 'Session Timeout (minutes)', 'หมดเวลาเซสชัน (นาที)', 'Session timeout in minutes', 'เวลาหมดอายุของเซสชันเป็นนาที', '120', '120', 'number', 'number', 'ความปลอดภัย', 1),
('security', 'max_login_attempts', 'Max Login Attempts', 'จำนวนครั้งล็อกอินสูงสุด', 'Maximum login attempts before lockout', 'จำนวนครั้งสูงสุดในการล็อกอินก่อนถูกล็อค', '5', '5', 'number', 'number', 'ความปลอดภัย', 2),
('security', 'password_min_length', 'Minimum Password Length', 'ความยาวรหัสผ่านขั้นต่ำ', 'Minimum length for passwords', 'ความยาวขั้นต่ำของรหัสผ่าน', '8', '8', 'number', 'number', 'ความปลอดภัย', 3),
('security', 'require_password_complexity', 'Require Password Complexity', 'ต้องการรหัสผ่านที่ซับซ้อน', 'Require complex passwords', 'ต้องการรหัสผ่านที่มีความซับซ้อน', 'true', 'true', 'boolean', 'boolean', 'ความปลอดภัย', 4),

-- การตั้งค่าการแจ้งเตือน
('notification', 'email_enabled', 'Enable Email Notifications', 'เปิดใช้การแจ้งเตือนทางอีเมล', 'Enable email notifications', 'เปิดใช้งานการแจ้งเตือนทางอีเมล', 'true', 'true', 'boolean', 'boolean', 'การแจ้งเตือน', 1),
('notification', 'sms_enabled', 'Enable SMS Notifications', 'เปิดใช้การแจ้งเตือนทาง SMS', 'Enable SMS notifications', 'เปิดใช้งานการแจ้งเตือนทาง SMS', 'false', 'false', 'boolean', 'boolean', 'การแจ้งเตือน', 2),
('notification', 'default_language', 'Default Language', 'ภาษาเริ่มต้น', 'Default system language', 'ภาษาเริ่มต้นของระบบ', 'th', 'th', 'string', 'select', 'การแจ้งเตือน', 3),

-- การตั้งค่าการแสดงผล
('appearance', 'items_per_page', 'Items Per Page', 'จำนวนรายการต่อหน้า', 'Default number of items per page', 'จำนวนรายการเริ่มต้นต่อหน้า', '20', '20', 'number', 'select', 'การแสดงผล', 1),
('appearance', 'date_format', 'Date Format', 'รูปแบบวันที่', 'Default date format', 'รูปแบบวันที่เริ่มต้น', 'DD/MM/YYYY', 'DD/MM/YYYY', 'string', 'select', 'การแสดงผล', 2),
('appearance', 'time_format', 'Time Format', 'รูปแบบเวลา', 'Default time format', 'รูปแบบเวลาเริ่มต้น', '24h', '24h', 'string', 'select', 'การแสดงผล', 3);

-- อัพเดท allowed_values สำหรับ select options
UPDATE system_settings SET allowed_values = '["th", "en"]' WHERE setting_key = 'default_language';
UPDATE system_settings SET allowed_values = '[10, 20, 50, 100]' WHERE setting_key = 'items_per_page';
UPDATE system_settings SET allowed_values = '["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]' WHERE setting_key = 'date_format';
UPDATE system_settings SET allowed_values = '["12h", "24h"]' WHERE setting_key = 'time_format';

-- เพิ่มโมดูลระบบ
INSERT INTO system_modules (module_code, module_name, module_name_th, description, description_th, category, icon, route_path, sort_order, level) VALUES

-- โมดูลหลัก
('dashboard', 'Dashboard', 'แดชบอร์ด', 'Main dashboard with overview', 'แดชบอร์ดหลักพร้อมภาพรวม', 'core', 'dashboard', '/dashboard', 1, 0),
('users', 'User Management', 'จัดการผู้ใช้', 'Manage system users', 'จัดการผู้ใช้ระบบ', 'core', 'users', '/users', 2, 0),
('roles', 'Role Management', 'จัดการบทบาท', 'Manage user roles and permissions', 'จัดการบทบาทและสิทธิ์ผู้ใช้', 'core', 'shield', '/roles', 3, 0),
('settings', 'System Settings', 'การตั้งค่าระบบ', 'System configuration and settings', 'การกำหนดค่าและตั้งค่าระบบ', 'core', 'settings', '/settings', 4, 0),

-- โมดูลวิชาการ
('students', 'Student Management', 'จัดการนักศึกษา', 'Manage student information', 'จัดการข้อมูลนักศึกษา', 'academic', 'graduation-cap', '/students', 10, 0),
('companies', 'Company Management', 'จัดการบริษัท', 'Manage company information', 'จัดการข้อมูลบริษัท', 'academic', 'building', '/companies', 11, 0),
('internships', 'Internship Management', 'จัดการการฝึกงาน', 'Manage internship programs', 'จัดการโปรแกรมฝึกงาน', 'academic', 'briefcase', '/internships', 12, 0),
('projects', 'Project Management', 'จัดการโปรเจค', 'Manage student projects', 'จัดการโปรเจคนักศึกษา', 'academic', 'folder', '/projects', 13, 0),
('evaluations', 'Evaluation Management', 'จัดการการประเมิน', 'Manage evaluations and assessments', 'จัดการการประเมินและการวัดผล', 'academic', 'clipboard-check', '/evaluations', 14, 0),

-- โมดูลเอกสาร
('documents', 'Document Management', 'จัดการเอกสาร', 'Manage documents and files', 'จัดการเอกสารและไฟล์', 'document', 'file-text', '/documents', 20, 0),
('official_docs', 'Official Documents', 'เอกสารทางราชการ', 'Manage official documents', 'จัดการเอกสารทางราชการ', 'document', 'file-check', '/official-documents', 21, 0),
('templates', 'Document Templates', 'เทมเพลตเอกสาร', 'Manage document templates', 'จัดการเทมเพลตเอกสาร', 'document', 'file-plus', '/templates', 22, 0),

-- โมดูลรายงาน
('reports', 'Reports', 'รายงาน', 'Generate and view reports', 'สร้างและดูรายงาน', 'report', 'chart-bar', '/reports', 30, 0),
('analytics', 'Analytics', 'การวิเคราะห์', 'System analytics and insights', 'การวิเคราะห์และข้อมูลเชิงลึกของระบบ', 'report', 'chart-line', '/analytics', 31, 0),

-- โมดูลย่อย (ตัวอย่าง)
('user_profile', 'User Profile', 'โปรไฟล์ผู้ใช้', 'User profile management', 'จัดการโปรไฟล์ผู้ใช้', 'core', 'user', '/users/profile', 2, 1),
('user_permissions', 'User Permissions', 'สิทธิ์ผู้ใช้', 'Manage user permissions', 'จัดการสิทธิ์ผู้ใช้', 'core', 'key', '/users/permissions', 2, 1);

-- อัพเดท parent_module_id สำหรับโมดูลย่อย
UPDATE system_modules SET parent_module_id = (SELECT id FROM system_modules WHERE module_code = 'users') WHERE module_code IN ('user_profile', 'user_permissions');

-- เพิ่มการดำเนินการ (Actions)
INSERT INTO module_actions (module_id, action_code, action_name, action_name_th, description, icon, button_class, sort_order) VALUES

-- Actions สำหรับ Dashboard
((SELECT id FROM system_modules WHERE module_code = 'dashboard'), 'view', 'View Dashboard', 'ดูแดชบอร์ด', 'View dashboard content', 'eye', 'btn-primary', 1),

-- Actions สำหรับ User Management
((SELECT id FROM system_modules WHERE module_code = 'users'), 'view', 'View Users', 'ดูผู้ใช้', 'View user list', 'eye', 'btn-primary', 1),
((SELECT id FROM system_modules WHERE module_code = 'users'), 'create', 'Create User', 'สร้างผู้ใช้', 'Create new user', 'plus', 'btn-success', 2),
((SELECT id FROM system_modules WHERE module_code = 'users'), 'edit', 'Edit User', 'แก้ไขผู้ใช้', 'Edit user information', 'edit', 'btn-warning', 3),
((SELECT id FROM system_modules WHERE module_code = 'users'), 'delete', 'Delete User', 'ลบผู้ใช้', 'Delete user', 'trash', 'btn-danger', 4),
((SELECT id FROM system_modules WHERE module_code = 'users'), 'export', 'Export Users', 'ส่งออกผู้ใช้', 'Export user data', 'download', 'btn-info', 5),

-- Actions สำหรับ Role Management
((SELECT id FROM system_modules WHERE module_code = 'roles'), 'view', 'View Roles', 'ดูบทบาท', 'View role list', 'eye', 'btn-primary', 1),
((SELECT id FROM system_modules WHERE module_code = 'roles'), 'create', 'Create Role', 'สร้างบทบาท', 'Create new role', 'plus', 'btn-success', 2),
((SELECT id FROM system_modules WHERE module_code = 'roles'), 'edit', 'Edit Role', 'แก้ไขบทบาท', 'Edit role information', 'edit', 'btn-warning', 3),
((SELECT id FROM system_modules WHERE module_code = 'roles'), 'delete', 'Delete Role', 'ลบบทบาท', 'Delete role', 'trash', 'btn-danger', 4),
((SELECT id FROM system_modules WHERE module_code = 'roles'), 'manage_permissions', 'Manage Permissions', 'จัดการสิทธิ์', 'Manage role permissions', 'key', 'btn-info', 5),

-- Actions สำหรับ System Settings
((SELECT id FROM system_modules WHERE module_code = 'settings'), 'view', 'View Settings', 'ดูการตั้งค่า', 'View system settings', 'eye', 'btn-primary', 1),
((SELECT id FROM system_modules WHERE module_code = 'settings'), 'edit', 'Edit Settings', 'แก้ไขการตั้งค่า', 'Edit system settings', 'edit', 'btn-warning', 2),

-- Actions สำหรับ Student Management
((SELECT id FROM system_modules WHERE module_code = 'students'), 'view', 'View Students', 'ดูนักศึกษา', 'View student list', 'eye', 'btn-primary', 1),
((SELECT id FROM system_modules WHERE module_code = 'students'), 'create', 'Create Student', 'สร้างนักศึกษา', 'Create new student', 'plus', 'btn-success', 2),
((SELECT id FROM system_modules WHERE module_code = 'students'), 'edit', 'Edit Student', 'แก้ไขนักศึกษา', 'Edit student information', 'edit', 'btn-warning', 3),
((SELECT id FROM system_modules WHERE module_code = 'students'), 'delete', 'Delete Student', 'ลบนักศึกษา', 'Delete student', 'trash', 'btn-danger', 4),
((SELECT id FROM system_modules WHERE module_code = 'students'), 'export', 'Export Students', 'ส่งออกนักศึกษา', 'Export student data', 'download', 'btn-info', 5),

-- Actions สำหรับ Company Management
((SELECT id FROM system_modules WHERE module_code = 'companies'), 'view', 'View Companies', 'ดูบริษัท', 'View company list', 'eye', 'btn-primary', 1),
((SELECT id FROM system_modules WHERE module_code = 'companies'), 'create', 'Create Company', 'สร้างบริษัท', 'Create new company', 'plus', 'btn-success', 2),
((SELECT id FROM system_modules WHERE module_code = 'companies'), 'edit', 'Edit Company', 'แก้ไขบริษัท', 'Edit company information', 'edit', 'btn-warning', 3),
((SELECT id FROM system_modules WHERE module_code = 'companies'), 'delete', 'Delete Company', 'ลบบริษัท', 'Delete company', 'trash', 'btn-danger', 4),

-- Actions สำหรับ Document Management
((SELECT id FROM system_modules WHERE module_code = 'documents'), 'view', 'View Documents', 'ดูเอกสาร', 'View document list', 'eye', 'btn-primary', 1),
((SELECT id FROM system_modules WHERE module_code = 'documents'), 'create', 'Create Document', 'สร้างเอกสาร', 'Create new document', 'plus', 'btn-success', 2),
((SELECT id FROM system_modules WHERE module_code = 'documents'), 'edit', 'Edit Document', 'แก้ไขเอกสาร', 'Edit document', 'edit', 'btn-warning', 3),
((SELECT id FROM system_modules WHERE module_code = 'documents'), 'delete', 'Delete Document', 'ลบเอกสาร', 'Delete document', 'trash', 'btn-danger', 4),
((SELECT id FROM system_modules WHERE module_code = 'documents'), 'approve', 'Approve Document', 'อนุมัติเอกสาร', 'Approve document', 'check', 'btn-success', 5),
((SELECT id FROM system_modules WHERE module_code = 'documents'), 'download', 'Download Document', 'ดาวน์โหลดเอกสาร', 'Download document', 'download', 'btn-info', 6),

-- Actions สำหรับ Reports
((SELECT id FROM system_modules WHERE module_code = 'reports'), 'view', 'View Reports', 'ดูรายงาน', 'View reports', 'eye', 'btn-primary', 1),
((SELECT id FROM system_modules WHERE module_code = 'reports'), 'generate', 'Generate Report', 'สร้างรายงาน', 'Generate new report', 'plus', 'btn-success', 2),
((SELECT id FROM system_modules WHERE module_code = 'reports'), 'export', 'Export Report', 'ส่งออกรายงาน', 'Export report data', 'download', 'btn-info', 3);

-- เพิ่มสิทธิ์เริ่มต้นสำหรับแต่ละ Role

-- Admin: มีสิทธิ์ทุกอย่าง
INSERT INTO role_module_permissions (role_id, module_id, action_id, is_allowed, assigned_by)
SELECT 
    r.id as role_id,
    sm.id as module_id,
    ma.id as action_id,
    true as is_allowed,
    1 as assigned_by
FROM roles r
CROSS JOIN system_modules sm
CROSS JOIN module_actions ma
WHERE r.name = 'admin'
    AND sm.is_active = true
    AND ma.is_active = true;

-- Staff: สิทธิ์จำกัด
INSERT INTO role_module_permissions (role_id, module_id, action_id, is_allowed, assigned_by)
SELECT 
    r.id as role_id,
    sm.id as module_id,
    ma.id as action_id,
    CASE 
        WHEN sm.module_code IN ('dashboard', 'students', 'companies', 'internships', 'documents') 
             AND ma.action_code IN ('view', 'create', 'edit', 'export') THEN true
        WHEN sm.module_code = 'documents' AND ma.action_code = 'approve' THEN true
        ELSE false
    END as is_allowed,
    1 as assigned_by
FROM roles r
CROSS JOIN system_modules sm
CROSS JOIN module_actions ma
WHERE r.name = 'staff'
    AND sm.is_active = true
    AND ma.is_active = true;

-- Course Instructor: สิทธิ์เฉพาะด้านการเรียนการสอน
INSERT INTO role_module_permissions (role_id, module_id, action_id, is_allowed, assigned_by)
SELECT 
    r.id as role_id,
    sm.id as module_id,
    ma.id as action_id,
    CASE 
        WHEN sm.module_code IN ('dashboard', 'students', 'evaluations', 'documents', 'reports') 
             AND ma.action_code IN ('view', 'export') THEN true
        WHEN sm.module_code = 'evaluations' AND ma.action_code IN ('create', 'edit') THEN true
        WHEN sm.module_code = 'documents' AND ma.action_code = 'approve' THEN true
        ELSE false
    END as is_allowed,
    1 as assigned_by
FROM roles r
CROSS JOIN system_modules sm
CROSS JOIN module_actions ma
WHERE r.name = 'course_instructor'
    AND sm.is_active = true
    AND ma.is_active = true;

-- Supervisor: สิทธิ์นิเทศนักศึกษา
INSERT INTO role_module_permissions (role_id, module_id, action_id, is_allowed, assigned_by)
SELECT 
    r.id as role_id,
    sm.id as module_id,
    ma.id as action_id,
    CASE 
        WHEN sm.module_code IN ('dashboard', 'students', 'companies', 'internships', 'evaluations', 'documents', 'reports') 
             AND ma.action_code IN ('view', 'export') THEN true
        WHEN sm.module_code IN ('evaluations', 'documents') AND ma.action_code IN ('create', 'edit', 'approve') THEN true
        ELSE false
    END as is_allowed,
    1 as assigned_by
FROM roles r
CROSS JOIN system_modules sm
CROSS JOIN module_actions ma
WHERE r.name = 'supervisor'
    AND sm.is_active = true
    AND ma.is_active = true;

-- Committee: สิทธิ์กรรมการ
INSERT INTO role_module_permissions (role_id, module_id, action_id, is_allowed, assigned_by)
SELECT 
    r.id as role_id,
    sm.id as module_id,
    ma.id as action_id,
    CASE 
        WHEN sm.module_code IN ('dashboard', 'students', 'evaluations', 'documents', 'reports') 
             AND ma.action_code IN ('view', 'export') THEN true
        WHEN sm.module_code IN ('evaluations', 'documents') AND ma.action_code = 'approve' THEN true
        ELSE false
    END as is_allowed,
    1 as assigned_by
FROM roles r
CROSS JOIN system_modules sm
CROSS JOIN module_actions ma
WHERE r.name = 'committee'
    AND sm.is_active = true
    AND ma.is_active = true;

-- Student: สิทธิ์นักศึกษา
INSERT INTO role_module_permissions (role_id, module_id, action_id, is_allowed, assigned_by)
SELECT 
    r.id as role_id,
    sm.id as module_id,
    ma.id as action_id,
    CASE 
        WHEN sm.module_code = 'dashboard' AND ma.action_code = 'view' THEN true
        WHEN sm.module_code = 'documents' AND ma.action_code IN ('view', 'create', 'download') THEN true
        WHEN sm.module_code = 'projects' AND ma.action_code IN ('view', 'create', 'edit') THEN true
        ELSE false
    END as is_allowed,
    1 as assigned_by
FROM roles r
CROSS JOIN system_modules sm
CROSS JOIN module_actions ma
WHERE r.name = 'student'
    AND sm.is_active = true
    AND ma.is_active = true;

-- เพิ่มธีมเริ่มต้น
INSERT INTO theme_settings (theme_name, theme_display_name, theme_display_name_th, primary_color, secondary_color, accent_color, background_color, text_color, font_family, is_default, is_active) VALUES
('default', 'Default Theme', 'ธีมเริ่มต้น', '#3b82f6', '#64748b', '#10b981', '#ffffff', '#1f2937', 'Inter, sans-serif', true, true),
('dark', 'Dark Theme', 'ธีมมืด', '#3b82f6', '#64748b', '#10b981', '#1f2937', '#f9fafb', 'Inter, sans-serif', false, true),
('blue', 'Blue Theme', 'ธีมสีน้ำเงิน', '#1e40af', '#475569', '#059669', '#ffffff', '#1f2937', 'Inter, sans-serif', false, true),
('green', 'Green Theme', 'ธีมสีเขียว', '#059669', '#64748b', '#3b82f6', '#ffffff', '#1f2937', 'Inter, sans-serif', false, true);

-- เพิ่มการตั้งค่าผู้ใช้เริ่มต้น
INSERT INTO user_preferences (user_id, theme_id, language, timezone, date_format, time_format, email_notifications, items_per_page)
SELECT 
    u.id,
    (SELECT id FROM theme_settings WHERE is_default = true LIMIT 1),
    'th',
    'Asia/Bangkok',
    'DD/MM/YYYY',
    '24h',
    true,
    20
FROM users u
WHERE u.is_active = true;

-- สร้าง Views สำหรับการใช้งาน

-- View: Permission Matrix (Role x Module x Action)
CREATE OR REPLACE VIEW permission_matrix AS
SELECT 
    r.name as role_name,
    r.name_th as role_name_th,
    sm.module_code,
    sm.module_name,
    sm.module_name_th,
    ma.action_code,
    ma.action_name,
    ma.action_name_th,
    COALESCE(rmp.is_allowed, false) as is_allowed,
    sm.category as module_category,
    sm.sort_order as module_sort,
    ma.sort_order as action_sort
FROM roles r
CROSS JOIN system_modules sm
CROSS JOIN module_actions ma
LEFT JOIN role_module_permissions rmp ON (
    r.id = rmp.role_id 
    AND sm.id = rmp.module_id 
    AND ma.id = rmp.action_id
)
WHERE r.is_active = true
    AND sm.is_active = true
    AND ma.is_active = true
ORDER BY r.name, sm.sort_order, ma.sort_order;

-- View: User Permissions Summary
CREATE OR REPLACE VIEW user_permissions_summary AS
SELECT 
    u.id as user_id,
    u.email,
    CONCAT(u.first_name, ' ', u.last_name) as full_name,
    r.name as role_name,
    r.name_th as role_name_th,
    COUNT(rmp.id) as total_permissions,
    COUNT(CASE WHEN rmp.is_allowed THEN 1 END) as allowed_permissions,
    COUNT(CASE WHEN NOT rmp.is_allowed THEN 1 END) as denied_permissions
FROM users u
JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
JOIN roles r ON ur.role_id = r.id
LEFT JOIN role_module_permissions rmp ON r.id = rmp.role_id
WHERE u.is_active = true
GROUP BY u.id, u.email, u.first_name, u.last_name, r.name, r.name_th
ORDER BY u.email;

-- View: Module Access Summary
CREATE OR REPLACE VIEW module_access_summary AS
SELECT 
    sm.module_code,
    sm.module_name,
    sm.module_name_th,
    sm.category,
    COUNT(DISTINCT r.id) as total_roles,
    COUNT(DISTINCT CASE WHEN rmp.is_allowed THEN r.id END) as roles_with_access,
    COUNT(DISTINCT ma.id) as total_actions,
    COUNT(CASE WHEN rmp.is_allowed THEN 1 END) as allowed_actions
FROM system_modules sm
CROSS JOIN roles r
LEFT JOIN module_actions ma ON sm.id = ma.module_id AND ma.is_active = true
LEFT JOIN role_module_permissions rmp ON (
    r.id = rmp.role_id 
    AND sm.id = rmp.module_id 
    AND ma.id = rmp.action_id
)
WHERE sm.is_active = true
    AND r.is_active = true
GROUP BY sm.id, sm.module_code, sm.module_name, sm.module_name_th, sm.category
ORDER BY sm.sort_order;

-- ทดสอบ Functions
SELECT 'ทดสอบการตรวจสอบสิทธิ์' as title;

-- ทดสอบสิทธิ์ admin
SELECT check_user_module_permission(1, 'users', 'create') as admin_can_create_users;

-- ทดสอบสิทธิ์ student
SELECT check_user_module_permission(15, 'users', 'create') as student_can_create_users;

-- ทดสอบการดึงสิทธิ์ทั้งหมด
SELECT 'สิทธิ์ของ Admin' as title;
SELECT * FROM get_user_permissions(1) LIMIT 10;

-- ทดสอบการตั้งค่าระบบ
SELECT 'การตั้งค่าระบบ' as title;
SELECT get_system_setting('app_name') as app_name;
SELECT get_system_setting('session_timeout') as session_timeout;

-- แสดงสรุปข้อมูล
SELECT 'Permission Matrix (ตัวอย่าง 10 รายการแรก)' as title;
SELECT * FROM permission_matrix LIMIT 10;

SELECT 'User Permissions Summary' as title;
SELECT * FROM user_permissions_summary LIMIT 5;

SELECT 'Module Access Summary' as title;
SELECT * FROM module_access_summary;

COMMIT;