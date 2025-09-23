import { StudentService } from "../../service/api/student";
import { EnrollmentService } from "../../service/api/enrollment";
import { useState, useEffect } from "react";
import type { StudentEnrollRegisterInteface } from "../../service/api/student/type";
import type { EnrollApproveCount } from "../../service/api/enrollment/type";
const useViewModel = (id: number) => {
  const studentService = new StudentService();
  const enrollmentService = new EnrollmentService();
  const [studentEnrollments, setStudentEnrollments] =
    useState<StudentEnrollRegisterInteface>();
  const [count, setCount] = useState<EnrollApproveCount>();

  useEffect(() => {
    studentService
      .reqGetStudentEnrollmentById(id)
      .then((response) => {
        setStudentEnrollments(response);
      })
      .catch((error) => {
        console.error("Error fetching student enrollments:", error);
      });
    enrollmentService
      .reqGetStudentEnrollmentApproveCountByID(id)
      .then((response) => {
        setCount(response);
      })
      .catch((error) => {
        console.error("Error fetching student enrollments:", error);
      });
  }, []);
  return { studentEnrollments, count };
};
export default useViewModel;
