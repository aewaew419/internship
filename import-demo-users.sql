-- Import Demo Users from Excel Data
-- Password for all users: password123 (hashed)

-- Clear existing demo data (keep production users)
DELETE FROM users WHERE student_id NOT IN ('admin', 'admin2', 'test001');

-- Insert Admin Users
INSERT INTO users (student_id, email, password, full_name, first_name, last_name, role, status, is_active, email_verified) VALUES
('admin001', 'admin001@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'ผู้ดูแลระบบ 001', 'ผู้ดูแลระบบ', '001', 'admin', 'active', true, true),
('admin002', 'admin002@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'ผู้ดูแลระบบ 002', 'ผู้ดูแลระบบ', '002', 'admin', 'active', true, true),
('admin003', 'admin003@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'ผู้ดูแลระบบ 003', 'ผู้ดูแลระบบ', '003', 'admin', 'active', true, true);

-- Insert Administrative Staff
INSERT INTO users (student_id, email, password, full_name, first_name, last_name, role, status, is_active, email_verified) VALUES
('s6800001', 's6800001@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'เจ้าหน้าที่ธุรการ 001', 'เจ้าหน้าที่ธุรการ', '001', 'staff', 'active', true, true),
('s6800002', 's6800002@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'เจ้าหน้าที่ธุรการ 002', 'เจ้าหน้าที่ธุรการ', '002', 'staff', 'active', true, true);

-- Insert Instructors
INSERT INTO users (student_id, email, password, full_name, first_name, last_name, role, status, is_active, email_verified) VALUES
('t6800001', 't6800001@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์ประจำวิชา 001', 'อาจารย์ประจำวิชา', '001', 'instructor', 'active', true, true),
('t6800002', 't6800002@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์ประจำวิชา 002', 'อาจารย์ประจำวิชา', '002', 'instructor', 'active', true, true),
('t6800003', 't6800003@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์คณะกรรมการ 003', 'อาจารย์คณะกรรมการ', '003', 'instructor', 'active', true, true);

-- Insert Committee Members
INSERT INTO users (student_id, email, password, full_name, first_name, last_name, role, status, is_active, email_verified) VALUES
('t6800004', 't6800004@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์คณะกรรมการ 004', 'อาจารย์คณะกรรมการ', '004', 'committee', 'active', true, true),
('t6800005', 't6800005@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์คณะกรรมการ 005', 'อาจารย์คณะกรรมการ', '005', 'committee', 'active', true, true),
('t6800006', 't6800006@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์คณะกรรมการ 006', 'อาจารย์คณะกรรมการ', '006', 'committee', 'active', true, true),
('t6800007', 't6800007@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์คณะกรรมการ 007', 'อาจารย์คณะกรรมการ', '007', 'committee', 'active', true, true),
('t6800008', 't6800008@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์คณะกรรมการ 008', 'อาจารย์คณะกรรมการ', '008', 'committee', 'active', true, true),
('t6800009', 't6800009@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์คณะกรรมการ 009', 'อาจารย์คณะกรรมการ', '009', 'committee', 'active', true, true),
('t6800010', 't6800010@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์คณะกรรมการ 010', 'อาจารย์คณะกรรมการ', '010', 'committee', 'active', true, true);

-- Insert Students
INSERT INTO users (student_id, email, password, full_name, first_name, last_name, role, status, is_active, email_verified) VALUES
('u6800001', 'u6800001@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา 001', 'นักศึกษา', '001', 'student', 'active', true, true),
('u6800002', 'u6800002@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา 002', 'นักศึกษา', '002', 'student', 'active', true, true),
('u6800003', 'u6800003@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา 003', 'นักศึกษา', '003', 'student', 'active', true, true),
('u6800004', 'u6800004@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา 004', 'นักศึกษา', '004', 'student', 'active', true, true),
('u6800005', 'u6800005@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา 005', 'นักศึกษา', '005', 'student', 'active', true, true);

-- Update timestamps
UPDATE users SET created_at = NOW(), updated_at = NOW() WHERE created_at IS NULL;