import { Layout } from "../../../component/layout";
import useViewModel from "./viewModel";
import { useNavigate } from "react-router-dom";
import { PROTECTED_PATH } from "../../../constant/path.route";
const StudentEvaluateCompany = () => {
  const navigate = useNavigate();
  const { studentEnrollments } = useViewModel();
  return (
    <Layout header={[{ path: "", name: "แบบประเมิน" }]}>
      <div>
        {studentEnrollments.map((data) => (
          <div className="flex gap-5">
            <p>{data.student.name}</p>
            <p>{data.student_training.company.companyNameTh}</p>
            <button
              onClick={() =>
                navigate(
                  PROTECTED_PATH.COMPANY_EVALUAION_PER_COMPANY +
                    `?id=${data.student_training.id}`
                )
              }
            >
              ประเมิน
            </button>
          </div>
        ))}
      </div>
    </Layout>
  );
};
export default StudentEvaluateCompany;
