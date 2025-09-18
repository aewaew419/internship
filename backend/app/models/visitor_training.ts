import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import StudentEnroll from '#models/student_enroll'
import Instructor from '#models/instructor'
import VisitorSchedule from '#models/visitor_schedule'
import VisitorEvaluateCompany from './visitor_evaluate_company.js'
import VisitorEvaluateStudent from './visitor_evaluate_student.js'

export default class VisitorTraining extends BaseModel {
  public static table = 'visitor_trainings'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare student_enroll_id: number

  @column()
  declare visitor_instructor_id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // relations
  @belongsTo(() => StudentEnroll, {
    foreignKey: 'student_enroll_id',
  })
  declare studentEnroll: BelongsTo<typeof StudentEnroll>

  @belongsTo(() => Instructor, {
    foreignKey: 'visitor_instructor_id',
  })
  declare visitor: BelongsTo<typeof Instructor>

  @hasMany(() => VisitorSchedule, {
    foreignKey: 'visitor_training_id',
  })
  declare schedules: HasMany<typeof VisitorSchedule>

  @hasMany(() => VisitorEvaluateCompany, {
    foreignKey: 'student_training_id',
  })
  declare evaluateCompany: HasMany<typeof VisitorEvaluateCompany>

  @hasMany(() => VisitorEvaluateStudent, {
    foreignKey: 'visitor_training_id',
  })
  declare evaluateStudent: HasMany<typeof VisitorEvaluateStudent>
}
