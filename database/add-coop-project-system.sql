-- ระบบจัดการเงื่อนไขวิชาสหกิจและหัวข้อโปรเจคฝึกงาน
-- รันไฟล์นี้หลังจากการสร้างตารางหลักแล้ว

-- ตารางเงื่อนไขวิชาสหกิจ
CREATE TABLE IF NOT EXISTS coop_requirements (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    requirement_code VARCHAR(20) NOT NULL UNIQUE, -- เช่น 'COOP001', 'PROJ001'
    name VARCHAR(255) NOT NULL,
    name_th VARCHAR(255) NOT NULL,
    description TEXT,
    requirement_type VARCHAR(50) NOT NULL, -- 'academic', 'project', 'document', 'evaluation', 'attendance'
    category VARCHAR(100) NOT NULL, -- 'mandatory', 'optional', 'conditional'
    
    -- เงื่อนไขการผ่าน
    min_score DECIMAL(5,2), -- คะแนนขั้นต่ำ
    max_score DECIMAL(5,2), -- คะแนนสูงสุด
    passing_score DECIMAL(5,2), -- คะแนนผ่าน
    
    -- เงื่อนไขเวลา
    min_duration_days INTEGER, -- จำนวนวันขั้นต่ำ
    max_duration_days INTEGER, -- จำนวนวันสูงสุด
    
    -- เงื่อนไขอื่นๆ
    prerequisites JSON, -- เงื่อนไขที่ต้องผ่านก่อน
    conditions JSON, -- เงื่อนไขเพิ่มเติม
    
    -- การใช้งาน
    is_active BOOLEAN DEFAULT true,
    effective_date DATE, -- วันที่เริ่มใช้
    expiry_date DATE, -- วันที่หมดอายุ
    
    -- ผู้สร้าง
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางหัวข้อโปรเจคฝึกงาน
CREATE TABLE IF NOT EXISTS project_topics (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    topic_code VARCHAR(20) UNIQUE, -- รหัสหัวข้อ (ถ้ามี)
    title VARCHAR(500) NOT NULL,
    title_en VARCHAR(500), -- ชื่อภาษาอังกฤษ
    description TEXT NOT NULL,
    description_en TEXT, -- คำอธิบายภาษาอังกฤษ
    
    -- ประเภทโปรเจค
    project_type VARCHAR(100) NOT NULL, -- 'development', 'research', 'analysis', 'design', 'implementation'
    difficulty_level VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard', 'expert'
    
    -- ข้อมูลเทคนิค
    technologies JSON, -- เทคโนโลยีที่ใช้ ['React', 'Node.js', 'PostgreSQL']
    skills_required JSON, -- ทักษะที่ต้องการ ['JavaScript', 'Database Design']
    learning_outcomes JSON, -- ผลการเรียนรู้ที่คาดหวัง
    
    -- ขอบเขตงาน
    scope TEXT, -- ขอบเขตของงาน
    deliverables JSON, -- สิ่งที่ต้องส่งมอบ
    timeline_weeks INTEGER, -- ระยะเวลาโปรเจค (สัปดาห์)
    
    -- ข้อมูลบริษัท
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    department VARCHAR(255), -- แผนกที่รับผิดชอบ
    mentor_name VARCHAR(255), -- ชื่อพี่เลี้ยงในบริษัท
    mentor_email VARCHAR(255), -- อีเมลพี่เลี้ยง
    mentor_phone VARCHAR(20), -- เบอร์โทรพี่เลี้ยง
    
    -- สถานะ
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'assigned', 'in_progress', 'completed', 'cancelled'
    max_students INTEGER DEFAULT 1, -- จำนวนนักศึกษาสูงสุดที่รับได้
    current_students INTEGER DEFAULT 0, -- จำนวนนักศึกษาปัจจุบัน
    
    -- การอนุมัติ
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    approval_notes TEXT,
    
    -- ผู้สร้าง
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางการฝึกงานของนักศึกษา (แทนที่ student_trainings ที่ขาดหาย)
CREATE TABLE IF NOT EXISTS student_trainings (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    
    -- ข้อมูลนักศึกษา
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    internship_id INTEGER REFERENCES internships(id) ON DELETE SET NULL,
    
    -- โปรเจค
    project_topic_id INTEGER REFERENCES project_topics(id) ON DELETE SET NULL,
    has_project BOOLEAN DEFAULT false, -- มีหัวข้อโปรเจคหรือไม่
    custom_project_title VARCHAR(500), -- หัวข้อโปรเจคที่กำหนดเอง (ถ้าไม่เลือกจากระบบ)
    custom_project_description TEXT, -- รายละเอียดโปรเจคที่กำหนดเอง
    
    -- ข้อมูลการฝึกงาน
    training_type VARCHAR(50) DEFAULT 'internship', -- 'internship', 'coop', 'project'
    semester VARCHAR(20) NOT NULL, -- '2567/1', '2567/2'
    academic_year VARCHAR(10) NOT NULL, -- '2567'
    
    -- วันที่
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    actual_start_date DATE, -- วันที่เริ่มจริง
    actual_end_date DATE, -- วันที่จบจริง
    
    -- สถานะ
    status VARCHAR(50) DEFAULT 'registered', -- 'registered', 'approved', 'in_progress', 'completed', 'cancelled', 'failed'
    
    -- การประเมิน
    final_score DECIMAL(5,2), -- คะแนนรวม
    grade VARCHAR(5), -- เกรด A, B+, B, C+, C, D+, D, F
    
    -- หมายเหตุ
    notes TEXT,
    completion_notes TEXT, -- หมายเหตุเมื่อเสร็จสิ้น
    
    -- ผู้อนุมัติ
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางการตรวจสอบเงื่อนไขของนักศึกษา
CREATE TABLE IF NOT EXISTS student_requirement_checks (
    id SERIAL PRIMARY KEY,
    student_training_id INTEGER NOT NULL REFERENCES student_trainings(id) ON DELETE CASCADE,
    requirement_id INTEGER NOT NULL REFERENCES coop_requirements(id) ON DELETE CASCADE,
    
    -- สถานะการตรวจสอบ
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'passed', 'failed', 'waived', 'in_progress'
    
    -- คะแนน/ผลลัพธ์
    score DECIMAL(5,2),
    result_data JSON, -- ข้อมูลผลลัพธ์เพิ่มเติม
    
    -- การตรวจสอบ
    checked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    checked_at TIMESTAMP,
    check_notes TEXT,
    
    -- หลักฐาน
    evidence_documents JSON, -- รายการเอกสารหลักฐาน
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(student_training_id, requirement_id)
);

-- ตารางการสมัครโปรเจค
CREATE TABLE IF NOT EXISTS project_applications (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    
    student_training_id INTEGER NOT NULL REFERENCES student_trainings(id) ON DELETE CASCADE,
    project_topic_id INTEGER NOT NULL REFERENCES project_topics(id) ON DELETE CASCADE,
    
    -- การสมัคร
    application_type VARCHAR(50) DEFAULT 'request', -- 'request', 'assignment'
    priority INTEGER DEFAULT 1, -- ลำดับความต้องการ (1 = สูงสุด)
    
    -- เหตุผลการสมัคร
    motivation TEXT, -- เหตุผลที่สนใจโปรเจคนี้
    relevant_skills JSON, -- ทักษะที่เกี่ยวข้อง
    experience TEXT, -- ประสบการณ์ที่เกี่ยวข้อง
    
    -- สถานะ
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'withdrawn'
    
    -- การพิจารณา
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    rejection_reason TEXT,
    
    -- การอนุมัติ
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(student_training_id, project_topic_id)
);

-- ตารางความคืบหน้าโปรเจค
CREATE TABLE IF NOT EXISTS project_progress (
    id SERIAL PRIMARY KEY,
    student_training_id INTEGER NOT NULL REFERENCES student_trainings(id) ON DELETE CASCADE,
    
    -- ข้อมูลความคืบหน้า
    week_number INTEGER NOT NULL, -- สัปดาห์ที่
    progress_percentage DECIMAL(5,2) DEFAULT 0, -- เปอร์เซ็นต์ความคืบหน้า
    
    -- รายงานความคืบหน้า
    activities_completed TEXT, -- กิจกรรมที่เสร็จแล้ว
    current_activities TEXT, -- กิจกรรมที่กำลังทำ
    next_week_plan TEXT, -- แผนสัปดาห์หน้า
    
    -- ปัญหาและอุปสรรค
    issues TEXT, -- ปัญหาที่พบ
    solutions TEXT, -- วิธีแก้ไข
    help_needed TEXT, -- ความช่วยเหลือที่ต้องการ
    
    -- การประเมิน
    self_assessment DECIMAL(3,2), -- การประเมินตนเอง (1-5)
    mentor_feedback TEXT, -- ความคิดเห็นจากพี่เลี้ยง
    mentor_score DECIMAL(3,2), -- คะแนนจากพี่เลี้ยง
    
    -- สถานะ
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'reviewed', 'approved'
    
    -- การตรวจสอบ
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(student_training_id, week_number)
);

-- ตารางเกณฑ์การประเมินโปรเจค
CREATE TABLE IF NOT EXISTS project_evaluation_criteria (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_th VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'technical', 'presentation', 'documentation', 'teamwork', 'innovation'
    weight DECIMAL(5,2) NOT NULL, -- น้ำหนักคะแนน (0.00-1.00)
    max_score DECIMAL(5,2) DEFAULT 100, -- คะแนนเต็ม
    
    -- เกณฑ์การให้คะแนน
    scoring_rubric JSON, -- เกณฑ์การให้คะแนนแต่ละระดับ
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้าง indexes สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_coop_requirements_type ON coop_requirements(requirement_type);
CREATE INDEX IF NOT EXISTS idx_coop_requirements_category ON coop_requirements(category);
CREATE INDEX IF NOT EXISTS idx_coop_requirements_active ON coop_requirements(is_active);

CREATE INDEX IF NOT EXISTS idx_project_topics_status ON project_topics(status);
CREATE INDEX IF NOT EXISTS idx_project_topics_company ON project_topics(company_id);
CREATE INDEX IF NOT EXISTS idx_project_topics_type ON project_topics(project_type);
CREATE INDEX IF NOT EXISTS idx_project_topics_difficulty ON project_topics(difficulty_level);

CREATE INDEX IF NOT EXISTS idx_student_trainings_student ON student_trainings(student_id);
CREATE INDEX IF NOT EXISTS idx_student_trainings_project ON student_trainings(project_topic_id);
CREATE INDEX IF NOT EXISTS idx_student_trainings_status ON student_trainings(status);
CREATE INDEX IF NOT EXISTS idx_student_trainings_semester ON student_trainings(semester, academic_year);

CREATE INDEX IF NOT EXISTS idx_student_requirement_checks_training ON student_requirement_checks(student_training_id);
CREATE INDEX IF NOT EXISTS idx_student_requirement_checks_requirement ON student_requirement_checks(requirement_id);
CREATE INDEX IF NOT EXISTS idx_student_requirement_checks_status ON student_requirement_checks(status);

CREATE INDEX IF NOT EXISTS idx_project_applications_training ON project_applications(student_training_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_project ON project_applications(project_topic_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_status ON project_applications(status);

CREATE INDEX IF NOT EXISTS idx_project_progress_training ON project_progress(student_training_id);
CREATE INDEX IF NOT EXISTS idx_project_progress_week ON project_progress(week_number);
CREATE INDEX IF NOT EXISTS idx_project_progress_status ON project_progress(status);

-- สร้าง triggers สำหรับ updated_at
CREATE TRIGGER update_coop_requirements_updated_at BEFORE UPDATE ON coop_requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_topics_updated_at BEFORE UPDATE ON project_topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_trainings_updated_at BEFORE UPDATE ON student_trainings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_requirement_checks_updated_at BEFORE UPDATE ON student_requirement_checks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_applications_updated_at BEFORE UPDATE ON project_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_progress_updated_at BEFORE UPDATE ON project_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_evaluation_criteria_updated_at BEFORE UPDATE ON project_evaluation_criteria FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- สร้าง trigger สำหรับอัพเดทจำนวนนักศึกษาในโปรเจค
CREATE OR REPLACE FUNCTION update_project_student_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- เพิ่มจำนวนนักศึกษาเมื่อมีการสมัครที่ได้รับอนุมัติ
        IF NEW.status = 'approved' THEN
            UPDATE project_topics 
            SET current_students = current_students + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.project_topic_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- อัพเดทจำนวนนักศึกษาเมื่อสถานะเปลี่ยน
        IF OLD.status != NEW.status THEN
            IF OLD.status = 'approved' AND NEW.status != 'approved' THEN
                -- ลดจำนวนเมื่อยกเลิกการอนุมัติ
                UPDATE project_topics 
                SET current_students = GREATEST(current_students - 1, 0),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.project_topic_id;
            ELSIF OLD.status != 'approved' AND NEW.status = 'approved' THEN
                -- เพิ่มจำนวนเมื่อได้รับอนุมัติ
                UPDATE project_topics 
                SET current_students = current_students + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.project_topic_id;
            END IF;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- ลดจำนวนนักศึกษาเมื่อลบการสมัคร
        IF OLD.status = 'approved' THEN
            UPDATE project_topics 
            SET current_students = GREATEST(current_students - 1, 0),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.project_topic_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_student_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON project_applications
    FOR EACH ROW EXECUTE FUNCTION update_project_student_count();

-- สร้าง trigger สำหรับอัพเดทสถานะโปรเจค
CREATE OR REPLACE FUNCTION update_project_status()
RETURNS TRIGGER AS $$
BEGIN
    -- อัพเดทสถานะโปรเจคตามจำนวนนักศึกษา
    UPDATE project_topics 
    SET status = CASE 
        WHEN current_students >= max_students THEN 'assigned'
        WHEN current_students > 0 THEN 'in_progress'
        ELSE 'available'
    END,
    updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_status_trigger
    AFTER UPDATE OF current_students ON project_topics
    FOR EACH ROW EXECUTE FUNCTION update_project_status();

COMMIT;