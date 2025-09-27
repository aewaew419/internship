-- Test database initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    student_id VARCHAR(20) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_th VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    industry VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id),
    student_id VARCHAR(20) UNIQUE NOT NULL,
    major VARCHAR(100),
    year INTEGER,
    gpa DECIMAL(3,2),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Internships table
CREATE TABLE IF NOT EXISTS internships (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    student_id INTEGER REFERENCES students(id),
    company_id INTEGER REFERENCES companies(id),
    position VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test data
INSERT INTO users (email, password, first_name, last_name, role, student_id, is_active) VALUES
('student1@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมชาย', 'ใจดี', 'student', '6401001', true),
('student2@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมหญิง', 'รักเรียน', 'student', '6401002', true),
('student3@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'วิชัย', 'ขยันเรียน', 'student', '6401003', true),
('admin@smart-solutions.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ผู้ดูแล', 'ระบบ', 'admin', NULL, true),
('instructor@university.ac.th', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'อาจารย์', 'ที่ปรึกษา', 'instructor', NULL, true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO companies (name, name_th, address, phone, email, website, industry, description, is_active) VALUES
('Smart Solutions Co., Ltd.', 'บริษัท สมาร์ท โซลูชั่นส์ จำกัด', '123 ถนนเทคโนโลยี กรุงเทพฯ 10400', '02-123-4567', 'hr@smart-solutions.com', 'https://smart-solutions.com', 'Software Development', 'บริษัทพัฒนาซอฟต์แวร์และเทคโนโลยี', true),
('Tech Innovation Ltd.', 'บริษัท เทค อินโนเวชั่น จำกัด', '456 ถนนนวัตกรรม กรุงเทพฯ 10110', '02-234-5678', 'contact@techinnovation.co.th', 'https://techinnovation.co.th', 'Technology', 'บริษัทเทคโนโลยีและนวัตกรรม', true),
('Digital Future Corp.', 'บริษัท ดิจิทัล ฟิวเจอร์ จำกัด', '789 ถนนอนาคต กรุงเทพฯ 10330', '02-345-6789', 'info@digitalfuture.com', 'https://digitalfuture.com', 'Digital Services', 'บริษัทให้บริการดิจิทัล', true);

INSERT INTO students (user_id, student_id, major, year, gpa, status) VALUES
((SELECT id FROM users WHERE student_id = '6401001'), '6401001', 'วิทยาการคอมพิวเตอร์', 4, 3.25, 'active'),
((SELECT id FROM users WHERE student_id = '6401002'), '6401002', 'เทคโนโลยีสารสนเทศ', 4, 3.50, 'active'),
((SELECT id FROM users WHERE student_id = '6401003'), '6401003', 'วิศวกรรมซอฟต์แวร์', 3, 3.75, 'active')
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO internships (student_id, company_id, position, start_date, end_date, status, description) VALUES
((SELECT id FROM students WHERE student_id = '6401001'), 1, 'Frontend Developer Intern', '2024-06-01', '2024-08-31', 'approved', 'ฝึกงานด้านการพัฒนา Frontend ด้วย React และ Next.js'),
((SELECT id FROM students WHERE student_id = '6401002'), 2, 'Backend Developer Intern', '2024-06-15', '2024-09-15', 'in_progress', 'ฝึกงานด้านการพัฒนา Backend ด้วย Go และ PostgreSQL'),
((SELECT id FROM students WHERE student_id = '6401003'), 3, 'Full Stack Developer Intern', '2024-07-01', '2024-09-30', 'pending', 'ฝึกงานด้านการพัฒนา Full Stack Application');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_internships_student_id ON internships(student_id);
CREATE INDEX IF NOT EXISTS idx_internships_company_id ON internships(company_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_internships_updated_at BEFORE UPDATE ON internships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();