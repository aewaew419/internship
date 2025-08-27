import type { HttpContext } from '@adonisjs/core/http'
import VisitorSchedule from '#models/visitor_schedule'
import VisitorTraining from '#models/visitor_training'
export default class VisitorSchedulesController {
  async index({}) {
    return VisitorSchedule.all()
  }
  async getVisitorScheduleByID({ params }: HttpContext) {
    const schedule = await VisitorSchedule.findOrFail(params.id)
    return schedule
  }

  async show({ params }: HttpContext) {
    const schedule = await VisitorTraining.query()
      .where('id', params.id)
      .preload('schedules')
      .preload('studentEnroll', (q) => q.preload('student'))
      .firstOrFail()
    return schedule
  }

  async store({ request }: HttpContext) {
    try {
      const { visitor_training_id, visit_no, visit_at, comment } = request.only([
        'visitor_training_id',
        'visit_no',
        'visit_at',
        'comment',
      ])
      const schedule = await VisitorSchedule.create({
        visitor_training_id: visitor_training_id,
        visit_no: visit_no,
        visit_at: visit_at,
        comment: comment,
      })
      return schedule
    } catch (error) {
      return error
    }
  }
  async update({ request, params: { id } }: HttpContext) {
    try {
      const { visitor_training_id, visit_no, visit_at, comment } = request.only([
        'visitor_training_id',
        'visit_no',
        'visit_at',
        'comment',
      ])
      const schedule = await VisitorSchedule.findOrFail(id)

      schedule.visitor_training_id = visitor_training_id
      schedule.visit_no = visit_no
      schedule.visit_at = visit_at
      schedule.comment = comment
      await schedule.save()
      return schedule
    } catch (error) {
      return error
    }
  }
  public async listStudentsWithLastVisit({ params }: HttpContext) {
    const visitorId = Number(params.id)

    const trainings = await VisitorTraining.query()
      .where('visitor_instructor_id', visitorId)
      .preload('studentEnroll', (q) => q.preload('student')) // -> student_enroll.student
      .preload('schedules', (q) => q.orderBy('visit_no', 'desc')) // latest first

    return trainings
  }
}
