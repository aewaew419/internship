import type { HttpContext } from '@adonisjs/core/http'
import VisitorEvaluateCompany from '#models/visitor_evaluate_company'
import db from '@adonisjs/lucid/services/db'
export default class VisitorEvaluateCompaniesController {
  public async index({}: HttpContext) {
    const visitorEvaluateCompanies = await VisitorEvaluateCompany.all()
    return visitorEvaluateCompanies
  }
  public async show({ params }: HttpContext) {
    const visitorEvaluateCompanies = await VisitorEvaluateCompany.query()
      .preload('training', (q) =>
        q.preload('studentEnroll', (q) =>
          q.preload('student_training', (q) => q.preload('company'))
        )
      )
      .where('visitor_training_id', params.id)
    return visitorEvaluateCompanies
  }
  public async update({ request, response }: HttpContext) {
    try {
      const { ids, scores, comment } = request.only(['ids', 'scores', 'comment'])
      if (ids.length !== scores.length) {
        return response.badRequest({ message: 'ids and scores length must match' })
      }
      const existing = await VisitorEvaluateCompany.query().whereIn('id', ids).select('id')
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
        const rows = await VisitorEvaluateCompany.query({ client: trx }).whereIn(
          'id',
          Array.from(existingSet)
        )

        for (const row of rows) {
          const sc = scoreMap.get(row.id)
          if (typeof sc === 'number') row.score = sc
          if (typeof comment === 'string') row.comment = comment // request.comment -> column 'comments'
          await row.save()
        }

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
