// Enhanced Error Handling for Internship Approval Service
import { classifyError, logError, type EnhancedError } from '../../../utils/errorHandling';
import { retryApiCall, type RetryConfig } from '../../../utils/retryMechanism';
import type { InternshipApprovalStatus } from './type';

export enum InternshipErrorType {
  STATUS_TRANSITION_ERROR = 'STATUS_TRANSITION_ERROR',
  CONCURRENT_UPDATE_ERROR = 'CONCURRENT_UPDATE_ERROR',
  COMMITTEE_VOTING_ERROR = 'COMMITTEE_VOTING_ERROR',
  ADVISOR_APPROVAL_ERROR = 'ADVISOR_APPROVAL_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR'
}

export interface InternshipError extends EnhancedError {
  internshipErrorType?: InternshipErrorType;
  studentEnrollId?: number;
  currentStatus?: InternshipApprovalStatus;
  targetStatus?: InternshipApprovalStatus;
  conflictData?: any;
}

export function classifyInternshipError(error: any, context?: {
  studentEnrollId?: number;
  currentStatus?: InternshipApprovalStatus;
  targetStatus?: InternshipApprovalStatus;
}): InternshipError {
  const baseError = classifyError(error);
  
  let internshipErrorType: InternshipErrorType | undefined;
  let conflictData: any;
  
  if (error.response?.status === 409) {
    if (error.response.data?.type === 'concurrent_update') {
      internshipErrorType = InternshipErrorType.CONCURRENT_UPDATE_ERROR;
      conflictData = error.response.data.conflictData;
    } else if (error.response.data?.type === 'status_transition') {
      internshipErrorType = InternshipErrorType.STATUS_TRANSITION_ERROR;
    }
  } else if (error.response?.status === 403) {
    internshipErrorType = InternshipErrorType.PERMISSION_ERROR;
  }
  
  return {
    ...baseError,
    internshipErrorType,
    studentEnrollId: context?.studentEnrollId,
    currentStatus: context?.currentStatus,
    targetStatus: context?.targetStatus,
    conflictData
  };
}

export function getInternshipErrorMessage(error: InternshipError): string {
  switch (error.internshipErrorType) {
    case InternshipErrorType.STATUS_TRANSITION_ERROR:
      return 'ไม่สามารถเปลี่ยนสถานะได้ เนื่องจากการเปลี่ยนแปลงนี้ไม่ถูกต้องตามขั้นตอน';
    case InternshipErrorType.CONCURRENT_UPDATE_ERROR:
      return 'สถานะได้ถูกเปลี่ยนแปลงโดยผู้ใช้อื่นแล้ว กรุณารีเฟรชและลองใหม่';
    case InternshipErrorType.COMMITTEE_VOTING_ERROR:
      return 'เกิดข้อผิดพลาดในการลงคะแนน กรุณาตรวจสอบสิทธิ์และลองใหม่';
    case InternshipErrorType.ADVISOR_APPROVAL_ERROR:
      return 'เกิดข้อผิดพลาดในการอนุมัติ กรุณาตรวจสอบข้อมูลและลองใหม่';
    case InternshipErrorType.PERMISSION_ERROR:
      return 'คุณไม่มีสิทธิ์ในการดำเนินการนี้';
    default:
      return error.userMessage || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
  }
}

export async function executeInternshipApiCall<T>(
  apiCall: () => Promise<T>,
  context: {
    operation: string;
    studentEnrollId?: number;
    currentStatus?: InternshipApprovalStatus;
    targetStatus?: InternshipApprovalStatus;
  },
  retryConfig?: Partial<RetryConfig>
): Promise<T> {
  try {
    return await retryApiCall(apiCall, {
      maxRetries: 3,
      baseDelay: 1000,
      ...retryConfig,
      retryCondition: (error: any) => {
        if (error.response?.status === 403 || error.response?.status === 422) {
          return false;
        }
        if (error.response?.status === 409 && error.response.data?.type === 'concurrent_update') {
          return false;
        }
        return !error.response || error.response.status >= 500 || error.response.status === 408;
      }
    });
  } catch (error: any) {
    const enhancedError = classifyInternshipError(error, context);
    logError(enhancedError, `Internship API: ${context.operation}`);
    throw enhancedError;
  }
}

export interface ConflictResolutionStrategy {
  type: 'merge' | 'overwrite' | 'abort' | 'user_choice';
  mergeFunction?: (current: any, incoming: any) => any;
}

export async function handleConcurrentUpdateConflict<T>(
  error: InternshipError,
  retryOperation: () => Promise<T>,
  strategy: ConflictResolutionStrategy = { type: 'abort' }
): Promise<T> {
  if (error.internshipErrorType !== InternshipErrorType.CONCURRENT_UPDATE_ERROR) {
    throw error;
  }
  
  switch (strategy.type) {
    case 'abort':
      throw new Error('Operation aborted due to concurrent update conflict');
    case 'overwrite':
      return await retryOperation();
    case 'user_choice':
      throw error;
    default:
      throw error;
  }
}