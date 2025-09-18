// Internship Approval Types and Configuration Exports
// Centralized exports for internship approval functionality

// Type exports
export type {
  InternshipApprovalStatus,
  CommitteeVote,
  StatusTransition,
  ApprovalStatusData,
  StatusDisplayConfig,
  CommitteeVotingData,
  AdvisorApplicationData
} from './type';

// Service exports
export { InternshipApprovalService } from './InternshipApprovalService';

// ViewModel exports
export { 
  useApprovalStatusViewModel,
  default as useApprovalStatusViewModelDefault
} from './hooks/useApprovalStatusViewModel';
export type {
  ApprovalStatusViewModelConfig,
  ApprovalStatusViewModelState,
  ApprovalStatusViewModelMethods,
  ApprovalStatusViewModel
} from './hooks/useApprovalStatusViewModel';

// Configuration exports
export {
  STATUS_DISPLAY_CONFIG,
  getStatusDisplayConfig,
  getStatusText,
  getStatusColor,
  getStatusIcon
} from './config';