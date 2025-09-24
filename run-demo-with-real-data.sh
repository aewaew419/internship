#!/bin/bash

# Demo Setup Script with Real Data
# สคริปต์สำหรับรัน Demo ด้วยข้อมูลจริง

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

print_header() {
    echo -e "${BOLD}${BLUE}$1${NC}"
    echo -e "${BLUE}$(printf '=%.0s' {1..60})${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_demo() {
    echo -e "${MAGENTA}🎬 $1${NC}"
}

print_header "🎬 Demo Setup - Internship Management System"
echo ""
print_info "กำลังเตรียมระบบสำหรับการ Demo ด้วยข้อมูลจริง"
echo ""

# Step 1: Check system requirements
print_header "1. ตรวจสอบความพร้อมของระบบ"

# Check Go
if command -v go &> /dev/null; then
    GO_VERSION=$(go version | cut -d' ' -f3)
    print_success "Go: $GO_VERSION"
else
    print_error "Go ไม่ได้ติดตั้ง"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js: $NODE_VERSION"
else
    print_error "Node.js ไม่ได้ติดตั้ง"
    exit 1
fi

# Check project structure
if [ -d "apps/backend" ] && [ -d "apps/frontend" ]; then
    print_success "Project structure พร้อม"
else
    print_error "Project structure ไม่สมบูรณ์"
    exit 1
fi

echo ""

# Step 2: Setup backend with full server
print_header "2. เตรียม Backend Server ด้วยข้อมูลจริง"

cd apps/backend

# Check if full server exists
if [ -f "cmd/server/main.go" ]; then
    print_success "Full server พร้อม"
else
    print_warning "ใช้ simple server แทน"
fi

# Install dependencies if needed
if [ -f "go.mod" ]; then
    print_info "กำลังติดตั้ง Go dependencies..."
    go mod tidy
    print_success "Go dependencies พร้อม"
fi

# Create demo database with real data
print_info "กำลังสร้างฐานข้อมูล Demo..."

# Remove existing database
if [ -f "internship.db" ]; then
    rm internship.db
    print_info "ลบฐานข้อมูลเก่าแล้ว"
fi

cd ../..

echo ""

# Step 3: Create real demo data
print_header "3. สร้างข้อมูลจริงสำหรับ Demo"

# Create demo data seeder
cat > apps/backend/demo_data_seeder.go << 'EOF'
package main

import (
    "fmt"
    "log"
    "time"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

// Demo Models (simplified for demo)
type User struct {
    ID        uint      `json:"id" gorm:"primaryKey"`
    Email     string    `json:"email" gorm:"unique"`
    Password  string    `json:"password"`
    FirstName string    `json:"first_name"`
    LastName  string    `json:"last_name"`
    Role      string    `json:"role"`
    StudentID *string   `json:"student_id,omitempty" gorm:"unique"`
    IsActive  bool      `json:"is_active" gorm:"default:true"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type Company struct {
    ID          uint      `json:"id" gorm:"primaryKey"`
    Name        string    `json:"name" gorm:"not null"`
    NameTH      string    `json:"name_th"`
    Address     string    `json:"address"`
    Phone       string    `json:"phone"`
    Email       string    `json:"email"`
    Website     string    `json:"website"`
    Industry    string    `json:"industry"`
    Description string    `json:"description" gorm:"type:text"`
    IsActive    bool      `json:"is_active" gorm:"default:true"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}

type Student struct {
    ID        uint      `json:"id" gorm:"primaryKey"`
    UserID    uint      `json:"user_id"`
    User      User      `json:"user" gorm:"foreignKey:UserID"`
    StudentID string    `json:"student_id" gorm:"unique"`
    Major     string    `json:"major"`
    Year      int       `json:"year"`
    GPA       float64   `json:"gpa"`
    Status    string    `json:"status" gorm:"default:active"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type Internship struct {
    ID          uint      `json:"id" gorm:"primaryKey"`
    StudentID   uint      `json:"student_id"`
    Student     Student   `json:"student" gorm:"foreignKey:StudentID"`
    CompanyID   uint      `json:"company_id"`
    Company     Company   `json:"company" gorm:"foreignKey:CompanyID"`
    Position    string    `json:"position"`
    StartDate   time.Time `json:"start_date"`
    EndDate     time.Time `json:"end_date"`
    Status      string    `json:"status" gorm:"default:pending"`
    Description string    `json:"description" gorm:"type:text"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}

func main() {
    // Connect to database
    db, err := gorm.Open(sqlite.Open("internship.db"), &gorm.Config{})
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }

    // Auto migrate
    err = db.AutoMigrate(&User{}, &Company{}, &Student{}, &Internship{})
    if err != nil {
        log.Fatal("Failed to migrate database:", err)
    }

    fmt.Println("🗄️  Database migrated successfully")

    // Seed demo data
    seedDemoData(db)
    
    fmt.Println("🎬 Demo data seeded successfully!")
    fmt.Println("📊 Summary:")
    
    var userCount, companyCount, studentCount, internshipCount int64
    db.Model(&User{}).Count(&userCount)
    db.Model(&Company{}).Count(&companyCount)
    db.Model(&Student{}).Count(&studentCount)
    db.Model(&Internship{}).Count(&internshipCount)
    
    fmt.Printf("   - Users: %d\n", userCount)
    fmt.Printf("   - Companies: %d\n", companyCount)
    fmt.Printf("   - Students: %d\n", studentCount)
    fmt.Printf("   - Internships: %d\n", internshipCount)
}

func seedDemoData(db *gorm.DB) {
    // Seed Users (Admin, Staff, Instructors)
    users := []User{
        {
            Email: "admin@university.ac.th",
            Password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password123
            FirstName: "ผู้ดูแลระบบ",
            LastName: "หลัก",
            Role: "admin",
        },
        {
            Email: "staff001@university.ac.th", 
            Password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
            FirstName: "สมหญิง",
            LastName: "ธุรการดี",
            Role: "staff",
        },
        {
            Email: "instructor001@university.ac.th",
            Password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
            FirstName: "ดร.สมชาย",
            LastName: "วิชาการ",
            Role: "instructor",
        },
        {
            Email: "supervisor001@university.ac.th",
            Password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
            FirstName: "อ.สมศรี",
            LastName: "นิเทศงาน",
            Role: "instructor",
        },
    }

    for _, user := range users {
        db.Create(&user)
    }

    // Seed Student Users
    studentUsers := []User{
        {
            Email: "student001@student.university.ac.th",
            Password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
            FirstName: "นางสาวสมใส",
            LastName: "เรียนดี",
            Role: "student",
            StudentID: stringPtr("65010001"),
        },
        {
            Email: "student002@student.university.ac.th",
            Password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
            FirstName: "นายสมศักดิ์",
            LastName: "ขยันเรียน",
            Role: "student",
            StudentID: stringPtr("65010002"),
        },
        {
            Email: "student003@student.university.ac.th",
            Password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
            FirstName: "นางสาวสุดา",
            LastName: "เก่งมาก",
            Role: "student",
            StudentID: stringPtr("65010003"),
        },
        {
            Email: "student004@student.university.ac.th",
            Password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
            FirstName: "นายธนากร",
            LastName: "ทำงานดี",
            Role: "student",
            StudentID: stringPtr("65010004"),
        },
        {
            Email: "student005@student.university.ac.th",
            Password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
            FirstName: "นางสาวปิยะดา",
            LastName: "สร้างสรรค์",
            Role: "student",
            StudentID: stringPtr("65010005"),
        },
    }

    for _, user := range studentUsers {
        db.Create(&user)
    }

    // Seed Companies
    companies := []Company{
        {
            Name: "Advanced Technology Solutions Co., Ltd.",
            NameTH: "บริษัท แอดวานซ์ เทคโนโลยี โซลูชั่น จำกัด",
            Address: "123 ถนนเทคโนโลยี แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
            Phone: "02-123-4567",
            Email: "hr@ats.co.th",
            Website: "https://www.ats.co.th",
            Industry: "Software Development",
            Description: "บริษัทพัฒนาซอฟต์แวร์และระบบสารสนเทศ เชี่ยวชาญด้าน Web Application และ Mobile App",
        },
        {
            Name: "Digital Innovation Hub Ltd.",
            NameTH: "บริษัท ดิจิทัล อินโนเวชั่น ฮับ จำกัด",
            Address: "456 ถนนดิจิทัล แขวงสีลม เขตบางรัก กรุงเทพฯ 10500",
            Phone: "02-234-5678",
            Email: "careers@dih.co.th",
            Website: "https://www.dih.co.th",
            Industry: "Digital Marketing",
            Description: "บริษัทให้บริการด้านการตลาดดิจิทัล และพัฒนาแพลตฟอร์มออนไลน์",
        },
        {
            Name: "Smart Manufacturing Systems Co., Ltd.",
            NameTH: "บริษัท สมาร์ท แมนูแฟคเจอริ่ง ซิสเต็มส์ จำกัด",
            Address: "789 ถนนอุตสาหกรรม แขวงบางซื่อ เขตบางซื่อ กรุงเทพฯ 10800",
            Phone: "02-345-6789",
            Email: "jobs@sms.co.th",
            Website: "https://www.sms.co.th",
            Industry: "Manufacturing Technology",
            Description: "บริษัทผลิตและพัฒนาระบบอัตโนมัติสำหรับโรงงานอุตสาหกรรม",
        },
        {
            Name: "Green Energy Solutions Ltd.",
            NameTH: "บริษัท กรีน เอนเนอร์ยี่ โซลูชั่น จำกัด",
            Address: "321 ถนนสีเขียว แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพฯ 10230",
            Phone: "02-456-7890",
            Email: "internship@ges.co.th",
            Website: "https://www.ges.co.th",
            Industry: "Renewable Energy",
            Description: "บริษัทพัฒนาและติดตั้งระบบพลังงานทดแทน โซลาร์เซลล์ และระบบประหยัดพลังงาน",
        },
        {
            Name: "FinTech Innovations Co., Ltd.",
            NameTH: "บริษัท ฟินเทค อินโนเวชั่น จำกัด",
            Address: "654 ถนนการเงิน แขวงสาทร เขตสาทร กรุงเทพฯ 10120",
            Phone: "02-567-8901",
            Email: "talent@fintech.co.th",
            Website: "https://www.fintech.co.th",
            Industry: "Financial Technology",
            Description: "บริษัทพัฒนาแอปพลิเคชันและระบบการเงินดิจิทัล e-Payment และ Blockchain",
        },
    }

    for _, company := range companies {
        db.Create(&company)
    }

    // Seed Students
    students := []Student{
        {UserID: 5, StudentID: "65010001", Major: "วิศวกรรมคอมพิวเตอร์", Year: 4, GPA: 3.75},
        {UserID: 6, StudentID: "65010002", Major: "วิทยาการคอมพิวเตอร์", Year: 4, GPA: 3.82},
        {UserID: 7, StudentID: "65010003", Major: "เทคโนโลยีสารสนเทศ", Year: 4, GPA: 3.65},
        {UserID: 8, StudentID: "65010004", Major: "วิศวกรรมไฟฟ้า", Year: 4, GPA: 3.90},
        {UserID: 9, StudentID: "65010005", Major: "การจัดการธุรกิจ", Year: 4, GPA: 3.55},
    }

    for _, student := range students {
        db.Create(&student)
    }

    // Seed Internships
    internships := []Internship{
        {
            StudentID: 1,
            CompanyID: 1,
            Position: "Software Developer Intern",
            StartDate: time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC),
            EndDate: time.Date(2024, 10, 31, 0, 0, 0, 0, time.UTC),
            Status: "approved",
            Description: "พัฒนา Web Application ด้วย React และ Node.js",
        },
        {
            StudentID: 2,
            CompanyID: 2,
            Position: "Digital Marketing Intern",
            StartDate: time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC),
            EndDate: time.Date(2024, 11, 15, 0, 0, 0, 0, time.UTC),
            Status: "approved",
            Description: "จัดทำแคมเปญการตลาดออนไลน์และวิเคราะห์ข้อมูล",
        },
        {
            StudentID: 3,
            CompanyID: 3,
            Position: "System Analyst Intern",
            StartDate: time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC),
            EndDate: time.Date(2024, 11, 30, 0, 0, 0, 0, time.UTC),
            Status: "in_progress",
            Description: "วิเคราะห์และออกแบบระบบการผลิตอัตโนมัติ",
        },
        {
            StudentID: 4,
            CompanyID: 4,
            Position: "Electrical Engineer Intern",
            StartDate: time.Date(2024, 8, 1, 0, 0, 0, 0, time.UTC),
            EndDate: time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC),
            Status: "in_progress",
            Description: "ออกแบบและติดตั้งระบบโซลาร์เซลล์",
        },
        {
            StudentID: 5,
            CompanyID: 5,
            Position: "Business Analyst Intern",
            StartDate: time.Date(2024, 9, 1, 0, 0, 0, 0, time.UTC),
            EndDate: time.Date(2025, 1, 31, 0, 0, 0, 0, time.UTC),
            Status: "pending",
            Description: "วิเคราะห์กระบวนการทางธุรกิจและพัฒนา FinTech Solutions",
        },
    }

    for _, internship := range internships {
        db.Create(&internship)
    }
}

func stringPtr(s string) *string {
    return &s
}
EOF

print_info "สร้าง Demo Data Seeder แล้ว"

# Run demo data seeder
cd apps/backend
print_info "กำลังสร้างข้อมูล Demo..."
go run demo_data_seeder.go
print_success "สร้างข้อมูล Demo เสร็จสิ้น"

cd ../..

echo ""

# Step 4: Start backend server
print_header "4. เริ่ม Backend Server"

cd apps/backend

# Start backend server in background
print_info "กำลังเริ่ม Backend Server..."
if [ -f "cmd/server/main.go" ]; then
    nohup go run cmd/server/main.go > backend-demo.log 2>&1 &
else
    nohup go run cmd/server/main_simple.go > backend-demo.log 2>&1 &
fi

BACKEND_PID=$!
echo $BACKEND_PID > backend-demo.pid
print_success "Backend Server เริ่มแล้ว (PID: $BACKEND_PID)"

cd ../..

# Wait for backend to start
print_info "รอ Backend Server เริ่มทำงาน..."
for i in {1..30}; do
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        print_success "Backend Server พร้อมใช้งาน"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""

# Step 5: Setup frontend
print_header "5. เตรียม Frontend"

cd apps/frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_info "กำลังติดตั้ง Frontend dependencies..."
    npm install
    print_success "Frontend dependencies พร้อม"
fi

# Start frontend server
print_info "กำลังเริ่ม Frontend Server..."
nohup npm run dev > frontend-demo.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > frontend-demo.pid
print_success "Frontend Server เริ่มแล้ว (PID: $FRONTEND_PID)"

cd ../..

# Wait for frontend to start
print_info "รอ Frontend Server เริ่มทำงาน..."
for i in {1..60}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend Server พร้อมใช้งาน"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""

# Step 6: Run integration tests
print_header "6. ทดสอบ Integration"

print_info "กำลังทดสอบการเชื่อมต่อระหว่าง Frontend และ Backend..."
if node integration-test-comprehensive.js > integration-test-results.log 2>&1; then
    print_success "Integration Tests ผ่านทั้งหมด"
else
    print_warning "Integration Tests มีบางส่วนที่ไม่ผ่าน (ตรวจสอบ log)"
fi

echo ""

# Step 7: Demo information
print_header "7. 🎬 Demo Information"

print_demo "ระบบพร้อมสำหรับการ Demo แล้ว!"
echo ""

print_info "🌐 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8080"
echo "   API:      http://localhost:8080/api/v1"
echo ""

print_info "👥 Demo Accounts:"
echo ""
echo "   🔑 Admin Account:"
echo "      Email: admin@university.ac.th"
echo "      Password: password123"
echo ""
echo "   👨‍💼 Staff Account:"
echo "      Email: staff001@university.ac.th"
echo "      Password: password123"
echo ""
echo "   👨‍🏫 Instructor Account:"
echo "      Email: instructor001@university.ac.th"
echo "      Password: password123"
echo ""
echo "   👨‍🎓 Student Accounts:"
echo "      Student ID: 65010001, Password: password123 (สมใส เรียนดี)"
echo "      Student ID: 65010002, Password: password123 (สมศักดิ์ ขยันเรียน)"
echo "      Student ID: 65010003, Password: password123 (สุดา เก่งมาก)"
echo "      Student ID: 65010004, Password: password123 (ธนากร ทำงานดี)"
echo "      Student ID: 65010005, Password: password123 (ปิยะดา สร้างสรรค์)"
echo ""

print_info "🏢 Demo Companies:"
echo "   1. Advanced Technology Solutions (Software Development)"
echo "   2. Digital Innovation Hub (Digital Marketing)"
echo "   3. Smart Manufacturing Systems (Manufacturing Technology)"
echo "   4. Green Energy Solutions (Renewable Energy)"
echo "   5. FinTech Innovations (Financial Technology)"
echo ""

print_info "📊 Demo Data Summary:"
echo "   - Users: 9 (1 Admin, 1 Staff, 2 Instructors, 5 Students)"
echo "   - Companies: 5"
echo "   - Students: 5"
echo "   - Internships: 5 (various statuses)"
echo ""

print_info "🎯 Demo Scenarios:"
echo "   1. Student Login & Dashboard"
echo "   2. Apply for Internship"
echo "   3. Staff/Instructor Approval Process"
echo "   4. Company Management"
echo "   5. Reports & Analytics"
echo ""

print_info "📋 Log Files:"
echo "   Backend: apps/backend/backend-demo.log"
echo "   Frontend: apps/frontend/frontend-demo.log"
echo "   Integration: integration-test-results.log"
echo ""

# Create demo script for easy access
cat > demo-commands.sh << 'EOF'
#!/bin/bash

# Demo Commands for easy access

echo "🎬 Demo Commands"
echo "==============="
echo ""
echo "1. View Backend Logs:"
echo "   tail -f apps/backend/backend-demo.log"
echo ""
echo "2. View Frontend Logs:"
echo "   tail -f apps/frontend/frontend-demo.log"
echo ""
echo "3. Test API Endpoints:"
echo "   curl http://localhost:8080/health"
echo "   curl http://localhost:8080/api/v1/test"
echo ""
echo "4. Stop Demo:"
echo "   ./stop-demo.sh"
echo ""
echo "5. Restart Demo:"
echo "   ./run-demo-with-real-data.sh"
echo ""
EOF

chmod +x demo-commands.sh

# Create stop script
cat > stop-demo.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Demo Servers..."

# Stop backend
if [ -f "apps/backend/backend-demo.pid" ]; then
    BACKEND_PID=$(cat apps/backend/backend-demo.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "✅ Backend stopped (PID: $BACKEND_PID)"
    fi
    rm -f apps/backend/backend-demo.pid
fi

# Stop frontend
if [ -f "apps/frontend/frontend-demo.pid" ]; then
    FRONTEND_PID=$(cat apps/frontend/frontend-demo.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "✅ Frontend stopped (PID: $FRONTEND_PID)"
    fi
    rm -f apps/frontend/frontend-demo.pid
fi

# Kill any remaining processes
pkill -f "go run cmd/server"
pkill -f "npm run dev"

echo "🎬 Demo stopped successfully!"
EOF

chmod +x stop-demo.sh

print_success "สร้าง Demo Scripts แล้ว"

echo ""
print_header "🎉 Demo Setup Complete!"

print_demo "ระบบพร้อมสำหรับการ Demo!"
print_info "เปิดเบราว์เซอร์ไปที่ http://localhost:3000 เพื่อเริ่ม Demo"
print_info "ใช้คำสั่ง './demo-commands.sh' เพื่อดูคำสั่งที่มีประโยชน์"
print_info "ใช้คำสั่ง './stop-demo.sh' เพื่อหยุด Demo"

echo ""
print_warning "กด Ctrl+C เพื่อหยุด script นี้ (servers จะยังทำงานอยู่)"
print_info "หรือรอให้ script จบเองใน 10 วินาที..."

# Keep script running for a moment
sleep 10

print_success "🎬 Demo is ready! Enjoy your presentation!"