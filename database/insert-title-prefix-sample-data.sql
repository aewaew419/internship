-- ข้อมูลตัวอย่างสำหรับระบบจัดการคำนำหน้าชื่อ
-- รันไฟล์นี้หลังจาก add-title-prefix-system.sql แล้ว

-- เพิ่มคำนำหน้าชื่อทั่วไป
INSERT INTO title_prefixes (prefix_code, prefix_th, prefix_en, category, gender, description, is_active, sort_order, created_by) VALUES

-- คำนำหน้าทั่วไป
('MR', 'นาย', 'Mr.', 'general', 'male', 'คำนำหน้าชื่อสำหรับผู้ชาย', true, 1, 1),
('MRS', 'นาง', 'Mrs.', 'general', 'female', 'คำนำหน้าชื่อสำหรับผู้หญิงที่แต่งงานแล้ว', true, 2, 1),
('MISS', 'นางสาว', 'Miss', 'general', 'female', 'คำนำหน้าชื่อสำหรับผู้หญิงที่ยังไม่แต่งงาน', true, 3, 1),
('MS', 'นางสาว', 'Ms.', 'general', 'female', 'คำนำหน้าชื่อสำหรับผู้หญิง (ไม่ระบุสถานภาพ)', true, 4, 1),

-- คำนำหน้าทางวิชาการ
('DR', 'ดร.', 'Dr.', 'academic', 'unisex', 'ดุษฎีบัณฑิต', true, 10, 1),
('PROF', 'ศ.', 'Prof.', 'academic', 'unisex', 'ศาสตราจารย์', true, 11, 1),
('ASSOC_PROF', 'รศ.', 'Assoc. Prof.', 'academic', 'unisex', 'รองศาสตราจารย์', true, 12, 1),
('ASST_PROF', 'ผศ.', 'Asst. Prof.', 'academic', 'unisex', 'ผู้ช่วยศาสตราจารย์', true, 13, 1),
('PROF_DR', 'ศ.ดร.', 'Prof. Dr.', 'academic', 'unisex', 'ศาสตราจารย์ ดร.', true, 14, 1),
('ASSOC_PROF_DR', 'รศ.ดร.', 'Assoc. Prof. Dr.', 'academic', 'unisex', 'รองศาสตราจารย์ ดร.', true, 15, 1),
('ASST_PROF_DR', 'ผศ.ดร.', 'Asst. Prof. Dr.', 'academic', 'unisex', 'ผู้ช่วยศาสตราจารย์ ดร.', true, 16, 1),

-- คำนำหน้าทางทหาร
('2LT', 'ว่าที่ ร.ต.', '2nd Lt.', 'military', 'unisex', 'ว่าที่ร้อยตรี', true, 20, 1),
('LT', 'ร.ต.', 'Lt.', 'military', 'unisex', 'ร้อยตรี', true, 21, 1),
('CAPT', 'ร.ท.', 'Capt.', 'military', 'unisex', 'ร้อยโท', true, 22, 1),
('MAJ', 'ร.ต.', 'Maj.', 'military', 'unisex', 'ร้อยเอก', true, 23, 1),
('LT_COL', 'พ.ท.', 'Lt. Col.', 'military', 'unisex', 'พันโท', true, 24, 1),
('COL', 'พ.อ.', 'Col.', 'military', 'unisex', 'พันเอก', true, 25, 1),

-- คำนำหน้าทางตำรวจ
('POL_LT', 'ร.ต.ต.', 'Pol. Lt.', 'military', 'unisex', 'ร้อยตำรวจตรี', true, 30, 1),
('POL_CAPT', 'ร.ต.ท.', 'Pol. Capt.', 'military', 'unisex', 'ร้อยตำรวจโท', true, 31, 1),
('POL_MAJ', 'ร.ต.ต.', 'Pol. Maj.', 'military', 'unisex', 'ร้อยตำรวจเอก', true, 32, 1),

-- คำนำหน้าพิเศษ
('CANDIDATE', 'ว่าที่', 'Candidate', 'military', 'unisex', 'ว่าที่ (สำหรับนักศึกษาทหาร)', true, 40, 1),
('CADET', 'นร.', 'Cadet', 'military', 'unisex', 'นักเรียนนายร้อย', true, 41, 1);

-- เพิ่มการตั้งค่าคำนำหน้าชื่อ
INSERT INTO title_prefix_settings (setting_key, setting_name, setting_name_th, setting_value, default_value, data_type, input_type, category, group_name, sort_order, description) VALUES

-- การตั้งค่าทั่วไป
('require_title_prefix', 'Require Title Prefix', 'บังคับใช้คำนำหน้าชื่อ', 'false', 'false', 'boolean', 'boolean', 'general', 'การตั้งค่าทั่วไป', 1, 'บังคับให้ผู้ใช้ต้องเลือกคำนำหน้าชื่อ'),
('default_prefix_for_new_users', 'Default Prefix for New Users', 'คำนำหน้าเริ่มต้นสำหรับผู้ใช้ใหม่', '', '', 'string', 'select', 'general', 'การตั้งค่าทั่วไป', 2, 'คำนำหน้าชื่อเริ่มต้นสำหรับผู้ใช้ใหม่'),
('allow_custom_prefix', 'Allow Custom Prefix', 'อนุญาตคำนำหน้าชื่อกำหนดเอง', 'false', 'false', 'boolean', 'boolean', 'general', 'การตั้งค่าทั่วไป', 3, 'อนุญาตให้ผู้ใช้กำหนดคำนำหน้าชื่อเอง'),

-- การตั้งค่าการแสดงผล
('show_prefix_in_list', 'Show Prefix in User List', 'แสดงคำนำหน้าในรายชื่อผู้ใช้', 'true', 'true', 'boolean', 'boolean', 'display', 'การแสดงผล', 1, 'แสดงคำนำหน้าชื่อในรายชื่อผู้ใช้'),
('prefix_display_format', 'Prefix Display Format', 'รูปแบบการแสดงคำนำหน้า', 'full', 'full', 'string', 'select', 'display', 'การแสดงผล', 2, 'รูปแบบการแสดงคำนำหน้าชื่อ'),
('default_language_for_prefix', 'Default Language for Prefix', 'ภาษาเริ่มต้นสำหรับคำนำหน้า', 'th', 'th', 'string', 'select', 'display', 'การแสดงผล', 3, 'ภาษาเริ่มต้นในการแสดงคำนำหน้าชื่อ'),

-- การตั้งค่าสิทธิ์
('auto_assign_prefix_by_role', 'Auto Assign Prefix by Role', 'กำหนดคำนำหน้าอัตโนมัติตาม Role', 'false', 'false', 'boolean', 'boolean', 'permission', 'การจัดการสิทธิ์', 1, 'กำหนดคำนำหน้าชื่ออัตโนมัติตามบทบาทของผู้ใช้'),
('allow_prefix_change', 'Allow Prefix Change', 'อนุญาตเปลี่ยนคำนำหน้าชื่อ', 'true', 'true', 'boolean', 'boolean', 'permission', 'การจัดการสิทธิ์', 2, 'อนุญาตให้ผู้ใช้เปลี่ยนคำนำหน้าชื่อได้'),
('require_approval_for_change', 'Require Approval for Change', 'ต้องอนุมัติการเปลี่ยนแปลง', 'false', 'false', 'boolean', 'boolean', 'permission', 'การจัดการสิทธิ์', 3, 'ต้องได้รับอนุมัติก่อนเปลี่ยนคำนำหน้าชื่อ');

-- อัพเดท allowed_values สำหรับ select options
UPDATE title_prefix_settings SET allowed_values = '["full", "short", "code"]' WHERE setting_key = 'prefix_display_format';
UPDATE title_prefix_settings SET allowed_values = '["th", "en", "auto"]' WHERE setting_key = 'default_language_for_prefix';

-- กำหนดสิทธิ์ใช้คำนำหน้าชื่อตาม Role

-- Admin: ใช้ได้ทุกคำนำหน้า
INSERT INTO title_prefix_permissions (prefix_id, role_id, can_use, is_default_for_role, assigned_by)
SELECT 
    tp.id,
    r.id,
    true,
    CASE WHEN tp.prefix_code = 'MR' THEN true ELSE false END, -- MR เป็นค่าเริ่มต้น
    1
FROM title_prefixes tp
CROSS JOIN roles r
WHERE r.name = 'admin';

-- Staff: ใช้ได้คำนำหน้าทั่วไปและทางวิชาการ
INSERT INTO title_prefix_permissions (prefix_id, role_id, can_use, is_default_for_role, assigned_by)
SELECT 
    tp.id,
    r.id,
    true,
    CASE WHEN tp.prefix_code = 'MR' THEN true ELSE false END,
    1
FROM title_prefixes tp
CROSS JOIN roles r
WHERE r.name = 'staff'
    AND tp.category IN ('general', 'academic');

-- Course Instructor: ใช้ได้คำนำหน้าทั่วไปและทางวิชาการ
INSERT INTO title_prefix_permissions (prefix_id, role_id, can_use, is_default_for_role, assigned_by)
SELECT 
    tp.id,
    r.id,
    true,
    CASE WHEN tp.prefix_code = 'ASST_PROF_DR' THEN true ELSE false END, -- ผศ.ดร. เป็นค่าเริ่มต้น
    1
FROM title_prefixes tp
CROSS JOIN roles r
WHERE r.name = 'course_instructor'
    AND tp.category IN ('general', 'academic');

-- Supervisor: ใช้ได้คำนำหน้าทั่วไปและทางวิชาการ
INSERT INTO title_prefix_permissions (prefix_id, role_id, can_use, is_default_for_role, assigned_by)
SELECT 
    tp.id,
    r.id,
    true,
    CASE WHEN tp.prefix_code = 'DR' THEN true ELSE false END, -- ดร. เป็นค่าเริ่มต้น
    1
FROM title_prefixes tp
CROSS JOIN roles r
WHERE r.name = 'supervisor'
    AND tp.category IN ('general', 'academic');

-- Committee: ใช้ได้คำนำหน้าทั่วไปและทางวิชาการ
INSERT INTO title_prefix_permissions (prefix_id, role_id, can_use, is_default_for_role, assigned_by)
SELECT 
    tp.id,
    r.id,
    true,
    CASE WHEN tp.prefix_code = 'ASSOC_PROF_DR' THEN true ELSE false END, -- รศ.ดร. เป็นค่าเริ่มต้น
    1
FROM title_prefixes tp
CROSS JOIN roles r
WHERE r.name = 'committee'
    AND tp.category IN ('general', 'academic');

-- Student: ใช้ได้คำนำหน้าทั่วไปและทางทหาร (สำหรับนักศึกษาทหาร)
INSERT INTO title_prefix_permissions (prefix_id, role_id, can_use, is_default_for_role, assigned_by)
SELECT 
    tp.id,
    r.id,
    true,
    CASE WHEN tp.prefix_code = 'MR' THEN true ELSE false END, -- นาย เป็นค่าเริ่มต้น
    1
FROM title_prefixes tp
CROSS JOIN roles r
WHERE r.name = 'student'
    AND (
        tp.category = 'general' 
        OR tp.prefix_code IN ('CANDIDATE', '2LT', 'CADET') -- คำนำหน้าทหารสำหรับนักศึกษา
    );-- อ
ัพเดทผู้ใช้ที่มีอยู่ให้มีคำนำหน้าชื่อ
UPDATE users SET title_prefix_id = (
    SELECT id FROM title_prefixes WHERE prefix_code = 'MR' LIMIT 1
) WHERE id = 1 AND title_prefix_id IS NULL; -- Admin

UPDATE users SET title_prefix_id = (
    SELECT id FROM title_prefixes WHERE prefix_code = 'MRS' LIMIT 1
) WHERE email LIKE '%s6800001%' AND title_prefix_id IS NULL; -- Staff 1

UPDATE users SET title_prefix_id = (
    SELECT id FROM title_prefixes WHERE prefix_code = 'MISS' LIMIT 1
) WHERE email LIKE '%s6800002%' AND title_prefix_id IS NULL; -- Staff 2

UPDATE users SET title_prefix_id = (
    SELECT id FROM title_prefixes WHERE prefix_code = 'ASST_PROF_DR' LIMIT 1
) WHERE email LIKE '%t6800001%' AND title_prefix_id IS NULL; -- Instructor 1

UPDATE users SET title_prefix_id = (
    SELECT id FROM title_prefixes WHERE prefix_code = 'DR' LIMIT 1
) WHERE email LIKE '%t6800002%' AND title_prefix_id IS NULL; -- Instructor 2

UPDATE users SET title_prefix_id = (
    SELECT id FROM title_prefixes WHERE prefix_code = 'ASSOC_PROF_DR' LIMIT 1
) WHERE email LIKE '%t6800003%' AND title_prefix_id IS NULL; -- Instructor 3

-- อัพเดทนักศึกษาบางคนให้มีคำนำหน้าทหาร
UPDATE users SET title_prefix_id = (
    SELECT id FROM title_prefixes WHERE prefix_code = 'CANDIDATE' LIMIT 1
) WHERE email = 'test@test.com' AND title_prefix_id IS NULL; -- นักศึกษาทดสอบ

UPDATE users SET title_prefix_id = (
    SELECT id FROM title_prefixes WHERE prefix_code = '2LT' LIMIT 1
) WHERE email LIKE '%u6800001%' AND title_prefix_id IS NULL; -- นักศึกษา 1

-- สร้าง Views สำหรับการใช้งาน

-- View: รายการคำนำหน้าชื่อพร้อมสิทธิ์
CREATE OR REPLACE VIEW title_prefix_with_permissions AS
SELECT 
    tp.id,
    tp.prefix_code,
    tp.prefix_th,
    tp.prefix_en,
    tp.category,
    tp.gender,
    tp.is_active,
    tp.sort_order,
    COUNT(tpp.id) as role_count,
    COUNT(CASE WHEN tpp.can_use THEN 1 END) as allowed_role_count,
    STRING_AGG(DISTINCT r.name_th, ', ' ORDER BY r.name_th) as allowed_roles,
    tp.created_at
FROM title_prefixes tp
LEFT JOIN title_prefix_permissions tpp ON tp.id = tpp.prefix_id AND tpp.can_use = true
LEFT JOIN roles r ON tpp.role_id = r.id
GROUP BY tp.id, tp.prefix_code, tp.prefix_th, tp.prefix_en, tp.category, tp.gender, tp.is_active, tp.sort_order, tp.created_at
ORDER BY tp.sort_order, tp.prefix_th;

-- View: ผู้ใช้พร้อมคำนำหน้าชื่อ
CREATE OR REPLACE VIEW users_with_title_prefix AS
SELECT 
    u.id,
    u.uuid,
    u.email,
    tp.prefix_th,
    tp.prefix_en,
    u.first_name,
    u.last_name,
    CONCAT(COALESCE(tp.prefix_th, ''), ' ', u.first_name, ' ', u.last_name) as full_name_th,
    CONCAT(COALESCE(tp.prefix_en, ''), ' ', u.first_name, ' ', u.last_name) as full_name_en,
    tp.category as prefix_category,
    u.is_active,
    u.created_at
FROM users u
LEFT JOIN title_prefixes tp ON u.title_prefix_id = tp.id AND tp.is_active = true
ORDER BY u.id;

-- View: สถิติการใช้คำนำหน้าชื่อ
CREATE OR REPLACE VIEW title_prefix_usage_stats AS
SELECT 
    tp.prefix_code,
    tp.prefix_th,
    tp.prefix_en,
    tp.category,
    tp.gender,
    COUNT(u.id) as user_count,
    COUNT(CASE WHEN u.is_active THEN 1 END) as active_user_count,
    ROUND(COUNT(u.id) * 100.0 / NULLIF(total_users.count, 0), 2) as usage_percentage
FROM title_prefixes tp
LEFT JOIN users u ON tp.id = u.title_prefix_id
CROSS JOIN (SELECT COUNT(*) as count FROM users WHERE title_prefix_id IS NOT NULL) total_users
WHERE tp.is_active = true
GROUP BY tp.id, tp.prefix_code, tp.prefix_th, tp.prefix_en, tp.category, tp.gender, total_users.count
ORDER BY user_count DESC, tp.sort_order;

-- View: Permission Matrix สำหรับคำนำหน้าชื่อ
CREATE OR REPLACE VIEW title_prefix_permission_matrix AS
SELECT 
    r.name as role_name,
    r.name_th as role_name_th,
    tp.prefix_code,
    tp.prefix_th,
    tp.prefix_en,
    tp.category,
    COALESCE(tpp.can_use, false) as can_use,
    COALESCE(tpp.is_default_for_role, false) as is_default,
    tp.sort_order
FROM roles r
CROSS JOIN title_prefixes tp
LEFT JOIN title_prefix_permissions tpp ON (
    r.id = tpp.role_id 
    AND tp.id = tpp.prefix_id
)
WHERE r.is_active = true
    AND tp.is_active = true
ORDER BY r.name, tp.sort_order;

-- ทดสอบ Functions
SELECT 'ทดสอบ Functions คำนำหน้าชื่อ' as title;

-- ทดสอบดึงคำนำหน้าที่ role สามารถใช้ได้
SELECT 'คำนำหน้าที่ Student สามารถใช้ได้' as test_name;
SELECT * FROM get_available_prefixes_for_role((SELECT id FROM roles WHERE name = 'student')) LIMIT 5;

-- ทดสอบตรวจสอบสิทธิ์
SELECT 'ตรวจสอบสิทธิ์ Student ใช้คำนำหน้า "ว่าที่"' as test_name;
SELECT can_user_use_prefix(
    (SELECT id FROM users WHERE email = 'test@test.com'),
    (SELECT id FROM title_prefixes WHERE prefix_code = 'CANDIDATE')
) as can_use_candidate;

-- ทดสอบชื่อเต็มพร้อมคำนำหน้า
SELECT 'ชื่อเต็มพร้อมคำนำหน้า (ภาษาไทย)' as test_name;
SELECT get_full_name_with_prefix(1, 'th') as admin_full_name_th;

SELECT 'ชื่อเต็มพร้อมคำนำหน้า (ภาษาอังกฤษ)' as test_name;
SELECT get_full_name_with_prefix(1, 'en') as admin_full_name_en;

-- ทดสอบการตั้งค่า
SELECT 'การตั้งค่าคำนำหน้าชื่อ' as test_name;
SELECT get_title_prefix_setting('require_title_prefix') as require_prefix;
SELECT get_title_prefix_setting('show_prefix_in_list') as show_in_list;

-- แสดงสรุปข้อมูล
SELECT 'รายการคำนำหน้าชื่อพร้อมสิทธิ์' as title;
SELECT * FROM title_prefix_with_permissions LIMIT 10;

SELECT 'ผู้ใช้พร้อมคำนำหน้าชื่อ (5 คนแรก)' as title;
SELECT * FROM users_with_title_prefix LIMIT 5;

SELECT 'สถิติการใช้คำนำหน้าชื่อ' as title;
SELECT * FROM title_prefix_usage_stats;

SELECT 'Permission Matrix (ตัวอย่าง 10 รายการแรก)' as title;
SELECT * FROM title_prefix_permission_matrix LIMIT 10;

-- แสดงตัวอย่างการใช้งานจริง
SELECT 'ตัวอย่างการใช้งาน: คำนำหน้าตามหมวดหมู่' as title;
SELECT 
    category,
    COUNT(*) as prefix_count,
    STRING_AGG(prefix_th, ', ' ORDER BY sort_order) as prefixes
FROM title_prefixes 
WHERE is_active = true
GROUP BY category
ORDER BY category;

SELECT 'ตัวอย่างการใช้งาน: ผู้ใช้ที่มีคำนำหน้าทางวิชาการ' as title;
SELECT 
    uwtp.full_name_th,
    uwtp.email,
    tp.category
FROM users_with_title_prefix uwtp
JOIN title_prefixes tp ON uwtp.prefix_th = tp.prefix_th
WHERE tp.category = 'academic'
    AND uwtp.prefix_th IS NOT NULL
LIMIT 5;

COMMIT;