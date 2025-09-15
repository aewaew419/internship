import { UserService } from "../../service/api/user";

const useViewModel = () => {
  const userService = new UserService();
  const fetchUserData = async () => {
    await userService.reqGetUserService().then((data) => console.log(data));
  };
  return { fetchUserData };
};
export default useViewModel;
