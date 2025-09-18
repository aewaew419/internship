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
  EvaluationStatusResponse,
  SubmissionResponse,
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
    try {
      const response = await this.getAxiosInstance().get(
        PROTECTED_PATH.STUDENT_EVALUATE_COMPANY + `/${id}`
      );
      const { data } = response;
      return data;
    } catch (error: any) {
      // Re-throw with additional context for better error handling
      if (error.response?.status === 404) {
        throw new Error('Company not found or invalid student training ID');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized access - please log in');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden - you can only view your own evaluations');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid request - please check the company ID');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error - please try again later');
      }
      throw error;
    }
  };

  putStudentEvaluateCompany = async (
    id: number,
    entity: StudentEvaluateCompanyDTO
  ): Promise<SubmissionResponse> => {
    try {
      const response = await this.getAxiosInstance().put(
        PROTECTED_PATH.STUDENT_EVALUATE_COMPANY + `/${id}`,
        entity
      );
      const { data } = response;
      return data;
    } catch (error: any) {
      // Re-throw with additional context for better error handling
      if (error.response?.status === 404) {
        throw new Error('Student training not found');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized access');
      } else if (error.response?.status === 422) {
        throw new Error('Validation failed - please check your input');
      }
      throw error;
    }
  };

  checkEvaluationStatus = async (
    studentTrainingId: number
  ): Promise<EvaluationStatusResponse> => {
    try {
      const response = await this.getAxiosInstance().get(
        PROTECTED_PATH.STUDENT_EVALUATE_COMPANY + `/${studentTrainingId}/status`
      );
      const { data } = response;
      return data;
    } catch (error: any) {
      // Re-throw with additional context for better error handling
      if (error.response?.status === 404) {
        throw new Error('Company not found or invalid student training ID');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized access');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden - evaluation not allowed');
      }
      throw error;
    }
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
