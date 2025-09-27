-- ระบบปฏิทินการศึกษา (Academic Calendar System)
-- สำหรับ Super Admin และ Admin ในการตั้งค่าปฏิทินการศึกษา

-- ตารางปีการศึกษา
CREATE TABLE IF NOT EXISTS academic_years (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    
    -- ข้อมูลปีการศึกษา
    academic_year VARCHAR(10) NOT NULL UNIQUE, -- เช่น '2567', '2024'
    academic_year_th VARCHAR(20) NOT NULL, -- เช่น 'ปีการศึกษา 2567'
    academic_year_en VARCHAR(20) NOT NULL, -- เช่น 'Academic Year 2024'
    
    -- ระยะเวลา
    start_date DATE NOT NULL, -- วันเริ่มต้นปีการศึกษา
    end_date DATE NOT NULL, -- วันสิ้นสุดปีการศึกษา
    
    -- สถานะ
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'completed', 'cancelled'
    is_current BOOLEAN DEFAULT false, -- ปีการศึกษาปัจจุบัน
    
    -- หมายเหตุ
    description TEXT,
    notes TEXT,
    
    -- ผู้สร้าง
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางเทอม/ภาคเรียน
CREATE TABLE IF NOT EXISTS academic_terms (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    
    -- ความสัมพันธ์
    academic_year_id INTEGER NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    
    -- ข้อมูลเทอม
    term_number INTEGER NOT NULL, -- เทอมที่ 1, 2, 3 (summer)
    term_name VARCHAR(100) NOT NULL, -- เช่น 'เทอมต้น', 'เทอมปลาย', 'เทอมฤดูร้อน'
    term_name_th VARCHAR(100) NOT NULL,
    term_name_en VARCHAR(100) NOT NULL,
    term_code VARCHAR(20) NOT NULL, -- เช่น '2567/1', '2567/2', '2567/S'
    
    -- ระยะเวลาเทอม
    start_date DATE NOT NULL, -- วันเริ่มเทอม
    end_date DATE NOT NULL, -- วันสิ้นสุดเทอม
    duration_weeks INTEGER, -- จำนวนสัปดาห์
    duration_days INTEGER, -- จำนวนวัน
    
    -- ระยะเวลาสำคัญ
    registration_start_date DATE, -- วันเริ่มลงทะเบียน
    registration_end_date DATE, -- วันสิ้นสุดลงทะเบียน
    add_drop_end_date DATE, -- วันสุดท้ายเพิ่ม-ถอนวิชา
    withdraw_end_date DATE, -- วันสุดท้ายถอนวิชา
    
    -- การสอบ
    midterm_exam_start DATE, -- วันเริ่มสอบกลางภาค
    midterm_exam_end DATE, -- วันสิ้นสุดสอบกลางภาค
    final_exam_start DATE, -- วันเริ่มสอบปลายภาค
    final_exam_end DATE, -- วันสิ้นสุดสอบปลายภาค
    
    -- สถานะ
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'completed', 'cancelled'
    is_current BOOLEAN DEFAULT false, -- เทอมปัจจุบัน
    
    -- หมายเหตุ
    description TEXT,
    notes TEXT,
    
    -- ผู้สร้าง
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(academic_year_id, term_number),
    UNIQUE(term_code)
);

-- ตารางประเภทวันหยุด
CREATE TABLE IF NOT EXISTS holiday_types (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    
    type_code VARCHAR(50) NOT NULL UNIQUE, -- 'national', 'religious', 'university', 'semester_break'
    type_name VARCHAR(255) NOT NULL,
    type_name_th VARCHAR(255) NOT NULL,
    type_name_en VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- การแสดงผล
    color VARCHAR(7) DEFAULT '#dc2626', -- สีสำหรับแสดงในปฏิทิน
    icon VARCHAR(100), -- ไอคอน
    
    -- การใช้งาน
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางวันหยุด
CREATE TABLE IF NOT EXISTS academic_holidays (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    
    -- ความสัมพันธ์
    academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
    academic_term_id INTEGER REFERENCES academic_terms(id) ON DELETE SET NULL,
    holiday_type_id INTEGER NOT NULL REFERENCES holiday_types(id) ON DELETE RESTRICT,
    
    -- ข้อมูลวันหยุด
    holiday_name VARCHAR(255) NOT NULL,
    holiday_name_th VARCHAR(255) NOT NULL,
    holiday_name_en VARCHAR(255) NOT NULL,
    
    -- วันที่
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_single_day BOOLEAN DEFAULT true, -- วันเดียวหรือหลายวัน
    
    -- ประเภทวันหยุด
    recurrence_type VARCHAR(50) DEFAULT 'none', -- 'none', 'yearly', 'monthly'
    recurrence_pattern JSON, -- รูปแบบการเกิดซ้ำ
    
    -- การใช้งาน
    is_active BOOLEAN DEFAULT true,
    affects_classes BOOLEAN DEFAULT true, -- ส่งผลต่อการเรียนการสอน
    affects_exams BOOLEAN DEFAULT true, -- ส่งผลต่อการสอบ
    affects_registration BOOLEAN DEFAULT false, -- ส่งผลต่อการลงทะเบียน
    
    -- หมายเหตุ
    description TEXT,
    notes TEXT,
    
    -- ผู้สร้าง
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางเหตุการณ์สำคัญ
CREATE TABLE IF NOT EXISTS academic_events (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    
    -- ความสัมพันธ์
    academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
    academic_term_id INTEGER REFERENCES academic_terms(id) ON DELETE SET NULL,
    
    -- ข้อมูลเหตุการณ์
    event_name VARCHAR(255) NOT NULL,
    event_name_th VARCHAR(255) NOT NULL,
    event_name_en VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- 'registration', 'exam', 'graduation', 'orientation', 'deadline'
    
    -- วันที่และเวลา
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    is_all_day BOOLEAN DEFAULT true,
    
    -- สถานที่
    location VARCHAR(255),
    venue VARCHAR(255),
    
    -- การแสดงผล
    color VARCHAR(7) DEFAULT '#3b82f6',
    icon VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    
    -- การแจ้งเตือน
    notification_enabled BOOLEAN DEFAULT true,
    notification_days_before INTEGER DEFAULT 7, -- แจ้งเตือนก่อนกี่วัน
    
    -- การใช้งาน
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true, -- แสดงให้ทุกคนเห็น
    
    -- หมายเหตุ
    description TEXT,
    notes TEXT,
    
    -- ผู้สร้าง
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางการตั้งค่าปฏิทิน
CREATE TABLE IF NOT EXISTS calendar_settings (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    
    -- การตั้งค่าทั่วไป
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_name VARCHAR(255) NOT NULL,
    setting_name_th VARCHAR(255) NOT NULL,
    setting_value TEXT,
    default_value TEXT,
    
    -- ประเภทข้อมูล
    data_type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json', 'date'
    input_type VARCHAR(50) DEFAULT 'text', -- 'text', 'number', 'select', 'date', 'color'
    
    -- ตัวเลือก
    allowed_values JSON, -- ค่าที่อนุญาต
    validation_rules JSON, -- กฎการตรวจสอบ
    
    -- การจัดกลุ่ม
    category VARCHAR(100) DEFAULT 'general', -- 'general', 'display', 'notification', 'academic'
    group_name VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    
    -- คำอธิบาย
    description TEXT,
    help_text TEXT,
    
    -- การใช้งาน
    is_active BOOLEAN DEFAULT true,
    is_readonly BOOLEAN DEFAULT false,
    
    -- ผู้แก้ไข
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางเทมเพลตปฏิทิน
CREATE TABLE IF NOT EXISTS calendar_templates (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    
    template_name VARCHAR(255) NOT NULL,
    template_name_th VARCHAR(255) NOT NULL,
    template_name_en VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- ข้อมูลเทมเพลต
    template_data JSON NOT NULL, -- โครงสร้างปฏิทินแบบ JSON
    
    -- การใช้งาน
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    
    -- ผู้สร้าง
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้าง indexes สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_academic_years_year ON academic_years(academic_year);
CREATE INDEX IF NOT EXISTS idx_academic_years_current ON academic_years(is_current);
CREATE INDEX IF NOT EXISTS idx_academic_years_status ON academic_years(status);
CREATE INDEX IF NOT EXISTS idx_academic_years_dates ON academic_years(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_academic_terms_year ON academic_terms(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_academic_terms_code ON academic_terms(term_code);
CREATE INDEX IF NOT EXISTS idx_academic_terms_current ON academic_terms(is_current);
CREATE INDEX IF NOT EXISTS idx_academic_terms_dates ON academic_terms(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_academic_holidays_year ON academic_holidays(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_academic_holidays_term ON academic_holidays(academic_term_id);
CREATE INDEX IF NOT EXISTS idx_academic_holidays_type ON academic_holidays(holiday_type_id);
CREATE INDEX IF NOT EXISTS idx_academic_holidays_dates ON academic_holidays(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_academic_holidays_active ON academic_holidays(is_active);

CREATE INDEX IF NOT EXISTS idx_academic_events_year ON academic_events(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_academic_events_term ON academic_events(academic_term_id);
CREATE INDEX IF NOT EXISTS idx_academic_events_type ON academic_events(event_type);
CREATE INDEX IF NOT EXISTS idx_academic_events_dates ON academic_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_academic_events_active ON academic_events(is_active);

CREATE INDEX IF NOT EXISTS idx_calendar_settings_key ON calendar_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_calendar_settings_category ON calendar_settings(category);

-- สร้าง triggers สำหรับ updated_at
CREATE TRIGGER update_academic_years_updated_at BEFORE UPDATE ON academic_years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_academic_terms_updated_at BEFORE UPDATE ON academic_terms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_holiday_types_updated_at BEFORE UPDATE ON holiday_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_academic_holidays_updated_at BEFORE UPDATE ON academic_holidays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_academic_events_updated_at BEFORE UPDATE ON academic_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_settings_updated_at BEFORE UPDATE ON calendar_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_templates_updated_at BEFORE UPDATE ON calendar_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- สร้าง trigger สำหรับจัดการ current academic year/term
CREATE OR REPLACE FUNCTION manage_current_academic_period()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'academic_years' THEN
        -- ถ้าตั้งเป็น current ให้ยกเลิก current ของปีอื่น
        IF NEW.is_current = true THEN
            UPDATE academic_years 
            SET is_current = false 
            WHERE id != NEW.id AND is_current = true;
        END IF;
        RETURN NEW;
    ELSIF TG_TABLE_NAME = 'academic_terms' THEN
        -- ถ้าตั้งเป็น current ให้ยกเลิก current ของเทอมอื่น
        IF NEW.is_current = true THEN
            UPDATE academic_terms 
            SET is_current = false 
            WHERE id != NEW.id AND is_current = true;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manage_current_academic_year_trigger
    BEFORE UPDATE ON academic_years
    FOR EACH ROW EXECUTE FUNCTION manage_current_academic_period();

CREATE TRIGGER manage_current_academic_term_trigger
    BEFORE UPDATE ON academic_terms
    FOR EACH ROW EXECUTE FUNCTION manage_current_academic_period();

-- Functions สำหรับการจัดการปฏิทิน

-- Function: ดึงปีการศึกษาปัจจุบัน
CREATE OR REPLACE FUNCTION get_current_academic_year()
RETURNS TABLE(
    id INTEGER,
    academic_year VARCHAR(10),
    academic_year_th VARCHAR(20),
    start_date DATE,
    end_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT ay.id, ay.academic_year, ay.academic_year_th, ay.start_date, ay.end_date
    FROM academic_years ay
    WHERE ay.is_current = true AND ay.status = 'active'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: ดึงเทอมปัจจุบัน
CREATE OR REPLACE FUNCTION get_current_academic_term()
RETURNS TABLE(
    id INTEGER,
    term_code VARCHAR(20),
    term_name_th VARCHAR(100),
    start_date DATE,
    end_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT at.id, at.term_code, at.term_name_th, at.start_date, at.end_date
    FROM academic_terms at
    WHERE at.is_current = true AND at.status = 'active'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: คำนวณจำนวนวันทำการ (ไม่รวมวันหยุด)
CREATE OR REPLACE FUNCTION calculate_working_days(
    p_start_date DATE,
    p_end_date DATE,
    p_academic_year_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    total_days INTEGER;
    holiday_days INTEGER;
    working_days INTEGER;
BEGIN
    -- คำนวณจำนวนวันทั้งหมด
    total_days := p_end_date - p_start_date + 1;
    
    -- คำนวณจำนวนวันหยุด
    SELECT COUNT(*)
    INTO holiday_days
    FROM academic_holidays ah
    WHERE ah.is_active = true
        AND ah.affects_classes = true
        AND (p_academic_year_id IS NULL OR ah.academic_year_id = p_academic_year_id)
        AND (
            (ah.start_date BETWEEN p_start_date AND p_end_date) OR
            (ah.end_date BETWEEN p_start_date AND p_end_date) OR
            (ah.start_date <= p_start_date AND ah.end_date >= p_end_date)
        );
    
    working_days := total_days - holiday_days;
    
    RETURN GREATEST(working_days, 0);
END;
$$ LANGUAGE plpgsql;

-- Function: ตรวจสอบว่าวันที่เป็นวันหยุดหรือไม่
CREATE OR REPLACE FUNCTION is_holiday(
    p_date DATE,
    p_academic_year_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    is_holiday_date BOOLEAN := false;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM academic_holidays ah
        WHERE ah.is_active = true
            AND p_date BETWEEN ah.start_date AND ah.end_date
            AND (p_academic_year_id IS NULL OR ah.academic_year_id = p_academic_year_id)
    ) INTO is_holiday_date;
    
    RETURN is_holiday_date;
END;
$$ LANGUAGE plpgsql;

-- Function: ดึงวันหยุดในช่วงเวลา
CREATE OR REPLACE FUNCTION get_holidays_in_period(
    p_start_date DATE,
    p_end_date DATE,
    p_academic_year_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
    holiday_name_th VARCHAR(255),
    start_date DATE,
    end_date DATE,
    holiday_type VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ah.holiday_name_th,
        ah.start_date,
        ah.end_date,
        ht.type_name_th
    FROM academic_holidays ah
    JOIN holiday_types ht ON ah.holiday_type_id = ht.id
    WHERE ah.is_active = true
        AND (p_academic_year_id IS NULL OR ah.academic_year_id = p_academic_year_id)
        AND (
            (ah.start_date BETWEEN p_start_date AND p_end_date) OR
            (ah.end_date BETWEEN p_start_date AND p_end_date) OR
            (ah.start_date <= p_start_date AND ah.end_date >= p_end_date)
        )
    ORDER BY ah.start_date;
END;
$$ LANGUAGE plpgsql;

-- Function: สร้างปฏิทินจากเทมเพลต
CREATE OR REPLACE FUNCTION create_calendar_from_template(
    p_template_id INTEGER,
    p_academic_year VARCHAR(10),
    p_start_date DATE,
    p_created_by INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    template_data JSON;
    new_academic_year_id INTEGER;
BEGIN
    -- ดึงข้อมูลเทมเพลต
    SELECT ct.template_data INTO template_data
    FROM calendar_templates ct
    WHERE ct.id = p_template_id AND ct.is_active = true;
    
    IF template_data IS NULL THEN
        RAISE EXCEPTION 'Template not found or inactive';
    END IF;
    
    -- สร้างปีการศึกษาใหม่
    INSERT INTO academic_years (academic_year, academic_year_th, academic_year_en, start_date, end_date, created_by)
    VALUES (
        p_academic_year,
        'ปีการศึกษา ' || p_academic_year,
        'Academic Year ' || p_academic_year,
        p_start_date,
        p_start_date + INTERVAL '1 year' - INTERVAL '1 day',
        p_created_by
    )
    RETURNING id INTO new_academic_year_id;
    
    -- สร้างเทอมและเหตุการณ์ตามเทมเพลต (ต้องพัฒนาต่อตาม template_data)
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMIT;