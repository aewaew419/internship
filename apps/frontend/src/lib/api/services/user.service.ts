'use client';

import { apiClient } from '../client';
import { PROTECTED_PATH, UNPROTECTED_PATH } from '../../../constants/api-routes';
import type {
  UserInterface,
  LoginDTO,
  UserListInterface,
  InstructorInterface,
} from '../../../types/api';
import type { AxiosResponse } from 'axios';

export class UserService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginDTO): Promise<UserInterface> {
    const response = await apiClient.getAxiosInstance().post(
      UNPROTECTED_PATH.LOGIN,
      credentials
    );
    return response.data;
  }

  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<any> {
    const response = await apiClient.getAxiosInstance().get(
      PROTECTED_PATH.USER_DATA
    );
    return response.data;
  }

  /**
   * Upload users via Excel file
   */
  async uploadUsersFromExcel(formData: FormData): Promise<AxiosResponse> {
    const response = await apiClient.getAxiosInstance().post(
      PROTECTED_PATH.ADD_USER_XLSX,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Get all users
   */
  async getUsers(): Promise<UserListInterface[]> {
    const response = await apiClient.getAxiosInstance().get(PROTECTED_PATH.USERS);
    return response.data;
  }

  /**
   * Delete multiple users
   */
  async deleteUsers(userIds: number[]): Promise<AxiosResponse> {
    const response = await apiClient.getAxiosInstance().delete(
      PROTECTED_PATH.DELETED_USER,
      { data: { ids: userIds } }
    );
    return response.data;
  }

  /**
   * Get all instructors
   */
  async getInstructors(): Promise<InstructorInterface[]> {
    const response = await apiClient.getAxiosInstance().get(
      PROTECTED_PATH.INSTRUCTOR
    );
    return response.data;
  }

  /**
   * Login with retry mechanism for mobile networks
   */
  async loginWithRetry(credentials: LoginDTO): Promise<UserInterface> {
    return apiClient.retryRequest(() => this.login(credentials));
  }
}

// Export singleton instance
export const userService = new UserService();