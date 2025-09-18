import { useState, useCallback } from 'react';
import { EnhancedInternshipApprovalService } from '../EnhancedInternshipApprovalService';
import { 
  getInternshipErrorMessage,
  type InternshipError,
  type ConflictResolutionStrategy
} from '../enhanced-error-handling';
import type { InternshipApprovalStatus } from '../type';

/**
 * Status transition handler state
 */
export interface StatusTransitionState {
  isLoading: boolean;
  error: string | null;
  isConflictDialogOpen: boolean;
  conflictData: any;
  lastAttemptedTransition: {
    studentEnrollId: number;
    currentStatus: InternshipApprovalStatus;
    targetStatus: InternshipApprovalStatus;
    userRole: string;
    additionalData?: any;
  } | null;
}

/**
 * Status transition handler methods
 */
export interface StatusTransitionMethods {
  executeTransition: (
    studentEnrollId: number,
    currentStatus: InternshipApprovalStatus,
    targetStatus: InternshipApprovalStatus,
    userRole: string,
    additionalData?: any
  ) => Promise<void>;
  
  retryLastTransition: () => Promise<void>;
  resolveConflict: (strategy: ConflictResolutionStrategy) => Promise<void>;
  clearError: () => void;
  dismissConflictDialog: () => void;
}

/**
 * Complete status transition handler interface
 */
export interface StatusTransitionHandler extends StatusTransitionState, StatusTransitionMethods {}

/**
 * Custom hook for handling status transitions with comprehensive error handling
 * Based on requirements 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 6.3
 */
export const useStatusTransitionHandler = (): StatusTransitionHandler => {
  const [state, setState] = useState<StatusTransitionState>({
    isLoading: false,
    error: null,
    isConflictDialogOpen: false,
    conflictData: null,
    lastAttemptedTransition: null
  });
  
  const service = new EnhancedInternshipApprovalService();
  
  /**
   * Execute a status transition with comprehensive error handling
   */
  const executeTransition = useCallback(async (
    studentEnrollId: number,
    currentStatus: InternshipApprovalStatus,
    targetStatus: InternshipApprovalStatus,
    userRole: string,
    additionalData?: any
  ): Promise<void> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      lastAttemptedTransition: {
        studentEnrollId,
        currentStatus,
        targetStatus,
        userRole,
        additionalData
      }
    }));
    
    try {
      await service.validateAndSubmitStatusChange(
        studentEnrollId,
        currentStatus,
        targetStatus,
        userRole,
        additionalData
      );
      
      // Success - clear state
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastAttemptedTransition: null
      }));
      
    } catch (error: any) {
      const internshipError = error as InternshipError;
      
      // Handle concurrent update conflicts
      if (internshipError.internshipErrorType === 'CONCURRENT_UPDATE_ERROR') {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isConflictDialogOpen: true,
          conflictData: internshipError.conflictData,
          error: getInternshipErrorMessage(internshipError)
        }));
        return;
      }
      
      // Handle other errors
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: getInternshipErrorMessage(internshipError)
      }));
    }
  }, [service]);
  
  /**
   * Retry the last attempted transition
   */
  const retryLastTransition = useCallback(async (): Promise<void> => {
    if (!state.lastAttemptedTransition) {
      throw new Error('No previous transition to retry');
    }
    
    const { studentEnrollId, currentStatus, targetStatus, userRole, additionalData } = state.lastAttemptedTransition;
    await executeTransition(studentEnrollId, currentStatus, targetStatus, userRole, additionalData);
  }, [state.lastAttemptedTransition, executeTransition]);
  
  /**
   * Resolve a concurrent update conflict with the specified strategy
   */
  const resolveConflict = useCallback(async (strategy: ConflictResolutionStrategy): Promise<void> => {
    if (!state.lastAttemptedTransition) {
      throw new Error('No conflict to resolve');
    }
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      isConflictDialogOpen: false,
      error: null
    }));
    
    const { studentEnrollId, currentStatus, targetStatus, userRole, additionalData } = state.lastAttemptedTransition;
    
    try {
      // Execute the transition with the specified conflict resolution strategy
      switch (targetStatus) {
        case 't.approved':
        case 'doc.approved':
          if (userRole === 'advisor') {
            await service.submitAdvisorApproval(
              studentEnrollId, 
              targetStatus === 't.approved', 
              additionalData?.remarks,
              strategy
            );
          }
          break;
        case 'c.approved':
          if (userRole === 'committee_member') {
            await service.submitCommitteeVote(
              studentEnrollId, 
              'approve', 
              additionalData?.remarks,
              strategy
            );
          }
          break;
        case 'doc.cancel':
          if (userRole === 'admin') {
            await service.updateApprovalStatus(
              studentEnrollId, 
              targetStatus, 
              additionalData?.reason,
              strategy
            );
          }
          break;
      }
      
      // Success
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastAttemptedTransition: null
      }));
      
    } catch (error: any) {
      const internshipError = error as InternshipError;
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: getInternshipErrorMessage(internshipError)
      }));
    }
  }, [state.lastAttemptedTransition, service]);
  
  /**
   * Clear error state
   */
  const clearError = useCallback((): void => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  }, []);
  
  /**
   * Dismiss conflict dialog
   */
  const dismissConflictDialog = useCallback((): void => {
    setState(prev => ({
      ...prev,
      isConflictDialogOpen: false,
      conflictData: null,
      lastAttemptedTransition: null
    }));
  }, []);
  
  return {
    ...state,
    executeTransition,
    retryLastTransition,
    resolveConflict,
    clearError,
    dismissConflictDialog
  };
};

export default useStatusTransitionHandler;