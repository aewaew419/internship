import { useMemo } from "react";
import { UserInterface } from "../service/api/user/type";
export const clearToken = async () => {
  return localStorage.removeItem("user_account");
};

export const useToken = () => {
  return useMemo(() => {
    return JSON.parse(
      localStorage.getItem("user_account") ?? "{}"
    ) as UserInterface;
  }, []);
};
