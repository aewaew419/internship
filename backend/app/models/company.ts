import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

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

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
