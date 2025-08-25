import { BaseSeeder } from '@adonisjs/lucid/seeders'
import CourseSection from '#models/course_section'

export default class extends BaseSeeder {
  async run() {
    const courseSections = [
      {
        course_id: 1,
        year: 2025,
        semester: 2,
      },
      {
        course_id: 2,
        year: 2025,
        semester: 2,
      },
      {
        course_id: 1,
        year: 2025,
        semester: 1,
      },
      {
        course_id: 2,
        year: 2025,
        semester: 1,
      },
      {
        course_id: 2,
        year: 2024,
        semester: 1,
      },
      {
        course_id: 1,
        year: 2024,
        semester: 2,
      },
    ]

    await CourseSection.createMany(courseSections)
    const course = await CourseSection.findOrFail(1)
    await course.related('course_instructors').attach([1])
    await course.related('course_committee').attach([2, 3, 4])
  }
}
