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
    grade: string;
  }>({ grade: "" });

  const fetchStudentGrade = async () => {
    try {
      await studentService.reqGetStudentEnrollmentById(id).then((res) => {
        console.log(res);

        setInitialValues({
          grade: res.grade as "approve" | "denied" | "pending",
        });
      });
    } catch (err) {
      console.error(err);
    }
  };
  const handleOnSubmitStudentEnrollmentGrade = async (
    id: number,
    grade: "approve" | "denied"
  ) => {
    try {
      await instructorService.reqPutInstructorAssignGrade({
        ids: [id],
        grade: grade,
      });
      Swal.fire({
        title: "บันทึกข้อมูลสำเร็จ",
        icon: "success",
        confirmButtonText: "ปิด",
        confirmButtonColor: "#966033",
      });
      navigate(PROTECTED_PATH.ASSIGN_GRADE);
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
    handleOnSubmitStudentEnrollmentGrade,
    setInitialValues,
  };
};

export default useViewModel;
