import { Layout } from "../../../../component/layout";
import { Formik, Form } from "formik";

import useViewModel from "./viewModel";
import { useSearchParams } from "react-router-dom";
import {
  Persona,
  CoopInformation,
  Approval,
} from "../../../../component/information";
// import { useToken } from "../../../../utils/localStorage";
const AssignVisitorPerson = () => {
  // const token = useToken();
  const [searchParams] = useSearchParams();
  // const id = Number(searchParams.get("id"));
  const enroll_id = Number(searchParams.get("enroll_id"));
  const { initialValues } = useViewModel();
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
          onSubmit={
            (values) => console.log(values)

            // handleOnSubmitStudentEnrollmentStatus({
            //   ids: [id],
            //   status: values.student_enroll_status as
            //     | "approve"
            //     | "pending"
            //     | "denied",
            //   remarks: "",
            // })
          }
        >
          {({ handleSubmit }) => (
            <Form onSubmit={handleSubmit}>
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
export default AssignVisitorPerson;
