import type { HttpContext } from '@adonisjs/core/http'
import StudentEvaluateCompany from '#models/student_evaluate_company'
import db from '@adonisjs/lucid/services/db'

export default class StudentEvaluateCompaniesController {
  public async index({}: HttpContext) {
    const visitorEvaluateStudent = await StudentEvaluateCompany.all()
    return visitorEvaluateStudent
  }

  public async show({ params }: HttpContext) {
    const visitorEvaluateStudent = await StudentEvaluateCompany.query()
      .preload('student_training')
      .where('student_training_id', params.id)
    return visitorEvaluateStudent
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
