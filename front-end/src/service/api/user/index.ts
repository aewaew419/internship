import { RemoteA } from "../../remote";
import { PROTECTED_PATH, UNPROTECTED_PATH } from "../../../constant/api.route";
import type { UserInterface, LoginDTO } from "./type";
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
  reqPostAddUserByXLSX = async (entity: FormData): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().post(
      PROTECTED_PATH.ADD_USER_XLSX,
      entity
    );
    const { data } = response;
    return data;
  };
}
