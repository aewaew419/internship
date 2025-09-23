import { RemoteA } from "../../remote";
import { PROTECTED_PATH } from "../../../constant/api.route";
import type {
  CampusInterface,
  FaculyInterface,
  ProgramInterface,
  CurriculumInterface,
  MajorInterface,
} from "./type";

export class UniversityService extends RemoteA {
  reqGetCampus = async (): Promise<CampusInterface[]> => {
    const response = await this.getAxiosInstance().get(PROTECTED_PATH.CAMPUS);
    const { data } = response;
    return data;
  };
  reqGetCampusById = async (campusId: number): Promise<CampusInterface> => {
    const response = await this.getAxiosInstance().get(
      `${PROTECTED_PATH.CAMPUS}?id=${campusId}`
    );
    const { data } = response;
    return data;
  };

  reqGetFaculties = async (): Promise<FaculyInterface[]> => {
    const response = await this.getAxiosInstance().get(PROTECTED_PATH.FACULTY);
    const { data } = response;
    return data;
  };
  reqGetFacultyById = async (facultyId: number): Promise<FaculyInterface> => {
    const response = await this.getAxiosInstance().get(
      `${PROTECTED_PATH.FACULTY}?id=${facultyId}`
    );
    const { data } = response;
    return data;
  };

  reqGetPrograms = async (): Promise<ProgramInterface[]> => {
    const response = await this.getAxiosInstance().get(PROTECTED_PATH.PROGRAM);
    const { data } = response;
    return data;
  };
  reqGetProgramById = async (programId: number): Promise<ProgramInterface> => {
    const response = await this.getAxiosInstance().get(
      `${PROTECTED_PATH.PROGRAM}?id=${programId}`
    );
    const { data } = response;
    return data;
  };

  reqGetCurriculums = async (): Promise<CurriculumInterface[]> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.CURRICULUM
    );
    const { data } = response;
    return data;
  };
  reqGetCurriculumById = async (
    curriculumId: number
  ): Promise<CurriculumInterface> => {
    const response = await this.getAxiosInstance().get(
      `${PROTECTED_PATH.CURRICULUM}?id=${curriculumId}`
    );
    const { data } = response;
    return data;
  };

  reqGetMajors = async (): Promise<MajorInterface[]> => {
    const response = await this.getAxiosInstance().get(PROTECTED_PATH.MAJOR);
    const { data } = response;
    return data;
  };
  reqGetMajorById = async (majorId: number): Promise<MajorInterface> => {
    const response = await this.getAxiosInstance().get(
      `${PROTECTED_PATH.MAJOR}?id=${majorId}`
    );
    const { data } = response;
    return data;
  };
}
