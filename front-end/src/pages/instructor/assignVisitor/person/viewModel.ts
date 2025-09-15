import { EnrollmentService } from "../../../../service/api/enrollment";
import type { AssignVisitorDTO } from "../../../../service/api/enrollment/type";

import { useState } from "react";

const useViewModel = () => {
  const enrollmentService = new EnrollmentService();
  const [initialValues, setInitialValues] = useState<{
    visitor_instructor_id: string;
  }>({ visitor_instructor_id: "" });
  const handleOnSubmit = async (entity: AssignVisitorDTO) => {
    try {
      await enrollmentService.reqPostVisitorToEnroll(entity);
    } catch (error) {
      console.error("Error submitting student enrollment:", error);
      throw error;
    }
  };
  return {
    initialValues,
    handleOnSubmit,
    setInitialValues,
  };
};
export default useViewModel;
