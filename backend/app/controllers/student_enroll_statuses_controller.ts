import type { HttpContext } from '@adonisjs/core/http'
import StudentEnrollStatus from '#models/student_enroll_status'
import StudentEnroll from '#models/student_enroll'
import db from '@adonisjs/lucid/services/db'

export default class StudentEnrollStatusesController {
  public async index({}: HttpContext) {
    const studentEnrollStatuses = await StudentEnrollStatus.query().preload('student_enroll')
    return studentEnrollStatuses
  }
  public async show({ params }: HttpContext) {
    const studentEnrollStatus = await StudentEnrollStatus.findOrFail(params.id)
    return studentEnrollStatus
  }

  public async update({ request, params }: HttpContext) {
    const studentEnrollStatus = await StudentEnrollStatus.findOrFail(params.id)
    const data = request.only(['status', 'remarks'])
    studentEnrollStatus.merge(data)
    await studentEnrollStatus.save()
    return { message: 'Student enroll status updated', studentEnrollStatus }
  }
  async updateAllStatus({ request, response }: HttpContext) {
    const ids: number[] = request.input('ids') || []
    const { status, remarks } = request.only(['status', 'remarks'])

    if (!Array.isArray(ids) || ids.length === 0) {
      return response.badRequest({ message: 'ids must be a non-empty array' })
    }

    const affected = await StudentEnrollStatus.query()
      .whereIn('id', ids)
      .update({ status, remarks })

    return { message: 'Student enroll statuses updated', affected }
  }

  public async destroy({ params }: HttpContext) {
    const studentEnrollStatus = await StudentEnrollStatus.findOrFail(params.id)
    await studentEnrollStatus.delete()
    return { message: 'Student enroll status deleted' }
  }
  public async getByStudentEnrollId({ request }: HttpContext) {
    const studentEnrollId = request.input('student_enroll_id')
    if (!studentEnrollId) {
      return { message: 'Student enroll ID is required' }
    }
    const studentEnrollStatuses = await StudentEnrollStatus.query().where(
      'student_enroll_id',
      studentEnrollId
    )
    return studentEnrollStatuses
  }
  public async getByInstructorId({ params }: HttpContext) {
    const instructorId = params.instructor_id
    if (!instructorId) {
      return { message: 'Instructor ID is required' }
    }
    const studentEnrollStatuses = await StudentEnrollStatus.query()
      .where('instructor_id', instructorId)
      .preload('student_enroll', (query) =>
        query.preload('student_training', (query) => query.preload('company')).preload('student')
      )
    return studentEnrollStatuses
  }
  public async getStudentEnrollApprove({}: HttpContext) {
    const agg = await db
      .from('student_enroll_statuses as ses')
      .innerJoin('student_enrolls as se', 'se.id', 'ses.student_enroll_id')
      .leftJoin('course_instructors as ci', (join) => {
        join
          .on('ci.instructor_id', 'ses.instructor_id')
          .on('ci.course_section_id', 'se.course_section_id')
      })
      .leftJoin('course_committees as cc', (join) => {
        join
          .on('cc.instructor_id', 'ses.instructor_id')
          .on('cc.course_section_id', 'se.course_section_id')
      })
      .groupBy('ses.student_enroll_id')
      .select('ses.student_enroll_id')
      // totals per role
      .select(
        db.raw(`SUM(CASE WHEN ci.instructor_id IS NOT NULL THEN 1 ELSE 0 END) AS total_instructors`)
      )
      .select(
        db.raw(`SUM(CASE WHEN cc.instructor_id IS NOT NULL THEN 1 ELSE 0 END) AS total_committee`)
      )
      // approvals per role
      .select(
        db.raw(
          `SUM(CASE WHEN ci.instructor_id IS NOT NULL AND ses.status = 'approve' THEN 1 ELSE 0 END) AS approved_instructors`
        )
      )
      .select(
        db.raw(
          `SUM(CASE WHEN cc.instructor_id IS NOT NULL AND ses.status = 'approve' THEN 1 ELSE 0 END) AS approved_committee`
        )
      )
      // all instructors approved AND committee >= half approved
      .havingRaw(
        `approved_instructors = total_instructors AND approved_committee >= CEIL(total_committee/2)`
      )

    const ids = agg.map((r: any) => r.student_enroll_id)

    // Return whatever you need — e.g., full enrollments with relations
    const enrolls = await StudentEnroll.query()
      .whereIn('id', ids)
      .preload('student_training', (query) => query.preload('company'))
      .preload('student', (query) => query.preload('program')) // adjust to your relations
      .preload('course_section')
      .preload('visitor_training', (query) => query.preload('visitor'))

    return enrolls
  }
  async getApprovalCountsByEnrollId({ params, response }: HttpContext) {
    const enrollId = Number(params.id)

    const row = await db
      .from('student_enroll_statuses as ses')
      .innerJoin('student_enrolls as se', 'se.id', 'ses.student_enroll_id')
      .leftJoin('course_instructors as ci', (join) => {
        join
          .on('ci.instructor_id', 'ses.instructor_id')
          .on('ci.course_section_id', 'se.course_section_id')
      })
      .leftJoin('course_committees as cc', (join) => {
        join
          .on('cc.instructor_id', 'ses.instructor_id')
          .on('cc.course_section_id', 'se.course_section_id')
      })
      .where('ses.student_enroll_id', enrollId)
      .groupBy('ses.student_enroll_id')
      .select('ses.student_enroll_id')
      // totals
      .select(
        db.raw('SUM(ci.instructor_id IS NOT NULL) AS total_instructors'),
        db.raw('SUM(cc.instructor_id IS NOT NULL) AS total_committee')
      )
      // approvals
      .select(
        db.raw(
          "SUM(ci.instructor_id IS NOT NULL AND ses.status = 'approve') AS approved_instructors"
        ),
        db.raw("SUM(cc.instructor_id IS NOT NULL AND ses.status = 'approve') AS approved_committee")
      )
      // rejections (exclude NULL/pending)
      .select(
        db.raw("SUM(cc.instructor_id IS NOT NULL AND ses.status = 'reject') AS rejected_committee")
      )
      .first()

    if (!row) {
      return response.notFound({ message: 'No statuses found for this enrollment.' })
    }

    const totalInstructors = Number(row.total_instructors) || 0
    const totalCommittee = Number(row.total_committee) || 0
    const approvedInstructors = Number(row.approved_instructors) || 0
    const approvedCommittee = Number(row.approved_committee) || 0
    const rejectedCommittee = Number(row.rejected_committee) || 0 // ← only 'reject'

    const requiredCommittee = Math.ceil(totalCommittee / 2)
    const neededToPass = Math.max(requiredCommittee - approvedCommittee, 0)

    const allInstructorsApproved = approvedInstructors === totalInstructors
    const halfCommitteeApproved = approvedCommittee >= requiredCommittee
    const passed = allInstructorsApproved && halfCommitteeApproved

    return {
      student_enroll_id: enrollId,
      instructors: {
        approved: approvedInstructors,
        total: totalInstructors,
        allApproved: allInstructorsApproved,
      },
      committee: {
        approved: approvedCommittee,
        rejected: rejectedCommittee, // ← only rejects counted
        total: totalCommittee,
        requiredToPass: requiredCommittee,
        halfOrMoreApproved: halfCommitteeApproved,
        neededToPass,
      },
      overall: { passed },
    }
  }
}
