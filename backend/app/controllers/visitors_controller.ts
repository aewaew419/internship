import type { HttpContext } from '@adonisjs/core/http'
import VisitorTraining from '#models/visitor_training'

export default class VisitorsController {
  public async index({}: HttpContext) {
    const visitors = await VisitorTraining.query().preload('studentEnroll')
    return visitors
  }
  public async show({ params }: HttpContext) {
    const visitor = await VisitorTraining.query()
      .where('visitor_instructor_id', params.id)
      .preload('studentEnroll')
    return visitor
  }
}
