import type { HttpContext } from '@adonisjs/core/http'
import VisitorTraining from '#models/visitor_training'

export default class VisitorsController {
  public async index({}: HttpContext) {
    const visitors = await VisitorTraining.query().preload('studentEnroll')
    return visitors
  }
}
