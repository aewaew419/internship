import { RemoteA } from "../../remote";
import { PROTECTED_PATH } from "../../../constant/api.route";
import type {
  EnrollStatusDTO,
  EnrollApproveInterface,
  AssignVisitorDTO,
  EnrollApproveCount,
  EnrollStatus,
} from "./type";
import type { AxiosResponse } from "axios";

export class EnrollmentService extends RemoteA {
  reqGetStudentEnrollmentApprove = async (): Promise<
    EnrollApproveInterface[]
  > => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.STUDENT_ENROLLMENT_APPROVE
    );
    const { data } = response;
    return data;
  };
  reqGetStudentEnrollmentApproveCountByID = async (
    id: number
  ): Promise<EnrollApproveCount> => {
    const response = await this.getAxiosInstance().get(
      "/student-enrolls/" + id + "/approval-counts"
    );
    const { data } = response;
    return data;
  };
  reqGetStudentEnrollStatusById = async (id: number): Promise<EnrollStatus> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.INSTRUCTOR_STATUS_PERSON + `/${id}`
    );
    const { data } = response;
    return data;
  };
  reqPutStudentEnrollStatus = async (
    entity: EnrollStatusDTO
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().put(
      PROTECTED_PATH.INSTRUCTOR_CHANGE_STATUS_ALL,
      entity
    );
    const { data } = response;
    return data;
  };
  reqPostVisitorToEnroll = async (
    entity: AssignVisitorDTO
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().post(
      PROTECTED_PATH.ASSIGN_VISITOR + "-bulk",
      entity
    );
    const { data } = response;
    return data;
  };
  reqPutVisitorToEnroll = async (
    entity: AssignVisitorDTO
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().put(
      PROTECTED_PATH.ASSIGN_VISITOR,
      entity
    );
    const { data } = response;
    return data;
  };
}
