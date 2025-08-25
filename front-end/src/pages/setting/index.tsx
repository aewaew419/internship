import { Layout } from "../../component/layout";
import { Formik, Form } from "formik";
import { AutoCompleteField, Field } from "../../component/input/field";
import useViewModel from "./viewModel";
import { CourseInterface, CourseDTO } from "../../service/api/course/type";
const Setting = () => {
  const {
    course,
    courseSections,
    courseInstructor,
    courseCommittee,
    handleCreateCourseSection,
    handleDeletedCourseSection,
  } = useViewModel();

  return (
    <Layout header={[{ path: "/setting", name: "ตั้งค่า" }]}>
      <div className="setting">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p>Manage your settings here.</p>
        <div className="grid gap-5 my-5">
          <section className="grid gap-6">
            <div className="rounded-2xl border p-5 shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-3">
                Create Course Section
              </h2>
              <CreateCourseSectionForm
                courses={course}
                onCreate={handleCreateCourseSection}
              />
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">Course ID</th>
                      <th className="py-2 pr-3">Year</th>
                      <th className="py-2 pr-3">Semester</th>
                      <th className="py-2 pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseSections.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-6 text-center text-gray-500"
                        >
                          No sections yet.
                        </td>
                      </tr>
                    ) : (
                      courseSections.map((s) => (
                        <tr key={s.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 pr-3">{s.id}</td>
                          <td className="py-2 pr-3">{s.course.courseNameTh}</td>
                          <td className="py-2 pr-3">{s.year}</td>
                          <td className="py-2 pr-3">{s.semester}</td>
                          <td>
                            <button
                              type="button"
                              className="px-3 py-1 rounded-xl shadow bg-black text-white disabled:opacity-50 h-fit mt-1"
                              onClick={() => handleDeletedCourseSection(s.id)}
                            >
                              delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
          <section className="grid gap-6">
            <div className="rounded-2xl border p-5 shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-3">
                Assign Instructor to Course
              </h2>
              <AssignInstructorCourseSection />
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">Course ID</th>
                      <th className="py-2 pr-3">Year</th>
                      <th className="py-2 pr-3">Semester</th>
                      <th className="py-2 pr-3">Instructor</th>
                      <th className="py-2 pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseInstructor.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-6 text-center text-gray-500"
                        >
                          No sections of assign any instructor yet.
                        </td>
                      </tr>
                    ) : (
                      courseInstructor.map((s) =>
                        s.course_instructors.length === 0 ? (
                          <tr key={s.id}>
                            <td></td>
                          </tr>
                        ) : (
                          <tr key={s.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 pr-3">{s.id}</td>
                            <td className="py-2 pr-3">
                              {s.course.courseNameTh}
                            </td>
                            <td className="py-2 pr-3">{s.year}</td>
                            <td className="py-2 pr-3">{s.semester}</td>
                            <td className="py-2 pr-3">
                              {s.course_instructors.map((i) => i.name)}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="px-3 py-1 rounded-xl shadow bg-black text-white disabled:opacity-50 h-fit mt-1"
                                onClick={() => handleDeletedCourseSection(s.id)}
                              >
                                delete
                              </button>
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
          <section className="grid gap-6">
            <div className="rounded-2xl border p-5 shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-3">
                Assign Committee to Course
              </h2>
              <AssignCommitteeCourseSection />
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">Course ID</th>
                      <th className="py-2 pr-3">Year</th>
                      <th className="py-2 pr-3">Semester</th>
                      <th className="py-2 pr-3">Instructor</th>
                      <th className="py-2 pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseCommittee.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-6 text-center text-gray-500"
                        >
                          No sections of assign any instructor yet.
                        </td>
                      </tr>
                    ) : (
                      courseCommittee.map((s, course_index) =>
                        s.course_committee.length === 0 ? (
                          <tr key={s.id}>
                            <td></td>
                          </tr>
                        ) : (
                          s.course_committee.map((ci, index) => (
                            <tr
                              key={s.id + ci.id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="py-2 pr-3">
                                {course_index + index + 1}
                              </td>
                              <td className="py-2 pr-3">
                                {s.course.courseNameTh}
                              </td>
                              <td className="py-2 pr-3">{s.year}</td>
                              <td className="py-2 pr-3">{s.semester}</td>
                              <td className="py-2 pr-3">{ci.name}</td>
                              <td>
                                <button
                                  type="button"
                                  className="px-3 py-1 rounded-xl shadow bg-black text-white disabled:opacity-50 h-fit mt-1"
                                  // onClick={() => handleDeletedCourseSection(s.id)}
                                >
                                  delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};
export default Setting;

type CreateCourseSectionType = {
  courses: CourseInterface[];
  onCreate: (entity: {
    course_id: number;
    semester: number;
    year: number;
  }) => Promise<void> | void;
};
type FormValues = { course_id: string; semester: string; year: string };
const CreateCourseSectionForm = (props: CreateCourseSectionType) => {
  const initialValues: FormValues = {
    course_id: "",
    semester: "",
    year: "",
  };
  return (
    <div>
      <Formik
        initialValues={initialValues}
        onSubmit={async (values, { resetForm }) => {
          await props.onCreate({
            course_id: Number(values.course_id),
            semester: Number(values.semester),
            year: Number(values.year),
          });
          resetForm();
        }}
      >
        {({ handleSubmit }) => (
          <Form onSubmit={handleSubmit}>
            <div className="flex gap-5">
              <AutoCompleteField
                name="course_id"
                items={props.courses.map((data) => {
                  return { label: data.courseNameTh, value: data.id };
                })}
                label="รายวิชา"
              />
              <Field name="year" label="ปีการศึกษา" />
              <Field name="semester" label="เทอม" />
              <button
                type="submit"
                className="px-4 py-2 rounded-2xl shadow bg-black text-white disabled:opacity-50 h-fit mt-auto"
              >
                Create Section
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

const AssignInstructorCourseSection = () => {
  return (
    <div>
      <Formik
        initialValues={{ course_id: "", semester: "", year: "" }}
        onSubmit={(values) => console.log(values)}
      >
        {({ handleSubmit }) => (
          <Form onSubmit={handleSubmit}>
            <div className="flex gap-5">
              <AutoCompleteField
                name="instructor_id"
                items={[]}
                label="อาจารย์ประจำวิชา"
              />
              <AutoCompleteField name="course_id" items={[]} label="รายวิชา" />

              <button
                type="submit"
                className="px-4 py-2 rounded-2xl shadow bg-black text-white disabled:opacity-50 h-fit mt-auto"
              >
                Assign Instructor
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};
const AssignCommitteeCourseSection = () => {
  return (
    <div>
      <Formik
        initialValues={{ course_id: "", semester: "", year: "" }}
        onSubmit={(values) => console.log(values)}
      >
        {({ handleSubmit }) => (
          <Form onSubmit={handleSubmit}>
            <div className="flex gap-5">
              <AutoCompleteField
                name="instructor_id"
                items={[]}
                label="คณะกรรมการ"
              />
              <AutoCompleteField name="course_id" items={[]} label="รายวิชา" />

              <button
                type="submit"
                className="px-4 py-2 rounded-2xl shadow bg-black text-white disabled:opacity-50 h-fit mt-auto"
              >
                Assign Committee
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};
