import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import StudentEnroll from './student_enroll.js'
import Instructor from './instructor.js'

export default class StudentEnrollStatus extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare student_enroll_id: number

  @belongsTo(() => StudentEnroll, {
    foreignKey: 'student_enroll_id',
  })
  declare student_enroll: BelongsTo<typeof StudentEnroll>

  @column()
  declare instructor_id: number

  @belongsTo(() => Instructor, {
    foreignKey: 'instructor_id',
  })
  declare instructor: BelongsTo<typeof Instructor>

  @column()
  declare status: 'approve' | 'denied' | 'pending'

  @column()
  declare remarks: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
