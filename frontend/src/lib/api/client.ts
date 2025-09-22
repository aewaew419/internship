'use client';

import { BaseAPI } from "./base";

export class APIClient extends BaseAPI {
  constructor() {
    super({
      baseURL: process.env.NEXT_PUBLIC_API_V1 + "/api/v1",
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// Create a singleton instance for the API client
export const apiClient = new APIClient();