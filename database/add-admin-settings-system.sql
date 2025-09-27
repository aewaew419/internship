-- ระบบการตั้งค่าและ User Role Management สำหรับ Super Admin
-- รองรับการจัดการสิทธิ์แบบ Matrix (Role x Module)

-- ตารางการตั้งค่าระบบ
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL, -- 'general', 'security', 'notification', 'integration', 'appearance'
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_name VARCHAR(255) NOT NULL,
    setting_name_th VARCHAR(255) NOT NULL,
    description TEXT,
    description_th TEXT,
    
    -- ค่าการตั้งค่า
    setting_value TEXT, -- ค่าปัจจุบัน
    default_value TEXT, -- ค่าเริ่มต้น
    data_type VARCHAR(50) NOT NULL DEFAULT 'string', -- 'string', 'number', 'boolean', 'json', 'array'
    
    -- การตรวจสอบ
    validation_rules JSON, -- กฎการตรวจสอบ
    allowed_values JSON, -- ค่าที่อนุญาต (สำหรับ dropdown)
    
    -- การแสดงผล
    input_type VARCHAR(50) DEFAULT 'text', -- 'text', 'number', 'boolean', 'select', 'textarea', 'json'
    is_sensitive BOOLEAN DEFAULT false, -- ข้อมูลที่ต้องเข้ารหัส
    is_readonly BOOLEAN DEFAULT false, -- อ่านอย่างเดียว
    
    -- การจัดกลุ่ม
    group_name VARCHAR(100), -- กลุ่มการตั้งค่า
    sort_order INTEGER DEFAULT 0,
    
    -- การใช้งาน
    is_active BOOLEAN DEFAULT true,
    requires_restart BOOLEAN DEFAULT false, -- ต้องรีสตาร์ทระบบ
    
    -- ผู้แก้ไข
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางโมดูลระบบ
CREATE TABLE IF NOT EXISTS system_modules (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    module_code VARCHAR(50) NOT NULL UNIQUE, -- 'dashboard', 'users', 'students', 'companies'
    module_name VARCHAR(255) NOT NULL,
    module_name_th VARCHAR(255) NOT NULL,
    description TEXT,
    description_th TEXT,
    
    -- การจัดกลุ่ม
    parent_module_id INTEGER REFERENCES system_modules(id) ON DELETE SET NULL,
    category VARCHAR(100), -- 'core', 'academic', 'document', 'report', 'setting'
    
    -- การแสดงผล
    icon VARCHAR(100), -- ไอคอน
    route_path VARCHAR(255), -- เส้นทาง URL
    component_name VARCHAR(255), -- ชื่อ component
    
    -- การเรียงลำดับ
    sort_order INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0, -- ระดับความลึก (0=หลัก, 1=ย่อย)
    
    -- การใช้งาน
    is_active BOOLEAN DEFAULT true,
    is_visible BOOLEAN DEFAULT true, -- แสดงในเมนู
    requires_auth BOOLEAN DEFAULT true, -- ต้องล็อกอิน
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางการดำเนินการ (Actions)
CREATE TABLE IF NOT EXISTS module_actions (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    module_id INTEGER NOT NULL REFERENCES system_modules(id) ON DELETE CASCADE,
    action_code VARCHAR(50) NOT NULL, -- 'view', 'create', 'edit', 'delete', 'approve', 'export'
    action_name VARCHAR(255) NOT NULL,
    action_name_th VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- การแสดงผล
    icon VARCHAR(100),
    button_class VARCHAR(100), -- CSS class สำหรับปุ่ม
    
    -- การใช้งาน
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(module_id, action_code)
);

-- ตารางสิทธิ์การเข้าถึงแบบ Matrix (Role x Module x Action)
CREATE TABLE IF NOT EXISTS role_module_permissions (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    
    -- ความสัมพันธ์
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL REFERENCES system_modules(id) ON DELETE CASCADE,
    action_id INTEGER NOT NULL REFERENCES module_actions(id) ON DELETE CASCADE,
    
    -- สิทธิ์
    is_allowed BOOLEAN DEFAULT false, -- อนุญาตหรือไม่
    
    -- เงื่อนไขเพิ่มเติม
    conditions JSON, -- เงื่อนไขพิเศษ เช่น เฉพาะข้อมูลของตัวเอง
    restrictions JSON, -- ข้อจำกัด เช่น จำกัดจำนวนรายการ
    
    -- ผู้กำหนด
    assigned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- หมายเหตุ
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(role_id, module_id, action_id)
);

-- ตารางประวัติการเปลี่ยนแปลงสิทธิ์
CREATE TABLE IF NOT EXISTS permission_history (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL REFERENCES system_modules(id) ON DELETE CASCADE,
    action_id INTEGER NOT NULL REFERENCES module_actions(id) ON DELETE CASCADE,
    
    -- การเปลี่ยนแปลง
    old_permission BOOLEAN,
    new_permission BOOLEAN,
    change_type VARCHAR(50) NOT NULL, -- 'granted', 'revoked', 'modified'
    
    -- ผู้ทำการเปลี่ยนแปลง
    changed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    change_reason TEXT,
    
    -- IP และ User Agent
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางการตั้งค่าธีม
CREATE TABLE IF NOT EXISTS theme_settings (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    theme_name VARCHAR(100) NOT NULL UNIQUE,
    theme_display_name VARCHAR(255) NOT NULL,
    theme_display_name_th VARCHAR(255) NOT NULL,
    
    -- การตั้งค่าสี
    primary_color VARCHAR(7) DEFAULT '#3b82f6', -- สีหลัก
    secondary_color VARCHAR(7) DEFAULT '#64748b', -- สีรอง
    accent_color VARCHAR(7) DEFAULT '#10b981', -- สีเน้น
    background_color VARCHAR(7) DEFAULT '#ffffff', -- สีพื้นหลัง
    text_color VARCHAR(7) DEFAULT '#1f2937', -- สีข้อความ
    
    -- การตั้งค่าฟอนต์
    font_family VARCHAR(255) DEFAULT 'Inter, sans-serif',
    font_size_base VARCHAR(10) DEFAULT '14px',
    
    -- การตั้งค่า Layout
    sidebar_width VARCHAR(10) DEFAULT '280px',
    header_height VARCHAR(10) DEFAULT '64px',
    border_radius VARCHAR(10) DEFAULT '8px',
    
    -- CSS เพิ่มเติม
    custom_css TEXT,
    
    -- การใช้งาน
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางการตั้งค่าผู้ใช้
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- การตั้งค่าธีม
    theme_id INTEGER REFERENCES theme_settings(id) ON DELETE SET NULL,
    
    -- การตั้งค่าภาษา
    language VARCHAR(5) DEFAULT 'th', -- 'th', 'en'
    timezone VARCHAR(50) DEFAULT 'Asia/Bangkok',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(10) DEFAULT '24h', -- '12h', '24h'
    
    -- การตั้งค่าการแจ้งเตือน
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    
    -- การตั้งค่าการแสดงผล
    items_per_page INTEGER DEFAULT 20,
    sidebar_collapsed BOOLEAN DEFAULT false,
    
    -- การตั้งค่าเพิ่มเติม
    preferences JSON, -- การตั้งค่าอื่นๆ แบบ flexible
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- สร้าง indexes สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_active ON system_settings(is_active);

CREATE INDEX IF NOT EXISTS idx_system_modules_code ON system_modules(module_code);
CREATE INDEX IF NOT EXISTS idx_system_modules_parent ON system_modules(parent_module_id);
CREATE INDEX IF NOT EXISTS idx_system_modules_category ON system_modules(category);
CREATE INDEX IF NOT EXISTS idx_system_modules_active ON system_modules(is_active);

CREATE INDEX IF NOT EXISTS idx_module_actions_module ON module_actions(module_id);
CREATE INDEX IF NOT EXISTS idx_module_actions_code ON module_actions(action_code);

CREATE INDEX IF NOT EXISTS idx_role_module_permissions_role ON role_module_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_module_permissions_module ON role_module_permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_role_module_permissions_action ON role_module_permissions(action_id);
CREATE INDEX IF NOT EXISTS idx_role_module_permissions_allowed ON role_module_permissions(is_allowed);

CREATE INDEX IF NOT EXISTS idx_permission_history_role ON permission_history(role_id);
CREATE INDEX IF NOT EXISTS idx_permission_history_changed_by ON permission_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_permission_history_created_at ON permission_history(created_at);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_theme ON user_preferences(theme_id);

-- สร้าง triggers สำหรับ updated_at
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_modules_updated_at BEFORE UPDATE ON system_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_module_actions_updated_at BEFORE UPDATE ON module_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_role_module_permissions_updated_at BEFORE UPDATE ON role_module_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_theme_settings_updated_at BEFORE UPDATE ON theme_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- สร้าง trigger สำหรับบันทึกประวัติการเปลี่ยนแปลงสิทธิ์
CREATE OR REPLACE FUNCTION log_permission_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO permission_history (role_id, module_id, action_id, old_permission, new_permission, change_type, changed_by, change_reason)
        VALUES (NEW.role_id, NEW.module_id, NEW.action_id, NULL, NEW.is_allowed, 'granted', NEW.assigned_by, 'Permission granted');
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_allowed != NEW.is_allowed THEN
            INSERT INTO permission_history (role_id, module_id, action_id, old_permission, new_permission, change_type, changed_by, change_reason)
            VALUES (NEW.role_id, NEW.module_id, NEW.action_id, OLD.is_allowed, NEW.is_allowed, 
                   CASE WHEN NEW.is_allowed THEN 'granted' ELSE 'revoked' END, NEW.assigned_by, 'Permission modified');
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO permission_history (role_id, module_id, action_id, old_permission, new_permission, change_type, changed_by, change_reason)
        VALUES (OLD.role_id, OLD.module_id, OLD.action_id, OLD.is_allowed, NULL, 'revoked', OLD.assigned_by, 'Permission revoked');
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_permission_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON role_module_permissions
    FOR EACH ROW EXECUTE FUNCTION log_permission_changes();

-- Functions สำหรับการจัดการสิทธิ์

-- Function: ตรวจสอบสิทธิ์ของ user
CREATE OR REPLACE FUNCTION check_user_module_permission(
    p_user_id INTEGER,
    p_module_code VARCHAR(50),
    p_action_code VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := false;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN role_module_permissions rmp ON r.id = rmp.role_id
        JOIN system_modules sm ON rmp.module_id = sm.id
        JOIN module_actions ma ON rmp.action_id = ma.id
        WHERE ur.user_id = p_user_id
            AND ur.is_active = true
            AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
            AND sm.module_code = p_module_code
            AND ma.action_code = p_action_code
            AND rmp.is_allowed = true
            AND sm.is_active = true
            AND ma.is_active = true
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- Function: ดึงสิทธิ์ทั้งหมดของ user
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id INTEGER)
RETURNS TABLE(
    module_code VARCHAR(50),
    module_name VARCHAR(255),
    action_code VARCHAR(50),
    action_name VARCHAR(255),
    is_allowed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.module_code,
        sm.module_name,
        ma.action_code,
        ma.action_name,
        rmp.is_allowed
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    JOIN role_module_permissions rmp ON r.id = rmp.role_id
    JOIN system_modules sm ON rmp.module_id = sm.id
    JOIN module_actions ma ON rmp.action_id = ma.id
    WHERE ur.user_id = p_user_id
        AND ur.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
        AND sm.is_active = true
        AND ma.is_active = true
    ORDER BY sm.sort_order, ma.sort_order;
END;
$$ LANGUAGE plpgsql;

-- Function: กำหนดสิทธิ์ให้ role
CREATE OR REPLACE FUNCTION set_role_permission(
    p_role_id INTEGER,
    p_module_code VARCHAR(50),
    p_action_code VARCHAR(50),
    p_is_allowed BOOLEAN,
    p_assigned_by INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    module_id INTEGER;
    action_id INTEGER;
BEGIN
    -- หา module_id
    SELECT id INTO module_id FROM system_modules WHERE module_code = p_module_code AND is_active = true;
    IF module_id IS NULL THEN
        RAISE EXCEPTION 'Module % not found', p_module_code;
    END IF;
    
    -- หา action_id
    SELECT id INTO action_id FROM module_actions WHERE module_id = module_id AND action_code = p_action_code AND is_active = true;
    IF action_id IS NULL THEN
        RAISE EXCEPTION 'Action % not found for module %', p_action_code, p_module_code;
    END IF;
    
    -- กำหนดสิทธิ์
    INSERT INTO role_module_permissions (role_id, module_id, action_id, is_allowed, assigned_by)
    VALUES (p_role_id, module_id, action_id, p_is_allowed, p_assigned_by)
    ON CONFLICT (role_id, module_id, action_id)
    DO UPDATE SET 
        is_allowed = p_is_allowed,
        assigned_by = p_assigned_by,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function: ดึงการตั้งค่าระบบ
CREATE OR REPLACE FUNCTION get_system_setting(p_setting_key VARCHAR(255))
RETURNS TEXT AS $$
DECLARE
    setting_value TEXT;
BEGIN
    SELECT COALESCE(ss.setting_value, ss.default_value)
    INTO setting_value
    FROM system_settings ss
    WHERE ss.setting_key = p_setting_key AND ss.is_active = true;
    
    RETURN setting_value;
END;
$$ LANGUAGE plpgsql;

-- Function: อัพเดทการตั้งค่าระบบ
CREATE OR REPLACE FUNCTION update_system_setting(
    p_setting_key VARCHAR(255),
    p_setting_value TEXT,
    p_updated_by INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE system_settings
    SET setting_value = p_setting_value,
        updated_by = p_updated_by,
        updated_at = CURRENT_TIMESTAMP
    WHERE setting_key = p_setting_key AND is_active = true;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMIT;