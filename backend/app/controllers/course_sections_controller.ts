import type { HttpContext } from '@adonisjs/core/http'
import CourseSection from '#models/course_section'

export default class CourseSectionsController {
  public async index({ request }: HttpContext) {
    try {
      const id = request.input('id')
      if (id) {
        return CourseSection.findOrFail(id)
      }
      return CourseSection.query()
        .preload('course')
        .preload('course_instructors')
        .preload('course_committee')
    } catch (error) {
      return error
    }
  }
  public async courseYearSemester({ request }: HttpContext) {
    try {
      const year = request.input('year')
      const semester = request.input('semester')
      if (year && semester) {
        return CourseSection.query()
          .where('year', year)
          .where('semester', semester)
          .preload('course')
          .orderBy('year', 'desc')
      }

      if (year) {
        return CourseSection.query()
          .where('year', year)
          .distinct('semester')
          .select('semester')
          .orderBy('year', 'desc')
      }
      return CourseSection.query().distinct('year').select('year').orderBy('year', 'desc')
    } catch (error) {
      return error
    }
  }

  public async store({ request }: HttpContext) {
    try {
      const data = request.only(['course_id', 'year', 'semester'])
      await CourseSection.create({ ...data, section: '1' })
      return { message: 'Course section created' }
    } catch (error) {
      return error
    }
  }

  public async update({ request, params }: HttpContext) {
    try {
      const courseSection = await CourseSection.findOrFail(params.id)
      const data = request.only(['course_id', 'year', 'semester'])
      courseSection.merge(data)
      await courseSection.save()
      return { message: 'Course section updated' }
    } catch (error) {
      return error
    }
  }

  public async destroy({ params }: HttpContext) {
    try {
      const courseSection = await CourseSection.findOrFail(params.id)
      await courseSection.delete()
      return { message: 'Course section deleted' }
    } catch (error) {
      return error
    }
  }
}
