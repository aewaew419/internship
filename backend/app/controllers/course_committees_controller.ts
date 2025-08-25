import type { HttpContext } from '@adonisjs/core/http'
import CourseSection from '#models/course_section'
import Instructor from '#models/instructor'

export default class CourseCommitteesController {
  async index({ request }: HttpContext) {
    try {
      const id = request.input('id')
      if (id) {
        return CourseSection.findOrFail(id)
      }
      return CourseSection.query().preload('course').preload('course_committee')
    } catch (error) {
      return error
    }
  }

  async store({ request }: HttpContext) {
    try {
      const data = request.only(['instructors_id', 'course_section_id'])
      const instructor = await Instructor.findOrFail(data.instructors_id)
      const courseSection = await CourseSection.findOrFail(data.course_section_id)

      if (!instructor || !courseSection) {
        return { message: 'Instructor or course section not found' }
      }

      const exists = await courseSection
        .related('course_committee')
        .query()
        .wherePivot('instructors_id', data.instructors_id)
        .first()
      if (exists) {
        return { message: 'Instructor already in course committee' }
      }

      await courseSection.related('course_committee').attach([data.instructors_id])

      return { message: 'Instructor added to course committee' }
    } catch (error) {
      return error
    }
  }

  async destroy({ params }: HttpContext) {
    try {
      const courseSection = await CourseSection.findOrFail(params.course_id)
      const instructor = await Instructor.findOrFail(params.instructor_id)
      const instructorId = instructor.id

      if (!courseSection || !instructor) {
        return { message: 'Course section or instructor not found' }
      }

      await courseSection.related('course_committee').detach([instructorId])

      return { message: 'Instructor removed from course committee' }
    } catch (error) {
      return error
    }
  }
}
