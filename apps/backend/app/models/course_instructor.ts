import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Instructor from './instructor.js'
import CourseSection from './course_section.js'

export default class CourseInstructor extends BaseModel {
  public static table = 'course_instructors'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare course_section_id: number

  @column()
  declare instructor_id: number

  @belongsTo(() => CourseSection, {
    foreignKey: 'course_section_id',
  })
  declare course_section: BelongsTo<typeof CourseSection>

  @belongsTo(() => Instructor, {
    foreignKey: 'instructor_id',
  })
  declare instructor: BelongsTo<typeof Instructor>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
