import { Layout } from "../../../component/layout";
import useViewModel from "./viewModel";
import { useNavigate } from "react-router-dom";
import { PROTECTED_PATH } from "../../../constant/path.route";
import { EditRounded } from "@mui/icons-material";
const StudentEvaluateCompany = () => {
  const navigate = useNavigate();
  const { studentEnrollments } = useViewModel();
  return (
    <Layout header={[{ path: "", name: "แบบประเมิน" }]}>
      <div>
        {studentEnrollments.map((data, index) => {
          return (
            <div>
              {data?.student_training ? (
                <div
                  className="flex gap-5 bg-white my-5 p-4 rounded-2xl"
                  key={index}
                >
                  <p className="mr-auto my-auto font-bold text-xl">
                    สถานประกอบการ :{" "}
                    {data?.student_training?.company?.companyNameTh}
                  </p>
                  <button
                    className="secondary-button"
                    onClick={() =>
                      navigate(
                        PROTECTED_PATH.COMPANY_EVALUAION_PER_COMPANY +
                          `?id=${data.student_training.id}`
                      )
                    }
                  >
                    <EditRounded fontSize="small" />
                    <p>ประเมิน</p>
                  </button>
                </div>
              ) : (
                ""
              )}
            </div>
          );
        })}
      </div>
    </Layout>
  );
};
export default StudentEvaluateCompany;
