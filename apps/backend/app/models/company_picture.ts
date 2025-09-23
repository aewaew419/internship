import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Company from './company.js'

export default class CompanyPicture extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare picture: string | null

  @column()
  declare company_id: number
  @belongsTo(() => Company, {
    foreignKey: 'company_id',
  })
  declare company: BelongsTo<typeof Company>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
