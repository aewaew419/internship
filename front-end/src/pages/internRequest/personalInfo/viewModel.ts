import { useState, useEffect } from "react";
import { StudentService } from "../../../service/api/student";
import type {
  StudentInterface,
  StudentDTO,
  StudentEnrollRegisterInteface,
} from "../../../service/api/student/type";
import { UniversityService } from "../../../service/api/university";
import type {
  CampusInterface,
  FaculyInterface,
  ProgramInterface,
  CurriculumInterface,
  MajorInterface,
} from "../../../service/api/university/type";
const useViewModel = () => {
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

  const getStudentInformation = async (studentId: number) => {
    try {
      const response = await studentService.reqGetStudentInformation(studentId);
      setStudentInfo(response);
    } catch (error) {
      console.error("Error fetching student information:", error);
    }
  };
  const handleOnSubmitStudentInformation = async (
    studentId: number,
    entity: StudentDTO
  ) => {
    try {
      await studentService.reqPutStudentInformation(studentId, entity);
      console.log("Student information updated successfully");
    } catch (error) {
      console.error("Error updating student information:", error);
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
  const fetchPrograms = async (id: number) => {
    try {
      const response = await universityService.reqGetPrograms();
      setPrograms(response);
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  };
  const fetchCurriculums = async (id: number) => {
    try {
      const response = await universityService.reqGetCurriculums();
      setCurriculums(response);
    } catch (error) {
      console.error("Error fetching curriculums:", error);
    }
  };

  useEffect(() => {
    getStudentInformation(1);
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
