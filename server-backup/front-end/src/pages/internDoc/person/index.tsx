import { useSearchParams } from "react-router-dom";
import { Layout } from "../../../component/layout";
import { Persona, CoopInformation, Approval } from "./section";
import useViewModel from "./viewModel";
import { Formik, Form } from "formik";
import { Field, DatePickerField } from "../../../component/input/field";
const InternDocPerson = () => {
  const [searchParams] = useSearchParams();
  const id = Number(searchParams.get("id"));
  const { studentEnrollments, handleDownloadPDF } = useViewModel(id);

  return (
    <Layout header={[{ path: "", name: "รายการขอฝึกงาน / สหกิจศึกษา" }]}>
      <div className="bg-white p-4 mt-4 rounded-lg">
        <h1 className="text-xl font-bold text-secondary-600">
          เอกสารขอฝึกงาน / สหกิจศึกษา
        </h1>
        <div className="mt-5 mx-5">
          <Persona />
          <CoopInformation />
          <Approval />
        </div>
        <div className="flex justify-end mt-10 mb-5">
          <Formik
            initialValues={{ docNo: "", issueDate: "", prefix: "" }}
            onSubmit={(values) =>
              handleDownloadPDF({
                docNo: values.docNo,
                issueDate: values.issueDate,
                prefix: values.prefix,
              })
            }
          >
            {({ handleSubmit }) => (
              <Form onSubmit={handleSubmit}>
                <div className="flex gap-4">
                  <div className="flex gap-3">
                    {studentEnrollments?.student_training.documentLanguage ===
                      "en" && (
                      <Field
                        name="prefix"
                        label="คำนำหน้า"
                        placeholder="คำนำหน้า"
                      />
                    )}
                    <Field
                      name="docNo"
                      label="หมายเลขเอกสาร"
                      placeholder="หมายเลขเอกสาร"
                    />
                    <DatePickerField name="issueDate" label="วันที่เอกสาร" />
                  </div>
                  <button
                    type="submit"
                    className="primary-button bg-secondary-600 h-fit"
                  >
                    ดาวน์โหลดเอกสาร
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </Layout>
  );
};
export default InternDocPerson;
