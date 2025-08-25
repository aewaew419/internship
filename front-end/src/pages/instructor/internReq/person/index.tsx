import { Layout } from "../../../../component/layout";
import { Formik, Form } from "formik";
import { RadioField } from "../../../../component/input/field";
import useViewModel from "./viewModel";
import { useSearchParams } from "react-router-dom";
const InstructorInternReqPerson = () => {
  const [searchParams] = useSearchParams();
  const id = Number(searchParams.get("id"));
  const { initialValues, handleOnSubmitStudentEnrollmentStatus } =
    useViewModel();
  return (
    <Layout header={[{ path: "", name: "รายการขอฝึกงาน  / สหกิจศึกษา" }]}>
      <div></div>
      <Formik
        initialValues={initialValues}
        onSubmit={(values) =>
          handleOnSubmitStudentEnrollmentStatus({
            ids: [id],
            status: values.student_enroll_status as
              | "approve"
              | "pending"
              | "denied",
            remarks: "",
          })
        }
      >
        {({ handleSubmit }) => (
          <Form onSubmit={handleSubmit}>
            <p className="font-bold text-2xl my-5 text-secondary-600">
              อาจารย์ประจำวิชารับรอง
            </p>
            <div className="my-5">
              <RadioField
                name="student_enroll_status"
                label=""
                options={[
                  { value: "approve", label: "อนุมัติ" },
                  { value: "denied", label: "ไม่อนุมัติ" },
                ]}
              />
            </div>
            <button>บันทึก</button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};
export default InstructorInternReqPerson;
