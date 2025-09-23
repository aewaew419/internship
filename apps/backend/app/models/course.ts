import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import CourseSection from './course_section.js'

export default class Course extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare course_code: string

  @column()
  declare course_name_en: string

  @column()
  declare course_name_th: string

  @column()
  declare course_information_en: string

  @column()
  declare course_information_th: string

  @hasMany(() => CourseSection, {
    foreignKey: 'course_id',
  })
  declare sections: HasMany<typeof CourseSection>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
