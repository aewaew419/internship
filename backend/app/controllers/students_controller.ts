import type { HttpContext } from '@adonisjs/core/http'
import Student from '#models/student'

export default class StudentsController {
  async index({ request }: HttpContext) {
    try {
      const id = request.input('id')
      if (id) {
        return Student.findOrFail(id)
      }
      return Student.query().preload('curriculum').preload('major')
    } catch (error) {
      return error
    }
  }

  async store({ request }: HttpContext) {
    try {
      const data = request.only([
        'user_id',
        'student_id',
        'name',
        'middle_name',
        'surname',
        'gpax',
        'phone_number',
        'email',
        'picture',
        'major_id',
        'program_id',
      ])
      await Student.create(data)
      return { message: 'Student created' }
    } catch (error) {
      return error
    }
  }

  async update({ request, params }: HttpContext) {
    try {
      const student = await Student.findOrFail(params.id)
      const data = request.only([
        'user_id',
        'student_id',
        'name',
        'middle_name',
        'surname',
        'gpax',
        'phone_number',
        'email',
        'picture',
        'program_id',
        'faculty_id',
        'campus_id',
        'curriculum_id',
      ])
      const major = request.only(['major_id'])
      if (major.major_id) {
        student.merge({ ...data, major_id: major.major_id })
      } else {
        student.merge(data)
      }

      await student.save()
      return { message: 'Student updated', data }
    } catch (error) {
      return error
    }
  }

  async destroy({ params }: HttpContext) {
    try {
      const student = await Student.findOrFail(params.id)
      await student.delete()
      return { message: 'Student deleted' }
    } catch (error) {
      return error
    }
  }
}
