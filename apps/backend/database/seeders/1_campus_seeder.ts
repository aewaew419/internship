import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Campus from '#models/campus'

export default class CampusSeeder extends BaseSeeder {
  async run() {
    const campuses = [
      { campus_name_en: 'Chiang Mai Campus', campus_name_th: 'เชียงใหม่' },
      { campus_name_en: 'Chiang Rai Campus', campus_name_th: 'เชียงราย' },
      { campus_name_en: 'Nan Campus', campus_name_th: 'น่าน' },
      { campus_name_en: 'Tak Campus', campus_name_th: 'ตาก' },
      { campus_name_en: 'Phitsanulok Campus', campus_name_th: 'พิษณุโลก' },
      { campus_name_en: 'Lampang Campus', campus_name_th: 'ลำปาง' },
    ]

    await Campus.createMany(campuses)
  }
}
