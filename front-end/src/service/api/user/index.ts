import { RemoteA } from "../../remote";
import { PROTECTED_PATH, UNPROTECTED_PATH } from "../../../constant/api.route";
import type {
  UserInterface,
  LoginDTO,
  UserListInterface,
  InstructorInterface,
} from "./type";
import type { AxiosResponse } from "axios";

export class UserService extends RemoteA {
  reqPostLogin = async (entity: LoginDTO): Promise<UserInterface> => {
    const response = await this.getAxiosInstance().post(
      UNPROTECTED_PATH.LOGIN,
      entity
    );
    const { data } = response;
    return data;
  };
  reqGetUserService = async (): Promise<any> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.USER_DATA
    );
    const { data } = response;
    return data;
  };
  reqPostAddUserByXLSX = async (entity: FormData): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().post(
      PROTECTED_PATH.ADD_USER_XLSX,
      entity
    );
    const { data } = response;
    return data;
  };
  reqGetUsers = async (): Promise<UserListInterface[]> => {
    const response = await this.getAxiosInstance().get(PROTECTED_PATH.USERS);
    const { data } = response;
    return data;
  };
  reqDeletedUsers = async (entity: {
    ids: number[];
  }): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().delete(
      PROTECTED_PATH.DELETED_USER,
      { data: entity }
    );
    const { data } = response;
    return data;
  };
  reqGetInstructor = async (): Promise<InstructorInterface[]> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.INSTRUCTOR
    );
    const { data } = response;
    return data;
  };
}
