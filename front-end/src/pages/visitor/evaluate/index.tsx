import { Layout } from "../../../component/layout";
import { PROTECTED_PATH } from "../../../constant/path.route";
import { useNavigate } from "react-router-dom";
const Evaluate = () => {
  const navigate = useNavigate();
  return (
    <Layout header={[{ path: "", name: "แบบประเมิน" }]}>
      <div>
        <div className="flex justify-between bg-white my-5 p-4 rounded-2xl">
          <p className="mr-auto my-auto font-bold text-xl">
            แบบประเมินนักศึกษา
          </p>
          <button
            className="secondary-button"
            onClick={() => navigate(PROTECTED_PATH.VISITOR_EVALUATE_STUDENT)}
          >
            ประเมิน
          </button>
        </div>
        <div className="flex justify-between bg-white my-5 p-4 rounded-2xl">
          <p className="mr-auto my-auto font-bold text-xl">
            ประเมินสถานประกอบการ
          </p>
          <button
            className="secondary-button"
            onClick={() => navigate(PROTECTED_PATH.VISITOR_EVALUATE_COMPANY)}
          >
            ประเมิน
          </button>
        </div>
      </div>
    </Layout>
  );
};
export default Evaluate;
