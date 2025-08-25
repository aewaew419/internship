import { Layout } from "../../component/layout";
import { PROTECTED_PATH } from "../../constant/path.route";
import { useNavigate } from "react-router-dom";
import useViewModel from "./viewModel";
const InternRequest = () => {
  const { studentEnrollments } = useViewModel();
  const navigate = useNavigate();
  return (
    <Layout header={[{ path: "", name: "ยื่นขอสหกิจศึกษา" }]}>
      <div className="bg-white p-4 rounded-2xl my-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(PROTECTED_PATH.REGISTER_PERSONAL_INFO)}
          >
            ลงทะเบียนข้อมูล
          </button>
        </div>
        <section>
          <h3>กรอกข้อมูลสหกิจศึกษาหรือฝึกงาน</h3>
          <button
            type="button"
            onClick={() =>
              navigate(PROTECTED_PATH.REGISTER_COOP_INFO + `?id=${0}`)
            }
          >
            เพิ่มข้อมูล
          </button>
          <div>
            {studentEnrollments.map((data) => (
              <div key={data.id} className="flex gap-5 ">
                <p>{data.course_section.course.courseNameTh}</p>
                <p>{data.course_section.year}</p>
                <p>{data.course_section.semester}</p>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      PROTECTED_PATH.REGISTER_COOP_INFO + `?id=${data.id}`
                    )
                  }
                >
                  แก้ไขข้อมูล
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};
export default InternRequest;
