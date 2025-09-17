/**
 * Status transition validation utilities
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import type { InternshipApprovalStatus } from '../service/api/internship/type'

export interface StatusTransitionRule {
  from: InternshipApprovalStatus[]
  to: InternshipApprovalStatus
  requiredRole: 'advisor' | 'committee' | 'admin'
  requiresCommitteeVoting?: boolean
}

export interface ValidationContext {
  userRole: 'advisor' | 'committee' | 'admin' | 'student'
  committeeApprovalPercentage?: number
}

export interface ValidationResult {
  isValid: boolean
  message?: string
  errorType?: string
}

const TRANSITION_RULES: StatusTransitionRule[] = [
  {
    from: ['registered'],
    to: 't.approved',
    requiredRole: 'advisor'
  },
  {
    from: ['registered'],
    to: 'doc.approved',
    requiredRole: 'advisor'
  },
  {
    from: ['t.approved'],
    to: 'c.approved',
    requiredRole: 'committee',
    requiresCommitteeVoting: true
  },
  {
    from: ['t.approved'],
    to: 'doc.approved',
    requiredRole: 'committee',
    requiresCommitteeVoting: true
  },
  {
    from: ['c.approved', 'doc.approved'],
    to: 'doc.cancel',
    requiredRole: 'admin'
  }
]

export const validateStatusTransition = (
  currentStatus: InternshipApprovalStatus,
  targetStatus: InternshipApprovalStatus,
  context: ValidationContext
): ValidationResult => {
  // Find applicable rule
  const rule = TRANSITION_RULES.find(r => 
    r.from.includes(currentStatus) && r.to === targetStatus
  )

  if (!rule) {
    return {
      isValid: false,
      message: `Invalid transition from ${currentStatus} to ${targetStatus}`,
      errorType: 'INVALID_TRANSITION'
    }
  }

  // Check role authorization
  if (context.userRole !== rule.requiredRole && context.userRole !== 'admin') {
    return {
      isValid: false,
      message: `User role ${context.userRole} cannot transition from ${currentStatus} to ${targetStatus}`,
      errorType: 'UNAUTHORIZED_ROLE'
    }
  }

  // Check committee voting requirements
  if (rule.requiresCommitteeVoting && targetStatus === 'c.approved') {
    if (context.committeeApprovalPercentage === undefined || context.committeeApprovalPercentage < 50) {
      return {
        isValid: false,
        message: 'Committee approval requires at least 50% approval',
        errorType: 'INSUFFICIENT_COMMITTEE_APPROVAL'
      }
    }
  }

  return { isValid: true }
}

export const getValidTransitions = (
  currentStatus: InternshipApprovalStatus,
  userRole: 'advisor' | 'committee' | 'admin' | 'student'
): InternshipApprovalStatus[] => {
  return TRANSITION_RULES
    .filter(rule => 
      rule.from.includes(currentStatus) && 
      (rule.requiredRole === userRole || userRole === 'admin')
    )
    .map(rule => rule.to)
}