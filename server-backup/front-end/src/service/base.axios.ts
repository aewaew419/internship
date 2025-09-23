import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
// import { clearToken } from "../utils/localStorage";
// import type { UserLoginInfo } from "./api/user/type";
// import { useNavigate } from "react-router-dom";
// import { UNPROTECTED_PATH } from "../constants/path.route";

export class BaseAxios {
  private axiosInstance: AxiosInstance;

  constructor(configInstance: AxiosRequestConfig) {
    this.axiosInstance = axios.create(configInstance);

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (err) => {
        this.handleUnAuthorized(err);
        return Promise.reject(err);
      }
    );

    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getToken();

        if (typeof token === "string" && token.trim().length > 0) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
      },
      (err) => {
        return Promise.reject(err);
      }
    );
  }

  getAxiosInstance() {
    return this.axiosInstance;
  }

  private handleUnAuthorized(err: AxiosError) {
    if (window) {
      if (err?.response?.status === 401) {
        // clearToken();
        throw new Error((err.response?.data as AxiosError).message);
      }
    }
  }

  private getToken() {
    return getUserFromStorage()?.access_token ?? null;
  }
}
export function getUserFromStorage(): any {
  // UserLoginInfo | null
  try {
    const raw = localStorage.getItem("user_account");
    if (!raw || raw === "undefined") return null;
    return JSON.parse(raw);
    // as UserLoginInfo;
  } catch {
    return null;
  }
}
