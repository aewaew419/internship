import type { HttpContext } from '@adonisjs/core/http'
import Faculty from '#models/faculty'

export default class FacultiesController {
  async index({ request }: HttpContext) {
    try {
      const id = request.input('id')
      if (id) {
        return await Faculty.query()
          .where('id', id)
          .preload('campus')
          .preload('program')
          .firstOrFail()
      }
      return Faculty.query().preload('campus').preload('program')
    } catch (error) {
      return error
    }
  }

  async store({ request }: HttpContext) {
    try {
      const data = request.only(['faculty_name_en', 'faculty_name_th', 'campus_id'])
      await Faculty.create(data)
      return { message: 'Faculty created' }
    } catch (error) {
      return error
    }
  }

  async update({ request, params }: HttpContext) {
    try {
      const faculty = await Faculty.findOrFail(params.id)
      const data = request.only(['faculty_name_en', 'faculty_name_th', 'campus_id'])
      faculty.merge(data)
      await faculty.save()
      return { message: 'Faculty updated' }
    } catch (error) {
      return error
    }
  }

  async destroy({ params }: HttpContext) {
    try {
      const faculty = await Faculty.findOrFail(params.id)
      await faculty.delete()
      return { message: 'Faculty deleted' }
    } catch (error) {
      return error
    }
  }
}
