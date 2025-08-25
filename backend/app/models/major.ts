import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Curriculum from './curriculum.js'

export default class Major extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare major_name_en: string

  @column()
  declare major_name_th: string

  @column()
  declare curriculum_id: number

  @belongsTo(() => Curriculum, {
    foreignKey: 'curriculum_id',
  })
  declare curriculum: BelongsTo<typeof Curriculum>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
