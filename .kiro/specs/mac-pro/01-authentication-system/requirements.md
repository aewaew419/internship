# Authentication System Enhancement - Mac Pro Tasks

## Introduction
ระบบ authentication ที่ปรับปรุงให้รองรับการลงทะเบียนและ login ด้วยรหัสนักศึกษา พร้อม Super Admin แยกต่างหาก

## Machine Assignment
**Mac Pro 2017 (i5, 16GB)** - เหมาะสำหรับงาน backend ที่ซับซ้อน

## Requirements

### Requirement 1: Database Schema Enhancement
**User Story:** ในฐานะ Backend Developer ผมต้องการ database schema ที่รองรับ student_id เป็น primary key

#### Acceptance Criteria
1. WHEN สร้าง users table THEN ระบบ SHALL ใช้ student_id เป็น PRIMARY KEY
2. WHEN เก็บ email THEN ระบบ SHALL ใช้เป็น FOREIGN KEY และ UNIQUE
3. WHEN สร้าง super_admins table THEN ระบบ SHALL แยกจาก users table
4. IF มี constraint violation THEN ระบบ SHALL แสดง error ที่ชัดเจน

### Requirement 2: Go Backend API Development
**User Story:** ในฐานะ API Developer ผมต้องการ endpoints สำหรับ authentication ทั้งนักศึกษาและ super admin

#### Acceptance Criteria
1. WHEN student login THEN API SHALL รับ student_id และ password
2. WHEN student register THEN API SHALL validate student_id format และ email uniqueness
3. WHEN super admin login THEN API SHALL ใช้ path แยกต่างหากและรับ email เท่านั้น
4. IF authentication สำเร็จ THEN API SHALL return JWT token

### Requirement 3: Security Implementation
**User Story:** ในฐานะ Security Engineer ผมต้องการระบบรักษาความปลอดภัยที่แข็งแกร่ง

#### Acceptance Criteria
1. WHEN hash password THEN ระบบ SHALL ใช้ bcrypt
2. WHEN generate JWT THEN ระบบ SHALL มี expiration time
3. WHEN validate token THEN ระบบ SHALL ตรวจสอบ signature และ expiry
4. IF มี security breach attempt THEN ระบบ SHALL log และ block IP