import { RemoteA } from "../../remote";
import { PROTECTED_PATH } from "../../../constant/api.route";
import {
  InstructorStudentEnrollStatusInterface,
  InstructorInterface,
} from "./type";
export class InstructorService extends RemoteA {
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
      PROTECTED_PATH.INSTRUCTOR_INTERN_REQUEST_STATUS + `/3`
    );
    const { data } = response;
    return data;
  };
}
