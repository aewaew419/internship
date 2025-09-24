-- Database Performance Optimization Script
-- Student Internship Management System

-- Indexes for Students table
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_faculty_major ON students(faculty_id, major_id);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at);
CREATE INDEX IF NOT EXISTS idx_students_gpax ON students(gpax);

-- Indexes for Companies table
CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(company_type);
CREATE INDEX IF NOT EXISTS idx_companies_name_en ON companies(company_name_en);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);

-- Indexes for Student Enrollments
CREATE INDEX IF NOT EXISTS idx_student_enrolls_student_id ON student_enrolls(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrolls_course_section ON student_enrolls(course_section_id);
CREATE INDEX IF NOT EXISTS idx_student_enrolls_status ON student_enrolls(status);

-- Indexes for Student Trainings
CREATE INDEX IF NOT EXISTS idx_student_trainings_enroll_id ON student_trainings(student_enroll_id);
CREATE INDEX IF NOT EXISTS idx_student_trainings_company_id ON student_trainings(company_id);
CREATE INDEX IF NOT EXISTS idx_student_trainings_dates ON student_trainings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_student_trainings_created_at ON student_trainings(created_at);

-- Indexes for Internship Approvals
CREATE INDEX IF NOT EXISTS idx_internship_approvals_student_enroll ON internship_approvals(student_enroll_id);
CREATE INDEX IF NOT EXISTS idx_internship_approvals_status ON internship_approvals(status);
CREATE INDEX IF NOT EXISTS idx_internship_approvals_advisor ON internship_approvals(advisor_id);
CREATE INDEX IF NOT EXISTS idx_internship_approvals_created_at ON internship_approvals(created_at);
CREATE INDEX IF NOT EXISTS idx_internship_approvals_approved_at ON internship_approvals(advisor_approved_at);

-- Indexes for Evaluation Status Trackers
CREATE INDEX IF NOT EXISTS idx_evaluation_trackers_training_id ON evaluation_status_trackers(student_training_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_trackers_status ON evaluation_status_trackers(status);
CREATE INDEX IF NOT EXISTS idx_evaluation_trackers_type ON evaluation_status_trackers(evaluation_type);
CREATE INDEX IF NOT EXISTS idx_evaluation_trackers_evaluator ON evaluation_status_trackers(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_trackers_due_date ON evaluation_status_trackers(due_date);
CREATE INDEX IF NOT EXISTS idx_evaluation_trackers_completed_at ON evaluation_status_trackers(completed_at);

-- Indexes for Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Indexes for Activity Logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON activity_logs(user_id, created_at);

-- Indexes for Security Logs
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON security_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address ON security_logs(ip_address);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_students_faculty_program_major ON students(faculty_id, program_id, major_id);
CREATE INDEX IF NOT EXISTS idx_trainings_company_dates ON student_trainings(company_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_approvals_advisor_status ON internship_approvals(advisor_id, status);
CREATE INDEX IF NOT EXISTS idx_evaluations_status_due ON evaluation_status_trackers(status, due_date);

-- Optimize table statistics
ANALYZE TABLE students;
ANALYZE TABLE companies;
ANALYZE TABLE student_enrolls;
ANALYZE TABLE student_trainings;
ANALYZE TABLE internship_approvals;
ANALYZE TABLE evaluation_status_trackers;
ANALYZE TABLE notifications;
ANALYZE TABLE activity_logs;
ANALYZE TABLE security_logs;

-- Performance tuning queries
-- These are example queries that can be used to monitor performance

-- Query to check index usage
-- SELECT 
--     TABLE_NAME,
--     INDEX_NAME,
--     CARDINALITY,
--     SUB_PART,
--     PACKED,
--     NULLABLE,
--     INDEX_TYPE
-- FROM information_schema.STATISTICS 
-- WHERE TABLE_SCHEMA = DATABASE()
-- ORDER BY TABLE_NAME, INDEX_NAME;

-- Query to check slow queries (requires slow query log enabled)
-- SELECT 
--     query_time,
--     lock_time,
--     rows_sent,
--     rows_examined,
--     sql_text
-- FROM mysql.slow_log 
-- ORDER BY query_time DESC 
-- LIMIT 10;

-- Query to check table sizes
-- SELECT 
--     TABLE_NAME,
--     ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS 'Size (MB)',
--     TABLE_ROWS
-- FROM information_schema.TABLES 
-- WHERE TABLE_SCHEMA = DATABASE()
-- ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;