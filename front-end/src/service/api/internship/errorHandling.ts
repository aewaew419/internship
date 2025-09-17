/**
 * Error handling utilities for internship approval API
 * Requirements: 6.1, 6.2, 6.3
 */

export enum InternshipErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  STATUS_TRANSITION_ERROR = 'STATUS_TRANSITION_ERROR',
  CONCURRENT_UPDATE_ERROR = 'CONCURRENT_UPDATE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface InternshipError {
  type: InternshipErrorType
  message: string
  details?: any
  statusCode?: number
}

export class InternshipApprovalError extends Error {
  public readonly type: InternshipErrorType
  public readonly statusCode?: number
  public readonly details?: any

  constructor(type: InternshipErrorType, message: string, statusCode?: number, details?: any) {
    super(message)
    this.name = 'InternshipApprovalError'
    this.type = type
    this.statusCode = statusCode
    this.details = details
  }
}

export const createStatusTransitionError = (currentStatus: string, targetStatus: string): InternshipApprovalError => {
  return new InternshipApprovalError(
    InternshipErrorType.STATUS_TRANSITION_ERROR,
    `Invalid status transition from ${currentStatus} to ${targetStatus}`,
    400,
    { currentStatus, targetStatus }
  )
}

export const createAuthorizationError = (operation: string): InternshipApprovalError => {
  return new InternshipApprovalError(
    InternshipErrorType.AUTHORIZATION_ERROR,
    `Unauthorized to perform ${operation}`,
    403,
    { operation }
  )
}

export const createConcurrentUpdateError = (): InternshipApprovalError => {
  return new InternshipApprovalError(
    InternshipErrorType.CONCURRENT_UPDATE_ERROR,
    'Another user has modified this record. Please refresh and try again.',
    409
  )
}

export const handleApiError = (error: any): InternshipApprovalError => {
  if (error instanceof InternshipApprovalError) {
    return error
  }

  const statusCode = error.response?.status || 500
  const message = error.response?.data?.message || error.message || 'An unknown error occurred'

  switch (statusCode) {
    case 400:
      return new InternshipApprovalError(InternshipErrorType.VALIDATION_ERROR, message, statusCode)
    case 401:
    case 403:
      return new InternshipApprovalError(InternshipErrorType.AUTHORIZATION_ERROR, message, statusCode)
    case 409:
      return new InternshipApprovalError(InternshipErrorType.CONCURRENT_UPDATE_ERROR, message, statusCode)
    case 422:
      return new InternshipApprovalError(InternshipErrorType.STATUS_TRANSITION_ERROR, message, statusCode)
    default:
      if (statusCode >= 500) {
        return new InternshipApprovalError(InternshipErrorType.NETWORK_ERROR, message, statusCode)
      }
      return new InternshipApprovalError(InternshipErrorType.UNKNOWN_ERROR, message, statusCode)
  }
}