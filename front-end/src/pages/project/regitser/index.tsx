import { Layout } from "../../../component/layout";
import { Formik, Form } from "formik";
import {
  Field,
  // AutoCompleteField,
  RadioField,
} from "../../../component/input/field";
const RegisterProject = () => {
  return (
    <Layout
      header={[
        {
          path: "",
          name: "รายละเอียดโปรเจกต์ > แจ้งหัวข้อโปรเจกต์",
        },
      ]}
    >
      <div className="bg-white p-4 rounded-2xl my-4">
        <Formik
          initialValues={{ have_project: "1" }}
          onSubmit={(values) => console.log(values)}
        >
          {({ handleSubmit, values }) => (
            <Form onSubmit={handleSubmit}>
              <p className="font-bold text-2xl my-5 text-secondary-600">
                กรุณาเลือก
              </p>
              <div className="my-5">
                <RadioField
                  name="have_project"
                  label=""
                  options={[
                    { value: "1", label: "ทำโปรเจกต์" },
                    { value: "0", label: "ไม่ทำโปรเจกต์" },
                  ]}
                />
              </div>
              {values.have_project === "1" ? (
                <ProjectInformationForm />
              ) : (
                <NoProjectReasonForm />
              )}
              <button
                type="submit"
                className="primary-button bg-gradient ml-auto mt-5"
              >
                บันทึก
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </Layout>
  );
};
export default RegisterProject;

const ProjectInformationForm = () => {
  return (
    <div>
      <p className="font-bold text-2xl my-5 text-secondary-600">
        รายละเอียดทั่วไป
      </p>
      <div className="grid gap-5">
        <Field
          name="project_name"
          label_th="หัวข้อโปรเจกต์"
          label_en="Project name"
          placeholder="หัวข้อโปรเจกต์ (Project name)"
        />
        <Field
          name="project_info"
          label_th="รายละเอียดโดยสังเขป"
          label_en="Information"
          placeholder="รายละเอียดโดยสังเขป (Information)"
          multiline
        />
        <Field
          name="project_objective"
          label_th="เป้าหมายของโปรเจกต์"
          label_en="Objective"
          placeholder="เป้าหมายของโปรเจกต์ (Objective)"
          multiline
        />
      </div>
      <p className="font-bold text-2xl my-5 text-secondary-600">
        เทคโนโลยี / เครื่องมือที่ใช้
      </p>
      <Field
        name="project_tools"
        label_th="เครื่องมือที่ใช้"
        label_en="Software"
        placeholder="เครื่องมือที่ใช้ (Software)"
      />
    </div>
  );
};
const NoProjectReasonForm = () => {
  return (
    <div>
      <Field
        name="no_project_reason"
        label_th="อธิบายเหตุผล"
        label_en="Reasons"
        placeholder="อธิบายเหตุผล (Reasons)"
        require
      />
    </div>
  );
};
