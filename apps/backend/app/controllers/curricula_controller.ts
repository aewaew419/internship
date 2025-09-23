import type { HttpContext } from '@adonisjs/core/http'
import Curriculum from '#models/curriculum'
export default class CurriculaController {
  public async index({ request }: HttpContext) {
    try {
      const id = request.input('id')
      if (id) {
        return Curriculum.query().where('id', id).preload('program').preload('majors').firstOrFail()
      }
      return Curriculum.query().preload('program').preload('majors')
    } catch (error) {
      return error
    }
  }

  public async store({ request }: HttpContext) {
    try {
      const data = request.only(['curriculum_name_en', 'curriculum_name_th', 'program_id'])
      await Curriculum.create(data)
      return { message: 'Curriculum created' }
    } catch (error) {
      return error
    }
  }

  public async update({ request, params }: HttpContext) {
    try {
      const curriculum = await Curriculum.findOrFail(params.id)
      const data = request.only(['curriculum_name_en', 'curriculum_name_th', 'program_id'])
      curriculum.merge(data)
      await curriculum.save()
      return { message: 'Curriculum updated' }
    } catch (error) {
      return error
    }
  }

  public async destroy({ params }: HttpContext) {
    try {
      const curriculum = await Curriculum.findOrFail(params.id)
      await curriculum.delete()
      return { message: 'Curriculum deleted' }
    } catch (error) {
      return error
    }
  }
}
