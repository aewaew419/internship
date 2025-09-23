import * as yup from "yup";

const LoginSchema = () => {
  const LoginFormValidationSchema = yup.object({
    email: yup
      .string()
      .email("กรุณาระบุอีเมลให้ถูกต้อง")
      .required("กรุณาระบุอีเมล"),
    password: yup.string().required("กรุณาระบุรหัสผ่าน"),
  });

  return {
    LoginFormValidationSchema,
  };
};

export default LoginSchema;
