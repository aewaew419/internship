// Backend Internship Approval Types
// Based on requirements 1.1, 1.2, 1.3, 3.1, 3.2, 4.3

import { DateTime } from 'luxon';

/**
 * Internship approval status enum with exact status codes
 * Based on requirements 1.1, 1.2, 1.3
 */
export type InternshipApprovalStatus = 
  | 'registered'        // Initial application
  | 't.approved'        // Advisor approved
  | 'c.approved'        // Committee approved
  | 'doc.approved'      // Rejected
  | 'doc.cancel';       // Cancelled

/**
 * Committee vote interface for tracking individual votes
 * Based on requirements 3.1, 3.2
 */
export interface CommitteeVote {
  instructorId: number;
  vote: 'approve' | 'reject';
  votedAt: DateTime;
  remarks?: string;
}

/**
 * Status transition interface for audit trail
 * Based on requirement 4.3
 */
export interface StatusTransition {
  fromStatus: InternshipApprovalStatus;
  toStatus: InternshipApprovalStatus;
  changedBy: number; // User ID who made the change
  changedAt: DateTime;
  reason?: string;
}

/**
 * Extended fields for StudentEnrollStatus model to support internship approval workflow
 * Based on requirements 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 4.3
 */
export interface InternshipStatusExtension {
  // Advisor approval tracking
  advisorApprovalDate?: DateTime;
  
  // Committee voting tracking
  committeeVotes: CommitteeVote[];
  approvalPercentage: number;
  
  // Final outcome tracking
  finalOutcome?: 'Pass' | 'Failed';
  
  // Status history for audit trail
  statusHistory: StatusTransition[];
}

/**
 * API response interface for approval status data
 * Based on requirements 1.1, 1.2, 1.3, 1.4
 */
export interface ApprovalStatusResponse {
  studentEnrollId: number;
  currentStatus: InternshipApprovalStatus;
  statusText: string;
  statusUpdatedAt: string; // ISO date string
  
  // Advisor approval information
  advisorId?: number;
  advisorApprovalDate?: string; // ISO date string
  
  // Committee voting information
  committeeVotes: {
    instructorId: number;
    vote: 'approve' | 'reject';
    votedAt: string; // ISO date string
    remarks?: string;
  }[];
  approvalPercentage: number;
  
  // Final outcome tracking
  finalOutcome?: 'Pass' | 'Failed';
  
  // Status history for audit trail
  statusHistory: {
    fromStatus: InternshipApprovalStatus;
    toStatus: InternshipApprovalStatus;
    changedBy: number;
    changedAt: string; // ISO date string
    reason?: string;
  }[];
}

/**
 * Committee voting data interface for voting operations
 * Based on requirements 3.1, 3.2, 3.3, 3.4
 */
export interface CommitteeVotingData {
  studentEnrollId: number;
  totalCommitteeMembers: number;
  currentVotes: CommitteeVote[];
  approvalPercentage: number;
  votingComplete: boolean;
  finalDecision?: 'approved' | 'rejected';
}