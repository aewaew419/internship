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
    // 👈 use instructor_id (singular) to match the pivot column
    const { instructor_id, course_section_id } = request.only([
      'instructor_id',
      'course_section_id',
    ])

    const instructor = await Instructor.findOrFail(instructor_id)
    const courseSection = await CourseSection.findOrFail(course_section_id)

    // Check if already attached (pivot column is instructor_id)
    const exists = await courseSection
      .related('course_committee')
      .query()
      .wherePivot('instructor_id', instructor.id)
      .first()

    if (exists) {
      return { message: 'Instructor already in course committee' }
    }

    // Attach by related model id
    await courseSection.related('course_committee').attach([instructor.id])

    return { message: 'Instructor added to course committee' }
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
