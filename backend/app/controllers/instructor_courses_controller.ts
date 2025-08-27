import type { HttpContext } from '@adonisjs/core/http'
import Instructor from '#models/instructor'
import CourseSection from '#models/course_section'
import StudentEnrollStatus from '#models/student_enroll_status'
import VisitorTraining from '#models/visitor_training'
import StudentEnroll from '#models/student_enroll'
import db from '@adonisjs/lucid/services/db'
import VisitorEvaluateCompany from '#models/visitor_evaluate_company'
import VisitorEvaluateStudent from '#models/visitor_evaluate_student'
const DEFAULT_VISITOR_STUDENT_EVAL_QUESTIONS = [
  'ความรู้ความสามารถทางวิชาการ',
  'ความตั้งใจและรับผิดชอบในงาน',
  'มนุษยสัมพันธ์และการทำงานร่วมกับผู้อื่น',
  'การตรงต่อเวลาและวินัยในการทำงาน',
  'ความคิดริเริ่มสร้างสรรค์',
  'ความเหมาะสมของบุคลิกภาพในการทำงาน',
  'ความเหมาะสมของบุคลิกภาพในการทำงาน',
]
const DEFAULT_VISITOR_COMPANY_EVAL_QUESTIONS = [
  'ความเหมาะสมของลักษณะงานกับสาขาวิชาที่เรียน',
  'ความเป็นมิตรและให้ความร่วมมือของพนักงาน',
  'สภาพแวดล้อมในการทำงาน (ความสะอาด ปลอดภัย)',
  'ความชัดเจนในการมอบหมายงาน',
  'โอกาสในการเรียนรู้และพัฒนาทักษะระหว่างการฝึกงาน',
]
export default class InstructorCoursesController {
  public async index({ request }: HttpContext) {
    try {
      const instructor_id = request.input('instructor_id')
      const course_id = request.input('course_id')

      if (instructor_id) {
        const isInstructor = await Instructor.query()
          .where('id', instructor_id)
          .preload('course_instructors')
          .preload('student_enroll_statuses', (query) => {
            query.preload('student_enroll')
          })
          .firstOrFail()
        if (isInstructor.course_instructors.length !== 0) {
          return isInstructor
        }
        const isCommittee = await Instructor.query()
          .where('id', instructor_id)
          .preload('course_committee')
          .preload('student_enroll_statuses', (query) => {
            query.preload('student_enroll')
          })
          .firstOrFail()
        if (isCommittee.course_committee.length !== 0) {
          return isCommittee
        }
        return { message: 'Instructor has no courses or committees' }
      }
      if (course_id) {
        return await CourseSection.query()
          .where('id', course_id)
          .preload('course_instructors')
          .preload('course_committee')
          .firstOrFail()
      }
      return CourseSection.query()
        .preload('course')
        .preload('course_instructors', (query) => {
          query.preload('user', (query) => {
            query.preload('instructors')
          })
        })
    } catch (error) {
      return error
    }
  }
  async show({ params }: HttpContext) {
    try {
      const courseInstructor = await CourseSection.query()
        .where('id', params.id)
        .preload('course_instructors')
        .firstOrFail()
      return courseInstructor
    } catch (error) {
      return error
    }
  }
  public async getInstructorApproved({ request }: HttpContext) {
    try {
      const instructor_id = request.input('instructor_id')
      if (instructor_id) {
        return await Instructor.query()
          .where('id', instructor_id)
          .preload('course_instructors', (query) => {
            query.where('approved', true)
          })
          .firstOrFail()
      }
      return Instructor.query().preload('course_instructors', (query) => {
        query.where('approved', true)
      })
    } catch (error) {
      return error
    }
  }
  async changeStatusStudentEnroll({ request, params }: HttpContext) {
    try {
      const studentEnrollStatus = await StudentEnrollStatus.findOrFail(params.id)
      const data = request.only(['status', 'remarks'])

      studentEnrollStatus.merge(data)
      await studentEnrollStatus.save()

      return { message: 'Instructor course status updated', studentEnrollStatus }
    } catch (error) {
      return error
    }
  }
  public async assignVisitorForStudent({ request }: HttpContext) {
    try {
      const { student_enroll_id, visitor_instructor_id } = request.only([
        'student_enroll_id',
        'visitor_instructor_id',
      ])

      // Ensure not already assigned (1 visitor per student_enroll)
      const existing = await VisitorTraining.query()
        .where('student_enroll_id', student_enroll_id)
        .first()
      if (existing) {
        return {
          message: 'Visitor already assigned for this student_enroll',
          visitorTraining: existing,
        }
      }

      // Create assignment
      const training = await VisitorTraining.create({
        student_enroll_id: student_enroll_id,
        visitor_instructor_id: visitor_instructor_id,
      })

      await VisitorEvaluateCompany.createMany(
        DEFAULT_VISITOR_COMPANY_EVAL_QUESTIONS.map((question) => ({
          visitor_training_id: training.id,
          questions: question,
        }))
      )
      await VisitorEvaluateStudent.createMany(
        DEFAULT_VISITOR_STUDENT_EVAL_QUESTIONS.map((question) => ({
          visitor_training_id: training.id,
          questions: question,
        }))
      )

      return { message: 'Visitor assigned', visitorTraining: training }
    } catch (error) {
      return error
    }
  }

  public async store({ request }: HttpContext) {
    try {
      const data = request.only(['instructor_id', 'course_section_id'])
      const instructor = await Instructor.findOrFail(data.instructor_id)
      const course = await CourseSection.findOrFail(data.course_section_id)

      if (!instructor || !course) {
        return { message: 'Instructor or course not found' }
      }

      const exists = await course
        .related('course_instructors')
        .query()
        .wherePivot('instructor_id', data.instructor_id)
        .first()
      if (exists) {
        return { message: 'Instructor course already exists' }
      }

      await course.related('course_instructors').attach([data.instructor_id])

      return { message: 'Instructor course created' }
    } catch (error) {
      return error
    }
  }

  public async destroy({ params }: HttpContext) {
    try {
      const { instructor_id, course_id } = params
      const instructor = await Instructor.findOrFail(instructor_id)
      const course = await CourseSection.findOrFail(course_id)
      if (!instructor || !course) {
        return { message: 'Instructor or course not found' }
      }
      await course
        .related('course_instructors')
        .query()
        .where('instructor_id', instructor_id)
        .where('course_section_id', course_id)
        .delete()

      return { message: 'Instructor course deleted' }
    } catch (error) {
      return error
    }
  }
  async bulkAssignVisitorForStudents({ request, response }: HttpContext) {
    const { student_enroll_ids, visitor_instructor_id } = request.only([
      'student_enroll_ids',
      'visitor_instructor_id',
    ])

    if (!Array.isArray(student_enroll_ids) || student_enroll_ids.length === 0) {
      return response.badRequest({ message: 'student_enroll_ids must be a non-empty array' })
    }

    // ensure visitor exists
    await Instructor.findOrFail(visitor_instructor_id)

    // ensure enrolls exist
    const existingEnrolls = await StudentEnroll.query()
      .whereIn('id', student_enroll_ids)
      .select('id')
    const existingEnrollIdSet = new Set(existingEnrolls.map((e) => e.id))
    const notFound = student_enroll_ids.filter((id: number) => !existingEnrollIdSet.has(id))

    // which already assigned?
    const existingAssignments = await VisitorTraining.query()
      .whereIn('student_enroll_id', student_enroll_ids)
      .select('student_enroll_id')
    const alreadyAssignedSet = new Set(existingAssignments.map((v) => v.student_enroll_id))

    const toCreate = student_enroll_ids
      .filter((id: number) => existingEnrollIdSet.has(id))
      .filter((id: number) => !alreadyAssignedSet.has(id))

    if (toCreate.length === 0) {
      return {
        message: 'No new assignments created',
        created_ids: [],
        skipped_existing: Array.from(alreadyAssignedSet),
        notFound,
      }
    }

    const trx = await db.transaction()
    try {
      const trainings = await VisitorTraining.createMany(
        toCreate.map((id: number) => ({
          student_enroll_id: id,
          visitor_instructor_id,
        })),
        { client: trx }
      )
      const companyRows = trainings.flatMap((t) =>
        DEFAULT_VISITOR_COMPANY_EVAL_QUESTIONS.map((q) => ({
          visitor_training_id: t.id,
          questions: q,
        }))
      )
      if (companyRows.length) {
        await VisitorEvaluateCompany.createMany(companyRows, { client: trx })
      }

      // 3) seed default Student evaluations (N questions per training)
      const studentRows = trainings.flatMap((t) =>
        DEFAULT_VISITOR_STUDENT_EVAL_QUESTIONS.map((q) => ({
          visitor_training_id: t.id,
          questions: q,
        }))
      )
      if (studentRows.length) {
        await VisitorEvaluateStudent.createMany(studentRows, { client: trx })
      }
      await trx.commit()
      return {
        message: 'Visitor assigned to selected students',
        created_ids: toCreate,
        skipped_existing: Array.from(alreadyAssignedSet),
        notFound,
      }
    } catch (error) {
      await trx.rollback()
      return response.internalServerError({ message: 'Bulk assign failed', error: String(error) })
    }
  }
  async updateVisitorForStudent({ request, response }: HttpContext) {
    const { student_enroll_id, visitor_instructor_id } = request.only([
      'student_enroll_id',
      'visitor_instructor_id',
    ])

    await Instructor.findOrFail(visitor_instructor_id)

    const assignment = await VisitorTraining.query()
      .where('student_enroll_id', student_enroll_id)
      .first()

    if (!assignment) {
      return response.notFound({
        message: 'No visitor assigned yet for this student_enroll. Assign first, then update.',
      })
    }

    assignment.visitor_instructor_id = visitor_instructor_id
    await assignment.save()

    return { message: 'Visitor updated', visitorTraining: assignment }
  }
  public async deleteVisitorForStudent({ params, response }: HttpContext) {
    const studentEnrollId = Number(params.student_enroll_id)

    const assignment = await VisitorTraining.query()
      .where('student_enroll_id', studentEnrollId)
      .first()

    if (!assignment) {
      return response.notFound({
        message: 'No visitor assigned for this student_enroll.',
      })
    }

    await assignment.delete()
    return { message: 'Visitor unassigned', student_enroll_id: studentEnrollId }
  }
}
