import { useState, useEffect } from "react";
import { CourseService } from "../../../../service/api/course";
import { StudentService } from "../../../../service/api/student";
import type { StudentEnrollDTO } from "../../../../service/api/student/type";
import type {
  CourseYearInterface,
  CourseSemesterInterface,
  CourseSectionInterface,
  CourseInterface,
} from "../../../../service/api/course/type";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { PROTECTED_PATH } from "../../../../constant/path.route";

const useViewModel = (id: number) => {
  const navigate = useNavigate();
  const courseService = new CourseService();
  const studentService = new StudentService();

  const [courseYears, setCourseYears] = useState<CourseYearInterface[]>([]);
  const [courseSemesters, setCourseSemesters] = useState<
    CourseSemesterInterface[]
  >([]);
  const [courseSections, setCourseSections] = useState<
    CourseSectionInterface<CourseInterface>[]
  >([]);
  const [initialValues, setInitialValues] = useState({
    year: "",
    semesterm: "",
    student_id: 1,
    course_section_id: 0,
    document_language: "th",

    company_register_number: "",
    company_name_en: "",
    company_name_th: "",
    company_address: "",
    company_map: "",
    company_email: "",
    company_phone_number: "",
    company_type: "",
    picture_1: "",
    picture_2: "",
    start_date: "",
    end_date: "",
    coordinator: "",
    coordinator_phone_number: "",
    coordinator_email: "",
    supervisor: "",
    supervisor_phone_number: "",
    supervisor_email: "",
    department: "",
    position: "",
    job_description: "",
  });
  const fetchStudentEnrollmentById = async () => {
    try {
      const data = await studentService.reqGetStudentEnrollmentById(id);
      setInitialValues({
        year: String(data.course_section.year),
        semesterm: String(data.course_section.semester),

        student_id: data.studentId,
        course_section_id: data.courseSectionId,
        document_language: data.student_training?.documentLanguage,

        company_register_number:
          data.student_training.company.companyRegisterNumber,
        company_name_en: data.student_training.company.companyNameEn || "",
        company_name_th: data.student_training.company.companyNameTh,
        company_address: data.student_training.company.companyAddress,
        company_map: data.student_training.company.companyMap,
        company_email: data.student_training.company.companyEmail,
        company_phone_number: data.student_training.company.companyPhoneNumber,
        company_type: data.student_training.company.companyType,
        picture_1:
          data.student_training.company?.company_picture?.[0]?.picture || "",
        picture_2:
          data.student_training.company?.company_picture?.[1]?.picture || "",

        start_date: data.student_training.startDate,
        end_date: data.student_training.endDate,
        coordinator: data.student_training.coordinator,
        coordinator_phone_number: data.student_training.coordinatorPhoneNumber,
        coordinator_email: data.student_training.coordinatorEmail,
        supervisor: data.student_training.supervisor,
        supervisor_phone_number: data.student_training.supervisorPhoneNumber,
        supervisor_email: data.student_training.supervisorEmail,
        department: data.student_training.department,
        position: data.student_training.position,
        job_description: data.student_training.jobDescription,
      });
    } catch (error) {
      console.error("Error fetching student enrollment:", error);
      throw error;
    }
  };
  const handleOnSubmitStudentEnrollment = async (entity: StudentEnrollDTO) => {
    try {
      if (id) {
        await studentService.reqPutStudentEnrollment(id, entity);

        const formdata_1 = new FormData();
        if (entity.picture_1 instanceof File) {
          formdata_1.append("picture_1", entity.picture_1);
          await studentService.putStudentEnrollmentPicture(id, formdata_1);
        }
        const formdata_2 = new FormData();
        if (entity.picture_2 instanceof File) {
          formdata_2.append("picture_2", entity.picture_2);
          await studentService.putStudentEnrollmentPicture(id, formdata_2);
        }
      } else {
        const studentEnroll = await studentService.reqPostStudentEnrollment(
          entity
        );

        const formdata_1 = new FormData();
        if (entity.picture_1 instanceof File) {
          formdata_1.append("picture_1", entity.picture_1);
          await studentService.putStudentEnrollmentPicture(
            studentEnroll?.id || 0,
            formdata_1
          );
        }
        const formdata_2 = new FormData();
        if (entity.picture_2 instanceof File) {
          formdata_2.append("picture_2", entity.picture_2);
          await studentService.putStudentEnrollmentPicture(
            studentEnroll?.id || 0,
            formdata_2
          );
        }
      }
      Swal.fire({
        title: "บันทึกข้อมูลสำเร็จ",
        icon: "success",
        confirmButtonText: "ปิด",
        confirmButtonColor: "#966033",
      });
      navigate(PROTECTED_PATH.INTERN_REQUEST);
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
  const fetchCourseYears = async () => {
    try {
      const response = await courseService.reqGetCourseYears();
      setCourseYears(response);
    } catch (error) {
      console.error("Error fetching course years:", error);
    }
  };

  const fetchCourseSemesters = async (year: number) => {
    try {
      const response = await courseService.reqGetCourseSemesters(year);
      setCourseSemesters(response);
    } catch (error) {
      console.error("Error fetching course semesters:", error);
    }
  };

  const fetchCourseSections = async (year: number, semester: number) => {
    try {
      const response = await courseService.reqGetCourseSectionsById(
        year,
        semester
      );
      setCourseSections(response);
    } catch (error) {
      console.error("Error fetching course sections:", error);
    }
  };
  useEffect(() => {
    fetchCourseYears();
    fetchStudentEnrollmentById();
  }, []);

  return {
    initialValues,
    courseYears,
    courseSemesters,
    courseSections,
    fetchCourseYears,
    fetchCourseSemesters,
    fetchCourseSections,
    handleOnSubmitStudentEnrollment,
  };
};

export default useViewModel;
