-- ระบบเอกสารทางราชการที่ต้องปริ้นเป็น PDF
-- รองรับการใช้เลขไทยสำหรับเอกสารไทย และเลขอารบิกสำหรับเอกสารอังกฤษ

-- ตารางประเภทเอกสารทางราชการ
CREATE TABLE IF NOT EXISTS official_document_types (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE, -- รหัสประเภทเอกสาร เช่น 'COOP_REQ', 'STU_REF'
    name VARCHAR(255) NOT NULL,
    name_th VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- การจัดรูปแบบ
    document_format VARCHAR(50) NOT NULL DEFAULT 'official', -- 'official', 'letter', 'certificate', 'report'
    language_support JSON NOT NULL DEFAULT '["th", "en"]', -- ภาษาที่รองรับ
    
    -- การใช้เลข
    number_format JSON NOT NULL DEFAULT '{"th": "thai", "en": "arabic"}', -- รูปแบบเลขตามภาษา
    
    -- เทมเพลต
    template_th VARCHAR(500), -- เทมเพลตภาษาไทย
    template_en VARCHAR(500), -- เทมเพลตภาษาอังกฤษ
    
    -- การอนุมัติ
    requires_approval BOOLEAN DEFAULT true,
    approval_levels INTEGER DEFAULT 1, -- จำนวนระดับการอนุมัติ
    
    -- การใช้งาน
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางเอกสารทางราชการ
CREATE TABLE IF NOT EXISTS official_documents (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    
    -- ข้อมูลพื้นฐาน
    document_type_id INTEGER NOT NULL REFERENCES official_document_types(id) ON DELETE RESTRICT,
    document_number VARCHAR(50), -- เลขที่เอกสาร
    document_year INTEGER, -- ปีของเอกสาร (พ.ศ. หรือ ค.ศ.)
    
    -- ภาษาและการแสดงผล
    language VARCHAR(5) NOT NULL DEFAULT 'th', -- 'th', 'en'
    number_display_format VARCHAR(20) NOT NULL DEFAULT 'thai', -- 'thai', 'arabic'
    
    -- เนื้อหาเอกสาร
    title VARCHAR(500) NOT NULL,
    subject VARCHAR(500), -- เรื่อง
    recipient VARCHAR(500), -- ผู้รับ
    sender VARCHAR(500), -- ผู้ส่ง
    content TEXT NOT NULL, -- เนื้อหาเอกสาร
    
    -- ข้อมูลเพิ่มเติม
    reference_number VARCHAR(100), -- อ้างอิง
    attachment_count INTEGER DEFAULT 0, -- จำนวนเอกสารแนบ
    urgency_level VARCHAR(20) DEFAULT 'normal', -- 'urgent', 'normal', 'low'
    
    -- ข้อมูลที่เกี่ยวข้อง
    student_training_id INTEGER REFERENCES student_trainings(id) ON DELETE SET NULL,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    
    -- ตัวแปรสำหรับเอกสาร (JSON)
    variables JSON, -- ตัวแปรที่ใช้ในเทมเพลต
    
    -- สถานะ
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'pending_approval', 'approved', 'rejected', 'published', 'cancelled'
    
    -- การสร้าง PDF
    pdf_generated BOOLEAN DEFAULT false,
    pdf_path VARCHAR(500), -- path ของไฟล์ PDF
    pdf_filename VARCHAR(255), -- ชื่อไฟล์ PDF
    pdf_size BIGINT, -- ขนาดไฟล์ PDF
    pdf_generated_at TIMESTAMP, -- วันที่สร้าง PDF
    pdf_version INTEGER DEFAULT 1, -- เวอร์ชัน PDF
    
    -- การอนุมัติ
    current_approval_level INTEGER DEFAULT 0,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- ผู้สร้างและแก้ไข
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางการอนุมัติเอกสารทางราชการ
CREATE TABLE IF NOT EXISTS official_document_approvals (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES official_documents(id) ON DELETE CASCADE,
    approval_level INTEGER NOT NULL, -- ระดับการอนุมัติ (1, 2, 3, ...)
    approver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- สถานะการอนุมัติ
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'delegated'
    decision VARCHAR(20), -- 'approve', 'reject', 'request_changes'
    comments TEXT,
    
    -- การมอบหมาย
    delegated_to_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    delegated_at TIMESTAMP,
    
    -- วันที่
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(document_id, approval_level)
);

-- ตารางเทมเพลตเอกสารทางราชการ
CREATE TABLE IF NOT EXISTS official_document_templates (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    
    document_type_id INTEGER NOT NULL REFERENCES official_document_types(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    language VARCHAR(5) NOT NULL, -- 'th', 'en'
    
    -- เทมเพลต HTML/CSS
    template_content TEXT NOT NULL, -- HTML template
    template_css TEXT, -- CSS styles
    
    -- การจัดรูปแบบ
    page_size VARCHAR(20) DEFAULT 'A4', -- 'A4', 'Letter'
    page_orientation VARCHAR(20) DEFAULT 'portrait', -- 'portrait', 'landscape'
    margins JSON DEFAULT '{"top": "2cm", "right": "2cm", "bottom": "2cm", "left": "2cm"}',
    
    -- ตัวแปรที่ใช้ในเทมเพลต
    template_variables JSON, -- รายการตัวแปรที่ใช้ในเทมเพลต
    
    -- การใช้งาน
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    version VARCHAR(20) DEFAULT '1.0',
    
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางการสร้าง PDF
CREATE TABLE IF NOT EXISTS pdf_generation_jobs (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    
    document_id INTEGER NOT NULL REFERENCES official_documents(id) ON DELETE CASCADE,
    
    -- สถานะงาน
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    
    -- การตั้งค่า PDF
    options JSON, -- ตัวเลือกการสร้าง PDF
    
    -- ผลลัพธ์
    output_path VARCHAR(500),
    output_filename VARCHAR(255),
    file_size BIGINT,
    
    -- ข้อผิดพลาด
    error_message TEXT,
    error_details JSON,
    
    -- เวลา
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    processing_time INTEGER, -- เวลาในการประมวลผล (วินาที)
    
    -- ผู้ร้องขอ
    requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางการดาวน์โหลดเอกสาร PDF
CREATE TABLE IF NOT EXISTS official_document_downloads (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES official_documents(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- ข้อมูลการดาวน์โหลด
    download_type VARCHAR(50) DEFAULT 'pdf', -- 'pdf', 'preview'
    ip_address INET,
    user_agent TEXT,
    
    -- สถิติ
    file_size BIGINT,
    download_time DECIMAL(10,3), -- เวลาในการดาวน์โหลด (วินาที)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้าง indexes สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_official_document_types_code ON official_document_types(code);
CREATE INDEX IF NOT EXISTS idx_official_document_types_active ON official_document_types(is_active);

CREATE INDEX IF NOT EXISTS idx_official_documents_type ON official_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_official_documents_status ON official_documents(status);
CREATE INDEX IF NOT EXISTS idx_official_documents_language ON official_documents(language);
CREATE INDEX IF NOT EXISTS idx_official_documents_number ON official_documents(document_number, document_year);
CREATE INDEX IF NOT EXISTS idx_official_documents_student_training ON official_documents(student_training_id);
CREATE INDEX IF NOT EXISTS idx_official_documents_company ON official_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_official_documents_created_by ON official_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_official_documents_approved_by ON official_documents(approved_by);

CREATE INDEX IF NOT EXISTS idx_official_document_approvals_document ON official_document_approvals(document_id);
CREATE INDEX IF NOT EXISTS idx_official_document_approvals_approver ON official_document_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_official_document_approvals_status ON official_document_approvals(status);
CREATE INDEX IF NOT EXISTS idx_official_document_approvals_level ON official_document_approvals(approval_level);

CREATE INDEX IF NOT EXISTS idx_official_document_templates_type ON official_document_templates(document_type_id);
CREATE INDEX IF NOT EXISTS idx_official_document_templates_language ON official_document_templates(language);
CREATE INDEX IF NOT EXISTS idx_official_document_templates_active ON official_document_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_pdf_generation_jobs_document ON pdf_generation_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_pdf_generation_jobs_status ON pdf_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_pdf_generation_jobs_requested_by ON pdf_generation_jobs(requested_by);

CREATE INDEX IF NOT EXISTS idx_official_document_downloads_document ON official_document_downloads(document_id);
CREATE INDEX IF NOT EXISTS idx_official_document_downloads_user ON official_document_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_official_document_downloads_created_at ON official_document_downloads(created_at);

-- สร้าง triggers สำหรับ updated_at
CREATE TRIGGER update_official_document_types_updated_at BEFORE UPDATE ON official_document_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_official_documents_updated_at BEFORE UPDATE ON official_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_official_document_approvals_updated_at BEFORE UPDATE ON official_document_approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_official_document_templates_updated_at BEFORE UPDATE ON official_document_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pdf_generation_jobs_updated_at BEFORE UPDATE ON pdf_generation_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- สร้าง Functions สำหรับการจัดการเลขไทย/อารบิก

-- Function: แปลงเลขอารบิกเป็นเลขไทย
CREATE OR REPLACE FUNCTION arabic_to_thai_number(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
           REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
           input_text, 
           '0', '๐'), '1', '๑'), '2', '๒'), '3', '๓'), '4', '๔'),
           '5', '๕'), '6', '๖'), '7', '๗'), '8', '๘'), '9', '๙');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: แปลงเลขไทยเป็นเลขอารบิก
CREATE OR REPLACE FUNCTION thai_to_arabic_number(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
           REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
           input_text, 
           '๐', '0'), '๑', '1'), '๒', '2'), '๓', '3'), '๔', '4'),
           '๕', '5'), '๖', '6'), '๗', '7'), '๘', '8'), '๙', '9');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: จัดรูปแบบเลขตามภาษา
CREATE OR REPLACE FUNCTION format_number_by_language(
    input_number TEXT,
    target_language VARCHAR(5)
)
RETURNS TEXT AS $$
BEGIN
    IF target_language = 'th' THEN
        RETURN arabic_to_thai_number(input_number);
    ELSE
        RETURN thai_to_arabic_number(input_number);
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: สร้างเลขที่เอกสารอัตโนมัติ
CREATE OR REPLACE FUNCTION generate_document_number(
    p_document_type_code VARCHAR(20),
    p_year INTEGER DEFAULT NULL
)
RETURNS VARCHAR(50) AS $$
DECLARE
    doc_year INTEGER;
    next_number INTEGER;
    formatted_number VARCHAR(50);
BEGIN
    -- ใช้ปีปัจจุบันถ้าไม่ระบุ
    doc_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE) + 543); -- พ.ศ.
    
    -- หาเลขที่ถัดไป
    SELECT COALESCE(MAX(CAST(SUBSTRING(document_number FROM '\d+') AS INTEGER)), 0) + 1
    INTO next_number
    FROM official_documents od
    JOIN official_document_types odt ON od.document_type_id = odt.id
    WHERE odt.code = p_document_type_code
        AND od.document_year = doc_year;
    
    -- สร้างเลขที่เอกสาร รูปแบบ: ประเภท เลขที่/ปี
    formatted_number := p_document_type_code || ' ' || LPAD(next_number::TEXT, 4, '0') || '/' || doc_year;
    
    RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Function: อัพเดทสถานะการอนุมัติ
CREATE OR REPLACE FUNCTION update_document_approval_status()
RETURNS TRIGGER AS $$
DECLARE
    total_levels INTEGER;
    approved_levels INTEGER;
BEGIN
    -- หาจำนวนระดับการอนุมัติทั้งหมด
    SELECT odt.approval_levels
    INTO total_levels
    FROM official_documents od
    JOIN official_document_types odt ON od.document_type_id = odt.id
    WHERE od.id = NEW.document_id;
    
    -- นับจำนวนระดับที่อนุมัติแล้ว
    SELECT COUNT(*)
    INTO approved_levels
    FROM official_document_approvals
    WHERE document_id = NEW.document_id
        AND status = 'approved';
    
    -- อัพเดทสถานะเอกสาร
    IF NEW.status = 'approved' AND approved_levels >= total_levels THEN
        -- อนุมัติครบทุกระดับแล้ว
        UPDATE official_documents
        SET status = 'approved',
            current_approval_level = total_levels,
            approved_by = NEW.approver_id,
            approved_at = NEW.approved_at,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.document_id;
    ELSIF NEW.status = 'rejected' THEN
        -- ถูกปฏิเสธ
        UPDATE official_documents
        SET status = 'rejected',
            rejection_reason = NEW.comments,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.document_id;
    ELSE
        -- อัพเดทระดับการอนุมัติปัจจุบัน
        UPDATE official_documents
        SET current_approval_level = approved_levels,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.document_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_approval_status_trigger
    AFTER INSERT OR UPDATE ON official_document_approvals
    FOR EACH ROW EXECUTE FUNCTION update_document_approval_status();

-- Function: สร้างงาน PDF อัตโนมัติเมื่อเอกสารได้รับอนุมัติ
CREATE OR REPLACE FUNCTION auto_generate_pdf()
RETURNS TRIGGER AS $$
BEGIN
    -- สร้างงาน PDF เมื่อเอกสารได้รับอนุมัติ
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        INSERT INTO pdf_generation_jobs (document_id, requested_by, options)
        VALUES (
            NEW.id,
            NEW.approved_by,
            '{"auto_generated": true, "quality": "high"}'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_pdf_trigger
    AFTER UPDATE ON official_documents
    FOR EACH ROW EXECUTE FUNCTION auto_generate_pdf();

COMMIT;