import { UserService } from "../../service/api/user";
import type { LoginDTO } from "../../service/api/user/type";
const useViewModel = () => {
  const userService = new UserService();
  const Login = async (entity: LoginDTO) => {
    const response = await userService.reqPostLogin(entity);
    return response;
  };
  return {
    Login,
  };
};
export default useViewModel;
