import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import VisitorTraining from '#models/visitor_training'
import VisitsPicture from '#models/visits_pictures'

export type VisitMode = 'onsite' | 'online'
export type VisitStatus = 'scheduled' | 'completed' | 'skipped' | 'cancelled'

export default class VisitorSchedule extends BaseModel {
  public static table = 'visitor_schedules'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare visitor_training_id: number

  // 1..4
  @column()
  declare visit_no: number

  @column.dateTime()
  declare visit_at?: DateTime | null

  @column()
  declare comment?: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // relations
  @belongsTo(() => VisitorTraining, {
    foreignKey: 'visitor_training_id',
  })
  @column()
  declare training: BelongsTo<typeof VisitorTraining>

  @hasMany(() => VisitsPicture, {
    foreignKey: 'visitorScheduleId',
  })
  @column()
  declare photos: HasMany<typeof VisitsPicture>
}
