import { Layout } from "../../../../component/layout";
import { Formik, Form } from "formik";
import {
  Field,
  AutoCompleteField,
  RadioField,
  DatePickerField,
} from "../../../../component/input/field";
import { Dropzone } from "../../../../component/input/dropzone";
import useViewModel from "./viewModel";
import { useEffect } from "react";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";
const RegisterCoopInfo = () => {
  const [searchParams] = useSearchParams();
  const id = Number(searchParams.get("id"));

  const {
    initialValues,
    courseSections,
    courseYears,
    courseSemesters,
    fetchCourseSections,
    fetchCourseSemesters,
    handleOnSubmitStudentEnrollment,
  } = useViewModel(Number(id));

  return (
    <Layout
      header={[
        {
          path: "",
          name: "ยื่นขอสหกิจศึกษา > กรอกข้อมูลสหกิจศึกษาหรือฝึกงาน",
        },
      ]}
    >
      <div className="bg-white p-4 rounded-2xl my-4">
        <Formik
          initialValues={initialValues}
          enableReinitialize
          onSubmit={(values) =>
            handleOnSubmitStudentEnrollment({
              student_id: 1,
              course_section_id: Number(values.course_section_id),
              document_language: values.document_language as "th" | "en",

              company_register_number: values.company_register_number,
              company_name_en: values.company_name_en,
              company_name_th: values.company_name_th,
              company_address: values.company_address,
              company_map: values.company_map,
              company_email: values.company_email,
              company_phone_number: values.company_phone_number,
              company_type: values.company_type,

              start_date: dayjs(values.start_date).format(
                "YYYY-MM-DD HH:mm:ss"
              ),
              end_date: dayjs(values.end_date).format("YYYY-MM-DD HH:mm:ss"),
              coordinator: values.coordinator,
              coordinator_phone_number: values.coordinator_phone_number,
              coordinator_email: values.coordinator_email,
              supervisor: values.supervisor,
              supervisor_phone_number: values.supervisor_phone_number,
              supervisor_email: values.supervisor_email,
              department: values.department,
              position: values.position,
              job_description: values.job_description,
            })
          }
        >
          {({ setFieldValue, handleSubmit, values }) => {
            useEffect(() => {
              fetchCourseSemesters(Number(values.year));
            }, [values.year]);

            useEffect(() => {
              fetchCourseSections(
                Number(values.year),
                Number(values.semesterm)
              );
            }, [values.semesterm]);
            return (
              <Form onSubmit={handleSubmit}>
                <p className="font-bold text-2xl my-5 text-secondary-600">
                  เลือกออกเอกสาร (Document output)
                </p>
                <div className="my-5">
                  <RadioField
                    name="document_language"
                    label=""
                    options={[
                      { value: "th", label: "ภาษาไทย (Thai)" },
                      { value: "en", label: "ภาษาอังกฤษ (English)" },
                    ]}
                  />
                </div>
                <div className="grid grid-cols-4 gap-5">
                  <div>
                    <AutoCompleteField
                      name="year"
                      label_th="ปีการศึกษา"
                      label_en="Year"
                      placeholder="ปีการศึกษา (Year)"
                      disabled={id ? true : false}
                      require
                      items={[
                        {
                          value: String(courseYears?.[0]?.year) || "",
                          label: String(courseYears?.[0]?.year) || "",
                        },
                      ]}
                    />
                  </div>
                  <div>
                    <AutoCompleteField
                      name="semesterm"
                      label_th="ภาคการศึกษา"
                      label_en="Semester"
                      placeholder="ภาคการศึกษา (Semester)"
                      require
                      disabled={id ? true : false}
                      items={courseSemesters.map((item) => ({
                        value: String(item.semester),
                        label: String(item.semester),
                      }))}
                    />
                  </div>
                </div>
                <p className="font-bold text-2xl my-5 text-secondary-600">
                  เลือกประเภท
                </p>
                <div className="my-5">
                  {courseSections[0] ? (
                    <RadioField
                      disable={id ? true : false}
                      name="course_section_id"
                      label=""
                      options={courseSections.map((item) => ({
                        value: item.id,
                        label:
                          item.course.courseNameTh +
                          " (" +
                          item.course.courseNameEn +
                          ")",
                      }))}
                    />
                  ) : (
                    "กรุณาเลือกปีการศึกษาและภาคการศึกษา"
                  )}
                </div>
                <p className="font-bold text-2xl my-5 text-secondary-600">
                  ข้อมูลบริษัท
                </p>
                <div className="grid grid-cols-3 gap-5">
                  <Field
                    name="company_register_number"
                    label_th="เลขทะเบียนบริษัท"
                    label_en="Company registration number"
                    placeholder="เลขทะเบียน (Company no.)"
                    require
                  />
                  <Field
                    name="company_name_th"
                    label_th="ชื่อบริษัท"
                    label_en="Company name"
                    placeholder="ชื่อบริษัท (Company name)"
                  />
                  <Field
                    name="company_phone_number"
                    label_th="เบอร์โทรบริษัท"
                    label_en="Phone number"
                    placeholder="เบอร์โทรศัพท์ (Phone number)"
                    require
                  />
                  <Field
                    name="company_type"
                    label_th="ประเภทกิจการ"
                    label_en="Type of business"
                    placeholder="ประเภทกิจการ (Type of business)"
                    require
                  />
                  <Field
                    name="company_email"
                    label_th="อีเมลบริษัท"
                    label_en="Company email"
                    placeholder="อีเมลบริษัท (Company email)"
                    require
                  />
                  <div className="col-span-3">
                    <Field
                      name="company_address"
                      label_th="ที่อยู่บริษัท"
                      label_en="Address"
                      placeholder="ที่อยู่บริษัท (Address)"
                      require
                    />
                  </div>
                  <div className="col-span-3">
                    <Field
                      name="company_map"
                      label_th="แผนที่"
                      label_en="Map"
                      placeholder="Google Map URL"
                      require
                    />
                  </div>
                  <div className="col-span-3 grid grid-cols-2 gap-5">
                    <DatePickerField
                      name="start_date"
                      label_th="วันที่เริ่มงาน"
                      label_en="Start date"
                      placeholder="วันที่เริ่มงาน (Start date)"
                    />
                    <DatePickerField
                      name="end_date"
                      label_th="วันที่สิ้นสุดงาน"
                      label_en="End date"
                      placeholder="วันที่สิ้นสุดงาน (End date)"
                    />
                  </div>
                </div>
                <div className="font-medium text-secondary-600 mt-5">
                  <h5 className="text-xl">ภาพบริษัท</h5>
                  <p className="text-sm -mt-1.5">Company pictures</p>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <Dropzone
                    file={""}
                    handleUpload={(file) =>
                      setFieldValue("company_image_1", file)
                    }
                    preview
                  />
                  <Dropzone
                    file={""}
                    handleUpload={(file) =>
                      setFieldValue("company_image_2", file)
                    }
                    preview
                  />
                </div>

                <p className="font-bold text-2xl my-5 text-secondary-600">
                  รายละเอียดงาน
                </p>
                <div className="grid grid-cols-3 gap-5">
                  <Field
                    name="coordinator"
                    label_th="ชื่อผู้รับการติดต่อ"
                    label_en="Coordinator"
                    placeholder="ชื่อผู้รับการติดต่อ (Coordinator)"
                    require
                  />
                  <Field
                    name="coordinator_phone_number"
                    label_th="เบอร์ติดต่อ"
                    label_en="Coordinator tel."
                    placeholder="เบอร์ติดต่อ (Coordinator tel.)"
                    require
                  />
                  <Field
                    name="coordinator_email"
                    label_th="อีเมล"
                    label_en="Coordinator email"
                    placeholder="อีเมล (Coordinator email)"
                    require
                  />

                  <Field
                    name="department"
                    label_th="แผนกงาน"
                    label_en="Department"
                    placeholder="แผนกงาน (Department)"
                    require
                  />
                  <Field
                    name="position"
                    label_th="ตำแหน่งงาน"
                    label_en="Position"
                    placeholder="ตำแหน่งงาน (Position)"
                    require
                  />
                  <div className="col-span-3">
                    <Field
                      name="job_description"
                      label_th="รายละเอียดงาน"
                      label_en="Job Description"
                      placeholder="รายละเอียดงาน (Job Description)"
                      require
                    />
                  </div>
                  <Field
                    name="supervisor"
                    label_th="หัวหน้างาน"
                    label_en="Supervisor name"
                    placeholder="หัวหน้างาน (Supervisor name)"
                    require
                  />

                  <Field
                    name="supervisor_phone_number"
                    label_th="เบอร์ติดต่อ"
                    label_en="Supervisor tel."
                    placeholder="เบอร์ติดต่อ (Supervisor tel.)"
                    require
                  />
                  <Field
                    name="supervisor_email"
                    label_th="อีเมล"
                    label_en="Supervisor email"
                    placeholder="อีเมล (Supervisor email)"
                    require
                  />
                </div>

                <button
                  type="submit"
                  className="primary-button bg-gradient ml-auto mt-5"
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
export default RegisterCoopInfo;
