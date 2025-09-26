-- Demo data for testing login system
-- Run this in your PostgreSQL database

-- Insert demo users with student IDs
INSERT INTO users (email, password, first_name, last_name, role, student_id, is_active, created_at, updated_at) VALUES
('student1@university.ac.th', 'password123', 'สมชาย', 'ใจดี', 'student', '6401001', true, NOW(), NOW()),
('student2@university.ac.th', 'password123', 'สมหญิง', 'รักเรียน', 'student', '6401002', true, NOW(), NOW()),
('student3@university.ac.th', 'password123', 'วิชัย', 'ขยันเรียน', 'student', '6401003', true, NOW(), NOW()),
('admin@university.ac.th', 'admin123', 'ผู้ดูแล', 'ระบบ', 'admin', NULL, true, NOW(), NOW()),
('instructor@university.ac.th', 'instructor123', 'อาจารย์', 'ที่ปรึกษา', 'instructor', NULL, true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert students data
INSERT INTO students (user_id, student_id, major, year, gpa, status, created_at, updated_at) VALUES
(1, '6401001', 'วิทยาการคอมพิวเตอร์', 4, 3.25, 'active', NOW(), NOW()),
(2, '6401002', 'เทคโนโลยีสารสนเทศ', 4, 3.50, 'active', NOW(), NOW()),
(3, '6401003', 'วิศวกรรมซอฟต์แวร์', 3, 3.75, 'active', NOW(), NOW())
ON CONFLICT (student_id) DO NOTHING;

-- Insert demo companies
INSERT INTO companies (name, name_th, address, phone, email, website, industry, description, is_active, created_at, updated_at) VALUES
('Smart Solutions Co., Ltd.', 'บริษัท สมาร์ท โซลูชั่นส์ จำกัด', '123 ถนนเทคโนโลยี กรุงเทพฯ 10400', '02-123-4567', 'hr@smart-solutions.com', 'https://smart-solutions.com', 'Software Development', 'บริษัทพัฒนาซอฟต์แวร์และเทคโนโลยี', true, NOW(), NOW()),
('Tech Innovation Ltd.', 'บริษัท เทค อินโนเวชั่น จำกัด', '456 ถนนนวัตกรรม กรุงเทพฯ 10110', '02-234-5678', 'contact@techinnovation.co.th', 'https://techinnovation.co.th', 'Technology', 'บริษัทเทคโนโลยีและนวัตกรรม', true, NOW(), NOW()),
('Digital Future Corp.', 'บริษัท ดิจิทัล ฟิวเจอร์ จำกัด', '789 ถนนอนาคต กรุงเทพฯ 10330', '02-345-6789', 'info@digitalfuture.com', 'https://digitalfuture.com', 'Digital Services', 'บริษัทให้บริการดิจิทัล', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert demo internships
INSERT INTO internships (student_id, company_id, position, start_date, end_date, status, description, created_at, updated_at) VALUES
(1, 1, 'Frontend Developer Intern', '2024-06-01', '2024-08-31', 'approved', 'ฝึกงานด้านการพัฒนา Frontend ด้วย React และ Next.js', NOW(), NOW()),
(2, 2, 'Backend Developer Intern', '2024-06-15', '2024-09-15', 'in_progress', 'ฝึกงานด้านการพัฒนา Backend ด้วย Go และ PostgreSQL', NOW(), NOW()),
(3, 3, 'Full Stack Developer Intern', '2024-07-01', '2024-09-30', 'pending', 'ฝึกงานด้านการพัฒนา Full Stack Application', NOW(), NOW());

-- Update user IDs in students table to match users
UPDATE students SET user_id = (SELECT id FROM users WHERE student_id = students.student_id);

COMMIT;