import type { HttpContext } from '@adonisjs/core/http'
import Instructor from '#models/instructor'

export default class InstructorsController {
  async index({}: HttpContext) {
    return Instructor.all()
  }
}
