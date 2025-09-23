import { StudentService } from "../../../service/api/student";
import { EnrollmentService } from "../../../service/api/enrollment";
import { useState, useEffect } from "react";
import type { StudentEnrollRegisterInteface } from "../../../service/api/student/type";
import type { EnrollApproveCount } from "../../../service/api/enrollment/type";
const useViewModel = (id: number) => {
  const studentService = new StudentService();
  const enrollmentService = new EnrollmentService();
  const [studentEnrollments, setStudentEnrollments] =
    useState<StudentEnrollRegisterInteface>();
  const [count, setCount] = useState<EnrollApproveCount>();

  const handleDownloadPDF = async (entity: {
    docNo: string;
    issueDate: string;
    prefix?: string;
  }) => {
    // Open a blank tab immediately (prevents popup blockers)
    const newTab = window.open("", "_blank");

    try {
      const res = await studentService.postStudentCoopReqLetter(
        id,
        studentEnrollments?.student_training.documentLanguage || "th",
        entity
      );
      const { path } = res;
      // CASE 1: API already gives you a URL (string or { url })
      const newTabPath = `${import.meta.env.VITE_APP_API_V1}${path}`;

      if (newTab) newTab.location.href = newTabPath as string;
      else window.open(newTabPath as string, "_blank", "noopener,noreferrer");
      return;
    } catch (err) {
      if (newTab) {
        newTab.document.write("<p>Failed to open letter.</p>");
      }
      console.error(err);
    }
  };

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
  return { studentEnrollments, count, handleDownloadPDF };
};
export default useViewModel;
