import { useEffect, useState } from "react";
import { EnrollmentService } from "../../service/api/enrollment";
import type { EnrollApproveInterface } from "../../service/api/enrollment/type";

const useViewModel = () => {
  const enrollmentService = new EnrollmentService();
  const [rows, setRows] = useState<EnrollApproveInterface[]>([]);

  useEffect(() => {
    enrollmentService.reqGetStudentEnrollmentApprove().then((response) => {
      setRows(response);
    });
  }, []);
  return { rows };
};
export default useViewModel;
