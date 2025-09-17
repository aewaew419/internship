import { StudentService } from "../../../../service/api/student";
import type {
  StudentEvaluateCompanyInterface,
  StudentEvaluateCompanyDTO,
} from "../../../../service/api/student/type";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { PROTECTED_PATH } from "../../../../constant/path.route";

const useViewModel = (id: number) => {
  const navigate = useNavigate();
  const studentService = new StudentService();
  const [student, setStudentEnrollments] = useState<
    StudentEvaluateCompanyInterface[]
  >([]);

  const fetchStudentEnrollments = () => {
    studentService
      .getStudentEvaluateCompany(id)
      .then((response) => {
        setStudentEnrollments(response);
      })
      .catch((error) => {
        console.error("Error fetching student enrollments:", error);
      });
  };
  const handleOnsubmit = async (value: StudentEvaluateCompanyDTO) => {
    try {
      await studentService
        .putStudentEvaluateCompany(id, value)
        .then((response) => {
          console.log(response);
        });
      Swal.fire({
        title: "บันทึกข้อมูลสำเร็จ",
        icon: "success",
        confirmButtonText: "ปิด",
        confirmButtonColor: "#966033",
      });
      navigate(PROTECTED_PATH.EVALUTAE_COMPANY);
    } catch (err) {
      Swal.fire({
        title: "บันทึกข้อมูลไม่สำเร็จ",
        icon: "error",
        confirmButtonText: "ปิด",
        confirmButtonColor: "#966033",
      });
      console.error(err);
    }
  };
  useEffect(() => {
    fetchStudentEnrollments();
  }, []);
  return { student, handleOnsubmit };
};
export default useViewModel;
