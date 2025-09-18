import type { HttpContext } from '@adonisjs/core/http'
import StudentEnrollStatus from '#models/student_enroll_status'
import StudentEnroll from '#models/student_enroll'
import { DateTime } from 'luxon'

// Define types locally since the import is failing
type InternshipApprovalStatus =
  | 'registered'
  | 't.approved'
  | 'c.approved'
  | 'doc.approved'
  | 'doc.cancel'
  | 'approve'
  | 'denied'
  | 'pending'

interface ApprovalStatusResponse {
  studentEnrollId: number
  currentStatus: InternshipApprovalStatus
  statusText: string
  statusUpdatedAt: string
  committeeVotes?: any[]
  approvalPercentage?: number
  statusHistory?: any[]
  advisorId?: number
  advisorApprovalDate?: string
}

interface CommitteeVotingData {
  studentEnrollId: number
  totalCommitteeMembers: number
  currentVotes: any[]
  approvalPercentage: number
  votingComplete: boolean
  finalDecision?: 'approved' | 'rejected'
}

export default class InternshipApprovalController {
  /**
   * Determine overall status based on status records priority
   */
  private determineOverallStatus(statusRecords: StudentEnrollStatus[]): InternshipApprovalStatus {
    const statusPriority: Record<InternshipApprovalStatus, number> = {
      'doc.cancel': 6,
      'c.approved': 5,
      'doc.approved': 4,
      't.approved': 3,
      'approve': 2,
      'denied': 2,
      'pending': 1,
      'registered': 0,
    }

    let highestPriority = -1
    let highestPriorityStatus: InternshipApprovalStatus = 'registered'

    for (const record of statusRecords) {
      const priority = statusPriority[record.status as InternshipApprovalStatus] || 0
      if (priority > highestPriority) {
        highestPriority = priority
        highestPriorityStatus = record.status as InternshipApprovalStatus
      }
    }

    return highestPriorityStatus
  }

  /**
   * Get display text for status
   */
  private getStatusDisplayText(status: InternshipApprovalStatus): string {
    const statusTexts: Record<InternshipApprovalStatus, string> = {
      'registered': 'ลงทะเบียนแล้ว',
      't.approved': 'อนุมัติโดยอาจารย์ที่ปรึกษา',
      'c.approved': 'อนุมัติโดยคณะกรรมการ',
      'doc.approved': 'อนุมัติเอกสาร',
      'doc.cancel': 'ยกเลิกเอกสาร',
      'approve': 'อนุมัติ',
      'denied': 'ปฏิเสธ',
      'pending': 'รอดำเนินการ',
    }

    return statusTexts[status] || status
  }

  /**
   * Helper method to calculate approval percentage from committee votes
   */
  private calculateApprovalPercentage(votes: any[]): number {
    if (votes.length === 0) {
      return 0
    }

    const approveCount = votes.filter((vote) => vote.vote === 'approve').length
    return Math.round((approveCount / votes.length) * 100)
  }

  /**
   * Helper method to determine if enrollment requires administrative attention
   */
  private requiresAdministrativeAttention(records: StudentEnrollStatus[]): boolean {
    // Check for various conditions that require administrative attention
    const isStuck = records.some((record) => {
      const status = record.status
      return status === 't.approved' || status === 'doc.approved'
    })

    // Check if records are old (more than 7 days)
    const hasOldRecords = records.some(
      (record) => DateTime.now().diff(record.updatedAt, 'days').days > 7
    )

    // Check for conflicts or transition errors
    const hasConflicts = records.some((record) =>
      record.status_history?.some(
        (transition: any) =>
          transition.reason?.includes('error') || transition.reason?.includes('conflict')
      )
    )

    return isStuck || hasOldRecords || hasConflicts
  }

  /**
   * Get current approval status for a student enrollment
   * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1
   */
  public async getApprovalStatus({ params, response }: HttpContext) {
    try {
      const studentEnrollId = Number(params.studentEnrollId)

      // Find the student enrollment with related data
      const studentEnroll = await StudentEnroll.query()
        .where('id', studentEnrollId)
        .preload('student')
        .preload('course_section')
        .first()

      if (!studentEnroll) {
        return response.notFound({ message: 'Student enrollment not found' })
      }

      // Get all status records for this enrollment
      const statusRecords = await StudentEnrollStatus.query()
        .where('student_enroll_id', studentEnrollId)
        .preload('instructor')
        .orderBy('updated_at', 'desc')

      if (statusRecords.length === 0) {
        return response.notFound({ message: 'No approval status found for this enrollment' })
      }

      // Get the most recent status record to determine current status
      const currentStatusRecord = statusRecords[0]
      const currentStatus = this.determineOverallStatus(statusRecords)

      // Build the response
      const approvalStatusResponse: ApprovalStatusResponse = {
        studentEnrollId,
        currentStatus,
        statusText: this.getStatusDisplayText(currentStatus),
        statusUpdatedAt: currentStatusRecord.updatedAt.toISO() || '',

        // Committee voting information
        committeeVotes:
          currentStatusRecord.committee_votes?.map((vote: any) => ({
            instructorId: vote.instructorId,
            vote: vote.vote,
            votedAt: vote.votedAt.toISO(),
            remarks: vote.remarks,
          })) || [],
        approvalPercentage: this.calculateApprovalPercentage(
          currentStatusRecord.committee_votes || []
        ),

        // Status history
        statusHistory:
          currentStatusRecord.status_history?.map((transition: any) => ({
            fromStatus: transition.fromStatus,
            toStatus: transition.toStatus,
            changedBy: transition.changedBy,
            changedAt: transition.changedAt.toISO(),
            reason: transition.reason,
          })) || [],
      }

      // Add advisor information if available
      const advisorRecord = statusRecords.find(
        (record) => record.status === 't.approved' || record.status === 'approve'
      )
      if (advisorRecord) {
        approvalStatusResponse.advisorId = advisorRecord.instructor_id
        approvalStatusResponse.advisorApprovalDate = advisorRecord.updatedAt.toISO() || undefined
      }

      // Check if administrative attention is required
      const needsAttention = this.requiresAdministrativeAttention(statusRecords)
      if (needsAttention) {
        approvalStatusResponse.statusText += ' (ต้องการความสนใจจากผู้ดูแลระบบ)'
      }

      return approvalStatusResponse
    } catch (error: any) {
      return response.internalServerError({
        message: 'Failed to retrieve approval status',
        error: error.message,
      })
    }
  }

  /**
   * Get committee voting data for a specific enrollment
   * Requirements: 3.1, 3.2, 3.3, 3.4
   */
  public async getCommitteeVotingData({ params, response }: HttpContext) {
    try {
      const studentEnrollId = Number(params.studentEnrollId)

      // Get all committee status records for this enrollment
      const statusRecords = await StudentEnrollStatus.query()
        .where('student_enroll_id', studentEnrollId)
        .preload('instructor')

      if (statusRecords.length === 0) {
        return response.notFound({
          message: 'No status records found for this enrollment',
        })
      }

      // Aggregate committee votes from all records
      const allCommitteeVotes = statusRecords.flatMap((record) => record.committee_votes || [])
      const totalCommitteeMembers = statusRecords.length
      const approvalPercentage = this.calculateApprovalPercentage(allCommitteeVotes)

      // Determine if voting is complete (simplified logic)
      const votingComplete = allCommitteeVotes.length >= Math.ceil(totalCommitteeMembers * 0.5)

      let finalDecision: 'approved' | 'rejected' | undefined
      if (votingComplete) {
        const approveCount = allCommitteeVotes.filter((v) => v.vote === 'approve').length
        const rejectCount = allCommitteeVotes.filter((v) => v.vote === 'reject').length
        finalDecision = approveCount > rejectCount ? 'approved' : 'rejected'
      }

      const committeeVotingData: CommitteeVotingData = {
        studentEnrollId,
        totalCommitteeMembers,
        currentVotes: allCommitteeVotes,
        approvalPercentage,
        votingComplete,
        finalDecision,
      }

      return committeeVotingData
    } catch (error: any) {
      return response.internalServerError({
        message: 'Failed to retrieve committee voting data',
        error: error.message,
      })
    }
  }

  /**
   * Handle advisor approval or rejection
   * Requirements: 2.1, 2.2, 2.3
   */
  public async advisorApproval({ params, request, response, auth }: HttpContext) {
    try {
      const studentEnrollId = Number(params.studentEnrollId)
      const { approved, remarks } = request.only(['approved', 'remarks'])
      const currentUser = auth.user

      if (!currentUser) {
        return response.unauthorized({ message: 'Authentication required' })
      }

      // Find the advisor's status record for this enrollment
      const statusRecord = await StudentEnrollStatus.query()
        .where('student_enroll_id', studentEnrollId)
        .where('instructor_id', currentUser.id)
        .first()

      if (!statusRecord) {
        return response.notFound({
          message: 'Advisor status record not found for this enrollment',
        })
      }

      // Validate current status allows advisor approval
      if (statusRecord.status !== 'registered' && statusRecord.status !== 'pending') {
        return response.badRequest({
          message: 'Enrollment is not in a state that allows advisor approval',
        })
      }

      // Determine new status based on approval decision
      const newStatus: InternshipApprovalStatus = approved ? 't.approved' : 'doc.approved'

      // Update the status with transition tracking
      statusRecord.status = newStatus
      statusRecord.remarks =
        remarks || `Advisor ${approved ? 'approved' : 'rejected'} the application`
      await statusRecord.save()

      return {
        message: `Application ${approved ? 'approved' : 'rejected'} successfully`,
        studentEnrollId,
        newStatus,
        updatedAt: statusRecord.updatedAt.toISO(),
      }
    } catch (error: any) {
      return response.internalServerError({
        message: 'Failed to process advisor approval',
        error: error.message,
      })
    }
  }

  /**
   * Handle committee member voting
   * Requirements: 3.1, 3.2, 3.3
   */
  public async committeeMemberVote({ params, request, response, auth }: HttpContext) {
    try {
      const studentEnrollId = Number(params.studentEnrollId)
      const { vote, remarks } = request.only(['vote', 'remarks'])
      const currentUser = auth.user

      if (!currentUser) {
        return response.unauthorized({ message: 'Authentication required' })
      }

      if (!['approve', 'reject'].includes(vote)) {
        return response.badRequest({ message: 'Vote must be either "approve" or "reject"' })
      }

      // Find the committee member's status record for this enrollment
      const statusRecord = await StudentEnrollStatus.query()
        .where('student_enroll_id', studentEnrollId)
        .where('instructor_id', currentUser.id)
        .first()

      if (!statusRecord) {
        return response.notFound({
          message: 'Committee member status record not found for this enrollment',
        })
      }

      // Validate current status allows committee voting
      if (statusRecord.status !== 't.approved') {
        return response.badRequest({
          message: 'Enrollment is not in a state that allows committee voting',
        })
      }

      // Check if instructor has already voted
      const existingVotes = statusRecord.committee_votes || []
      const hasVoted = existingVotes.some((v: any) => v.instructorId === currentUser.id)

      if (hasVoted) {
        return response.badRequest({
          message: 'You have already voted on this application',
        })
      }

      // Add the vote
      const newVote = {
        instructorId: currentUser.id,
        vote,
        remarks,
        votedAt: DateTime.now(),
      }

      statusRecord.committee_votes = [...existingVotes, newVote]
      await statusRecord.save()

      // Check if voting is complete and determine final status
      const allVotes = statusRecord.committee_votes
      const approveCount = allVotes.filter((v: any) => v.vote === 'approve').length
      const rejectCount = allVotes.filter((v: any) => v.vote === 'reject').length
      const totalVotes = allVotes.length

      // Simple majority logic - can be adjusted based on requirements
      const isVotingComplete = totalVotes >= 3 // Minimum 3 votes required
      let finalStatus: InternshipApprovalStatus | null = null

      if (isVotingComplete) {
        finalStatus = approveCount > rejectCount ? 'c.approved' : 'doc.approved'
        statusRecord.status = finalStatus
        await statusRecord.save()
      }

      return {
        message: 'Vote recorded successfully',
        studentEnrollId,
        vote,
        votingResult: {
          approveCount,
          rejectCount,
          isComplete: isVotingComplete,
          finalStatus,
        },
        updatedAt: statusRecord.updatedAt.toISO(),
      }
    } catch (error: any) {
      return response.internalServerError({
        message: 'Failed to process committee vote',
        error: error.message,
      })
    }
  }
}
