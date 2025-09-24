-- Enhanced Demo Data Seed Script for Student Internship Management System
-- สำหรับการพรีเซนท์ระบบ - ปรับปรุงให้ตรงกับ Prisma Schema

-- Clear existing data (ระวัง: จะลบข้อมูลเดิมทั้งหมด)
SET FOREIGN_KEY_CHECKS = 0;

-- Clear all tables in correct order (reverse dependency)
TRUNCATE TABLE visits_pictures;
TRUNCATE TABLE company_pictures;
TRUNCATE TABLE student_evaluate_companies;
TRUNCATE TABLE visitor_evaluate_companies;
TRUNCATE TABLE visitor_evaluate_students;
TRUNCATE TABLE visitor_schedules;
TRUNCATE TABLE visitor_trainings;
TRUNCATE TABLE student_trainings;
TRUNCATE TABLE student_enroll_status;
TRUNCATE TABLE student_enrolls;
TRUNCATE TABLE course_sections;
TRUNCATE TABLE instructor_courses;
TRUNCATE TABLE courses;
TRUNCATE TABLE curriculums;
TRUNCATE TABLE students;
TRUNCATE TABLE instructors;
TRUNCATE TABLE staff;
TRUNCATE TABLE majors;
TRUNCATE TABLE programs;
TRUNCATE TABLE faculties;
TRUNCATE TABLE campuses;
TRUNCATE TABLE course_committees;
TRUNCATE TABLE visitors;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- Insert Campus data
INSERT INTO campuses (id, name, code, address, phone, email, created_at, updated_at) VALUES
(1, 'วิทยาเขตหลัก', 'MAIN', '123 ถนนมหาวิทยาลัย เขตการศึกษา กรุงเทพฯ 10400', '02-123-4567', 'main@university.ac.th', NOW(), NOW()),
(2, 'วิทยาเขตสาขา', 'BRANCH', '456 ถนนเทคโนโลยี เขตนวัตกรรม กรุงเทพฯ 10500', '02-234-5678', 'branch@university.ac.th', NOW(), NOW());

-- Insert Faculty data
INSERT INTO faculties (id, campus_id, name, code, dean, created_at, updated_at) VALUES
(1, 1, 'คณะวิศวกรรมศาสตร์', 'ENG', 'ศ.ดร.วิศวกรรม ใหญ่', NOW(), NOW()),
(2, 1, 'คณะวิทยาศาสตร์', 'SCI', 'รศ.ดร.วิทยาศาสตร์ เก่ง', NOW(), NOW()),
(3, 2, 'คณะบริหารธุรกิจ', 'BUS', 'ผศ.ดร.ธุรกิจ ดี', NOW(), NOW());

-- Insert Program data  
INSERT INTO programs (id, faculty_id, name, code, degree, created_at, updated_at) VALUES
(1, 1, 'วิศวกรรมศาสตรบัณฑิต', 'B.ENG', 'bachelor', NOW(), NOW()),
(2, 2, 'วิทยาศาสตรบัณฑิต', 'B.SC', 'bachelor', NOW(), NOW()),
(3, 3, 'บริหารธุรกิจบัณฑิต', 'B.BA', 'bachelor', NOW(), NOW());

-- Insert Major data
INSERT INTO majors (id, program_id, name, code, created_at, updated_at) VALUES
(1, 1, 'วิศวกรรมคอมพิวเตอร์', 'CPE', NOW(), NOW()),
(2, 1, 'วิศวกรรมไฟฟ้า', 'EE', NOW(), NOW()),
(3, 2, 'วิทยาการคอมพิวเตอร์', 'CS', NOW(), NOW()),
(4, 2, 'เทคโนโลยีสารสนเทศ', 'IT', NOW(), NOW()),
(5, 3, 'การจัดการธุรกิจ', 'BM', NOW(), NOW());

-- Insert Curriculum data
INSERT INTO curriculums (id, major_id, name, year, version, created_at, updated_at) VALUES
(1, 1, 'หลักสูตรวิศวกรรมคอมพิวเตอร์', 2566, '1.0', NOW(), NOW()),
(2, 2, 'หลักสูตรวิศวกรรมไฟฟ้า', 2566, '1.0', NOW(), NOW()),
(3, 3, 'หลักสูตรวิทยาการคอมพิวเตอร์', 2566, '1.0', NOW(), NOW()),
(4, 4, 'หลักสูตรเทคโนโลยีสารสนเทศ', 2566, '1.0', NOW(), NOW()),
(5, 5, 'หลักสูตรการจัดการธุรกิจ', 2566, '1.0', NOW(), NOW());

-- Insert Users data (Admin, Staff, Instructors, Students)
INSERT INTO users (id, email, password, first_name, last_name, role, is_active, created_at, updated_at) VALUES
-- Super Admin
(1, 'admin001@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ปิ๊ก001', 'นามสกุลปิ๊ก001', 'admin', true, NOW(), NOW()),
(2, 'admin002@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'อิ๋ว002', 'นามสกุลอิ๋ว002', 'admin', true, NOW(), NOW()),
(3, 'admin003@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ป้อง003', 'นามสกุลป้อง003', 'admin', true, NOW(), NOW()),

-- Staff
(4, 'staff001@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ธุรการ001', 'นามสกุลธุรการ001', 'staff', true, NOW(), NOW()),
(5, 'staff002@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ธุรการ002', 'นามสกุลธุรการ002', 'staff', true, NOW(), NOW()),

-- Instructors
(6, 'instructor001@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ประจำวิชา001', 'นามสกุลประจำวิชา001', 'instructor', true, NOW(), NOW()),
(7, 'instructor002@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ประจำวิชา002', 'นามสกุลประจำวิชา002', 'instructor', true, NOW(), NOW()),
(8, 'instructor003@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'อาจารย์003', 'นามสกุลอาจารย์003', 'instructor', true, NOW(), NOW()),
(9, 'instructor004@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'อาจารย์004', 'นามสกุลอาจารย์004', 'instructor', true, NOW(), NOW()),
(10, 'instructor005@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'อาจารย์005', 'นามสกุลอาจารย์005', 'instructor', true, NOW(), NOW()),

-- Students
(11, 'u6800001@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี001', 'ดีเด่น001', 'student', true, NOW(), NOW()),
(12, 'u6800002@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี002', 'ดีเด่น002', 'student', true, NOW(), NOW()),
(13, 'u6800003@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี003', 'ดีเด่น003', 'student', true, NOW(), NOW()),
(14, 'u6800004@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี004', 'ดีเด่น004', 'student', true, NOW(), NOW()),
(15, 'u6800005@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี005', 'ดีเด่น005', 'student', true, NOW(), NOW()),
(16, 'u6800006@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี006', 'ดีเด่น006', 'student', true, NOW(), NOW()),
(17, 'u6800007@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี007', 'ดีเด่น007', 'student', true, NOW(), NOW()),
(18, 'u6800008@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี008', 'ดีเด่น008', 'student', true, NOW(), NOW()),
(19, 'u6800009@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี009', 'ดีเด่น009', 'student', true, NOW(), NOW()),
(20, 'u6800010@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี010', 'ดีเด่น010', 'student', true, NOW(), NOW()),
(21, 'u6800011@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี011', 'ดีเด่น011', 'student', true, NOW(), NOW()),
(22, 'u6800012@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี012', 'ดีเด่น012', 'student', true, NOW(), NOW()),
(23, 'u6800013@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี013', 'ดีเด่น013', 'student', true, NOW(), NOW()),
(24, 'u6800014@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี014', 'ดีเด่น014', 'student', true, NOW(), NOW()),
(25, 'u6800015@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี015', 'ดีเด่น015', 'student', true, NOW(), NOW()),
(26, 'u6800016@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี016', 'ดีเด่น016', 'student', true, NOW(), NOW()),
(27, 'u6800017@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี017', 'ดีเด่น017', 'student', true, NOW(), NOW()),
(28, 'u6800018@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี018', 'ดีเด่น018', 'student', true, NOW(), NOW()),
(29, 'u6800019@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี019', 'ดีเด่น019', 'student', true, NOW(), NOW()),
(30, 'u6800020@student.university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมศรี020', 'ดีเด่น020', 'student', true, NOW(), NOW());

-- Insert Staff data
INSERT INTO staff (id, user_id, staff_id, position, department, created_at, updated_at) VALUES
(1, 4, 'a6800001', 'เจ้าหน้าที่ธุรการ', 'งานทะเบียนและประมวลผล', NOW(), NOW()),
(2, 5, 'a6800002', 'เจ้าหน้าที่ธุรการ', 'งานกิจการนักศึกษา', NOW(), NOW());

-- Insert Instructors data
INSERT INTO instructors (id, user_id, instructor_id, department, position, expertise, created_at, updated_at) VALUES
(1, 6, 't6800001', 'วิศวกรรมคอมพิวเตอร์', 'อาจารย์', 'Software Engineering, Database Systems', NOW(), NOW()),
(2, 7, 't6800002', 'วิทยาการคอมพิวเตอร์', 'รองศาสตราจารย์', 'Machine Learning, Data Science', NOW(), NOW()),
(3, 8, 't6800003', 'วิศวกรรมไฟฟ้า', 'ผู้ช่วยศาสตราจารย์', 'Power Systems, Control Systems', NOW(), NOW()),
(4, 9, 't6800004', 'เทคโนโลยีสารสนเทศ', 'อาจารย์', 'Network Security, Cloud Computing', NOW(), NOW()),
(5, 10, 't6800005', 'การจัดการธุรกิจ', 'อาจารย์', 'Strategic Management, Marketing', NOW(), NOW());

-- Insert Students data
INSERT INTO students (id, user_id, student_id, major_id, year, semester, gpa, status, advisor, created_at, updated_at) VALUES
(1, 11, 'u6800001', 1, 4, 1, 3.75, 'active', 'อ.ประจำวิชา001', NOW(), NOW()),
(2, 12, 'u6800002', 1, 4, 1, 3.82, 'active', 'อ.ประจำวิชา001', NOW(), NOW()),
(3, 13, 'u6800003', 2, 4, 1, 3.65, 'active', 'อ.อาจารย์003', NOW(), NOW()),
(4, 14, 'u6800004', 2, 4, 1, 3.90, 'active', 'อ.อาจารย์003', NOW(), NOW()),
(5, 15, 'u6800005', 3, 4, 1, 3.55, 'active', 'รศ.ประจำวิชา002', NOW(), NOW()),
(6, 16, 'u6800006', 3, 4, 1, 3.78, 'active', 'รศ.ประจำวิชา002', NOW(), NOW()),
(7, 17, 'u6800007', 4, 4, 1, 3.68, 'active', 'อ.อาจารย์004', NOW(), NOW()),
(8, 18, 'u6800008', 4, 4, 1, 3.85, 'active', 'อ.อาจารย์004', NOW(), NOW()),
(9, 19, 'u6800009', 5, 4, 1, 3.72, 'active', 'อ.อาจารย์005', NOW(), NOW()),
(10, 20, 'u6800010', 5, 4, 1, 3.88, 'active', 'อ.อาจารย์005', NOW(), NOW()),
(11, 21, 'u6800011', 1, 3, 2, 3.45, 'active', 'อ.ประจำวิชา001', NOW(), NOW()),
(12, 22, 'u6800012', 1, 3, 2, 3.67, 'active', 'อ.ประจำวิชา001', NOW(), NOW()),
(13, 23, 'u6800013', 2, 3, 2, 3.58, 'active', 'อ.อาจารย์003', NOW(), NOW()),
(14, 24, 'u6800014', 2, 3, 2, 3.73, 'active', 'อ.อาจารย์003', NOW(), NOW()),
(15, 25, 'u6800015', 3, 3, 2, 3.62, 'active', 'รศ.ประจำวิชา002', NOW(), NOW()),
(16, 26, 'u6800016', 3, 3, 2, 3.81, 'active', 'รศ.ประจำวิชา002', NOW(), NOW()),
(17, 27, 'u6800017', 4, 3, 2, 3.54, 'active', 'อ.อาจารย์004', NOW(), NOW()),
(18, 28, 'u6800018', 4, 3, 2, 3.76, 'active', 'อ.อาจารย์004', NOW(), NOW()),
(19, 29, 'u6800019', 5, 3, 2, 3.69, 'active', 'อ.อาจารย์005', NOW(), NOW()),
(20, 30, 'u6800020', 5, 3, 2, 3.84, 'active', 'อ.อาจารย์005', NOW(), NOW());

-- Insert Courses data
INSERT INTO courses (id, curriculum_id, code, name, credits, description, prerequisites, created_at, updated_at) VALUES
(1, 1, 'CPE101', 'การเขียนโปรแกรมเบื้องต้น', 3, 'พื้นฐานการเขียนโปรแกรมด้วยภาษา C', NULL, NOW(), NOW()),
(2, 1, 'CPE201', 'โครงสร้างข้อมูลและอัลกอริทึม', 3, 'การจัดเก็บและจัดการข้อมูลอย่างมีประสิทธิภาพ', 'CPE101', NOW(), NOW()),
(3, 1, 'CPE301', 'วิศวกรรมซอฟต์แวร์', 3, 'หลักการพัฒนาซอฟต์แวร์อย่างเป็นระบบ', 'CPE201', NOW(), NOW()),
(4, 1, 'CPE401', 'โครงงานวิศวกรรมคอมพิวเตอร์', 3, 'โครงงานจบการศึกษา', 'CPE301', NOW(), NOW()),
(5, 1, 'CPE499', 'สหกิจศึกษา', 6, 'การฝึกงานในสถานประกอบการ', 'CPE301', NOW(), NOW());

-- Insert Course Sections data
INSERT INTO course_sections (id, course_id, section, semester, year, max_students, schedule, created_at, updated_at) VALUES
(1, 1, '01', '1/2567', 2567, 40, 'จันทร์ 09:00-12:00', NOW(), NOW()),
(2, 1, '02', '1/2567', 2567, 40, 'อังคาร 13:00-16:00', NOW(), NOW()),
(3, 2, '01', '2/2567', 2567, 35, 'พุธ 09:00-12:00', NOW(), NOW()),
(4, 3, '01', '1/2567', 2567, 30, 'พฤหัสบดี 09:00-12:00', NOW(), NOW()),
(5, 5, '01', '2/2567', 2567, 25, 'ตลอดภาคการศึกษา', NOW(), NOW());

-- Insert Instructor Courses data
INSERT INTO instructor_courses (id, instructor_id, course_id, role, created_at, updated_at) VALUES
(1, 1, 1, 'instructor', NOW(), NOW()),
(2, 1, 2, 'instructor', NOW(), NOW()),
(3, 2, 3, 'instructor', NOW(), NOW()),
(4, 1, 4, 'coordinator', NOW(), NOW()),
(5, 1, 5, 'coordinator', NOW(), NOW());

-- Insert Student Enrollments data
INSERT INTO student_enrolls (id, student_id, course_section_id, enroll_date, status, grade, grade_points, created_at, updated_at) VALUES
(1, 1, 5, '2024-08-15', 'enrolled', NULL, NULL, NOW(), NOW()),
(2, 2, 5, '2024-08-15', 'enrolled', NULL, NULL, NOW(), NOW()),
(3, 3, 5, '2024-08-15', 'enrolled', NULL, NULL, NOW(), NOW()),
(4, 4, 5, '2024-08-15', 'enrolled', NULL, NULL, NOW(), NOW()),
(5, 5, 5, '2024-08-15', 'enrolled', NULL, NULL, NOW(), NOW());

-- Insert Student Training data (Internship records)
INSERT INTO student_trainings (id, student_id, company_name, position, start_date, end_date, status, supervisor, description, created_at, updated_at) VALUES
(1, 1, 'บริษัท เทคโนโลยี จำกัด', 'Software Developer Intern', '2024-06-01', '2024-10-31', 'approved', 'คุณสมชาย ใจดี', 'พัฒนาระบบเว็บแอปพลิเคชัน', NOW(), NOW()),
(2, 2, 'บริษัท ดิจิทัล โซลูชั่น จำกัด', 'Frontend Developer Intern', '2024-06-01', '2024-10-31', 'approved', 'คุณสมหญิง เก่งมาก', 'พัฒนา User Interface', NOW(), NOW()),
(3, 3, 'บริษัท ไอที เซอร์วิส จำกัด', 'System Admin Intern', '2024-06-15', '2024-11-15', 'approved', 'คุณสมศักดิ์ รู้จริง', 'ดูแลระบบเครือข่าย', NOW(), NOW()),
(4, 4, 'บริษัท ซอฟต์แวร์ พลัส จำกัด', 'Database Developer Intern', '2024-07-01', '2024-11-30', 'approved', 'คุณสมพร ชำนาญ', 'ออกแบบและพัฒนาฐานข้อมูล', NOW(), NOW()),
(5, 5, 'บริษัท คลาวด์ เทค จำกัด', 'Cloud Engineer Intern', '2024-07-15', '2024-12-15', 'approved', 'คุณสมบูรณ์ เชี่ยวชาญ', 'จัดการระบบ Cloud Infrastructure', NOW(), NOW()),
(6, 6, 'บริษัท เอไอ อินโนเวชั่น จำกัด', 'AI Developer Intern', '2024-08-01', '2024-12-31', 'pending', 'คุณสมหมาย ปัญญา', 'พัฒนาระบบ Machine Learning', NOW(), NOW()),
(7, 7, 'บริษัท ไซเบอร์ ซีเคียวริตี้ จำกัด', 'Security Analyst Intern', '2024-08-15', '2025-01-15', 'pending', 'คุณสมรักษ์ ปลอดภัย', 'วิเคราะห์ความปลอดภัยระบบ', NOW(), NOW());

-- Insert Visitors data (Company supervisors/evaluators)
INSERT INTO visitors (id, name, email, phone, company, position, expertise, is_active, created_at, updated_at) VALUES
(1, 'คุณสมชาย ใจดี', 'somchai@techcompany.com', '081-234-5678', 'บริษัท เทคโนโลยี จำกัด', 'Senior Software Engineer', 'Full Stack Development', true, NOW(), NOW()),
(2, 'คุณสมหญิง เก่งมาก', 'somying@digitalsolution.com', '082-345-6789', 'บริษัท ดิจิทัล โซลูชั่น จำกัด', 'Frontend Team Lead', 'React, Vue.js, UI/UX', true, NOW(), NOW()),
(3, 'คุณสมศักดิ์ รู้จริง', 'somsak@itservice.com', '083-456-7890', 'บริษัท ไอที เซอร์วิส จำกัด', 'System Administrator', 'Network, Linux, Security', true, NOW(), NOW()),
(4, 'คุณสมพร ชำนาญ', 'somporn@softwareplus.com', '084-567-8901', 'บริษัท ซอฟต์แวร์ พลัส จำกัด', 'Database Architect', 'MySQL, PostgreSQL, MongoDB', true, NOW(), NOW()),
(5, 'คุณสมบูรณ์ เชี่ยวชาญ', 'somboon@cloudtech.com', '085-678-9012', 'บริษัท คลาวด์ เทค จำกัด', 'Cloud Solutions Architect', 'AWS, Azure, Docker, Kubernetes', true, NOW(), NOW());

-- Insert Visitor Schedules data
INSERT INTO visitor_schedules (id, visitor_id, date, start_time, end_time, activity, location, notes, created_at, updated_at) VALUES
(1, 1, '2024-09-15', '09:00', '12:00', 'การประเมินนักศึกษาฝึกงาน', 'ห้องประชุม A', 'ประเมินผลงานโครงการ', NOW(), NOW()),
(2, 2, '2024-09-20', '13:00', '16:00', 'การสัมมนาเทคโนโลยี Frontend', 'ห้องบรรยาย 201', 'แบ่งปันประสบการณ์การพัฒนา UI', NOW(), NOW()),
(3, 3, '2024-09-25', '10:00', '15:00', 'การตรวจสอบระบบความปลอดภัย', 'ห้องคอมพิวเตอร์', 'ตรวจสอบการตั้งค่าระบบ', NOW(), NOW()),
(4, 4, '2024-10-01', '09:00', '12:00', 'การประเมินโครงการฐานข้อมูล', 'ห้องประชุม B', 'ทบทวนการออกแบบฐานข้อมูล', NOW(), NOW()),
(5, 5, '2024-10-05', '14:00', '17:00', 'การสาธิต Cloud Deployment', 'ห้องปฏิบัติการ', 'สาธิตการ deploy บน cloud', NOW(), NOW());

-- Insert Visitor Evaluate Student data
INSERT INTO visitor_evaluate_students (id, visitor_id, student_id, date, score, comments, criteria, created_at, updated_at) VALUES
(1, 1, 1, '2024-09-15', 85.5, 'นักศึกษามีความสามารถในการเขียนโปรแกรมดี มีความรับผิดชอบสูง', '{"technical_skills": 85, "communication": 80, "teamwork": 90, "problem_solving": 85, "punctuality": 95}', NOW(), NOW()),
(2, 2, 2, '2024-09-20', 88.0, 'มีความคิดสร้างสรรค์ในการออกแบบ UI ทำงานได้ดีกับทีม', '{"technical_skills": 90, "communication": 85, "teamwork": 90, "problem_solving": 88, "punctuality": 87}', NOW(), NOW()),
(3, 3, 3, '2024-09-25', 82.5, 'เข้าใจระบบเครือข่ายได้ดี ยังต้องพัฒนาทักษะการแก้ปัญหาเฉพาะหน้า', '{"technical_skills": 80, "communication": 78, "teamwork": 85, "problem_solving": 80, "punctuality": 90}', NOW(), NOW()),
(4, 4, 4, '2024-10-01', 91.0, 'มีความเข้าใจในการออกแบบฐานข้อมูลดีมาก สามารถทำงานได้อย่างอิสระ', '{"technical_skills": 95, "communication": 88, "teamwork": 90, "problem_solving": 92, "punctuality": 90}', NOW(), NOW()),
(5, 5, 5, '2024-10-05', 87.5, 'เรียนรู้เทคโนโลยี cloud ได้เร็ว มีความกระตือรือร้นในการทำงาน', '{"technical_skills": 88, "communication": 85, "teamwork": 90, "problem_solving": 87, "punctuality": 88}', NOW(), NOW());

-- Insert Student Evaluate Company data
INSERT INTO student_evaluate_companies (id, student_id, company_name, date, score, comments, criteria, created_at, updated_at) VALUES
(1, 1, 'บริษัท เทคโนโลยี จำกัด', '2024-10-31', 90.0, 'บริษัทให้โอกาสในการเรียนรู้ดี มีพี่เลี้ยงที่ดี สภาพแวดล้อมการทำงานดี', '{"learning_opportunity": 95, "supervision": 90, "work_environment": 88, "facilities": 85, "overall_satisfaction": 92}', NOW(), NOW()),
(2, 2, 'บริษัท ดิจิทัล โซลูชั่น จำกัด', '2024-10-31', 88.5, 'ได้เรียนรู้เทคโนโลยีใหม่ๆ ทีมงานเป็นกันเอง แต่งานค่อนข้างเยอะ', '{"learning_opportunity": 92, "supervision": 88, "work_environment": 85, "facilities": 87, "overall_satisfaction": 90}', NOW(), NOW()),
(3, 3, 'บริษัท ไอที เซอร์วิส จำกัด', '2024-11-15', 85.0, 'ได้ประสบการณ์จริงในการดูแลระบบ แต่ยังขาดการอบรมเบื้องต้น', '{"learning_opportunity": 88, "supervision": 80, "work_environment": 85, "facilities": 82, "overall_satisfaction": 87}', NOW(), NOW()),
(4, 4, 'บริษัท ซอฟต์แวร์ พลัส จำกัด', '2024-11-30', 92.5, 'บริษัทมีระบบการฝึกงานที่ดีมาก ได้เรียนรู้ทั้งทฤษฎีและปฏิบัติ', '{"learning_opportunity": 95, "supervision": 92, "work_environment": 90, "facilities": 92, "overall_satisfaction": 94}', NOW(), NOW()),
(5, 5, 'บริษัท คลาวด์ เทค จำกัด', '2024-12-15', 89.0, 'เทคโนโลยีทันสมัย ได้เรียนรู้ cloud computing จริงๆ สภาพแวดล้อมดี', '{"learning_opportunity": 93, "supervision": 87, "work_environment": 88, "facilities": 90, "overall_satisfaction": 87}', NOW(), NOW());

-- Insert Course Committee data
INSERT INTO course_committees (id, name, description, chairperson, members, created_at, updated_at) VALUES
(1, 'คณะกรรมการหลักสูตรวิศวกรรมคอมพิวเตอร์', 'คณะกรรมการพัฒนาและปรับปรุงหลักสูตร', 'รศ.ดร.วิศวกรรม ใหญ่', '["อ.ประจำวิชา001", "รศ.ประจำวิชา002", "อ.อาจารย์003"]', NOW(), NOW()),
(2, 'คณะกรรมการสหกิจศึกษา', 'คณะกรรมการกำกับดูแลการฝึกงานนักศึกษา', 'อ.ประจำวิชา001', '["รศ.ประจำวิชา002", "อ.อาจารย์004", "อ.อาจารย์005"]', NOW(), NOW());

-- Success message
SELECT 'Enhanced Demo Data Seed Completed Successfully!' as message;
SELECT 'Total Users Created: 30' as users_count;
SELECT 'Total Students Created: 20' as students_count;
SELECT 'Total Instructors Created: 5' as instructors_count;
SELECT 'Total Training Records Created: 7' as training_count;
SELECT 'Total Evaluations Created: 10' as evaluation_count;