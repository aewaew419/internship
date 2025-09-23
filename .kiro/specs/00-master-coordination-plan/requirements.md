# Requirements Document - Parallel Development Coordination

## Introduction

ระบบการประสานงานการพัฒนาแบบ parallel สำหรับโปรเจคสหกิจศึกษา โดยแบ่งงานตามขีดความสามารถของเครื่องและจัดลำดับความสำคัญตาม flow หลัก เพื่อให้สามารถ deploy ได้ภายในวันพฤหัสบดีโดยไม่มี error

## Hardware Specifications

### Mac Pro 2017
- CPU: i5
- RAM: 16GB
- Role: Primary development machine for complex tasks

### Lenovo G400
- CPU: i3  
- RAM: 12GB
- Role: Secondary development machine for lighter tasks

## Requirements

### Requirement 1: Priority Flow Management

**User Story:** ในฐานะ Project Manager ผมต้องการจัดลำดับงานตาม flow สีฟ้าเขียวในแผนภาพ เพื่อให้สามารถนำเสนอได้ในวันพฤหัสบดี

#### Acceptance Criteria

1. WHEN จัดลำดับงาน THEN ระบบ SHALL แสดงงานตาม flow สีฟ้าเขียวเป็นลำดับแรก
2. WHEN กำหนดเครื่อง THEN ระบบ SHALL แบ่งงานตามขีดความสามารถของ Mac Pro (i5, 16GB) และ Lenovo (i3, 12GB)
3. WHEN ตั้งชื่อ folder THEN ระบบ SHALL ขึ้นต้นด้วยตัวเลขตามลำดับความสำคัญ
4. IF งานเป็น critical path THEN ระบบ SHALL กำหนดให้เครื่อง Mac Pro ทำงานนั้น

### Requirement 2: Authentication System Enhancement

**User Story:** ในฐานะ Developer ผมต้องการปรับปรุงระบบ authentication ให้รองรับการลงทะเบียนและ login ด้วยรหัสนักศึกษา

#### Acceptance Criteria

1. WHEN นักศึกษาเข้าสู่ระบบ THEN ระบบ SHALL รองรับ login ด้วยรหัสนักศึกษา
2. WHEN นักศึกษาลงทะเบียน THEN ระบบ SHALL ใช้รหัสนักศึกษาเป็น Primary Key และ email เป็น Foreign Key
3. WHEN เข้าหน้าแรก THEN ระบบ SHALL แสดงทั้งปุ่ม Login และ Sign Up
4. IF ผู้ใช้ยังไม่มีบัญชี THEN ระบบ SHALL นำไปหน้าลงทะเบียน

### Requirement 3: User Role Management System

**User Story:** ในฐานะ System Administrator ผมต้องการระบบจัดการ user role ที่ครอบคลุมทุกประเภทผู้ใช้

#### Acceptance Criteria

1. WHEN กำหนด role THEN ระบบ SHALL รองรับ Super Admin, Admin, เจ้าหน้าที่, อาจารย์ประจำวิชา, กรรมการ, อาจารย์นิเทศ, นักศึกษา
2. WHEN Super Admin login THEN ระบบ SHALL ใช้ path ทางเข้าต่างหากและ login ด้วย email เท่านั้น
3. WHEN อาจารย์มีหลาย role THEN ระบบ SHALL อนุญาตให้มีได้ไม่เกิน 3 บทบาท
4. IF ผู้ใช้เป็นนักศึกษา THEN ระบบ SHALL แบ่งเป็นสหกิจ (มี/ไม่มีหัวข้อโปรเจค) และฝึกงาน

### Requirement 4: Official Document Generation

**User Story:** ในฐานะเจ้าหน้าที่ ผมต้องการระบบสร้างเอกสารทางราชการที่สามารถปริ้นเป็น PDF ได้

#### Acceptance Criteria

1. WHEN สร้างเอกสารไทย THEN ระบบ SHALL ใช้เลขไทย
2. WHEN สร้างเอกสารอังกฤษ THEN ระบบ SHALL ใช้เลขอารบิก
3. WHEN ปริ้นเอกสาร THEN ระบบ SHALL สร้างไฟล์ PDF ที่พร้อมใช้งาน
4. IF เอกสารมีข้อมูลไม่ครบ THEN ระบบ SHALL แจ้งเตือนก่อนสร้าง PDF

### Requirement 5: Super Admin Configuration Panel

**User Story:** ในฐานะ Super Admin ผมต้องการหน้าตั้งค่าสำหรับจัดการระบบทั้งหมด

#### Acceptance Criteria

1. WHEN เข้า Super Admin panel THEN ระบบ SHALL แสดง User Role Management matrix
2. WHEN กำหนดสิทธิ์ THEN ระบบ SHALL ใช้ checkbox matrix (role vs module)
3. WHEN จัดการปฏิทินการศึกษา THEN ระบบ SHALL อนุญาตให้เพิ่ม/แก้ไข เทอม, ระยะเวลา, วันหยุด
4. IF มีการเปลี่ยนแปลงสิทธิ์ THEN ระบบ SHALL บันทึก log การเปลี่ยนแปลง

### Requirement 6: Title Prefix Management

**User Story:** ในฐานะ Admin ผมต้องการจัดการคำนำหน้าชื่อที่ใช้ในระบบ

#### Acceptance Criteria

1. WHEN จัดการคำนำหน้า THEN ระบบ SHALL อนุญาตให้เพิ่ม/ลบ คำนำหน้าได้
2. WHEN กำหนดสิทธิ์ใช้ THEN ระบบ SHALL ระบุว่า role ไหนใช้คำนำหน้าไหนได้
3. WHEN มีคำนำหน้าเริ่มต้น THEN ระบบ SHALL มี นาย, นาง, นางสาว, ดร., รศ.ดร., ร.ต.ท., ว่าที่ สิบตรี
4. IF นักศึกษาเป็นทหาร THEN ระบบ SHALL อนุญาตให้ใช้คำนำหน้าทหารได้ตาม checkbox

### Requirement 7: Monorepo Migration with Go Backend

**User Story:** ในฐานะ Developer ผมต้องการแปลงระบบเป็น monorepo และใช้ Go backend

#### Acceptance Criteria

1. WHEN แปลง monorepo THEN ระบบ SHALL รักษาฟังก์ชันเดิมไว้ทั้งหมด
2. WHEN ใช้ Go backend THEN ระบบ SHALL ตรวจสอบการเชื่อมต่อฐานข้อมูลให้ใช้งานได้
3. WHEN deploy THEN ระบบ SHALL ไม่มี error ใดๆ
4. IF มี error THEN ระบบ SHALL แสดง log ที่ชัดเจนเพื่อการแก้ไข