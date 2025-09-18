import { Layout } from "../../../../../component/layout";
import { useSearchParams } from "react-router-dom";
import useViewModel from "./viewModel";
import { Formik, Form } from "formik";
import { RadioField, Field } from "../../../../../component/input/field";
import { Persona, CoopInformation } from "../../../../../component/information";
const VisitorEvaluateStudentPerson = () => {
  const [searchParams] = useSearchParams();
  const id = Number(searchParams.get("id"));
  const enroll_id = Number(searchParams.get("enroll_id"));
  const { visitors, handleOnsubmit } = useViewModel(id);
  return (
    <Layout header={[{ path: "", name: "แบบประเมิน" }]}>
      <div className="bg-white px-4 pb-4 rounded-2xl">
        <div>
          <Persona id={enroll_id} />
          <CoopInformation id={enroll_id} />
        </div>
        <div>
          <div>
            <h1 className="text-xl font-bold text-secondary-600 py-5 border-b border-secondary-600 my-5">
              กรุณาให้คะแนน
            </h1>
            <p className="text-secondary-600">(1 = น้อยมาก, 5 = มากที่สุด)</p>
            <Formik
              initialValues={{
                ids: visitors.map((v) => v.id),
                scores: visitors.map((v) => v.score || 0),
                comment: visitors?.[0]?.comment || "",
              }}
              enableReinitialize
              onSubmit={(value) => {
                handleOnsubmit({
                  ids: visitors.map((v) => v.id),
                  scores: value.scores.map((v) => Number(v)),
                  comment: value.comment,
                }, false); // false = ไม่ใช่การบันทึกร่าง
              }}
            >
              {({ values }) => (
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
                      <Field name="comment" multiline />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className={`px-4 py-2 rounded text-white font-medium ${
                          values.scores.every((score) => Number(score) > 0)
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                        disabled={!values.scores.every((score) => Number(score) > 0)}
                      >
                        ส่งการประเมิน
                      </button>
                      <button
                        type="button"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium"
                        onClick={() => {
                          handleOnsubmit({
                            ids: visitors.map((v) => v.id),
                            scores: values.scores.map((v) => Number(v)),
                            comment: values.comment,
                          }, true); // true = บันทึกร่าง
                        }}
                      >
                        บันทึกร่าง
                      </button>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default VisitorEvaluateStudentPerson;
