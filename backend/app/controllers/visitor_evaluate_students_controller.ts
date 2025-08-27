import type { HttpContext } from '@adonisjs/core/http'
import VisitorEvaluateStudent from '#models/visitor_evaluate_student'
import StudentEnroll from '#models/student_enroll'
import db from '@adonisjs/lucid/services/db'
export default class VisitorEvaluateStudentsController {
  public async index({}: HttpContext) {
    const visitorEvaluateStudent = await VisitorEvaluateStudent.all()
    return visitorEvaluateStudent
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
