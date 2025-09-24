package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/your-org/internship-management/internal/prisma"
)

func main() {
	client := prisma.NewClient()
	if err := client.Prisma.Connect(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer func() {
		if err := client.Prisma.Disconnect(); err != nil {
			log.Printf("Failed to disconnect from database: %v", err)
		}
	}()

	ctx := context.Background()

	fmt.Println("🌱 Starting database seeding...")

	// Clear existing data
	if err := clearDatabase(ctx, client); err != nil {
		log.Fatalf("Failed to clear database: %v", err)
	}

	// Seed data
	if err := seedCampuses(ctx, client); err != nil {
		log.Fatalf("Failed to seed campuses: %v", err)
	}

	if err := seedFaculties(ctx, client); err != nil {
		log.Fatalf("Failed to seed faculties: %v", err)
	}

	if err := seedPrograms(ctx, client); err != nil {
		log.Fatalf("Failed to seed programs: %v", err)
	}

	if err := seedMajors(ctx, client); err != nil {
		log.Fatalf("Failed to seed majors: %v", err)
	}

	if err := seedCurriculums(ctx, client); err != nil {
		log.Fatalf("Failed to seed curriculums: %v", err)
	}

	if err := seedUsers(ctx, client); err != nil {
		log.Fatalf("Failed to seed users: %v", err)
	}

	if err := seedStaff(ctx, client); err != nil {
		log.Fatalf("Failed to seed staff: %v", err)
	}

	if err := seedInstructors(ctx, client); err != nil {
		log.Fatalf("Failed to seed instructors: %v", err)
	}

	if err := seedStudents(ctx, client); err != nil {
		log.Fatalf("Failed to seed students: %v", err)
	}

	if err := seedCourses(ctx, client); err != nil {
		log.Fatalf("Failed to seed courses: %v", err)
	}

	if err := seedCourseSections(ctx, client); err != nil {
		log.Fatalf("Failed to seed course sections: %v", err)
	}

	if err := seedInstructorCourses(ctx, client); err != nil {
		log.Fatalf("Failed to seed instructor courses: %v", err)
	}

	if err := seedStudentEnrolls(ctx, client); err != nil {
		log.Fatalf("Failed to seed student enrolls: %v", err)
	}

	if err := seedStudentTrainings(ctx, client); err != nil {
		log.Fatalf("Failed to seed student trainings: %v", err)
	}

	if err := seedVisitors(ctx, client); err != nil {
		log.Fatalf("Failed to seed visitors: %v", err)
	}

	if err := seedVisitorSchedules(ctx, client); err != nil {
		log.Fatalf("Failed to seed visitor schedules: %v", err)
	}

	if err := seedEvaluations(ctx, client); err != nil {
		log.Fatalf("Failed to seed evaluations: %v", err)
	}

	if err := seedCourseCommittees(ctx, client); err != nil {
		log.Fatalf("Failed to seed course committees: %v", err)
	}

	fmt.Println("✅ Database seeding completed successfully!")
	fmt.Println("📊 Summary:")
	fmt.Println("   - 30 Users created (3 Admin, 2 Staff, 5 Instructors, 20 Students)")
	fmt.Println("   - 7 Student training records")
	fmt.Println("   - 5 Company evaluations")
	fmt.Println("   - 5 Student evaluations")
	fmt.Println("   - 5 Visitor schedules")
	fmt.Println("   - Complete academic structure (Campus → Faculty → Program → Major → Curriculum)")
}

func clearDatabase(ctx context.Context, client *prisma.PrismaClient) error {
	fmt.Println("🧹 Clearing existing data...")

	// Delete in reverse dependency order
	if _, err := client.VisitsPictures.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear visits pictures: %w", err)
	}

	if _, err := client.StudentEvaluateCompany.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear student evaluate companies: %w", err)
	}

	if _, err := client.VisitorEvaluateStudent.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear visitor evaluate students: %w", err)
	}

	if _, err := client.VisitorSchedule.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear visitor schedules: %w", err)
	}

	if _, err := client.StudentTraining.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear student trainings: %w", err)
	}

	if _, err := client.StudentEnroll.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear student enrolls: %w", err)
	}

	if _, err := client.CourseSection.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear course sections: %w", err)
	}

	if _, err := client.InstructorCourse.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear instructor courses: %w", err)
	}

	if _, err := client.Course.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear courses: %w", err)
	}

	if _, err := client.Student.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear students: %w", err)
	}

	if _, err := client.Instructor.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear instructors: %w", err)
	}

	if _, err := client.Staff.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear staff: %w", err)
	}

	if _, err := client.Visitor.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear visitors: %w", err)
	}

	if _, err := client.User.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear users: %w", err)
	}

	if _, err := client.Curriculum.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear curriculums: %w", err)
	}

	if _, err := client.Major.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear majors: %w", err)
	}

	if _, err := client.Program.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear programs: %w", err)
	}

	if _, err := client.Faculty.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear faculties: %w", err)
	}

	if _, err := client.Campus.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear campuses: %w", err)
	}

	if _, err := client.CourseCommittee.DeleteMany().Exec(ctx); err != nil {
		return fmt.Errorf("failed to clear course committees: %w", err)
	}

	fmt.Println("✅ Database cleared successfully")
	return nil
}

func seedCampuses(ctx context.Context, client *prisma.PrismaClient) error {
	fmt.Println("🏫 Seeding campuses...")

	campuses := []struct {
		Name    string
		Code    string
		Address *string
		Phone   *string
		Email   *string
	}{
		{
			Name:    "วิทยาเขตหลัก",
			Code:    "MAIN",
			Address: stringPtr("123 ถนนมหาวิทยาลัย เขตการศึกษา กรุงเทพฯ 10400"),
			Phone:   stringPtr("02-123-4567"),
			Email:   stringPtr("main@university.ac.th"),
		},
		{
			Name:    "วิทยาเขตสาขา",
			Code:    "BRANCH",
			Address: stringPtr("456 ถนนเทคโนโลยี เขตนวัตกรรม กรุงเทพฯ 10500"),
			Phone:   stringPtr("02-234-5678"),
			Email:   stringPtr("branch@university.ac.th"),
		},
	}

	for _, campus := range campuses {
		_, err := client.Campus.CreateOne(
			prisma.Campus.Name.Set(campus.Name),
			prisma.Campus.Code.Set(campus.Code),
			prisma.Campus.Address.SetIfPresent(campus.Address),
			prisma.Campus.Phone.SetIfPresent(campus.Phone),
			prisma.Campus.Email.SetIfPresent(campus.Email),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create campus %s: %w", campus.Name, err)
		}
	}

	fmt.Println("✅ Campuses seeded successfully")
	return nil
}

func seedFaculties(ctx context.Context, client *prisma.PrismaClient) error {
	fmt.Println("🏛️ Seeding faculties...")

	faculties := []struct {
		CampusID int
		Name     string
		Code     string
		Dean     *string
	}{
		{1, "คณะวิศวกรรมศาสตร์", "ENG", stringPtr("ศ.ดร.วิศวกรรม ใหญ่")},
		{1, "คณะวิทยาศาสตร์", "SCI", stringPtr("รศ.ดร.วิทยาศาสตร์ เก่ง")},
		{2, "คณะบริหารธุรกิจ", "BUS", stringPtr("ผศ.ดร.ธุรกิจ ดี")},
	}

	for _, faculty := range faculties {
		_, err := client.Faculty.CreateOne(
			prisma.Faculty.Campus.Link(prisma.Campus.ID.Equals(faculty.CampusID)),
			prisma.Faculty.Name.Set(faculty.Name),
			prisma.Faculty.Code.Set(faculty.Code),
			prisma.Faculty.Dean.SetIfPresent(faculty.Dean),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create faculty %s: %w", faculty.Name, err)
		}
	}

	fmt.Println("✅ Faculties seeded successfully")
	return nil
}

func seedPrograms(ctx context.Context, client *prisma.PrismaClient) error {
	fmt.Println("📚 Seeding programs...")

	programs := []struct {
		FacultyID int
		Name      string
		Code      string
		Degree    string
	}{
		{1, "วิศวกรรมศาสตรบัณฑิต", "B.ENG", "bachelor"},
		{2, "วิทยาศาสตรบัณฑิต", "B.SC", "bachelor"},
		{3, "บริหารธุรกิจบัณฑิต", "B.BA", "bachelor"},
	}

	for _, program := range programs {
		_, err := client.Program.CreateOne(
			prisma.Program.Faculty.Link(prisma.Faculty.ID.Equals(program.FacultyID)),
			prisma.Program.Name.Set(program.Name),
			prisma.Program.Code.Set(program.Code),
			prisma.Program.Degree.Set(program.Degree),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create program %s: %w", program.Name, err)
		}
	}

	fmt.Println("✅ Programs seeded successfully")
	return nil
}

func seedMajors(ctx context.Context, client *prisma.PrismaClient) error {
	fmt.Println("🎓 Seeding majors...")

	majors := []struct {
		ProgramID int
		Name      string
		Code      string
	}{
		{1, "วิศวกรรมคอมพิวเตอร์", "CPE"},
		{1, "วิศวกรรมไฟฟ้า", "EE"},
		{2, "วิทยาการคอมพิวเตอร์", "CS"},
		{2, "เทคโนโลยีสารสนเทศ", "IT"},
		{3, "การจัดการธุรกิจ", "BM"},
	}

	for _, major := range majors {
		_, err := client.Major.CreateOne(
			prisma.Major.Program.Link(prisma.Program.ID.Equals(major.ProgramID)),
			prisma.Major.Name.Set(major.Name),
			prisma.Major.Code.Set(major.Code),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create major %s: %w", major.Name, err)
		}
	}

	fmt.Println("✅ Majors seeded successfully")
	return nil
}

func seedCurriculums(ctx context.Context, client *prisma.PrismaClient) error {
	fmt.Println("📖 Seeding curriculums...")

	curriculums := []struct {
		MajorID int
		Name    string
		Year    int
		Version string
	}{
		{1, "หลักสูตรวิศวกรรมคอมพิวเตอร์", 2566, "1.0"},
		{2, "หลักสูตรวิศวกรรมไฟฟ้า", 2566, "1.0"},
		{3, "หลักสูตรวิทยาการคอมพิวเตอร์", 2566, "1.0"},
		{4, "หลักสูตรเทคโนโลยีสารสนเทศ", 2566, "1.0"},
		{5, "หลักสูตรการจัดการธุรกิจ", 2566, "1.0"},
	}

	for _, curriculum := range curriculums {
		_, err := client.Curriculum.CreateOne(
			prisma.Curriculum.Major.Link(prisma.Major.ID.Equals(curriculum.MajorID)),
			prisma.Curriculum.Name.Set(curriculum.Name),
			prisma.Curriculum.Year.Set(curriculum.Year),
			prisma.Curriculum.Version.Set(curriculum.Version),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create curriculum %s: %w", curriculum.Name, err)
		}
	}

	fmt.Println("✅ Curriculums seeded successfully")
	return nil
}

func seedUsers(ctx context.Context, client *prisma.PrismaClient) error {
	fmt.Println("👥 Seeding users...")

	// Password hash for "password123"
	passwordHash := "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi"

	users := []struct {
		Email     string
		FirstName *string
		LastName  *string
		Role      string
	}{
		// Admins
		{"admin001@university.ac.th", stringPtr("ปิ๊ก001"), stringPtr("นามสกุลปิ๊ก001"), "admin"},
		{"admin002@university.ac.th", stringPtr("อิ๋ว002"), stringPtr("นามสกุลอิ๋ว002"), "admin"},
		{"admin003@university.ac.th", stringPtr("ป้อง003"), stringPtr("นามสกุลป้อง003"), "admin"},
		// Staff
		{"staff001@university.ac.th", stringPtr("ธุรการ001"), stringPtr("นามสกุลธุรการ001"), "staff"},
		{"staff002@university.ac.th", stringPtr("ธุรการ002"), stringPtr("นามสกุลธุรการ002"), "staff"},
		// Instructors
		{"instructor001@university.ac.th", stringPtr("ประจำวิชา001"), stringPtr("นามสกุลประจำวิชา001"), "instructor"},
		{"instructor002@university.ac.th", stringPtr("ประจำวิชา002"), stringPtr("นามสกุลประจำวิชา002"), "instructor"},
		{"instructor003@university.ac.th", stringPtr("อาจารย์003"), stringPtr("นามสกุลอาจารย์003"), "instructor"},
		{"instructor004@university.ac.th", stringPtr("อาจารย์004"), stringPtr("นามสกุลอาจารย์004"), "instructor"},
		{"instructor005@university.ac.th", stringPtr("อาจารย์005"), stringPtr("นามสกุลอาจารย์005"), "instructor"},
	}

	// Create admin, staff, and instructor users
	for _, user := range users {
		_, err := client.User.CreateOne(
			prisma.User.Email.Set(user.Email),
			prisma.User.Password.Set(passwordHash),
			prisma.User.FirstName.SetIfPresent(user.FirstName),
			prisma.User.LastName.SetIfPresent(user.LastName),
			prisma.User.Role.Set(user.Role),
			prisma.User.IsActive.Set(true),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create user %s: %w", user.Email, err)
		}
	}

	// Create student users
	for i := 1; i <= 20; i++ {
		email := fmt.Sprintf("u680%04d@student.university.ac.th", i)
		firstName := fmt.Sprintf("สมศรี%03d", i)
		lastName := fmt.Sprintf("ดีเด่น%03d", i)

		_, err := client.User.CreateOne(
			prisma.User.Email.Set(email),
			prisma.User.Password.Set(passwordHash),
			prisma.User.FirstName.Set(firstName),
			prisma.User.LastName.Set(lastName),
			prisma.User.Role.Set("student"),
			prisma.User.IsActive.Set(true),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create student user %s: %w", email, err)
		}
	}

	fmt.Println("✅ Users seeded successfully")
	return nil
}

func stringPtr(s string) *string {
	return &s
}

func intPtr(i int) *int {
	return &i
}

func floatPtr(f float64) *float64 {
	return &f
}

func timePtr(t time.Time) *time.Time {
	return &t
}f
unc seedStaff(ctx context.Context, client *prisma.PrismaClient) error {
	fmt.Println("👔 Seeding staff...")

	staff := []struct {
		UserID     int
		StaffID    string
		Position   *string
		Department *string
	}{
		{4, "a6800001", stringPtr("เจ้าหน้าที่ธุรการ"), stringPtr("งานทะเบียนและประมวลผล")},
		{5, "a6800002", stringPtr("เจ้าหน้าที่ธุรการ"), stringPtr("งานกิจการนักศึกษา")},
	}

	for _, s := range staff {
		_, err := client.Staff.CreateOne(
			prisma.Staff.User.Link(prisma.User.ID.Equals(s.UserID)),
			prisma.Staff.StaffID.Set(s.StaffID),
			prisma.Staff.Position.SetIfPresent(s.Position),
			prisma.Staff.Department.SetIfPresent(s.Department),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create staff %s: %w", s.StaffID, err)
		}
	}

	fmt.Println("✅ Staff seeded successfully")
	return nil
}

func seedInstructors(ctx context.Context, client *prisma.PrismaClient) error {
	fmt.Println("👨‍🏫 Seeding instructors...")

	instructors := []struct {
		UserID       int
		InstructorID string
		Department   *string
		Position     *string
		Expertise    *string
	}{
		{6, "t6800001", stringPtr("วิศวกรรมคอมพิวเตอร์"), stringPtr("อาจารย์"), stringPtr("Software Engineering, Database Systems")},
		{7, "t6800002", stringPtr("วิทยาการคอมพิวเตอร์"), stringPtr("รองศาสตราจารย์"), stringPtr("Machine Learning, Data Science")},
		{8, "t6800003", stringPtr("วิศวกรรมไฟฟ้า"), stringPtr("ผู้ช่วยศาสตราจารย์"), stringPtr("Power Systems, Control Systems")},
		{9, "t6800004", stringPtr("เทคโนโลยีสารสนเทศ"), stringPtr("อาจารย์"), stringPtr("Network Security, Cloud Computing")},
		{10, "t6800005", stringPtr("การจัดการธุรกิจ"), stringPtr("อาจารย์"), stringPtr("Strategic Management, Marketing")},
	}

	for _, instructor := range instructors {
		_, err := client.Instructor.CreateOne(
			prisma.Instructor.User.Link(prisma.User.ID.Equals(instructor.UserID)),
			prisma.Instructor.InstructorID.Set(instructor.InstructorID),
			prisma.Instructor.Department.SetIfPresent(instructor.Department),
			prisma.Instructor.Position.SetIfPresent(instructor.Position),
			prisma.Instructor.Expertise.SetIfPresent(instructor.Expertise),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create instructor %s: %w", instructor.InstructorID, err)
		}
	}

	fmt.Println("✅ Instructors seeded successfully")
	return nil
}

func seedStudents(ctx context.Context, client *prisma.PrismaClient) error {
	fmt.Println("🎓 Seeding students...")

	students := []struct {
		UserID    int
		StudentID string
		MajorID   int
		Year      *int
		Semester  *int
		GPA       *float64
		Status    string
		Advisor   *string
	}{
		{11, "u6800001", 1, intPtr(4), intPtr(1), floatPtr(3.75), "active", stringPtr("อ.ประจำวิชา001")},
		{12, "u6800002", 1, intPtr(4), intPtr(1), floatPtr(3.82), "active", stringPtr("อ.ประจำวิชา001")},
		{13, "u6800003", 2, intPtr(4), intPtr(1), floatPtr(3.65), "active", stringPtr("อ.อาจารย์003")},
		{14, "u6800004", 2, intPtr(4), intPtr(1), floatPtr(3.90), "active", stringPtr("อ.อาจารย์003")},
		{15, "u6800005", 3, intPtr(4), intPtr(1), floatPtr(3.55), "active", stringPtr("รศ.ประจำวิชา002")},
		{16, "u6800006", 3, intPtr(4), intPtr(1), floatPtr(3.78), "active", stringPtr("รศ.ประจำวิชา002")},
		{17, "u6800007", 4, intPtr(4), intPtr(1), floatPtr(3.68), "active", stringPtr("อ.อาจารย์004")},
		{18, "u6800008", 4, intPtr(4), intPtr(1), floatPtr(3.85), "active", stringPtr("อ.อาจารย์004")},
		{19, "u6800009", 5, intPtr(4), intPtr(1), floatPtr(3.72), "active", stringPtr("อ.อาจารย์005")},
		{20, "u6800010", 5, intPtr(4), intPtr(1), floatPtr(3.88), "active", stringPtr("อ.อาจารย์005")},
		{21, "u6800011", 1, intPtr(3), intPtr(2), floatPtr(3.45), "active", stringPtr("อ.ประจำวิชา001")},
		{22, "u6800012", 1, intPtr(3), intPtr(2), floatPtr(3.67), "active", stringPtr("อ.ประจำวิชา001")},
		{23, "u6800013", 2, intPtr(3), intPtr(2), floatPtr(3.58), "active", stringPtr("อ.อาจารย์003")},
		{24, "u6800014", 2, intPtr(3), intPtr(2), floatPtr(3.73), "active", stringPtr("อ.อาจารย์003")},
		{25, "u6800015", 3, intPtr(3), intPtr(2), floatPtr(3.62), "active", stringPtr("รศ.ประจำวิชา002")},
		{26, "u6800016", 3, intPtr(3), intPtr(2), floatPtr(3.81), "active", stringPtr("รศ.ประจำวิชา002")},
		{27, "u6800017", 4, intPtr(3), intPtr(2), floatPtr(3.54), "active", stringPtr("อ.อาจารย์004")},
		{28, "u6800018", 4, intPtr(3), intPtr(2), floatPtr(3.76), "active", stringPtr("อ.อาจารย์004")},
		{29, "u6800019", 5, intPtr(3), intPtr(2), floatPtr(3.69), "active", stringPtr("อ.อาจารย์005")},
		{30, "u6800020", 5, intPtr(3), intPtr(2), floatPtr(3.84), "active", stringPtr("อ.อาจารย์005")},
	}

	for _, student := range students {
		_, err := client.Student.CreateOne(
			prisma.Student.User.Link(prisma.User.ID.Equals(student.UserID)),
			prisma.Student.StudentID.Set(student.StudentID),
			prisma.Student.Major.Link(prisma.Major.ID.Equals(student.MajorID)),
			prisma.Student.Year.SetIfPresent(student.Year),
			prisma.Student.Semester.SetIfPresent(student.Semester),
			prisma.Student.Gpa.SetIfPresent(student.GPA),
			prisma.Student.Status.Set(student.Status),
			prisma.Student.Advisor.SetIfPresent(student.Advisor),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create student %s: %w", student.StudentID, err)
		}
	}

	fmt.Println("✅ Students seeded successfully")
	return nil
}

func seedCourses(ctx context.Context, client *prisma.PrismaClient) error {
	fmt.Println("📚 Seeding courses...")

	courses := []struct {
		CurriculumID  int
		Code          string
		Name          string
		Credits       int
		Description   *string
		Prerequisites *string
	}{
		{1, "CPE101", "การเขียนโปรแกรมเบื้องต้น", 3, stringPtr("พื้นฐานการเขียนโปรแกรมด้วยภาษา C"), nil},
		{1, "CPE201", "โครงสร้างข้อมูลและอัลกอริทึม", 3, stringPtr("การจัดเก็บและจัดการข้อมูลอย่างมีประสิทธิภาพ"), stringPtr("CPE101")},
		{1, "CPE301", "วิศวกรรมซอฟต์แวร์", 3, stringPtr("หลักการพัฒนาซอฟต์แวร์อย่างเป็นระบบ"), stringPtr("CPE201")},
		{1, "CPE401", "โครงงานวิศวกรรมคอมพิวเตอร์", 3, stringPtr("โครงงานจบการศึกษา"), stringPtr("CPE301")},
		{1, "CPE499", "สหกิจศึกษา", 6, stringPtr("การฝึกงานในสถานประกอบการ"), stringPtr("CPE301")},
	}

	for _, course := range courses {
		_, err := client.Course.CreateOne(
			prisma.Course.Curriculum.Link(prisma.Curriculum.ID.Equals(course.CurriculumID)),
			prisma.Course.Code.Set(course.Code),
			prisma.Course.Name.Set(course.Name),
			prisma.Course.Credits.Set(course.Credits),
			prisma.Course.Description.SetIfPresent(course.Description),
			prisma.Course.Prerequisites.SetIfPresent(course.Prerequisites),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create course %s: %w", course.Code, err)
		}
	}

	fmt.Println("✅ Courses seeded successfully")
	return nil
}

func seedCourseSections(ctx context.Context, client *prisma.PrismaClient) error {
	fmt.Println("📝 Seeding course sections...")

	sections := []struct {
		CourseID    int
		Section     string
		Semester    string
		Year        int
		MaxStudents int
		Schedule    *string
	}{
		{1, "01", "1/2567", 2567, 40, stringPtr("จันทร์ 09:00-12:00")},
		{1, "02", "1/2567", 2567, 40, stringPtr("อังคาร 13:00-16:00")},
		{2, "01", "2/2567", 2567, 35, stringPtr("พุธ 09:00-12:00")},
		{3, "01", "1/2567", 2567, 30, stringPtr("พฤหัสบดี 09:00-12:00")},
		{5, "01", "2/2567", 2567, 25, stringPtr("ตลอดภาคการศึกษา")},
	}

	for _, section := range sections {
		_, err := client.CourseSection.CreateOne(
			prisma.CourseSection.Course.Link(prisma.Course.ID.Equals(section.CourseID)),
			prisma.CourseSection.Section.Set(section.Section),
			prisma.CourseSection.Semester.Set(section.Semester),
			prisma.CourseSection.Year.Set(section.Year),
			prisma.CourseSection.MaxStudents.Set(section.MaxStudents),
			prisma.CourseSection.Schedule.SetIfPresent(section.Schedule),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create course section %d-%s: %w", section.CourseID, section.Section, err)
		}
	}

	fmt.Println("✅ Course sections seeded successfully")
	return nil
}

func seedInstructorCourses(ctx context.Context, client *prisma.PrismaClient) error {
	fmt.Println("👨‍🏫📚 Seeding instructor courses...")

	instructorCourses := []struct {
		InstructorID int
		CourseID     int
		Role         string
	}{
		{1, 1, "instructor"},
		{1, 2, "instructor"},
		{2, 3, "instructor"},
		{1, 4, "coordinator"},
		{1, 5, "coordinator"},
	}

	for _, ic := range instructorCourses {
		_, err := client.InstructorCourse.CreateOne(
			prisma.InstructorCourse.Instructor.Link(prisma.Instructor.ID.Equals(ic.InstructorID)),
			prisma.InstructorCourse.Course.Link(prisma.Course.ID.Equals(ic.CourseID)),
			prisma.InstructorCourse.Role.Set(ic.Role),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create instructor course %d-%d: %w", ic.InstructorID, ic.CourseID, err)
		}
	}

	fmt.Println("✅ Instructor courses seeded successfully")
	return nil
}

func seedStudentEnrolls(ctx context.Context, client *prisma.PrismaClient) error {
	fmt.Println("📋 Seeding student enrollments...")

	// Enroll first 5 students in the internship course (CPE499)
	enrollments := []struct {
		StudentID       int
		CourseSectionID int
		Status          string
	}{
		{1, 5, "enrolled"},
		{2, 5, "enrolled"},
		{3, 5, "enrolled"},
		{4, 5, "enrolled"},
		{5, 5, "enrolled"},
	}

	enrollDate := time.Date(2024, 8, 15, 0, 0, 0, 0, time.UTC)

	for _, enrollment := range enrollments {
		_, err := client.StudentEnroll.CreateOne(
			prisma.StudentEnroll.Student.Link(prisma.Student.ID.Equals(enrollment.StudentID)),
			prisma.StudentEnroll.CourseSection.Link(prisma.CourseSection.ID.Equals(enrollment.CourseSectionID)),
			prisma.StudentEnroll.EnrollDate.Set(enrollDate),
			prisma.StudentEnroll.Status.Set(enrollment.Status),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create student enrollment %d-%d: %w", enrollment.StudentID, enrollment.CourseSectionID, err)
		}
	}

	fmt.Println("✅ Student enrollments seeded successfully")
	return nil
}

func seedStudentTrainings(ctx context.Context, client *prisma.PrismaClient) error {
	fmt.Println("🏢 Seeding student trainings...")

	trainings := []struct {
		StudentID   int
		CompanyName string
		Position    *string
		StartDate   time.Time
		EndDate     time.Time
		Status      string
		Supervisor  *string
		Description *string
	}{
		{1, "บริษัท เทคโนโลยี จำกัด", stringPtr("Software Developer Intern"), time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 10, 31, 0, 0, 0, 0, time.UTC), "approved", stringPtr("คุณสมชาย ใจดี"), stringPtr("พัฒนาระบบเว็บแอปพลิเคชัน")},
		{2, "บริษัท ดิจิทัล โซลูชั่น จำกัด", stringPtr("Frontend Developer Intern"), time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 10, 31, 0, 0, 0, 0, time.UTC), "approved", stringPtr("คุณสมหญิง เก่งมาก"), stringPtr("พัฒนา User Interface")},
		{3, "บริษัท ไอที เซอร์วิส จำกัด", stringPtr("System Admin Intern"), time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC), time.Date(2024, 11, 15, 0, 0, 0, 0, time.UTC), "approved", stringPtr("คุณสมศักดิ์ รู้จริง"), stringPtr("ดูแลระบบเครือข่าย")},
		{4, "บริษัท ซอฟต์แวร์ พลัส จำกัด", stringPtr("Database Developer Intern"), time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 11, 30, 0, 0, 0, 0, time.UTC), "approved", stringPtr("คุณสมพร ชำนาญ"), stringPtr("ออกแบบและพัฒนาฐานข้อมูล")},
		{5, "บริษัท คลาวด์ เทค จำกัด", stringPtr("Cloud Engineer Intern"), time.Date(2024, 7, 15, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 15, 0, 0, 0, 0, time.UTC), "approved", stringPtr("คุณสมบูรณ์ เชี่ยวชาญ"), stringPtr("จัดการระบบ Cloud Infrastructure")},
		{6, "บริษัท เอไอ อินโนเวชั่น จำกัด", stringPtr("AI Developer Intern"), time.Date(2024, 8, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC), "pending", stringPtr("คุณสมหมาย ปัญญา"), stringPtr("พัฒนาระบบ Machine Learning")},
		{7, "บริษัท ไซเบอร์ ซีเคียวริตี้ จำกัด", stringPtr("Security Analyst Intern"), time.Date(2024, 8, 15, 0, 0, 0, 0, time.UTC), time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC), "pending", stringPtr("คุณสมรักษ์ ปลอดภัย"), stringPtr("วิเคราะห์ความปลอดภัยระบบ")},
	}

	for _, training := range trainings {
		_, err := client.StudentTraining.CreateOne(
			prisma.StudentTraining.Student.Link(prisma.Student.ID.Equals(training.StudentID)),
			prisma.StudentTraining.CompanyName.Set(training.CompanyName),
			prisma.StudentTraining.Position.SetIfPresent(training.Position),
			prisma.StudentTraining.StartDate.Set(training.StartDate),
			prisma.StudentTraining.EndDate.Set(training.EndDate),
			prisma.StudentTraining.Status.Set(training.Status),
			prisma.StudentTraining.Supervisor.SetIfPresent(training.Supervisor),
			prisma.StudentTraining.Description.SetIfPresent(training.Description),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create student training for student %d: %w", training.StudentID, err)
		}
	}

	fmt.Println("✅ Student trainings seeded successfully")
	return nil
}

func seedVisitors(ctx context.Context, client *prisma.PrismaClient) error {
	fmt.Println("👥 Seeding visitors...")

	visitors := []struct {
		Name      string
		Email     *string
		Phone     *string
		Company   *string
		Position  *string
		Expertise *string
	}{
		{"คุณสมชาย ใจดี", stringPtr("somchai@techcompany.com"), stringPtr("081-234-5678"), stringPtr("บริษัท เทคโนโลยี จำกัด"), stringPtr("Senior Software Engineer"), stringPtr("Full Stack Development")},
		{"คุณสมหญิง เก่งมาก", stringPtr("somying@digitalsolution.com"), stringPtr("082-345-6789"), stringPtr("บริษัท ดิจิทัล โซลูชั่น จำกัด"), stringPtr("Frontend Team Lead"), stringPtr("React, Vue.js, UI/UX")},
		{"คุณสมศักดิ์ รู้จริง", stringPtr("somsak@itservice.com"), stringPtr("083-456-7890"), stringPtr("บริษัท ไอที เซอร์วิส จำกัด"), stringPtr("System Administrator"), stringPtr("Network, Linux, Security")},
		{"คุณสมพร ชำนาญ", stringPtr("somporn@softwareplus.com"), stringPtr("084-567-8901"), stringPtr("บริษัท ซอฟต์แวร์ พลัส จำกัด"), stringPtr("Database Architect"), stringPtr("MySQL, PostgreSQL, MongoDB")},
		{"คุณสมบูรณ์ เชี่ยวชาญ", stringPtr("somboon@cloudtech.com"), stringPtr("085-678-9012"), stringPtr("บริษัท คลาวด์ เทค จำกัด"), stringPtr("Cloud Solutions Architect"), stringPtr("AWS, Azure, Docker, Kubernetes")},
	}

	for _, visitor := range visitors {
		_, err := client.Visitor.CreateOne(
			prisma.Visitor.Name.Set(visitor.Name),
			prisma.Visitor.Email.SetIfPresent(visitor.Email),
			prisma.Visitor.Phone.SetIfPresent(visitor.Phone),
			prisma.Visitor.Company.SetIfPresent(visitor.Company),
			prisma.Visitor.Position.SetIfPresent(visitor.Position),
			prisma.Visitor.Expertise.SetIfPresent(visitor.Expertise),
			prisma.Visitor.IsActive.Set(true),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create visitor %s: %w", visitor.Name, err)
		}
	}

	fmt.Println("✅ Visitors seeded successfully")
	return nil
}

func seedVisitorSchedules(ctx context.Context, client *prisma.PrismaClient) error {
	fmt.Println("📅 Seeding visitor schedules...")

	schedules := []struct {
		VisitorID int
		Date      time.Time
		StartTime string
		EndTime   string
		Activity  string
		Location  *string
		Notes     *string
	}{
		{1, time.Date(2024, 9, 15, 0, 0, 0, 0, time.UTC), "09:00", "12:00", "การประเมินนักศึกษาฝึกงาน", stringPtr("ห้องประชุม A"), stringPtr("ประเมินผลงานโครงการ")},
		{2, time.Date(2024, 9, 20, 0, 0, 0, 0, time.UTC), "13:00", "16:00", "การสัมมนาเทคโนโลยี Frontend", stringPtr("ห้องบรรยาย 201"), stringPtr("แบ่งปันประสบการณ์การพัฒนา UI")},
		{3, time.Date(2024, 9, 25, 0, 0, 0, 0, time.UTC), "10:00", "15:00", "การตรวจสอบระบบความปลอดภัย", stringPtr("ห้องคอมพิวเตอร์"), stringPtr("ตรวจสอบการตั้งค่าระบบ")},
		{4, time.Date(2024, 10, 1, 0, 0, 0, 0, time.UTC), "09:00", "12:00", "การประเมินโครงการฐานข้อมูล", stringPtr("ห้องประชุม B"), stringPtr("ทบทวนการออกแบบฐานข้อมูล")},
		{5, time.Date(2024, 10, 5, 0, 0, 0, 0, time.UTC), "14:00", "17:00", "การสาธิต Cloud Deployment", stringPtr("ห้องปฏิบัติการ"), stringPtr("สาธิตการ deploy บน cloud")},
	}

	for _, schedule := range schedules {
		_, err := client.VisitorSchedule.CreateOne(
			prisma.VisitorSchedule.Visitor.Link(prisma.Visitor.ID.Equals(schedule.VisitorID)),
			prisma.VisitorSchedule.Date.Set(schedule.Date),
			prisma.VisitorSchedule.StartTime.Set(schedule.StartTime),
			prisma.VisitorSchedule.EndTime.Set(schedule.EndTime),
			prisma.VisitorSchedule.Activity.Set(schedule.Activity),
			prisma.VisitorSchedule.Location.SetIfPresent(schedule.Location),
			prisma.VisitorSchedule.Notes.SetIfPresent(schedule.Notes),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create visitor schedule for visitor %d: %w", schedule.VisitorID, err)
		}
	}

	fmt.Println("✅ Visitor schedules seeded successfully")
	return nil
}

func seedEvaluations(ctx context.Context, client *prisma.PrismaClient) error {
	fmt.Println("📊 Seeding evaluations...")

	// Visitor evaluate students
	visitorEvals := []struct {
		VisitorID int
		StudentID int
		Date      time.Time
		Score     *float64
		Comments  *string
		Criteria  string
	}{
		{1, 1, time.Date(2024, 9, 15, 0, 0, 0, 0, time.UTC), floatPtr(85.5), stringPtr("นักศึกษามีความสามารถในการเขียนโปรแกรมดี มีความรับผิดชอบสูง"), `{"technical_skills": 85, "communication": 80, "teamwork": 90, "problem_solving": 85, "punctuality": 95}`},
		{2, 2, time.Date(2024, 9, 20, 0, 0, 0, 0, time.UTC), floatPtr(88.0), stringPtr("มีความคิดสร้างสรรค์ในการออกแบบ UI ทำงานได้ดีกับทีม"), `{"technical_skills": 90, "communication": 85, "teamwork": 90, "problem_solving": 88, "punctuality": 87}`},
		{3, 3, time.Date(2024, 9, 25, 0, 0, 0, 0, time.UTC), floatPtr(82.5), stringPtr("เข้าใจระบบเครือข่ายได้ดี ยังต้องพัฒนาทักษะการแก้ปัญหาเฉพาะหน้า"), `{"technical_skills": 80, "communication": 78, "teamwork": 85, "problem_solving": 80, "punctuality": 90}`},
		{4, 4, time.Date(2024, 10, 1, 0, 0, 0, 0, time.UTC), floatPtr(91.0), stringPtr("มีความเข้าใจในการออกแบบฐานข้อมูลดีมาก สามารถทำงานได้อย่างอิสระ"), `{"technical_skills": 95, "communication": 88, "teamwork": 90, "problem_solving": 92, "punctuality": 90}`},
		{5, 5, time.Date(2024, 10, 5, 0, 0, 0, 0, time.UTC), floatPtr(87.5), stringPtr("เรียนรู้เทคโนโลยี cloud ได้เร็ว มีความกระตือรือร้นในการทำงาน"), `{"technical_skills": 88, "communication": 85, "teamwork": 90, "problem_solving": 87, "punctuality": 88}`},
	}

	for _, eval := range visitorEvals {
		_, err := client.VisitorEvaluateStudent.CreateOne(
			prisma.VisitorEvaluateStudent.Visitor.Link(prisma.Visitor.ID.Equals(eval.VisitorID)),
			prisma.VisitorEvaluateStudent.Student.Link(prisma.Student.ID.Equals(eval.StudentID)),
			prisma.VisitorEvaluateStudent.Date.Set(eval.Date),
			prisma.VisitorEvaluateStudent.Score.SetIfPresent(eval.Score),
			prisma.VisitorEvaluateStudent.Comments.SetIfPresent(eval.Comments),
			prisma.VisitorEvaluateStudent.Criteria.Set(eval.Criteria),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create visitor evaluation for student %d: %w", eval.StudentID, err)
		}
	}

	// Student evaluate companies
	studentEvals := []struct {
		StudentID   int
		CompanyName string
		Date        time.Time
		Score       *float64
		Comments    *string
		Criteria    string
	}{
		{1, "บริษัท เทคโนโลยี จำกัด", time.Date(2024, 10, 31, 0, 0, 0, 0, time.UTC), floatPtr(90.0), stringPtr("บริษัทให้โอกาสในการเรียนรู้ดี มีพี่เลี้ยงที่ดี สภาพแวดล้อมการทำงานดี"), `{"learning_opportunity": 95, "supervision": 90, "work_environment": 88, "facilities": 85, "overall_satisfaction": 92}`},
		{2, "บริษัท ดิจิทัล โซลูชั่น จำกัด", time.Date(2024, 10, 31, 0, 0, 0, 0, time.UTC), floatPtr(88.5), stringPtr("ได้เรียนรู้เทคโนโลยีใหม่ๆ ทีมงานเป็นกันเอง แต่งานค่อนข้างเยอะ"), `{"learning_opportunity": 92, "supervision": 88, "work_environment": 85, "facilities": 87, "overall_satisfaction": 90}`},
		{3, "บริษัท ไอที เซอร์วิส จำกัด", time.Date(2024, 11, 15, 0, 0, 0, 0, time.UTC), floatPtr(85.0), stringPtr("ได้ประสบการณ์จริงในการดูแลระบบ แต่ยังขาดการอบรมเบื้องต้น"), `{"learning_opportunity": 88, "supervision": 80, "work_environment": 85, "facilities": 82, "overall_satisfaction": 87}`},
		{4, "บริษัท ซอฟต์แวร์ พลัส จำกัด", time.Date(2024, 11, 30, 0, 0, 0, 0, time.UTC), floatPtr(92.5), stringPtr("บริษัทมีระบบการฝึกงานที่ดีมาก ได้เรียนรู้ทั้งทฤษฎีและปฏิบัติ"), `{"learning_opportunity": 95, "supervision": 92, "work_environment": 90, "facilities": 92, "overall_satisfaction": 94}`},
		{5, "บริษัท คลาวด์ เทค จำกัด", time.Date(2024, 12, 15, 0, 0, 0, 0, time.UTC), floatPtr(89.0), stringPtr("เทคโนโลยีทันสมัย ได้เรียนรู้ cloud computing จริงๆ สภาพแวดล้อมดี"), `{"learning_opportunity": 93, "supervision": 87, "work_environment": 88, "facilities": 90, "overall_satisfaction": 87}`},
	}

	for _, eval := range studentEvals {
		_, err := client.StudentEvaluateCompany.CreateOne(
			prisma.StudentEvaluateCompany.Student.Link(prisma.Student.ID.Equals(eval.StudentID)),
			prisma.StudentEvaluateCompany.CompanyName.Set(eval.CompanyName),
			prisma.StudentEvaluateCompany.Date.Set(eval.Date),
			prisma.StudentEvaluateCompany.Score.SetIfPresent(eval.Score),
			prisma.StudentEvaluateCompany.Comments.SetIfPresent(eval.Comments),
			prisma.StudentEvaluateCompany.Criteria.Set(eval.Criteria),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create student evaluation for company %s: %w", eval.CompanyName, err)
		}
	}

	fmt.Println("✅ Evaluations seeded successfully")
	return nil
}

func seedCourseCommittees(ctx context.Context, client *prisma.PrismaClient) error {
	fmt.Println("🏛️ Seeding course committees...")

	committees := []struct {
		Name        string
		Description *string
		Chairperson *string
		Members     string
	}{
		{"คณะกรรมการหลักสูตรวิศวกรรมคอมพิวเตอร์", stringPtr("คณะกรรมการพัฒนาและปรับปรุงหลักสูตร"), stringPtr("รศ.ดร.วิศวกรรม ใหญ่"), `["อ.ประจำวิชา001", "รศ.ประจำวิชา002", "อ.อาจารย์003"]`},
		{"คณะกรรมการสหกิจศึกษา", stringPtr("คณะกรรมการกำกับดูแลการฝึกงานนักศึกษา"), stringPtr("อ.ประจำวิชา001"), `["รศ.ประจำวิชา002", "อ.อาจารย์004", "อ.อาจารย์005"]`},
	}

	for _, committee := range committees {
		_, err := client.CourseCommittee.CreateOne(
			prisma.CourseCommittee.Name.Set(committee.Name),
			prisma.CourseCommittee.Description.SetIfPresent(committee.Description),
			prisma.CourseCommittee.Chairperson.SetIfPresent(committee.Chairperson),
			prisma.CourseCommittee.Members.Set(committee.Members),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to create course committee %s: %w", committee.Name, err)
		}
	}

	fmt.Println("✅ Course committees seeded successfully")
	return nil
}