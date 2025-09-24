// Thai validation messages for authentication forms
export const VALIDATION_MESSAGES = {
  // Student ID validation messages
  STUDENT_ID: {
    REQUIRED: "กรุณากรอกรหัสนักศึกษา",
    INVALID_FORMAT: "รหัสนักศึกษาต้องเป็นตัวเลข 8-10 หลัก",
    NUMERIC_ONLY: "รหัสนักศึกษาต้องเป็นตัวเลขเท่านั้น",
    TOO_SHORT: "รหัสนักศึกษาต้องมีอย่างน้อย 8 หลัก",
    TOO_LONG: "รหัสนักศึกษาต้องไม่เกิน 10 หลัก",
    NOT_FOUND: "ไม่พบรหัสนักศึกษานี้ในระบบ",
    ALREADY_EXISTS: "รหัสนักศึกษานี้ถูกใช้งานแล้ว",
  },

  // Password validation messages
  PASSWORD: {
    REQUIRED: "กรุณากรอกรหัสผ่าน",
    TOO_SHORT: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
    TOO_LONG: "รหัสผ่านต้องไม่เกิน 128 ตัวอักษร",
    WEAK: "รหัสผ่านควรมีทั้งตัวอักษรและตัวเลข",
    MISMATCH: "รหัสผ่านไม่ตรงกัน",
    INCORRECT: "รหัsผ่านไม่ถูกต้อง",
  },

  // Email validation messages
  EMAIL: {
    REQUIRED: "กรุณากรอกอีเมล",
    INVALID_FORMAT: "รูปแบบอีเมลไม่ถูกต้อง",
    ALREADY_EXISTS: "อีเมลนี้ถูกใช้งานแล้ว",
    NOT_FOUND: "ไม่พบอีเมลนี้ในระบบ",
  },

  // Name validation messages
  NAME: {
    FIRST_NAME_REQUIRED: "กรุณากรอกชื่อ",
    LAST_NAME_REQUIRED: "กรุณากรอกนามสกุล",
    INVALID_CHARACTERS: "ชื่อและนามสกุลต้องเป็นตัวอักษรเท่านั้น",
    TOO_SHORT: "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร",
    TOO_LONG: "ชื่อต้องไม่เกิน 50 ตัวอักษร",
  },

  // General form validation messages
  FORM: {
    REQUIRED_FIELD: "กรุณากรอกข้อมูลในช่องนี้",
    INVALID_INPUT: "ข้อมูลที่กรอกไม่ถูกต้อง",
    SUBMISSION_ERROR: "เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง",
    NETWORK_ERROR: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
  },

  // Authentication error messages
  AUTH: {
    INVALID_CREDENTIALS: "รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง",
    ACCOUNT_LOCKED: "บัญชีของคุณถูกล็อค กรุณาติดต่อผู้ดูแลระบบ",
    ACCOUNT_DISABLED: "บัญชีของคุณถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ",
    SESSION_EXPIRED: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
    UNAUTHORIZED: "ไม่มีสิทธิ์เข้าถึงระบบ",
    FORBIDDEN: "ไม่อนุญาตให้เข้าถึงหน้านี้",
    TOO_MANY_ATTEMPTS: "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอ {minutes} นาที",
    SERVER_ERROR: "เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง",
  },

  // Network and connectivity messages
  NETWORK: {
    OFFLINE: "ไม่มีการเชื่อมต่ออินเทอร์เน็ต",
    TIMEOUT: "การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง",
    CONNECTION_ERROR: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
    RETRY_MESSAGE: "กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง",
  },

  // Success messages
  SUCCESS: {
    LOGIN: "เข้าสู่ระบบสำเร็จ",
    REGISTRATION: "สมัครสมาชิกสำเร็จ",
    PASSWORD_RESET_SENT: "ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว",
    PASSWORD_RESET: "เปลี่ยนรหัสผ่านสำเร็จ",
    PROFILE_UPDATED: "อัปเดตข้อมูลส่วนตัวสำเร็จ",
  },

  // Loading messages
  LOADING: {
    SIGNING_IN: "กำลังเข้าสู่ระบบ...",
    REGISTERING: "กำลังสมัครสมาชิก...",
    VALIDATING: "กำลังตรวจสอบข้อมูล...",
    SENDING_EMAIL: "กำลังส่งอีเมล...",
    RESETTING_PASSWORD: "กำลังรีเซ็ตรหัสผ่าน...",
  },
} as const;

// Helper function to get error message by code
export function getErrorMessage(category: keyof typeof VALIDATION_MESSAGES, key: string, params?: Record<string, string | number>): string {
  const categoryMessages = VALIDATION_MESSAGES[category] as Record<string, string>;
  let message = categoryMessages[key] || VALIDATION_MESSAGES.FORM.INVALID_INPUT;
  
  // Replace parameters in message
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      message = message.replace(`{${param}}`, String(value));
    });
  }
  
  return message;
}

// Helper function to map API error codes to Thai messages
export function mapApiErrorToMessage(error: any): string {
  if (!error) return VALIDATION_MESSAGES.FORM.SUBMISSION_ERROR;
  
  const status = error.status || error.response?.status;
  const code = error.code || error.response?.data?.code;
  
  switch (status) {
    case 401:
      return VALIDATION_MESSAGES.AUTH.INVALID_CREDENTIALS;
    case 403:
      return VALIDATION_MESSAGES.AUTH.UNAUTHORIZED;
    case 422:
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (errors.student_id) return VALIDATION_MESSAGES.STUDENT_ID.INVALID_FORMAT;
        if (errors.email) return VALIDATION_MESSAGES.EMAIL.INVALID_FORMAT;
        if (errors.password) return VALIDATION_MESSAGES.PASSWORD.TOO_SHORT;
      }
      return VALIDATION_MESSAGES.FORM.INVALID_INPUT;
    case 429:
      return VALIDATION_MESSAGES.AUTH.TOO_MANY_ATTEMPTS.replace('{minutes}', '5');
    case 500:
    case 502:
    case 503:
      return VALIDATION_MESSAGES.AUTH.SERVER_ERROR;
    default:
      if (code === 'NETWORK_ERROR' || !navigator.onLine) {
        return VALIDATION_MESSAGES.NETWORK.OFFLINE;
      }
      return error.message || VALIDATION_MESSAGES.FORM.SUBMISSION_ERROR;
  }
}