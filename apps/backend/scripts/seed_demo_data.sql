-- Demo Data Seed Script for Student Internship Management System
-- สำหรับการพรีเซนท์ระบบ

-- Clear existing data (ระวัง: จะลบข้อมูลเดิมทั้งหมด)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE notifications;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE backup_codes;
TRUNCATE TABLE evaluation_status_trackers;
TRUNCATE TABLE student_evaluate_companies;
TRUNCATE TABLE visitor_evaluate_companies;
TRUNCATE TABLE visitor_evaluate_students;
TRUNCATE TABLE visit_photos;
TRUNCATE TABLE visitor_schedules;
TRUNCATE TABLE visitor_trainings;
TRUNCATE TABLE student_trainings;
TRUNCATE TABLE internship_approvals;
TRUNCATE TABLE student_enrolls;
TRUNCATE TABLE course_committees;
TRUNCATE TABLE course_instructors;
TRUNCATE TABLE course_sections;
TRUNCATE TABLE courses;
TRUNCATE TABLE students;
TRUNCATE TABLE instructors;
TRUNCATE TABLE super_admins;
TRUNCATE TABLE staff;
TRUNCATE TABLE users;
TRUNCATE TABLE company_pictures;
TRUNCATE TABLE companies;
TRUNCATE TABLE programs;
TRUNCATE TABLE majors;
TRUNCATE TABLE curriculums;
TRUNCATE TABLE faculties;
TRUNCATE TABLE campuses;
SET FOREIGN_KEY_CHECKS = 1;

-- Insert Campus data
INSERT INTO campuses (id, name, address, created_at, updated_at) VALUES
(1, 'วิทยาเขตหลัก', '123 ถนนมหาวิทยาลัย เขตการศึกษา กรุงเทพฯ 10400', NOW(), NOW()),
(2, 'วิทยาเขตสาขา', '456 ถนนเทคโนโลยี เขตนวัตกรรม กรุงเทพฯ 10500', NOW(), NOW());

-- Insert Faculty data
INSERT INTO faculties (id, name, description, created_at, updated_at) VALUES
(1, 'คณะวิศวกรรมศาสตร์', 'คณะวิศวกรรมศาสตร์และเทคโนโลยี', NOW(), NOW()),
(2, 'คณะวิทยาศาสตร์', 'คณะวิทยาศาสตร์และเทคโนโลยี', NOW(), NOW()),
(3, 'คณะบริหารธุรกิจ', 'คณะบริหารธุรกิจและการจัดการ', NOW(), NOW());

-- Insert Major data
INSERT INTO majors (id, name, faculty_id, created_at, updated_at) VALUES
(1, 'วิศวกรรมคอมพิวเตอร์', 1, NOW(), NOW()),
(2, 'วิศวกรรมไฟฟ้า', 1, NOW(), NOW()),
(3, 'วิทยาการคอมพิวเตอร์', 2, NOW(), NOW()),
(4, 'เทคโนโลยีสารสนเทศ', 2, NOW(), NOW()),
(5, 'การจัดการธุรกิจ', 3, NOW(), NOW());

-- Insert Program data  
INSERT INTO programs (id, name, degree_level, faculty_id, created_at, updated_at) VALUES
(1, 'หลักสูตรวิศวกรรมศาสตรบัณฑิต', 'ปริญญาตรี', 1, NOW(), NOW()),
(2, 'หลักสูตรวิทยาศาสตรบัณฑิต', 'ปริญญาตรี', 2, NOW(), NOW()),
(3, 'หลักสูตรบริหารธุรกิจบัณฑิต', 'ปริญญาตรี', 3, NOW(), NOW());

-- Insert Curriculum data
INSERT INTO curriculums (id, name, year, program_id, created_at, updated_at) VALUES
(1, 'หลักสูตรวิศวกรรมคอมพิวเตอร์ 2566', 2566, 1, NOW(), NOW()),
(2, 'หลักสูตรวิทยาการคอมพิวเตอร์ 2566', 2566, 2, NOW(), NOW()),
(3, 'หลักสูตรการจัดการธุรกิจ 2566', 2566, 3, NOW(), NOW());-
- Insert Users data (ตามข้อมูลที่ให้มา)
INSERT INTO users (student_id, email, password, full_name, status, created_at, updated_at) VALUES
-- Admin users
('admin001X', 'admin001@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นาย ปิ๊ก001 001 นามสกุลปิ๊ก001', 'active', NOW(), NOW()),
('admin002X', 'admin002@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นางสาว อิ๋ว002 002 นามสกุลอิ๋ว002', 'active', NOW(), NOW()),
('admin003X', 'admin003@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นาย ป้อง003 003 นามสกุลป้อง003', 'active', NOW(), NOW()),

-- Administrative users
('a6800001X', 'a6800001@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นาย ธุรการ001 a001 นามสกุลธุรการ001', 'active', NOW(), NOW()),
('a6800002X', 'a6800002@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นางสาว ธุรการ002 a002 นามสกุลธุรการ002', 'active', NOW(), NOW()),

-- Instructor users
('t6800001X', 't6800001@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ดร. ประจำวิชา001 t001 นามสกุลประจำวิชา001', 'active', NOW(), NOW()),
('t6800002X', 't6800002@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'รองศาสตราจารย์ ประจำวิชา002 t002 นามสกุลประจำวิชา002', 'active', NOW(), NOW()),

-- Committee users
('t6800003X', 't6800003@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ดร. อาจารย์003 t003 นามสกุลอาจารย์003', 'active', NOW(), NOW()),
('t6800004X', 't6800004@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'รองศาสตราจารย์ อาจารย์004 t004 นามสกุลอาจารย์004', 'active', NOW(), NOW()),
('t6800005X', 't6800005@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นาย อาจารย์005 t005 นามสกุลอาจารย์005', 'active', NOW(), NOW()),
('t6800006X', 't6800006@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นางสาว อาจารย์006 t006 นามสกุลอาจารย์006', 'active', NOW(), NOW()),
('t6800007X', 't6800007@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นาย อาจารย์007 t007 นามสกุลอาจารย์007', 'active', NOW(), NOW()),
('t6800008X', 't6800008@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นาย อาจารย์008 t008 นามสกุลอาจารย์008', 'active', NOW(), NOW()),
('t6800009X', 't6800009@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นางสาว อาจารย์009 t009 นามสกุลอาจารย์009', 'active', NOW(), NOW()),
('t6800010X', 't6800010@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นาย อาจารย์010 t010 นามสกุลอาจารย์010', 'active', NOW(), NOW()),

-- Student users
('u6800001X', 'u6800001@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นาย สมศรี001 กลาง001 ดีเด่น001', 'active', NOW(), NOW()),
('u6800002X', 'u6800002@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นางสาว สมศรี002 กลาง002 ดีเด่น002', 'active', NOW(), NOW()),
('u6800003X', 'u6800003@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นาย สมศรี003 กลาง003 ดีเด่น003', 'active', NOW(), NOW()),
('u6800004X', 'u6800004@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นางสาว สมศรี004 กลาง004 ดีเด่น004', 'active', NOW(), NOW()),
('u6800005X', 'u6800005@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นาย สมศรี005 กลาง005 ดีเด่น005', 'active', NOW(), NOW()),
('u6800006X', 'u6800006@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นางสาว สมศรี006 กลาง006 ดีเด่น006', 'active', NOW(), NOW()),
('u6800007X', 'u6800007@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นาย สมศรี007 กลาง007 ดีเด่น007', 'active', NOW(), NOW()),
('u6800008X', 'u6800008@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นางสาว สมศรี008 กลาง008 ดีเด่น008', 'active', NOW(), NOW()),
('u6800009X', 'u6800009@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นาย สมศรี009 กลาง009 ดีเด่น009', 'active', NOW(), NOW()),
('u6800010X', 'u6800010@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นางสาว สมศรี010 กลาง010 ดีเด่น010', 'active', NOW(), NOW()),
('u6800011X', 'u6800011@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นาย สมศรี011 กลาง011 ดีเด่น011', 'active', NOW(), NOW()),
('u6800012X', 'u6800012@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นางสาว สมศรี012 กลาง012 ดีเด่น012', 'active', NOW(), NOW()),
('u6800013X', 'u6800013@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นาย สมศรี013 กลาง013 ดีเด่น013', 'active', NOW(), NOW()),
('u6800014X', 'u6800014@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นางสาว สมศรี014 กลาง014 ดีเด่น014', 'active', NOW(), NOW()),
('u6800015X', 'u6800015@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นาย สมศรี015 กลาง015 ดีเด่น015', 'active', NOW(), NOW()),
('u6800016X', 'u6800016@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นางสาว พอสมศรี016 กลาง016 ดีเด่น016', 'active', NOW(), NOW()),
('u6800017X', 'u6800017@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นาย สมศรี017 กลาง017 ดีเด่น017', 'active', NOW(), NOW()),
('u6800018X', 'u6800018@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นางสาว สมศรี018 กลาง018 ดีเด่น018', 'active', NOW(), NOW()),
('u6800019X', 'u6800019@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นาย สมศรี019 กลาง019 ดีเด่น019', 'active', NOW(), NOW()),
('u6800020X', 'u6800020@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นางสาว สมศรี020 กลาง020 ดีเด่น020', 'active', NOW(), NOW());

-- Insert Super Admin data
INSERT INTO super_admins (email, password, full_name, role, permissions, created_at, updated_at) VALUES
('admin001@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นาย ปิ๊ก001 001 นามสกุลปิ๊ก001', 'super_admin', '["all"]', NOW(), NOW()),
('admin002@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นางสาว อิ๋ว002 002 นามสกุลอิ๋ว002', 'super_admin', '["all"]', NOW(), NOW()),
('admin003@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นาย ป้อง003 003 นามสกุลป้อง003', 'system_admin', '["user_management", "system_config"]', NOW(), NOW());

-- Insert Instructors data
INSERT INTO instructors (user_id, staff_id, name, middle_name, surname, faculty_id, program_id, created_at, updated_at) VALUES
(6, 't6800001', 'ประจำวิชา001', 't001', 'นามสกุลประจำวิชา001', 1, 1, NOW(), NOW()),
(7, 't6800002', 'ประจำวิชา002', 't002', 'นามสกุลประจำวิชา002', 2, 2, NOW(), NOW()),
(8, 't6800003', 'อาจารย์003', 't003', 'นามสกุลอาจารย์003', 1, 1, NOW(), NOW()),
(9, 't6800004', 'อาจารย์004', 't004', 'นามสกุลอาจารย์004', 2, 2, NOW(), NOW()),
(10, 't6800005', 'อาจารย์005', 't005', 'นามสกุลอาจารย์005', 3, 3, NOW(), NOW()),
(11, 't6800006', 'อาจารย์006', 't006', 'นามสกุลอาจารย์006', 1, 1, NOW(), NOW()),
(12, 't6800007', 'อาจารย์007', 't007', 'นามสกุลอาจารย์007', 2, 2, NOW(), NOW()),
(13, 't6800008', 'อาจารย์008', 't008', 'นามสกุลอาจารย์008', 3, 3, NOW(), NOW()),
(14, 't6800009', 'อาจารย์009', 't009', 'นามสกุลอาจารย์009', 1, 1, NOW(), NOW()),
(15, 't6800010', 'อาจารย์010', 't010', 'นามสกุลอาจารย์010', 2, 2, NOW(), NOW());