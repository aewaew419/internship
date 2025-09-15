/// <reference types="vite/client" />
import { BaseAxios } from "./base.axios";

// Add this declaration to extend ImportMeta for Vite env variables
// interface ImportMetaEnv {
//   readonly VITE_APP_API_V1: string;
//   // add other env variables here if needed
// }

// interface ImportMeta {
//   readonly env: ImportMetaEnv;
// }

export class RemoteA extends BaseAxios {
  constructor() {
    super({
      baseURL: import.meta.env.VITE_APP_API_V1 + "/api/v1",
      // baseURL: import.meta.env.VITE_APP_API_V1 + "/api",
    });
  }
}
