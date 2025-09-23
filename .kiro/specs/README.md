# 📋 Specs Organization - Internship Management System

## 🏗️ **New Organized Structure**

```
.kiro/specs/
├── 📁 00-master-coordination-plan/     # Master plan ครอบคลุมทั้งหมด
├── 📁 mac-pro/                         # งานสำหรับ Mac Pro (i5, 16GB)
│   ├── 📁 01-authentication-system/    # ระบบ Authentication (Backend)
│   ├── 📁 02-role-management-system/   # ระบบจัดการ Roles (Complex Logic)
│   └── 📁 03-document-generation/      # สร้าง PDF Documents (CPU Intensive)
├── 📁 lenovo/                          # งานสำหรับ Lenovo G400 (i3, 12GB)
│   ├── 📁 01-authentication-ui/        # UI สำหรับ Authentication
│   ├── 📁 02-admin-panels/            # Admin Configuration Panels
│   └── 📁 03-testing-documentation/    # Testing & Documentation
└── 📁 shared/                          # งานที่ต้องประสานกัน
    └── 📁 01-integration-deployment/   # Integration & Deployment
```

## 🎯 **Priority และ Timeline**

### **วันอังคาร (วันนี้)**
**Mac Pro Tasks:**
- `mac-pro/01-authentication-system` - Database schema + Go API
- เริ่ม `mac-pro/02-role-management-system` - Role database design

**Lenovo Tasks:**
- `lenovo/01-authentication-ui` - Login/Registration forms
- เริ่ม `lenovo/02-admin-panels` - Basic admin UI

### **วันพุธ (Critical Day)**
**Mac Pro Tasks:**
- Complete `mac-pro/02-role-management-system` - Role API + Permission engine
- Complete `mac-pro/03-document-generation` - PDF generation system

**Lenovo Tasks:**
- Complete `lenovo/02-admin-panels` - Role matrix UI + Calendar UI
- Start `lenovo/03-testing-documentation` - Testing suite

### **วันพฤหัส (Presentation Day)**
**Both Machines:**
- `shared/01-integration-deployment` - Final integration
- Testing และ deployment verification
- Presentation preparation

## 🖥️ **Machine Allocation Strategy**

### **Mac Pro 2017 (i5, 16GB) - Heavy Tasks**
- ✅ **Database Operations** - Complex schema design และ migrations
- ✅ **Go Backend Development** - API endpoints และ business logic
- ✅ **PDF Generation** - CPU-intensive document processing
- ✅ **Performance Optimization** - Database tuning และ API optimization
- ✅ **Security Implementation** - Authentication และ authorization logic

### **Lenovo G400 (i3, 12GB) - Light Tasks**
- ✅ **Frontend Components** - React/Next.js UI development
- ✅ **Form Interfaces** - User input forms และ validation
- ✅ **Admin Panels** - Configuration interfaces
- ✅ **Testing** - Unit tests และ component testing
- ✅ **Documentation** - Technical writing และ user guides

## 🔄 **Workflow Instructions**

### **เริ่มงานใหม่:**
1. เลือก spec folder ตามเครื่องที่ใช้ (`mac-pro/` หรือ `lenovo/`)
2. เปิดไฟล์ `requirements.md` ใน spec ที่ต้องการ
3. อ่าน requirements และ acceptance criteria
4. เริ่มทำงานตาม priority ที่กำหนด

### **ประสานงาน:**
- ใช้ Git branches แยกตามเครื่อง: `mac-pro/feature-name`, `lenovo/feature-name`
- Merge เข้า main branch เมื่อ feature เสร็จสมบูรณ์
- ใช้ `shared/` specs สำหรับงานที่ต้องประสานกัน

### **ติดตามความคืบหน้า:**
- Update status ใน master plan (`00-master-coordination-plan/tasks.md`)
- ใช้ commit messages ที่ชัดเจน: `[mac-pro] implement auth API` หรือ `[lenovo] add login form`

## 📊 **Success Metrics**

- ✅ **Tuesday EOD**: Authentication system functional
- ✅ **Wednesday EOD**: Role management + Document generation working
- ✅ **Thursday Morning**: Full system integration complete
- ✅ **Thursday Presentation**: Zero errors, all features demo-ready

## 🚨 **Critical Path Items**

1. **Authentication System** (Mac Pro) - ต้องเสร็จก่อนเพื่อให้ UI ทดสอบได้
2. **Role Management** (Mac Pro) - จำเป็นสำหรับ admin panel functionality
3. **Admin UI** (Lenovo) - ต้องพร้อมสำหรับการนำเสนอ
4. **Integration** (Both) - Final step ก่อนนำเสนอ

---

**Last Updated**: September 23, 2025  
**Status**: Ready for Development 🚀