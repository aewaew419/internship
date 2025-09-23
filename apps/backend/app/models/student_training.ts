import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import StudentEnroll from './student_enroll.js'
import Company from './company.js'
import StudentEvaluateCompany from './student_evaluate_company.js'

export default class StudentTraining extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare student_enroll_id: number

  @column()
  declare start_date: DateTime

  @column()
  declare end_date: DateTime

  @column()
  declare coordinator: string

  @column()
  declare coordinator_phone_number: string

  @column()
  declare coordinator_email: string

  @column()
  declare supervisor: string

  @column()
  declare supervisor_phone_number: string

  @column()
  declare supervisor_email: string

  @column()
  declare department: string

  @column()
  declare position: string

  @column()
  declare job_description: string

  @column()
  declare document_language: 'th' | 'en'

  @column()
  declare company_id: number
  @belongsTo(() => Company, {
    foreignKey: 'company_id',
  })
  declare company: BelongsTo<typeof Company>

  @belongsTo(() => StudentEnroll, {
    foreignKey: 'student_enroll_id',
  })
  declare student_enroll: BelongsTo<typeof StudentEnroll>

  @hasMany(() => StudentEvaluateCompany, {
    foreignKey: 'student_training_id',
  })
  declare student_evaluate_company: HasMany<typeof StudentEvaluateCompany>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
