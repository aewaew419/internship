import { EnrollmentService } from "../../../../service/api/enrollment";
import type { EnrollStatusDTO } from "../../../../service/api/enrollment/type";

import { useState } from "react";

const useViewModel = () => {
  const enrollmentService = new EnrollmentService();
  const [initialValues, setInitialValues] = useState<{
    student_enroll_status: string;
  }>({ student_enroll_status: "" });
  const handleOnSubmitStudentEnrollmentStatus = async (
    entity: EnrollStatusDTO
  ) => {
    try {
      await enrollmentService.reqPutStudentEnrollStatus(entity);
    } catch (error) {
      console.error("Error submitting student enrollment:", error);
      throw error;
    }
  };
  return {
    initialValues,
    handleOnSubmitStudentEnrollmentStatus,
    setInitialValues,
  };
};
export default useViewModel;
