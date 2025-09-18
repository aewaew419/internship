import { Layout } from "../../../../component/layout";
import { useNavigate } from "react-router-dom";
import useViewModel from "./viewModel";
import { PROTECTED_PATH } from "../../../../constant/path.route";
import { Table } from "../../../../component/table";
const VisitorEvaluateStudent = () => {
  const { visitors } = useViewModel();
  const navigate = useNavigate();
  return (
    <Layout header={[{ path: "", name: "แบบประเมินนักศึกษา" }]}>
      <div className="mt-5">
        <Table
          header={["ชื่อ", "รหัส", "อีเมล", "สถานะการประเมิน", ""]}
          data={visitors.map((data, key) => (
            <tr key={key}>
              <td className="ps-5 py-3">
                {data.studentEnroll.student.name}{" "}
                {data.studentEnroll.student.surname}
              </td>
              <td>{data.studentEnroll.student.studentId}</td>
              <td>{data.studentEnroll.student.email}</td>
              <td>
                <span 
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    data.evaluationStatus === "ประเมินแล้ว" 
                      ? "bg-green-100 text-green-800" 
                      : data.evaluationStatus === "ประเมินบางส่วน"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {data.evaluationStatus || "ยังไม่ประเมิน"}
                </span>
              </td>
              <td>
                <button
                  className={`px-4 py-2 rounded text-white font-medium ${
                    data.evaluationStatus === "ประเมินแล้ว"
                      ? "bg-blue-500 hover:bg-blue-600"
                      : data.evaluationStatus === "ประเมินบางส่วน"
                      ? "bg-yellow-500 hover:bg-yellow-600"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                  onClick={() =>
                    navigate(
                      PROTECTED_PATH.VISITOR_EVALUATE_STUDENT_PERSON +
                        `?id=${data.id}&enroll_id=${data.studentEnrollId}`
                    )
                  }
                >
                  {data.evaluationStatus === "ประเมินแล้ว" 
                    ? "แก้ไขการประเมิน" 
                    : data.evaluationStatus === "ประเมินบางส่วน"
                    ? "ประเมินต่อ"
                    : "ประเมิน"}
                </button>
              </td>
            </tr>
          ))}
        />
      </div>
    </Layout>
  );
};
export default VisitorEvaluateStudent;
