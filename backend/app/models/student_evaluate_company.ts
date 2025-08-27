import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import StudentTraining from './student_training.js'

export default class StudentEvaluateCompany extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare score: number

  @column()
  declare questions: string

  @column()
  declare comment: string

  @column()
  declare student_training_id: number

  @belongsTo(() => StudentTraining, {
    foreignKey: 'student_training_id',
  })
  declare student_training: BelongsTo<typeof StudentTraining>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
