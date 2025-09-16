// RegisterCoopSchema.ts
import * as yup from "yup";
import dayjs from "dayjs";

const BUSINESS_TYPES = [
  "กิจการเจ้าของคนเดียว",
  "ห้างหุ้นส่วนสามัญ",
  "ห้างหุ้นส่วนจำกัด",
  "บริษัทจำกัด",
  "บริษัทมหาชนจำกัด",
  "องค์กรธุรกิจจัดตั้งหรือจดทะเบียนภายใต้กฎหมายเฉพาะ",
  "สำนักงานสาขา",
  "สำนักงานผู้แทน และสำนักงานภูมิภาค",
];
export const phoneDigitsOk = (v: unknown) => {
  if (!v) return false;
  const digits = String(v).replace(/\D/g, "");
  return /^0\d{9}$/.test(digits) || /^66\d{9}$/.test(digits);
};

const RegisterCoopSchema = () => {
  const RegisterCoopValidationSchema = yup.object({
    // Header selections
    document_language: yup
      .string()
      .oneOf(["th", "en"], "กรุณาเลือกภาษาเอกสาร")
      .required("กรุณาเลือกภาษาเอกสาร"),

    year: yup.string().required("กรุณาเลือกปีการศึกษา"),

    semesterm: yup.string().required("กรุณาเลือกภาคการศึกษา"),

    course_section_id: yup.string().required("กรุณาเลือกประเภทวิชา/กลุ่ม"),

    // Company info
    company_register_number: yup
      .string()
      .trim()
      .min(5, "เลขทะเบียนบริษัทไม่ถูกต้อง")
      .required("กรุณาระบุเลขทะเบียนบริษัท"),

    company_name_th: yup.string().trim().required("กรุณาระบุชื่อบริษัท"),

    company_name_en: yup.string().trim().nullable(),

    company_phone_number: yup
      .string()
      .test("phone", "กรุณาระบุเบอร์โทรบริษัทให้ถูกต้อง", phoneDigitsOk)
      .required("กรุณาระบุเบอร์โทรบริษัท"),

    company_type: yup
      .string()
      .oneOf(BUSINESS_TYPES as [string, ...string[]], "กรุณาเลือกประเภทกิจการ")
      .required("กรุณาเลือกประเภทกิจการ"),

    company_email: yup
      .string()
      .email("กรุณาระบุอีเมลบริษัทให้ถูกต้อง")
      .required("กรุณาระบุอีเมลบริษัท"),

    company_address: yup.string().trim().required("กรุณาระบุที่อยู่บริษัท"),

    company_map: yup
      .string()
      .url("กรุณาระบุลิงก์แผนที่ให้ถูกต้อง")
      .required("กรุณาระบุลิงก์แผนที่"),

    // Dates
    start_date: yup
      .mixed()
      .test("required", "กรุณาเลือกวันที่เริ่มงาน", (v) => !!v)
      .test("valid", "รูปแบบวันที่เริ่มงานไม่ถูกต้อง", (v) =>
        v ? dayjs(v as any).isValid() : false
      ),

    end_date: yup
      .mixed()
      .test("required", "กรุณาเลือกวันที่สิ้นสุดงาน", (v) => !!v)
      .test("valid", "รูปแบบวันที่สิ้นสุดงานไม่ถูกต้อง", (v) =>
        v ? dayjs(v as any).isValid() : false
      ),
    // Job detail
    coordinator: yup.string().trim().required("กรุณาระบุชื่อผู้รับการติดต่อ"),

    coordinator_phone_number: yup
      .string()
      .test("phone", "กรุณาระบุเบอร์ติดต่อให้ถูกต้อง", phoneDigitsOk)
      .required("กรุณาระบุเบอร์ติดต่อ"),

    coordinator_email: yup
      .string()
      .email("กรุณาระบุอีเมลให้ถูกต้อง")
      .required("กรุณาระบุอีเมล"),

    department: yup.string().trim().required("กรุณาระบุแผนกงาน"),

    position: yup.string().trim().required("กรุณาระบุตำแหน่งงาน"),

    job_description: yup
      .string()
      .trim()
      .min(10, "กรุณาระบุรายละเอียดงานอย่างน้อย 10 ตัวอักษร")
      .required("กรุณาระบุรายละเอียดงาน"),

    supervisor: yup.string().trim().required("กรุณาระบุหัวหน้างาน"),

    supervisor_phone_number: yup
      .string()
      .test("phone", "กรุณาระบุเบอร์ติดต่อให้ถูกต้อง", phoneDigitsOk)
      .required("กรุณาระบุเบอร์ติดต่อ"),

    supervisor_email: yup
      .string()
      .email("กรุณาระบุอีเมลให้ถูกต้อง")
      .required("กรุณาระบุอีเมล"),
  });

  return { RegisterCoopValidationSchema };
};

export default RegisterCoopSchema;
