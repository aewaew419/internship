import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import StudentEnrollStatus from '#models/student_enroll_status'
import Instructor from '#models/instructor'

@inject()
export default class InstructorAssignmentController {
  /**
   * GET /api/v1/instructor-assignment/:studentEnrollId
   * Get current instructor assignment for a student enrollment
   */
  public async getCurrentAssignment({ params, response }: HttpContext) {
    try {
      const studentEnrollId = Number(params.studentEnrollId)

      if (!studentEnrollId || studentEnrollId <= 0) {
        return response.badRequest({
          message: 'Valid student enrollment ID is required',
        })
      }

      const enrollStatus = await StudentEnrollStatus.query()
        .where('student_enroll_id', studentEnrollId)
        .preload('student_enroll', (query) => {
          query.preload('student')
          query.preload('course_section', (sectionQuery) => {
            sectionQuery.preload('course')
          })
        })
        .preload('instructor', (query) => {
          query.preload('user')
          query.preload('faculty').preload('program')
        })
        .first()

      if (!enrollStatus) {
        return response.notFound({
          message: 'Student enrollment status not found',
        })
      }

      const latestChange = enrollStatus.getLatestInstructorChange()

      return {
        studentEnrollId: enrollStatus.student_enroll_id,
        studentName: enrollStatus.student_enroll.student.name,
        studentCode: enrollStatus.student_enroll.student.student_id,
        currentInstructor: {
          id: enrollStatus.instructor.id,
          name: `${enrollStatus.instructor.name} ${enrollStatus.instructor.surname}`,
          email: enrollStatus.instructor.user?.email || '',
          department: enrollStatus.instructor.faculty?.faculty_name_en || '',
        },
        courseSection: {
          id: enrollStatus.student_enroll.course_section.id,
          name: enrollStatus.student_enroll.course_section.course.course_name_en,
          code: enrollStatus.student_enroll.course_section.course.course_code,
        },
        internshipStatus: enrollStatus.getStatusDisplayName(),
        canEdit: !['doc.cancel'].includes(enrollStatus.status),
        lastChanged: latestChange
          ? {
              date: latestChange.changedAt.toISO(),
              changedBy: 'Unknown User',
              reason: latestChange.reason,
            }
          : undefined,
      }
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to retrieve instructor assignment',
        error: error.message,
      })
    }
  }

  /**
   * PUT /api/v1/instructor-assignment/:studentEnrollId
   * Update instructor assignment for a student enrollment
   */
  public async updateInstructorAssignment({ params, request, response, auth }: HttpContext) {
    try {
      const studentEnrollId = Number(params.studentEnrollId)
      const { newInstructorId, reason } = request.only(['newInstructorId', 'reason'])

      const user = auth.user
      if (!user) {
        return response.unauthorized({
          message: 'Authentication required',
        })
      }

      if (!studentEnrollId || studentEnrollId <= 0) {
        return response.badRequest({
          message: 'Valid student enrollment ID is required',
        })
      }

      if (!newInstructorId || newInstructorId <= 0) {
        return response.badRequest({
          message: 'Valid new instructor ID is required',
        })
      }

      const enrollStatus = await StudentEnrollStatus.query()
        .where('student_enroll_id', studentEnrollId)
        .first()

      if (!enrollStatus) {
        return response.notFound({
          message: 'Student enrollment status not found',
        })
      }

      const newInstructor = await Instructor.find(newInstructorId)
      if (!newInstructor) {
        return response.badRequest({
          message: 'New instructor not found',
        })
      }

      const success = await enrollStatus.changeInstructor(newInstructorId, user.id, reason)

      if (!success) {
        return response.badRequest({
          message: 'Failed to update instructor assignment. Check if the assignment is valid.',
        })
      }

      return response.ok({
        message: 'Instructor assignment updated successfully',
        newInstructorId: enrollStatus.instructor_id,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to update instructor assignment',
        error: error.message,
      })
    }
  }

  /**
   * GET /api/v1/instructor-assignment/available-instructors?courseId=:courseId
   * Get available instructors for assignment with filtering and capacity information
   */
  public async getAvailableInstructors({ request, response }: HttpContext) {
    try {
      const courseId = request.input('courseId')

      let instructorsQuery = Instructor.query()
        .preload('user')
        .preload('faculty')
        .preload('program')

      if (courseId) {
        instructorsQuery = instructorsQuery
          .whereHas('course_instructors', (courseQuery) => {
            courseQuery.whereHas('course', (query) => {
              query.where('id', courseId)
            })
          })
          .orWhereHas('course_committee', (courseQuery) => {
            courseQuery.whereHas('course', (query) => {
              query.where('id', courseId)
            })
          })
      }

      const instructors = await instructorsQuery

      const instructorOptions = await Promise.all(
        instructors.map(async (instructor) => {
          const workloadCount = await StudentEnrollStatus.query()
            .where('instructor_id', instructor.id)
            .whereNotIn('status', ['doc.cancel', 'denied'])
            .count('*')
            .first()

          const currentWorkload = Number(workloadCount?.$extras.total) || 0
          const maxCapacity = 20
          const isNearCapacity = currentWorkload > maxCapacity * 0.8
          const isOverCapacity = currentWorkload >= maxCapacity

          return {
            id: instructor.id,
            name: `${instructor.name} ${instructor.surname}`,
            email: instructor.user?.email || '',
            department: instructor.faculty?.faculty_name_en || '',
            specialization: [instructor.program?.program_name_en || ''],
            currentWorkload: currentWorkload,
            maxCapacity: maxCapacity,
            isAvailable: !isOverCapacity,
            warningMessage: isNearCapacity
              ? `Instructor is near capacity (${currentWorkload}/${maxCapacity} students)`
              : isOverCapacity
                ? `Instructor is over capacity (${currentWorkload}/${maxCapacity} students)`
                : undefined,
          }
        })
      )

      instructorOptions.sort((a, b) => {
        if (a.isAvailable !== b.isAvailable) {
          return a.isAvailable ? -1 : 1
        }
        return a.currentWorkload - b.currentWorkload
      })

      return instructorOptions
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to retrieve available instructors',
        error: error.message,
      })
    }
  }

  /**
   * GET /api/v1/instructor-assignment/:studentEnrollId/history
   * Get assignment history for audit trail display
   */
  public async getAssignmentHistory({ params, response }: HttpContext) {
    try {
      const studentEnrollId = Number(params.studentEnrollId)

      if (!studentEnrollId || studentEnrollId <= 0) {
        return response.badRequest({
          message: 'Valid student enrollment ID is required',
        })
      }

      const enrollStatus = await StudentEnrollStatus.query()
        .where('student_enroll_id', studentEnrollId)
        .first()

      if (!enrollStatus) {
        return response.notFound({
          message: 'Student enrollment status not found',
        })
      }

      const history = enrollStatus.getInstructorAssignmentHistory()

      const enrichedHistory = await Promise.all(
        history.map(async (entry, index) => {
          const [previousInstructor, newInstructor, changedByUser] = await Promise.all([
            entry.previousInstructorId ? Instructor.find(entry.previousInstructorId) : null,
            Instructor.find(entry.newInstructorId),
            db.from('users').where('id', entry.changedBy).first(),
          ])

          return {
            id: index + 1,
            previousInstructor: previousInstructor
              ? {
                  id: previousInstructor.id,
                  name: `${previousInstructor.name} ${previousInstructor.surname}`,
                }
              : undefined,
            newInstructor: {
              id: newInstructor?.id || entry.newInstructorId,
              name: newInstructor
                ? `${newInstructor.name} ${newInstructor.surname}`
                : 'Unknown Instructor',
            },
            changedBy: {
              id: entry.changedBy,
              name: changedByUser?.name || 'Unknown User',
            },
            changedAt: entry.changedAt.toISO(),
            reason: entry.reason,
            notificationStatus: entry.notificationSent ? 'sent' : 'pending',
          }
        })
      )

      return enrichedHistory.reverse()
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to retrieve assignment history',
        error: error.message,
      })
    }
  }
}
