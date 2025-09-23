// RegisterPersonalSchema.ts
import * as yup from "yup";

export const phoneDigitsOk = (v: unknown) => {
  if (!v) return false;
  const digits = String(v).replace(/\D/g, "");
  return /^0\d{9}$/.test(digits) || /^66\d{9}$/.test(digits);
};

const RegisterPersonalSchema = () => {
  const RegisterPersonalValidationSchema = yup.object({
    // Personal
    name: yup.string().trim().required("กรุณาระบุชื่อจริง"),
    middleName: yup.string().trim().nullable(),
    surname: yup.string().trim().required("กรุณาระบุนามสกุล"),
    studentId: yup.string().required("กรุณาระบุรหัสนักศึกษา"),

    // Academic selections
    facultyId: yup.string().required("กรุณาเลือกคณะ"),

    programId: yup.string().required("กรุณาเลือกสาขา"),

    curriculumId: yup.string().required("กรุณาเลือกหลักสูตร"),

    gpax: yup
      .number()
      .typeError("กรุณาระบุเกรดเฉลี่ยเป็นตัวเลข")
      .min(0, "GPAX ต้องไม่ต่ำกว่า 0.00")
      .max(4, "GPAX ต้องไม่เกิน 4.00")
      .required("กรุณาระบุเกรดเฉลี่ย"),

    // Contact
    phoneNumber: yup
      .string()
      .test("phone", "กรุณาระบุเบอร์โทรศัพท์ให้ถูกต้อง", phoneDigitsOk)
      .required("กรุณาระบุเบอร์โทรศัพท์"),

    email: yup
      .string()
      .email("กรุณาระบุอีเมลให้ถูกต้อง")
      .required("กรุณาระบุอีเมล"),
  });

  return { RegisterPersonalValidationSchema };
};

export default RegisterPersonalSchema;
