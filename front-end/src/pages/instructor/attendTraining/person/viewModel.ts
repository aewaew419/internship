import { StudentService } from "../../../../service/api/student";
import { InstructorService } from "../../../../service/api/instructor";

import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { PROTECTED_PATH } from "../../../../constant/path.route";

import Swal from "sweetalert2";

const useViewModel = (id: number) => {
  const studentService = new StudentService();
  const instructorService = new InstructorService();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<{
    attend_training: string;
  }>({ attend_training: "" });
  const fetchStudentGrade = async () => {
    try {
      await studentService.reqGetStudentEnrollmentById(id).then((res) => {
        setInitialValues({
          attend_training: res.attendTraining as "approve" | "denied",
        });
      });
    } catch (err) {
      console.error(err);
    }
  };
  const handleOnSubmitStudentEnrollmentAttendTraining = async (
    id: number,
    attend_training: "approve" | "denied"
  ) => {
    try {
      await instructorService.reqPutInstructorAttendTraining({
        ids: [id],
        grade: attend_training,
      });
      Swal.fire({
        title: "บันทึกข้อมูลสำเร็จ",
        icon: "success",
        confirmButtonText: "ปิด",
        confirmButtonColor: "#966033",
      });
      navigate(PROTECTED_PATH.ATTEND_TRAINING);
    } catch (error) {
      console.error("Error submitting student enrollment:", error);
      Swal.fire({
        title: "บันทึกข้อมูลไม่สำเร็จ",
        icon: "error",
        confirmButtonText: "ปิด",
        confirmButtonColor: "#966033",
      });
      throw error;
    }
  };
  useEffect(() => {
    fetchStudentGrade();
  }, []);
  return {
    initialValues,
    handleOnSubmitStudentEnrollmentAttendTraining,
    setInitialValues,
  };
};
export default useViewModel;
