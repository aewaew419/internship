# ระบบจัดการเอกสารสหกิจศึกษา (Document Management System)

## ภาพรวมระบบ

ระบบจัดการเอกสารสหกิจศึกษาถูกออกแบบมาเพื่อจัดการเอกสารต่างๆ ที่เกี่ยวข้องกับการฝึกงานของนักศึกษา รวมถึงการอนุมัติ การติดตาม และการรายงาน

## โครงสร้างฐานข้อมูล

### ตารางหลัก

1. **document_types** - ประเภทเอกสาร
   - เก็บข้อมูลประเภทเอกสารต่างๆ เช่น หนังสือขอความอนุเคราะห์ รายงานสัปดาห์ รายงานฉบับสมบูรณ์
   - กำหนดขนาดไฟล์สูงสุด นามสกุลไฟล์ที่อนุญาต

2. **documents** - เอกสารหลัก
   - เก็บข้อมูลเอกสารทั้งหมด
   - รองรับการจัดการเวอร์ชัน
   - มีระบบ metadata และ tags สำหรับการค้นหา

3. **document_approvals** - การอนุมัติเอกสาร
   - จัดการขั้นตอนการอนุมัติ
   - รองรับการมอบหมายงาน (delegation)

4. **document_comments** - ความคิดเห็นเอกสาร
   - ระบบความคิดเห็นแบบ nested (reply)
   - แยกความคิดเห็นภายในและภายนอก

5. **document_templates** - เทมเพลตเอกสาร
   - เก็บเทมเพลตสำหรับสร้างเอกสารใหม่
   - ติดตามการใช้งาน

### ตารางเสริม

6. **document_history** - ประวัติการเปลี่ยนแปลง
7. **document_shares** - การแชร์เอกสาร
8. **document_downloads** - สถิติการดาวน์โหลด
9. **document_notifications** - การแจ้งเตือน

## การติดตั้ง

### ขั้นตอนที่ 1: สร้างตารางเอกสาร
```sql
-- รันไฟล์สร้างตารางเอกสาร
\i database/add-document-tables.sql
```

### ขั้นตอนที่ 2: เพิ่มข้อมูลตัวอย่าง
```sql
-- รันไฟล์เพิ่มข้อมูลตัวอย่าง
\i database/insert-document-sample-data.sql
```

## ประเภทเอกสาร

### เอกสารที่จำเป็น (Required)
1. **หนังสือขอความอนุเคราะห์** - ขอความอนุเคราะห์จากบริษัท
2. **หนังสือส่งตัวนักศึกษา** - ส่งตัวนักศึกษาไปยังบริษัท
3. **หนังสือตอบรับเข้าฝึกงาน** - ยืนยันการรับเข้าฝึกงานจากบริษัท
4. **รายงานสัปดาห์** - รายงานการฝึกงานประจำสัปดาห์
5. **รายงานประจำเดือน** - รายงานการฝึกงานประจำเดือน
6. **รายงานฉบับสมบูรณ์** - รายงานการฝึกงานฉบับสมบูรณ์
7. **แบบประเมินจากบริษัท** - แบบประเมินการฝึกงานจากบริษัท

### เอกสารเสริม (Optional)
8. **สไลด์นำเสนอ** - สไลด์สำหรับการนำเสนอผลงาน
9. **หนังสือรับรอง** - หนังสือรับรองการฝึกงาน
10. **เอกสารอื่นๆ** - เอกสารอื่นๆ ที่เกี่ยวข้อง

## สถานะเอกสาร

- **draft** - ร่าง (ยังไม่ส่ง)
- **submitted** - ส่งแล้ว (รอการตรวจสอบ)
- **under_review** - กำลังตรวจสอบ
- **approved** - อนุมัติแล้ว
- **rejected** - ไม่อนุมัติ
- **expired** - หมดอายุ

## ระดับการเข้าถึง

- **public** - เข้าถึงได้ทุกคน
- **normal** - เข้าถึงได้ตามสิทธิ์ปกติ
- **restricted** - เข้าถึงได้เฉพาะกลุ่ม
- **confidential** - เข้าถึงได้เฉพาะผู้ที่ได้รับอนุญาต

## การใช้งาน Views

### ดูสถิติเอกสาร
```sql
SELECT * FROM document_statistics;
```

### ดูเอกสารที่ใกล้ครบกำหนด
```sql
SELECT * FROM documents_due_soon;
```

### ดูเอกสารที่เกินกำหนด
```sql
SELECT * FROM documents_overdue;
```

## ตัวอย่างการ Query

### ดูเอกสารทั้งหมดของนักศึกษา
```sql
SELECT 
    d.title_th,
    dt.name_th as document_type,
    d.status,
    d.created_at,
    d.due_date
FROM documents d
JOIN document_types dt ON d.document_type_id = dt.id
JOIN students s ON d.student_id = s.id
WHERE s.student_id = 'test001'
ORDER BY d.created_at DESC;
```

### ดูเอกสารที่รอการอนุมัติ
```sql
SELECT 
    d.title_th,
    dt.name_th as document_type,
    CONCAT(u.first_name, ' ', u.last_name) as student_name,
    s.student_id,
    d.submitted_at
FROM documents d
JOIN document_types dt ON d.document_type_id = dt.id
JOIN students s ON d.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE d.status = 'submitted'
ORDER BY d.submitted_at ASC;
```

### ดูประวัติการเปลี่ยนแปลงเอกสาร
```sql
SELECT 
    dh.action,
    dh.description,
    CONCAT(u.first_name, ' ', u.last_name) as user_name,
    dh.created_at
FROM document_history dh
JOIN users u ON dh.user_id = u.id
WHERE dh.document_id = 1
ORDER BY dh.created_at DESC;
```

## Features หลัก

### 1. การจัดการเวอร์ชัน
- รองรับการอัพโหลดเอกสารหลายเวอร์ชัน
- ติดตามเอกสารเวอร์ชันล่าสุด

### 2. ระบบอนุมัติ
- รองรับการอนุมัติหลายขั้นตอน
- การมอบหมายงานอนุมัติ

### 3. การแจ้งเตือน
- แจ้งเตือนเมื่อใกล้ครบกำหนด
- แจ้งเตือนเมื่อมีการอนุมัติ/ไม่อนุมัติ
- แจ้งเตือนเมื่อมีความคิดเห็นใหม่

### 4. การแชร์เอกสาร
- แชร์เอกสารให้ผู้อื่นดู
- กำหนดสิทธิ์การเข้าถึง
- กำหนดวันหมดอายุ

### 5. สถิติและรายงาน
- สถิติการใช้งานเอกสาร
- รายงานการดาวน์โหลด
- ติดตามความคืบหน้า

## การบำรุงรักษา

### ทำความสะอาดไฟล์เก่า
```sql
-- ลบเอกสารที่หมดอายุแล้ว
DELETE FROM documents 
WHERE expired_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
```

### อัพเดทสถิติ
```sql
-- อัพเดทจำนวนการใช้งานเทมเพลต
UPDATE document_templates dt
SET usage_count = (
    SELECT COUNT(*) 
    FROM documents d 
    WHERE d.document_type_id = dt.document_type_id
);
```

## การสำรองข้อมูล

แนะนำให้สำรองข้อมูลตารางเอกสารเป็นประจำ:

```bash
# สำรองข้อมูลเอกสาร
pg_dump -t documents -t document_* your_database > document_backup.sql
```

## การแก้ไขปัญหา

### ปัญหาไฟล์ขนาดใหญ่
- ตรวจสอบการตั้งค่า `max_file_size` ในตาราง `document_types`
- ปรับการตั้งค่า PostgreSQL สำหรับ large objects

### ปัญหาประสิทธิภาพ
- ตรวจสอบ indexes ที่สร้างไว้
- วิเคราะห์ query plans สำหรับ queries ที่ช้า

### ปัญหาการแจ้งเตือน
- ตรวจสอบการตั้งค่าอีเมล
- ตรวจสอบ triggers สำหรับการสร้างการแจ้งเตือนอัตโนมัติ