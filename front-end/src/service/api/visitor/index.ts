import { RemoteA } from "../../remote";
import { PROTECTED_PATH } from "../../../constant/api.route";
import type {
  VisitorInterface,
  VisitorScheduleDTO,
  VisitorScheduleReportInterface,
  VisitorEvaluateStudentDTO,
  VisitorEvaluateStudentInterface,
} from "./type";
import type { AxiosResponse } from "axios";
import { useToken } from "../../../utils/localStorage";

export class VisitorService extends RemoteA {
  token = useToken();
  instructor_id = this.token.user?.instructors?.id;
  reqGetVisitor = async (): Promise<VisitorInterface[]> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.VISITOR_VISITOR_TRAINING_LIST + "/" + this.instructor_id
    );
    const { data } = response;
    return data;
  };

  reqGetVisitorSchedule = async (
    training_id: number
  ): Promise<VisitorInterface> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.VISITOR_VISITOR_SCHEDULE_LIST + "/" + training_id
    );
    const { data } = response;
    return data;
  };

  reqPostVisitorSchedule = async (
    entity: VisitorScheduleDTO
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().post(
      PROTECTED_PATH.VISITOR_ASSIGN_SCHEDULE,
      entity
    );
    const { data } = response;
    return data;
  };
  reqPutVisitorSchedule = async (
    id: number,
    entity: VisitorScheduleDTO
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().put(
      PROTECTED_PATH.VISITOR_ASSIGN_SCHEDULE + `/${id}`,
      entity
    );
    const { data } = response;
    return data;
  };
  reqGetVisitorScheduleReport = async (
    schedule_id: number
  ): Promise<VisitorScheduleReportInterface> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.VISITOR_VISITOR_SCHEDULE_REPORT + `/${schedule_id}`
    );

    const { data } = response;
    return data;
  };
  reqGetVisitorEvaluateStudent = async (
    id: number
  ): Promise<VisitorEvaluateStudentInterface[]> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.VISITOR_EVALUATE_STUDENT + `/${id}`
    );

    const { data } = response;
    return data;
  };
  reqGetVisitorEvaluateCompany = async (
    id: number
  ): Promise<VisitorEvaluateStudentInterface[]> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.VISITOR_EVALUATE_COMPANY + `/${id}`
    );

    const { data } = response;
    return data;
  };

  reqPutVisitorEvaluateStudent = async (
    id: number,
    entity: VisitorEvaluateStudentDTO
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().put(
      PROTECTED_PATH.VISITOR_EVALUATE_STUDENT + `/${id}`,
      entity
    );
    const { data } = response;
    return data;
  };
  reqPutVisitorEvaluateCompany = async (
    id: number,
    entity: VisitorEvaluateStudentDTO
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().put(
      PROTECTED_PATH.VISITOR_EVALUATE_COMPANY + `/${id}`,
      entity
    );
    const { data } = response;
    return data;
  };
}
