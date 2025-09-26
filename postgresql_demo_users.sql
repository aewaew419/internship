-- PostgreSQL Demo Users Import
-- Converted from MySQL format

-- Clear existing demo data (keep production users)
DELETE FROM students WHERE student_id NOT IN ('admin', 'admin2', 'test001');
DELETE FROM instructors WHERE instructor_id NOT IN ('admin', 'admin2');
DELETE FROM staff WHERE staff_id NOT IN ('admin', 'admin2');
DELETE FROM users WHERE email NOT LIKE '%@university.ac.th' AND email NOT IN ('admin@test.com', 'test@test.com');

-- Insert Admin Users (PostgreSQL format)
INSERT INTO users (email, password, first_name, last_name, role, is_active, created_at, updated_at) VALUES
('admin001@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'ผู้ดูแลระบบ', '001', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('admin002@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'ผู้ดูแลระบบ', '002', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('admin003@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'ผู้ดูแลระบบ', '003', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Insert Administrative Staff (PostgreSQL format)
INSERT INTO users (email, password, first_name, last_name, role, is_active, created_at, updated_at) VALUES
('s6800001@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'เจ้าหน้าที่ธุรการ', '001', 'staff', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('s6800002@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'เจ้าหน้าที่ธุรการ', '002', 'staff', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Insert Instructors (PostgreSQL format)
INSERT INTO users (email, password, first_name, last_name, role, is_active, created_at, updated_at) VALUES
('t6800001@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์ประจำวิชา', '001', 'instructor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('t6800002@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์ประจำวิชา', '002', 'instructor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('t6800003@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์ประจำวิชา', '003', 'instructor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Insert Committee Members (PostgreSQL format)
INSERT INTO users (email, password, first_name, last_name, role, is_active, created_at, updated_at) VALUES
('t6800004@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์คณะกรรมการ', '004', 'committee', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('t6800005@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์คณะกรรมการ', '005', 'committee', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Insert Students (PostgreSQL format) - Sample of 20 students
INSERT INTO users (email, password, first_name, last_name, role, is_active, created_at, updated_at) VALUES
('u6800001@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '001', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('u6800002@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '002', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('u6800003@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '003', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('u6800004@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '004', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('u6800005@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '005', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('u6800006@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '006', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('u6800007@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '007', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('u6800008@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '008', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('u6800009@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '009', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('u6800010@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '010', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('u6800011@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '011', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('u6800012@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '012', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('u6800013@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '013', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('u6800014@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '014', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('u6800015@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '015', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('u6800016@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '016', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('u6800017@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '017', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('u6800018@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '018', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('u6800019@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '019', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('u6800020@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '020', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

COMMIT;

-- Display summary
SELECT 'PostgreSQL demo users imported successfully!' as status;
