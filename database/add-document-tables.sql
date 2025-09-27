-- เพิ่มตารางเอกสารใหม่สำหรับระบบจัดการเอกสารสหกิจศึกษา
-- รันไฟล์นี้หลังจากการสร้างฐานข้อมูลหลักแล้ว

-- ตารางประเภทเอกสาร
CREATE TABLE IF NOT EXISTS document_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    name_th VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'application', 'report', 'certificate', 'evaluation', 'other'
    is_required BOOLEAN DEFAULT false,
    max_file_size BIGINT DEFAULT 10485760, -- 10MB default
    allowed_extensions TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx'],
    template_path VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางเอกสารหลัก (ปรับปรุงจากเดิม)
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    title_th VARCHAR(255),
    description TEXT,
    document_type_id INTEGER REFERENCES document_types(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'submitted', 'under_review', 'approved', 'rejected', 'expired'
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    
    -- ข้อมูลไฟล์
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64), -- SHA-256 hash for integrity
    
    -- เวอร์ชัน
    version INTEGER DEFAULT 1,
    parent_document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
    is_latest_version BOOLEAN DEFAULT true,
    
    -- ความสัมพันธ์
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    internship_id INTEGER REFERENCES internships(id) ON DELETE SET NULL,
    
    -- ผู้ที่เกี่ยวข้อง
    uploaded_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_to_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- วันที่สำคัญ
    due_date TIMESTAMP,
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    approved_at TIMESTAMP,
    expired_at TIMESTAMP,
    
    -- ข้อมูลเพิ่มเติม
    metadata JSON, -- เก็บข้อมูลเพิ่มเติมแบบ flexible
    tags TEXT[], -- แท็กสำหรับการค้นหา
    is_confidential BOOLEAN DEFAULT false,
    access_level VARCHAR(20) DEFAULT 'normal', -- 'public', 'normal', 'restricted', 'confidential'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางการอนุมัติเอกสาร (ปรับปรุง)
CREATE TABLE IF NOT EXISTS document_approvals (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    approver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approval_level INTEGER NOT NULL DEFAULT 1, -- ลำดับการอนุมัติ
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'delegated'
    decision VARCHAR(20), -- 'approve', 'reject', 'request_changes'
    comments TEXT,
    internal_notes TEXT, -- หมายเหตุภายใน
    
    -- การมอบหมาย
    delegated_to_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    delegated_at TIMESTAMP,
    
    -- วันที่
    due_date TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(document_id, approver_id, approval_level)
);

-- ตารางความคิดเห็นเอกสาร (ปรับปรุง)
CREATE TABLE IF NOT EXISTS document_comments (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES document_comments(id) ON DELETE CASCADE,
    
    comment TEXT NOT NULL,
    comment_type VARCHAR(50) DEFAULT 'general', -- 'general', 'suggestion', 'correction', 'question'
    is_internal BOOLEAN DEFAULT false, -- ความคิดเห็นภายใน
    is_resolved BOOLEAN DEFAULT false,
    
    -- การแนบไฟล์ในความคิดเห็น
    attachment_path VARCHAR(500),
    attachment_name VARCHAR(255),
    
    resolved_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางเทมเพลตเอกสาร (ปรับปรุง)
CREATE TABLE IF NOT EXISTS document_templates (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_th VARCHAR(255) NOT NULL,
    description TEXT,
    document_type_id INTEGER REFERENCES document_types(id) ON DELETE CASCADE,
    
    -- ไฟล์เทมเพลต
    template_path VARCHAR(500) NOT NULL,
    template_filename VARCHAR(255) NOT NULL,
    template_size BIGINT,
    
    -- การใช้งาน
    usage_count INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- เวอร์ชัน
    version VARCHAR(20) DEFAULT '1.0',
    changelog TEXT,
    
    -- ผู้สร้าง
    created_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางประวัติการเปลี่ยนแปลงเอกสาร
CREATE TABLE IF NOT EXISTS document_history (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- 'created', 'updated', 'submitted', 'approved', 'rejected', 'deleted'
    old_values JSON,
    new_values JSON,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางการแชร์เอกสาร
CREATE TABLE IF NOT EXISTS document_shares (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    shared_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    shared_with_role VARCHAR(50), -- หากแชร์กับ role แทน user เฉพาะ
    
    permission VARCHAR(20) NOT NULL DEFAULT 'view', -- 'view', 'comment', 'edit'
    expires_at TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางการดาวน์โหลดเอกสาร
CREATE TABLE IF NOT EXISTS document_downloads (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    download_type VARCHAR(50) DEFAULT 'direct', -- 'direct', 'preview', 'print'
    file_size BIGINT,
    download_time DECIMAL(10,3), -- เวลาในการดาวน์โหลด (วินาที)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางการแจ้งเตือนเอกสาร
CREATE TABLE IF NOT EXISTS document_notifications (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL, -- 'due_soon', 'overdue', 'approved', 'rejected', 'comment_added'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    
    -- การส่งแจ้งเตือน
    send_email BOOLEAN DEFAULT true,
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP,
    
    send_sms BOOLEAN DEFAULT false,
    sms_sent BOOLEAN DEFAULT false,
    sms_sent_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้าง indexes สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_student ON documents(student_id);
CREATE INDEX IF NOT EXISTS idx_documents_internship ON documents(internship_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by_id);
CREATE INDEX IF NOT EXISTS idx_documents_due_date ON documents(due_date);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_uuid ON documents(uuid);

CREATE INDEX IF NOT EXISTS idx_document_approvals_document ON document_approvals(document_id);
CREATE INDEX IF NOT EXISTS idx_document_approvals_approver ON document_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_document_approvals_status ON document_approvals(status);

CREATE INDEX IF NOT EXISTS idx_document_comments_document ON document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_user ON document_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_parent ON document_comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_document_history_document ON document_history(document_id);
CREATE INDEX IF NOT EXISTS idx_document_history_user ON document_history(user_id);
CREATE INDEX IF NOT EXISTS idx_document_history_action ON document_history(action);
CREATE INDEX IF NOT EXISTS idx_document_history_created_at ON document_history(created_at);

CREATE INDEX IF NOT EXISTS idx_document_shares_document ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_with ON document_shares(shared_with_id);

CREATE INDEX IF NOT EXISTS idx_document_downloads_document ON document_downloads(document_id);
CREATE INDEX IF NOT EXISTS idx_document_downloads_user ON document_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_document_downloads_created_at ON document_downloads(created_at);

CREATE INDEX IF NOT EXISTS idx_document_notifications_document ON document_notifications(document_id);
CREATE INDEX IF NOT EXISTS idx_document_notifications_user ON document_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_document_notifications_type ON document_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_document_notifications_is_read ON document_notifications(is_read);

-- สร้าง triggers สำหรับ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_types_updated_at BEFORE UPDATE ON document_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_approvals_updated_at BEFORE UPDATE ON document_approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_comments_updated_at BEFORE UPDATE ON document_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON document_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_shares_updated_at BEFORE UPDATE ON document_shares FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_notifications_updated_at BEFORE UPDATE ON document_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- สร้าง trigger สำหรับบันทึกประวัติการเปลี่ยนแปลง
CREATE OR REPLACE FUNCTION log_document_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO document_history (document_id, user_id, action, new_values, description)
        VALUES (NEW.id, NEW.uploaded_by_id, 'created', row_to_json(NEW), 'เอกสารถูกสร้างใหม่');
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO document_history (document_id, user_id, action, old_values, new_values, description)
        VALUES (NEW.id, NEW.uploaded_by_id, 'updated', row_to_json(OLD), row_to_json(NEW), 'เอกสารถูกแก้ไข');
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO document_history (document_id, user_id, action, old_values, description)
        VALUES (OLD.id, OLD.uploaded_by_id, 'deleted', row_to_json(OLD), 'เอกสารถูกลบ');
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_document_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION log_document_changes();

COMMIT;