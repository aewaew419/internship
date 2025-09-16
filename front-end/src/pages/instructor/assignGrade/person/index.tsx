import { Layout } from "../../../../component/layout";
import { Formik, Form } from "formik";
import { RadioField } from "../../../../component/input/field";
import useViewModel from "./viewModel";
import { useSearchParams } from "react-router-dom";
import { Persona, CoopInformation } from "../../../../component/information";
const InstructorAssignGradePerPerson = () => {
  const [searchParams] = useSearchParams();
  const id = Number(searchParams.get("id"));

  const { initialValues, handleOnSubmitStudentEnrollmentGrade } =
    useViewModel(id);
  return (
    <Layout header={[{ path: "", name: "รายการขอฝึกงาน  / สหกิจศึกษา" }]}>
      <div className="bg-white rounded-2xl px-5 pb-4">
        <div>
          <Persona id={id} />
          <CoopInformation id={id} />
          {/* <Approval id={id} /> */}
        </div>
        <Formik
          initialValues={initialValues}
          enableReinitialize
          onSubmit={(values) =>
            handleOnSubmitStudentEnrollmentGrade(
              id,
              values.grade as "approve" | "denied"
            )
          }
        >
          {({ handleSubmit }) => (
            <Form onSubmit={handleSubmit}>
              <p className="font-bold text-2xl my-5 text-secondary-600">
                อาจารย์ประจำวิชาบันทึกเกรด
              </p>
              <div className="my-5">
                <RadioField
                  name="grade"
                  label=""
                  options={[
                    { value: "approve", label: "ผ่าน" },
                    { value: "denied", label: "ไม่ผ่าน" },
                  ]}
                />
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
export default InstructorAssignGradePerPerson;
