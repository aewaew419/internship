import type { HttpContext } from '@adonisjs/core/http'
import VisitorEvaluateStudent from '#models/visitor_evaluate_student'
// import VisitorTraining from '#models/visitor_training'
import StudentEnroll from '#models/student_enroll'
import db from '@adonisjs/lucid/services/db'
export default class VisitorEvaluateStudentsController {
  public async index({ request }: HttpContext) {
    const instructorId = request.input('instructor_id')
    
    if (!instructorId) {
      const visitorEvaluateStudent = await VisitorEvaluateStudent.all()
      return visitorEvaluateStudent
    }

    // Get visitor trainings with evaluation status
    const visitorTrainings = await db
      .from('visitor_trainings as vt')
      .leftJoin('student_enrolls as se', 'vt.student_enroll_id', 'se.id')
      .leftJoin('students as s', 'se.student_id', 's.id')
      .leftJoin('users as u', 's.user_id', 'u.id')
      .leftJoin('student_trainings as st', 'se.id', 'st.student_enroll_id')
      .leftJoin('companies as c', 'st.company_id', 'c.id')
      .leftJoin('visitor_schedules as vs', 'vt.id', 'vs.visitor_training_id')
      .leftJoin('visitor_evaluate_students as ves', 'vt.id', 'ves.visitor_training_id')
      .where('vt.visitor_instructor_id', instructorId)
      .select(
        'vt.id',
        'vt.visitor_instructor_id as visitorInstructorId',
        'vt.student_enroll_id as studentEnrollId',
        'vt.created_at as createdAt',
        'vt.updated_at as updatedAt',
        // Student information
        'se.id as studentEnrollId',
        's.id as studentId',
        's.student_id as studentCode',
        's.name as studentName',
        's.middle_name as studentMiddleName',
        's.surname as studentSurname',
        'u.email as studentEmail',
        // Company information
        'c.id as companyId',
        'c.company_name_th as companyName',
        'st.position',
        'st.department',
        // Evaluation status
        db.raw('COUNT(DISTINCT ves.id) as evaluationCount'),
        db.raw('COUNT(DISTINCT vs.id) as scheduleCount'),
        db.raw('COUNT(DISTINCT CASE WHEN ves.score > 0 THEN ves.id END) as completedEvaluationCount'),
        db.raw('CASE WHEN COUNT(DISTINCT ves.id) > 0 AND COUNT(DISTINCT CASE WHEN ves.score > 0 THEN ves.id END) = COUNT(DISTINCT ves.id) THEN "ประเมินแล้ว" WHEN COUNT(DISTINCT CASE WHEN ves.score > 0 THEN ves.id END) > 0 THEN "ประเมินบางส่วน" ELSE "ยังไม่ประเมิน" END as evaluationStatus')
      )
      .groupBy(
        'vt.id', 'vt.visitor_instructor_id', 'vt.student_enroll_id', 
        'vt.created_at', 'vt.updated_at', 'se.id', 's.id', 's.student_id',
        's.name', 's.middle_name', 's.surname', 'u.email',
        'c.id', 'c.company_name_th', 'st.position', 'st.department'
      )

    // Transform to match frontend interface
    const transformedData = visitorTrainings.map((training: any) => ({
      id: training.id,
      visitorInstructorId: training.visitorInstructorId,
      studentEnrollId: training.studentEnrollId,
      createdAt: training.createdAt,
      updatedAt: training.updatedAt,
      evaluationStatus: training.evaluationStatus,
      evaluationCount: training.evaluationCount,
      completedEvaluationCount: training.completedEvaluationCount,
      scheduleCount: training.scheduleCount,
      isEvaluationComplete: training.evaluationCount > 0 && training.completedEvaluationCount === training.evaluationCount,
      studentEnroll: {
        id: training.studentEnrollId,
        student: {
          id: training.studentId,
          studentId: training.studentCode,
          name: training.studentName,
          middleName: training.studentMiddleName,
          surname: training.studentSurname,
          email: training.studentEmail,
        },
        student_training: {
          position: training.position,
          department: training.department,
          company: {
            id: training.companyId,
            name: training.companyName,
          }
        }
      },
      schedules: []
    }))

    return transformedData
  }

  public async show({ params }: HttpContext) {
    const visitorEvaluateStudent = await VisitorEvaluateStudent.query()
      .preload('training')
      .where('visitor_training_id', params.id)
    return visitorEvaluateStudent
  }
  public async update({ params, request, response }: HttpContext) {
    try {
      const visitorEvaluateStudent = await VisitorEvaluateStudent.query()
        .preload('training', (q) => q.preload('studentEnroll'))
        .where('visitor_training_id', params.id)
        .firstOrFail()

      const { ids, scores, comment } = request.only(['ids', 'scores', 'comment'])
      if (ids.length !== scores.length) {
        return response.badRequest({ message: 'ids and scores length must match' })
      }
      const existing = await VisitorEvaluateStudent.query().whereIn('id', ids).select('id')
      const existingSet = new Set(existing.map((r) => r.id))
      const notFound = ids.filter((id: number) => !existingSet.has(id))

      // map id -> score
      const scorePairs: [number, number][] = ids.map((id: number, i: number): [number, number] => [
        id,
        scores[i] as number,
      ])
      const scoreMap = new Map<number, number>(scorePairs)

      const trx = await db.transaction()
      try {
        // load rows once inside trx, then save
        const rows = await VisitorEvaluateStudent.query({ client: trx }).whereIn(
          'id',
          Array.from(existingSet)
        )

        for (const row of rows) {
          const sc = scoreMap.get(row.id)
          if (typeof sc === 'number') row.score = sc
          if (typeof comment === 'string') row.comment = comment // request.comment -> column 'comments'
          await row.save()
        }
        const evaluate = request.only(['company_score'])

        const studentEnroll = await StudentEnroll.findOrFail(
          visitorEvaluateStudent.training.studentEnroll.id
        )
        studentEnroll.merge({ company_score: evaluate.company_score })
        await studentEnroll.save()
        await trx.commit()
        return {
          message: 'Updated visitor student evaluations',
          updated_ids: rows.map((r) => r.id),
          not_found: notFound,
        }
      } catch (err) {
        await trx.rollback()
        return response.internalServerError({ message: 'Bulk update failed', error: String(err) })
      }
    } catch (error) {
      return error
    }
  }
}
