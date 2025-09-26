-- PostgreSQL Seed Data for Student Internship Management System
-- Converted from MySQL format to PostgreSQL

-- Enable UUID extension if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clear existing data (PostgreSQL format)
TRUNCATE TABLE visits_pictures CASCADE;
TRUNCATE TABLE company_pictures CASCADE;
TRUNCATE TABLE student_evaluate_companies CASCADE;
TRUNCATE TABLE visitor_evaluate_companies CASCADE;
TRUNCATE TABLE visitor_evaluate_students CASCADE;
TRUNCATE TABLE visitor_schedules CASCADE;
TRUNCATE TABLE visitor_trainings CASCADE;
TRUNCATE TABLE student_trainings CASCADE;
TRUNCATE TABLE student_enroll_status CASCADE;
TRUNCATE TABLE student_enrolls CASCADE;
TRUNCATE TABLE course_sections CASCADE;
TRUNCATE TABLE instructor_courses CASCADE;
TRUNCATE TABLE courses CASCADE;
TRUNCATE TABLE curriculums CASCADE;
TRUNCATE TABLE students CASCADE;
TRUNCATE TABLE instructors CASCADE;
TRUNCATE TABLE staff CASCADE;
TRUNCATE TABLE majors CASCADE;
TRUNCATE TABLE programs CASCADE;
TRUNCATE TABLE faculties CASCADE;
TRUNCATE TABLE campuses CASCADE;
TRUNCATE TABLE course_committees CASCADE;
TRUNCATE TABLE visitors CASCADE;
TRUNCATE TABLE users CASCADE;

-- Reset sequences (PostgreSQL auto-increment)
ALTER SEQUENCE campuses_id_seq RESTART WITH 1;
ALTER SEQUENCE faculties_id_seq RESTART WITH 1;
ALTER SEQUENCE programs_id_seq RESTART WITH 1;
ALTER SEQUENCE majors_id_seq RESTART WITH 1;
ALTER SEQUENCE curriculums_id_seq RESTART WITH 1;
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE students_id_seq RESTART WITH 1;
ALTER SEQUENCE instructors_id_seq RESTART WITH 1;
ALTER SEQUENCE staff_id_seq RESTART WITH 1;
ALTER SEQUENCE courses_id_seq RESTART WITH 1;
ALTER SEQUENCE course_sections_id_seq RESTART WITH 1;
ALTER SEQUENCE visitors_id_seq RESTART WITH 1;

-- Insert Campus data
INSERT INTO campuses (id, name, code, address, phone, email, created_at, updated_at) VALUES
(1, 'วิทยาเขตหลัก', 'MAIN', '123 ถนนมหาวิทยาลัย เขตการศึกษา กรุงเทพฯ 10400', '02-123-4567', 'main@university.ac.th', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'วิทยาเขตสาขา', 'BRANCH', '456 ถนนเทคโนโลยี เขตนวัตกรรม กรุงเทพฯ 10500', '02-234-5678', 'branch@university.ac.th', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Faculty data
INSERT INTO faculties (id, campus_id, name, code, dean) VALUES
(1, 1, 'คณะวิศวกรรมศาสตร์', 'ENG', 'ศ.ดร.วิศวกรรม ใหญ่'),
(2, 1, 'คณะวิทยาศาสตร์', 'SCI', 'รศ.ดร.วิทยาศาสตร์ เก่ง'),
(3, 2, 'คณะบริหารธุรกิจ', 'BUS', 'ผศ.ดร.ธุรกิจ ดี');

-- Insert Program data  
INSERT INTO programs (id, faculty_id, name, code, degree) VALUES
(1, 1, 'วิศวกรรมศาสตรบัณฑิต', 'B.ENG', 'bachelor'),
(2, 2, 'วิทยาศาสตรบัณฑิต', 'B.SC', 'bachelor'),
(3, 3, 'บริหารธุรกิจบัณฑิต', 'B.BA', 'bachelor');

-- Insert Major data
INSERT INTO majors (id, program_id, name, code) VALUES
(1, 1, 'วิศวกรรมคอมพิวเตอร์', 'CPE'),
(2, 1, 'วิศวกรรมไฟฟ้า', 'EE'),
(3, 2, 'วิทยาการคอมพิวเตอร์', 'CS'),
(4, 2, 'คณิตศาสตร์', 'MATH'),
(5, 3, 'การจัดการธุรกิจ', 'BM'),
(6, 3, 'การตลาด', 'MKT');

-- Insert Curriculum data
INSERT INTO curriculums (id, major_id, name, year, version) VALUES
(1, 1, 'หลักสูตรวิศวกรรมคอมพิวเตอร์ 2566', 2023, '1.0'),
(2, 2, 'หลักสูตรวิศวกรรมไฟฟ้า 2566', 2023, '1.0'),
(3, 3, 'หลักสูตรวิทยาการคอมพิวเตอร์ 2566', 2023, '1.0'),
(4, 4, 'หลักสูตรคณิตศาสตร์ 2566', 2023, '1.0'),
(5, 5, 'หลักสูตรการจัดการธุรกิจ 2566', 2023, '1.0'),
(6, 6, 'หลักสูตรการตลาด 2566', 2023, '1.0');

-- Insert Users (Admin, Staff, Instructors, Students)
INSERT INTO users (id, email, password, first_name, last_name, role, is_active, created_at, updated_at) VALUES
-- Admin Users
(1, 'admin@university.ac.th', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'ผู้ดูแลระบบ', 'หลัก', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'admin2@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'ผู้ดูแลระบบ', '2', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'demo001@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'Demo Admin', '001', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Staff Users
(4, 's6800001@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'เจ้าหน้าที่ธุรการ', '001', 'staff', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 's6800002@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'เจ้าหน้าที่ธุรการ', '002', 'staff', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Instructor Users
(6, 't6800001@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์ประจำวิชา', '001', 'instructor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 't6800002@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์ประจำวิชา', '002', 'instructor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 't6800003@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์ประจำวิชา', '003', 'instructor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Committee Users
(9, 't6800004@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์คณะกรรมการ', '004', 'committee', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 't6800005@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'อาจารย์คณะกรรมการ', '005', 'committee', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Student Users
(11, 'test@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'Test', 'User', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(12, 'student@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'Student', 'User', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(13, 'u6800001@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '001', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(14, 'u6800002@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '002', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(15, 'u6800003@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'นักศึกษา', '003', 'student', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Staff records
INSERT INTO staff (id, user_id, staff_id, position, department) VALUES
(1, 4, 's6800001', 'เจ้าหน้าที่ธุรการ', 'งานทะเบียนและประมวลผล'),
(2, 5, 's6800002', 'เจ้าหน้าที่ธุรการ', 'งานกิจการนักศึกษา');

-- Insert Instructor records
INSERT INTO instructors (id, user_id, instructor_id, department, position, expertise) VALUES
(1, 6, 't6800001', 'วิศวกรรมคอมพิวเตอร์', 'อาจารย์', 'Software Engineering, Database Systems'),
(2, 7, 't6800002', 'วิศวกรรมไฟฟ้า', 'ผู้ช่วยศาสตราจารย์', 'Power Systems, Control Systems'),
(3, 8, 't6800003', 'วิทยาการคอมพิวเตอร์', 'รองศาสตราจารย์', 'Machine Learning, Data Science');

-- Insert Student records
INSERT INTO students (id, user_id, student_id, major_id, year, semester, gpa, status, advisor) VALUES
(1, 11, 'test001', 1, 4, 1, 3.75, 'active', 'อ.สมชาย วิชาการ'),
(2, 12, '65010001', 1, 4, 1, 3.65, 'active', 'อ.สมชาย วิชาการ'),
(3, 13, 'u6800001', 1, 3, 2, 3.80, 'active', 'อ.สมศรี นิเทศงาน'),
(4, 14, 'u6800002', 2, 3, 2, 3.55, 'active', 'อ.สมศักดิ์ ไฟฟ้า'),
(5, 15, 'u6800003', 3, 4, 1, 3.90, 'active', 'อ.สมหญิง คอมพิวเตอร์');

-- Insert Course data
INSERT INTO courses (id, curriculum_id, code, name, credits, description) VALUES
(1, 1, 'CPE101', 'การเขียนโปรแกรมเบื้องต้น', 3, 'พื้นฐานการเขียนโปรแกรม'),
(2, 1, 'CPE201', 'โครงสร้างข้อมูล', 3, 'การจัดการและโครงสร้างข้อมูล'),
(3, 1, 'CPE301', 'วิศวกรรมซอฟต์แวร์', 3, 'การพัฒนาซอฟต์แวร์'),
(4, 1, 'CPE401', 'โครงงานวิศวกรรมคอมพิวเตอร์', 6, 'โครงงานจบการศึกษา'),
(5, 1, 'CPE499', 'การฝึกงาน', 6, 'การฝึกงานในสถานประกอบการ');

-- Insert Course Sections
INSERT INTO course_sections (id, course_id, section, semester, year, max_students, schedule) VALUES
(1, 1, '01', '1/2567', 2024, 40, 'จันทร์ 09:00-12:00'),
(2, 1, '02', '1/2567', 2024, 40, 'พุธ 13:00-16:00'),
(3, 2, '01', '1/2567', 2024, 35, 'อังคาร 09:00-12:00'),
(4, 3, '01', '2/2567', 2024, 30, 'พฤหัสบดี 09:00-12:00'),
(5, 5, '01', '2/2567', 2024, 25, 'การฝึกงาน 16 สัปดาห์');

-- Insert Instructor-Course assignments
INSERT INTO instructor_courses (id, instructor_id, course_id, role) VALUES
(1, 1, 1, 'instructor'),
(2, 1, 2, 'instructor'),
(3, 1, 3, 'instructor'),
(4, 2, 4, 'instructor'),
(5, 3, 5, 'coordinator');

-- Insert Student Enrollments
INSERT INTO student_enrolls (id, student_id, course_section_id, enroll_date, status, grade, grade_points) VALUES
(1, 1, 1, CURRENT_TIMESTAMP, 'completed', 'A', 4.0),
(2, 1, 3, CURRENT_TIMESTAMP, 'completed', 'B+', 3.5),
(3, 2, 1, CURRENT_TIMESTAMP, 'enrolled', NULL, NULL),
(4, 3, 2, CURRENT_TIMESTAMP, 'completed', 'A-', 3.7),
(5, 4, 3, CURRENT_TIMESTAMP, 'enrolled', NULL, NULL);

-- Insert Visitors
INSERT INTO visitors (id, name, email, phone, company, position, expertise, is_active) VALUES
(1, 'คุณสมชาย เทคโนโลยี', 'somchai@techcorp.com', '081-234-5678', 'บริษัท เทคคอร์ป จำกัด', 'Senior Developer', 'Full-stack Development, DevOps', true),
(2, 'คุณสมหญิง เก่งมาก', 'somying@digitalsolution.com', '082-345-6789', 'บริษัท ดิจิทัล โซลูชั่น จำกัด', 'Frontend Team Lead', 'React, Vue.js, UI/UX', true),
(3, 'คุณสมศักดิ์ รู้จริง', 'somsak@itservice.com', '083-456-7890', 'บริษัท ไอที เซอร์วิส จำกัด', 'System Administrator', 'Network, Linux, Security', true),
(4, 'คุณสมพร ชำนาญ', 'somporn@softwareplus.com', '084-567-8901', 'บริษัท ซอฟต์แวร์ พลัส จำกัด', 'Database Architect', 'PostgreSQL, MongoDB, Redis', true),
(5, 'คุณสมบูรณ์ เชี่ยวชาญ', 'somboon@cloudtech.com', '085-678-9012', 'บริษัท คลาวด์ เทค จำกัด', 'Cloud Solutions Architect', 'AWS, Azure, Docker, Kubernetes', true);

-- Insert Student Training records
INSERT INTO student_trainings (id, student_id, company_name, position, start_date, end_date, status, supervisor, description) VALUES
(1, 1, 'บริษัท เทคคอร์ป จำกัด', 'Junior Developer', '2024-06-01', '2024-09-30', 'completed', 'คุณสมชาย เทคโนโลยี', 'พัฒนาระบบเว็บแอปพลิเคชัน'),
(2, 2, 'บริษัท ดิจิทัล โซลูชั่น จำกัด', 'Frontend Intern', '2024-06-15', '2024-10-15', 'in_progress', 'คุณสมหญิง เก่งมาก', 'พัฒนา UI/UX และ Frontend'),
(3, 3, 'บริษัท ไอที เซอร์วิส จำกัด', 'System Admin Trainee', '2024-07-01', '2024-10-31', 'approved', 'คุณสมศักดิ์ รู้จริง', 'จัดการระบบเครือข่ายและเซิร์ฟเวอร์'),
(4, 4, 'บริษัท ซอฟต์แวร์ พลัส จำกัด', 'Database Intern', '2024-05-15', '2024-09-15', 'completed', 'คุณสมพร ชำนาญ', 'ออกแบบและจัดการฐานข้อมูล'),
(5, 5, 'บริษัท คลาวด์ เทค จำกัด', 'Cloud Engineer Trainee', '2024-08-01', '2024-11-30', 'pending', 'คุณสมบูรณ์ เชี่ยวชาญ', 'พัฒนาและจัดการระบบ Cloud');

-- Insert Visitor Schedules
INSERT INTO visitor_schedules (id, visitor_id, date, start_time, end_time, activity, location, notes) VALUES
(1, 1, '2024-07-15', '09:00', '12:00', 'นิเทศการฝึกงาน', 'บริษัท เทคคอร์ป จำกัด', 'ตรวจเยี่ยมนักศึกษาฝึกงาน'),
(2, 2, '2024-08-01', '13:00', '16:00', 'ประเมินผลการฝึกงาน', 'บริษัท ดิจิทัล โซลูชั่น จำกัด', 'ประเมินความก้าวหน้า'),
(3, 3, '2024-08-15', '10:00', '15:00', 'สัมมนาเทคโนโลยี', 'ห้องประชุม A301', 'บรรยายพิเศษเรื่อง Network Security'),
(4, 4, '2024-09-01', '09:00', '12:00', 'Workshop Database', 'ห้องปฏิบัติการ B201', 'อบรม PostgreSQL Advanced'),
(5, 5, '2024-09-15', '14:00', '17:00', 'Cloud Computing Seminar', 'ห้องประชุมใหญ่', 'แนวโน้มเทคโนโลยี Cloud');

-- Insert Student Evaluations of Companies
INSERT INTO student_evaluate_companies (id, student_id, company_name, date, score, comments, criteria) VALUES
(1, 1, 'บริษัท เทคคอร์ป จำกัด', CURRENT_TIMESTAMP, 4.5, 'บริษัทให้การสนับสนุนดีมาก มีพี่เลี้ยงคอยช่วยเหลือ', '{"learning_opportunity": 5, "supervision": 4, "work_environment": 4, "facilities": 5}'),
(2, 2, 'บริษัท ดิจิทัล โซลูชั่น จำกัด', CURRENT_TIMESTAMP, 4.2, 'ได้เรียนรู้เทคโนโลยีใหม่ๆ มากมาย', '{"learning_opportunity": 4, "supervision": 4, "work_environment": 5, "facilities": 4}'),
(3, 4, 'บริษัท ซอฟต์แวร์ พลัส จำกัด', CURRENT_TIMESTAMP, 4.8, 'ได้ประสบการณ์ทำงานจริงกับฐานข้อมูลขนาดใหญ่', '{"learning_opportunity": 5, "supervision": 5, "work_environment": 4, "facilities": 5}');

-- Insert Visitor Evaluations of Students
INSERT INTO visitor_evaluate_students (id, visitor_id, student_id, date, score, comments, criteria) VALUES
(1, 1, 1, CURRENT_TIMESTAMP, 4.3, 'นักศึกษาขยันและเรียนรู้เร็ว มีความรับผิดชอบสูง', '{"technical_skills": 4, "communication": 4, "responsibility": 5, "teamwork": 4}'),
(2, 2, 2, CURRENT_TIMESTAMP, 4.0, 'มีความคิดสร้างสรรค์ในการออกแบบ UI', '{"technical_skills": 4, "communication": 4, "responsibility": 4, "teamwork": 4}'),
(3, 4, 4, CURRENT_TIMESTAMP, 4.7, 'เข้าใจระบบฐานข้อมูลได้อย่างรวดเร็ว', '{"technical_skills": 5, "communication": 4, "responsibility": 5, "teamwork": 4}');

-- Insert Course Committee
INSERT INTO course_committees (id, name, description, chairperson, members) VALUES
(1, 'คณะกรรมการหลักสูตรวิศวกรรมคอมพิวเตอร์', 'กรรมการพิจารณาและพัฒนาหลักสูตร', 'ศ.ดร.วิศวกรรม ใหญ่', '["รศ.ดร.คอมพิวเตอร์ เก่ง", "ผศ.ดร.ซอฟต์แวร์ ดี", "อ.ดร.เครือข่าย แกร่ง"]'),
(2, 'คณะกรรมการฝึกงาน', 'กรรมการดูแลและประเมินการฝึกงาน', 'รศ.ดร.ฝึกงาน ประสบการณ์', '["อ.ดร.นิเทศ ดูแล", "อ.ประเมิน ผลงาน", "อ.ติดตาม สถานการณ์"]');

COMMIT;

-- Display summary
SELECT 'Data insertion completed successfully!' as status;
SELECT 'Users: ' || COUNT(*) as user_count FROM users;
SELECT 'Students: ' || COUNT(*) as student_count FROM students;
SELECT 'Instructors: ' || COUNT(*) as instructor_count FROM instructors;
SELECT 'Companies: ' || COUNT(*) as company_count FROM visitors;
SELECT 'Training Records: ' || COUNT(*) as training_count FROM student_trainings;
