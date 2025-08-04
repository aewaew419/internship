import { RemoteA } from "../../remote";
import { UNPROTECTED_PATH } from "../../../constant/api.route";
import type { UserInterface, LoginDTO } from "./type";

export class UserService extends RemoteA {
  reqPostLogin = async (entity: LoginDTO): Promise<UserInterface> => {
    const response = await this.getAxiosInstance().post(
      UNPROTECTED_PATH.LOGIN,
      entity
    );
    const { data } = response;
    return data;
  };
}
