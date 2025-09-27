-- ข้อมูลตัวอย่างสำหรับระบบปฏิทินการศึกษา
-- รันไฟล์นี้หลังจาก add-academic-calendar-system.sql แล้ว

-- เพิ่มประเภทวันหยุด
INSERT INTO holiday_types (type_code, type_name, type_name_th, type_name_en, description, color, icon) VALUES
('national', 'National Holiday', 'วันหยุดราชการ', 'National Holiday', 'วันหยุดราชการประจำชาติ', '#dc2626', 'flag'),
('religious', 'Religious Holiday', 'วันหยุดทางศาสนา', 'Religious Holiday', 'วันหยุดทางศาสนา', '#7c3aed', 'star'),
('university', 'University Holiday', 'วันหยุดมหาวิทยาลัย', 'University Holiday', 'วันหยุดเฉพาะมหาวิทยาลัย', '#059669', 'building'),
('semester_break', 'Semester Break', 'วันหยุดระหว่างภาค', 'Semester Break', 'วันหยุดระหว่างภาคเรียน', '#ea580c', 'calendar'),
('exam_period', 'Exam Period', 'ช่วงสอบ', 'Exam Period', 'ช่วงเวลาสอบ', '#0891b2', 'clipboard-check');

-- เพิ่มปีการศึกษา
INSERT INTO academic_years (academic_year, academic_year_th, academic_year_en, start_date, end_date, status, is_current, description, created_by) VALUES
('2567', 'ปีการศึกษา 2567', 'Academic Year 2024', '2024-06-01', '2025-05-31', 'active', true, 'ปีการศึกษา 2567 (พ.ศ. 2567)', 1),
('2568', 'ปีการศึกษา 2568', 'Academic Year 2025', '2025-06-01', '2026-05-31', 'draft', false, 'ปีการศึกษา 2568 (พ.ศ. 2568)', 1);

-- เพิ่มเทอม/ภาคเรียน สำหรับปีการศึกษา 2567
INSERT INTO academic_terms (academic_year_id, term_number, term_name, term_name_th, term_name_en, term_code, start_date, end_date, duration_weeks, duration_days, registration_start_date, registration_end_date, add_drop_end_date, withdraw_end_date, midterm_exam_start, midterm_exam_end, final_exam_start, final_exam_end, status, is_current, created_by) VALUES

-- เทอมต้น 2567/1
(1, 1, 'เทอมต้น', 'เทอมต้น', 'First Semester', '2567/1', '2024-08-19', '2024-12-20', 18, 124, '2024-07-15', '2024-08-16', '2024-08-30', '2024-10-25', '2024-10-14', '2024-10-18', '2024-12-09', '2024-12-20', 'completed', false, 1),

-- เทอมปลาย 2567/2  
(1, 2, 'เทอมปลาย', 'เทอมปลาย', 'Second Semester', '2567/2', '2025-01-13', '2025-05-16', 18, 124, '2024-12-02', '2025-01-10', '2025-01-24', '2025-03-21', '2025-03-10', '2025-03-14', '2025-05-05', '2025-05-16', 'active', true, 1),

-- เทอมฤดูร้อน 2567/S
(1, 3, 'เทอมฤดูร้อน', 'เทอมฤดูร้อน', 'Summer Semester', '2567/S', '2025-06-02', '2025-07-25', 8, 54, '2025-05-19', '2025-05-30', '2025-06-06', '2025-06-27', '2025-06-23', '2025-06-25', '2025-07-21', '2025-07-25', 'draft', false, 1);-- เพิ่มวัน
หยุดราชการประจำปี 2567
INSERT INTO academic_holidays (academic_year_id, holiday_type_id, holiday_name, holiday_name_th, holiday_name_en, start_date, end_date, is_single_day, is_active, affects_classes, affects_exams, description, created_by) VALUES

-- วันหยุดราชการ
(1, 1, 'วันขึ้นปีใหม่', 'วันขึ้นปีใหม่', 'New Year''s Day', '2025-01-01', '2025-01-01', true, true, true, true, 'วันขึ้นปีใหม่ 2568', 1),
(1, 1, 'วันมาฆบูชา', 'วันมาฆบูชา', 'Makha Bucha Day', '2025-02-12', '2025-02-12', true, true, true, true, 'วันมาฆบูชา ปี 2568', 1),
(1, 1, 'วันจักรี', 'วันจักรี', 'Chakri Memorial Day', '2025-04-06', '2025-04-06', true, true, true, true, 'วันจักรี (6 เมษายน)', 1),
(1, 1, 'วันสงกรานต์', 'วันสงกรานต์', 'Songkran Festival', '2025-04-13', '2025-04-15', false, true, true, true, 'วันสงกรานต์ 13-15 เมษายน', 1),
(1, 1, 'วันแรงงาน', 'วันแรงงานแห่งชาติ', 'National Labour Day', '2025-05-01', '2025-05-01', true, true, true, true, 'วันแรงงานแห่งชาติ', 1),
(1, 1, 'วันฉัตรมงคล', 'วันฉัตรมงคล', 'Coronation Day', '2025-05-04', '2025-05-04', true, true, true, true, 'วันฉัตรมงคล', 1),
(1, 1, 'วันวิสาขบูชา', 'วันวิสาขบูชา', 'Visakha Bucha Day', '2025-05-11', '2025-05-11', true, true, true, true, 'วันวิสาขบูชา', 1),

-- วันหยุดระหว่างภาค
(1, 4, 'วันหยุดระหว่างภาค', 'วันหยุดระหว่างเทอมต้นและเทอมปลาย', 'Semester Break', '2024-12-21', '2025-01-12', false, true, true, false, 'วันหยุดระหว่างเทอมต้นและเทอมปลาย', 1),
(1, 4, 'วันหยุดฤดูร้อน', 'วันหยุดฤดูร้อน', 'Summer Break', '2025-05-17', '2025-06-01', false, true, true, false, 'วันหยุดฤดูร้อน', 1),

-- วันหยุดมหาวิทยาลัย
(1, 3, 'วันก่อตั้งมหาวิทยาลัย', 'วันก่อตั้งมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี', 'KMUTT Foundation Day', '2025-04-04', '2025-04-04', true, true, true, true, 'วันก่อตั้งมหาวิทยาลัย', 1);

-- เพิ่มเหตุการณ์สำคัญ
INSERT INTO academic_events (academic_year_id, academic_term_id, event_name, event_name_th, event_name_en, event_type, start_date, end_date, start_time, end_time, is_all_day, location, color, priority, notification_enabled, notification_days_before, description, created_by) VALUES

-- เหตุการณ์เทอมปลาย 2567/2
(1, 2, 'เปิดลงทะเบียนเทอมปลาย', 'เปิดลงทะเบียนเรียนเทอมปลาย', 'Registration Opens for Second Semester', 'registration', '2024-12-02', '2024-12-02', '08:00:00', '17:00:00', false, 'ระบบออนไลน์', '#10b981', 'high', true, 7, 'เปิดให้ลงทะเบียนเรียนเทอมปลาย', 1),

(1, 2, 'ปิดลงทะเบียนเทอมปลาย', 'ปิดลงทะเบียนเรียนเทอมปลาย', 'Registration Closes for Second Semester', 'registration', '2025-01-10', '2025-01-10', '17:00:00', '17:00:00', false, 'ระบบออนไลน์', '#dc2626', 'urgent', true, 3, 'ปิดการลงทะเบียนเรียนเทอมปลาย', 1),

(1, 2, 'วันเริ่มเรียนเทอมปลาย', 'วันเริ่มเรียนเทอมปลาย', 'Second Semester Classes Begin', 'academic', '2025-01-13', '2025-01-13', NULL, NULL, true, 'มหาวิทยาลัย', '#3b82f6', 'high', true, 7, 'วันเริ่มเรียนเทอมปลาย 2567/2', 1),

(1, 2, 'สุดท้ายเพิ่ม-ถอนวิชา', 'วันสุดท้ายเพิ่ม-ถอนวิชา', 'Last Day for Add/Drop', 'deadline', '2025-01-24', '2025-01-24', '17:00:00', '17:00:00', false, 'ระบบออนไลน์', '#f59e0b', 'urgent', true, 5, 'วันสุดท้ายสำหรับเพิ่ม-ถอนวิชา', 1),

(1, 2, 'สอบกลางภาค', 'สอบกลางภาคเทอมปลาย', 'Midterm Examinations', 'exam', '2025-03-10', '2025-03-14', NULL, NULL, true, 'ห้องสอบต่างๆ', '#8b5cf6', 'high', true, 14, 'ช่วงสอบกลางภาคเทอมปลาย', 1),

(1, 2, 'วันสุดท้ายถอนวิชา', 'วันสุดท้ายถอนวิชา (W)', 'Last Day for Withdrawal', 'deadline', '2025-03-21', '2025-03-21', '17:00:00', '17:00:00', false, 'ระบบออนไลน์', '#dc2626', 'urgent', true, 7, 'วันสุดท้ายสำหรับถอนวิชา (W)', 1),

(1, 2, 'สอบปลายภาค', 'สอบปลายภาคเทอมปลาย', 'Final Examinations', 'exam', '2025-05-05', '2025-05-16', NULL, NULL, true, 'ห้องสอบต่างๆ', '#dc2626', 'urgent', true, 21, 'ช่วงสอบปลายภาคเทอมปลาย', 1),

-- เหตุการณ์ทั่วไป
(1, NULL, 'วันปฐมนิเทศนักศึกษาใหม่', 'วันปฐมนิเทศนักศึกษาใหม่', 'New Student Orientation', 'orientation', '2024-08-15', '2024-08-16', '08:00:00', '17:00:00', false, 'หอประชุมใหญ่', '#10b981', 'high', true, 7, 'ปฐมนิเทศนักศึกษาใหม่ปีการศึกษา 2567', 1),

(1, NULL, 'วันพระราชทานปริญญาบัตร', 'พิธีพระราชทานปริญญาบัตร', 'Royal Degree Conferring Ceremony', 'graduation', '2025-07-15', '2025-07-15', '09:00:00', '12:00:00', false, 'หอประชุมใหญ่', '#fbbf24', 'high', true, 30, 'พิธีพระราชทานปริญญาบัตรประจำปี', 1);

-- เพิ่มการตั้งค่าปฏิทิน
INSERT INTO calendar_settings (setting_key, setting_name, setting_name_th, setting_value, default_value, data_type, input_type, category, group_name, sort_order, description) VALUES

-- การตั้งค่าทั่วไป
('academic_year_start_month', 'Academic Year Start Month', 'เดือนเริ่มต้นปีการศึกษา', '6', '6', 'number', 'select', 'academic', 'ปีการศึกษา', 1, 'เดือนที่เริ่มต้นปีการศึกษา (1-12)'),
('default_term_duration_weeks', 'Default Term Duration (Weeks)', 'ระยะเวลาเทอมมาตรฐาน (สัปดาห์)', '18', '18', 'number', 'number', 'academic', 'เทอม', 2, 'จำนวนสัปดาห์มาตรฐานของเทอม'),
('summer_term_duration_weeks', 'Summer Term Duration (Weeks)', 'ระยะเวลาเทอมฤดูร้อน (สัปดาห์)', '8', '8', 'number', 'number', 'academic', 'เทอม', 3, 'จำนวนสัปดาห์ของเทอมฤดูร้อน'),

-- การตั้งค่าการแสดงผล
('calendar_default_view', 'Default Calendar View', 'มุมมองปฏิทินเริ่มต้น', 'month', 'month', 'string', 'select', 'display', 'การแสดงผล', 1, 'มุมมองเริ่มต้นของปฏิทิน'),
('show_weekends', 'Show Weekends', 'แสดงวันหยุดสุดสัปดาห์', 'true', 'true', 'boolean', 'boolean', 'display', 'การแสดงผล', 2, 'แสดงวันเสาร์-อาทิตย์ในปฏิทิน'),
('highlight_current_day', 'Highlight Current Day', 'เน้นวันปัจจุบัน', 'true', 'true', 'boolean', 'boolean', 'display', 'การแสดงผล', 3, 'เน้นสีวันปัจจุบันในปฏิทิน'),

-- การตั้งค่าการแจ้งเตือน
('enable_event_notifications', 'Enable Event Notifications', 'เปิดการแจ้งเตือนเหตุการณ์', 'true', 'true', 'boolean', 'boolean', 'notification', 'การแจ้งเตือน', 1, 'เปิดใช้งานการแจ้งเตือนเหตุการณ์'),
('default_notification_days', 'Default Notification Days', 'จำนวนวันแจ้งเตือนล่วงหน้า', '7', '7', 'number', 'number', 'notification', 'การแจ้งเตือน', 2, 'จำนวนวันที่แจ้งเตือนล่วงหน้า'),
('notification_time', 'Notification Time', 'เวลาส่งการแจ้งเตือน', '09:00', '09:00', 'string', 'time', 'notification', 'การแจ้งเตือน', 3, 'เวลาที่ส่งการแจ้งเตือนประจำวัน');

-- อัพเดท allowed_values สำหรับ select options
UPDATE calendar_settings SET allowed_values = '[1,2,3,4,5,6,7,8,9,10,11,12]' WHERE setting_key = 'academic_year_start_month';
UPDATE calendar_settings SET allowed_values = '["month", "week", "day", "agenda"]' WHERE setting_key = 'calendar_default_view';

-- เพิ่มเทมเพลตปฏิทิน
INSERT INTO calendar_templates (template_name, template_name_th, template_name_en, description, template_data, is_default, created_by) VALUES
('standard_academic_year', 'ปีการศึกษามาตรฐาน', 'Standard Academic Year', 'เทมเพลตปีการศึกษามาตรฐาน 2 เทอม + เทอมฤดูร้อน', 
'{"terms": [{"number": 1, "name_th": "เทอมต้น", "name_en": "First Semester", "duration_weeks": 18, "start_month": 8}, {"number": 2, "name_th": "เทอมปลาย", "name_en": "Second Semester", "duration_weeks": 18, "start_month": 1}, {"number": 3, "name_th": "เทอมฤดูร้อน", "name_en": "Summer Semester", "duration_weeks": 8, "start_month": 6}], "holidays": ["new_year", "makha_bucha", "chakri_day", "songkran", "labour_day", "coronation_day", "visakha_bucha"]}', 
true, 1),

('trimester_system', 'ระบบไตรมาส', 'Trimester System', 'เทมเพลตระบบไตรมาส 3 เทอมเท่าๆ กัน', 
'{"terms": [{"number": 1, "name_th": "ไตรมาสที่ 1", "name_en": "First Trimester", "duration_weeks": 16, "start_month": 8}, {"number": 2, "name_th": "ไตรมาสที่ 2", "name_en": "Second Trimester", "duration_weeks": 16, "start_month": 12}, {"number": 3, "name_th": "ไตรมาสที่ 3", "name_en": "Third Trimester", "duration_weeks": 16, "start_month": 4}]}', 
false, 1);-- สร้าง 
Views สำหรับการใช้งาน

-- View: ปฏิทินการศึกษาแบบรวม
CREATE OR REPLACE VIEW academic_calendar_view AS
SELECT 
    'academic_year' as item_type,
    ay.id,
    ay.academic_year as code,
    ay.academic_year_th as title_th,
    ay.academic_year_en as title_en,
    ay.start_date,
    ay.end_date,
    ay.status,
    ay.is_current,
    NULL as term_code,
    NULL as event_type,
    NULL as holiday_type,
    '#1f2937' as color,
    'calendar' as icon
FROM academic_years ay
WHERE ay.is_active = true

UNION ALL

SELECT 
    'academic_term' as item_type,
    at.id,
    at.term_code as code,
    at.term_name_th as title_th,
    at.term_name_en as title_en,
    at.start_date,
    at.end_date,
    at.status,
    at.is_current,
    at.term_code,
    NULL as event_type,
    NULL as holiday_type,
    '#3b82f6' as color,
    'book-open' as icon
FROM academic_terms at
WHERE at.status != 'cancelled'

UNION ALL

SELECT 
    'holiday' as item_type,
    ah.id,
    ht.type_code as code,
    ah.holiday_name_th as title_th,
    ah.holiday_name_en as title_en,
    ah.start_date,
    ah.end_date,
    CASE WHEN ah.is_active THEN 'active' ELSE 'inactive' END as status,
    false as is_current,
    NULL as term_code,
    NULL as event_type,
    ht.type_name_th as holiday_type,
    ht.color,
    ht.icon
FROM academic_holidays ah
JOIN holiday_types ht ON ah.holiday_type_id = ht.id
WHERE ah.is_active = true

UNION ALL

SELECT 
    'event' as item_type,
    ae.id,
    ae.event_type as code,
    ae.event_name_th as title_th,
    ae.event_name_en as title_en,
    ae.start_date,
    COALESCE(ae.end_date, ae.start_date) as end_date,
    CASE WHEN ae.is_active THEN 'active' ELSE 'inactive' END as status,
    false as is_current,
    NULL as term_code,
    ae.event_type,
    NULL as holiday_type,
    ae.color,
    ae.icon
FROM academic_events ae
WHERE ae.is_active = true

ORDER BY start_date, item_type;

-- View: สรุปปฏิทินตามเดือน
CREATE OR REPLACE VIEW monthly_calendar_summary AS
SELECT 
    DATE_TRUNC('month', calendar_date) as month_date,
    EXTRACT(YEAR FROM calendar_date) as year,
    EXTRACT(MONTH FROM calendar_date) as month,
    COUNT(CASE WHEN item_type = 'holiday' THEN 1 END) as holiday_count,
    COUNT(CASE WHEN item_type = 'event' THEN 1 END) as event_count,
    COUNT(CASE WHEN item_type = 'academic_term' AND status = 'active' THEN 1 END) as active_terms,
    STRING_AGG(DISTINCT title_th, ', ' ORDER BY title_th) as items_summary
FROM (
    SELECT start_date as calendar_date, item_type, status, title_th FROM academic_calendar_view
    UNION
    SELECT end_date as calendar_date, item_type, status, title_th FROM academic_calendar_view
    WHERE end_date != start_date
) calendar_items
GROUP BY DATE_TRUNC('month', calendar_date), EXTRACT(YEAR FROM calendar_date), EXTRACT(MONTH FROM calendar_date)
ORDER BY year, month;

-- View: เหตุการณ์ที่จะมาถึง
CREATE OR REPLACE VIEW upcoming_events AS
SELECT 
    ae.id,
    ae.event_name_th,
    ae.event_type,
    ae.start_date,
    ae.end_date,
    ae.priority,
    ae.location,
    ae.color,
    ae.notification_enabled,
    ae.notification_days_before,
    (ae.start_date - CURRENT_DATE) as days_until,
    CASE 
        WHEN ae.start_date = CURRENT_DATE THEN 'วันนี้'
        WHEN ae.start_date = CURRENT_DATE + 1 THEN 'พรุ่งนี้'
        WHEN ae.start_date BETWEEN CURRENT_DATE + 2 AND CURRENT_DATE + 7 THEN 'สัปดาห์นี้'
        WHEN ae.start_date BETWEEN CURRENT_DATE + 8 AND CURRENT_DATE + 30 THEN 'เดือนนี้'
        ELSE 'ในอนาคต'
    END as time_category,
    at.term_name_th,
    ay.academic_year_th
FROM academic_events ae
LEFT JOIN academic_terms at ON ae.academic_term_id = at.id
LEFT JOIN academic_years ay ON ae.academic_year_id = ay.id
WHERE ae.is_active = true
    AND ae.start_date >= CURRENT_DATE
ORDER BY ae.start_date, ae.priority DESC;

-- View: วันหยุดในปีปัจจุบัน
CREATE OR REPLACE VIEW current_year_holidays AS
SELECT 
    ah.id,
    ah.holiday_name_th,
    ah.start_date,
    ah.end_date,
    ah.is_single_day,
    ht.type_name_th as holiday_type,
    ht.color,
    (ah.end_date - ah.start_date + 1) as duration_days,
    CASE 
        WHEN ah.start_date > CURRENT_DATE THEN 'upcoming'
        WHEN ah.end_date < CURRENT_DATE THEN 'past'
        ELSE 'current'
    END as status,
    ay.academic_year_th
FROM academic_holidays ah
JOIN holiday_types ht ON ah.holiday_type_id = ht.id
JOIN academic_years ay ON ah.academic_year_id = ay.id
WHERE ah.is_active = true
    AND ay.is_current = true
ORDER BY ah.start_date;

-- ทดสอบ Functions
SELECT 'ทดสอบ Functions ปฏิทินการศึกษา' as title;

-- ทดสอบดึงปีการศึกษาปัจจุบัน
SELECT 'ปีการศึกษาปัจจุบัน' as test_name;
SELECT * FROM get_current_academic_year();

-- ทดสอบดึงเทอมปัจจุบัน
SELECT 'เทอมปัจจุบัน' as test_name;
SELECT * FROM get_current_academic_term();

-- ทดสอบคำนวณวันทำการ
SELECT 'คำนวณวันทำการ (1 ม.ค. - 31 ม.ค. 2025)' as test_name;
SELECT calculate_working_days('2025-01-01', '2025-01-31', 1) as working_days;

-- ทดสอบตรวจสอบวันหยุด
SELECT 'ตรวจสอบวันหยุด (1 ม.ค. 2025)' as test_name;
SELECT is_holiday('2025-01-01', 1) as is_new_year_holiday;

-- ทดสอบดึงวันหยุดในช่วงเวลา
SELECT 'วันหยุดในเดือนมกราคม 2025' as test_name;
SELECT * FROM get_holidays_in_period('2025-01-01', '2025-01-31', 1);

-- แสดงสรุปข้อมูล
SELECT 'ปฏิทินการศึกษาทั้งหมด (10 รายการแรก)' as title;
SELECT * FROM academic_calendar_view LIMIT 10;

SELECT 'เหตุการณ์ที่จะมาถึง' as title;
SELECT * FROM upcoming_events LIMIT 5;

SELECT 'วันหยุดในปีปัจจุบัน' as title;
SELECT * FROM current_year_holidays;

SELECT 'สรุปปฏิทินรายเดือน (6 เดือนแรก)' as title;
SELECT * FROM monthly_calendar_summary LIMIT 6;

COMMIT;