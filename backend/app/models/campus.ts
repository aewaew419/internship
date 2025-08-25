import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Faculty from './faculty.js'

export default class Campus extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare campus_name_en: string

  @column()
  declare campus_name_th: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Faculty, {
    foreignKey: 'campus_id',
  })
  declare faculties: HasMany<typeof Faculty>
}
