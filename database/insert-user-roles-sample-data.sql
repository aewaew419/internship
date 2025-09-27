-- ข้อมูลตัวอย่างสำหรับระบบ User Roles ใหม่
-- รันไฟล์นี้หลังจาก update-user-roles-system.sql แล้ว

-- อัพเดทข้อมูลพนักงาน/อาจารย์ที่มีอยู่
UPDATE users SET 
    department = 'วิทยาการคอมพิวเตอร์',
    position = 'ผู้ดูแลระบบ',
    phone = '02-123-4567',
    employee_id = 'EMP001'
WHERE email = 'admin@smart-solutions.com';

UPDATE users SET 
    department = 'สหกิจศึกษา',
    position = 'เจ้าหน้าที่สหกิจศึกษา',
    phone = '02-234-5678',
    employee_id = 'STAFF001'
WHERE email = 's6800001@smart-solutions.com';

UPDATE users SET 
    department = 'สหกิจศึกษา',
    position = 'เจ้าหน้าที่สหกิจศึกษา',
    phone = '02-234-5679',
    employee_id = 'STAFF002'
WHERE email = 's6800002@smart-solutions.com';

-- อัพเดทข้อมูลอาจารย์
UPDATE users SET 
    department = 'วิทยาการคอมพิวเตอร์',
    position = 'อาจารย์ประจำ',
    phone = '02-345-6781',
    employee_id = 'INST001'
WHERE email = 't6800001@smart-solutions.com';

UPDATE users SET 
    department = 'เทคโนโลยีสารสนเทศ',
    position = 'อาจารย์ประจำ',
    phone = '02-345-6782',
    employee_id = 'INST002'
WHERE email = 't6800002@smart-solutions.com';

UPDATE users SET 
    department = 'วิศวกรรมซอฟต์แวร์',
    position = 'อาจารย์ประจำ',
    phone = '02-345-6783',
    employee_id = 'INST003'
WHERE email = 't6800003@smart-solutions.com';

UPDATE users SET 
    department = 'วิทยาการคอมพิวเตอร์',
    position = 'รองคณบดี',
    phone = '02-456-7891',
    employee_id = 'COMM001'
WHERE email = 't6800004@smart-solutions.com';

UPDATE users SET 
    department = 'เทคโนโลยีสารสนเทศ',
    position = 'หัวหน้าภาค',
    phone = '02-456-7892',
    employee_id = 'COMM002'
WHERE email = 't6800005@smart-solutions.com';

-- เพิ่มอาจารย์นิเทศเพิ่มเติม
INSERT INTO users (email, password, first_name, last_name, role, department, position, phone, employee_id, is_active) VALUES
('supervisor001@university.ac.th', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'ดร.สมชาย', 'นิเทศดี', 'instructor', 'วิทยาการคอมพิวเตอร์', 'อาจารย์นิเทศ', '02-567-8901', 'SUP001', true),
('supervisor002@university.ac.th', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'ดร.สมหญิง', 'ดูแลดี', 'instructor', 'เทคโนโลยีสารสนเทศ', 'อาจารย์นิเทศ', '02-567-8902', 'SUP002', true),
('supervisor003@university.ac.th', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'ดร.วิชัย', 'ติดตามดี', 'instructor', 'วิศวกรรมซอฟต์แวร์', 'อาจารย์นิเทศ', '02-567-8903', 'SUP003', true);

-- เพิ่มอาจารย์ประจำวิชาเพิ่มเติม
INSERT INTO users (email, password, first_name, last_name, role, department, position, phone, employee_id, is_active) VALUES
('course001@university.ac.th', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'ผศ.ดร.อนุชา', 'สอนดี', 'instructor', 'วิทยาการคอมพิวเตอร์', 'ผู้ช่วยศาสตราจารย์', '02-678-9012', 'COURSE001', true),
('course002@university.ac.th', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'รศ.ดร.สุนีย์', 'เก่งมาก', 'instructor', 'เทคโนโลยีสารสนเทศ', 'รองศาสตราจารย์', '02-678-9013', 'COURSE002', true);

-- กำหนด Multiple Roles ให้ผู้ใช้

-- อาจารย์ที่ทำหน้าที่หลายบทบาท
-- t6800001: อาจารย์ประจำวิชา + อาจารย์นิเทศ
SELECT assign_role_to_user(
    (SELECT id FROM users WHERE email = 't6800001@smart-solutions.com'),
    'course_instructor',
    (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'),
    true
);

SELECT assign_role_to_user(
    (SELECT id FROM users WHERE email = 't6800001@smart-solutions.com'),
    'supervisor',
    (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'),
    false
);

-- t6800002: อาจารย์ประจำวิชา + กรรมการ
SELECT assign_role_to_user(
    (SELECT id FROM users WHERE email = 't6800002@smart-solutions.com'),
    'course_instructor',
    (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'),
    true
);

SELECT assign_role_to_user(
    (SELECT id FROM users WHERE email = 't6800002@smart-solutions.com'),
    'committee',
    (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'),
    false
);

-- t6800003: อาจารย์นิเทศ + กรรมการ
SELECT assign_role_to_user(
    (SELECT id FROM users WHERE email = 't6800003@smart-solutions.com'),
    'supervisor',
    (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'),
    true
);

SELECT assign_role_to_user(
    (SELECT id FROM users WHERE email = 't6800003@smart-solutions.com'),
    'committee',
    (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'),
    false
);

-- อาจารย์นิเทศเฉพาะ
SELECT assign_role_to_user(
    (SELECT id FROM users WHERE email = 'supervisor001@university.ac.th'),
    'supervisor',
    (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'),
    true
);

SELECT assign_role_to_user(
    (SELECT id FROM users WHERE email = 'supervisor002@university.ac.th'),
    'supervisor',
    (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'),
    true
);

SELECT assign_role_to_user(
    (SELECT id FROM users WHERE email = 'supervisor003@university.ac.th'),
    'supervisor',
    (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'),
    true
);

-- อาจารย์ประจำวิชาเฉพาะ
SELECT assign_role_to_user(
    (SELECT id FROM users WHERE email = 'course001@university.ac.th'),
    'course_instructor',
    (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'),
    true
);

SELECT assign_role_to_user(
    (SELECT id FROM users WHERE email = 'course002@university.ac.th'),
    'course_instructor',
    (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'),
    true
);

-- กรรมการเฉพาะ
SELECT assign_role_to_user(
    (SELECT id FROM users WHERE email = 't6800004@smart-solutions.com'),
    'committee',
    (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'),
    true
);

SELECT assign_role_to_user(
    (SELECT id FROM users WHERE email = 't6800005@smart-solutions.com'),
    'committee',
    (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'),
    true
);

-- เพิ่มข้อมูลการมอบหมายวิชา
INSERT INTO course_assignments (course_code, course_name, instructor_id, semester, academic_year) VALUES
('COOP6001', 'สหกิจศึกษา 1', (SELECT id FROM users WHERE email = 'course001@university.ac.th'), '2567/1', '2567'),
('COOP6002', 'สหกิจศึกษา 2', (SELECT id FROM users WHERE email = 'course002@university.ac.th'), '2567/1', '2567'),
('COOP6001', 'สหกิจศึกษา 1', (SELECT id FROM users WHERE email = 't6800001@smart-solutions.com'), '2567/2', '2567'),
('COOP6002', 'สหกิจศึกษา 2', (SELECT id FROM users WHERE email = 't6800002@smart-solutions.com'), '2567/2', '2567');

-- เพิ่มข้อมูลการมอบหมายอาจารย์นิเทศให้นักศึกษา
INSERT INTO student_supervisors (student_id, supervisor_id, assignment_type, assigned_by, notes) VALUES
-- นักศึกษา test001 มีอาจารย์นิเทศหลัก
((SELECT id FROM students WHERE student_id = 'test001'), 
 (SELECT id FROM users WHERE email = 'supervisor001@university.ac.th'), 
 'primary', 
 (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'),
 'อาจารย์นิเทศหลักสำหรับการฝึกงานที่ Smart Solutions'),

-- นักศึกษา u6800001 มีอาจารย์นิเทศหลัก
((SELECT id FROM students WHERE student_id = 'u6800001'), 
 (SELECT id FROM users WHERE email = 'supervisor002@university.ac.th'), 
 'primary', 
 (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'),
 'อาจารย์นิเทศหลักสำหรับการฝึกงานที่ Tech Innovation'),

-- นักศึกษา u6800002 มีอาจารย์นิเทศหลัก
((SELECT id FROM students WHERE student_id = 'u6800002'), 
 (SELECT id FROM users WHERE email = 'supervisor003@university.ac.th'), 
 'primary', 
 (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'),
 'อาจารย์นิเทศหลักสำหรับการฝึกงานที่ Digital Future'),

-- นักศึกษา u6800003 มีอาจารย์นิเทศหลักและสำรอง
((SELECT id FROM students WHERE student_id = 'u6800003'), 
 (SELECT id FROM users WHERE email = 't6800001@smart-solutions.com'), 
 'primary', 
 (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'),
 'อาจารย์นิเทศหลัก (ทำหน้าที่ 2 บทบาท)'),

((SELECT id FROM students WHERE student_id = 'u6800003'), 
 (SELECT id FROM users WHERE email = 'supervisor001@university.ac.th'), 
 'secondary', 
 (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'),
 'อาจารย์นิเทศสำรอง'),

-- นักศึกษา u6800004 มีอาจารย์นิเทศหลัก
((SELECT id FROM students WHERE student_id = 'u6800004'), 
 (SELECT id FROM users WHERE email = 't6800003@smart-solutions.com'), 
 'primary', 
 (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'),
 'อาจารย์นิเทศหลัก (ทำหน้าที่ 2 บทบาท)');

-- เพิ่มข้อมูลการมอบหมายกรรมการ
INSERT INTO committee_assignments (committee_id, committee_type, scope, department, assigned_by) VALUES
-- กรรมการประเมิน
((SELECT id FROM users WHERE email = 't6800004@smart-solutions.com'), 
 'evaluation', 'department', 'วิทยาการคอมพิวเตอร์', 
 (SELECT id FROM users WHERE email = 'admin@smart-solutions.com')),

((SELECT id FROM users WHERE email = 't6800005@smart-solutions.com'), 
 'evaluation', 'department', 'เทคโนโลยีสารสนเทศ', 
 (SELECT id FROM users WHERE email = 'admin@smart-solutions.com')),

-- กรรมการอนุมัติ
((SELECT id FROM users WHERE email = 't6800002@smart-solutions.com'), 
 'approval', 'faculty', NULL, 
 (SELECT id FROM users WHERE email = 'admin@smart-solutions.com')),

((SELECT id FROM users WHERE email = 't6800003@smart-solutions.com'), 
 'approval', 'faculty', NULL, 
 (SELECT id FROM users WHERE email = 'admin@smart-solutions.com'));

-- สร้าง View สำหรับสรุปข้อมูล roles
CREATE OR REPLACE VIEW role_summary AS
SELECT 
    r.name_th as role_name,
    COUNT(ur.user_id) as user_count,
    COUNT(CASE WHEN ur.is_primary THEN 1 END) as primary_count,
    COUNT(CASE WHEN NOT ur.is_primary THEN 1 END) as secondary_count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.is_active = true
GROUP BY r.id, r.name_th, r.name
ORDER BY 
    CASE r.name 
        WHEN 'admin' THEN 1
        WHEN 'staff' THEN 2
        WHEN 'course_instructor' THEN 3
        WHEN 'supervisor' THEN 4
        WHEN 'committee' THEN 5
        WHEN 'student' THEN 6
        ELSE 7
    END;

-- สร้าง View สำหรับดูผู้ใช้ที่มีหลาย roles
CREATE OR REPLACE VIEW multi_role_users AS
SELECT 
    u.first_name,
    u.last_name,
    u.email,
    u.department,
    u.position,
    COUNT(ur.role_id) as role_count,
    STRING_AGG(r.name_th, ', ' ORDER BY ur.is_primary DESC, r.name) as roles
FROM users u
JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.first_name, u.last_name, u.email, u.department, u.position
HAVING COUNT(ur.role_id) > 1
ORDER BY role_count DESC, u.last_name;

-- แสดงสรุปข้อมูล
SELECT 'สรุปจำนวน Roles' as title;
SELECT * FROM role_summary;

SELECT 'ผู้ใช้ที่มีหลาย Roles' as title;
SELECT * FROM multi_role_users;

SELECT 'การมอบหมายอาจารย์นิเทศ' as title;
SELECT * FROM student_supervisor_assignments LIMIT 10;

SELECT 'การมอบหมายอาจารย์ประจำวิชา' as title;
SELECT * FROM course_instructor_assignments;

-- ทดสอบ Functions
SELECT 'ทดสอบ get_user_roles สำหรับ t6800001@smart-solutions.com' as title;
SELECT * FROM get_user_roles((SELECT id FROM users WHERE email = 't6800001@smart-solutions.com'));

SELECT 'ทดสอบ check_user_permission สำหรับ documents approve' as title;
SELECT check_user_permission(
    (SELECT id FROM users WHERE email = 't6800001@smart-solutions.com'),
    'documents',
    'approve'
) as has_permission;

COMMIT;