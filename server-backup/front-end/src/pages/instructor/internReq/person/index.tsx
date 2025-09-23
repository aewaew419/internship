import { Layout } from "../../../../component/layout";
import { Formik, Form } from "formik";
import { RadioField, Field } from "../../../../component/input/field";
import useViewModel from "./viewModel";
import { useSearchParams } from "react-router-dom";
import {
  Persona,
  CoopInformation,
  Approval,
} from "../../../../component/information";
import { useToken } from "../../../../utils/localStorage";
const InstructorInternReqPerson = () => {
  const token = useToken();
  const [searchParams] = useSearchParams();
  const id = Number(searchParams.get("id"));
  const enroll_id = Number(searchParams.get("enroll_id"));
  const { initialValues, handleOnSubmitStudentEnrollmentStatus } =
    useViewModel(id);
  return (
    <Layout header={[{ path: "", name: "รายการขอฝึกงาน  / สหกิจศึกษา" }]}>
      <div className="bg-white rounded-2xl px-5 pb-4">
        <div>
          <Persona id={enroll_id} />
          <CoopInformation id={enroll_id} />
          <Approval id={enroll_id} />
        </div>
        <Formik
          initialValues={initialValues}
          enableReinitialize
          onSubmit={(values) =>
            handleOnSubmitStudentEnrollmentStatus({
              ids: [id],
              status: values.student_enroll_status as
                | "approve"
                | "pending"
                | "denied",
              remarks: values.remarks,
            })
          }
        >
          {({ handleSubmit, values }) => (
            <Form onSubmit={handleSubmit}>
              <p className="font-bold text-2xl my-5 text-secondary-600">
                {token.roles.committee
                  ? "คณะกรรมการรับรอง"
                  : "อาจารย์ประจำวิชารับรอง"}
                {/* {token.roles.find((role) => role === "committee")
                  ? "คณะกรรมการรับรอง"
                  : "อาจารย์ประจำวิชารับรอง"} */}
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
                {values.student_enroll_status === "denied" && (
                  <Field name="remarks" label="เหตุผล" require />
                )}
              </div>
              <button type="submit" className="secondary-button">
                บันทึก
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </Layout>
  );
};
export default InstructorInternReqPerson;
