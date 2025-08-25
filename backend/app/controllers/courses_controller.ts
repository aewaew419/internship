import type { HttpContext } from '@adonisjs/core/http'
import Course from '#models/course'

export default class CoursesController {
  async index({ request }: HttpContext) {
    try {
      const id = request.input('id')
      if (id) {
        return Course.findOrFail(id)
      }
      return Course.query()
    } catch (error) {
      return error
    }
  }

  async store({ request }: HttpContext) {
    try {
      const data = request.only([
        'course_name_en',
        'course_name_th',
        'course_code',
        'course_information_en',
        'course_information_th',
      ])
      await Course.create(data)
      return { message: 'Course created' }
    } catch (error) {
      return error
    }
  }

  async update({ request, params }: HttpContext) {
    try {
      const course = await Course.findOrFail(params.id)
      const data = request.only([
        'course_name_en',
        'course_name_th',
        'course_code',
        'course_information_en',
        'course_information_th',
      ])
      course.merge(data)
      await course.save()
      return { message: 'Course updated' }
    } catch (error) {
      return error
    }
  }
  async destroy({ params }: HttpContext) {
    try {
      const course = await Course.findOrFail(params.id)
      await course.delete()
      return { message: 'Course deleted' }
    } catch (error) {
      return error
    }
  }
}
