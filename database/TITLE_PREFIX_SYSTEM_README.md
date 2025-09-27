# ระบบจัดการคำนำหน้าชื่อ (Title/Prefix Management System)

## ภาพรวมระบบ

ระบบจัดการคำนำหน้าชื่อถูกออกแบบมาเพื่อให้ **Super Admin** และ **Admin** สามารถตั้งค่าและจัดการคำนำหน้าชื่อได้อย่างยืดหยุ่น รองรับทั้งภาษาไทยและภาษาอังกฤษ พร้อมระบบจัดการสิทธิ์ตาม Role

## 🎯 **ฟีเจอร์หลัก**

### 📝 **การจัดการคำนำหน้าชื่อ**
- เพิ่ม/ลบ/แก้ไขคำนำหน้าชื่อได้
- รองรับทั้งภาษาไทยและภาษาอังกฤษ
- จัดหมวดหมู่ตามประเภท (ทั่วไป, วิชาการ, ทหาร, ตำรวจ)
- กำหนดเพศที่สามารถใช้ได้

### 🛡️ **ระบบจัดการสิทธิ์ตาม Role**
- กำหนดว่า Role ไหนสามารถใช้คำนำหน้าไหนได้
- ระบบ Checkbox Matrix (Role x Prefix)
- กำหนดคำนำหน้าเริ่มต้นสำหรับแต่ละ Role

### ⚙️ **การตั้งค่าระบบ**
- การตั้งค่าการแสดงผล
- การตั้งค่าสิทธิ์การใช้งาน
- การตั้งค่าภาษาเริ่มต้น

### 📊 **การติดตามและรายงาน**
- สถิติการใช้งานคำนำหน้าชื่อ
- ประวัติการเปลี่ยนแปลง
- รายงานการใช้งานตาม Role

## 🏗️ **โครงสร้างฐานข้อมูล**

### ตารางหลัก

#### `title_prefixes` - คำนำหน้าชื่อ
```sql
- prefix_code: รหัสคำนำหน้า (MR, MRS, DR, PROF)
- prefix_th: คำนำหน้าภาษาไทย (นาย, นาง, ดร., ศ.)
- prefix_en: คำนำหน้าภาษาอังกฤษ (Mr., Mrs., Dr., Prof.)
- category: หมวดหมู่ (general, academic, military, royal, religious)
- gender: เพศ (male, female, unisex, NULL)
- is_active: สถานะใช้งาน
- sort_order: ลำดับการแสดงผล
```

#### `title_prefix_permissions` - สิทธิ์ใช้คำนำหน้าตาม Role
```sql
- prefix_id: รหัสคำนำหน้า
- role_id: รหัส Role
- can_use: สามารถใช้ได้หรือไม่
- is_default_for_role: เป็นค่าเริ่มต้นสำหรับ Role นี้
- conditions: เงื่อนไขพิเศษ (JSON)
```

#### `users` - เพิ่มคอลัมน์ title_prefix_id
```sql
- title_prefix_id: รหัสคำนำหน้าชื่อ (Foreign Key)
```

### ตารางเสริม

#### `title_prefix_history` - ประวัติการเปลี่ยนแปลง
#### `title_prefix_settings` - การตั้งค่าระบบ

## 🚀 **การติดตั้งและใช้งาน**

### ขั้นตอนที่ 1: สร้างระบบคำนำหน้าชื่อ
```sql
\i database/add-title-prefix-system.sql
```

### ขั้นตอนที่ 2: เพิ่มข้อมูลตัวอย่าง
```sql
\i database/insert-title-prefix-sample-data.sql
```

## 📋 **คำนำหน้าชื่อที่มีให้**

### 🏷️ **คำนำหน้าทั่วไป (General)**
- **นาย** (Mr.) - ผู้ชาย
- **นาง** (Mrs.) - ผู้หญิงแต่งงานแล้ว
- **นางสาว** (Miss/Ms.) - ผู้หญิงยังไม่แต่งงาน

### 🎓 **คำนำหน้าทางวิชาการ (Academic)**
- **ดร.** (Dr.) - ดุษฎีบัณฑิต
- **ศ.** (Prof.) - ศาสตราจารย์
- **รศ.** (Assoc. Prof.) - รองศาสตราจารย์
- **ผศ.** (Asst. Prof.) - ผู้ช่วยศาสตราจารย์
- **ศ.ดร.** (Prof. Dr.) - ศาสตราจารย์ ดร.
- **รศ.ดร.** (Assoc. Prof. Dr.) - รองศาสตราจารย์ ดร.
- **ผศ.ดร.** (Asst. Prof. Dr.) - ผู้ช่วยศาสตราจารย์ ดร.

### 🪖 **คำนำหน้าทางทหาร (Military)**
- **ว่าที่ ร.ต.** (2nd Lt.) - ว่าที่ร้อยตรี
- **ร.ต.** (Lt.) - ร้อยตรี
- **ร.ท.** (Capt.) - ร้อยโท
- **ร.ต.** (Maj.) - ร้อยเอก
- **พ.ท.** (Lt. Col.) - พันโท
- **พ.อ.** (Col.) - พันเอก

### 👮 **คำนำหน้าทางตำรวจ (Police)**
- **ร.ต.ต.** (Pol. Lt.) - ร้อยตำรวจตรี
- **ร.ต.ท.** (Pol. Capt.) - ร้อยตำรวจโท
- **ร.ต.ต.** (Pol. Maj.) - ร้อยตำรวจเอก

### 🎖️ **คำนำหน้าพิเศษ (Special)**
- **ว่าที่** (Candidate) - สำหรับนักศึกษาทหาร
- **นร.** (Cadet) - นักเรียนนายร้อย

## 🔐 **การจัดการสิทธิ์ตาม Role**

### Permission Matrix (Role x Prefix)

| Role | นาย | นาง | นางสาว | ดร. | ผศ.ดร. | รศ.ดร. | ว่าที่ | ร.ต. |
|------|-----|-----|--------|-----|--------|--------|-------|------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Staff** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Course Instructor** | ✅ | ✅ | ✅ | ✅ | ✅ (Default) | ✅ | ❌ | ❌ |
| **Supervisor** | ✅ | ✅ | ✅ | ✅ (Default) | ✅ | ✅ | ❌ | ❌ |
| **Committee** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Default) | ❌ | ❌ |
| **Student** | ✅ (Default) | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |

### การกำหนดสิทธิ์เริ่มต้น

#### **Admin** - ใช้ได้ทุกคำนำหน้า
- Default: นาย (Mr.)

#### **Staff** - ใช้ได้คำนำหน้าทั่วไปและทางวิชาการ
- Default: นาย (Mr.)

#### **Course Instructor** - ใช้ได้คำนำหน้าทั่วไปและทางวิชาการ
- Default: ผศ.ดร. (Asst. Prof. Dr.)

#### **Supervisor** - ใช้ได้คำนำหน้าทั่วไปและทางวิชาการ
- Default: ดร. (Dr.)

#### **Committee** - ใช้ได้คำนำหน้าทั่วไปและทางวิชาการ
- Default: รศ.ดร. (Assoc. Prof. Dr.)

#### **Student** - ใช้ได้คำนำหน้าทั่วไปและทหาร (สำหรับนักศึกษาทหาร)
- Default: นาย (Mr.)
- พิเศษ: ว่าที่, ร.ต., นร. (สำหรับนักศึกษาทหาร)

## 🛠️ **Functions สำหรับการจัดการ**

### ดึงคำนำหน้าที่ Role สามารถใช้ได้
```sql
SELECT * FROM get_available_prefixes_for_role(role_id);
-- ผลลัพธ์: รายการคำนำหน้าที่ role นั้นใช้ได้
```

### ตรวจสอบสิทธิ์ใช้คำนำหน้า
```sql
SELECT can_user_use_prefix(user_id, prefix_id);
-- ผลลัพธ์: true/false
```

### กำหนดสิทธิ์ให้ Role
```sql
SELECT set_prefix_permission_for_role(prefix_id, role_id, can_use, is_default, assigned_by);
-- ผลลัพธ์: true/false
```

### ดึงชื่อเต็มพร้อมคำนำหน้า
```sql
SELECT get_full_name_with_prefix(user_id, 'th'); -- ภาษาไทย
SELECT get_full_name_with_prefix(user_id, 'en'); -- ภาษาอังกฤษ
-- ผลลัพธ์: "ดร. สมชาย ใจดี" หรือ "Dr. Somchai Jaidee"
```

### การตั้งค่าระบบ
```sql
SELECT get_title_prefix_setting('require_title_prefix');
SELECT update_title_prefix_setting('show_prefix_in_list', 'true', admin_id);
```

## 📊 **Views สำหรับการใช้งาน**

### 1. รายการคำนำหน้าพร้อมสิทธิ์
```sql
SELECT * FROM title_prefix_with_permissions;
-- แสดงคำนำหน้าทั้งหมดพร้อมจำนวน Role ที่ใช้ได้
```

### 2. ผู้ใช้พร้อมคำนำหน้าชื่อ
```sql
SELECT * FROM users_with_title_prefix;
-- แสดงผู้ใช้พร้อมชื่อเต็มที่มีคำนำหน้า
```

### 3. สถิติการใช้คำนำหน้าชื่อ
```sql
SELECT * FROM title_prefix_usage_stats;
-- แสดงสถิติการใช้งานแต่ละคำนำหน้า
```

### 4. Permission Matrix
```sql
SELECT * FROM title_prefix_permission_matrix;
-- แสดง Matrix ความสัมพันธ์ Role x Prefix
```

## ⚙️ **การตั้งค่าระบบ**

### การตั้งค่าทั่วไป
- `require_title_prefix` - บังคับใช้คำนำหน้าชื่อ (false)
- `default_prefix_for_new_users` - คำนำหน้าเริ่มต้นสำหรับผู้ใช้ใหม่
- `allow_custom_prefix` - อนุญาตคำนำหน้าชื่อกำหนดเอง (false)

### การตั้งค่าการแสดงผล
- `show_prefix_in_list` - แสดงคำนำหน้าในรายชื่อผู้ใช้ (true)
- `prefix_display_format` - รูปแบบการแสดง (full, short, code)
- `default_language_for_prefix` - ภาษาเริ่มต้น (th, en, auto)

### การตั้งค่าสิทธิ์
- `auto_assign_prefix_by_role` - กำหนดคำนำหน้าอัตโนมัติตาม Role (false)
- `allow_prefix_change` - อนุญาตเปลี่ยนคำนำหน้าชื่อ (true)
- `require_approval_for_change` - ต้องอนุมัติการเปลี่ยนแปลง (false)

## 🔍 **ตัวอย่างการใช้งาน**

### ดูคำนำหน้าตามหมวดหมู่
```sql
SELECT 
    category,
    COUNT(*) as prefix_count,
    STRING_AGG(prefix_th, ', ' ORDER BY sort_order) as prefixes
FROM title_prefixes 
WHERE is_active = true
GROUP BY category
ORDER BY category;
```

### ดูผู้ใช้ที่มีคำนำหน้าทางวิชาการ
```sql
SELECT 
    uwtp.full_name_th,
    uwtp.email,
    tp.category
FROM users_with_title_prefix uwtp
JOIN title_prefixes tp ON uwtp.prefix_th = tp.prefix_th
WHERE tp.category = 'academic'
    AND uwtp.prefix_th IS NOT NULL;
```

### ดูสถิติการใช้งานตาม Role
```sql
SELECT 
    r.name_th as role_name,
    COUNT(u.id) as user_count,
    COUNT(CASE WHEN u.title_prefix_id IS NOT NULL THEN 1 END) as users_with_prefix,
    ROUND(COUNT(CASE WHEN u.title_prefix_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(u.id), 2) as prefix_usage_rate
FROM roles r
JOIN user_roles ur ON r.id = ur.role_id AND ur.is_active = true
JOIN users u ON ur.user_id = u.id
GROUP BY r.id, r.name_th
ORDER BY prefix_usage_rate DESC;
```

## 🔧 **การจัดการข้อมูล**

### เพิ่มคำนำหน้าใหม่
```sql
INSERT INTO title_prefixes (
    prefix_code, prefix_th, prefix_en, category, gender, 
    description, sort_order, created_by
) VALUES (
    'NEW_PREFIX', 'คำนำหน้าใหม่', 'New Prefix', 'general', 'unisex',
    'คำอธิบาย', 100, 1
);
```

### กำหนดสิทธิ์ให้ Role
```sql
-- อนุญาตให้ Student ใช้คำนำหน้าใหม่
SELECT set_prefix_permission_for_role(
    (SELECT id FROM title_prefixes WHERE prefix_code = 'NEW_PREFIX'),
    (SELECT id FROM roles WHERE name = 'student'),
    true, -- can_use
    false, -- is_default
    1 -- assigned_by
);
```

### อัพเดทคำนำหน้าของผู้ใช้
```sql
UPDATE users 
SET title_prefix_id = (
    SELECT id FROM title_prefixes WHERE prefix_code = 'DR'
)
WHERE id = 1;
```

## 🎯 **การใช้งานใน UI (ตามธีมปัจจุบัน)**

### หน้า Title Prefix Management
```
┌─────────────────────────────────────────────────────────────┐
│ Title Prefix Management                                     │
├─────────────────────────────────────────────────────────────┤
│ Category: [All ▼] Gender: [All ▼] Status: [Active ▼]      │
├─────────────────────────────────────────────────────────────┤
│ Code    │ Thai    │ English   │ Category  │ Gender │ Actions│
├─────────┼─────────┼───────────┼───────────┼────────┼────────┤
│ MR      │ นาย     │ Mr.       │ General   │ Male   │ [Edit] │
│ MRS     │ นาง     │ Mrs.      │ General   │ Female │ [Edit] │
│ DR      │ ดร.     │ Dr.       │ Academic  │ Unisex │ [Edit] │
│ PROF_DR │ ศ.ดร.   │ Prof. Dr. │ Academic  │ Unisex │ [Edit] │
└─────────────────────────────────────────────────────────────┘
```

### หน้า Role Permission Matrix
```
┌─────────────────────────────────────────────────────────────┐
│ Title Prefix Permissions                                    │
├─────────────────────────────────────────────────────────────┤
│           │ นาย │ นาง │นางสาว│ ดร. │ผศ.ดร.│รศ.ดร.│ว่าที่│
├───────────┼─────┼─────┼──────┼─────┼──────┼──────┼──────┤
│ Admin     │ ✅  │ ✅  │  ✅  │ ✅  │  ✅  │  ✅  │  ✅  │
│ Staff     │ ✅  │ ✅  │  ✅  │ ✅  │  ✅  │  ✅  │  ❌  │
│ Instructor│ ✅  │ ✅  │  ✅  │ ✅  │  🔵  │  ✅  │  ❌  │
│ Student   │ 🔵  │ ✅  │  ✅  │ ❌  │  ❌  │  ❌  │  ✅  │
└─────────────────────────────────────────────────────────────┘
🔵 = Default for Role
```

### หน้า User Profile
```
┌─────────────────────────────────────────────────────────────┐
│ User Profile                                                │
├─────────────────────────────────────────────────────────────┤
│ Title Prefix: [ดร. ▼]                                      │
│ First Name:   [สมชาย                    ]                  │
│ Last Name:    [ใจดี                     ]                  │
│                                                             │
│ Full Name Preview:                                          │
│ Thai:    ดร. สมชาย ใจดี                                    │
│ English: Dr. Somchai Jaidee                                 │
└─────────────────────────────────────────────────────────────┘
```

## 📈 **การรายงานและสถิติ**

### สถิติการใช้งานคำนำหน้าชื่อ
```sql
-- Top 5 คำนำหน้าที่ใช้มากที่สุด
SELECT 
    prefix_th,
    user_count,
    usage_percentage || '%' as percentage
FROM title_prefix_usage_stats
ORDER BY user_count DESC
LIMIT 5;
```

### การใช้งานตามหมวดหมู่
```sql
SELECT 
    tp.category,
    COUNT(DISTINCT tp.id) as prefix_count,
    COUNT(u.id) as user_count
FROM title_prefixes tp
LEFT JOIN users u ON tp.id = u.title_prefix_id
WHERE tp.is_active = true
GROUP BY tp.category
ORDER BY user_count DESC;
```

ระบบจัดการคำนำหน้าชื่อนี้ให้ Super Admin และ Admin จัดการคำนำหน้าชื่อได้อย่างยืดหยุ่น พร้อมระบบสิทธิ์ที่ละเอียดและครอบคลุม!