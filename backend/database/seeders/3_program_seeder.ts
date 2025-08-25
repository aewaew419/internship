import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Program from '#models/program'

export default class ProgramSeeder extends BaseSeeder {
  async run() {
    const programs = [
      {
        program_name_en: ' Business Accounting',
        program_name_th: 'บัญชี',
        faculty_id: 1,
      },
      {
        program_name_en: 'Business Management',
        program_name_th: 'บริหาร',
        faculty_id: 1,
      },
      {
        program_name_en: 'Liberal arts',
        program_name_th: 'ศิลปศาสตร์',
        faculty_id: 1,
      },
    ]

    await Program.createMany(programs)
  }
}
