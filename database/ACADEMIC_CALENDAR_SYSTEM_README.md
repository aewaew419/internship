# ระบบปฏิทินการศึกษา (Academic Calendar System)

## ภาพรวมระบบ

ระบบปฏิทินการศึกษาถูกออกแบบมาเพื่อให้ **Super Admin** และ **Admin** สามารถตั้งค่าและจัดการปฏิทินการศึกษาได้อย่างครบถ้วน รวมถึงการกำหนดเทอม ระยะเวลา และวันหยุดต่างๆ

## 🎯 **ฟีเจอร์หลัก**

### 📅 **การจัดการปีการศึกษา**
- สร้างและจัดการปีการศึกษา
- กำหนดวันเริ่มต้นและสิ้นสุดปีการศึกษา
- ตั้งค่าปีการศึกษาปัจจุบัน

### 📚 **การจัดการเทอม/ภาคเรียน**
- เทอมต้น, เทอมปลาย, เทอมฤดูร้อน
- กำหนด Duration ของแต่ละเทอม (สัปดาห์/วัน)
- ระยะเวลาสำคัญ (ลงทะเบียน, เพิ่ม-ถอน, สอบ)

### 🏖️ **การจัดการวันหยุด**
- วันหยุดราชการ
- วันหยุดทางศาสนา  
- วันหยุดมหาวิทยาลัย
- วันหยุดระหว่างภาค

### 📋 **การจัดการเหตุการณ์สำคัญ**
- เหตุการณ์ทางวิชาการ
- กำหนดการสอบ
- การลงทะเบียน
- พิธีการต่างๆ

### ⚙️ **การตั้งค่าปฏิทิน**
- การตั้งค่าการแสดงผล
- การตั้งค่าการแจ้งเตือน
- เทมเพลตปฏิทิน

## 🏗️ **โครงสร้างฐานข้อมูล**

### ตารางหลัก

#### `academic_years` - ปีการศึกษา
```sql
- academic_year: ปีการศึกษา (เช่น '2567', '2024')
- academic_year_th/en: ชื่อปีการศึกษา
- start_date/end_date: วันเริ่มต้น/สิ้นสุด
- status: สถานะ (draft, active, completed, cancelled)
- is_current: ปีการศึกษาปัจจุบัน
```

#### `academic_terms` - เทอม/ภาคเรียน
```sql
- academic_year_id: รหัสปีการศึกษา
- term_number: เทอมที่ (1, 2, 3)
- term_code: รหัสเทอม (เช่น '2567/1', '2567/2')
- start_date/end_date: วันเริ่มต้น/สิ้นสุดเทอม
- duration_weeks/days: ระยะเวลาเทอม
- registration_start_date/end_date: ช่วงลงทะเบียน
- add_drop_end_date: วันสุดท้ายเพิ่ม-ถอน
- withdraw_end_date: วันสุดท้ายถอนวิชา
- midterm_exam_start/end: ช่วงสอบกลางภาค
- final_exam_start/end: ช่วงสอบปลายภาค
```

#### `holiday_types` - ประเภทวันหยุด
```sql
- type_code: รหัสประเภท (national, religious, university, semester_break)
- type_name_th/en: ชื่อประเภทวันหยุด
- color: สีสำหรับแสดงในปฏิทิน
- icon: ไอคอน
```

#### `academic_holidays` - วันหยุด
```sql
- academic_year_id: รหัสปีการศึกษา
- holiday_type_id: ประเภทวันหยุด
- holiday_name_th/en: ชื่อวันหยุด
- start_date/end_date: วันเริ่มต้น/สิ้นสุด
- is_single_day: วันเดียวหรือหลายวัน
- affects_classes: ส่งผลต่อการเรียนการสอน
- affects_exams: ส่งผลต่อการสอบ
- recurrence_type: การเกิดซ้ำ (none, yearly, monthly)
```

#### `academic_events` - เหตุการณ์สำคัญ
```sql
- academic_year_id/term_id: ปีการศึกษา/เทอม
- event_name_th/en: ชื่อเหตุการณ์
- event_type: ประเภท (registration, exam, graduation, orientation)
- start_date/end_date: วันที่เหตุการณ์
- location: สถานที่
- priority: ความสำคัญ (low, normal, high, urgent)
- notification_enabled: เปิดการแจ้งเตือน
- notification_days_before: แจ้งเตือนก่อนกี่วัน
```

### ตารางเสริม

#### `calendar_settings` - การตั้งค่าปฏิทิน
#### `calendar_templates` - เทมเพลตปฏิทิน

## 🚀 **การติดตั้งและใช้งาน**

### ขั้นตอนที่ 1: สร้างระบบปฏิทินการศึกษา
```sql
\i database/add-academic-calendar-system.sql
```

### ขั้นตอนที่ 2: เพิ่มข้อมูลตัวอย่าง
```sql
\i database/insert-academic-calendar-sample-data.sql
```

## 📋 **ข้อมูลตัวอย่างที่มี**

### 🗓️ **ปีการศึกษา 2567**
- **ระยะเวลา**: 1 มิถุนายน 2024 - 31 พฤษภาคม 2025
- **สถานะ**: Active (ปัจจุบัน)

### 📚 **เทอม/ภาคเรียน**

#### **เทอมต้น 2567/1**
- **ระยะเวลา**: 19 สิงหาคม - 20 ธันวาคม 2024
- **Duration**: 18 สัปดาห์ (124 วัน)
- **ลงทะเบียน**: 15 กรกฎาคม - 16 สิงหาคม 2024
- **เพิ่ม-ถอน**: ถึง 30 สิงหาคม 2024
- **ถอนวิชา**: ถึง 25 ตุลาคม 2024
- **สอบกลางภาค**: 14-18 ตุลาคม 2024
- **สอบปลายภาค**: 9-20 ธันวาคม 2024
- **สถานะ**: Completed

#### **เทอมปลาย 2567/2** 
- **ระยะเวลา**: 13 มกราคม - 16 พฤษภาคม 2025
- **Duration**: 18 สัปดาห์ (124 วัน)
- **ลงทะเบียน**: 2 ธันวาคม 2024 - 10 มกราคม 2025
- **เพิ่ม-ถอน**: ถึง 24 มกราคม 2025
- **ถอนวิชา**: ถึง 21 มีนาคม 2025
- **สอบกลางภาค**: 10-14 มีนาคม 2025
- **สอบปลายภาค**: 5-16 พฤษภาคม 2025
- **สถานะ**: Active (ปัจจุบัน)

#### **เทอมฤดูร้อน 2567/S**
- **ระยะเวลา**: 2 มิถุนายน - 25 กรกฎาคม 2025
- **Duration**: 8 สัปดาห์ (54 วัน)
- **ลงทะเบียน**: 19-30 พฤษภาคม 2025
- **สถานะ**: Draft

### 🏖️ **วันหยุดประจำปี 2567**

#### **วันหยุดราชการ**
- **วันขึ้นปีใหม่**: 1 มกราคม 2025
- **วันมาฆบูชา**: 12 กุมภาพันธ์ 2025
- **วันจักรี**: 6 เมษายน 2025
- **วันสงกรานต์**: 13-15 เมษายน 2025
- **วันแรงงาน**: 1 พฤษภาคม 2025
- **วันฉัตรมงคล**: 4 พฤษภาคม 2025
- **วันวิสาขบูชา**: 11 พฤษภาคม 2025

#### **วันหยุดระหว่างภาค**
- **ระหว่างเทอมต้น-เทอมปลาย**: 21 ธันวาคม 2024 - 12 มกราคม 2025
- **วันหยุดฤดูร้อน**: 17 พฤษภาคม - 1 มิถุนายน 2025

#### **วันหยุดมหาวิทยาลัย**
- **วันก่อตั้งมหาวิทยาลัย**: 4 เมษายน 2025

## 🛠️ **Functions สำหรับการจัดการ**

### ดึงปีการศึกษาปัจจุบัน
```sql
SELECT * FROM get_current_academic_year();
-- ผลลัพธ์: ข้อมูลปีการศึกษาปัจจุบัน
```

### ดึงเทอมปัจจุบัน
```sql
SELECT * FROM get_current_academic_term();
-- ผลลัพธ์: ข้อมูลเทอมปัจจุบัน
```

### คำนวณวันทำการ (ไม่รวมวันหยุด)
```sql
SELECT calculate_working_days('2025-01-01', '2025-01-31', 1);
-- ผลลัพธ์: จำนวนวันทำการในเดือนมกราคม 2025
```

### ตรวจสอบวันหยุด
```sql
SELECT is_holiday('2025-01-01', 1);
-- ผลลัพธ์: true (วันขึ้นปีใหม่)
```

### ดึงวันหยุดในช่วงเวลา
```sql
SELECT * FROM get_holidays_in_period('2025-01-01', '2025-01-31', 1);
-- ผลลัพธ์: รายการวันหยุดในเดือนมกราคม 2025
```

## 📊 **Views สำหรับการใช้งาน**

### 1. ปฏิทินการศึกษาแบบรวม
```sql
SELECT * FROM academic_calendar_view;
-- แสดงปีการศึกษา, เทอม, วันหยุด, เหตุการณ์ในมุมมองเดียว
```

### 2. เหตุการณ์ที่จะมาถึง
```sql
SELECT * FROM upcoming_events;
-- แสดงเหตุการณ์ที่จะเกิดขึ้น เรียงตามวันที่
```

### 3. วันหยุดในปีปัจจุบัน
```sql
SELECT * FROM current_year_holidays;
-- แสดงวันหยุดทั้งหมดในปีการศึกษาปัจจุบัน
```

### 4. สรุปปฏิทินรายเดือน
```sql
SELECT * FROM monthly_calendar_summary;
-- สรุปจำนวนเหตุการณ์และวันหยุดในแต่ละเดือน
```

## ⚙️ **การตั้งค่าปฏิทิน**

### การตั้งค่าทั่วไป
- `academic_year_start_month` - เดือนเริ่มต้นปีการศึกษา (6 = มิถุนายน)
- `default_term_duration_weeks` - ระยะเวลาเทอมมาตรฐาน (18 สัปดาห์)
- `summer_term_duration_weeks` - ระยะเวลาเทอมฤดูร้อน (8 สัปดาห์)

### การตั้งค่าการแสดงผล
- `calendar_default_view` - มุมมองเริ่มต้น (month, week, day, agenda)
- `show_weekends` - แสดงวันหยุดสุดสัปดาห์
- `highlight_current_day` - เน้นวันปัจจุบัน

### การตั้งค่าการแจ้งเตือน
- `enable_event_notifications` - เปิดการแจ้งเตือนเหตุการณ์
- `default_notification_days` - จำนวนวันแจ้งเตือนล่วงหน้า (7 วัน)
- `notification_time` - เวลาส่งการแจ้งเตือน (09:00)

## 🎨 **เทมเพลตปฏิทิน**

### 1. ปีการศึกษามาตรฐาน (Standard Academic Year)
- **เทอมต้น**: สิงหาคม-ธันวาคม (18 สัปดาห์)
- **เทอมปลาย**: มกราคม-พฤษภาคม (18 สัปดาห์)  
- **เทอมฤดูร้อน**: มิถุนายน-กรกฎาคม (8 สัปดาห์)

### 2. ระบบไตรมาส (Trimester System)
- **ไตรมาสที่ 1**: สิงหาคม-พฤศจิกายน (16 สัปดาห์)
- **ไตรมาสที่ 2**: ธันวาคม-มีนาคม (16 สัปดาห์)
- **ไตรมาสที่ 3**: เมษายน-กรกฎาคม (16 สัปดาห์)

## 🔍 **ตัวอย่างการใช้งาน**

### ดูปฏิทินเทอมปัจจุบัน
```sql
SELECT 
    at.term_name_th,
    at.start_date,
    at.end_date,
    at.duration_weeks,
    COUNT(ah.id) as holiday_count
FROM academic_terms at
LEFT JOIN academic_holidays ah ON (
    ah.academic_term_id = at.id 
    AND ah.is_active = true
)
WHERE at.is_current = true
GROUP BY at.id, at.term_name_th, at.start_date, at.end_date, at.duration_weeks;
```

### ดูเหตุการณ์สำคัญในเดือนนี้
```sql
SELECT 
    ae.event_name_th,
    ae.start_date,
    ae.event_type,
    ae.priority,
    ae.location
FROM academic_events ae
WHERE ae.is_active = true
    AND DATE_TRUNC('month', ae.start_date) = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY ae.start_date, ae.priority DESC;
```

### ดูสถิติวันหยุดตามประเภท
```sql
SELECT 
    ht.type_name_th,
    COUNT(ah.id) as holiday_count,
    SUM(ah.end_date - ah.start_date + 1) as total_days
FROM holiday_types ht
LEFT JOIN academic_holidays ah ON (
    ht.id = ah.holiday_type_id 
    AND ah.is_active = true
    AND ah.academic_year_id = (
        SELECT id FROM academic_years WHERE is_current = true
    )
)
GROUP BY ht.id, ht.type_name_th
ORDER BY holiday_count DESC;
```

## 🔧 **การบำรุงรักษา**

### สร้างปีการศึกษาใหม่
```sql
INSERT INTO academic_years (
    academic_year, academic_year_th, academic_year_en,
    start_date, end_date, status, created_by
) VALUES (
    '2568', 'ปีการศึกษา 2568', 'Academic Year 2025',
    '2025-06-01', '2026-05-31', 'draft', 1
);
```

### คัดลอกวันหยุดจากปีก่อน
```sql
INSERT INTO academic_holidays (
    academic_year_id, holiday_type_id, holiday_name, 
    holiday_name_th, holiday_name_en, start_date, end_date,
    is_single_day, affects_classes, affects_exams, created_by
)
SELECT 
    (SELECT id FROM academic_years WHERE academic_year = '2568'),
    holiday_type_id, holiday_name, holiday_name_th, holiday_name_en,
    start_date + INTERVAL '1 year', end_date + INTERVAL '1 year',
    is_single_day, affects_classes, affects_exams, 1
FROM academic_holidays
WHERE academic_year_id = (
    SELECT id FROM academic_years WHERE academic_year = '2567'
)
AND recurrence_type = 'yearly';
```

ระบบปฏิทินการศึกษานี้ให้ Super Admin และ Admin จัดการปฏิทินการศึกษาได้อย่างครบถ้วนและยืดหยุ่น!