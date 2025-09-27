-- Add new tables for additional flows
-- Run this after the main database initialization

-- Document Management System (Yellow Flow)
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    document_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    version INTEGER DEFAULT 1,
    student_training_id INTEGER REFERENCES student_trainings(id) ON DELETE SET NULL,
    uploaded_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    approved_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    due_date TIMESTAMP,
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_approvals (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    approver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    comments TEXT,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_comments (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    document_type VARCHAR(50) NOT NULL,
    template_path VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Advanced Evaluation System (Orange Flow)
CREATE TABLE IF NOT EXISTS evaluation_forms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    form_type VARCHAR(50) NOT NULL,
    questions JSON NOT NULL,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evaluation_submissions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES evaluation_forms(id) ON DELETE CASCADE,
    student_training_id INTEGER NOT NULL REFERENCES student_trainings(id) ON DELETE CASCADE,
    evaluator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answers JSON NOT NULL,
    total_score DECIMAL(5,2) DEFAULT 0,
    max_score DECIMAL(5,2) DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    comments TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evaluation_criteria (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    weight DECIMAL(3,2) NOT NULL,
    min_score DECIMAL(3,2) DEFAULT 0,
    max_score DECIMAL(3,2) DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evaluation_reports (
    id SERIAL PRIMARY KEY,
    student_training_id INTEGER NOT NULL REFERENCES student_trainings(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL,
    data JSON NOT NULL,
    generated_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schedule & Notification System (Green Flow)
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    schedule_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    location VARCHAR(255),
    is_all_day BOOLEAN DEFAULT false,
    recurrence_type VARCHAR(50) DEFAULT 'none',
    recurrence_end TIMESTAMP,
    student_training_id INTEGER REFERENCES student_trainings(id) ON DELETE SET NULL,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedule_participants (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(schedule_id, user_id)
);

CREATE TABLE IF NOT EXISTS schedule_notifications (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notify_before INTEGER NOT NULL,
    notify_at TIMESTAMP NOT NULL,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    appointment_date TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    student_training_id INTEGER REFERENCES student_trainings(id) ON DELETE SET NULL,
    requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calendars (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3498db',
    is_public BOOLEAN DEFAULT false,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calendar_schedules (
    calendar_id INTEGER NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (calendar_id, schedule_id)
);

-- Analytics & Reporting System (Purple Flow)
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL,
    format VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    parameters JSON,
    file_path VARCHAR(500),
    file_size BIGINT,
    generated_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generated_at TIMESTAMP,
    expires_at TIMESTAMP,
    download_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout JSON NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id SERIAL PRIMARY KEY,
    dashboard_id INTEGER NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    widget_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    position JSON NOT NULL,
    config JSON,
    data_source VARCHAR(255),
    refresh_rate INTEGER DEFAULT 300,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS metrics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    metric_type VARCHAR(50) NOT NULL,
    unit VARCHAR(50),
    query TEXT,
    config JSON,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS metric_values (
    id SERIAL PRIMARY KEY,
    metric_id INTEGER NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
    value DECIMAL(15,4) NOT NULL,
    labels JSON,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INTEGER,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    properties JSON,
    timestamp TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS export_jobs (
    id SERIAL PRIMARY KEY,
    job_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    parameters JSON,
    file_path VARCHAR(500),
    file_size BIGINT,
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_student_training ON documents(student_training_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by_id);

CREATE INDEX IF NOT EXISTS idx_schedules_type ON schedules(schedule_type);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);
CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON schedules(start_time);
CREATE INDEX IF NOT EXISTS idx_schedules_created_by ON schedules(created_by);

CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports(generated_by);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_entity_type ON analytics(entity_type);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);

-- Create updated_at triggers for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to new tables
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_approvals_updated_at BEFORE UPDATE ON document_approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_comments_updated_at BEFORE UPDATE ON document_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON document_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluation_forms_updated_at BEFORE UPDATE ON evaluation_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluation_submissions_updated_at BEFORE UPDATE ON evaluation_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluation_criteria_updated_at BEFORE UPDATE ON evaluation_criteria FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluation_reports_updated_at BEFORE UPDATE ON evaluation_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedule_participants_updated_at BEFORE UPDATE ON schedule_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedule_notifications_updated_at BEFORE UPDATE ON schedule_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendars_updated_at BEFORE UPDATE ON calendars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dashboards_updated_at BEFORE UPDATE ON dashboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dashboard_widgets_updated_at BEFORE UPDATE ON dashboard_widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_metrics_updated_at BEFORE UPDATE ON metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_export_jobs_updated_at BEFORE UPDATE ON export_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample document templates
INSERT INTO document_templates (name, description, document_type, template_path, is_active) VALUES
('หนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน (ไทย)', 'เอกสารขอความอนุเคราะห์จากบริษัทให้รับนักศึกษาเข้าฝึกงาน', 'application', 'templates/coop_request_th.html', true),
('Cooperative Education Request Letter (English)', 'Request letter for student internship placement', 'application', 'templates/coop_request_en.html', true),
('หนังสือส่งตัวนักศึกษาเข้าฝึกงาน (ไทย)', 'เอกสารส่งตัวนักศึกษาไปยังบริษัท', 'referral', 'templates/referral_th.html', true),
('Student Referral Letter (English)', 'Student referral letter to company', 'referral', 'templates/referral_en.html', true),
('หนังสือรับรองนักศึกษา (ไทย)', 'เอกสารรับรองความเป็นนักศึกษา', 'recommendation', 'templates/recommendation_th.html', true),
('Student Recommendation Letter (English)', 'Student recommendation and certification letter', 'recommendation', 'templates/recommendation_en.html', true),
('หนังสือยืนยันการรับเข้าฝึกงาน (ไทย)', 'เอกสารยืนยันการรับนักศึกษาเข้าฝึกงาน', 'certificate', 'templates/acceptance_th.html', true),
('Internship Acceptance Letter (English)', 'Internship acceptance confirmation letter', 'certificate', 'templates/acceptance_en.html', true);

-- Insert sample evaluation criteria
INSERT INTO evaluation_criteria (name, description, category, weight, min_score, max_score, is_active) VALUES
('ความรับผิดชอบ', 'ความรับผิดชอบในการทำงาน', 'work_attitude', 0.20, 1, 5, true),
('การทำงานเป็นทีม', 'ความสามารถในการทำงานร่วมกับผู้อื่น', 'teamwork', 0.15, 1, 5, true),
('ทักษะเทคนิค', 'ความสามารถทางเทคนิคในงานที่ได้รับมอบหมาย', 'technical_skills', 0.25, 1, 5, true),
('การสื่อสาร', 'ความสามารถในการสื่อสารและนำเสนอ', 'communication', 0.15, 1, 5, true),
('การเรียนรู้', 'ความสามารถในการเรียนรู้สิ่งใหม่', 'learning', 0.15, 1, 5, true),
('การแก้ปัญหา', 'ความสามารถในการแก้ไขปัญหา', 'problem_solving', 0.10, 1, 5, true);

-- Insert sample metrics
INSERT INTO metrics (name, display_name, description, metric_type, unit, is_active) VALUES
('total_students', 'จำนวนนักศึกษาทั้งหมด', 'จำนวนนักศึกษาทั้งหมดในระบบ', 'gauge', 'คน', true),
('active_internships', 'การฝึกงานที่กำลังดำเนินการ', 'จำนวนการฝึkงานที่กำลังดำเนินการอยู่', 'gauge', 'รายการ', true),
('completed_evaluations', 'การประเมินที่เสร็จสิ้น', 'จำนวนการประเมินที่เสร็จสิ้นแล้ว', 'counter', 'รายการ', true),
('average_evaluation_score', 'คะแนนประเมินเฉลี่ย', 'คะแนนการประเมินเฉลี่ยของนักศึกษา', 'gauge', 'คะแนน', true),
('document_approvals_pending', 'เอกสารรอการอนุมัติ', 'จำนวนเอกสารที่รอการอนุมัติ', 'gauge', 'ฉบับ', true);

-- Create sample dashboard for admin
INSERT INTO dashboards (name, description, layout, is_default, is_public, owner_id) VALUES
('Admin Dashboard', 'แดชบอร์ดหลักสำหรับผู้ดูแลระบบ', 
'{"widgets": [{"id": "students_overview", "type": "chart", "position": {"x": 0, "y": 0, "w": 6, "h": 4}}, {"id": "internships_status", "type": "pie", "position": {"x": 6, "y": 0, "w": 6, "h": 4}}]}', 
true, false, 1);

-- Insert sample dashboard widgets
INSERT INTO dashboard_widgets (dashboard_id, widget_type, title, position, config, data_source, refresh_rate, is_visible) VALUES
(1, 'chart', 'Student Overview', '{"x": 0, "y": 0, "w": 6, "h": 4}', '{"chart_type": "line", "time_range": "30d"}', 'total_students', 300, true),
(1, 'pie', 'Internship Status', '{"x": 6, "y": 0, "w": 6, "h": 4}', '{"show_legend": true}', 'active_internships', 300, true),
(1, 'gauge', 'Average Score', '{"x": 0, "y": 4, "w": 4, "h": 3}', '{"min": 0, "max": 5}', 'average_evaluation_score', 300, true),
(1, 'counter', 'Pending Approvals', '{"x": 4, "y": 4, "w": 4, "h": 3}', '{"show_trend": true}', 'document_approvals_pending', 60, true);

COMMIT;