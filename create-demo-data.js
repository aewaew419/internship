#!/usr/bin/env node

/**
 * Create Demo Data Script
 * สร้างข้อมูล Demo สำหรับการทดสอบระบบ
 */

const fs = require('fs');
const path = require('path');

// Demo data structure
const demoData = {
  users: [
    {
      id: 1,
      email: "admin@university.ac.th",
      password: "password123",
      firstName: "ผู้ดูแลระบบ",
      lastName: "หลัก",
      role: "admin",
      isActive: true
    },
    {
      id: 2,
      email: "staff001@university.ac.th",
      password: "password123",
      firstName: "สมหญิง",
      lastName: "ธุรการดี",
      role: "staff",
      isActive: true
    },
    {
      id: 3,
      email: "instructor001@university.ac.th",
      password: "password123",
      firstName: "ดร.สมชาย",
      lastName: "วิชาการ",
      role: "instructor",
      isActive: true
    },
    {
      id: 4,
      email: "supervisor001@university.ac.th",
      password: "password123",
      firstName: "อ.สมศรี",
      lastName: "นิเทศงาน",
      role: "instructor",
      isActive: true
    },
    {
      id: 5,
      email: "student001@student.university.ac.th",
      password: "password123",
      firstName: "นางสาวสมใส",
      lastName: "เรียนดี",
      role: "student",
      studentId: "65010001",
      isActive: true
    },
    {
      id: 6,
      email: "student002@student.university.ac.th",
      password: "password123",
      firstName: "นายสมศักดิ์",
      lastName: "ขยันเรียน",
      role: "student",
      studentId: "65010002",
      isActive: true
    },
    {
      id: 7,
      email: "student003@student.university.ac.th",
      password: "password123",
      firstName: "นางสาวสุดา",
      lastName: "เก่งมาก",
      role: "student",
      studentId: "65010003",
      isActive: true
    },
    {
      id: 8,
      email: "student004@student.university.ac.th",
      password: "password123",
      firstName: "นายธนากร",
      lastName: "ทำงานดี",
      role: "student",
      studentId: "65010004",
      isActive: true
    },
    {
      id: 9,
      email: "student005@student.university.ac.th",
      password: "password123",
      firstName: "นางสาวปิยะดา",
      lastName: "สร้างสรรค์",
      role: "student",
      studentId: "65010005",
      isActive: true
    }
  ],
  
  companies: [
    {
      id: 1,
      name: "Advanced Technology Solutions Co., Ltd.",
      nameTH: "บริษัท แอดวานซ์ เทคโนโลยี โซลูชั่น จำกัด",
      address: "123 ถนนเทคโนโลยี แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
      phone: "02-123-4567",
      email: "hr@ats.co.th",
      website: "https://www.ats.co.th",
      industry: "Software Development",
      description: "บริษัทพัฒนาซอฟต์แวร์และระบบสารสนเทศ เชี่ยวชาญด้าน Web Application และ Mobile App",
      isActive: true
    },
    {
      id: 2,
      name: "Digital Innovation Hub Ltd.",
      nameTH: "บริษัท ดิจิทัล อินโนเวชั่น ฮับ จำกัด",
      address: "456 ถนนดิจิทัล แขวงสีลม เขตบางรัก กรุงเทพฯ 10500",
      phone: "02-234-5678",
      email: "careers@dih.co.th",
      website: "https://www.dih.co.th",
      industry: "Digital Marketing",
      description: "บริษัทให้บริการด้านการตลาดดิจิทัล และพัฒนาแพลตฟอร์มออนไลน์",
      isActive: true
    },
    {
      id: 3,
      name: "Smart Manufacturing Systems Co., Ltd.",
      nameTH: "บริษัท สมาร์ท แมนูแฟคเจอริ่ง ซิสเต็มส์ จำกัด",
      address: "789 ถนนอุตสาหกรรม แขวงบางซื่อ เขตบางซื่อ กรุงเทพฯ 10800",
      phone: "02-345-6789",
      email: "jobs@sms.co.th",
      website: "https://www.sms.co.th",
      industry: "Manufacturing Technology",
      description: "บริษัทผลิตและพัฒนาระบบอัตโนมัติสำหรับโรงงานอุตสาหกรรม",
      isActive: true
    },
    {
      id: 4,
      name: "Green Energy Solutions Ltd.",
      nameTH: "บริษัท กรีน เอนเนอร์ยี่ โซลูชั่น จำกัด",
      address: "321 ถนนสีเขียว แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพฯ 10230",
      phone: "02-456-7890",
      email: "internship@ges.co.th",
      website: "https://www.ges.co.th",
      industry: "Renewable Energy",
      description: "บริษัทพัฒนาและติดตั้งระบบพลังงานทดแทน โซลาร์เซลล์ และระบบประหยัดพลังงาน",
      isActive: true
    },
    {
      id: 5,
      name: "FinTech Innovations Co., Ltd.",
      nameTH: "บริษัท ฟินเทค อินโนเวชั่น จำกัด",
      address: "654 ถนนการเงิน แขวงสาทร เขตสาทร กรุงเทพฯ 10120",
      phone: "02-567-8901",
      email: "talent@fintech.co.th",
      website: "https://www.fintech.co.th",
      industry: "Financial Technology",
      description: "บริษัทพัฒนาแอปพลิเคชันและระบบการเงินดิจิทัล e-Payment และ Blockchain",
      isActive: true
    }
  ],
  
  students: [
    {
      id: 1,
      userId: 5,
      studentId: "65010001",
      major: "วิศวกรรมคอมพิวเตอร์",
      year: 4,
      gpa: 3.75,
      status: "active"
    },
    {
      id: 2,
      userId: 6,
      studentId: "65010002",
      major: "วิทยาการคอมพิวเตอร์",
      year: 4,
      gpa: 3.82,
      status: "active"
    },
    {
      id: 3,
      userId: 7,
      studentId: "65010003",
      major: "เทคโนโลยีสารสนเทศ",
      year: 4,
      gpa: 3.65,
      status: "active"
    },
    {
      id: 4,
      userId: 8,
      studentId: "65010004",
      major: "วิศวกรรมไฟฟ้า",
      year: 4,
      gpa: 3.90,
      status: "active"
    },
    {
      id: 5,
      userId: 9,
      studentId: "65010005",
      major: "การจัดการธุรกิจ",
      year: 4,
      gpa: 3.55,
      status: "active"
    }
  ],
  
  internships: [
    {
      id: 1,
      studentId: 1,
      companyId: 1,
      position: "Software Developer Intern",
      startDate: "2024-06-01",
      endDate: "2024-10-31",
      status: "approved",
      description: "พัฒนา Web Application ด้วย React และ Node.js"
    },
    {
      id: 2,
      studentId: 2,
      companyId: 2,
      position: "Digital Marketing Intern",
      startDate: "2024-06-15",
      endDate: "2024-11-15",
      status: "approved",
      description: "จัดทำแคมเปญการตลาดออนไลน์และวิเคราะห์ข้อมูล"
    },
    {
      id: 3,
      studentId: 3,
      companyId: 3,
      position: "System Analyst Intern",
      startDate: "2024-07-01",
      endDate: "2024-11-30",
      status: "in_progress",
      description: "วิเคราะห์และออกแบบระบบการผลิตอัตโนมัติ"
    },
    {
      id: 4,
      studentId: 4,
      companyId: 4,
      position: "Electrical Engineer Intern",
      startDate: "2024-08-01",
      endDate: "2024-12-31",
      status: "in_progress",
      description: "ออกแบบและติดตั้งระบบโซลาร์เซลล์"
    },
    {
      id: 5,
      studentId: 5,
      companyId: 5,
      position: "Business Analyst Intern",
      startDate: "2024-09-01",
      endDate: "2025-01-31",
      status: "pending",
      description: "วิเคราะห์กระบวนการทางธุรกิจและพัฒนา FinTech Solutions"
    }
  ]
};

// Create demo data file
const demoDataPath = path.join(__dirname, 'apps/backend/demo_data.json');
fs.writeFileSync(demoDataPath, JSON.stringify(demoData, null, 2));

console.log('🎬 Demo data created successfully!');
console.log('📁 File:', demoDataPath);
console.log('📊 Summary:');
console.log(`   - Users: ${demoData.users.length}`);
console.log(`   - Companies: ${demoData.companies.length}`);
console.log(`   - Students: ${demoData.students.length}`);
console.log(`   - Internships: ${demoData.internships.length}`);
console.log('');
console.log('👥 Demo Accounts:');
console.log('   Admin: admin@university.ac.th / password123');
console.log('   Staff: staff001@university.ac.th / password123');
console.log('   Instructor: instructor001@university.ac.th / password123');
console.log('   Students: 65010001-65010005 / password123');
console.log('');
console.log('🚀 Ready to start demo server!');