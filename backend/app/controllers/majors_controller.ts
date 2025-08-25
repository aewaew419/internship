import type { HttpContext } from '@adonisjs/core/http'
import Major from '#models/major'

export default class MajorsController {
  async index({ request }: HttpContext) {
    try {
      const id = request.input('id')
      if (id) {
        return Major.findOrFail(id)
      }
      return Major.query().preload('curriculum')
    } catch (error) {
      return error
    }
  }

  async store({ request }: HttpContext) {
    try {
      const data = request.only(['major_name_en', 'major_name_th', 'curriculum_id'])
      await Major.create(data)
      return { message: 'Major created' }
    } catch (error) {
      return error
    }
  }

  async update({ request, params }: HttpContext) {
    try {
      const major = await Major.findOrFail(params.id)
      const data = request.only(['major_name_en', 'major_name_th', 'curriculum_id'])
      major.merge(data)
      await major.save()
      return { message: 'Major updated' }
    } catch (error) {
      return error
    }
  }

  async destroy({ params }: HttpContext) {
    try {
      const major = await Major.findOrFail(params.id)
      await major.delete()
      return { message: 'Major deleted' }
    } catch (error) {
      return error
    }
  }
}
