import { useState, useEffect } from "react";
import { StudentService } from "../../../../service/api/student";
import type {
  StudentInterface,
  StudentDTO,
} from "../../../../service/api/student/type";
import { UniversityService } from "../../../../service/api/university";
import type {
  FaculyInterface,
  ProgramInterface,
  CurriculumInterface,
} from "../../../../service/api/university/type";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { PROTECTED_PATH } from "../../../../constant/path.route";
const useViewModel = () => {
  const navigate = useNavigate();
  const studentService = new StudentService();
  const universityService = new UniversityService();
  const [initialValues, setStudentInfo] = useState<StudentInterface>({
    id: 0,
    userId: 0,
    studentId: "",
    name: "",
    middleName: "",
    surname: "",
    gpax: 0,
    phoneNumber: "",
    email: "",
    picture: "",
    curriculumId: "",
    programId: "",
    facultyId: "",
    majorId: "",
    campusId: "",
  } as StudentInterface);
  const [faculties, setFaculties] = useState<FaculyInterface[]>([]);
  const [programs, setPrograms] = useState<ProgramInterface[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumInterface[]>([]);

  const getStudentInformation = async () => {
    try {
      const response = await studentService.reqGetStudentInformation();
      setStudentInfo(response);
    } catch (error) {
      console.error("Error fetching student information:", error);
    }
  };
  const handleOnSubmitStudentInformation = async (entity: StudentDTO) => {
    try {
      await studentService.reqPutStudentInformation(entity as StudentDTO);

      const formData = new FormData();
      if (entity?.picture) {
        formData.append("picture", entity.picture);
        await studentService.reqPutStudentInformation(formData as FormData);
      }
      Swal.fire({
        title: "บันทึกข้อมูลสำเร็จ",
        icon: "success",
        confirmButtonText: "ปิด",
        confirmButtonColor: "#966033",
      });
      navigate(PROTECTED_PATH.INTERN_REQUEST);
    } catch (error) {
      console.error("Error updating student information:", error);
      Swal.fire({
        title: "บันทึกข้อมูลไม่สำเร็จ",
        icon: "error",
        confirmButtonText: "ปิด",
        confirmButtonColor: "#966033",
      });
    }
  };
  const fetchFaculties = async () => {
    try {
      const response = await universityService.reqGetFaculties();
      setFaculties(response);
    } catch (error) {
      console.error("Error fetching faculties:", error);
    }
  };
  const fetchPrograms = async () => {
    try {
      const response = await universityService.reqGetPrograms();
      setPrograms(response);
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  };
  const fetchCurriculums = async () => {
    try {
      const response = await universityService.reqGetCurriculums();
      setCurriculums(response);
    } catch (error) {
      console.error("Error fetching curriculums:", error);
    }
  };

  useEffect(() => {
    getStudentInformation();
    fetchFaculties();
  }, []);
  return {
    initialValues,
    faculties,
    programs,
    curriculums,
    fetchPrograms,
    fetchCurriculums,
    handleOnSubmitStudentInformation,
  };
};
export default useViewModel;
