import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import Student from './student.js'
import CourseSection from './course_section.js'
import StudentEnrollStatus from './student_enroll_status.js'
import StudentTraining from './student_training.js'
import VisitorTraining from './visitor_training.js'

export default class StudentEnroll extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare student_id: number

  @column()
  declare course_section_id: number

  @column()
  declare grade: number

  @belongsTo(() => Student, {
    foreignKey: 'student_id',
  })
  declare student: BelongsTo<typeof Student>

  @belongsTo(() => CourseSection, {
    foreignKey: 'course_section_id',
  })
  declare course_section: BelongsTo<typeof CourseSection>

  @hasMany(() => StudentEnrollStatus, {
    foreignKey: 'student_enroll_id',
  })
  declare student_enroll_status: HasMany<typeof StudentEnrollStatus>

  @hasOne(() => StudentTraining, {
    foreignKey: 'student_enroll_id',
  })
  declare student_training: HasOne<typeof StudentTraining>

  @hasMany(() => VisitorTraining, {
    foreignKey: 'student_enroll_id',
  })
  declare visitor_training: HasMany<typeof VisitorTraining>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
