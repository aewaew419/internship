import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import StudentEnroll from './student_enroll.js'
import Instructor from './instructor.js'

// Internship approval status enum
export type InternshipApprovalStatus = 
  | 'registered'        // Initial application
  | 't.approved'        // Advisor approved
  | 'c.approved'        // Committee approved
  | 'doc.approved'      // Document approved
  | 'doc.cancel'        // Cancelled after approval
  | 'approve'           // Legacy status
  | 'denied'            // Legacy status
  | 'pending'           // Legacy status

// Committee vote interface
export interface CommitteeVote {
  instructorId: number
  vote: 'approve' | 'reject'
  votedAt: DateTime
  remarks?: string
}

// Status transition interface
export interface StatusTransition {
  fromStatus: InternshipApprovalStatus
  toStatus: InternshipApprovalStatus
  changedBy: number
  changedAt: DateTime
  reason?: string
}

// Instructor assignment audit trail interface
export interface InstructorAssignmentAudit {
  previousInstructorId?: number
  newInstructorId: number
  changedBy: number
  changedAt: DateTime
  reason?: string
  notificationSent: boolean
}

export default class StudentEnrollStatus extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare student_enroll_id: number

  @belongsTo(() => StudentEnroll, {
    foreignKey: 'student_enroll_id',
  })
  declare student_enroll: BelongsTo<typeof StudentEnroll>

  @column()
  declare instructor_id: number

  @belongsTo(() => Instructor, {
    foreignKey: 'instructor_id',
  })
  declare instructor: BelongsTo<typeof Instructor>

  @column()
  declare status: InternshipApprovalStatus

  @column()
  declare remarks: string

  // Committee voting tracking fields
  @column({
    prepare: (value: CommitteeVote[]) => JSON.stringify(value),
    consume: (value: string) => value ? JSON.parse(value) : []
  })
  declare committee_votes: CommitteeVote[]

  @column()
  declare committee_vote_count: number

  @column()
  declare required_committee_votes: number

  @column.dateTime()
  declare committee_voting_deadline: DateTime | null

  // Status transition tracking
  @column({
    prepare: (value: StatusTransition[]) => JSON.stringify(value),
    consume: (value: string) => value ? JSON.parse(value) : []
  })
  declare status_history: StatusTransition[]

  // Instructor assignment history tracking
  @column({
    prepare: (value: InstructorAssignmentAudit[]) => JSON.stringify(value),
    consume: (value: string) => value ? JSON.parse(value) : []
  })
  declare instructor_assignment_history: InstructorAssignmentAudit[]

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
  /**

   * Status transition validation methods
   */
  
  // Valid status transitions map
  private static readonly VALID_TRANSITIONS: Record<InternshipApprovalStatus, InternshipApprovalStatus[]> = {
    'registered': ['t.approved', 'denied'],
    't.approved': ['c.approved', 'denied'],
    'c.approved': ['doc.approved', 'doc.cancel'],
    'doc.approved': ['doc.cancel'],
    'doc.cancel': [],
    'approve': ['denied'], // Legacy support
    'denied': ['registered'], // Allow resubmission
    'pending': ['approve', 'denied'] // Legacy support
  }

  /**
   * Check if status transition is valid
   */
  public canTransitionTo(newStatus: InternshipApprovalStatus): boolean {
    const allowedTransitions = StudentEnrollStatus.VALID_TRANSITIONS[this.status]
    return allowedTransitions.includes(newStatus)
  }

  /**
   * Transition to new status with validation
   */
  public async transitionTo(
    newStatus: InternshipApprovalStatus, 
    changedBy: number, 
    reason?: string
  ): Promise<boolean> {
    if (!this.canTransitionTo(newStatus)) {
      return false
    }

    const transition: StatusTransition = {
      fromStatus: this.status,
      toStatus: newStatus,
      changedBy,
      changedAt: DateTime.now(),
      reason
    }

    this.status_history = [...this.status_history, transition]
    this.status = newStatus
    
    await this.save()
    return true
  }

  /**
   * Committee voting methods
   */

  /**
   * Add committee vote
   */
  public async addCommitteeVote(
    instructorId: number, 
    vote: 'approve' | 'reject', 
    remarks?: string
  ): Promise<boolean> {
    // Check if instructor already voted
    const existingVote = this.committee_votes.find(v => v.instructorId === instructorId)
    if (existingVote) {
      return false
    }

    // Check if voting is still open
    if (this.committee_voting_deadline && DateTime.now() > this.committee_voting_deadline) {
      return false
    }

    const newVote: CommitteeVote = {
      instructorId,
      vote,
      votedAt: DateTime.now(),
      remarks
    }

    this.committee_votes = [...this.committee_votes, newVote]
    this.committee_vote_count = this.committee_votes.length

    await this.save()
    return true
  }

  /**
   * Check if committee voting is complete
   */
  public isCommitteeVotingComplete(): boolean {
    return this.committee_vote_count >= this.required_committee_votes
  }

  /**
   * Get committee voting result
   */
  public getCommitteeVotingResult(): { approved: boolean; approveCount: number; rejectCount: number } {
    const approveCount = this.committee_votes.filter(v => v.vote === 'approve').length
    const rejectCount = this.committee_votes.filter(v => v.vote === 'reject').length
    
    return {
      approved: approveCount > rejectCount,
      approveCount,
      rejectCount
    }
  }

  /**
   * Check if instructor has voted
   */
  public hasInstructorVoted(instructorId: number): boolean {
    return this.committee_votes.some(v => v.instructorId === instructorId)
  }

  /**
   * Get status display name
   */
  public getStatusDisplayName(): string {
    const statusNames: Record<InternshipApprovalStatus, string> = {
      'registered': 'ลงทะเบียน',
      't.approved': 'อาจารย์ที่ปรึกษาอนุมัติ',
      'c.approved': 'คณะกรรมการอนุมัติ',
      'doc.approved': 'เอกสารอนุมัติ',
      'doc.cancel': 'ยกเลิกหลังอนุมัติ',
      'approve': 'อนุมัติ',
      'denied': 'ปฏิเสธ',
      'pending': 'รอดำเนินการ'
    }
    
    return statusNames[this.status] || this.status
  }

  /**
   * Check if status requires committee voting
   */
  public requiresCommitteeVoting(): boolean {
    return this.status === 't.approved'
  }

  /**
   * Instructor assignment methods
   */

  /**
   * Change instructor assignment with audit trail
   */
  public async changeInstructor(
    newInstructorId: number,
    changedBy: number,
    reason?: string
  ): Promise<boolean> {
    // Validate the instructor change
    if (!this.canChangeInstructor(newInstructorId)) {
      return false
    }

    const previousInstructorId = this.instructor_id

    // Create audit trail entry
    const auditEntry: InstructorAssignmentAudit = {
      previousInstructorId: previousInstructorId || undefined,
      newInstructorId,
      changedBy,
      changedAt: DateTime.now(),
      reason,
      notificationSent: false
    }

    // Update instructor assignment history
    this.instructor_assignment_history = [...this.instructor_assignment_history, auditEntry]
    
    // Update the instructor assignment
    this.instructor_id = newInstructorId

    await this.save()
    return true
  }

  /**
   * Validate if instructor can be changed
   */
  public canChangeInstructor(newInstructorId: number): boolean {
    // Cannot assign to the same instructor
    if (this.instructor_id === newInstructorId) {
      return false
    }

    // Cannot change instructor if status is in final states
    const finalStatuses: InternshipApprovalStatus[] = ['doc.cancel']
    if (finalStatuses.includes(this.status)) {
      return false
    }

    // New instructor ID must be valid (positive number)
    if (!newInstructorId || newInstructorId <= 0) {
      return false
    }

    return true
  }

  /**
   * Check if instructor assignment can be changed by user
   */
  public canUserChangeInstructor(userId: number): boolean {
    // This would typically check user permissions
    // For now, we'll assume any valid user can change (admin check would be done at controller level)
    return userId > 0
  }

  /**
   * Get instructor assignment history
   */
  public getInstructorAssignmentHistory(): InstructorAssignmentAudit[] {
    return this.instructor_assignment_history || []
  }

  /**
   * Get latest instructor assignment change
   */
  public getLatestInstructorChange(): InstructorAssignmentAudit | null {
    const history = this.getInstructorAssignmentHistory()
    return history.length > 0 ? history[history.length - 1] : null
  }

  /**
   * Check if instructor has been assigned to this enrollment before
   */
  public hasInstructorBeenAssigned(instructorId: number): boolean {
    // Check current assignment
    if (this.instructor_id === instructorId) {
      return true
    }

    // Check assignment history
    return this.instructor_assignment_history.some(
      entry => entry.newInstructorId === instructorId || entry.previousInstructorId === instructorId
    )
  }

  /**
   * Mark notification as sent for latest assignment change
   */
  public async markNotificationSent(): Promise<void> {
    const history = [...this.instructor_assignment_history]
    if (history.length > 0) {
      history[history.length - 1].notificationSent = true
      this.instructor_assignment_history = history
      await this.save()
    }
  }

  /**
   * Get assignment changes that need notification
   */
  public getUnnotifiedAssignmentChanges(): InstructorAssignmentAudit[] {
    return this.instructor_assignment_history.filter(entry => !entry.notificationSent)
  }
}