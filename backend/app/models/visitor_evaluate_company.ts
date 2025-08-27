import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import VisitorTraining from './visitor_training.js'

export default class VisitorEvaluateCompany extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare score: number

  @column()
  declare questions: string

  @column()
  declare comment: string

  @column()
  declare visitor_training_id: number

  @belongsTo(() => VisitorTraining, {
    foreignKey: 'visitor_training_id',
  })
  declare training: BelongsTo<typeof VisitorTraining>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
