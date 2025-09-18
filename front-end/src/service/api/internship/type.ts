// Internship Approval Status Types and Interfaces

/**
 * Internship approval status enum with exact status codes
 * Based on requirements 1.1, 1.2, 1.3
 */
export type InternshipApprovalStatus = 
  | 'registered'        // Initial application - "อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา"
  | 't.approved'        // Advisor approved - "อยู่ระหว่างการพิจารณา โดยคณะกรรมการ"
  | 'c.approved'        // Committee approved - "อนุมัติเอกสารขอฝึกงาน / สหกิจ"
  | 'doc.approved'      // Rejected - "ไม่อนุมัติเอกสารขอฝึกงาน/สหกิจ"
  | 'doc.cancel';       // Cancelled - "ยกเลิกการฝึกงาน/สหกิจ"

/**
 * Committee vote interface for tracking individual votes
 * Based on requirements 3.1, 3.2
 */
export interface CommitteeVote {
  instructorId: number;
  vote: 'approve' | 'reject';
  votedAt: string; // ISO date string
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
  changedAt: string; // ISO date string
  reason?: string;
}

/**
 * Approval status data interface for API responses
 * Based on requirements 1.1, 1.2, 1.3, 1.4
 */
export interface ApprovalStatusData {
  studentEnrollId: number;
  currentStatus: InternshipApprovalStatus;
  statusText: string;
  statusUpdatedAt: string; // ISO date string
  
  // Advisor approval information
  advisorId?: number;
  advisorApprovalDate?: string; // ISO date string
  
  // Committee voting information
  committeeVotes: CommitteeVote[];
  approvalPercentage: number;
  
  // Final outcome tracking
  finalOutcome?: 'Pass' | 'Failed';
  
  // Status history for audit trail
  statusHistory: StatusTransition[];
}

/**
 * Status display configuration interface
 * Based on requirements 5.1, 5.2
 */
export interface StatusDisplayConfig {
  text: string; // Exact Thai text as specified
  color: string; // Hex color code for UI styling
  icon: string; // Icon identifier for UI display
}

/**
 * Committee voting data interface for voting dashboard
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

/**
 * Advisor application data interface for advisor dashboard
 * Based on requirements 2.1, 2.2, 2.3, 2.4
 */
export interface AdvisorApplicationData {
  studentEnrollId: number;
  studentId: string;
  studentName: string;
  major: string;
  companyName: string;
  position: string;
  currentStatus: InternshipApprovalStatus;
  submittedAt: string; // ISO date string
  lastUpdatedAt: string; // ISO date string
  advisorRemarks?: string;
  companyDetails?: {
    address: string;
    contactPerson: string;
    contactPhone: string;
    contactEmail: string;
  };
}