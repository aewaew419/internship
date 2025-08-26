import { RemoteA } from "../../remote";
import { PROTECTED_PATH } from "../../../constant/api.route";
import type {
  VisitorInterface,
  VisitorScheduleDTO,
  VisitorScheduleReportInterface,
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
}
