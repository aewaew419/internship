-- Simple authentication test
-- Check if user exists and password matches
SELECT 
    student_id,
    email,
    full_name,
    role,
    CASE 
        WHEN password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' THEN 'password123'
        ELSE 'invalid'
    END as password_check
FROM users 
WHERE email = 'admin@test.com' AND is_active = true;