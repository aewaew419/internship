import { Layout } from "../../../../component/layout";
import useViewModel from "./viewModel";
import { useSearchParams } from "react-router-dom";
import { Formik, Form } from "formik";
import { RadioField, Field } from "../../../../component/input/field";
import { Persona } from "../../../../component/information";
const StudentEvaluateCompanyPerCompany = () => {
  const [searchParams] = useSearchParams();
  const id = Number(searchParams.get("id"));
  const { student, handleOnsubmit } = useViewModel(id);

  return (
    <Layout header={[{ path: "", name: "แบบประเมิน" }]}>
      <div className="bg-white px-4 pb-4 rounded-2xl">
        <div>
          {student?.[0]?.student_training && (
            <Persona id={student?.[0]?.student_training?.studentEnrollId} />
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-secondary-600 py-5 border-b border-secondary-600 my-5">
            กรุณาให้คะแนน
          </h1>
          <p className="text-secondary-600">(1 = น้อยมาก, 5 = มากที่สุด)</p>
          <Formik
            initialValues={{
              ids: student.map((v) => v.id),
              scores: student.map((v) => v.score || 0),
              comment: student?.[0]?.comment || "",
            }}
            enableReinitialize
            onSubmit={(value) =>
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
                        label={`${index + 1}.${data.questions}`}
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
                    <Field name="comment" multiline />
                  </div>
                  <button type="submit" className="secondary-button">
                    Submit
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
export default StudentEvaluateCompanyPerCompany;
