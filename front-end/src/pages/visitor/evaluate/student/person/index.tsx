import { Layout } from "../../../../../component/layout";
import { useSearchParams } from "react-router-dom";
import useViewModel from "./viewModel";
import { Formik, Form, Field } from "formik";
import { RadioField } from "../../../../../component/input/field";
const VisitorEvaluateStudentPerson = () => {
  const [searchParams] = useSearchParams();
  const id = Number(searchParams.get("id"));
  const { visitors, handleOnsubmit } = useViewModel(id);
  return (
    <Layout header={[{ path: "", name: "แบบประเมิน" }]}>
      <div>
        <Formik
          initialValues={{
            ids: visitors.map((v) => v.id),
            scores: visitors.map((v) => v.score || 0),
            comment: visitors?.[0]?.comment || "",
          }}
          enableReinitialize
          onSubmit={(value) =>
            handleOnsubmit({
              ids: visitors.map((v) => v.id),
              scores: value.scores.map((v) => Number(v)),
              comment: value.comment,
            })
          }
        >
          {({}) => (
            <Form>
              <div>
                {visitors.map((data, index) => (
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
export default VisitorEvaluateStudentPerson;
