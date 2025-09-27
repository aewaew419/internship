# ระบบเงื่อนไขวิชาสหกิจและหัวข้อโปรเจคฝึกงาน

## ภาพรวมระบบ

ระบบนี้จัดการเงื่อนไขต่างๆ ของวิชาสหกิจศึกษา และการจัดการหัวข้อโปรเจคฝึกงาน รองรับทั้งกรณีที่นักศึกษา **มีหัวข้อโปรเจค** และ **ไม่มีหัวข้อโปรเจค**

## 🎯 **ฟีเจอร์หลัก**

### 1. **การจัดการเงื่อนไขวิชาสหกิจ**
- เงื่อนไขด้านวิชาการ (GPA, หน่วยกิต, วิชาแกน)
- เงื่อนไขด้านโปรเจค (การเลือกหัวข้อ, การอนุมัติ, รายงานความคืบหน้า)
- เงื่อนไขด้านเอกสาร (ใบสมัคร, หนังสือตอบรับ, รายงานฉบับสมบูรณ์)
- เงื่อนไขด้านการประเมิน (จากบริษัท, จากอาจารย์นิเทศ)
- เงื่อนไขด้านการเข้าร่วม (ระยะเวลาฝึกงาน)

### 2. **การจัดการหัวข้อโปรเจค**
- หัวข้อโปรเจคจากบริษัท
- หัวข้อโปรเจคที่นักศึกษากำหนดเอง
- ระบบสมัครและอนุมัติโปรเจค
- การติดตามความคืบหน้า

### 3. **การติดตามและประเมิน**
- รายงานความคืบหน้าประจำสัปดาห์
- การประเมินตามเกณฑ์ต่างๆ
- การตรวจสอบเงื่อนไขอัตโนมัติ

## 🏗️ **โครงสร้างฐานข้อมูล**

### ตารางหลัก

#### `coop_requirements` - เงื่อนไขวิชาสหกิจ
```sql
- requirement_code: รหัสเงื่อนไข (ACAD001, PROJ001, DOC001, EVAL001, ATT001)
- name/name_th: ชื่อเงื่อนไข (ภาษาอังกฤษ/ไทย)
- requirement_type: ประเภท (academic, project, document, evaluation, attendance)
- category: หมวดหมู่ (mandatory, optional, conditional)
- passing_score: คะแนนผ่าน
- prerequisites: เงื่อนไขที่ต้องผ่านก่อน (JSON)
```

#### `project_topics` - หัวข้อโปรเจค
```sql
- title/title_en: ชื่อโปรเจค (ภาษาไทย/อังกฤษ)
- project_type: ประเภท (development, research, analysis, design, implementation)
- difficulty_level: ระดับความยาก (easy, medium, hard, expert)
- technologies: เทคโนโลยีที่ใช้ (JSON Array)
- skills_required: ทักษะที่ต้องการ (JSON Array)
- company_id: บริษัท (NULL = โปรเจคที่นักศึกษากำหนดเอง)
- max_students: จำนวนนักศึกษาสูงสุด
- status: สถานะ (available, assigned, in_progress, completed)
```

#### `student_trainings` - การฝึกงานของนักศึกษา
```sql
- student_id: รหัสนักศึกษา
- project_topic_id: หัวข้อโปรเจค (NULL = ไม่มีโปรเจค)
- has_project: มีโปรเจคหรือไม่ (boolean)
- custom_project_title: หัวข้อโปรเจคที่กำหนดเอง
- semester/academic_year: ภาคเรียน/ปีการศึกษา
- status: สถานะ (registered, approved, in_progress, completed, failed)
```

### ตารางเสริม

#### `student_requirement_checks` - การตรวจสอบเงื่อนไข
```sql
- student_training_id: การฝึกงาน
- requirement_id: เงื่อนไข
- status: สถานะ (pending, passed, failed, waived, in_progress)
- score: คะแนน
- evidence_documents: เอกสารหลักฐาน (JSON)
```

#### `project_applications` - การสมัครโปรเจค
```sql
- student_training_id: การฝึกงาน
- project_topic_id: หัวข้อโปรเจค
- priority: ลำดับความต้องการ
- motivation: เหตุผลการสมัคร
- status: สถานะ (pending, approved, rejected, withdrawn)
```

#### `project_progress` - ความคืบหน้าโปรเจค
```sql
- student_training_id: การฝึกงาน
- week_number: สัปดาห์ที่
- progress_percentage: เปอร์เซ็นต์ความคืบหน้า
- activities_completed: กิจกรรมที่เสร็จ
- self_assessment: การประเมินตนเอง (1-5)
```

#### `project_evaluation_criteria` - เกณฑ์การประเมินโปรเจค
```sql
- name/name_th: ชื่อเกณฑ์
- category: หมวดหมู่ (technical, presentation, documentation, innovation)
- weight: น้ำหนักคะแนน
- scoring_rubric: เกณฑ์การให้คะแนน (JSON)
```

## 🚀 **การติดตั้งและใช้งาน**

### ขั้นตอนที่ 1: สร้างตารางระบบ
```sql
\i database/add-coop-project-system.sql
```

### ขั้นตอนที่ 2: เพิ่มข้อมูลตัวอย่าง
```sql
\i database/insert-coop-project-sample-data.sql
```

## 📋 **เงื่อนไขวิชาสหกิจ**

### เงื่อนไขด้านวิชาการ
- **ACAD001**: เกรดเฉลี่ยขั้นต่ำ 2.00
- **ACAD002**: ผ่านหน่วยกิตไม่น้อยกว่า 90 หน่วยกิต
- **ACAD003**: ผ่านวิชาแกนครบถ้วน

### เงื่อนไขด้านโปรเจค
- **PROJ001**: การเลือกหัวข้อโปรเจค
- **PROJ002**: การอนุมัติหัวข้อโปรเจค
- **PROJ003**: รายงานความคืบหน้าประจำสัปดาห์
- **PROJ004**: การนำเสนอโปรเจคขั้นสุดท้าย (คะแนนผ่าน 60%)

### เงื่อนไขด้านเอกสาร
- **DOC001**: การยื่นใบสมัครฝึกงาน
- **DOC002**: หนังสือตอบรับจากบริษัท
- **DOC003**: การส่งรายงานฉบับสมบูรณ์

### เงื่อนไขด้านการประเมิน
- **EVAL001**: การประเมินจากบริษัท (คะแนนผ่าน 60%)
- **EVAL002**: การประเมินจากอาจารย์นิเทศ (คะแนนผ่าน 60%)

### เงื่อนไขด้านการเข้าร่วม
- **ATT001**: การเข้าร่วมฝึกงานขั้นต่ำ 16 สัปดาห์ (112 วัน)

## 🎨 **ประเภทโปรเจค**

### ตามลักษณะงาน
- **Development**: การพัฒนาระบบ/แอปพลิเคชัน
- **Research**: การวิจัยและศึกษา
- **Analysis**: การวิเคราะห์ข้อมูล/ระบบ
- **Design**: การออกแบบ UI/UX หรือสถาปัตยกรรม
- **Implementation**: การนำระบบไปใช้งาน

### ตามระดับความยาก
- **Easy**: เหมาะสำหรับผู้เริ่มต้น
- **Medium**: ต้องการทักษะพื้นฐาน
- **Hard**: ต้องการทักษะขั้นสูง
- **Expert**: ต้องการความเชี่ยวชาญเฉพาะด้าน

## 📊 **การใช้งาน Views**

### 1. ดูสรุปโปรเจค
```sql
SELECT * FROM project_summary;
```

### 2. ดูสถานะการฝึกงานของนักศึกษา
```sql
SELECT * FROM student_training_status;
```

### 3. ดูความคืบหน้าโปรเจคล่าสุด
```sql
SELECT * FROM latest_project_progress;
```

## 🔍 **ตัวอย่างการ Query**

### ดูนักศึกษาที่มีโปรเจค vs ไม่มีโปรเจค
```sql
SELECT 
    has_project,
    COUNT(*) as student_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM student_trainings 
GROUP BY has_project;
```

### ดูโปรเจคที่ยังว่าง
```sql
SELECT 
    pt.title,
    pt.max_students,
    pt.current_students,
    (pt.max_students - pt.current_students) as available_slots,
    c.name as company_name
FROM project_topics pt
LEFT JOIN companies c ON pt.company_id = c.id
WHERE pt.status = 'available' 
    AND pt.current_students < pt.max_students
ORDER BY available_slots DESC;
```

### ดูเงื่อนไขที่นักศึกษายังไม่ผ่าน
```sql
SELECT 
    s.student_id,
    CONCAT(u.first_name, ' ', u.last_name) as student_name,
    cr.name_th as requirement_name,
    src.status,
    src.score
FROM student_trainings st
JOIN students s ON st.student_id = s.id
JOIN users u ON s.user_id = u.id
LEFT JOIN student_requirement_checks src ON st.id = src.student_training_id
LEFT JOIN coop_requirements cr ON src.requirement_id = cr.id
WHERE src.status IN ('pending', 'failed', 'in_progress')
ORDER BY s.student_id, cr.requirement_code;
```

### ดูความคืบหน้าโปรเจคที่ล่าช้า
```sql
SELECT 
    s.student_id,
    CONCAT(u.first_name, ' ', u.last_name) as student_name,
    pt.title as project_title,
    pp.week_number,
    pp.progress_percentage,
    CASE 
        WHEN pp.progress_percentage < (pp.week_number * 6.25) THEN 'ล่าช้า'
        ELSE 'ตามแผน'
    END as status
FROM student_trainings st
JOIN students s ON st.student_id = s.id
JOIN users u ON s.user_id = u.id
JOIN project_topics pt ON st.project_topic_id = pt.id
JOIN project_progress pp ON st.id = pp.student_training_id
WHERE st.has_project = true
    AND pp.week_number = (
        SELECT MAX(week_number) 
        FROM project_progress pp2 
        WHERE pp2.student_training_id = st.id
    )
ORDER BY pp.progress_percentage ASC;
```

## 📈 **การรายงานและสถิติ**

### สถิติโปรเจคตามบริษัท
```sql
SELECT 
    COALESCE(c.name, 'โปรเจคที่นักศึกษากำหนดเอง') as company_name,
    COUNT(pt.id) as total_projects,
    SUM(pt.current_students) as total_students,
    ROUND(AVG(pt.current_students::decimal), 2) as avg_students_per_project
FROM project_topics pt
LEFT JOIN companies c ON pt.company_id = c.id
GROUP BY c.name
ORDER BY total_projects DESC;
```

### สถิติการผ่านเงื่อนไข
```sql
SELECT 
    cr.name_th as requirement_name,
    COUNT(src.id) as total_checks,
    COUNT(CASE WHEN src.status = 'passed' THEN 1 END) as passed,
    COUNT(CASE WHEN src.status = 'failed' THEN 1 END) as failed,
    COUNT(CASE WHEN src.status = 'in_progress' THEN 1 END) as in_progress,
    ROUND(COUNT(CASE WHEN src.status = 'passed' THEN 1 END) * 100.0 / COUNT(src.id), 2) as pass_rate
FROM coop_requirements cr
LEFT JOIN student_requirement_checks src ON cr.id = src.requirement_id
GROUP BY cr.id, cr.name_th, cr.requirement_code
ORDER BY cr.requirement_code;
```

## 🔧 **การจัดการข้อมูล**

### เพิ่มเงื่อนไขใหม่
```sql
INSERT INTO coop_requirements (
    requirement_code, name, name_th, description, 
    requirement_type, category, passing_score, 
    prerequisites, conditions, created_by
) VALUES (
    'NEW001', 'New Requirement', 'เงื่อนไขใหม่', 'คำอธิบาย',
    'academic', 'mandatory', 70,
    '["ACAD001"]', '{"custom_rule": true}', 1
);
```

### เพิ่มหัวข้อโปรเจคใหม่
```sql
INSERT INTO project_topics (
    title, description, project_type, difficulty_level,
    technologies, skills_required, timeline_weeks,
    company_id, max_students, created_by
) VALUES (
    'โปรเจคใหม่', 'รายละเอียดโปรเจค', 'development', 'medium',
    '["React", "Node.js"]', '["JavaScript", "Database"]', 16,
    1, 2, 1
);
```

### ตรวจสอบเงื่อนไขสำหรับนักศึกษา
```sql
-- Function สำหรับตรวจสอบเงื่อนไขอัตโนมัติ
CREATE OR REPLACE FUNCTION check_student_requirements(p_student_training_id INTEGER)
RETURNS TABLE(requirement_code VARCHAR, status VARCHAR, message TEXT) AS $$
BEGIN
    -- ตรวจสอบเกรดเฉลี่ย
    RETURN QUERY
    SELECT 'ACAD001'::VARCHAR, 
           CASE WHEN s.gpa >= 2.00 THEN 'passed' ELSE 'failed' END::VARCHAR,
           CASE WHEN s.gpa >= 2.00 THEN 'ผ่านเกณฑ์เกรดเฉลี่ย' ELSE 'ไม่ผ่านเกณฑ์เกรดเฉลี่ย' END::TEXT
    FROM student_trainings st
    JOIN students s ON st.student_id = s.id
    WHERE st.id = p_student_training_id;
    
    -- เพิ่มการตรวจสอบเงื่อนไขอื่นๆ ตามต้องการ
END;
$$ LANGUAGE plpgsql;
```

## ⚠️ **ข้อสำคัญ**

### การจัดการนักศึกษาที่ไม่มีโปรเจค
- ตั้งค่า `has_project = false` ในตาราง `student_trainings`
- `project_topic_id = NULL`
- ไม่ต้องตรวจสอบเงื่อนไขที่เกี่ยวกับโปรเจค (PROJ001-PROJ004)
- ยังคงต้องผ่านเงื่อนไขอื่นๆ (วิชาการ, เอกสาร, การประเมิน, การเข้าร่วม)

### การจัดการนักศึกษาที่มีโปรเจค
- ตั้งค่า `has_project = true`
- ต้องมี `project_topic_id` หรือ `custom_project_title`
- ต้องผ่านเงื่อนไขโปรเจคทั้งหมด
- ต้องส่งรายงานความคืบหน้าประจำสัปดาห์

ระบบนี้ครอบคลุมการจัดการเงื่อนไขวิชาสหกิจและโปรเจคฝึกงานอย่างสมบูรณ์ รองรับทั้งกรณีที่มีและไม่มีโปรเจค!