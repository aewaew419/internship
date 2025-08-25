import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Faculty from '#models/faculty'

export default class FacultySeeder extends BaseSeeder {
  async run() {
    const faculties = [
      {
        faculty_name_en: 'Faculty of Business',
        faculty_name_th: 'บริหารธุรกิจและศิลปศาสตร์',
        campus_id: 1,
      },
    ]

    await Faculty.createMany(faculties)
  }
}
