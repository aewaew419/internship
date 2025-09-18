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

  public async update({ request, response, params, auth }: HttpContext) {
    try {
      // Check if user is authenticated
      if (!auth.user) {
        return response.unauthorized({
          success: false,
          message: 'Authentication required',
        })
      }

      const studentTrainingId = params.id

      // Validate studentTrainingId parameter
      if (!studentTrainingId || isNaN(Number(studentTrainingId))) {
        return response.badRequest({
          success: false,
          message: 'Valid student training ID is required',
        })
      }

      // Get student training with company information for authorization
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
      const currentUserId = auth.user.id
      const trainingStudentUserId = studentTraining.student_enroll.student.user_id

      if (currentUserId !== trainingStudentUserId) {
        return response.forbidden({
          success: false,
          message: 'Access denied: You can only submit evaluations for your own training',
        })
      }

      // Get evaluation data from request
      const { score, questions, comment } = request.only(['score', 'questions', 'comment'])

      // Validate required fields
      if (score === undefined || score === null) {
        return response.badRequest({
          success: false,
          message: 'Score is required',
        })
      }

      if (typeof score !== 'number' || score < 0 || score > 100) {
        return response.badRequest({
          success: false,
          message: 'Score must be a number between 0 and 100',
        })
      }

      const trx = await db.transaction()
      try {
        // Check if evaluation already exists
        let evaluation = await StudentEvaluateCompany.query({ client: trx })
          .where('student_training_id', studentTrainingId)
          .first()

        if (evaluation) {
          // Update existing evaluation
          evaluation.score = score
          evaluation.questions = questions || evaluation.questions
          evaluation.comment = comment || evaluation.comment
          await evaluation.save()
        } else {
          // Create new evaluation
          evaluation = await StudentEvaluateCompany.create(
            {
              student_training_id: Number(studentTrainingId),
              score,
              questions: questions || '',
              comment: comment || '',
            },
            { client: trx }
          )
        }

        await trx.commit()

        // Prepare redirect URL
        const redirectUrl = `/company_evaluation/company?id=${studentTrainingId}`

        return response.ok({
          success: true,
          message: 'Evaluation submitted successfully',
          redirectUrl,
          evaluationId: evaluation.id,
          evaluationDate: evaluation.updatedAt.toISO(),
          companyName:
            studentTraining.company.company_name_th || studentTraining.company.company_name_en,
        })
      } catch (err) {
        await trx.rollback()
        throw err
      }
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'An error occurred while submitting the evaluation',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }
}
