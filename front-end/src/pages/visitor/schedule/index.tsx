import { Layout } from "../../../component/layout";
import useViewModel from "./viewModel";
import { useNavigate } from "react-router-dom";
import { PROTECTED_PATH } from "../../../constant/path.route";
const VisitorSchedule = () => {
  const { visitors } = useViewModel();
  const navigate = useNavigate();
  return (
    <Layout header={[{ path: "", name: "นัดหมายการนิเทศ" }]}>
      <div>
        {visitors.map((data, key) => (
          <div className="flex gap-5" key={key}>
            <p>{data.id}</p>
            <p>{data.schedules.length}</p>
            <p>{data.studentEnroll.student.name}</p>
            <button
              onClick={() =>
                navigate(
                  PROTECTED_PATH.VISITOR_SCHEDULE_PERSON + `?id=${data.id}`
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
export default VisitorSchedule;
