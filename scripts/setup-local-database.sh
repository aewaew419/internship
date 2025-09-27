#!/bin/bash

echo "🗄️ Setup Local Database for Testing"
echo "=================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "📥 Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "🐳 Starting PostgreSQL database..."

# Stop existing container if running
docker stop internship_postgres_local 2>/dev/null || true
docker rm internship_postgres_local 2>/dev/null || true

# Start PostgreSQL container
docker run -d \
  --name internship_postgres_local \
  -e POSTGRES_DB=internship_demo \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15-alpine

echo "⏳ Waiting for database to start..."
sleep 10

# Test connection
echo "🧪 Testing database connection..."
if docker exec internship_postgres_local pg_isready -U postgres; then
    echo "✅ Database is ready!"
else
    echo "❌ Database failed to start"
    exit 1
fi

echo "📊 Creating demo data..."

# Create demo data
docker exec -i internship_postgres_local psql -U postgres -d internship_demo << 'EOF'
-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    student_id VARCHAR(20) UNIQUE NOT NULL,
    major VARCHAR(100),
    year INTEGER,
    gpa DECIMAL(3,2),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS internships (
    id SERIAL PRIMARY KEY,
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

-- Insert demo data
INSERT INTO users (email, password, first_name, last_name, role, student_id, is_active) VALUES
('student1@university.ac.th', 'password123', 'สมชาย', 'ใจดี', 'student', '6401001', true),
('student2@university.ac.th', 'password123', 'สมหญิง', 'รักเรียน', 'student', '6401002', true),
('student3@university.ac.th', 'password123', 'วิชัย', 'ขยันเรียน', 'student', '6401003', true),
('admin@university.ac.th', 'admin123', 'ผู้ดูแล', 'ระบบ', 'admin', NULL, true),
('instructor@university.ac.th', 'instructor123', 'อาจารย์', 'ที่ปรึกษา', 'instructor', NULL, true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO companies (name, name_th, address, phone, email, website, industry, description, is_active) VALUES
('Smart Solutions Co., Ltd.', 'บริษัท สมาร์ท โซลูชั่นส์ จำกัด', '123 ถนนเทคโนโลยี กรุงเทพฯ 10400', '02-123-4567', 'hr@smart-solutions.com', 'https://smart-solutions.com', 'Software Development', 'บริษัทพัฒนาซอฟต์แวร์และเทคโนโลยี', true),
('Tech Innovation Ltd.', 'บริษัท เทค อินโนเวชั่น จำกัด', '456 ถนนนวัตกรรม กรุงเทพฯ 10110', '02-234-5678', 'contact@techinnovation.co.th', 'https://techinnovation.co.th', 'Technology', 'บริษัทเทคโนโลยีและนวัตกรรม', true),
('Digital Future Corp.', 'บริษัท ดิจิทัล ฟิวเจอร์ จำกัด', '789 ถนนอนาคต กรุงเทพฯ 10330', '02-345-6789', 'info@digitalfuture.com', 'https://digitalfuture.com', 'Digital Services', 'บริษัทให้บริการดิจิทัล', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO students (user_id, student_id, major, year, gpa, status) VALUES
((SELECT id FROM users WHERE student_id = '6401001'), '6401001', 'วิทยาการคอมพิวเตอร์', 4, 3.25, 'active'),
((SELECT id FROM users WHERE student_id = '6401002'), '6401002', 'เทคโนโลยีสารสนเทศ', 4, 3.50, 'active'),
((SELECT id FROM users WHERE student_id = '6401003'), '6401003', 'วิศวกรรมซอฟต์แวร์', 3, 3.75, 'active')
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO internships (student_id, company_id, position, start_date, end_date, status, description) VALUES
((SELECT id FROM students WHERE student_id = '6401001'), 1, 'Frontend Developer Intern', '2024-06-01', '2024-08-31', 'approved', 'ฝึกงานด้านการพัฒนา Frontend ด้วย React และ Next.js'),
((SELECT id FROM students WHERE student_id = '6401002'), 2, 'Backend Developer Intern', '2024-06-15', '2024-09-15', 'in_progress', 'ฝึกงานด้านการพัฒนา Backend ด้วย Go และ PostgreSQL'),
((SELECT id FROM students WHERE student_id = '6401003'), 3, 'Full Stack Developer Intern', '2024-07-01', '2024-09-30', 'pending', 'ฝึกงานด้านการพัฒนา Full Stack Application');

EOF

echo ""
echo "✅ Local database setup complete!"
echo ""
echo "📋 Database Information:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: internship_demo"
echo "   Username: postgres"
echo "   Password: password"
echo ""
echo "🔑 Demo Login Accounts:"
echo "   รหัสนักศึกษา: 6401001, รหัสผ่าน: password123 (สมชาย ใจดี)"
echo "   รหัสนักศึกษา: 6401002, รหัสผ่าน: password123 (สมหญิง รักเรียน)"
echo "   รหัสนักศึกษา: 6401003, รหัสผ่าน: password123 (วิชัย ขยันเรียน)"
echo ""
echo "🚀 Next steps:"
echo "   1. Run: ./run-local-with-old-design.sh"
echo "   2. Open: http://localhost:3000"
echo "   3. Login with demo accounts"
echo ""
echo "🛑 To stop database: docker stop internship_postgres_local"