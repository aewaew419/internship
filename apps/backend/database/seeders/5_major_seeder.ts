import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Major from '#models/major'
export default class MajorSeeder extends BaseSeeder {
  async run() {
    const majors = [
      {
        major_name_en: 'Business Accounting',
        major_name_th: 'การจัดการธุรกิจ',
        curriculum_id: 4,
      },
      {
        major_name_en: 'Digital Marketing and Marketing',
        major_name_th: 'การตลาดและการตลาดดิจิทัล',
        curriculum_id: 4,
      },
      {
        major_name_en: 'Business English',
        major_name_th: 'ภาษาอังกฤษธุรกิจ',
        curriculum_id: 4,
      },
      {
        major_name_en: 'Business Trade and Services',
        major_name_th: 'ธุรกิจการค้าและบริการ',
        curriculum_id: 4,
      },
    ]
    await Major.createMany(majors)
  }
}
