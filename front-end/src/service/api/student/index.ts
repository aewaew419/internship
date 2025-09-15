import { RemoteA } from "../../remote";
import { PROTECTED_PATH } from "../../../constant/api.route";
import type {
  StudentInterface,
  StudentDTO,
  StudentEnrollDTO,
  StudentEnrollInterface,
  StudentEnrollRegisterInteface,
  StudentEvaluateCompanyDTO,
  StudentEvaluateCompanyInterface,
} from "./type";
import type { AxiosResponse } from "axios";
import { useToken } from "../../../utils/localStorage";

export class StudentService extends RemoteA {
  token = useToken();
  student_id = this.token.user.students?.id;
  reqGetStudentInformation = async (): Promise<StudentInterface> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.STUDENT_INFORMATION + `?id=${this.student_id}`
    );
    const { data } = response;
    return data;
  };

  reqPutStudentInformation = async (
    entity: StudentDTO | FormData
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().put(
      PROTECTED_PATH.STUDENT_INFORMATION + `/${this.student_id}`,
      entity
    );
    const { data } = response;

    return data;
  };

  reqGetStudentEnrollment = async (): Promise<StudentEnrollInterface[]> => {
    const response = await this.getAxiosInstance().get(
      // student id
      PROTECTED_PATH.STUDENT_ENROLLMENT + `/${this.student_id}`
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
  reqPostStudentEnrollment = async (entity: StudentEnrollDTO): Promise<any> => {
    const response = await this.getAxiosInstance().post(
      PROTECTED_PATH.STUDENT_ENROLLMENT,
      { ...entity, student_id: this.student_id }
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
  putStudentEnrollmentPicture = async (
    id: number,
    entity: FormData
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().put(
      PROTECTED_PATH.STUDENT_ENROLLMENT_PICTURE + `/${id}`,
      entity
    );
    const { data } = response;
    return data;
  };

  getStudentEvaluateCompany = async (
    id: number
  ): Promise<StudentEvaluateCompanyInterface[]> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.STUDENT_EVALUATE_COMPANY + `/${id}`
    );
    const { data } = response;
    return data;
  };

  putStudentEvaluateCompany = async (
    id: number,
    entity: StudentEvaluateCompanyDTO
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().put(
      PROTECTED_PATH.STUDENT_EVALUATE_COMPANY + `/${id}`,
      entity
    );
    const { data } = response;
    return data;
  };

  postStudentCoopReqLetter = async (
    id: number,
    lang: "en" | "th",
    entity: {
      docNo: string;
      issueDate: string;
      prefix?: string;
    }
  ): Promise<{
    url: string;
    path: string;
    filename: string;
    size: number;
  }> => {
    const response = await this.getAxiosInstance().post(
      PROTECTED_PATH.STUDENT_COOP_REQ_LETTER + `/${lang}/${id}`,
      entity
    );
    const { data } = response;
    return data;
  };
}
