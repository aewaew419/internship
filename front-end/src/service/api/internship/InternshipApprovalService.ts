import { RemoteA } from "../../remote";
import type { AxiosResponse } from "axios";
import type {
  ApprovalStatusData,
  CommitteeVotingData,
  InternshipApprovalStatus,
  AdvisorApplicationData
} from "./type";

/**
 * InternshipApprovalService - API integration for internship approval workflow
 * Extends RemoteA base class for consistent API communication
 * Based on requirements 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 6.1, 6.2, 6.3
 */
export class InternshipApprovalService extends RemoteA {
  
  /**
   * Get current approval status for a student enrollment
   * Based on requirements 1.1, 1.2, 6.1
   */
  async getApprovalStatus(studentEnrollId: number): Promise<ApprovalStatusData> {
    try {
      const response: AxiosResponse<ApprovalStatusData> = await this.getAxiosInstance().get(
        `/student/enrollments/${studentEnrollId}/approval-status`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Student enrollment not found or invalid ID');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized access - please log in');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden - you can only view your own approval status');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error - please try again later');
      } else {
        throw new Error(`Failed to get approval status: ${error.message}`);
      }
    }
  }

  /**
   * Submit advisor approval decision
   * Based on requirements 2.1, 2.2, 6.2
   */
  async submitAdvisorApproval(
    studentEnrollId: number, 
    approved: boolean, 
    remarks?: string
  ): Promise<void> {
    try {
      await this.getAxiosInstance().post(
        `/student/enrollments/${studentEnrollId}/advisor-approval`,
        { approved, remarks }
      );
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Student enrollment not found');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized access - please log in');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden - you are not authorized to approve this application');
      } else if (error.response?.status === 422) {
        throw new Error('Validation failed - invalid approval data');
      } else if (error.response?.status === 409) {
        throw new Error('Approval conflict - this application may have already been processed');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error - please try again later');
      } else {
        throw new Error(`Failed to submit advisor approval: ${error.message}`);
      }
    }
  }
  /**
  
 * Submit committee member vote
   * Based on requirements 3.1, 3.2, 6.3
   */
  async submitCommitteeVote(
    studentEnrollId: number, 
    vote: 'approve' | 'reject',
    remarks?: string
  ): Promise<void> {
    try {
      await this.getAxiosInstance().post(
        `/student/enrollments/${studentEnrollId}/committee-vote`,
        { vote, remarks }
      );
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Student enrollment not found');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized access - please log in');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden - you are not authorized to vote on this application');
      } else if (error.response?.status === 422) {
        throw new Error('Validation failed - invalid vote data');
      } else if (error.response?.status === 409) {
        throw new Error('Vote conflict - you may have already voted on this application');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error - please try again later');
      } else {
        throw new Error(`Failed to submit committee vote: ${error.message}`);
      }
    }
  }

  /**
   * Get committee voting status and progress
   * Based on requirements 3.1, 3.2, 6.1
   */
  async getCommitteeVotingStatus(studentEnrollId: number): Promise<CommitteeVotingData> {
    try {
      const response: AxiosResponse<CommitteeVotingData> = await this.getAxiosInstance().get(
        `/student/enrollments/${studentEnrollId}/committee-voting`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Student enrollment not found or no committee voting data available');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized access - please log in');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden - you are not authorized to view committee voting data');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error - please try again later');
      } else {
        throw new Error(`Failed to get committee voting status: ${error.message}`);
      }
    }
  }

  /**
   * Update approval status (administrative function)
   * Based on requirements 4.1, 4.2, 6.2
   */
  async updateApprovalStatus(
    studentEnrollId: number, 
    newStatus: InternshipApprovalStatus, 
    reason?: string
  ): Promise<void> {
    try {
      await this.getAxiosInstance().put(
        `/student/enrollments/${studentEnrollId}/approval-status`,
        { status: newStatus, reason }
      );
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Student enrollment not found');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized access - please log in');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden - you are not authorized to update approval status');
      } else if (error.response?.status === 422) {
        throw new Error('Validation failed - invalid status transition');
      } else if (error.response?.status === 409) {
        throw new Error('Status conflict - invalid status transition');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error - please try again later');
      } else {
        throw new Error(`Failed to update approval status: ${error.message}`);
      }
    }
  }

  /**
   * Get pending advisor applications for the current advisor
   * Based on requirements 2.1, 2.2, 6.1
   */
  async getAdvisorPendingApplications(filters?: {
    search?: string;
    major?: string;
    company?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdvisorApplicationData[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.major) params.append('major', filters.major);
      if (filters?.company) params.append('company', filters.company);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response: AxiosResponse<AdvisorApplicationData[]> = await this.getAxiosInstance().get(
        `/advisor/pending-applications${params.toString() ? '?' + params.toString() : ''}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Unauthorized access - please log in');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden - you are not authorized to view advisor applications');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error - please try again later');
      } else {
        throw new Error(`Failed to get advisor applications: ${error.message}`);
      }
    }
  }
}