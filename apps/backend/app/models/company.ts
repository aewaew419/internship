import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import CompanyPicture from './company_picture.js'

export default class Company extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare company_register_number: string

  @column()
  declare company_name_en: string

  @column()
  declare company_name_th: string

  @column()
  declare company_address: string

  @column()
  declare company_map: string

  @column()
  declare company_email: string

  @column()
  declare company_phone_number: string

  @column()
  declare company_type: string

  @hasMany(() => CompanyPicture, {
    foreignKey: 'company_id',
  })
  declare company_picture: HasMany<typeof CompanyPicture>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
