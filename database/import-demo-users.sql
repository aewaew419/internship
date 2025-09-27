-- Import Demo Users from DEMO_USERS.md
-- Total: 35 users (6 Admin, 2 Staff, 3 Instructor, 2 Committee, 22 Student)

-- Clear existing demo data first
DELETE FROM internships WHERE id > 0;
DELETE FROM students WHERE id > 0;
DELETE FROM users WHERE id > 0;

-- Reset sequences
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE students_id_seq RESTART WITH 1;
ALTER SEQUENCE internships_id_seq RESTART WITH 1;

-- Insert Admin Users (6 คน)
INSERT INTO users (email, password, first_name, last_name, role, student_id, is_active) VALUES
('admin2@smart-solutions.com', '$2a$10$WfTvtpTDWaBZC.zwQBbI0uLJrnaTVvtsg7sEehOpQdfGLND5A/PMq', 'System', 'Administrator', 'admin', 'admin2', true),
('demo001@smart-solutions.com', '$2a$10$eIQpwBpgXVSQBe1qqIuUluB/pteooFQ7lpO3V4uc1OwfCp5Nikrlm', 'Demo Admin', '001', 'admin', 'demo001', true),
('admin@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'System', 'Administrator', 'admin', 'admin', true),
('admin001@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Admin', '001', 'admin', 'admin001', true),
('admin002@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Admin', '002', 'admin', 'admin002', true),
('admin003@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Admin', '003', 'admin', 'admin003', true);

-- Insert Staff Users (2 คน)
INSERT INTO users (email, password, first_name, last_name, role, student_id, is_active) VALUES
('s6800001@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Staff', '001', 'staff', 's6800001', true),
('s6800002@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Staff', '002', 'staff', 's6800002', true);

-- Insert Instructor Users (3 คน)
INSERT INTO users (email, password, first_name, last_name, role, student_id, is_active) VALUES
('t6800001@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Instructor', '001', 'instructor', 't6800001', true),
('t6800002@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Instructor', '002', 'instructor', 't6800002', true),
('t6800003@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Instructor', '003', 'instructor', 't6800003', true);

-- Insert Committee Users (2 คน)
INSERT INTO users (email, password, first_name, last_name, role, student_id, is_active) VALUES
('t6800004@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Committee', '004', 'committee', 't6800004', true),
('t6800005@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Committee', '005', 'committee', 't6800005', true);

-- Insert Student Users (22 คน)
INSERT INTO users (email, password, first_name, last_name, role, student_id, is_active) VALUES
('test@test.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Test', 'User', 'student', 'test001', true),
('student@test.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', 'User', 'student', '65010001', true),
('u6800001@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '001', 'student', 'u6800001', true),
('u6800002@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '002', 'student', 'u6800002', true),
('u6800003@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '003', 'student', 'u6800003', true),
('u6800004@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '004', 'student', 'u6800004', true),
('u6800005@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '005', 'student', 'u6800005', true),
('u6800006@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '006', 'student', 'u6800006', true),
('u6800007@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '007', 'student', 'u6800007', true),
('u6800008@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '008', 'student', 'u6800008', true),
('u6800009@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '009', 'student', 'u6800009', true),
('u6800010@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '010', 'student', 'u6800010', true),
('u6800011@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '011', 'student', 'u6800011', true),
('u6800012@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '012', 'student', 'u6800012', true),
('u6800013@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '013', 'student', 'u6800013', true),
('u6800014@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '014', 'student', 'u6800014', true),
('u6800015@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '015', 'student', 'u6800015', true),
('u6800016@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '016', 'student', 'u6800016', true),
('u6800017@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '017', 'student', 'u6800017', true),
('u6800018@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '018', 'student', 'u6800018', true),
('u6800019@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '019', 'student', 'u6800019', true),
('u6800020@smart-solutions.com', '$2a$10$JwFllMjNkXiU8oxFreJa6O1VCHN3CRVRoPxvRqPqPpZDtuNsBp.We', 'Student', '020', 'student', 'u6800020', true);

-- Insert Student records for student users
INSERT INTO students (user_id, student_id, major, year, gpa, status) VALUES
-- Test students
((SELECT id FROM users WHERE student_id = 'test001'), 'test001', 'วิทยาการคอมพิวเตอร์', 4, 3.50, 'active'),
((SELECT id FROM users WHERE student_id = '65010001'), '65010001', 'เทคโนโลยีสารสนเทศ', 4, 3.25, 'active'),

-- Regular students
((SELECT id FROM users WHERE student_id = 'u6800001'), 'u6800001', 'วิทยาการคอมพิวเตอร์', 4, 3.75, 'active'),
((SELECT id FROM users WHERE student_id = 'u6800002'), 'u6800002', 'เทคโนโลยีสารสนเทศ', 4, 3.60, 'active'),
((SELECT id FROM users WHERE student_id = 'u6800003'), 'u6800003', 'วิศวกรรมซอฟต์แวร์', 3, 3.80, 'active'),
((SELECT id FROM users WHERE student_id = 'u6800004'), 'u6800004', 'วิทยาการคอมพิวเตอร์', 3, 3.45, 'active'),
((SELECT id FROM users WHERE student_id = 'u6800005'), 'u6800005', 'เทคโนโลยีสารสนเทศ', 4, 3.55, 'active'),
((SELECT id FROM users WHERE student_id = 'u6800006'), 'u6800006', 'วิศวกรรมซอฟต์แวร์', 3, 3.70, 'active'),
((SELECT id FROM users WHERE student_id = 'u6800007'), 'u6800007', 'วิทยาการคอมพิวเตอร์', 4, 3.40, 'active'),
((SELECT id FROM users WHERE student_id = 'u6800008'), 'u6800008', 'เทคโนโลยีสารสนเทศ', 3, 3.65, 'active'),
((SELECT id FROM users WHERE student_id = 'u6800009'), 'u6800009', 'วิศวกรรมซอฟต์แวร์', 4, 3.85, 'active'),
((SELECT id FROM users WHERE student_id = 'u6800010'), 'u6800010', 'วิทยาการคอมพิวเตอร์', 3, 3.30, 'active'),
((SELECT id FROM users WHERE student_id = 'u6800011'), 'u6800011', 'เทคโนโลยีสารสนเทศ', 4, 3.50, 'active'),
((SELECT id FROM users WHERE student_id = 'u6800012'), 'u6800012', 'วิศวกรรมซอฟต์แวร์', 3, 3.75, 'active'),
((SELECT id FROM users WHERE student_id = 'u6800013'), 'u6800013', 'วิทยาการคอมพิวเตอร์', 4, 3.60, 'active'),
((SELECT id FROM users WHERE student_id = 'u6800014'), 'u6800014', 'เทคโนโลยีสารสนเทศ', 3, 3.45, 'active'),
((SELECT id FROM users WHERE student_id = 'u6800015'), 'u6800015', 'วิศวกรรมซอฟต์แวร์', 4, 3.80, 'active'),
((SELECT id FROM users WHERE student_id = 'u6800016'), 'u6800016', 'วิทยาการคอมพิวเตอร์', 3, 3.35, 'active'),
((SELECT id FROM users WHERE student_id = 'u6800017'), 'u6800017', 'เทคโนโลยีสารสนเทศ', 4, 3.55, 'active'),
((SELECT id FROM users WHERE student_id = 'u6800018'), 'u6800018', 'วิศวกรรมซอฟต์แวร์', 3, 3.70, 'active'),
((SELECT id FROM users WHERE student_id = 'u6800019'), 'u6800019', 'วิทยาการคอมพิวเตอร์', 4, 3.65, 'active'),
((SELECT id FROM users WHERE student_id = 'u6800020'), 'u6800020', 'เทคโนโลยีสารสนเทศ', 3, 3.40, 'active');

-- Insert some sample internships for demo students
INSERT INTO internships (student_id, company_id, position, start_date, end_date, status, description) VALUES
((SELECT id FROM students WHERE student_id = 'test001'), 1, 'Frontend Developer Intern', '2024-06-01', '2024-08-31', 'approved', 'ฝึกงานด้านการพัฒนา Frontend ด้วย React และ Next.js'),
((SELECT id FROM students WHERE student_id = 'u6800001'), 2, 'Backend Developer Intern', '2024-06-15', '2024-09-15', 'in_progress', 'ฝึกงานด้านการพัฒนา Backend ด้วย Go และ PostgreSQL'),
((SELECT id FROM students WHERE student_id = 'u6800002'), 3, 'Full Stack Developer Intern', '2024-07-01', '2024-09-30', 'pending', 'ฝึkงานด้านการพัฒนา Full Stack Application'),
((SELECT id FROM students WHERE student_id = 'u6800003'), 1, 'Mobile App Developer Intern', '2024-05-15', '2024-08-15', 'completed', 'ฝึกงานด้านการพัฒนา Mobile Application ด้วย React Native'),
((SELECT id FROM students WHERE student_id = 'u6800004'), 2, 'DevOps Intern', '2024-06-01', '2024-08-31', 'approved', 'ฝึกงานด้าน DevOps และ Cloud Infrastructure'),
((SELECT id FROM students WHERE student_id = 'u6800005'), 3, 'Data Analyst Intern', '2024-07-15', '2024-10-15', 'in_progress', 'ฝึกงานด้านการวิเคราะห์ข้อมูลและ Business Intelligence'),
((SELECT id FROM students WHERE student_id = 'u6800006'), 1, 'UI/UX Designer Intern', '2024-06-01', '2024-08-31', 'pending', 'ฝึกงานด้านการออกแบบ User Interface และ User Experience'),
((SELECT id FROM students WHERE student_id = 'u6800007'), 2, 'Quality Assurance Intern', '2024-05-01', '2024-07-31', 'completed', 'ฝึกงานด้านการทดสอบซอฟต์แวร์และ Quality Assurance');

-- Display summary
SELECT 
    role,
    COUNT(*) as count
FROM users 
GROUP BY role 
ORDER BY 
    CASE role 
        WHEN 'admin' THEN 1
        WHEN 'staff' THEN 2
        WHEN 'instructor' THEN 3
        WHEN 'committee' THEN 4
        WHEN 'student' THEN 5
        ELSE 6
    END;

-- Display total counts
SELECT 
    'Total Users' as description,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'Total Students' as description,
    COUNT(*) as count
FROM students
UNION ALL
SELECT 
    'Total Internships' as description,
    COUNT(*) as count
FROM internships;