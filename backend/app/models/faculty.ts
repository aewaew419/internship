import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import Program from './program.js'
import Campus from './campus.js'

export default class Faculty extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare faculty_name_en: string

  @column()
  declare faculty_name_th: string

  @column()
  declare campus_id: number

  @belongsTo(() => Campus, {
    foreignKey: 'campus_id',
  })
  declare campus: BelongsTo<typeof Campus>

  @hasMany(() => Program, {
    foreignKey: 'faculty_id',
  })
  declare program: HasMany<typeof Program>
}
