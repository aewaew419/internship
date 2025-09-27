-- ปรับปรุงระบบ User Roles สำหรับสหกิจศึกษา
-- รองรับ Multiple Roles และ Role เฉพาะเจาะจง

-- สร้างตาราง roles แยกต่างหาก
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    name_th VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSON, -- เก็บสิทธิ์การเข้าถึงแต่ละ role
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง user_roles สำหรับ many-to-many relationship
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false, -- role หลักของ user
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- role อาจมีวันหมดอายุ
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, role_id) -- ป้องกันการมี role ซ้ำ
);

-- เพิ่มคอลัมน์ใหม่ในตาราง users
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100); -- ภาควิชา/หน่วยงาน
ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(100); -- ตำแหน่งงาน
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20); -- เบอร์โทรศัพท์
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(20) UNIQUE; -- รหัสพนักงาน

-- เพิ่ม roles ตามความต้องการ
INSERT INTO roles (name, name_th, description, permissions) VALUES
('admin', 'ผู้ดูแลระบบ', 'ผู้ดูแลระบบทั้งหมด มีสิทธิ์เต็ม', 
 '{"system": ["read", "write", "delete"], "users": ["read", "write", "delete"], "documents": ["read", "write", "delete", "approve"], "reports": ["read", "write", "delete"]}'),

('staff', 'เจ้าหน้าที่', 'เจ้าหน้าที่สหกิจศึกษา', 
 '{"students": ["read", "write"], "companies": ["read", "write"], "documents": ["read", "write", "approve"], "reports": ["read", "write"]}'),

('course_instructor', 'อาจารย์ประจำวิชา', 'อาจารย์ประจำวิชาสหกิจศึกษา', 
 '{"students": ["read"], "documents": ["read", "approve"], "evaluations": ["read", "write"], "reports": ["read"]}'),

('committee', 'กรรมการ', 'กรรมการสหกิจศึกษา', 
 '{"students": ["read"], "documents": ["read", "approve"], "evaluations": ["read", "write"], "reports": ["read"]}'),

('supervisor', 'อาจารย์นิเทศ', 'อาจารย์นิเทศนักศึกษา', 
 '{"students": ["read", "write"], "companies": ["read"], "documents": ["read", "approve"], "evaluations": ["read", "write"], "visits": ["read", "write"], "reports": ["read"]}'),

('student', 'นักศึกษา', 'นักศึกษาสหกิจศึกษา', 
 '{"profile": ["read", "write"], "documents": ["read", "write"], "reports": ["read", "write"], "evaluations": ["read"]}');

-- สร้างตารางสำหรับจัดการการมอบหมาย supervisor ให้นักศึกษา
CREATE TABLE IF NOT EXISTS student_supervisors (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    supervisor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignment_type VARCHAR(50) NOT NULL DEFAULT 'primary', -- 'primary', 'secondary', 'backup'
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(student_id, supervisor_id, assignment_type)
);

-- สร้างตารางสำหรับจัดการการมอบหมาย course instructor
CREATE TABLE IF NOT EXISTS course_assignments (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    semester VARCHAR(20) NOT NULL, -- เช่น '2567/1', '2567/2'
    academic_year VARCHAR(10) NOT NULL, -- เช่น '2567'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(course_code, semester, academic_year)
);

-- สร้างตารางสำหรับจัดการ committee assignments
CREATE TABLE IF NOT EXISTS committee_assignments (
    id SERIAL PRIMARY KEY,
    committee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    committee_type VARCHAR(50) NOT NULL, -- 'evaluation', 'approval', 'review'
    scope VARCHAR(100), -- ขอบเขตความรับผิดชอบ เช่น 'department', 'faculty', 'university'
    department VARCHAR(100),
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ย้ายข้อมูล role เดิมไปยังระบบใหม่
INSERT INTO user_roles (user_id, role_id, is_primary, assigned_at)
SELECT 
    u.id,
    r.id,
    true,
    u.created_at
FROM users u
JOIN roles r ON u.role = r.name
WHERE u.role IS NOT NULL;

-- สร้าง indexes สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_primary ON user_roles(is_primary);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active);

CREATE INDEX IF NOT EXISTS idx_student_supervisors_student ON student_supervisors(student_id);
CREATE INDEX IF NOT EXISTS idx_student_supervisors_supervisor ON student_supervisors(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_student_supervisors_active ON student_supervisors(is_active);

CREATE INDEX IF NOT EXISTS idx_course_assignments_instructor ON course_assignments(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_semester ON course_assignments(semester, academic_year);

CREATE INDEX IF NOT EXISTS idx_committee_assignments_committee ON committee_assignments(committee_id);
CREATE INDEX IF NOT EXISTS idx_committee_assignments_type ON committee_assignments(committee_type);

-- สร้าง triggers สำหรับ updated_at
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_supervisors_updated_at BEFORE UPDATE ON student_supervisors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_assignments_updated_at BEFORE UPDATE ON course_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_committee_assignments_updated_at BEFORE UPDATE ON committee_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- สร้าง functions สำหรับจัดการ roles

-- Function: เช็คว่า user มี role อะไรบ้าง
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id INTEGER)
RETURNS TABLE(role_name VARCHAR, role_name_th VARCHAR, is_primary BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT r.name, r.name_th, ur.is_primary
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id 
        AND ur.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
    ORDER BY ur.is_primary DESC, r.name;
END;
$$ LANGUAGE plpgsql;

-- Function: เช็คว่า user มีสิทธิ์ทำอะไรได้บ้าง
CREATE OR REPLACE FUNCTION check_user_permission(p_user_id INTEGER, p_resource VARCHAR, p_action VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := false;
    role_permissions JSON;
BEGIN
    -- ดึงสิทธิ์ทั้งหมดของ user
    SELECT INTO has_permission
        EXISTS(
            SELECT 1
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = p_user_id 
                AND ur.is_active = true
                AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
                AND r.permissions->p_resource ? p_action
        );
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- Function: เพิ่ม role ให้ user
CREATE OR REPLACE FUNCTION assign_role_to_user(
    p_user_id INTEGER,
    p_role_name VARCHAR,
    p_assigned_by INTEGER DEFAULT NULL,
    p_is_primary BOOLEAN DEFAULT false,
    p_expires_at TIMESTAMP DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    role_id INTEGER;
BEGIN
    -- หา role_id
    SELECT id INTO role_id FROM roles WHERE name = p_role_name AND is_active = true;
    
    IF role_id IS NULL THEN
        RAISE EXCEPTION 'Role % not found', p_role_name;
    END IF;
    
    -- ถ้าเป็น primary role ให้ยกเลิก primary ของ role อื่นก่อน
    IF p_is_primary THEN
        UPDATE user_roles 
        SET is_primary = false 
        WHERE user_id = p_user_id AND is_active = true;
    END IF;
    
    -- เพิ่ม role ใหม่
    INSERT INTO user_roles (user_id, role_id, is_primary, assigned_by, expires_at)
    VALUES (p_user_id, role_id, p_is_primary, p_assigned_by, p_expires_at)
    ON CONFLICT (user_id, role_id) 
    DO UPDATE SET 
        is_primary = p_is_primary,
        assigned_by = p_assigned_by,
        expires_at = p_expires_at,
        is_active = true,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- สร้าง Views สำหรับการใช้งาน

-- View: ดูข้อมูล user พร้อม roles
CREATE OR REPLACE VIEW user_with_roles AS
SELECT 
    u.id,
    u.uuid,
    u.email,
    u.first_name,
    u.last_name,
    u.department,
    u.position,
    u.phone,
    u.employee_id,
    u.student_id,
    u.is_active,
    -- Primary role
    pr.name as primary_role,
    pr.name_th as primary_role_th,
    -- All roles (comma separated)
    STRING_AGG(r.name, ', ' ORDER BY ur.is_primary DESC, r.name) as all_roles,
    STRING_AGG(r.name_th, ', ' ORDER BY ur.is_primary DESC, r.name) as all_roles_th,
    u.created_at,
    u.updated_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true 
    AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_roles pur ON u.id = pur.user_id AND pur.is_primary = true AND pur.is_active = true
LEFT JOIN roles pr ON pur.role_id = pr.id
GROUP BY u.id, u.uuid, u.email, u.first_name, u.last_name, u.department, u.position, 
         u.phone, u.employee_id, u.student_id, u.is_active, pr.name, pr.name_th, u.created_at, u.updated_at;

-- View: ดูการมอบหมาย supervisor
CREATE OR REPLACE VIEW student_supervisor_assignments AS
SELECT 
    s.student_id,
    CONCAT(su.first_name, ' ', su.last_name) as student_name,
    ss.assignment_type,
    CONCAT(sv.first_name, ' ', sv.last_name) as supervisor_name,
    sv.email as supervisor_email,
    sv.department as supervisor_department,
    ss.assigned_at,
    ss.is_active,
    ss.notes
FROM student_supervisors ss
JOIN students s ON ss.student_id = s.id
JOIN users su ON s.user_id = su.id
JOIN users sv ON ss.supervisor_id = sv.id
WHERE ss.is_active = true
ORDER BY s.student_id, ss.assignment_type;

-- View: ดูการมอบหมาย course instructor
CREATE OR REPLACE VIEW course_instructor_assignments AS
SELECT 
    ca.course_code,
    ca.course_name,
    ca.semester,
    ca.academic_year,
    CONCAT(u.first_name, ' ', u.last_name) as instructor_name,
    u.email as instructor_email,
    u.department as instructor_department,
    ca.is_active
FROM course_assignments ca
JOIN users u ON ca.instructor_id = u.id
WHERE ca.is_active = true
ORDER BY ca.academic_year DESC, ca.semester DESC, ca.course_code;

COMMIT;