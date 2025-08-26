import { UserService } from "../../service/api/user";
import type { LoginDTO } from "../../service/api/user/type";
import { useAuth } from "../../auth/useAuth";

const useViewModel = () => {
  const auth = useAuth();
  const userService = new UserService();
  const Login = async (entity: LoginDTO) => {
    const response = await userService
      .reqPostLogin(entity)
      .then((res) => {
        auth?.setCredential(res);
      })
      .catch((error) => {
        console.log(error);
      });
    return response;
  };
  return {
    Login,
  };
};
export default useViewModel;
