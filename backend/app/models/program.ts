import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Faculty from './faculty.js'
import Curriculum from './curriculum.js'

export default class Program extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare program_name_en: string

  @column()
  declare program_name_th: string

  @column()
  declare faculty_id: number
  @belongsTo(() => Faculty, {
    foreignKey: 'faculty_id',
  })
  declare faculty: BelongsTo<typeof Faculty>

  @hasMany(() => Curriculum, {
    foreignKey: 'program_id',
  })
  declare curriculum: HasMany<typeof Curriculum>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
