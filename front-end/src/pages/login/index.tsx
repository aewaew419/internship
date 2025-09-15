import { Person } from "@mui/icons-material";
import FormControl from "@mui/material/FormControl";
import OutlinedInput from "@mui/material/OutlinedInput";

import { Formik, Form } from "formik";
import { Field } from "../../component/input/field";
// import LoginSchema from "./validation";

import { useState } from "react";
import useViewModel from "./viewModel";
// import { Formik, Form } from "formik";
const Login = () => {
  const { err, Login } = useViewModel();
  // const { LoginFormValidationSchema } = LoginSchema();
  const [forgotPassword, setForgotPassword] = useState(false);
  const handleForgotPassword = (state: boolean) => {
    setForgotPassword(state);
  };

  return (
    <div>
      {forgotPassword && (
        <ForgotPasswordForm handleClose={handleForgotPassword} />
      )}
      {/* <div className="bg-white w-full h-fit py-6">
        <img src="/logo.png" alt="Logo" className="h-20" />
      </div> */}
      <div className="absolute left-1/2 top-1/2 transform -translate-1/2">
        <Formik
          initialValues={{ email: "", password: "" }}
          // validationSchema={LoginFormValidationSchema}
          onSubmit={(values, { resetForm }) => {
            Login(values);
            resetForm();
          }}
        >
          {({ handleSubmit }) => {
            return (
              <Form onSubmit={handleSubmit}>
                <div className="w-96 bg-white rounded-2xl px-8 py-10 text-black shadow-xl border border-gray-300">
                  <div className="my-3">
                    <div className="w-fit mb-5 mx-auto">
                      <img src="/logo.png" alt="Logo" className="h-20" />
                    </div>
                    <h1 className="text-xl mb-2 text-center font-semibold text-text-900">
                      เข้าสู่ระบบ
                    </h1>
                    <p className="text-center text-text-800">
                      ระบบจัดการข้อมูลสหกิจและนักศึกษาฝึกงาน
                    </p>
                  </div>
                  <div className="grid gap-3 my-4 mx-auto">
                    {err && (
                      <p className="-mb-3 text-end text-xs text-red-600">
                        อีเมลหรือรหัสผ่านไม่ถูกต้อง
                      </p>
                    )}
                    <Field name="email" label="email" placeholder="email" />
                    <Field
                      name="password"
                      label="password"
                      placeholder="password"
                      type="password"
                    />

                    <button
                      className="bg-gradient text-white font-medium px-16 py-2 rounded w-full hover:opacity-90 transition-colors duration-200"
                      type="submit"
                    >
                      เข้าสู่ระบบ
                    </button>

                    <button
                      className="text-sm text-text-700 hover:text-text-900 text-end"
                      type="button"
                      onClick={() => handleForgotPassword(true)}
                    >
                      ลืมรหัสผ่าน
                    </button>
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
};
export default Login;

const ForgotPasswordForm = ({
  handleClose,
}: {
  handleClose: (state: boolean) => void;
}) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black/50 z-10">
      <div className="fixed top-1/2 left-1/2 transform -translate-1/2 w-fit mx-auto bg-white p-3 rounded-lg shadow-lg">
        <div
          onClick={() => handleClose(false)}
          className="ml-auto cursor-pointer w-fit"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 58 58"
            fill="none"
          >
            <path
              d="M28.9999 4.83301C15.6358 4.83301 4.83325 15.6355 4.83325 28.9997C4.83325 42.3638 15.6358 53.1663 28.9999 53.1663C42.3641 53.1663 53.1666 42.3638 53.1666 28.9997C53.1666 15.6355 42.3641 4.83301 28.9999 4.83301ZM39.3916 39.3913C38.4491 40.3338 36.9266 40.3338 35.9841 39.3913L28.9999 32.4072L22.0158 39.3913C21.0733 40.3338 19.5508 40.3338 18.6083 39.3913C17.6658 38.4488 17.6658 36.9263 18.6083 35.9838L25.5924 28.9997L18.6083 22.0155C17.6658 21.073 17.6658 19.5505 18.6083 18.608C19.5508 17.6655 21.0733 17.6655 22.0158 18.608L28.9999 25.5922L35.9841 18.608C36.9266 17.6655 38.4491 17.6655 39.3916 18.608C40.3341 19.5505 40.3341 21.073 39.3916 22.0155L32.4074 28.9997L39.3916 35.9838C40.3099 36.9022 40.3099 38.4488 39.3916 39.3913Z"
              fill="url(#paint0_linear_285_8805)"
            />
            <defs>
              <linearGradient
                id="paint0_linear_285_8805"
                x1="13.2334"
                y1="12.5379"
                x2="46.3123"
                y2="48.4678"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#D89967" />
                <stop offset="0.298077" stopColor="#966033" />
                <stop offset="1" stopColor="#412610" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="mx-24">
          <p className="text-center text-4xl text-secondary-600 font-bold mb-8">
            ลืมรหัสผ่าน
          </p>
          <div className="w-fit mx-auto my-10 bg-[#BEBEBE] rounded-full p-4">
            <Person sx={{ fontSize: "10.75rem" }} />
          </div>

          <p className="underline text-center text-secondary-600 text-2xl">
            กรุณากรอกอีเมล
          </p>
          <div className="w-fit mx-auto my-10">
            <FormControl sx={{ width: "25ch" }} variant="outlined">
              <OutlinedInput
                size="small"
                name="email"
                type="email"
                placeholder="อีเมล (Email)"
              />
            </FormControl>
          </div>
          <p className="font-semibold text-2xl text-secondary-600">
            ระบบจะส่งลิงก์เพื่อเปลี่ยนรหัสผ่าน
          </p>

          <div className="w-fit mx-auto">
            <button
              className="bg-gradient text-white px-16 py-2 text-2xl rounded my-5"
              type="submit"
            >
              ส่งอีกครั้ง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
