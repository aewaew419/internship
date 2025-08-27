import { useState, useEffect } from "react";
import { StudentService } from "../../../service/api/student";
import type { StudentEnrollInterface } from "../../../service/api/student/type";
const useViewModel = () => {
  const studentService = new StudentService();
  const [studentEnrollments, setStudentEnrollments] = useState<
    StudentEnrollInterface[]
  >([]);
  const fetchStudentEnrollments = () => {
    studentService
      .reqGetStudentEnrollment()
      .then((response) => {
        setStudentEnrollments(response);
      })
      .catch((error) => {
        console.error("Error fetching student enrollments:", error);
      });
  };
  useEffect(() => {
    fetchStudentEnrollments();
  }, []);
  return {
    studentEnrollments,
  };
};

export default useViewModel;
