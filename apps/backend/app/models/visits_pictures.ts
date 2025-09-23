import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import VisitorSchedule from '#models/visitor_schedule'

export default class VisitsPicture extends BaseModel {
  public static table = 'visits_pictures'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare visitorScheduleId: number

  @column()
  declare photoNo: number

  @column()
  declare fileUrl: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // relations
  @belongsTo(() => VisitorSchedule, {
    foreignKey: 'visitorScheduleId',
  })
  @column()
  declare schedule: BelongsTo<typeof VisitorSchedule>
}
