import { InternshipApprovalService } from './InternshipApprovalService';
import { 
  executeInternshipApiCall, 
  handleConcurrentUpdateConflict,
  classifyInternshipError,
  getInternshipErrorMessage,
  type InternshipError,
  type ConflictResolutionStrategy
} from './enhanced-error-handling';
import type { 
  ApprovalStatusData,
  CommitteeVotingData,
  InternshipApprovalStatus,
  AdvisorApplicationData
} from './type';

/**
 * Enhanced InternshipApprovalService with comprehensive error handling
 * Based on requirements 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 6.3
 */
export class EnhancedInternshipApprovalService extends InternshipApprovalService {
  
  /**
   * Enhanced getApprovalStatus with retry mechanism and error handling
   */
  async getApprovalStatus(studentEnrollId: number): Promise<ApprovalStatusData> {
    return executeInternshipApiCall(
      () => super.getApprovalStatus(studentEnrollId),
      {
        operation: 'getApprovalStatus',
        studentEnrollId
      }
    );
  }

  /**
   * Enhanced submitAdvisorApproval with validation and conflict resolution
   */
  async submitAdvisorApproval(
    studentEnrollId: number, 
    approved: boolean, 
    remarks?: string,
    conflictStrategy: ConflictResolutionStrategy = { type: 'abort' }
  ): Promise<void> {
    try {
      return await executeInternshipApiCall(
        () => super.submitAdvisorApproval(studentEnrollId, approved, remarks),
        {
          operation: 'submitAdvisorApproval',
          studentEnrollId,
          currentStatus: 'registered',
          targetStatus: approved ? 't.approved' : 'doc.approved'
        }
      );
    } catch (error: any) {
      if (error.internshipErrorType === 'CONCURRENT_UPDATE_ERROR') {
        return handleConcurrentUpdateConflict(
          error,
          () => super.submitAdvisorApproval(studentEnrollId, approved, remarks),
          conflictStrategy
        );
      }
      throw error;
    }
  }

  /**
   * Enhanced submitCommitteeVote with validation and conflict resolution
   */
  async submitCommitteeVote(
    studentEnrollId: number, 
    vote: 'approve' | 'reject',
    remarks?: string,
    conflictStrategy: ConflictResolutionStrategy = { type: 'abort' }
  ): Promise<void> {
    try {
      return await executeInternshipApiCall(
        () => super.submitCommitteeVote(studentEnrollId, vote, remarks),
        {
          operation: 'submitCommitteeVote',
          studentEnrollId,
          currentStatus: 't.approved',
          targetStatus: vote === 'approve' ? 'c.approved' : 'doc.approved'
        }
      );
    } catch (error: any) {
      if (error.internshipErrorType === 'CONCURRENT_UPDATE_ERROR') {
        return handleConcurrentUpdateConflict(
          error,
          () => super.submitCommitteeVote(studentEnrollId, vote, remarks),
          conflictStrategy
        );
      }
      throw error;
    }
  }

  /**
   * Enhanced getCommitteeVotingStatus with retry mechanism
   */
  async getCommitteeVotingStatus(studentEnrollId: number): Promise<CommitteeVotingData> {
    return executeInternshipApiCall(
      () => super.getCommitteeVotingStatus(studentEnrollId),
      {
        operation: 'getCommitteeVotingStatus',
        studentEnrollId
      }
    );
  }

  /**
   * Enhanced updateApprovalStatus with validation and conflict resolution
   */
  async updateApprovalStatus(
    studentEnrollId: number, 
    newStatus: InternshipApprovalStatus, 
    reason?: string,
    conflictStrategy: ConflictResolutionStrategy = { type: 'abort' }
  ): Promise<void> {
    try {
      return await executeInternshipApiCall(
        () => super.updateApprovalStatus(studentEnrollId, newStatus, reason),
        {
          operation: 'updateApprovalStatus',
          studentEnrollId,
          targetStatus: newStatus
        }
      );
    } catch (error: any) {
      if (error.internshipErrorType === 'CONCURRENT_UPDATE_ERROR') {
        return handleConcurrentUpdateConflict(
          error,
          () => super.updateApprovalStatus(studentEnrollId, newStatus, reason),
          conflictStrategy
        );
      }
      throw error;
    }
  }

  /**
   * Enhanced getAdvisorPendingApplications with retry mechanism
   */
  async getAdvisorPendingApplications(filters?: {
    search?: string;
    major?: string;
    company?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdvisorApplicationData[]> {
    return executeInternshipApiCall(
      () => super.getAdvisorPendingApplications(filters),
      {
        operation: 'getAdvisorPendingApplications'
      }
    );
  }

  /**
   * Validate status transition before making API call
   */
  async validateAndSubmitStatusChange(
    studentEnrollId: number,
    currentStatus: InternshipApprovalStatus,
    targetStatus: InternshipApprovalStatus,
    userRole: string,
    additionalData?: any
  ): Promise<void> {
    // Client-side validation
    this.validateStatusTransition(currentStatus, targetStatus, userRole);
    
    // Determine the appropriate API call based on the transition
    switch (targetStatus) {
      case 't.approved':
        if (userRole === 'advisor') {
          return this.submitAdvisorApproval(studentEnrollId, true, additionalData?.remarks);
        }
        break;
      case 'doc.approved':
        if (userRole === 'advisor') {
          return this.submitAdvisorApproval(studentEnrollId, false, additionalData?.remarks);
        } else if (userRole === 'committee_member') {
          return this.submitCommitteeVote(studentEnrollId, 'reject', additionalData?.remarks);
        }
        break;
      case 'c.approved':
        if (userRole === 'committee_member') {
          return this.submitCommitteeVote(studentEnrollId, 'approve', additionalData?.remarks);
        }
        break;
      case 'doc.cancel':
        if (userRole === 'admin') {
          return this.updateApprovalStatus(studentEnrollId, targetStatus, additionalData?.reason);
        }
        break;
    }
    
    throw new Error(`Invalid status transition: ${currentStatus} -> ${targetStatus} for role ${userRole}`);
  }

  /**
   * Client-side status transition validation
   */
  private validateStatusTransition(
    currentStatus: InternshipApprovalStatus,
    targetStatus: InternshipApprovalStatus,
    userRole: string
  ): void {
    const validTransitions: Record<InternshipApprovalStatus, InternshipApprovalStatus[]> = {
      'registered': ['t.approved', 'doc.approved'],
      't.approved': ['c.approved', 'doc.approved'],
      'c.approved': ['doc.cancel'],
      'doc.approved': [],
      'doc.cancel': []
    };
    
    const rolePermissions: Record<string, Record<InternshipApprovalStatus, InternshipApprovalStatus[]>> = {
      advisor: {
        'registered': ['t.approved', 'doc.approved'],
        't.approved': [], 'c.approved': [], 'doc.approved': [], 'doc.cancel': []
      },
      committee_member: {
        'registered': [],
        't.approved': ['c.approved', 'doc.approved'],
        'c.approved': [], 'doc.approved': [], 'doc.cancel': []
      },
      admin: {
        'registered': ['t.approved', 'doc.approved'],
        't.approved': ['c.approved', 'doc.approved'],
        'c.approved': ['doc.cancel'],
        'doc.approved': [], 'doc.cancel': []
      }
    };
    
    if (!validTransitions[currentStatus]?.includes(targetStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${targetStatus}`);
    }
    
    const userPermissions = rolePermissions[userRole];
    if (!userPermissions || !userPermissions[currentStatus]?.includes(targetStatus)) {
      throw new Error(`User role ${userRole} is not authorized for this transition`);
    }
  }
}