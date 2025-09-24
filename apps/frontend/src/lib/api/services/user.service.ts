'use client';

import { apiClient } from '../client';
import { PROTECTED_PATH, UNPROTECTED_PATH } from '../../../constants/api-routes';
import type {
  UserInterface,
  LoginDTO,
  StudentLoginDTO,
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
   * Login student with student_id and password
   */
  async studentLogin(credentials: StudentLoginDTO): Promise<UserInterface> {
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

  /**
   * Student login with retry mechanism for mobile networks
   */
  async studentLoginWithRetry(credentials: StudentLoginDTO): Promise<UserInterface> {
    return apiClient.retryRequest(() => this.studentLogin(credentials));
  }

  /**
   * Admin login with email and password
   */
  async adminLogin(credentials: LoginDTO): Promise<UserInterface> {
    const response = await apiClient.getAxiosInstance().post(
      UNPROTECTED_PATH.ADMIN_LOGIN,
      credentials
    );
    return response.data;
  }

  /**
   * Admin login with retry mechanism for mobile networks
   */
  async adminLoginWithRetry(credentials: LoginDTO): Promise<UserInterface> {
    return apiClient.retryRequest(() => this.adminLogin(credentials));
  }

  /**
   * Register new user
   */
  async register(registrationData: {
    student_id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<UserInterface> {
    const response = await apiClient.getAxiosInstance().post(
      UNPROTECTED_PATH.REGISTER,
      registrationData
    );
    return response.data;
  }

  /**
   * Register with retry mechanism for mobile networks
   */
  async registerWithRetry(registrationData: {
    student_id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<UserInterface> {
    return apiClient.retryRequest(() => this.register(registrationData));
  }

  /**
   * Check if student ID is available
   */
  async checkStudentIdAvailability(studentId: string): Promise<{ available: boolean; message?: string }> {
    const response = await apiClient.getAxiosInstance().post(
      UNPROTECTED_PATH.CHECK_STUDENT_ID,
      { student_id: studentId }
    );
    return response.data;
  }

  /**
   * Check if email is available
   */
  async checkEmailAvailability(email: string): Promise<{ available: boolean; message?: string }> {
    const response = await apiClient.getAxiosInstance().post(
      UNPROTECTED_PATH.CHECK_EMAIL,
      { email }
    );
    return response.data;
  }

  /**
   * Check student ID availability with retry mechanism
   */
  async checkStudentIdAvailabilityWithRetry(studentId: string): Promise<{ available: boolean; message?: string }> {
    return apiClient.retryRequest(() => this.checkStudentIdAvailability(studentId));
  }

  /**
   * Check email availability with retry mechanism
   */
  async checkEmailAvailabilityWithRetry(email: string): Promise<{ available: boolean; message?: string }> {
    return apiClient.retryRequest(() => this.checkEmailAvailability(email));
  }

  /**
   * Send forgot password email
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.getAxiosInstance().post(
      UNPROTECTED_PATH.FORGOT_PASSWORD,
      { email }
    );
    return response.data;
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string, confirmPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.getAxiosInstance().post(
      UNPROTECTED_PATH.RESET_PASSWORD,
      { 
        token, 
        password, 
        password_confirmation: confirmPassword 
      }
    );
    return response.data;
  }

  /**
   * Send forgot password email with retry mechanism
   */
  async forgotPasswordWithRetry(email: string): Promise<{ success: boolean; message: string }> {
    return apiClient.retryRequest(() => this.forgotPassword(email));
  }

  /**
   * Reset password with retry mechanism
   */
  async resetPasswordWithRetry(token: string, password: string, confirmPassword: string): Promise<{ success: boolean; message: string }> {
    return apiClient.retryRequest(() => this.resetPassword(token, password, confirmPassword));
  }
}

// Export singleton instance
export const userService = new UserService();