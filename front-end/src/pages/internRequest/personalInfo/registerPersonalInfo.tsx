import { Layout } from "../../../component/layout";
import { Field, AutoCompleteField } from "../../../component/input/field";
import { Formik, Form } from "formik";
import { Dropzone } from "../../../component/input/dropzone";
import useViewModel from "./viewModel";
import { useEffect } from "react";
const RegisterPersonalInfo = () => {
  const {
    initialValues,
    faculties,
    programs,
    curriculums,

    fetchPrograms,
    fetchCurriculums,
    handleOnSubmitStudentInformation,
  } = useViewModel();

  return (
    <Layout header={[{ path: "", name: "ยื่นขอสหกิจศึกษา > ลงทะเบียนข้อมูล" }]}>
      <div className="bg-white p-4 rounded-2xl my-4">
        <Formik
          initialValues={initialValues}
          enableReinitialize
          onSubmit={(values) =>
            handleOnSubmitStudentInformation(1, {
              name: values.name,
              middle_name: values.middleName,
              surname: values.surname,
              student_id: values.studentId,
              campus_id: 1,
              faculty_id: Number(values.facultyId),
              program_id: Number(values.programId),
              curriculum_id: Number(values.curriculumId),
              major_id: Number(values.majorId),
              gpax: Number(values.gpax),
              phone_number: values.phoneNumber,
              email: values.email,
              picture: "",
              user_id: initialValues.userId,
            })
          }
        >
          {({ handleSubmit, setFieldValue, values }) => {
            useEffect(() => {
              fetchPrograms(Number(values.programId));
            }, [values.programId]);
            useEffect(() => {
              fetchCurriculums(Number(values.curriculumId));
            }, [values.curriculumId]);
            return (
              <Form onSubmit={handleSubmit}>
                <p className="font-bold text-2xl my-5 text-secondary-600">
                  ข้อมูลส่วนตัว
                </p>
                <div className="grid grid-cols-4 gap-5">
                  <Field
                    name="name"
                    label_th="ชื่อจริง"
                    label_en="Name"
                    placeholder="ชื่อจริง (Name)"
                    require
                  />
                  <Field
                    name="middleName"
                    label_th="ชื่อกลาง"
                    label_en="Middle name"
                    placeholder="ชื่อกลาง (Middle name)"
                  />
                  <Field
                    name="surname"
                    label_th="นามสกุล"
                    label_en="Surname"
                    placeholder="นามสกุล (Surname)"
                    require
                  />
                  <Field
                    name="studentId"
                    label_th="รหัสนักศึกษา"
                    label_en="Student ID"
                    placeholder="รหัสนักศึกษา (Student ID)"
                    require
                  />
                  <AutoCompleteField
                    name="facultyId"
                    label_th="คณะ"
                    label_en="Faculty"
                    placeholder="คณะ (Faculty)"
                    items={
                      faculties?.map((faculty) => ({
                        value: faculty.id,
                        label: faculty.facultyNameTh,
                      })) || []
                    }
                  />
                  <AutoCompleteField
                    name="programId"
                    label_th="สาขา"
                    label_en="Department"
                    placeholder="สาขา (Department)"
                    items={
                      faculties
                        .find(
                          (faculty) => faculty.id === Number(values.facultyId)
                        )
                        ?.program?.map((program) => ({
                          value: program.id,
                          label: program.programNameTh,
                        })) || []
                    }
                  />
                  <AutoCompleteField
                    name="curriculumId"
                    label_th="หลักสูตร"
                    label_en="Curriculum"
                    placeholder="หลักสูตร (Curriculum)"
                    items={
                      programs
                        .find(
                          (program) => program.id === Number(values.programId)
                        )
                        ?.curriculum?.map((curriculum) => ({
                          value: curriculum.id,
                          label: curriculum.curriculumNameTh,
                        })) || []
                    }
                  />
                  <AutoCompleteField
                    name="majorId"
                    label_th="วิชาเอก"
                    label_en="Major"
                    placeholder="วิชาเอก (Major)"
                    items={
                      curriculums
                        .find(
                          (curriculum) =>
                            curriculum.id === Number(values.curriculumId)
                        )
                        ?.majors?.map((major) => ({
                          value: major.id,
                          label: major.majorNameTh,
                        })) || []
                    }
                  />
                  <Field
                    name="gpax"
                    label_th="เกรดเฉลี่ย"
                    label_en="GPAX"
                    placeholder="เกรดเฉลี่ย (GPAX)"
                    type="number"
                    require
                  />
                </div>

                <p className="font-bold text-2xl my-5 text-secondary-600">
                  ข้อมูลการติดต่อ
                </p>
                <div className="grid grid-cols-4 gap-5">
                  <Field
                    name="phoneNumber"
                    label_th="เบอร์โทรศัพท์"
                    label_en="Phone number"
                    placeholder="เบอร์โทรศัพท์ (Phone number)"
                    require
                  />
                  <Field
                    name="email"
                    label_th="อีเมล์"
                    label_en="E-mail"
                    placeholder="อีเมล์ (E-mail)"
                    require
                  />
                </div>
                <p className="font-bold text-2xl my-5 text-secondary-600">
                  อัปโหลดภาพนักศึกษา
                </p>
                <div>
                  <Dropzone
                    file={values.picture}
                    handleUpload={(file) => setFieldValue("picture", file)}
                    preview
                  />
                </div>
                <button
                  type="submit"
                  className="primary-button bg-gradient ml-auto"
                >
                  บันทึก
                </button>
              </Form>
            );
          }}
        </Formik>
      </div>
    </Layout>
  );
};
export default RegisterPersonalInfo;
