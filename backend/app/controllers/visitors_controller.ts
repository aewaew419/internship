import type { HttpContext } from '@adonisjs/core/http'
import VisitorTraining from '#models/visitor_training'

export default class VisitorsController {
  public async index({}: HttpContext) {
    const visitors = await VisitorTraining.query()
      .preload('studentEnroll', (q) => q.preload('student'))
      .preload('visitor')
    return visitors
  }
  public async show({ params }: HttpContext) {
    const visitor = await VisitorTraining.query()
      .where('visitor_instructor_id', params.id)
      .preload('studentEnroll', (q) => {
        q.preload('student')
        q.preload('student_training', (trainingQuery) => {
          trainingQuery.preload('company')
        })
      })
      .preload('visitor')
      .preload('schedules')
    return visitor
  }
}
