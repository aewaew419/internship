import type { HttpContext } from '@adonisjs/core/http'
import Campus from '#models/campus'
export default class CampusesController {
  async index({ request }: HttpContext) {
    try {
      const id = request.input('id')
      if (id) {
        return Campus.findOrFail(id)
      }
      return Campus.query().preload('faculties')
    } catch (error) {
      return error
    }
  }

  async store({ request }: HttpContext) {
    try {
      const data = request.only(['campus_name_en', 'campus_name_th'])
      await Campus.create(data)
      return { message: 'Campus created' }
    } catch (error) {
      return error
    }
  }

  async update({ request, params, response }: HttpContext) {
    try {
      const campus = await Campus.findOrFail(params.id)
      const data = request.only(['campus_name_en', 'campus_name_th'])
      campus.merge(data)
      await campus.save()
      return response.ok({ message: 'Campus updated', campus })
    } catch (error) {
      return response.status(404).send({ message: 'Campus not found', error: error.message })
    }
  }

  async destroy({ params }: HttpContext) {
    const campus = await Campus.findOrFail(params.id)
    await campus.delete()
    return { message: 'Campus deleted' }
  }
}
