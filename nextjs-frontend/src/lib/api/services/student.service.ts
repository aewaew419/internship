'use client';

import { apiClient } from '../client';
import { PROTECTED_PATH } from '../../../constants/api-routes';
import { getUserFromStorage } from '../base';
import type {
  StudentInterface,
  StudentDTO,
  StudentEnrollDTO,
  StudentEvaluateCompanyDTO,
  EvaluationStatusResponse,
  SubmissionResponse,
} from '../../../types/api';
import type { AxiosResponse } from 'axios';

export class StudentService {
  private getStudentId(): number | null {
    const token = getUserFromStorage();
    return token?.user?.students?.id || null;
  }

  /**
   * Get student information
   */
  async getStudentInformation(): Promise<StudentInterface> {
    const studentId = this.getStudentId();
    if (!studentId) {
      throw new Error('Student ID not found. Please log in again.');
    }

    const response = await apiClient.getAxiosInstance().get(
      `${PROTECTED_PATH.STUDENT_INFORMATION}?id=${studentId}`
    );
    return response.data;
  }

  /**
   * Update student information
   */
  async updateStudentInformation(
    data: StudentDTO | FormData
  ): Promise<AxiosResponse> {
    const studentId = this.getStudentId();
    if (!studentId) {
      throw new Error('Student ID not found. Please log in again.');
    }

    const headers = data instanceof FormData 
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' };

    const response = await apiClient.getAxiosInstance().put(
      `${PROTECTED_PATH.STUDENT_INFORMATION}/${studentId}`,
      data,
      { headers }
    );
    return response.data;
  }

  /**
   * Get student enrollments
   */
  async getStudentEnrollments(): Promise<any[]> {
    const studentId = this.getStudentId();
    if (!studentId) {
      throw new Error('Student ID not found. Please log in again.');
    }

    const response = await apiClient.getAxiosInstance().get(
      `${PROTECTED_PATH.STUDENT_ENROLLMENT}/${studentId}`
    );
    return response.data;
  }

  /**
   * Get student enrollment by ID
   */
  async getStudentEnrollmentById(id: number): Promise<any> {
    const response = await apiClient.getAxiosInstance().get(
      `${PROTECTED_PATH.STUDENT_ENROLLMENT}?id=${id}`
    );
    return response.data;
  }

  /**
   * Create student enrollment
   */
  async createStudentEnrollment(data: StudentEnrollDTO): Promise<any> {
    const studentId = this.getStudentId();
    if (!studentId) {
      throw new Error('Student ID not found. Please log in again.');
    }

    const response = await apiClient.getAxiosInstance().post(
      PROTECTED_PATH.STUDENT_ENROLLMENT,
      { ...data, student_id: studentId }
    );
    return response.data;
  }

  /**
   * Update student enrollment
   */
  async updateStudentEnrollment(
    id: number,
    data: StudentEnrollDTO
  ): Promise<AxiosResponse> {
    const response = await apiClient.getAxiosInstance().put(
      `${PROTECTED_PATH.STUDENT_ENROLLMENT}/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Upload student enrollment picture
   */
  async uploadStudentEnrollmentPicture(
    id: number,
    formData: FormData
  ): Promise<AxiosResponse> {
    const response = await apiClient.getAxiosInstance().put(
      `${PROTECTED_PATH.STUDENT_ENROLLMENT_PICTURE}/${id}`,
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
   * Get student company evaluation
   */
  async getStudentEvaluateCompany(id: number): Promise<any[]> {
    try {
      const response = await apiClient.getAxiosInstance().get(
        `${PROTECTED_PATH.STUDENT_EVALUATE_COMPANY}/${id}`
      );
      return response.data;
    } catch (error: any) {
      // Enhanced error handling for mobile users
      if (error.response?.status === 404) {
        throw new Error('Company not found or invalid student training ID');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized access - please log in');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden - you can only view your own evaluations');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid request - please check the company ID');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error - please try again later');
      }
      throw error;
    }
  }

  /**
   * Submit student company evaluation
   */
  async submitStudentEvaluateCompany(
    id: number,
    data: StudentEvaluateCompanyDTO
  ): Promise<SubmissionResponse> {
    try {
      const response = await apiClient.getAxiosInstance().put(
        `${PROTECTED_PATH.STUDENT_EVALUATE_COMPANY}/${id}`,
        data
      );
      return response.data;
    } catch (error: any) {
      // Enhanced error handling for mobile users
      if (error.response?.status === 404) {
        throw new Error('Student training not found');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized access');
      } else if (error.response?.status === 422) {
        throw new Error('Validation failed - please check your input');
      }
      throw error;
    }
  }

  /**
   * Check evaluation status
   */
  async checkEvaluationStatus(
    studentTrainingId: number
  ): Promise<EvaluationStatusResponse> {
    try {
      const response = await apiClient.getAxiosInstance().get(
        `${PROTECTED_PATH.STUDENT_EVALUATE_COMPANY}/${studentTrainingId}/status`
      );
      return response.data;
    } catch (error: any) {
      // Enhanced error handling for mobile users
      if (error.response?.status === 404) {
        throw new Error('Company not found or invalid student training ID');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized access');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden - evaluation not allowed');
      }
      throw error;
    }
  }

  /**
   * Generate student cooperation request letter
   */
  async generateCoopRequestLetter(
    id: number,
    lang: "en" | "th",
    data: {
      docNo: string;
      issueDate: string;
      prefix?: string;
    }
  ): Promise<{
    url: string;
    path: string;
    filename: string;
    size: number;
  }> {
    const response = await apiClient.getAxiosInstance().post(
      `${PROTECTED_PATH.STUDENT_COOP_REQ_LETTER}/${lang}/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Get student information with retry for mobile networks
   */
  async getStudentInformationWithRetry(): Promise<StudentInterface> {
    return apiClient.retryRequest(() => this.getStudentInformation());
  }

  /**
   * Submit evaluation with retry for mobile networks
   */
  async submitEvaluationWithRetry(
    id: number,
    data: StudentEvaluateCompanyDTO
  ): Promise<SubmissionResponse> {
    return apiClient.retryRequest(() => this.submitStudentEvaluateCompany(id, data));
  }
}

// Export singleton instance
export const studentService = new StudentService();