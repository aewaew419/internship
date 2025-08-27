import { StudentService } from "../../../../service/api/student";
import type {
  StudentEvaluateCompanyInterface,
  StudentEvaluateCompanyDTO,
} from "../../../../service/api/student/type";
import { useEffect, useState } from "react";
const useViewModel = (id: number) => {
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
  const handleOnsubmit = (value: StudentEvaluateCompanyDTO) => {
    studentService.putStudentEvaluateCompany(id, value).then((response) => {
      console.log(response);
    });
  };
  useEffect(() => {
    fetchStudentEnrollments();
  }, []);
  return { student, handleOnsubmit };
};
export default useViewModel;
