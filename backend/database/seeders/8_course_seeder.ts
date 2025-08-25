import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Course from '#models/course'

export default class extends BaseSeeder {
  async run() {
    const courses = [
      {
        course_name_en: 'Cooperative Education',
        course_name_th: 'สหกิจศึกษา',
        course_code: '1',
        course_information_en: '',
        course_information_th: '',
      },
      {
        course_name_en: 'Internship',
        course_name_th: 'ฝึกงาน',
        course_code: '2',
        course_information_en: '',
        course_information_th: '',
      },
    ]

    await Course.createMany(courses)
  }
}
