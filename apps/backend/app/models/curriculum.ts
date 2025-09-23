import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'

import Program from './program.js'
import Major from './major.js'

export default class Curriculum extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare curriculum_name_en: string

  @column()
  declare curriculum_name_th: string

  @column()
  declare program_id: number

  @belongsTo(() => Program, {
    foreignKey: 'program_id',
  })
  declare program: BelongsTo<typeof Program>

  @hasMany(() => Major, {
    foreignKey: 'curriculum_id',
  })
  declare majors: HasMany<typeof Major>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
