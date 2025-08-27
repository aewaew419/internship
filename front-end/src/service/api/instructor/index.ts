import { RemoteA } from "../../remote";
import { PROTECTED_PATH } from "../../../constant/api.route";
import type {
  InstructorStudentEnrollStatusInterface,
  InstructorInterface,
} from "./type";
import type { AxiosResponse } from "axios";
import { useToken } from "../../../utils/localStorage";
export class InstructorService extends RemoteA {
  token = useToken();
  instructor_id = this.token.user?.instructors?.id;
  reqGetInstructor = async (): Promise<InstructorInterface[]> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.INSTRUCTOR
    );
    const { data } = response;
    return data;
  };
  reqGetInstructorInternRequestStatus = async (): Promise<
    InstructorStudentEnrollStatusInterface[]
  > => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.INSTRUCTOR_INTERN_REQUEST_STATUS + `/${this.instructor_id}`
    );
    const { data } = response;
    return data;
  };
  reqPutInstructorAttendTraining = async (entity: {
    ids: number[];
    grade: "approve" | "denied";
  }): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().put(
      PROTECTED_PATH.INSTRUCTOR_ATTEND_TRAINING + `/bulk`,
      entity
    );
    const { data } = response;
    return data;
  };
  reqPutInstructorAssignGrade = async (entity: {
    ids: number[];
    grade: "approve" | "denied";
  }): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().put(
      PROTECTED_PATH.INSTRUCTOR_ATTEND_GRADE + `/bulk`,
      entity
    );
    const { data } = response;
    return data;
  };
}
