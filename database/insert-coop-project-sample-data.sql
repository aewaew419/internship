-- ข้อมูลตัวอย่างสำหรับระบบเงื่อนไขวิชาสหกิจและหัวข้อโปรเจคฝึกงาน
-- รันไฟล์นี้หลังจาก add-coop-project-system.sql แล้ว

-- เพิ่มเงื่อนไขวิชาสหกิจ
INSERT INTO coop_requirements (requirement_code, name, name_th, description, requirement_type, category, min_score, max_score, passing_score, min_duration_days, prerequisites, conditions, created_by) VALUES

-- เงื่อนไขด้านวิชาการ
('ACAD001', 'Minimum GPA Requirement', 'เงื่อนไขเกรดเฉลี่ยขั้นต่ำ', 'นักศึกษาต้องมีเกรดเฉลี่ยสะสมไม่ต่ำกว่า 2.00', 'academic', 'mandatory', 2.00, 4.00, 2.00, NULL, '{}', '{"gpa_check": true}', 1),

('ACAD002', 'Completed Credits Requirement', 'เงื่อนไขหน่วยกิตที่ผ่าน', 'นักศึกษาต้องผ่านหน่วยกิตไม่น้อยกว่า 90 หน่วยกิต', 'academic', 'mandatory', 90, NULL, 90, NULL, '{}', '{"min_credits": 90}', 1),

('ACAD003', 'Core Subjects Completion', 'เงื่อนไขวิชาแกนผ่าน', 'นักศึกษาต้องผ่านวิชาแกนครบถ้วน', 'academic', 'mandatory', NULL, NULL, NULL, NULL, '{}', '{"core_subjects_required": true}', 1),

-- เงื่อนไขด้านโปรเจค
('PROJ001', 'Project Topic Selection', 'การเลือกหัวข้อโปรเจค', 'นักศึกษาต้องเลือกหัวข้อโปรเจคหรือกำหนดหัวข้อเอง', 'project', 'mandatory', NULL, NULL, NULL, NULL, '["ACAD001", "ACAD002"]', '{"project_required": true}', 1),

('PROJ002', 'Project Proposal Approval', 'การอนุมัติหัวข้อโปรเจค', 'หัวข้อโปรเจคต้องได้รับการอนุมัติจากอาจารย์ที่ปรึกษา', 'project', 'mandatory', NULL, NULL, NULL, NULL, '["PROJ001"]', '{"approval_required": true}', 1),

('PROJ003', 'Weekly Progress Reports', 'รายงานความคืบหน้าประจำสัปดาห์', 'นักศึกษาต้องส่งรายงานความคืบหน้าทุกสัปดาห์', 'project', 'mandatory', NULL, NULL, NULL, NULL, '["PROJ002"]', '{"weekly_reports": true, "min_reports": 12}', 1),

('PROJ004', 'Final Project Presentation', 'การนำเสนอโปรเจคขั้นสุดท้าย', 'นักศึกษาต้องนำเสนอผลงานโปรเจคต่อคณะกรรมการ', 'project', 'mandatory', 0, 100, 60, NULL, '["PROJ003"]', '{"presentation_required": true, "min_score": 60}', 1),

-- เงื่อนไขด้านเอกสาร
('DOC001', 'Internship Application', 'การยื่นใบสมัครฝึกงาน', 'นักศึกษาต้องยื่นใบสมัครฝึกงานภายในกำหนด', 'document', 'mandatory', NULL, NULL, NULL, NULL, '["ACAD001", "ACAD002"]', '{"application_deadline": true}', 1),

('DOC002', 'Company Acceptance Letter', 'หนังสือตอบรับจากบริษัท', 'นักศึกษาต้องมีหนังสือตอบรับจากบริษัท', 'document', 'mandatory', NULL, NULL, NULL, NULL, '["DOC001"]', '{"acceptance_required": true}', 1),

('DOC003', 'Final Report Submission', 'การส่งรายงานฉบับสมบูรณ์', 'นักศึกษาต้องส่งรายงานฉบับสมบูรณ์ภายในกำหนด', 'document', 'mandatory', NULL, NULL, NULL, NULL, '["PROJ003"]', '{"final_report_required": true}', 1),

-- เงื่อนไขด้านการประเมิน
('EVAL001', 'Company Evaluation', 'การประเมินจากบริษัท', 'นักศึกษาต้องได้รับการประเมินจากบริษัทไม่ต่ำกว่า 60%', 'evaluation', 'mandatory', 0, 100, 60, NULL, '["DOC002"]', '{"company_evaluation": true, "min_score": 60}', 1),

('EVAL002', 'Supervisor Evaluation', 'การประเมินจากอาจารย์นิเทศ', 'นักศึกษาต้องได้รับการประเมินจากอาจารย์นิเทศไม่ต่ำกว่า 60%', 'evaluation', 'mandatory', 0, 100, 60, NULL, '["DOC002"]', '{"supervisor_evaluation": true, "min_score": 60}', 1),

-- เงื่อนไขด้านการเข้าร่วม
('ATT001', 'Minimum Attendance', 'การเข้าร่วมฝึกงานขั้นต่ำ', 'นักศึกษาต้องเข้าร่วมฝึกงานไม่น้อยกว่า 16 สัปดาห์', 'attendance', 'mandatory', NULL, NULL, NULL, 112, '["DOC002"]', '{"min_weeks": 16, "min_days": 112}', 1);

-- เพิ่มหัวข้อโปรเจคฝึกงาน
INSERT INTO project_topics (title, title_en, description, description_en, project_type, difficulty_level, technologies, skills_required, learning_outcomes, scope, deliverables, timeline_weeks, company_id, department, mentor_name, mentor_email, mentor_phone, max_students, created_by) VALUES

-- โปรเจคจาก Smart Solutions
('ระบบจัดการคลังสินค้าออนไลน์', 'Online Warehouse Management System', 
'พัฒนาระบบจัดการคลังสินค้าแบบออนไลน์ เพื่อติดตามสินค้าคงคลัง การรับ-จ่ายสินค้า และการรายงาน', 
'Develop an online warehouse management system to track inventory, manage stock in/out, and generate reports',
'development', 'medium',
'["React", "Node.js", "PostgreSQL", "Express.js", "Material-UI"]',
'["JavaScript", "Database Design", "API Development", "Frontend Development"]',
'["Web Application Development", "Database Management", "API Integration", "User Interface Design"]',
'พัฒนาระบบจัดการคลังสินค้าครบวงจร ตั้งแต่การรับสินค้าเข้า การจัดเก็บ การเบิกจ่าย และการรายงาน',
'["Web Application", "Database Schema", "API Documentation", "User Manual", "Test Cases"]',
16, 1, 'IT Department', 'คุณสมชาย ใจดี', 'somchai@smart-solutions.com', '02-123-4567', 2, 1),

('แอปพลิเคชันติดตามการส่งมอบสินค้า', 'Delivery Tracking Mobile App',
'พัฒนาแอปพลิเคชันมือถือสำหรับติดตามการส่งมอบสินค้า พร้อมระบบแจ้งเตือนและการอัพเดทสถานะแบบเรียลไทม์',
'Develop a mobile application for delivery tracking with real-time notifications and status updates',
'development', 'hard',
'["React Native", "Firebase", "Node.js", "MongoDB", "Socket.io"]',
'["Mobile Development", "Real-time Systems", "Push Notifications", "GPS Integration"]',
'["Mobile App Development", "Real-time Communication", "Location Services", "Cloud Integration"]',
'พัฒนาแอปมือถือสำหรับลูกค้าและพนักงานส่งของ ติดตามสถานะการส่งมอบแบบเรียลไทม์',
'["Mobile Application (iOS/Android)", "Backend API", "Admin Dashboard", "Documentation"]',
16, 1, 'Mobile Development', 'คุณสมหญิง รักเทคโนโลยี', 'somying@smart-solutions.com', '02-123-4568', 1, 1),

-- โปรเจคจาก Tech Innovation
('ระบบวิเคราะห์ข้อมูลการขายด้วย AI', 'AI-Powered Sales Analytics System',
'พัฒนาระบบวิเคราะห์ข้อมูลการขายโดยใช้เทคนิค Machine Learning เพื่อทำนายแนวโน้มการขายและแนะนำกลยุทธ์',
'Develop an AI-powered sales analytics system using machine learning to predict sales trends and recommend strategies',
'analysis', 'expert',
'["Python", "TensorFlow", "Pandas", "Flask", "PostgreSQL", "Docker"]',
'["Machine Learning", "Data Analysis", "Python Programming", "Statistical Analysis"]',
'["AI/ML Implementation", "Data Science", "Predictive Analytics", "Business Intelligence"]',
'วิเคราะห์ข้อมูลการขายในอดีต สร้างโมเดลทำนาย และพัฒนาระบบแนะนำกลยุทธ์การขาย',
'["ML Model", "Analytics Dashboard", "API Service", "Research Report", "Deployment Guide"]',
20, 2, 'Data Science Team', 'ดร.วิชัย ฉลาดมาก', 'wichai@techinnovation.co.th', '02-234-5678', 1, 1),

('ระบบจัดการเอกสารอัจฉริยะ', 'Intelligent Document Management System',
'พัฒนาระบบจัดการเอกสารที่ใช้ AI ในการจัดหมวดหมู่ ค้นหา และสกัดข้อมูลจากเอกสารอัตโนมัติ',
'Develop an intelligent document management system using AI for automatic categorization, search, and data extraction',
'development', 'hard',
'["Python", "FastAPI", "OpenCV", "Tesseract OCR", "Elasticsearch", "Vue.js"]',
'["Computer Vision", "OCR", "Natural Language Processing", "Search Engine"]',
'["AI Integration", "Document Processing", "Search Optimization", "Web Development"]',
'พัฒนาระบบที่สามารถอ่าน จัดหมวดหมู่ และค้นหาเอกสารได้อย่างอัจฉริยะ',
'["Web Application", "AI Models", "Search Engine", "API Documentation", "User Guide"]',
18, 2, 'AI Research', 'คุณปัญญา เก่งมาก', 'panya@techinnovation.co.th', '02-234-5679', 2, 1),

-- โปรเจคจาก Digital Future
('แพลตฟอร์มอีคอมเมิร์ซสำหรับ SME', 'E-commerce Platform for SMEs',
'พัฒนาแพลตฟอร์มอีคอมเมิร์ซที่ออกแบบมาเฉพาะสำหรับธุรกิจขนาดเล็กและกลาง พร้อมระบบจัดการครบวงจร',
'Develop an e-commerce platform specifically designed for small and medium enterprises with comprehensive management features',
'development', 'medium',
'["Next.js", "Stripe API", "Prisma", "PostgreSQL", "Tailwind CSS", "Vercel"]',
'["Full-stack Development", "Payment Integration", "Database Design", "UI/UX Design"]',
'["E-commerce Development", "Payment Systems", "Business Logic", "User Experience"]',
'สร้างแพลตฟอร์มที่ช่วยให้ SME สามารถขายสินค้าออนไลน์ได้อย่างง่ายดาย',
'["E-commerce Website", "Admin Panel", "Payment Integration", "Mobile Responsive", "Documentation"]',
16, 3, 'Web Development', 'คุณดิจิทัล ฟิวเจอร์', 'digital@digitalfuture.com', '02-345-6789', 2, 1),

('ระบบจองห้องประชุมอัจฉริยะ', 'Smart Meeting Room Booking System',
'พัฒนาระบบจองห้องประชุมที่เชื่อมต่อกับ IoT sensors เพื่อตรวจสอบการใช้งานจริงและปรับปรุงประสิทธิภาพ',
'Develop a smart meeting room booking system integrated with IoT sensors to monitor actual usage and optimize efficiency',
'implementation', 'hard',
'["React", "Node.js", "MQTT", "InfluxDB", "Grafana", "Arduino"]',
'["IoT Integration", "Real-time Data", "Sensor Programming", "Dashboard Development"]',
'["IoT Systems", "Real-time Monitoring", "Data Visualization", "Hardware Integration"]',
'พัฒนาระบบจองห้องประชุมที่เชื่อมต่อกับเซ็นเซอร์ตรวจจับการเข้าใช้งานจริง',
'["Web Application", "IoT Dashboard", "Sensor Setup", "Data Analytics", "Installation Guide"]',
18, 3, 'IoT Solutions', 'คุณอนาคต สมาร์ท', 'anakom@digitalfuture.com', '02-345-6790', 1, 1),

-- โปรเจคที่ไม่มีบริษัท (นักศึกษากำหนดเอง)
('ระบบจัดการห้องสมุดดิจิทัล', 'Digital Library Management System',
'พัฒนาระบบจัดการห้องสมุดแบบดิจิทัล สำหรับการยืม-คืนหนังสือ การค้นหา และการจัดการทรัพยากร',
'Develop a digital library management system for book lending, searching, and resource management',
'development', 'medium',
'["Laravel", "MySQL", "Bootstrap", "jQuery", "Chart.js"]',
'["PHP Development", "Database Design", "Web Development", "System Analysis"]',
'["Web Application Development", "Database Management", "System Design", "User Interface"]',
'พัฒนาระบบจัดการห้องสมุดครบวงจร ตั้งแต่การลงทะเบียนสมาชิก การยืม-คืน การค้นหา และการรายงาน',
'["Web Application", "Database Schema", "User Manual", "System Documentation", "Test Report"]',
14, NULL, NULL, NULL, NULL, NULL, 2, 1),

('แอปพลิเคชันจัดการการเงินส่วนบุคคล', 'Personal Finance Management App',
'พัฒนาแอปพลิเคชันมือถือสำหรับจัดการการเงินส่วนบุคคล ติดตามรายรับ-รายจ่าย และวางแผนการออม',
'Develop a mobile application for personal finance management, tracking income-expenses, and savings planning',
'development', 'medium',
'["Flutter", "Firebase", "Dart", "SQLite", "Chart.js"]',
'["Mobile Development", "Database Design", "Financial Calculations", "UI/UX Design"]',
'["Mobile App Development", "Financial Systems", "Data Visualization", "User Experience"]',
'สร้างแอปมือถือที่ช่วยให้ผู้ใช้จัดการการเงินส่วนตัวได้อย่างมีประสิทธิภาพ',
'["Mobile Application", "Backend Service", "Financial Reports", "User Guide", "Test Cases"]',
12, NULL, NULL, NULL, NULL, NULL, 1, 1);

-- เพิ่มเกณฑ์การประเมินโปรเจค
INSERT INTO project_evaluation_criteria (name, name_th, description, category, weight, max_score, scoring_rubric) VALUES
('Technical Implementation', 'การพัฒนาเทคนิค', 'ความสามารถในการพัฒนาและใช้เทคโนโลยี', 'technical', 0.30, 100, 
'{"excellent": {"score": 90, "description": "ใช้เทคโนโลジีได้อย่างเชี่ยวชาญ มีนวัตกรรม"}, "good": {"score": 75, "description": "ใช้เทคโนโลยีได้ดี ทำงานถูกต้อง"}, "fair": {"score": 60, "description": "ใช้เทคโนโลยีได้พอใช้"}, "poor": {"score": 40, "description": "ใช้เทคโนโลยีได้น้อย มีปัญหา"}}'),

('Project Management', 'การจัดการโปรเจค', 'ความสามารถในการวางแผนและจัดการโปรเจค', 'technical', 0.20, 100,
'{"excellent": {"score": 90, "description": "วางแผนและจัดการได้ดีเยี่ยม ทำตามกำหนดเวลา"}, "good": {"score": 75, "description": "วางแผนและจัดการได้ดี"}, "fair": {"score": 60, "description": "วางแผนและจัดการได้พอใช้"}, "poor": {"score": 40, "description": "วางแผนและจัดการไม่ดี"}}'),

('Documentation Quality', 'คุณภาพเอกสาร', 'ความครบถ้วนและคุณภาพของเอกสารประกอบ', 'documentation', 0.15, 100,
'{"excellent": {"score": 90, "description": "เอกสารครบถ้วน ชัดเจน มีคุณภาพสูง"}, "good": {"score": 75, "description": "เอกสารครบถ้วน ชัดเจน"}, "fair": {"score": 60, "description": "เอกสารพอใช้"}, "poor": {"score": 40, "description": "เอกสารไม่ครบถ้วน ไม่ชัดเจน"}}'),

('Presentation Skills', 'ทักษะการนำเสนอ', 'ความสามารถในการนำเสนอผลงาน', 'presentation', 0.20, 100,
'{"excellent": {"score": 90, "description": "นำเสนอได้ดีเยี่ยม ชัดเจน น่าสนใจ"}, "good": {"score": 75, "description": "นำเสนอได้ดี ชัดเจน"}, "fair": {"score": 60, "description": "นำเสนอได้พอใช้"}, "poor": {"score": 40, "description": "นำเสนอไม่ดี ไม่ชัดเจน"}}'),

('Innovation & Creativity', 'นวัตกรรมและความคิดสร้างสรรค์', 'ความคิดสร้างสรรค์และนวัตกรรมในโปรเจค', 'innovation', 0.15, 100,
'{"excellent": {"score": 90, "description": "มีความคิดสร้างสรรค์สูง นวัตกรรมใหม่"}, "good": {"score": 75, "description": "มีความคิดสร้างสรรค์ดี"}, "fair": {"score": 60, "description": "มีความคิดสร้างสรรค์พอใช้"}, "poor": {"score": 40, "description": "ขาดความคิดสร้างสรรค์"}}');

-- เพิ่มข้อมูลการฝึกงานของนักศึกษา (student_trainings)
INSERT INTO student_trainings (student_id, internship_id, project_topic_id, has_project, semester, academic_year, start_date, end_date, status, created_by) VALUES
-- นักศึกษา test001 - มีโปรเจค
((SELECT id FROM students WHERE student_id = 'test001'), 
 (SELECT id FROM internships WHERE student_id = (SELECT id FROM students WHERE student_id = 'test001')),
 1, true, '2567/2', '2567', '2024-06-01', '2024-09-30', 'in_progress', 1),

-- นักศึกษา u6800001 - มีโปรเจค
((SELECT id FROM students WHERE student_id = 'u6800001'), 
 (SELECT id FROM internships WHERE student_id = (SELECT id FROM students WHERE student_id = 'u6800001')),
 3, true, '2567/2', '2567', '2024-06-15', '2024-10-15', 'in_progress', 1),

-- นักศึกษา u6800002 - ไม่มีโปรเจค
((SELECT id FROM students WHERE student_id = 'u6800002'), 
 (SELECT id FROM internships WHERE student_id = (SELECT id FROM students WHERE student_id = 'u6800002')),
 NULL, false, '2567/2', '2567', '2024-07-01', '2024-10-31', 'in_progress', 1),

-- นักศึกษา u6800003 - เสร็จแล้ว มีโปรเจค
((SELECT id FROM students WHERE student_id = 'u6800003'), 
 (SELECT id FROM internships WHERE student_id = (SELECT id FROM students WHERE student_id = 'u6800003')),
 7, true, '2567/1', '2567', '2024-01-15', '2024-05-15', 'completed', 1);

-- เพิ่มการสมัครโปรเจค
INSERT INTO project_applications (student_training_id, project_topic_id, priority, motivation, relevant_skills, status, approved_by, approved_at) VALUES
-- นักศึกษา test001 สมัครโปรเจค 1
(1, 1, 1, 'สนใจในการพัฒนาระบบจัดการคลังสินค้า เพราะต้องการเรียนรู้เกี่ยวกับ inventory management และ database design', 
 '["JavaScript", "React", "Database"]', 'approved', 1, '2024-05-20 10:00:00'),

-- นักศึกษา u6800001 สมัครโปรเจค 3
(2, 3, 1, 'สนใจในด้าน AI และ Machine Learning อยากเรียนรู้การประยุกต์ใช้ในธุรกิจจริง', 
 '["Python", "Data Analysis", "Statistics"]', 'approved', 1, '2024-06-01 14:30:00'),

-- นักศึกษา u6800003 สมัครโปรเจค 7 (เสร็จแล้ว)
(4, 7, 1, 'สนใจพัฒนาระบบจัดการห้องสมุด เพื่อนำไปใช้ในมหาวิทยาลัย', 
 '["PHP", "Laravel", "MySQL"]', 'approved', 1, '2024-01-10 09:00:00');

-- เพิ่มความคืบหน้าโปรเจค
INSERT INTO project_progress (student_training_id, week_number, progress_percentage, activities_completed, current_activities, next_week_plan, self_assessment, status) VALUES
-- ความคืบหน้าของนักศึกษา test001
(1, 1, 10, 'ศึกษาความต้องการของระบบ วิเคราะห์ requirement', 'ออกแบบ database schema', 'เริ่มพัฒนา backend API', 4.0, 'approved'),
(1, 2, 25, 'ออกแบบ database schema เสร็จ เริ่มพัฒนา backend', 'พัฒนา API สำหรับจัดการสินค้า', 'พัฒนา frontend components', 4.2, 'approved'),
(1, 3, 40, 'พัฒนา API จัดการสินค้าเสร็จ ทดสอบ API', 'พัฒนา frontend หน้าจัดการสินค้า', 'เชื่อมต่อ frontend กับ backend', 4.1, 'approved'),

-- ความคืบหน้าของนักศึกษา u6800001
(2, 1, 15, 'ศึกษาข้อมูลการขาย วิเคราะห์ dataset', 'ทำความสะอาดข้อมูล (data cleaning)', 'สร้าง exploratory data analysis', 4.3, 'approved'),
(2, 2, 30, 'ทำ data cleaning และ EDA เสร็จ', 'สร้าง feature engineering', 'เริ่มสร้าง ML model', 4.5, 'approved'),

-- ความคืบหน้าของนักศึกษา u6800003 (เสร็จแล้ว)
(4, 12, 95, 'ระบบพัฒนาเสร็จสมบูรณ์ ทดสอบระบบเรียบร้อย', 'เขียนเอกสารคู่มือการใช้งาน', 'เตรียมการนำเสนอ', 4.8, 'approved'),
(4, 13, 100, 'เอกสารเสร็จสมบูรณ์ นำเสนอโปรเจคเรียบร้อย', 'ส่งมอบระบบให้ห้องสมุด', 'ปิดโปรเจค', 5.0, 'approved');

-- เพิ่มการตรวจสอบเงื่อนไข
INSERT INTO student_requirement_checks (student_training_id, requirement_id, status, score, checked_by, checked_at, check_notes) VALUES
-- การตรวจสอบของนักศึกษา test001
(1, 1, 'passed', 3.25, 1, '2024-05-15 10:00:00', 'เกรดเฉลี่ย 3.25 ผ่านเกณฑ์'),
(1, 2, 'passed', 95, 1, '2024-05-15 10:00:00', 'ผ่านหน่วยกิต 95 หน่วยกิต'),
(1, 3, 'passed', NULL, 1, '2024-05-15 10:00:00', 'ผ่านวิชาแกนครบถ้วน'),
(1, 4, 'passed', NULL, 1, '2024-05-20 10:00:00', 'เลือกหัวข้อโปรเจคแล้ว'),
(1, 5, 'passed', NULL, 1, '2024-05-20 10:00:00', 'หัวข้อโปรเจคได้รับอนุมัติ'),
(1, 6, 'in_progress', NULL, NULL, NULL, 'กำลังส่งรายงานประจำสัปดาห์'),

-- การตรวจสอบของนักศึกษา u6800003 (เสร็จแล้ว)
(4, 1, 'passed', 3.80, 1, '2024-01-10 09:00:00', 'เกรดเฉลี่ย 3.80 ผ่านเกณฑ์'),
(4, 2, 'passed', 110, 1, '2024-01-10 09:00:00', 'ผ่านหน่วยกิต 110 หน่วยกิต'),
(4, 3, 'passed', NULL, 1, '2024-01-10 09:00:00', 'ผ่านวิชาแกนครบถ้วน'),
(4, 4, 'passed', NULL, 1, '2024-01-10 09:00:00', 'เลือกหัวข้อโปรเจคแล้ว'),
(4, 5, 'passed', NULL, 1, '2024-01-10 09:00:00', 'หัวข้อโปรเจคได้รับอนุมัติ'),
(4, 6, 'passed', NULL, 1, '2024-05-10 16:00:00', 'ส่งรายงานครบ 13 สัปดาห์'),
(4, 7, 'passed', 85, 1, '2024-05-15 14:00:00', 'นำเสนอโปรเจคได้คะแนน 85%'),
(4, 11, 'passed', 88, 1, '2024-05-15 16:00:00', 'ได้รับการประเมินจากบริษัท 88%'),
(4, 12, 'passed', 90, 1, '2024-05-15 17:00:00', 'ได้รับการประเมินจากอาจารย์นิเทศ 90%');

-- สร้าง Views สำหรับการใช้งาน

-- View: สรุปสถานะโปรเจค
CREATE OR REPLACE VIEW project_summary AS
SELECT 
    pt.id,
    pt.title,
    pt.project_type,
    pt.difficulty_level,
    c.name as company_name,
    pt.max_students,
    pt.current_students,
    pt.status,
    COUNT(pa.id) as total_applications,
    COUNT(CASE WHEN pa.status = 'approved' THEN 1 END) as approved_applications
FROM project_topics pt
LEFT JOIN companies c ON pt.company_id = c.id
LEFT JOIN project_applications pa ON pt.id = pa.project_topic_id
GROUP BY pt.id, pt.title, pt.project_type, pt.difficulty_level, c.name, pt.max_students, pt.current_students, pt.status
ORDER BY pt.created_at DESC;

-- View: สถานะการฝึกงานของนักศึกษา
CREATE OR REPLACE VIEW student_training_status AS
SELECT 
    s.student_id,
    CONCAT(u.first_name, ' ', u.last_name) as student_name,
    st.semester,
    st.academic_year,
    st.status as training_status,
    st.has_project,
    pt.title as project_title,
    c.name as company_name,
    st.start_date,
    st.end_date,
    COUNT(src.id) as total_requirements,
    COUNT(CASE WHEN src.status = 'passed' THEN 1 END) as passed_requirements,
    COUNT(CASE WHEN src.status = 'failed' THEN 1 END) as failed_requirements,
    COUNT(CASE WHEN src.status = 'in_progress' THEN 1 END) as in_progress_requirements
FROM student_trainings st
JOIN students s ON st.student_id = s.id
JOIN users u ON s.user_id = u.id
LEFT JOIN project_topics pt ON st.project_topic_id = pt.id
LEFT JOIN companies c ON pt.company_id = c.id
LEFT JOIN student_requirement_checks src ON st.id = src.student_training_id
GROUP BY s.student_id, u.first_name, u.last_name, st.semester, st.academic_year, 
         st.status, st.has_project, pt.title, c.name, st.start_date, st.end_date, st.id
ORDER BY st.academic_year DESC, st.semester DESC, s.student_id;

-- View: ความคืบหน้าโปรเจคล่าสุด
CREATE OR REPLACE VIEW latest_project_progress AS
SELECT 
    st.id as training_id,
    s.student_id,
    CONCAT(u.first_name, ' ', u.last_name) as student_name,
    pt.title as project_title,
    pp.week_number,
    pp.progress_percentage,
    pp.self_assessment,
    pp.status as progress_status,
    pp.created_at as last_update
FROM student_trainings st
JOIN students s ON st.student_id = s.id
JOIN users u ON s.user_id = u.id
LEFT JOIN project_topics pt ON st.project_topic_id = pt.id
LEFT JOIN project_progress pp ON st.id = pp.student_training_id
WHERE pp.week_number = (
    SELECT MAX(week_number) 
    FROM project_progress pp2 
    WHERE pp2.student_training_id = st.id
)
AND st.has_project = true
ORDER BY pp.created_at DESC;

-- แสดงสรุปข้อมูล
SELECT 'สรุปหัวข้อโปรเจค' as title;
SELECT * FROM project_summary;

SELECT 'สถานะการฝึกงานของนักศึกษา' as title;
SELECT * FROM student_training_status;

SELECT 'ความคืบหน้าโปรเจคล่าสุด' as title;
SELECT * FROM latest_project_progress;

COMMIT;