import { UserService } from "../../service/api/user";
import type { LoginDTO } from "../../service/api/user/type";
import { useAuth } from "../../auth/useAuth";
import { useState } from "react";

const useViewModel = () => {
  const auth = useAuth();
  const userService = new UserService();
  const [err, setErr] = useState(false);
  const handleSetErr = (state: boolean) => {
    setErr(state);
  };
  const Login = async (entity: LoginDTO) => {
    await userService
      .reqPostLogin(entity)
      .then(async (res) => {
        // await userService.reqPostBearerToken(res.access_token);
        auth?.setCredential(res);
      })
      .catch((error) => {
        console.log(error);
        setErr(true);
      });
  };
  return {
    err,
    Login,
    handleSetErr,
  };
};
export default useViewModel;
