import type { HttpContext } from '@adonisjs/core/http'
import StudentEvaluateCompany from '#models/student_evaluate_company'
import StudentTraining from '#models/student_training'
import db from '@adonisjs/lucid/services/db'

export default class StudentEvaluateCompaniesController {
  public async index({}: HttpContext) {
    const visitorEvaluateStudent = await StudentEvaluateCompany.all()
    return visitorEvaluateStudent
  }

  /**
   * Check evaluation status for a specific student training
   * GET /student/evaluate/company/:studentTrainingId/status
   */
  public async checkEvaluationStatus({ params, response }: HttpContext) {
    try {
      // Check if user is authenticated
      // if (!auth.user) {
      //   return response.unauthorized({
      //     success: false,
      //     message: 'Authentication required'
      //   })
      // }

      const studentTrainingId = params.studentTrainingId

      // Validate studentTrainingId parameter
      // if (!studentTrainingId || isNaN(Number(studentTrainingId))) {
      //   return response.badRequest({
      //     success: false,
      //     message: 'Valid student training ID is required'
      //   })
      // }

      // Get student training with company information
      const studentTraining = await StudentTraining.query()
        .where('id', studentTrainingId)
        .preload('company')
        .preload('student_enroll', (query) => {
          query.preload('student')
        })
        .first()

      if (!studentTraining) {
        return response.notFound({
          success: false,
          message: 'Student training not found',
        })
      }

      // Authorization check: ensure the authenticated user is the student who owns this training
      // const currentUserId = auth.user.id
      // const trainingStudentUserId = studentTraining.student_enroll.student.user_id

      // if (currentUserId !== trainingStudentUserId) {
      //   return response.forbidden({
      //     success: false,
      //     message: 'Access denied: You can only check your own evaluation status'
      //   })
      // }

      // Check if evaluation exists
      const hasEvaluated = await StudentEvaluateCompany.hasEvaluated(studentTrainingId)

      let evaluationDate = null
      if (hasEvaluated) {
        const evaluation = await StudentEvaluateCompany.query()
          .where('student_training_id', studentTrainingId)
          .first()
        evaluationDate = evaluation?.createdAt?.toISO()
      }

      return response.ok({
        success: true,
        hasEvaluated,
        evaluationDate,
        companyName:
          studentTraining.company.company_name_th || studentTraining.company.company_name_en,
        companyId: studentTraining.company.id,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'An error occurred while checking evaluation status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      // Check if user is authenticated
      // if (!auth.user) {
      //   return response.unauthorized({
      //     success: false,
      //     message: 'Authentication required'
      //   })
      // }

      const studentTrainingId = params.id

      // Validate studentTrainingId parameter
      if (!studentTrainingId || isNaN(Number(studentTrainingId))) {
        return response.badRequest({
          success: false,
          message: 'Valid student training ID is required',
        })
      }

      // First check if the student training exists and get company information
      const studentTraining = await StudentTraining.query()
        .where('id', studentTrainingId)
        .preload('company')
        .preload('student_enroll', (query) => {
          query.preload('student')
        })
        .first()

      if (!studentTraining) {
        return response.notFound({
          success: false,
          message: 'Student training not found',
        })
      }

      // Authorization check: ensure the authenticated user is the student who owns this training
      // const currentUserId = auth.user.id
      // const trainingStudentUserId = studentTraining.student_enroll.student.user_id

      // if (currentUserId !== trainingStudentUserId) {
      //   return response.forbidden({
      //     success: false,
      //     message: 'Access denied: You can only view your own evaluation data'
      //   })
      // }

      // Get evaluation questions/template data
      const visitorEvaluateStudent = await StudentEvaluateCompany.query()
        .preload('student_training')
        .where('student_training_id', params.id)

      return visitorEvaluateStudent
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'An error occurred while fetching evaluation data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  public async update({ request, response }: HttpContext) {
    const { ids, scores, comment } = request.only(['ids', 'scores', 'comment'])
    if (ids.length !== scores.length) {
      return response.badRequest({ message: 'ids and scores length must match' })
    }
    const existing = await StudentEvaluateCompany.query()
      .whereIn('id', ids as number[])
      .select('id')
    const existingSet = new Set<number>(existing.map((r) => r.id))
    const notFound = ids.filter((id: number) => !existingSet.has(id))

    // id -> score mapping (typed to satisfy noImplicitAny)
    const pairs: [number, number][] = ids.map((id: number, i: number): [number, number] => [
      id,
      scores[i] as number,
    ])
    const scoreMap = new Map<number, number>(pairs)

    const trx = await db.transaction()
    try {
      const rows = await StudentEvaluateCompany.query({ client: trx }).whereIn(
        'id',
        Array.from(existingSet) as number[]
      )

      for (const row of rows) {
        const sc = scoreMap.get(row.id as number)
        if (typeof sc === 'number') row.score = sc
        if (typeof comment === 'string') row.comment = comment
        await row.save()
      }

      await trx.commit()
      return {
        message: 'Bulk update complete',
        updated_ids: rows.map((r) => r.id),
        not_found: notFound,
      }
    } catch (err) {
      await trx.rollback()
      return response.internalServerError({ message: 'Bulk update failed', error: String(err) })
    }
  }
}
