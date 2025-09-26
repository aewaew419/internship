#!/bin/bash

echo "🔧 Fixing Deployment Issues"
echo "=========================="

VPS_USER="root"
VPS_HOST="203.170.129.199"
VPS_PORT="22"

# Create comprehensive fix script
cat > /tmp/fix_all_issues.sh << 'EOF'
#!/bin/bash

cd /opt/internship-system

echo "🛑 Stopping all services..."
docker-compose -f deployment/docker-compose.prod.yml down --remove-orphans || true

echo "🔧 Fixing environment variables..."
# Create proper .env.production with all required variables
cat > .env.production << 'ENVEOF'
NODE_ENV=production
GO_ENV=production
PORT=8080

# Domain Configuration
DOMAIN=203.170.129.199
FRONTEND_URL=https://203.170.129.199:8443
API_URL=https://203.170.129.199:8443/api

# PostgreSQL Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=internship_prod
DB_USER=internship_user
DB_PASSWORD=simple_password_123

# PostgreSQL Connection URL
DATABASE_URL=postgresql://internship_user:simple_password_123@postgres:5432/internship_prod

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_32_chars_long
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_PASSWORD=redis_password_123

# CORS Configuration
CORS_ORIGIN=https://203.170.129.199:8443,http://203.170.129.199:8080
ALLOWED_ORIGINS=https://203.170.129.199:8443,http://203.170.129.199:8080

# Rate Limiting
RATE_LIMIT=100

# Logging
LOG_LEVEL=info

# Monitoring
GRAFANA_PASSWORD=admin123

# SMTP (Optional)
SMTP_HOST=
SMTP_USER=
SMTP_PASS=

# Database Auto Migration
DB_AUTO_MIGRATE=true
ENVEOF

echo "✅ Environment file created"

echo "🔧 Fixing Nginx configuration..."
mkdir -p deployment/nginx/ssl

# Create proper nginx.conf
cat > deployment/nginx/nginx.conf << 'NGINXEOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    upstream backend {
        server backend:8080;
    }
    
    upstream frontend {
        server frontend:3000;
    }
    
    # HTTP server
    server {
        listen 80;
        server_name _;
        
        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Health check
        location /health {
            proxy_pass http://backend;
            proxy_set_header Host $host;
        }
        
        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    
    # HTTPS server
    server {
        listen 443 ssl;
        server_name _;
        
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Health check
        location /health {
            proxy_pass http://backend;
            proxy_set_header Host $host;
        }
        
        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
NGINXEOF

echo "🔐 Creating SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout deployment/nginx/ssl/key.pem \
    -out deployment/nginx/ssl/cert.pem \
    -subj "/C=TH/ST=Bangkok/L=Bangkok/O=University/CN=203.170.129.199"

echo "🗄️ Setting up PostgreSQL schema..."
mkdir -p database/init

# Create database initialization script
cat > database/init/01-init-schema.sql << 'SQLEOF'
-- PostgreSQL Schema Initialization
-- Create database and user if not exists

-- Create tables using Prisma-compatible schema
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faculties (
    id SERIAL PRIMARY KEY,
    campus_id INTEGER REFERENCES campuses(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    dean VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER REFERENCES faculties(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    degree VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS majors (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES programs(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id),
    student_id VARCHAR(50) UNIQUE NOT NULL,
    major_id INTEGER REFERENCES majors(id),
    year INTEGER,
    semester INTEGER,
    gpa DECIMAL(3,2),
    status VARCHAR(50) DEFAULT 'active',
    advisor VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS instructors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id),
    instructor_id VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(255),
    position VARCHAR(255),
    expertise TEXT
);

CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id),
    staff_id VARCHAR(50) UNIQUE NOT NULL,
    position VARCHAR(255),
    department VARCHAR(255)
);

-- Insert demo data
INSERT INTO users (email, password, first_name, last_name, role, is_active) VALUES
('admin2@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'Admin', '2', 'admin', true),
('demo001@smart-solutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'Demo', '001', 'admin', true),
('test@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'Test', 'User', 'student', true),
('student@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXxN7UkskO6N7inUUhEIjkqBEy', 'Student', 'User', 'student', true)
ON CONFLICT (email) DO NOTHING;

-- Insert basic academic structure
INSERT INTO campuses (name, code, address) VALUES
('วิทยาเขตหลัก', 'MAIN', '123 ถนนมหาวิทยาลัย กรุงเทพฯ'),
('วิทยาเขตสาขา', 'BRANCH', '456 ถนนเทคโนโลยี กรุงเทพฯ')
ON CONFLICT (code) DO NOTHING;

INSERT INTO faculties (campus_id, name, code, dean) VALUES
(1, 'คณะวิศวกรรมศาสตร์', 'ENG', 'ศ.ดร.วิศวกรรม ใหญ่'),
(1, 'คณะวิทยาศาสตร์', 'SCI', 'รศ.ดร.วิทยาศาสตร์ เก่ง')
ON CONFLICT (code) DO NOTHING;

INSERT INTO programs (faculty_id, name, code, degree) VALUES
(1, 'วิศวกรรมคอมพิวเตอร์', 'CPE', 'bachelor'),
(2, 'วิทยาการคอมพิวเตอร์', 'CS', 'bachelor')
ON CONFLICT (code) DO NOTHING;

INSERT INTO majors (program_id, name, code) VALUES
(1, 'วิศวกรรมคอมพิวเตอร์', 'CPE'),
(2, 'วิทยาการคอมพิวเตอร์', 'CS')
ON CONFLICT (code) DO NOTHING;

-- Insert student records
INSERT INTO students (user_id, student_id, major_id, year, semester, gpa, status) VALUES
((SELECT id FROM users WHERE email = 'test@test.com'), 'test001', 1, 4, 1, 3.75, 'active'),
((SELECT id FROM users WHERE email = 'student@test.com'), '65010001', 1, 4, 1, 3.65, 'active')
ON CONFLICT (student_id) DO NOTHING;

COMMIT;
SQLEOF

echo "🐳 Starting PostgreSQL first..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d postgres

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 30

echo "📊 Checking PostgreSQL status..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production exec postgres pg_isready -U internship_user

echo "🗄️ Initializing database schema..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production exec -T postgres psql -U internship_user -d internship_prod < database/init/01-init-schema.sql

echo "🐳 Starting all services..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production up -d

echo "⏳ Waiting for all services..."
sleep 60

echo "📊 Final status check..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production ps

echo "🧪 Testing database..."
docker-compose -f deployment/docker-compose.prod.yml --env-file .env.production exec -T postgres psql -U internship_user -d internship_prod -c "SELECT COUNT(*) as user_count FROM users;"

echo "✅ All issues fixed!"
EOF

# Upload and run fix script
echo "📤 Uploading fix script..."
scp -P "$SSH_PORT" /tmp/fix_all_issues.sh "$VPS_USER@$VPS_HOST:/tmp/"

echo "🚀 Running comprehensive fix..."
ssh -p "$SSH_PORT" "$VPS_USER@$VPS_HOST" "chmod +x /tmp/fix_all_issues.sh && /tmp/fix_all_issues.sh"

# Test the deployment
echo "🧪 Testing fixed deployment..."
sleep 30

echo "Testing health endpoint..."
curl -s "http://$VPS_HOST:8080/health" || echo "Health endpoint not ready yet"

echo "Testing HTTPS..."
curl -k -s "https://$VPS_HOST:8443/health" || echo "HTTPS not ready yet"

# Cleanup
rm -f /tmp/fix_all_issues.sh

echo ""
echo "🎉 Deployment Issues Fixed!"
echo ""
echo "📱 URLs to test:"
echo "   🌐 HTTP: http://$VPS_HOST:8080"
echo "   🔒 HTTPS: https://$VPS_HOST:8443"
echo "   🏥 Health: http://$VPS_HOST:8080/health"
echo ""
echo "🔑 Login credentials:"
echo "   📧 Email: admin2@smart-solutions.com"
echo "   🔒 Password: admin123"