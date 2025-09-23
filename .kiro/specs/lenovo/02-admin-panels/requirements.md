# Super Admin Configuration Panels - Lenovo Tasks

## Introduction
หน้า UI สำหรับ Super Admin จัดการระบบทั้งหมด รวมถึง role management และการตั้งค่าต่างๆ

## Machine Assignment
**Lenovo G400 (i3, 12GB)** - เหมาะสำหรับ complex UI components

## Requirements

### Requirement 1: Role Management Matrix UI
**User Story:** ในฐานะ UI Developer ผมต้องการ interface สำหรับจัดการ role permissions แบบ matrix

#### Acceptance Criteria
1. WHEN display matrix THEN UI SHALL show roles as columns และ modules as rows
2. WHEN toggle permission THEN UI SHALL update checkbox และ save automatically
3. WHEN show conflicts THEN UI SHALL highlight conflicting permissions
4. IF save fails THEN UI SHALL show error และ revert changes

### Requirement 2: Academic Calendar Interface
**User Story:** ในฐานะ Calendar Manager ผมต้องการ UI สำหรับจัดการปฏิทินการศึกษา

#### Acceptance Criteria
1. WHEN create semester THEN UI SHALL มี date picker สำหรับ start/end dates
2. WHEN add holiday THEN UI SHALL validate date conflicts
3. WHEN view calendar THEN UI SHALL show visual timeline
4. IF date invalid THEN UI SHALL show validation message

### Requirement 3: Title Prefix Management UI
**User Story:** ในฐานะ Admin Interface Developer ผมต้องการ UI สำหรับจัดการคำนำหน้าชื่อ

#### Acceptance Criteria
1. WHEN manage prefixes THEN UI SHALL allow add/edit/delete operations
2. WHEN assign to roles THEN UI SHALL show checkbox matrix
3. WHEN show defaults THEN UI SHALL pre-populate common prefixes
4. IF assignment conflict THEN UI SHALL show warning message