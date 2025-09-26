import { EnrollmentService } from "../../../../service/api/enrollment";
import type { EnrollStatusDTO } from "../../../../service/api/enrollment/type";
import { useNavigate } from "react-router-dom";
import { PROTECTED_PATH } from "../../../../constant/path.route";
import { useState, useEffect } from "react";

import Swal from "sweetalert2";

const useViewModel = (id: number) => {
  const enrollmentService = new EnrollmentService();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<{
    student_enroll_status: string;
    remarks: string;
  }>({ student_enroll_status: "", remarks: "" });
  const fetchEnrollStatus = async () => {
    try {
      await enrollmentService.reqGetStudentEnrollStatusById(id).then((data) =>
        setInitialValues({
          student_enroll_status: data.status,
          remarks: data.status === "approve" ? "" : data.remarks || "",
        })
      );
    } catch (err) {
      console.error(err);
    }
  };
  const handleOnSubmitStudentEnrollmentStatus = async (
    entity: EnrollStatusDTO
  ) => {
    try {
      await enrollmentService.reqPutStudentEnrollStatus(entity);
      Swal.fire({
        title: "บันทึกข้อมูลสำเร็จ",
        icon: "success",
        confirmButtonText: "ปิด",
        confirmButtonColor: "#966033",
      });
      navigate(PROTECTED_PATH.INSTRUCTOR_INTERN_REQUEST);
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
    fetchEnrollStatus();
  }, []);
  return {
    initialValues,
    handleOnSubmitStudentEnrollmentStatus,
    setInitialValues,
  };
};
export default useViewModel;
