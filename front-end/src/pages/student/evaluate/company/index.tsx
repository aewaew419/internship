import { Layout } from "../../../../component/layout";
import useViewModel from "./viewModel";
import { useSearchParams } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import { RadioField } from "../../../../component/input/field";
const StudentEvaluateCompanyPerCompany = () => {
  const [searchParams] = useSearchParams();
  const id = Number(searchParams.get("id"));
  const { student, handleOnsubmit } = useViewModel(id);
  return (
    <Layout header={[{ path: "", name: "แบบประเมิน" }]}>
      <div>
        <Formik
          initialValues={{
            ids: student.map((v) => v.id),
            scores: student.map((v) => v.score || 0),
            comment: student?.[0]?.comment || "",
          }}
          enableReinitialize
          onSubmit={(value) =>
            // console.log(value)

            handleOnsubmit({
              ids: student.map((v) => v.id),
              scores: value.scores.map((v) => Number(v)),
              comment: value.comment,
            })
          }
        >
          {({}) => (
            <Form>
              <div>
                {student.map((data, index) => (
                  <div key={data.id} className="my-3">
                    <RadioField
                      name={`scores[${index}]`}
                      label={data.questions}
                      row
                      options={[1, 2, 3, 4, 5].map((n) => ({
                        label: "★".repeat(n),
                        value: n,
                      }))}
                    />
                  </div>
                ))}
                <div className="my-5">
                  <label>ข้อเสนอแนะเพิ่มเติม</label>
                  <Field
                    as="textarea"
                    name="comment"
                    className="border w-full p-2"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-orange-500 text-white px-4 py-2 rounded"
                >
                  Submit
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </Layout>
  );
};
export default StudentEvaluateCompanyPerCompany;
