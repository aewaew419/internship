import { Layout } from "../../../../component/layout";
import { useNavigate } from "react-router-dom";
import useViewModel from "./viewModel";
import { PROTECTED_PATH } from "../../../../constant/path.route";
import { Table } from "../../../../component/table";
const VisitorEvaluateCompany = () => {
  const { visitors } = useViewModel();
  const navigate = useNavigate();
  return (
    <Layout header={[{ path: "", name: "แบบประเมินสถานประกอบการ" }]}>
      <div className="mt-5">
        <Table
          header={["ชื่อ", "รหัส", "อีเมล", ""]}
          data={visitors.map((data, key) => (
            <tr key={key}>
              <td className="ps-5 py-3">
                {data.studentEnroll.student.name}{" "}
                {data.studentEnroll.student.surname}
              </td>
              <td>{data.studentEnroll.student.studentId}</td>
              <td>{data.studentEnroll.student.email}</td>
              <td>
                <button
                  className="secondary-button"
                  onClick={() =>
                    navigate(
                      PROTECTED_PATH.VISITOR_EVALUATE_COMPANY_PERSON +
                        `?id=${data.id}&enroll_id=${data.studentEnrollId}`
                    )
                  }
                >
                  ประเมิน
                </button>
              </td>
            </tr>
          ))}
        />
      </div>
    </Layout>
  );
};
export default VisitorEvaluateCompany;
