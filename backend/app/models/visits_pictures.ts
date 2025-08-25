import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import VisitorSchedule from '#models/visitor_schedule'
import Instructor from '#models/instructor'

export default class VisitsPicture extends BaseModel {
  public static table = 'visitor_schedule_photos'

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
  declare schedule: BelongsTo<typeof VisitorSchedule>

  @belongsTo(() => Instructor, {
    foreignKey: 'uploadedByInstructorId',
  })
  declare uploadedBy: BelongsTo<typeof Instructor>
}
