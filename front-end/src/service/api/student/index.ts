import { RemoteA } from "../../remote";
import { PROTECTED_PATH } from "../../../constant/api.route";
import type {
  StudentInterface,
  StudentDTO,
  StudentEnrollDTO,
  StudentEnrollInterface,
  StudentEnrollRegisterInteface,
} from "./type";
import type { AxiosResponse } from "axios";

export class StudentService extends RemoteA {
  reqGetStudentInformation = async (
    student_id: number
  ): Promise<StudentInterface> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.STUDENT_INFORMATION + `?id=${student_id}`
    );
    const { data } = response;
    return data;
  };

  reqPutStudentInformation = async (
    student_id: number,
    entity: StudentDTO
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().put(
      PROTECTED_PATH.STUDENT_INFORMATION + `/${student_id}`,
      entity
    );
    const { data } = response;
    return data;
  };

  reqGetStudentEnrollment = async (): Promise<StudentEnrollInterface[]> => {
    const response = await this.getAxiosInstance().get(
      // student id
      PROTECTED_PATH.STUDENT_ENROLLMENT + `/${1}`
    );
    const { data } = response;
    return data;
  };
  reqGetStudentEnrollmentById = async (
    id: number
  ): Promise<StudentEnrollRegisterInteface> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.STUDENT_ENROLLMENT + `?id=${id}`
    );
    const { data } = response;
    return data;
  };
  reqPostStudentEnrollment = async (
    entity: StudentEnrollDTO
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().post(
      PROTECTED_PATH.STUDENT_ENROLLMENT,
      entity
    );
    const { data } = response;
    return data;
  };
  reqPutStudentEnrollment = async (
    id: number,
    entity: StudentEnrollDTO
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().put(
      PROTECTED_PATH.STUDENT_ENROLLMENT + `/${id}`,
      entity
    );
    const { data } = response;
    return data;
  };
}
