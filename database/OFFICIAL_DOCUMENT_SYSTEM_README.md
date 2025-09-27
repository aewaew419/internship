# ระบบเอกสารทางราชการ (Official Document System)

## ภาพรวมระบบ

ระบบเอกสารทางราชการถูกออกแบบมาเพื่อจัดการเอกสารทางการที่ต้องปริ้นเป็น PDF โดยมีเงื่อนไขพิเศษ:
- **เอกสารภาษาไทย**: ใช้เลขไทย (๑, ๒, ๓, ๔, ๕, ๖, ๗, ๘, ๙, ๐)
- **เอกสารภาษาอังกฤษ**: ใช้เลขอารบิก (1, 2, 3, 4, 5, 6, 7, 8, 9, 0)

## 🎯 **ฟีเจอร์หลัก**

### 📄 **การจัดการเอกสารทางราชการ**
- สร้างเอกสารทางราชการตามมาตรฐาน
- รองรับทั้งภาษาไทยและภาษาอังกฤษ
- ระบบเลขที่เอกสารอัตโนมัติ
- การแปลงเลขไทย/อารบิกตามภาษาเอกสาร

### 🔄 **ระบบอนุมัติหลายระดับ**
- การอนุมัติแบบลำดับขั้น
- ติดตามสถานะการอนุมัติ
- การมอบหมายงานอนุมัติ

### 📊 **การสร้าง PDF อัตโนมัติ**
- สร้าง PDF หลังจากได้รับอนุมัติ
- เทมเพลต HTML/CSS สำหรับแต่ละประเภทเอกสาร
- การจัดรูปแบบตามมาตรฐานราชการ

### 📈 **การติดตามและรายงาน**
- สถิติการใช้งานเอกสาร
- รายงานการอนุมัติ
- การดาวน์โหลดและการใช้งาน

## 🏗️ **โครงสร้างฐานข้อมูล**

### ตารางหลัก

#### `official_document_types` - ประเภทเอกสารทางราชการ
```sql
- code: รหัสประเภท (COOP_REQ, STU_REF, STU_CERT, etc.)
- name_th/name_en: ชื่อประเภทเอกสาร
- language_support: ภาษาที่รองรับ (JSON Array)
- number_format: รูปแบบเลขตามภาษา (JSON Object)
- template_th/template_en: path ของเทมเพลต
- approval_levels: จำนวนระดับการอนุมัติ
```

#### `official_documents` - เอกสารทางราชการ
```sql
- document_number: เลขที่เอกสาร
- document_year: ปีของเอกสาร (พ.ศ./ค.ศ.)
- language: ภาษาเอกสาร (th/en)
- number_display_format: รูปแบบการแสดงเลข (thai/arabic)
- title, subject, recipient, sender: ข้อมูลเอกสาร
- content: เนื้อหาเอกสาร
- variables: ตัวแปรสำหรับเทมเพลต (JSON)
- pdf_generated: สถานะการสร้าง PDF
- pdf_path, pdf_filename: ข้อมูลไฟล์ PDF
```

#### `official_document_approvals` - การอนุมัติเอกสาร
```sql
- document_id: รหัสเอกสาร
- approval_level: ระดับการอนุมัติ (1, 2, 3, ...)
- approver_id: ผู้อนุมัติ
- status: สถานะ (pending, approved, rejected)
- decision: การตัดสินใจ (approve, reject, request_changes)
```

### ตารางเสริม

#### `official_document_templates` - เทมเพลตเอกสาร
```sql
- document_type_id: ประเภทเอกสาร
- language: ภาษาเทมเพลต
- template_content: HTML template
- template_css: CSS styles
- template_variables: ตัวแปรที่ใช้ (JSON)
```

#### `pdf_generation_jobs` - งานสร้าง PDF
```sql
- document_id: รหัสเอกสาร
- status: สถานะงาน (pending, processing, completed, failed)
- output_path: path ของไฟล์ PDF
- processing_time: เวลาในการประมวลผล
```

#### `official_document_downloads` - การดาวน์โหลด
```sql
- document_id: รหัสเอกสาร
- user_id: ผู้ดาวน์โหลด
- download_type: ประเภทการดาวน์โหลด (pdf, preview)
- file_size: ขนาดไฟล์
```

## 🚀 **การติดตั้งและใช้งาน**

### ขั้นตอนที่ 1: สร้างระบบเอกสารทางราชการ
```sql
\i database/add-official-document-system.sql
```

### ขั้นตอนที่ 2: เพิ่มข้อมูลตัวอย่าง
```sql
\i database/insert-official-document-sample-data.sql
```

## 📋 **ประเภทเอกสารทางราชการ**

### 1. **COOP_REQ** - หนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน
- รองรับ: ไทย, อังกฤษ
- การอนุมัติ: 2 ระดับ
- เลขไทย: COOP_REQ ๐๐๐๑/๒๕๖๗
- เลขอารบิก: COOP_REQ 0001/2024

### 2. **STU_REF** - หนังสือส่งตัวนักศึกษาเข้าฝึกงาน
- รองรับ: ไทย, อังกฤษ
- การอนุมัติ: 2 ระดับ
- เลขไทย: STU_REF ๐๐๐๑/๒๕๖๗
- เลขอารบิก: STU_REF 0001/2024

### 3. **STU_CERT** - หนังสือรับรองนักศึกษา
- รองรับ: ไทย, อังกฤษ
- การอนุมัติ: 1 ระดับ

### 4. **EVAL_RESULT** - หนังสือแจ้งผลการประเมินการฝึกงาน
- รองรับ: ไทย, อังกฤษ
- การอนุมัติ: 2 ระดับ

### 5. **THANK_YOU** - หนังสือขอบคุณสถานประกอบการ
- รองรับ: ไทย, อังกฤษ
- การอนุมัติ: 1 ระดับ

### 6. **INTERN_CERT** - ใบรับรองการฝึกงาน
- รองรับ: ไทย, อังกฤษ
- การอนุมัติ: 2 ระดับ

## 🔢 **ระบบการแปลงเลข**

### Functions สำหรับการแปลงเลข

#### `arabic_to_thai_number(input_text TEXT)`
แปลงเลขอารบิกเป็นเลขไทย
```sql
SELECT arabic_to_thai_number('12345'); -- ผลลัพธ์: ๑๒๓๔๕
```

#### `thai_to_arabic_number(input_text TEXT)`
แปลงเลขไทยเป็นเลขอารบิก
```sql
SELECT thai_to_arabic_number('๑๒๓๔๕'); -- ผลลัพธ์: 12345
```

#### `format_number_by_language(input_number TEXT, target_language VARCHAR)`
จัดรูปแบบเลขตามภาษา
```sql
SELECT format_number_by_language('2567', 'th'); -- ผลลัพธ์: ๒๕๖๗
SELECT format_number_by_language('๒๕๖๗', 'en'); -- ผลลัพธ์: 2567
```

#### `generate_document_number(document_type_code VARCHAR, year INTEGER)`
สร้างเลขที่เอกสารอัตโนมัติ
```sql
SELECT generate_document_number('COOP_REQ', 2567); 
-- ผลลัพธ์: COOP_REQ 0002/2567
```

## 📊 **การใช้งาน Views**

### 1. ดูสรุปเอกสารทางราชการ
```sql
SELECT * FROM official_documents_summary;
```

### 2. ดูสถานะการอนุมัติ
```sql
SELECT * FROM document_approval_status;
```

### 3. ดูการใช้เลขตามภาษา
```sql
SELECT * FROM documents_by_number_format;
```

## 🔍 **ตัวอย่างการ Query**

### ดูเอกสารที่ใช้เลขไทย
```sql
SELECT 
    document_number,
    title,
    language,
    number_display_format
FROM official_documents 
WHERE number_display_format = 'thai'
ORDER BY created_at DESC;
```

### ดูเอกสารที่รอการอนุมัติ
```sql
SELECT 
    od.document_number,
    od.title,
    od.current_approval_level,
    odt.approval_levels as total_levels,
    od.status
FROM official_documents od
JOIN official_document_types odt ON od.document_type_id = odt.id
WHERE od.status IN ('draft', 'pending_approval')
ORDER BY od.created_at ASC;
```

### ดูสถิติการสร้าง PDF
```sql
SELECT 
    odt.name_th as document_type,
    COUNT(od.id) as total_documents,
    COUNT(CASE WHEN od.pdf_generated THEN 1 END) as pdf_generated,
    ROUND(COUNT(CASE WHEN od.pdf_generated THEN 1 END) * 100.0 / COUNT(od.id), 2) as pdf_rate
FROM official_documents od
JOIN official_document_types odt ON od.document_type_id = odt.id
GROUP BY odt.id, odt.name_th
ORDER BY total_documents DESC;
```

### ดูเอกสารที่ดาวน์โหลดมากที่สุด
```sql
SELECT 
    od.document_number,
    od.title,
    COUNT(odd.id) as download_count,
    SUM(odd.file_size) as total_downloaded_bytes
FROM official_documents od
LEFT JOIN official_document_downloads odd ON od.id = odd.document_id
GROUP BY od.id, od.document_number, od.title
ORDER BY download_count DESC
LIMIT 10;
```

## 🎨 **การจัดการเทมเพลต**

### โครงสร้างเทมเพลต HTML
```html
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>{{title}}</title>
</head>
<body>
    <div class="header">
        <div class="logo">
            <img src="{{university_logo}}" alt="โลโก้" />
        </div>
        <div class="university-info">
            <h1>{{university_name_th}}</h1>
            <h2>{{faculty_name_th}}</h2>
        </div>
    </div>
    
    <div class="document-info">
        <div class="document-number">ที่ {{document_number}}</div>
        <div class="document-date">วันที่ {{document_date_th}}</div>
    </div>
    
    <div class="content">
        <div class="subject"><strong>เรื่อง</strong> {{subject}}</div>
        <div class="recipient"><strong>เรียน</strong> {{recipient}}</div>
        <div class="body">{{content}}</div>
        <div class="signature">{{signature_section}}</div>
    </div>
</body>
</html>
```

### ตัวแปรที่ใช้ในเทมเพลต
```json
{
  "university_name_th": "ชื่อมหาวิทยาลัย",
  "faculty_name_th": "ชื่อคณะ", 
  "department_name_th": "ชื่อภาควิชา",
  "document_number": "เลขที่เอกสาร",
  "document_date_th": "วันที่เอกสาร",
  "subject": "เรื่อง",
  "recipient": "ผู้รับ",
  "student_name_th": "ชื่อนักศึกษา",
  "student_id": "รหัสนักศึกษา",
  "signer_name_th": "ชื่อผู้ลงนาม",
  "signer_position_th": "ตำแหน่งผู้ลงนาม"
}
```

## 🔧 **การจัดการข้อมูล**

### เพิ่มประเภทเอกสารใหม่
```sql
INSERT INTO official_document_types (
    code, name, name_th, name_en, description,
    document_format, language_support, number_format,
    template_th, template_en, approval_levels, created_by
) VALUES (
    'NEW_DOC', 'เอกสารใหม่', 'เอกสารใหม่', 'New Document', 'คำอธิบาย',
    'official', '["th", "en"]', '{"th": "thai", "en": "arabic"}',
    'templates/new_doc_th.html', 'templates/new_doc_en.html', 2, 1
);
```

### สร้างเอกสารใหม่
```sql
INSERT INTO official_documents (
    document_type_id, document_number, document_year,
    language, number_display_format, title, subject,
    recipient, sender, content, variables, created_by
) VALUES (
    1, generate_document_number('COOP_REQ', 2567), 2567,
    'th', 'thai', 'หัวข้อเอกสาร', 'เรื่อง',
    'ผู้รับ', 'ผู้ส่ง', 'เนื้อหาเอกสาร',
    '{"student_name_th": "ชื่อนักศึกษา"}', 1
);
```

## ⚡ **ระบบอัตโนมัติ**

### Triggers ที่ทำงานอัตโนมัติ

#### 1. **อัพเดทสถานะการอนุมัติ**
เมื่อมีการอนุมัติ/ปฏิเสธ จะอัพเดทสถานะเอกสารอัตโนมัติ

#### 2. **สร้าง PDF อัตโนมัติ**
เมื่อเอกสารได้รับอนุมัติครบทุกระดับ จะสร้างงาน PDF อัตโนมัติ

#### 3. **การแปลงเลขอัตโนมัติ**
เลขในเอกสารจะถูกแปลงตามภาษาที่เลือกอัตโนมัติ

## 📈 **การรายงานและสถิติ**

### สถิติการใช้งานตามประเภทเอกสาร
```sql
SELECT 
    odt.name_th,
    COUNT(od.id) as total_docs,
    COUNT(CASE WHEN od.language = 'th' THEN 1 END) as thai_docs,
    COUNT(CASE WHEN od.language = 'en' THEN 1 END) as english_docs,
    COUNT(CASE WHEN od.pdf_generated THEN 1 END) as pdf_generated
FROM official_document_types odt
LEFT JOIN official_documents od ON odt.id = od.document_type_id
GROUP BY odt.id, odt.name_th
ORDER BY total_docs DESC;
```

### สถิติการอนุมัติ
```sql
SELECT 
    DATE_TRUNC('month', approved_at) as month,
    COUNT(*) as approved_documents,
    AVG(EXTRACT(EPOCH FROM (approved_at - created_at))/3600) as avg_approval_hours
FROM official_documents 
WHERE status = 'approved'
GROUP BY DATE_TRUNC('month', approved_at)
ORDER BY month DESC;
```

## ⚠️ **ข้อสำคัญ**

### การใช้เลขไทย/อารบิก
- เอกสารภาษาไทย: ใช้เลขไทย (๐, ๑, ๒, ๓, ๔, ๕, ๖, ๗, ๘, ๙)
- เอกสารภาษาอังกฤษ: ใช้เลขอารบิก (0, 1, 2, 3, 4, 5, 6, 7, 8, 9)
- การแปลงทำอัตโนมัติตาม `number_display_format`

### การจัดการเทมเพลต
- เทมเพลตใช้ HTML/CSS
- ตัวแปรใช้รูปแบบ `{{variable_name}}`
- รองรับการจัดรูปแบบตามมาตรฐานราชการ

### การสร้าง PDF
- PDF สร้างอัตโนมัติหลังการอนุมัติ
- รองรับการตั้งค่าขนาดกระดาษและ margins
- ติดตามสถานะการสร้าง PDF

ระบบเอกสารทางราชการนี้ครอบคลุมการจัดการเอกสารทางการอย่างสมบูรณ์ พร้อมระบบการแปลงเลขไทย/อารบิกตามภาษาเอกสาร!