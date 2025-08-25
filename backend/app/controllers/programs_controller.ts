import type { HttpContext } from '@adonisjs/core/http'
import Program from '#models/program'

export default class ProgramsController {
  async index({ request }: HttpContext) {
    try {
      const id = request.input('id')
      if (id) {
        return Program.query()
          .where('id', id)
          .preload('faculty')
          .preload('curriculum')
          .firstOrFail()
      }
      return Program.query().preload('faculty').preload('curriculum')
    } catch (error) {
      return error
    }
  }

  async store({ request }: HttpContext) {
    try {
      const data = request.only(['program_name_en', 'program_name_th', 'faculty_id'])
      await Program.create(data)
      return { message: 'Program created' }
    } catch (error) {
      return error
    }
  }

  async update({ request, params }: HttpContext) {
    try {
      const program = await Program.findOrFail(params.id)
      const data = request.only(['program_name_en', 'program_name_th', 'faculty_id'])
      program.merge(data)
      await program.save()
      return { message: 'Program updated' }
    } catch (error) {
      return error
    }
  }

  async destroy({ params }: HttpContext) {
    try {
      const program = await Program.findOrFail(params.id)
      await program.delete()
      return { message: 'Program deleted' }
    } catch (error) {
      return error
    }
  }
}
