import { Layout } from "../../../component/layout";
import { PROTECTED_PATH } from "../../../constant/path.route";
import { useNavigate } from "react-router-dom";
import useViewModel from "./viewModel";
import { EditRounded, AddRounded } from "@mui/icons-material";
import { ApprovalStatusDisplay } from "../../../component/information/ApprovalStatusDisplay";

const InternRequest = () => {
  const { studentEnrollments } = useViewModel();
  const navigate = useNavigate();
  return (
    <Layout header={[{ path: "", name: "ยื่นขอสหกิจศึกษา" }]}>
      <div className="bg-white p-4 rounded-2xl my-4 ">
        <div className="flex justify-between border-b py-3 mb-3">
          <p className="font-bold text-xl my-auto">ลงทะเบียนข้อมูลนักศึกษา</p>
          <button
            type="button"
            onClick={() => navigate(PROTECTED_PATH.REGISTER_PERSONAL_INFO)}
            className="flex gap-1 bg-primary-700 rounded-2xl text-white px-4 py-2 hover:bg-primary-600"
          >
            <EditRounded fontSize="small" className="my-auto" />
            <p className="my-auto">ลงทะเบียนข้อมูล</p>
          </button>
        </div>
        <section>
          <div className="flex justify-between">
            <p className="font-bold text-xl my-auto">
              กรอกข้อมูลสหกิจศึกษาหรือฝึกงาน
            </p>
            <button
              type="button"
              onClick={() =>
                navigate(PROTECTED_PATH.REGISTER_COOP_INFO + `?id=${0}`)
              }
              className="flex gap-1 bg-primary-700 rounded-2xl text-white px-4 py-2 hover:bg-primary-600"
            >
              <AddRounded />
              <p>เพิ่มข้อมูล</p>
            </button>
          </div>
          <div className="mt-5">
            {studentEnrollments.map((data) => (
              <div key={data.id} className="flex gap-5 my-3 p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold">
                    {data.course_section.course.courseNameTh}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <p>ปีการศึกษา: {data.course_section.year + 543}</p>
                    <p>เทอม: {data.course_section.semester}</p>
                  </div>
                  <div className="mt-3">
                    <ApprovalStatusDisplay 
                      studentEnrollId={data.id}
                      showTimestamp={true}
                      showRefreshButton={true}
                      compact={false}
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        PROTECTED_PATH.REGISTER_COOP_INFO + `?id=${data.id}`
                      )
                    }
                    className="flex gap-1 bg-primary-700 rounded-xl text-white px-4 py-1 hover:bg-primary-600"
                  >
                    <EditRounded fontSize="small" className="my-auto" />
                    <p className="my-auto">แก้ไขข้อมูล</p>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};
export default InternRequest;