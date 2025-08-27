import { Layout } from "../../../../component/layout";
import { useNavigate } from "react-router-dom";
import useViewModel from "./viewModel";
import { PROTECTED_PATH } from "../../../../constant/path.route";
const VisitorEvaluateCompany = () => {
  const { visitors } = useViewModel();
  const navigate = useNavigate();
  return (
    <Layout header={[{ path: "", name: "แบบประเมิน" }]}>
      <div>
        {visitors?.map((data, key) => (
          <div className="flex gap-5" key={key}>
            <p>{data.id}</p>
            <p>{data.schedules.length}</p>
            <p>{data.studentEnroll.student.name}</p>
            <button
              onClick={() =>
                navigate(
                  PROTECTED_PATH.VISITOR_EVALUATE_COMPANY_PERSON +
                    `?id=${data.id}`
                )
              }
            >
              Edit Schedule
            </button>
          </div>
        ))}
      </div>
    </Layout>
  );
};
export default VisitorEvaluateCompany;
