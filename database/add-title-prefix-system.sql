-- ระบบจัดการคำนำหน้าชื่อ (Title/Prefix Management System)
-- สำหรับ Super Admin และ Admin ในการตั้งค่าคำนำหน้าชื่อ

-- ตารางคำนำหน้าชื่อ
CREATE TABLE IF NOT EXISTS title_prefixes (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    
    -- คำนำหน้าชื่อ
    prefix_code VARCHAR(20) NOT NULL UNIQUE, -- รหัสคำนำหน้า เช่น 'MR', 'MRS', 'DR'
    prefix_th VARCHAR(50) NOT NULL, -- คำนำหน้าภาษาไทย เช่น 'นาย', 'นาง', 'ดร.'
    prefix_en VARCHAR(50) NOT NULL, -- คำนำหน้าภาษาอังกฤษ เช่น 'Mr.', 'Mrs.', 'Dr.'
    
    -- การจัดหมวดหมู่
    category VARCHAR(50) NOT NULL DEFAULT 'general', -- 'general', 'academic', 'military', 'royal', 'religious'
    gender VARCHAR(10), -- 'male', 'female', 'unisex', NULL = ไม่จำกัด
    
    -- คำอธิบาย
    description TEXT,
    description_th TEXT,
    description_en TEXT,
    
    -- การใช้งาน
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- คำนำหน้าเริ่มต้น
    sort_order INTEGER DEFAULT 0,
    
    -- ผู้สร้าง
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางการกำหนดสิทธิ์ใช้คำนำหน้าชื่อตาม Role
CREATE TABLE IF NOT EXISTS title_prefix_permissions (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    
    -- ความสัมพันธ์
    prefix_id INTEGER NOT NULL REFERENCES title_prefixes(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    
    -- สิทธิ์การใช้งาน
    can_use BOOLEAN DEFAULT true, -- สามารถใช้ได้หรือไม่
    is_default_for_role BOOLEAN DEFAULT false, -- เป็นค่าเริ่มต้นสำหรับ role นี้
    
    -- เงื่อนไขเพิ่มเติม
    conditions JSON, -- เงื่อนไขพิเศษ เช่น เฉพาะเพศ, อายุ
    restrictions JSON, -- ข้อจำกัด
    
    -- ผู้กำหนด
    assigned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- หมายเหตุ
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(prefix_id, role_id)
);

-- เพิ่มคอลัมน์ title_prefix_id ในตาราง users
ALTER TABLE users ADD COLUMN IF NOT EXISTS title_prefix_id INTEGER REFERENCES title_prefixes(id) ON DELETE SET NULL;

-- ตารางประวัติการเปลี่ยนแปลงคำนำหน้าชื่อ
CREATE TABLE IF NOT EXISTS title_prefix_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- การเปลี่ยนแปลง
    old_prefix_id INTEGER REFERENCES title_prefixes(id) ON DELETE SET NULL,
    new_prefix_id INTEGER REFERENCES title_prefixes(id) ON DELETE SET NULL,
    change_type VARCHAR(50) NOT NULL, -- 'assigned', 'changed', 'removed'
    change_reason TEXT,
    
    -- ผู้ทำการเปลี่ยนแปลง
    changed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- IP และ User Agent
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางการตั้งค่าคำนำหน้าชื่อ
CREATE TABLE IF NOT EXISTS title_prefix_settings (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_name VARCHAR(255) NOT NULL,
    setting_name_th VARCHAR(255) NOT NULL,
    setting_value TEXT,
    default_value TEXT,
    
    -- ประเภทข้อมูล
    data_type VARCHAR(50) DEFAULT 'string', -- 'string', 'boolean', 'number', 'json'
    input_type VARCHAR(50) DEFAULT 'text', -- 'text', 'select', 'boolean', 'textarea'
    
    -- ตัวเลือก
    allowed_values JSON, -- ค่าที่อนุญาต
    validation_rules JSON, -- กฎการตรวจสอบ
    
    -- การจัดกลุ่ม
    category VARCHAR(100) DEFAULT 'general',
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

-- สร้าง indexes สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_title_prefixes_code ON title_prefixes(prefix_code);
CREATE INDEX IF NOT EXISTS idx_title_prefixes_category ON title_prefixes(category);
CREATE INDEX IF NOT EXISTS idx_title_prefixes_gender ON title_prefixes(gender);
CREATE INDEX IF NOT EXISTS idx_title_prefixes_active ON title_prefixes(is_active);

CREATE INDEX IF NOT EXISTS idx_title_prefix_permissions_prefix ON title_prefix_permissions(prefix_id);
CREATE INDEX IF NOT EXISTS idx_title_prefix_permissions_role ON title_prefix_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_title_prefix_permissions_can_use ON title_prefix_permissions(can_use);

CREATE INDEX IF NOT EXISTS idx_users_title_prefix ON users(title_prefix_id);

CREATE INDEX IF NOT EXISTS idx_title_prefix_history_user ON title_prefix_history(user_id);
CREATE INDEX IF NOT EXISTS idx_title_prefix_history_changed_by ON title_prefix_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_title_prefix_history_created_at ON title_prefix_history(created_at);

CREATE INDEX IF NOT EXISTS idx_title_prefix_settings_key ON title_prefix_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_title_prefix_settings_category ON title_prefix_settings(category);

-- สร้าง triggers สำหรับ updated_at
CREATE TRIGGER update_title_prefixes_updated_at BEFORE UPDATE ON title_prefixes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_title_prefix_permissions_updated_at BEFORE UPDATE ON title_prefix_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_title_prefix_settings_updated_at BEFORE UPDATE ON title_prefix_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- สร้าง trigger สำหรับบันทึกประวัติการเปลี่ยนแปลงคำนำหน้าชื่อ
CREATE OR REPLACE FUNCTION log_title_prefix_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- บันทึกการเปลี่ยนแปลงคำนำหน้าชื่อ
        IF OLD.title_prefix_id IS DISTINCT FROM NEW.title_prefix_id THEN
            INSERT INTO title_prefix_history (user_id, old_prefix_id, new_prefix_id, change_type, changed_by, change_reason)
            VALUES (
                NEW.id, 
                OLD.title_prefix_id, 
                NEW.title_prefix_id, 
                CASE 
                    WHEN OLD.title_prefix_id IS NULL THEN 'assigned'
                    WHEN NEW.title_prefix_id IS NULL THEN 'removed'
                    ELSE 'changed'
                END,
                NEW.id, -- ถ้าไม่มีข้อมูลผู้แก้ไข ให้ใช้ user เอง
                'Title prefix updated'
            );
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_title_prefix_changes_trigger
    AFTER UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION log_title_prefix_changes();

-- Functions สำหรับการจัดการคำนำหน้าชื่อ

-- Function: ดึงคำนำหน้าชื่อที่ role สามารถใช้ได้
CREATE OR REPLACE FUNCTION get_available_prefixes_for_role(p_role_id INTEGER)
RETURNS TABLE(
    prefix_id INTEGER,
    prefix_code VARCHAR(20),
    prefix_th VARCHAR(50),
    prefix_en VARCHAR(50),
    category VARCHAR(50),
    gender VARCHAR(10),
    is_default_for_role BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tp.id,
        tp.prefix_code,
        tp.prefix_th,
        tp.prefix_en,
        tp.category,
        tp.gender,
        COALESCE(tpp.is_default_for_role, false)
    FROM title_prefixes tp
    LEFT JOIN title_prefix_permissions tpp ON (
        tp.id = tpp.prefix_id 
        AND tpp.role_id = p_role_id 
        AND tpp.can_use = true
    )
    WHERE tp.is_active = true
        AND (
            tpp.id IS NOT NULL -- มีสิทธิ์ใช้งาน
            OR NOT EXISTS ( -- หรือไม่มีการกำหนดสิทธิ์เฉพาะ (ใช้ได้ทั่วไป)
                SELECT 1 FROM title_prefix_permissions tpp2 
                WHERE tpp2.prefix_id = tp.id
            )
        )
    ORDER BY tp.sort_order, tp.prefix_th;
END;
$$ LANGUAGE plpgsql;

-- Function: ตรวจสอบว่า user สามารถใช้คำนำหน้าชื่อนี้ได้หรือไม่
CREATE OR REPLACE FUNCTION can_user_use_prefix(
    p_user_id INTEGER,
    p_prefix_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    user_roles INTEGER[];
    can_use BOOLEAN := false;
BEGIN
    -- ดึง roles ของ user
    SELECT ARRAY_AGG(ur.role_id)
    INTO user_roles
    FROM user_roles ur
    WHERE ur.user_id = p_user_id 
        AND ur.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP);
    
    -- ตรวจสอบสิทธิ์
    SELECT EXISTS(
        SELECT 1
        FROM title_prefixes tp
        LEFT JOIN title_prefix_permissions tpp ON tp.id = tpp.prefix_id
        WHERE tp.id = p_prefix_id
            AND tp.is_active = true
            AND (
                tpp.id IS NULL -- ไม่มีการจำกัดสิทธิ์
                OR (
                    tpp.role_id = ANY(user_roles)
                    AND tpp.can_use = true
                )
            )
    ) INTO can_use;
    
    RETURN can_use;
END;
$$ LANGUAGE plpgsql;

-- Function: กำหนดสิทธิ์ใช้คำนำหน้าชื่อให้ role
CREATE OR REPLACE FUNCTION set_prefix_permission_for_role(
    p_prefix_id INTEGER,
    p_role_id INTEGER,
    p_can_use BOOLEAN,
    p_is_default BOOLEAN DEFAULT false,
    p_assigned_by INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
BEGIN
    -- ถ้าตั้งเป็น default ให้ยกเลิก default ของคำนำหน้าอื่นสำหรับ role นี้
    IF p_is_default = true THEN
        UPDATE title_prefix_permissions 
        SET is_default_for_role = false 
        WHERE role_id = p_role_id AND prefix_id != p_prefix_id;
    END IF;
    
    -- กำหนดสิทธิ์
    INSERT INTO title_prefix_permissions (prefix_id, role_id, can_use, is_default_for_role, assigned_by)
    VALUES (p_prefix_id, p_role_id, p_can_use, p_is_default, p_assigned_by)
    ON CONFLICT (prefix_id, role_id)
    DO UPDATE SET 
        can_use = p_can_use,
        is_default_for_role = p_is_default,
        assigned_by = p_assigned_by,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function: ดึงชื่อเต็มพร้อมคำนำหน้า
CREATE OR REPLACE FUNCTION get_full_name_with_prefix(
    p_user_id INTEGER,
    p_language VARCHAR(5) DEFAULT 'th'
)
RETURNS TEXT AS $$
DECLARE
    full_name TEXT;
    prefix_text VARCHAR(50);
    first_name VARCHAR(100);
    last_name VARCHAR(100);
BEGIN
    -- ดึงข้อมูลผู้ใช้และคำนำหน้า
    SELECT 
        u.first_name,
        u.last_name,
        CASE 
            WHEN p_language = 'en' THEN tp.prefix_en
            ELSE tp.prefix_th
        END
    INTO first_name, last_name, prefix_text
    FROM users u
    LEFT JOIN title_prefixes tp ON u.title_prefix_id = tp.id AND tp.is_active = true
    WHERE u.id = p_user_id;
    
    -- สร้างชื่อเต็ม
    IF prefix_text IS NOT NULL THEN
        full_name := prefix_text || ' ' || first_name || ' ' || last_name;
    ELSE
        full_name := first_name || ' ' || last_name;
    END IF;
    
    RETURN TRIM(full_name);
END;
$$ LANGUAGE plpgsql;

-- Function: ดึงการตั้งค่าคำนำหน้าชื่อ
CREATE OR REPLACE FUNCTION get_title_prefix_setting(p_setting_key VARCHAR(255))
RETURNS TEXT AS $$
DECLARE
    setting_value TEXT;
BEGIN
    SELECT COALESCE(tps.setting_value, tps.default_value)
    INTO setting_value
    FROM title_prefix_settings tps
    WHERE tps.setting_key = p_setting_key AND tps.is_active = true;
    
    RETURN setting_value;
END;
$$ LANGUAGE plpgsql;

-- Function: อัพเดทการตั้งค่าคำนำหน้าชื่อ
CREATE OR REPLACE FUNCTION update_title_prefix_setting(
    p_setting_key VARCHAR(255),
    p_setting_value TEXT,
    p_updated_by INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE title_prefix_settings
    SET setting_value = p_setting_value,
        updated_by = p_updated_by,
        updated_at = CURRENT_TIMESTAMP
    WHERE setting_key = p_setting_key AND is_active = true;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMIT;