import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Curriculum from '#models/curriculum'

export default class CurriculumSeeder extends BaseSeeder {
  async run() {
    const curriculums = [
      {
        curriculum_name_en: 'Bachelor of Business Administration in Accounting',
        curriculum_name_th: 'บช.บ.การบัญชี',
        program_id: 1,
      },
      {
        curriculum_name_en: 'Bachelor of Business Administration in Business Management',
        curriculum_name_th: 'บธ.บ.การจัดการธุรกิจระหว่างประเทศ(นานาชาติ)',
        program_id: 2,
      },
      {
        curriculum_name_en: 'Bachelor of Business Administration in Business Information Systems',
        curriculum_name_th: 'บธ.บ.ระบบสารสนเทศทางธุรกิจ',
        program_id: 2,
      },
      {
        curriculum_name_en: 'Bachelor of Business Administration in Business Administration',
        curriculum_name_th: 'บธ.บ.บริหารธุรกิจ',
        program_id: 2,
      },
      {
        curriculum_name_en: 'Bachelor of Arts in Tourism and Hospitality Management',
        curriculum_name_th: 'ศศ.บ.การท่องเที่ยวและการบริการ',
        program_id: 3,
      },
      {
        curriculum_name_en: 'Bachelor of Arts in English for International Communication',
        curriculum_name_th: 'ศศ.บ.ภาษาอังกฤษเพื่อการสื่อสารสากล',
        program_id: 3,
      },
    ]

    await Curriculum.createMany(curriculums)
  }
}
